"use strict";

const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { DatabaseSync } = require("node:sqlite");
const {
  ROOT_DIR,
  ALLOWED_PLANETS,
  ALLOWED_STATUSES
} = require("./config");
const {
  hashPassword,
  verifyPassword,
  sha256Hex,
  generateToken,
  sanitizePlainText
} = require("./security");

function initDatabase({
  dbPath = path.join(ROOT_DIR, "data", "shop.db"),
  uploadsDir = path.join(ROOT_DIR, "uploads"),
  adminUser = process.env.ADMIN_USER || "thanhdung",
  adminPass = process.env.ADMIN_PASS || ""
} = {}) {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  fs.mkdirSync(uploadsDir, { recursive: true });

  const db = new DatabaseSync(dbPath);
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    PRAGMA busy_timeout = 5000;

    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      token_hash TEXT UNIQUE NOT NULL,
      admin_id INTEGER NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
      csrf_token TEXT NOT NULL,
      user_agent TEXT NOT NULL DEFAULT '',
      expires_at INTEGER NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);

    CREATE TABLE IF NOT EXISTS accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      price_vnd INTEGER NOT NULL CHECK (price_vnd >= 0),
      server_name TEXT NOT NULL,
      planet TEXT NOT NULL,
      note TEXT NOT NULL,
      image_path TEXT NOT NULL,
      image_width INTEGER NOT NULL,
      image_height INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'available',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_accounts_filter ON accounts(status, server_name, planet, created_at);

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_type TEXT NOT NULL,
      actor TEXT NOT NULL,
      detail TEXT NOT NULL,
      ip TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS csp_reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      blocked_uri TEXT NOT NULL,
      violated_directive TEXT NOT NULL,
      document_uri TEXT NOT NULL,
      script_sample TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);

  // Bootstrap / sync admin account
  let bootstrapGeneratedPassword = null;
  const normalizedAdminUser = sanitizePlainText(adminUser, 40) || "thanhdung";
  const adminCountRow = db.prepare("SELECT COUNT(*) AS cnt FROM admins").get();

  if (adminCountRow.cnt === 0) {
    let initialPass = typeof adminPass === "string" ? adminPass.trim() : "";
    if (!initialPass) {
      initialPass = crypto.randomBytes(12).toString("base64url");
      bootstrapGeneratedPassword = initialPass;
    }
    db.prepare(
      "INSERT INTO admins (username, password_hash, created_at) VALUES (?, ?, ?)"
    ).run(normalizedAdminUser, hashPassword(initialPass), new Date().toISOString());
  } else if (typeof adminPass === "string" && adminPass.trim().length >= 8) {
    // Allow explicit .env credential update for deploy management
    const existingAdmin = db.prepare("SELECT id, password_hash FROM admins WHERE username = ?").get(normalizedAdminUser);
    if (existingAdmin && !verifyPassword(adminPass.trim(), existingAdmin.password_hash)) {
      db.prepare("UPDATE admins SET password_hash = ? WHERE id = ?").run(
        hashPassword(adminPass.trim()),
        existingAdmin.id
      );
    } else if (!existingAdmin) {
      db.prepare(
        "INSERT INTO admins (username, password_hash, created_at) VALUES (?, ?, ?)"
      ).run(normalizedAdminUser, hashPassword(adminPass.trim()), new Date().toISOString());
    }
  }

  function recordAudit(eventType, actor, detail, ip = "system") {
    db.prepare(
      "INSERT INTO audit_logs (event_type, actor, detail, ip, created_at) VALUES (?, ?, ?, ?, ?)"
    ).run(
      sanitizePlainText(eventType, 48),
      sanitizePlainText(actor, 48),
      sanitizePlainText(detail, 300),
      sanitizePlainText(ip, 64),
      new Date().toISOString()
    );
  }

  function recordCspReport({ blockedUri, violatedDirective, documentUri, scriptSample }) {
    db.prepare(
      "INSERT INTO csp_reports (blocked_uri, violated_directive, document_uri, script_sample, created_at) VALUES (?, ?, ?, ?, ?)"
    ).run(
      sanitizePlainText(blockedUri, 200),
      sanitizePlainText(violatedDirective, 80),
      sanitizePlainText(documentUri, 200),
      sanitizePlainText(scriptSample, 80),
      new Date().toISOString()
    );
  }

  function verifyAdminLogin(username, password) {
    const cleanUser = sanitizePlainText(username, 40);
    if (!cleanUser || typeof password !== "string" || password.length === 0 || password.length > 128) {
      return null;
    }
    const admin = db.prepare("SELECT id, username, password_hash FROM admins WHERE username = ?").get(cleanUser);
    if (!admin) return null;
    if (!verifyPassword(password, admin.password_hash)) return null;
    return { id: admin.id, username: admin.username };
  }

  function createSession(adminId, userAgent = "", ttlMs = 8 * 60 * 60 * 1000) {
    const rawToken = generateToken(32);
    const tokenHash = sha256Hex(rawToken);
    const csrfToken = generateToken(24);
    const now = Date.now();
    const expiresAt = now + ttlMs;

    // Clean expired sessions opportunistically
    db.prepare("DELETE FROM sessions WHERE expires_at <= ?").run(now);
    db.prepare(
      "INSERT INTO sessions (token_hash, admin_id, csrf_token, user_agent, expires_at, created_at) VALUES (?, ?, ?, ?, ?, ?)"
    ).run(
      tokenHash,
      adminId,
      csrfToken,
      sanitizePlainText(userAgent, 160),
      expiresAt,
      new Date(now).toISOString()
    );

    return { rawToken, csrfToken, expiresAt };
  }

  function getSessionByToken(rawToken) {
    if (!rawToken || typeof rawToken !== "string" || rawToken.length < 20) {
      return null;
    }
    const tokenHash = sha256Hex(rawToken);
    const now = Date.now();
    const row = db.prepare(
      `SELECT s.id, s.admin_id, s.csrf_token, s.expires_at, a.username
       FROM sessions s
       JOIN admins a ON a.id = s.admin_id
       WHERE s.token_hash = ? AND s.expires_at > ?`
    ).get(tokenHash, now);

    if (!row) return null;
    return {
      sessionId: row.id,
      adminId: row.admin_id,
      username: row.username,
      csrfToken: row.csrf_token,
      expiresAt: row.expires_at
    };
  }

  function deleteSessionByToken(rawToken) {
    if (!rawToken || typeof rawToken !== "string") return;
    db.prepare("DELETE FROM sessions WHERE token_hash = ?").run(sha256Hex(rawToken));
  }

  function generateNextAccCode() {
    const row = db.prepare("SELECT COALESCE(MAX(id), 0) AS maxId FROM accounts").get();
    const nextNum = Number(row.maxId || 0) + 1;
    const randSuffix = crypto.randomBytes(2).toString("hex").toUpperCase();
    return `TD-${String(nextNum).padStart(3, "0")}-${randSuffix}`;
  }

  function listAccounts({ server = "", planet = "", status = "", q = "", limit = 100 } = {}) {
    const conditions = [];
    const params = [];

    if (server && server !== "all") {
      conditions.push("server_name = ?");
      params.push(sanitizePlainText(server, 30));
    }
    if (planet && planet !== "all" && ALLOWED_PLANETS.includes(planet)) {
      conditions.push("planet = ?");
      params.push(planet);
    }
    if (status && status !== "all" && ALLOWED_STATUSES.includes(status)) {
      conditions.push("status = ?");
      params.push(status);
    }
    if (q) {
      const cleanQ = `%${sanitizePlainText(q, 60)}%`;
      conditions.push("(code LIKE ? OR title LIKE ? OR server_name LIKE ? OR planet LIKE ? OR note LIKE ?)");
      params.push(cleanQ, cleanQ, cleanQ, cleanQ, cleanQ);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const safeLimit = Math.max(1, Math.min(200, Number(limit) || 100));
    const sql = `
      SELECT id, code, title, price_vnd, server_name, planet, note, image_path, image_width, image_height, status, created_at, updated_at
      FROM accounts
      ${whereClause}
      ORDER BY CASE WHEN status = 'available' THEN 0 ELSE 1 END, id DESC
      LIMIT ?
    `;
    return db.prepare(sql).all(...params, safeLimit);
  }

  function getAccountById(id) {
    const numId = Number(id);
    if (!Number.isInteger(numId) || numId <= 0) return null;
    return db
      .prepare(
        "SELECT id, code, title, price_vnd, server_name, planet, note, image_path, image_width, image_height, status, created_at, updated_at FROM accounts WHERE id = ?"
      )
      .get(numId) || null;
  }

  function createAccount({ title, priceVnd, serverName, planet, note, imagePath, imageWidth, imageHeight }) {
    const code = generateNextAccCode();
    const now = new Date().toISOString();
    const stmt = db.prepare(`
      INSERT INTO accounts (code, title, price_vnd, server_name, planet, note, image_path, image_width, image_height, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'available', ?, ?)
    `);
    const info = stmt.run(
      code,
      title,
      priceVnd,
      serverName,
      planet,
      note,
      imagePath,
      imageWidth,
      imageHeight,
      now,
      now
    );
    return getAccountById(Number(info.lastInsertRowid));
  }

  function updateAccount(id, { title, priceVnd, serverName, planet, note, status }) {
    const existing = getAccountById(id);
    if (!existing) return null;

    const nextTitle = title !== undefined ? title : existing.title;
    const nextPrice = priceVnd !== undefined ? priceVnd : existing.price_vnd;
    const nextServer = serverName !== undefined ? serverName : existing.server_name;
    const nextPlanet = planet !== undefined ? planet : existing.planet;
    const nextNote = note !== undefined ? note : existing.note;
    const nextStatus = status !== undefined ? status : existing.status;

    db.prepare(`
      UPDATE accounts
      SET title = ?, price_vnd = ?, server_name = ?, planet = ?, note = ?, status = ?, updated_at = ?
      WHERE id = ?
    `).run(
      nextTitle,
      nextPrice,
      nextServer,
      nextPlanet,
      nextNote,
      nextStatus,
      new Date().toISOString(),
      existing.id
    );
    return getAccountById(existing.id);
  }

  function deleteAccount(id) {
    const existing = getAccountById(id);
    if (!existing) return null;
    db.prepare("DELETE FROM accounts WHERE id = ?").run(existing.id);
    return existing;
  }

  function getRecentAuditLogs(limit = 30) {
    const safeLimit = Math.max(1, Math.min(100, Number(limit) || 30));
    return db
      .prepare("SELECT id, event_type, actor, detail, ip, created_at FROM audit_logs ORDER BY id DESC LIMIT ?")
      .all(safeLimit);
  }

  function getRecentCspReports(limit = 20) {
    const safeLimit = Math.max(1, Math.min(100, Number(limit) || 20));
    return db
      .prepare("SELECT id, blocked_uri, violated_directive, document_uri, script_sample, created_at FROM csp_reports ORDER BY id DESC LIMIT ?")
      .all(safeLimit);
  }

  function close() {
    db.close();
  }

  return {
    db,
    bootstrapCredentials: bootstrapGeneratedPassword
      ? { username: normalizedAdminUser, password: bootstrapGeneratedPassword }
      : null,
    recordAudit,
    recordCspReport,
    verifyAdminLogin,
    createSession,
    getSessionByToken,
    deleteSessionByToken,
    listAccounts,
    getAccountById,
    createAccount,
    updateAccount,
    deleteAccount,
    getRecentAuditLogs,
    getRecentCspReports,
    close
  };
}

module.exports = {
  initDatabase
};

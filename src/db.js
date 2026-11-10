"use strict";

const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { DatabaseSync } = require("node:sqlite");
const {
  ROOT_DIR,
  ALLOWED_PLANETS,
  ALLOWED_STATUSES,
  ALLOWED_ITEM_CATEGORIES,
  ALLOWED_ITEM_TAG_CLASSES,
  ITEM_PRICE_ROWS,
  KICH_DIEM_SERVICES,
  STARTER_ACCS,
  formatItemUnitPriceLabel,
  formatServicePriceText
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

    CREATE TABLE IF NOT EXISTS shop_meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS shop_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      item_key TEXT UNIQUE NOT NULL,
      category TEXT NOT NULL,
      group_label TEXT NOT NULL DEFAULT 'Item',
      name TEXT NOT NULL,
      order_name TEXT NOT NULL,
      description TEXT NOT NULL,
      keywords TEXT NOT NULL DEFAULT '',
      kind TEXT NOT NULL DEFAULT 'fixed',
      price_vnd INTEGER NOT NULL CHECK (price_vnd >= 0),
      rate_per_k INTEGER NOT NULL DEFAULT 0,
      unit TEXT NOT NULL,
      unit_price_label TEXT NOT NULL,
      default_qty INTEGER NOT NULL DEFAULT 1,
      step INTEGER NOT NULL DEFAULT 1,
      max_qty INTEGER NOT NULL DEFAULT 9999,
      tag TEXT NOT NULL DEFAULT '',
      tag_class TEXT NOT NULL DEFAULT '',
      icon_path TEXT NOT NULL DEFAULT '/assets/icons/2754.png',
      icon_alt TEXT NOT NULL DEFAULT '',
      icon_width INTEGER NOT NULL DEFAULT 64,
      icon_height INTEGER NOT NULL DEFAULT 64,
      sort_order INTEGER NOT NULL DEFAULT 100,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_shop_items_order ON shop_items(is_active, sort_order, id);

    CREATE TABLE IF NOT EXISTS shop_services (
      service_key TEXT PRIMARY KEY,
      kind TEXT NOT NULL DEFAULT 'service',
      name TEXT NOT NULL,
      order_name TEXT NOT NULL,
      price_vnd INTEGER NOT NULL CHECK (price_vnd >= 0),
      unit TEXT NOT NULL,
      price_text TEXT NOT NULL,
      note TEXT NOT NULL,
      tag TEXT NOT NULL DEFAULT '',
      sort_order INTEGER NOT NULL DEFAULT 100,
      updated_at TEXT NOT NULL
    );
  `);

  // Seed default shop items once from frozen catalog defaults
  const seededItemsFlag = db.prepare("SELECT value FROM shop_meta WHERE key = 'items_seeded_v1'").get();
  const itemsCountRow = db.prepare("SELECT COUNT(*) AS cnt FROM shop_items").get();
  if (!seededItemsFlag && Number(itemsCountRow.cnt) === 0) {
    const now = new Date().toISOString();
    const insertItemStmt = db.prepare(`
      INSERT INTO shop_items (
        item_key, category, group_label, name, order_name, description, keywords,
        kind, price_vnd, rate_per_k, unit, unit_price_label, default_qty, step, max_qty,
        tag, tag_class, icon_path, icon_alt, icon_width, icon_height, sort_order, is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
    `);
    db.exec("BEGIN");
    try {
      ITEM_PRICE_ROWS.forEach((row, idx) => {
        insertItemStmt.run(
          row.id,
          row.category,
          row.group || "Item",
          row.name,
          row.orderName || row.name,
          row.desc || "",
          row.keywords || "",
          row.kind || "fixed",
          Number(row.price) || 0,
          Number(row.ratePerK) || 0,
          row.unit || "món",
          row.unitPriceLabel || formatItemUnitPriceLabel(row.kind, row.price, row.unit),
          Number(row.defaultQty) || 1,
          Number(row.step) || 1,
          Number(row.maxQty) || 9999,
          row.tag || "",
          row.tagClass || "",
          row.icon || "/assets/icons/2754.png",
          row.iconAlt || row.name,
          Number(row.width) || 64,
          Number(row.height) || 64,
          (idx + 1) * 10,
          now,
          now
        );
      });
      db.prepare("INSERT OR REPLACE INTO shop_meta (key, value) VALUES ('items_seeded_v1', '1')").run();
      db.exec("COMMIT");
    } catch (err) {
      db.exec("ROLLBACK");
      throw err;
    }
  }

  // Seed default services & starter accounts once
  const seededServicesFlag = db.prepare("SELECT value FROM shop_meta WHERE key = 'services_seeded_v1'").get();
  const servicesCountRow = db.prepare("SELECT COUNT(*) AS cnt FROM shop_services").get();
  if (!seededServicesFlag && Number(servicesCountRow.cnt) === 0) {
    const now = new Date().toISOString();
    const insertSvcStmt = db.prepare(`
      INSERT INTO shop_services (
        service_key, kind, name, order_name, price_vnd, unit, price_text, note, tag, sort_order, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    db.exec("BEGIN");
    try {
      KICH_DIEM_SERVICES.forEach((svc, idx) => {
        insertSvcStmt.run(
          svc.id,
          "service",
          svc.name,
          svc.orderName || svc.name,
          Number(svc.price) || 0,
          svc.unit || "lượt",
          svc.priceText || "Báo giá theo yêu cầu",
          svc.note || "",
          svc.tag || "",
          (idx + 1) * 10,
          now
        );
      });
      STARTER_ACCS.forEach((acc, idx) => {
        insertSvcStmt.run(
          acc.id,
          "starter",
          acc.name,
          acc.name,
          Number(acc.price) || 0,
          acc.unit || "acc",
          acc.priceText || formatServicePriceText(acc.id, acc.price, acc.unit),
          acc.note || "",
          acc.tag || "",
          100 + (idx + 1) * 10,
          now
        );
      });
      db.prepare("INSERT OR REPLACE INTO shop_meta (key, value) VALUES ('services_seeded_v1', '1')").run();
      db.exec("COMMIT");
    } catch (err) {
      db.exec("ROLLBACK");
      throw err;
    }
  }

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

  function slugifyItemKey(name) {
    const folded = sanitizePlainText(name, 48)
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 24);
    const suffix = crypto.randomBytes(2).toString("hex");
    return `${folded || "item"}-${suffix}`;
  }

  function mapShopItemRow(row) {
    if (!row) return null;
    return {
      dbId: row.id,
      id: row.item_key,
      itemKey: row.item_key,
      category: row.category,
      group: row.group_label,
      name: row.name,
      orderName: row.order_name,
      desc: row.description,
      keywords: row.keywords,
      kind: row.kind,
      price: row.price_vnd,
      ratePerK: row.rate_per_k,
      unit: row.unit,
      unitPriceLabel: row.unit_price_label,
      defaultQty: row.default_qty,
      step: row.step,
      maxQty: row.max_qty,
      tag: row.tag,
      tagClass: row.tag_class,
      icon: row.icon_path,
      iconAlt: row.icon_alt || row.name,
      width: row.icon_width,
      height: row.icon_height,
      sortOrder: row.sort_order,
      isActive: Boolean(row.is_active),
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  const validCategoryIds = new Set(ALLOWED_ITEM_CATEGORIES.map((c) => c.id));
  const categoryGroupMap = new Map(ALLOWED_ITEM_CATEGORIES.map((c) => [c.id, c.group]));

  function buildCombinedKeywords(name, desc, tag, extraKeywords) {
    const base = [name, desc, tag, extraKeywords].filter(Boolean).join(" ");
    const clean = sanitizePlainText(base, 260).toLowerCase();
    const folded = clean
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d");
    return sanitizePlainText(`${clean} ${folded}`, 320);
  }

  function listShopItems({ includeHidden = false, category = "", q = "" } = {}) {
    const conditions = [];
    const params = [];
    if (!includeHidden) {
      conditions.push("is_active = 1");
    }
    if (category && category !== "all" && validCategoryIds.has(category)) {
      conditions.push("category = ?");
      params.push(category);
    }
    if (q) {
      const cleanQ = `%${sanitizePlainText(q, 60)}%`;
      conditions.push("(name LIKE ? OR description LIKE ? OR keywords LIKE ? OR tag LIKE ?)");
      params.push(cleanQ, cleanQ, cleanQ, cleanQ);
    }
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const rows = db
      .prepare(`SELECT * FROM shop_items ${whereClause} ORDER BY sort_order ASC, id ASC`)
      .all(...params);
    return rows.map(mapShopItemRow);
  }

  function getShopItemById(dbId) {
    const numId = Number(dbId);
    if (!Number.isInteger(numId) || numId <= 0) return null;
    const row = db.prepare("SELECT * FROM shop_items WHERE id = ?").get(numId);
    return mapShopItemRow(row);
  }

  function createShopItem({
    category = "item-x99",
    name,
    orderName,
    desc = "",
    keywords = "",
    kind = "fixed",
    price = 0,
    unit = "món",
    defaultQty = 1,
    tag = "",
    tagClass = "",
    icon = "/assets/icons/2754.png",
    iconWidth = 64,
    iconHeight = 64,
    sortOrder = 200,
    isActive = true
  }) {
    const cleanCat = validCategoryIds.has(category) ? category : "khac";
    const groupLabel = categoryGroupMap.get(cleanCat) || "Vật phẩm khác";
    const cleanKind = kind === "quote" ? "quote" : "fixed";
    const cleanPrice = cleanKind === "quote" ? 0 : Math.max(0, Math.floor(Number(price) || 0));
    const cleanTagClass = ALLOWED_ITEM_TAG_CLASSES.includes(tagClass) ? tagClass : "";
    const now = new Date().toISOString();
    const itemKey = slugifyItemKey(name);
    const unitPriceLabel = formatItemUnitPriceLabel(cleanKind, cleanPrice, unit);
    const mergedKeywords = buildCombinedKeywords(name, desc, tag, keywords);

    const info = db.prepare(`
      INSERT INTO shop_items (
        item_key, category, group_label, name, order_name, description, keywords,
        kind, price_vnd, rate_per_k, unit, unit_price_label, default_qty, step, max_qty,
        tag, tag_class, icon_path, icon_alt, icon_width, icon_height, sort_order, is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, 1, 9999, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      itemKey,
      cleanCat,
      groupLabel,
      name,
      orderName || name,
      desc,
      mergedKeywords,
      cleanKind,
      cleanPrice,
      unit,
      unitPriceLabel,
      Math.max(1, Math.min(9999, Math.floor(Number(defaultQty) || 1))),
      tag,
      cleanTagClass,
      icon,
      name,
      Math.max(16, Math.min(512, Number(iconWidth) || 64)),
      Math.max(16, Math.min(512, Number(iconHeight) || 64)),
      Math.max(0, Math.min(9999, Math.floor(Number(sortOrder) || 200))),
      isActive ? 1 : 0,
      now,
      now
    );
    return getShopItemById(Number(info.lastInsertRowid));
  }

  function updateShopItem(dbId, patch = {}) {
    const existing = getShopItemById(dbId);
    if (!existing) return null;

    const nextCat = patch.category !== undefined && validCategoryIds.has(patch.category)
      ? patch.category
      : existing.category;
    const nextGroup = categoryGroupMap.get(nextCat) || existing.group;
    const nextName = patch.name !== undefined ? patch.name : existing.name;
    const nextOrderName = patch.orderName !== undefined
      ? patch.orderName
      : (patch.name !== undefined && existing.orderName === existing.name ? patch.name : existing.orderName);
    const nextDesc = patch.desc !== undefined ? patch.desc : existing.desc;
    const nextKind = patch.kind !== undefined
      ? (patch.kind === "quote" ? "quote" : "fixed")
      : existing.kind;
    const nextPrice = nextKind === "quote"
      ? 0
      : (patch.price !== undefined ? Math.max(0, Math.floor(Number(patch.price) || 0)) : existing.price);
    const nextUnit = patch.unit !== undefined ? patch.unit : existing.unit;
    const nextDefaultQty = patch.defaultQty !== undefined
      ? Math.max(1, Math.min(9999, Math.floor(Number(patch.defaultQty) || 1)))
      : existing.defaultQty;
    const nextTag = patch.tag !== undefined ? patch.tag : existing.tag;
    const nextTagClass = patch.tagClass !== undefined && ALLOWED_ITEM_TAG_CLASSES.includes(patch.tagClass)
      ? patch.tagClass
      : existing.tagClass;
    const nextIcon = patch.icon !== undefined ? patch.icon : existing.icon;
    const nextWidth = patch.iconWidth !== undefined ? patch.iconWidth : existing.width;
    const nextHeight = patch.iconHeight !== undefined ? patch.iconHeight : existing.height;
    const nextSortOrder = patch.sortOrder !== undefined
      ? Math.max(0, Math.min(9999, Math.floor(Number(patch.sortOrder) || existing.sortOrder)))
      : existing.sortOrder;
    const nextIsActive = patch.isActive !== undefined ? Boolean(patch.isActive) : existing.isActive;
    const nextUnitPriceLabel =
      patch.kind !== undefined || patch.price !== undefined || patch.unit !== undefined
        ? formatItemUnitPriceLabel(nextKind, nextPrice, nextUnit)
        : existing.unitPriceLabel;
    const nextKeywords =
      patch.keywords !== undefined || patch.name !== undefined || patch.desc !== undefined || patch.tag !== undefined
        ? buildCombinedKeywords(nextName, nextDesc, nextTag, patch.keywords !== undefined ? patch.keywords : existing.keywords)
        : existing.keywords;

    db.prepare(`
      UPDATE shop_items
      SET category = ?, group_label = ?, name = ?, order_name = ?, description = ?, keywords = ?,
          kind = ?, price_vnd = ?, unit = ?, unit_price_label = ?, default_qty = ?,
          tag = ?, tag_class = ?, icon_path = ?, icon_alt = ?, icon_width = ?, icon_height = ?,
          sort_order = ?, is_active = ?, updated_at = ?
      WHERE id = ?
    `).run(
      nextCat,
      nextGroup,
      nextName,
      nextOrderName,
      nextDesc,
      nextKeywords,
      nextKind,
      nextPrice,
      nextUnit,
      nextUnitPriceLabel,
      nextDefaultQty,
      nextTag,
      nextTagClass,
      nextIcon,
      nextName,
      nextWidth,
      nextHeight,
      nextSortOrder,
      nextIsActive ? 1 : 0,
      new Date().toISOString(),
      existing.dbId
    );
    return getShopItemById(existing.dbId);
  }

  function deleteShopItem(dbId) {
    const existing = getShopItemById(dbId);
    if (!existing) return null;
    db.prepare("DELETE FROM shop_items WHERE id = ?").run(existing.dbId);
    return existing;
  }

  function isUploadPathReferenced(imagePath) {
    if (!imagePath || !String(imagePath).startsWith("/uploads/")) return false;
    const accCnt = db.prepare("SELECT COUNT(*) AS cnt FROM accounts WHERE image_path = ?").get(imagePath).cnt;
    const itemCnt = db.prepare("SELECT COUNT(*) AS cnt FROM shop_items WHERE icon_path = ?").get(imagePath).cnt;
    return Number(accCnt) + Number(itemCnt) > 0;
  }

  const defaultServicesById = new Map([
    ...KICH_DIEM_SERVICES.map((s) => [s.id, { ...s, kind: "service" }]),
    ...STARTER_ACCS.map((a) => [a.id, { ...a, kind: "starter" }])
  ]);

  function listServices() {
    const rows = db.prepare("SELECT * FROM shop_services ORDER BY sort_order ASC, service_key ASC").all();
    const kichDiemServices = [];
    const starterAccs = [];
    for (const row of rows) {
      const base = defaultServicesById.get(row.service_key) || {};
      const merged = {
        ...base,
        id: row.service_key,
        kind: row.kind,
        name: row.name,
        orderName: row.order_name,
        price: row.price_vnd,
        unit: row.unit,
        priceText: row.price_text,
        note: row.note,
        tag: row.tag
      };
      if (row.kind === "starter") {
        starterAccs.push(merged);
      } else {
        kichDiemServices.push(merged);
      }
    }
    return { kichDiemServices, starterAccs };
  }

  function getServiceByKey(serviceKey) {
    const cleanKey = sanitizePlainText(serviceKey, 40);
    if (!cleanKey) return null;
    const row = db.prepare("SELECT * FROM shop_services WHERE service_key = ?").get(cleanKey);
    if (!row) return null;
    const base = defaultServicesById.get(row.service_key) || {};
    return {
      ...base,
      id: row.service_key,
      kind: row.kind,
      name: row.name,
      orderName: row.order_name,
      price: row.price_vnd,
      unit: row.unit,
      priceText: row.price_text,
      note: row.note,
      tag: row.tag
    };
  }

  function updateService(serviceKey, patch = {}) {
    const existing = getServiceByKey(serviceKey);
    if (!existing) return null;

    const nextName = patch.name !== undefined ? patch.name : existing.name;
    const nextPrice = patch.price !== undefined ? Math.max(0, Math.floor(Number(patch.price) || 0)) : existing.price;
    const nextUnit = patch.unit !== undefined ? patch.unit : existing.unit;
    const nextNote = patch.note !== undefined ? patch.note : existing.note;
    const nextTag = patch.tag !== undefined ? patch.tag : existing.tag;
    const nextPriceText = patch.priceText !== undefined
      ? patch.priceText
      : (nextPrice > 0 ? formatServicePriceText(existing.id, nextPrice, nextUnit, existing.priceText) : existing.priceText);

    db.prepare(`
      UPDATE shop_services
      SET name = ?, price_vnd = ?, unit = ?, price_text = ?, note = ?, tag = ?, updated_at = ?
      WHERE service_key = ?
    `).run(
      nextName,
      nextPrice,
      nextUnit,
      nextPriceText,
      nextNote,
      nextTag,
      new Date().toISOString(),
      existing.id
    );
    return getServiceByKey(existing.id);
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
    listShopItems,
    getShopItemById,
    createShopItem,
    updateShopItem,
    deleteShopItem,
    isUploadPathReferenced,
    listServices,
    getServiceByKey,
    updateService,
    getRecentAuditLogs,
    getRecentCspReports,
    close
  };
}

module.exports = {
  initDatabase
};

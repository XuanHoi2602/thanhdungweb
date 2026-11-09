"use strict";

const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const {
  ROOT_DIR,
  OFFICIAL_CONTACTS,
  OFFICIAL_BANK,
  ALLOWED_PLANETS,
  ALLOWED_STATUSES,
  ALLOWED_SERVERS,
  FULL_AD_POST,
  CONFIG_SHA256,
  getOrCreateAppSecret,
  verifyIntegrity
} = require("./src/config");
const { initDatabase } = require("./src/db");
const {
  sanitizePlainText,
  sanitizeSearchQuery,
  safeEqualStrings,
  generateNonce,
  parseCookies,
  getSessionCookieName,
  buildSessionCookie,
  buildClearSessionCookie,
  getClientIp,
  setCommonHardeningHeaders,
  setHtmlSecurityHeaders,
  setJsonSecurityHeaders,
  setUploadSecurityHeaders,
  checkFetchMetadataAndOrigin,
  RateLimiter,
  readRequestBody,
  parseMultipartFormData,
  inspectImageMagicBytes,
  resolveSafeSubpath
} = require("./src/security");
const { renderPage } = require("./src/views");

const STATIC_MIME_MAP = {
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml"
};

const UPLOAD_MIME_MAP = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp"
};

function stripUrlSecrets(rawUrl) {
  const clean = sanitizePlainText(rawUrl, 200);
  if (!clean) return "";
  try {
    const parsed = new URL(clean);
    parsed.search = "";
    parsed.hash = "";
    return parsed.toString().slice(0, 200);
  } catch {
    return clean.split("?")[0].split("#")[0].slice(0, 200);
  }
}

function isValidServerLabel(serverName) {
  if (ALLOWED_SERVERS.includes(serverName)) return true;
  return /^[\p{L}\p{N} ._-]{2,24}$/u.test(serverName);
}

function createAppServer(options = {}) {
  const rootDir = options.rootDir || ROOT_DIR;
  const publicDir = options.publicDir || path.join(rootDir, "public");
  const assetsDir = options.assetsDir || path.join(rootDir, "assets");
  const railwayMount = process.env.RAILWAY_VOLUME_MOUNT_PATH
    ? path.resolve(process.env.RAILWAY_VOLUME_MOUNT_PATH)
    : "";
  const uploadsDir =
    options.uploadsDir ||
    (process.env.UPLOADS_DIR
      ? path.resolve(process.env.UPLOADS_DIR)
      : railwayMount
        ? path.join(railwayMount, "uploads")
        : path.join(rootDir, "uploads"));
  const dataDir =
    options.dataDir ||
    (process.env.DATA_DIR
      ? path.resolve(process.env.DATA_DIR)
      : railwayMount
        ? path.join(railwayMount, "data")
        : path.join(rootDir, "data"));
  const dbPath = options.dbPath || path.join(dataDir, "shop.db");

  const appSecret = getOrCreateAppSecret(dataDir);
  const store = initDatabase({
    dbPath,
    uploadsDir,
    adminUser: options.adminUser || process.env.ADMIN_USER || "thanhdung",
    adminPass: options.adminPass !== undefined ? options.adminPass : (process.env.ADMIN_PASS || "")
  });

  const rateLimiter = new RateLimiter();

  function sendJson(req, res, statusCode, payload, { cacheControl = "no-store" } = {}) {
    setJsonSecurityHeaders(req, res, { cacheControl });
    res.statusCode = statusCode;
    res.end(JSON.stringify(payload));
  }

  function sendHtml(req, res, statusCode, html, nonce, { cacheControl = "no-cache" } = {}) {
    setHtmlSecurityHeaders(req, res, nonce, { cacheControl });
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.statusCode = statusCode;
    res.end(req.method === "HEAD" ? undefined : html);
  }

  function sendFileResponse(req, res, filePath, mimeType, { isUpload = false } = {}) {
    fs.stat(filePath, (err, stat) => {
      if (err || !stat.isFile()) {
        res.statusCode = 404;
        setCommonHardeningHeaders(req, res);
        res.end("Not Found");
        return;
      }

      if (isUpload) {
        setUploadSecurityHeaders(req, res, mimeType);
      } else {
        setCommonHardeningHeaders(req, res);
        res.setHeader("Content-Type", mimeType);
        res.setHeader("Cache-Control", "public, max-age=300");
        if (mimeType === "image/svg+xml") {
          res.setHeader("Content-Security-Policy", "default-src 'none'; style-src 'unsafe-inline';");
        }
      }

      res.setHeader("Content-Length", stat.size);
      res.statusCode = 200;
      if (req.method === "HEAD") {
        res.end();
        return;
      }

      const stream = fs.createReadStream(filePath);
      stream.on("error", () => {
        if (!res.headersSent) res.statusCode = 500;
        res.end();
      });
      stream.pipe(res);
    });
  }

  function readSessionFromRequest(req) {
    const cookies = parseCookies(req.headers.cookie);
    const cookieName = getSessionCookieName(req);
    const rawToken = cookies[cookieName] || cookies["__Host-td_session"] || cookies.td_session;
    if (!rawToken) return null;
    const session = store.getSessionByToken(rawToken);
    if (!session) return null;
    return { ...session, rawToken };
  }

  function verifyCsrf(req, session) {
    const headerToken = String(req.headers["x-csrf-token"] || "");
    if (!session || !headerToken) return false;
    return safeEqualStrings(headerToken, session.csrfToken);
  }

  const server = http.createServer(async (req, res) => {
    try {
      const method = String(req.method || "GET").toUpperCase();
      let parsedUrl;
      let pathname;
      try {
        parsedUrl = new URL(req.url || "/", "http://127.0.0.1");
        pathname = decodeURIComponent(parsedUrl.pathname);
      } catch {
        sendJson(req, res, 400, { ok: false, error: "Malformed request URL" });
        return;
      }

      // Normalize trailing slashes cleanly (except root)
      if (pathname.length > 1 && pathname.endsWith("/")) {
        const stripped = pathname.slice(0, -1);
        const query = parsedUrl.search || "";
        setCommonHardeningHeaders(req, res);
        res.statusCode = 301;
        res.setHeader("Location", stripped + query);
        res.end();
        return;
      }

      const isApi = pathname.startsWith("/api/");
      const ip = getClientIp(req);

      // Fetch Metadata check runs BEFORE any auth/session parsing
      const fmCheck = checkFetchMetadataAndOrigin(req, res, { isApi });
      if (!fmCheck.ok) {
        if (["POST", "PATCH", "PUT", "DELETE"].includes(method)) {
          store.recordAudit("FETCH_METADATA_BLOCK", "anonymous", fmCheck.reason, ip);
        }
        sendJson(req, res, 403, { ok: false, error: "Forbidden by resource isolation policy" });
        return;
      }

      // 1. HTML Multi-Path Pages
      if (
        (method === "GET" || method === "HEAD") &&
        ["/", "/kich-diem", "/mua-item", "/mua-tai-khoan", "/admin"].includes(pathname)
      ) {
        const nonce = generateNonce();
        const session = readSessionFromRequest(req);
        const integrity = verifyIntegrity();

        if (!integrity.ok) {
          store.recordAudit(
            "INTEGRITY_ALERT",
            "system",
            `QR checksum mismatch: got ${integrity.qrActualSha256}`,
            ip
          );
        }

        const data = {};
        if (pathname === "/") {
          data.accounts = store.listAccounts({ status: "available", limit: 3 });
        } else if (pathname === "/mua-tai-khoan") {
          const sv = sanitizePlainText(parsedUrl.searchParams.get("server") || "", 24);
          const pl = sanitizePlainText(parsedUrl.searchParams.get("planet") || "", 20);
          const st = sanitizePlainText(parsedUrl.searchParams.get("status") || "", 12);
          const q = sanitizeSearchQuery(parsedUrl.searchParams.get("q") || "");
          data.accounts = store.listAccounts({ server: sv, planet: pl, status: st, q, limit: 120 });
        } else if (pathname === "/admin") {
          if (session) {
            data.accounts = store.listAccounts({ limit: 150 });
            data.auditLogs = store.getRecentAuditLogs(30);
            data.cspReports = store.getRecentCspReports(20);
          }
        }

        const html = renderPage({
          route: pathname,
          nonce,
          csrfToken: session ? session.csrfToken : "",
          session,
          integrity,
          data
        });

        const cacheControl = session || pathname === "/admin" ? "no-store" : "no-cache";
        sendHtml(req, res, 200, html, nonce, { cacheControl });
        return;
      }

      // 2. Public CSS & JS
      if ((method === "GET" || method === "HEAD") && (pathname === "/styles.css" || pathname === "/app.js")) {
        const rel = pathname.slice(1);
        const safeFile = resolveSafeSubpath(publicDir, rel);
        if (!safeFile) {
          res.statusCode = 403;
          res.end("Forbidden");
          return;
        }
        const ext = path.extname(safeFile).toLowerCase();
        sendFileResponse(req, res, safeFile, STATIC_MIME_MAP[ext] || "application/octet-stream");
        return;
      }

      // 3. Static Assets (/assets/...)
      if ((method === "GET" || method === "HEAD") && pathname.startsWith("/assets/")) {
        const rel = pathname.slice("/assets/".length);
        if (!rel || rel.includes("..") || rel.startsWith(".")) {
          res.statusCode = 403;
          res.end("Forbidden");
          return;
        }
        const ext = path.extname(rel).toLowerCase();
        const mime = STATIC_MIME_MAP[ext];
        if (!mime || ![".png", ".jpg", ".jpeg", ".webp", ".svg"].includes(ext)) {
          res.statusCode = 404;
          res.end("Not Found");
          return;
        }
        const safeFile = resolveSafeSubpath(assetsDir, rel);
        if (!safeFile) {
          res.statusCode = 403;
          res.end("Forbidden");
          return;
        }
        sendFileResponse(req, res, safeFile, mime);
        return;
      }

      // 4. Hardened Uploaded Images (/uploads/<uuid>.png|jpg|webp)
      if ((method === "GET" || method === "HEAD") && pathname.startsWith("/uploads/")) {
        const match = pathname.match(/^\/uploads\/([0-9a-f-]{36}\.(png|jpg|webp))$/);
        if (!match) {
          res.statusCode = 404;
          res.end("Not Found");
          return;
        }
        const filename = match[1];
        const ext = `.${match[2]}`;
        const safeFile = resolveSafeSubpath(uploadsDir, filename);
        if (!safeFile) {
          res.statusCode = 403;
          res.end("Forbidden");
          return;
        }
        sendFileResponse(req, res, safeFile, UPLOAD_MIME_MAP[ext], { isUpload: true });
        return;
      }

      // 5. JSON APIs
      if ((method === "GET" || method === "HEAD") && pathname === "/api/health") {
        store.db.prepare("SELECT 1").get();
        const integrity = verifyIntegrity();
        setJsonSecurityHeaders(req, res, { cacheControl: "no-store" });
        res.statusCode = 200;
        res.end(
          method === "HEAD"
            ? undefined
            : JSON.stringify({ ok: true, service: "thanhdung-nro-shop", integrity })
        );
        return;
      }

      if (method === "GET" && pathname === "/api/shop-data") {
        const integrity = verifyIntegrity();
        const signedPayload = {
          contacts: OFFICIAL_CONTACTS,
          bank: {
            bankName: OFFICIAL_BANK.bankName,
            bankShort: OFFICIAL_BANK.bankShort,
            accountOwner: OFFICIAL_BANK.accountOwner,
            accountNumber: OFFICIAL_BANK.accountNumber,
            qrImageUrl: OFFICIAL_BANK.qrImageUrl,
            qrDownloadName: OFFICIAL_BANK.qrDownloadName
          },
          configSha256: CONFIG_SHA256
        };
        const configHmac = crypto
          .createHmac("sha256", appSecret)
          .update(JSON.stringify(signedPayload))
          .digest("hex");

        sendJson(req, res, 200, {
          ok: true,
          ...signedPayload,
          configHmac,
          integrity,
          allowedPlanets: ALLOWED_PLANETS,
          allowedServers: ALLOWED_SERVERS,
          fullAdPost: FULL_AD_POST
        });
        return;
      }

      if (method === "GET" && pathname === "/api/accounts") {
        const sv = sanitizePlainText(parsedUrl.searchParams.get("server") || "", 24);
        const pl = sanitizePlainText(parsedUrl.searchParams.get("planet") || "", 20);
        const st = sanitizePlainText(parsedUrl.searchParams.get("status") || "", 12);
        const q = sanitizeSearchQuery(parsedUrl.searchParams.get("q") || "");
        const accounts = store.listAccounts({ server: sv, planet: pl, status: st, q, limit: 150 });
        sendJson(req, res, 200, { ok: true, accounts });
        return;
      }

      if (method === "GET" && pathname === "/api/auth/me") {
        const session = readSessionFromRequest(req);
        if (!session) {
          sendJson(req, res, 200, { ok: true, authenticated: false });
          return;
        }
        sendJson(req, res, 200, {
          ok: true,
          authenticated: true,
          username: session.username,
          csrfToken: session.csrfToken
        });
        return;
      }

      if (method === "POST" && pathname === "/api/auth/login") {
        const limitResult = rateLimiter.consume(`login:${ip}`, 8, 5 * 60 * 1000);
        if (!limitResult.allowed) {
          res.setHeader("Retry-After", String(limitResult.retryAfterSec));
          store.recordAudit("AUTH_RATE_LIMITED", "anonymous", "Quá số lần thử đăng nhập", ip);
          sendJson(req, res, 429, {
            ok: false,
            error: `Thử đăng nhập quá nhiều lần. Vui lòng đợi ${limitResult.retryAfterSec} giây.`
          });
          return;
        }

        const ct = String(req.headers["content-type"] || "").toLowerCase();
        if (!ct.includes("application/json")) {
          sendJson(req, res, 415, { ok: false, error: "Content-Type must be application/json" });
          return;
        }

        const rawBody = await readRequestBody(req, 4096);
        let parsedBody;
        try {
          parsedBody = JSON.parse(rawBody.toString("utf8"));
        } catch {
          sendJson(req, res, 400, { ok: false, error: "Dữ liệu JSON không hợp lệ" });
          return;
        }

        const username = sanitizePlainText(parsedBody && parsedBody.username, 40);
        const password = typeof (parsedBody && parsedBody.password) === "string" ? parsedBody.password : "";

        const admin = store.verifyAdminLogin(username, password);
        if (!admin) {
          store.recordAudit("AUTH_FAILED", username || "unknown", "Sai tên đăng nhập hoặc mật khẩu", ip);
          sendJson(req, res, 401, { ok: false, error: "Sai tên đăng nhập hoặc mật khẩu quản trị." });
          return;
        }

        const created = store.createSession(admin.id, req.headers["user-agent"] || "");
        store.recordAudit("AUTH_LOGIN", admin.username, "Đăng nhập quản trị thành công", ip);

        res.setHeader("Set-Cookie", buildSessionCookie(req, created.rawToken));
        sendJson(req, res, 200, {
          ok: true,
          username: admin.username,
          csrfToken: created.csrfToken
        });
        return;
      }

      if (method === "POST" && pathname === "/api/auth/logout") {
        const session = readSessionFromRequest(req);
        if (session) {
          if (!verifyCsrf(req, session)) {
            sendJson(req, res, 403, { ok: false, error: "Invalid CSRF token" });
            return;
          }
          store.deleteSessionByToken(session.rawToken);
          store.recordAudit("AUTH_LOGOUT", session.username, "Đăng xuất phiên làm việc", ip);
        }

        res.setHeader("Set-Cookie", buildClearSessionCookie(req));
        res.setHeader("Clear-Site-Data", '"cookies", "storage"');
        sendJson(req, res, 200, { ok: true });
        return;
      }

      if (method === "POST" && pathname === "/api/accounts") {
        const limitResult = rateLimiter.consume(`upload:${ip}`, 30, 10 * 60 * 1000);
        if (!limitResult.allowed) {
          res.setHeader("Retry-After", String(limitResult.retryAfterSec));
          sendJson(req, res, 429, { ok: false, error: "Thao tác quá nhanh, vui lòng thử lại sau." });
          return;
        }

        const session = readSessionFromRequest(req);
        if (!session) {
          sendJson(req, res, 401, { ok: false, error: "Cần đăng nhập quản trị trước khi đăng acc." });
          return;
        }

        if (!verifyCsrf(req, session)) {
          store.recordAudit("CSRF_BLOCK", session.username, "Sai hoặc thiếu X-CSRF-Token khi đăng acc", ip);
          sendJson(req, res, 403, { ok: false, error: "Phiên CSRF không hợp lệ." });
          return;
        }

        const rawBody = await readRequestBody(req, Math.floor(5.5 * 1024 * 1024));
        const { fields, files } = parseMultipartFormData(rawBody, req.headers["content-type"]);

        const title = sanitizePlainText(fields.title, 90);
        const priceNum = Number(fields.price_vnd);
        const serverName = sanitizePlainText(fields.server_name, 24);
        const planet = sanitizePlainText(fields.planet, 20);
        const note = sanitizePlainText(fields.note, 1200, { multiline: true });

        if (!title || title.length < 3) {
          sendJson(req, res, 400, { ok: false, error: "Tiêu đề acc cần tối thiểu 3 ký tự." });
          return;
        }
        if (!Number.isInteger(priceNum) || priceNum < 1000 || priceNum > 500_000_000) {
          sendJson(req, res, 400, { ok: false, error: "Giá bán (VNĐ) phải là số nguyên từ 1.000 đến 500.000.000." });
          return;
        }
        if (!isValidServerLabel(serverName)) {
          sendJson(req, res, 400, { ok: false, error: "Tên Server không hợp lệ." });
          return;
        }
        if (!ALLOWED_PLANETS.includes(planet)) {
          sendJson(req, res, 400, { ok: false, error: "Hành tinh phải là Trái Đất, Namếc hoặc Xayda." });
          return;
        }
        if (!note || note.length < 3) {
          sendJson(req, res, 400, { ok: false, error: "Ghi chú quảng cáo cần tối thiểu 3 ký tự." });
          return;
        }

        const imageFile = files.image;
        if (!imageFile || !Buffer.isBuffer(imageFile.data)) {
          sendJson(req, res, 400, { ok: false, error: "Vui lòng đính kèm file ảnh acc (PNG / JPG / WebP)." });
          return;
        }

        const imgMeta = inspectImageMagicBytes(imageFile.data);
        if (!imgMeta) {
          store.recordAudit(
            "MALICIOUS_UPLOAD_REJECTED",
            session.username,
            `Từ chối file ảnh không hợp lệ (${imageFile.declaredType || "unknown"})`,
            ip
          );
          sendJson(req, res, 400, {
            ok: false,
            error: "File ảnh không hợp lệ hoặc chứa nội dung không phải PNG/JPG/WebP thật."
          });
          return;
        }

        const safeFilename = `${crypto.randomUUID()}${imgMeta.ext}`;
        const diskPath = resolveSafeSubpath(uploadsDir, safeFilename);
        if (!diskPath) {
          sendJson(req, res, 500, { ok: false, error: "Internal path resolution error" });
          return;
        }

        fs.writeFileSync(diskPath, imageFile.data, { flag: "wx" });

        const createdAcc = store.createAccount({
          title,
          priceVnd: priceNum,
          serverName,
          planet,
          note,
          imagePath: `/uploads/${safeFilename}`,
          imageWidth: imgMeta.width,
          imageHeight: imgMeta.height
        });

        store.recordAudit(
          "ACCOUNT_CREATED",
          session.username,
          `Đăng acc #${createdAcc.code} (${createdAcc.server_name} · ${createdAcc.planet} · ${createdAcc.price_vnd} đ)`,
          ip
        );

        sendJson(req, res, 201, { ok: true, account: createdAcc });
        return;
      }

      const accIdMatch = pathname.match(/^\/api\/accounts\/(\d+)$/);
      if (accIdMatch && method === "PATCH") {
        const session = readSessionFromRequest(req);
        if (!session) {
          sendJson(req, res, 401, { ok: false, error: "Unauthorized" });
          return;
        }
        if (!verifyCsrf(req, session)) {
          sendJson(req, res, 403, { ok: false, error: "Invalid CSRF token" });
          return;
        }

        const rawBody = await readRequestBody(req, 8192);
        let parsedBody;
        try {
          parsedBody = JSON.parse(rawBody.toString("utf8"));
        } catch {
          sendJson(req, res, 400, { ok: false, error: "Invalid JSON" });
          return;
        }

        const updates = {};
        if (parsedBody.status !== undefined) {
          const nextSt = sanitizePlainText(parsedBody.status, 12);
          if (!ALLOWED_STATUSES.includes(nextSt)) {
            sendJson(req, res, 400, { ok: false, error: "Trạng thái không hợp lệ." });
            return;
          }
          updates.status = nextSt;
        }
        if (parsedBody.price_vnd !== undefined) {
          const nextPrice = Number(parsedBody.price_vnd);
          if (!Number.isInteger(nextPrice) || nextPrice < 1000 || nextPrice > 500_000_000) {
            sendJson(req, res, 400, { ok: false, error: "Giá bán không hợp lệ." });
            return;
          }
          updates.priceVnd = nextPrice;
        }
        if (parsedBody.title !== undefined) {
          const nextTitle = sanitizePlainText(parsedBody.title, 90);
          if (nextTitle.length < 3) {
            sendJson(req, res, 400, { ok: false, error: "Tiêu đề quá ngắn." });
            return;
          }
          updates.title = nextTitle;
        }
        if (parsedBody.note !== undefined) {
          const nextNote = sanitizePlainText(parsedBody.note, 1200, { multiline: true });
          if (nextNote.length < 3) {
            sendJson(req, res, 400, { ok: false, error: "Ghi chú quá ngắn." });
            return;
          }
          updates.note = nextNote;
        }
        if (parsedBody.server_name !== undefined) {
          const nextSv = sanitizePlainText(parsedBody.server_name, 24);
          if (!isValidServerLabel(nextSv)) {
            sendJson(req, res, 400, { ok: false, error: "Server không hợp lệ." });
            return;
          }
          updates.serverName = nextSv;
        }
        if (parsedBody.planet !== undefined) {
          const nextPl = sanitizePlainText(parsedBody.planet, 20);
          if (!ALLOWED_PLANETS.includes(nextPl)) {
            sendJson(req, res, 400, { ok: false, error: "Hành tinh không hợp lệ." });
            return;
          }
          updates.planet = nextPl;
        }

        const updated = store.updateAccount(Number(accIdMatch[1]), updates);
        if (!updated) {
          sendJson(req, res, 404, { ok: false, error: "Không tìm thấy tài khoản." });
          return;
        }

        store.recordAudit(
          "ACCOUNT_UPDATED",
          session.username,
          `Cập nhật acc #${updated.code} (status=${updated.status}, price=${updated.price_vnd})`,
          ip
        );
        sendJson(req, res, 200, { ok: true, account: updated });
        return;
      }

      if (accIdMatch && method === "DELETE") {
        const session = readSessionFromRequest(req);
        if (!session) {
          sendJson(req, res, 401, { ok: false, error: "Unauthorized" });
          return;
        }
        if (!verifyCsrf(req, session)) {
          sendJson(req, res, 403, { ok: false, error: "Invalid CSRF token" });
          return;
        }

        const deleted = store.deleteAccount(Number(accIdMatch[1]));
        if (!deleted) {
          sendJson(req, res, 404, { ok: false, error: "Không tìm thấy tài khoản." });
          return;
        }

        const relImg = deleted.image_path.replace(/^\/uploads\//, "");
        const imgDisk = resolveSafeSubpath(uploadsDir, relImg);
        if (imgDisk && fs.existsSync(imgDisk)) {
          fs.unlinkSync(imgDisk);
        }

        store.recordAudit("ACCOUNT_DELETED", session.username, `Xóa acc #${deleted.code}`, ip);
        sendJson(req, res, 200, { ok: true });
        return;
      }

      if (method === "GET" && pathname === "/api/admin/audit") {
        const session = readSessionFromRequest(req);
        if (!session) {
          sendJson(req, res, 401, { ok: false, error: "Unauthorized" });
          return;
        }
        sendJson(req, res, 200, {
          ok: true,
          integrity: verifyIntegrity(),
          auditLogs: store.getRecentAuditLogs(40),
          cspReports: store.getRecentCspReports(25)
        });
        return;
      }

      if (method === "POST" && pathname === "/api/csp-report") {
        const limitResult = rateLimiter.consume(`csp:${ip}`, 60, 60 * 1000);
        if (!limitResult.allowed) {
          res.statusCode = 429;
          res.end();
          return;
        }
        const rawBody = await readRequestBody(req, 16 * 1024);
        let parsed;
        try {
          parsed = JSON.parse(rawBody.toString("utf8"));
        } catch {
          res.statusCode = 204;
          res.end();
          return;
        }

        const reports = Array.isArray(parsed) ? parsed : [parsed];
        for (const item of reports.slice(0, 5)) {
          const rep = item && (item["csp-report"] || item.body || item);
          if (!rep || typeof rep !== "object") continue;
          store.recordCspReport({
            blockedUri: stripUrlSecrets(rep["blocked-uri"] || rep.blockedURL || rep.reason || "inline"),
            violatedDirective: sanitizePlainText(rep["violated-directive"] || rep.effectiveDirective || "unknown", 80),
            documentUri: stripUrlSecrets(rep["document-uri"] || rep.documentURL || ""),
            scriptSample: sanitizePlainText(rep["script-sample"] || rep.sample || "", 80)
          });
        }

        setCommonHardeningHeaders(req, res);
        res.statusCode = 204;
        res.end();
        return;
      }

      // 404 Not Found
      if (isApi) {
        sendJson(req, res, 404, { ok: false, error: "API endpoint not found" });
      } else {
        const nonce = generateNonce();
        const session = readSessionFromRequest(req);
        const integrity = verifyIntegrity();
        const html = renderPage({
          route: "/",
          nonce,
          csrfToken: session ? session.csrfToken : "",
          session,
          integrity,
          data: { accounts: store.listAccounts({ status: "available", limit: 3 }) }
        });
        sendHtml(req, res, 404, html, nonce, { cacheControl: "no-store" });
      }
    } catch (err) {
      const statusCode = err && err.statusCode ? err.statusCode : 500;
      const msg = statusCode < 500 ? err.message : "Internal Server Error";
      if (!res.headersSent) {
        sendJson(req, res, statusCode, { ok: false, error: msg });
      } else {
        res.end();
      }
    }
  });

  server.on("close", () => {
    store.close();
  });

  return { server, store, dataDir, uploadsDir };
}

if (require.main === module) {
  const usesDualStack = Boolean(
    process.env.RAILWAY_ENVIRONMENT ||
      process.env.RAILWAY_SERVICE_ID ||
      process.env.FLY_APP_NAME
  );
  const isRailway = Boolean(
    process.env.RAILWAY_ENVIRONMENT || process.env.RAILWAY_SERVICE_ID
  );
  const isCloudHost = Boolean(
    usesDualStack ||
      process.env.RENDER ||
      process.env.KOYEB_SERVICE_ID ||
      process.env.NODE_ENV === "production"
  );
  const HOST = process.env.HOST || (usesDualStack ? "::" : isCloudHost ? "0.0.0.0" : "127.0.0.1");
  const PORT = Number(process.env.PORT || 3000);
  const { server, store, dataDir, uploadsDir } = createAppServer();

  let shuttingDown = false;
  function shutdown(signal) {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`[SHUTDOWN] Nhan ${signal}, dang dong ket noi & luu SQLite WAL...`);
    server.close((err) => {
      if (err) {
        console.error("[SHUTDOWN] Loi khi dong server:", err);
        process.exit(1);
      }
      process.exit(0);
    });
    if (typeof server.closeIdleConnections === "function") {
      server.closeIdleConnections();
    }
    setTimeout(() => {
      if (typeof server.closeAllConnections === "function") {
        server.closeAllConnections();
      }
      process.exit(0);
    }, 5000).unref();
  }
  process.once("SIGTERM", () => shutdown("SIGTERM"));
  process.once("SIGINT", () => shutdown("SIGINT"));

  server.listen(PORT, HOST, () => {
    const integrity = verifyIntegrity();
    const displayHost = HOST === "::" ? "localhost" : HOST;
    console.log("==============================================================");
    console.log(` Shop NRO Thanh Dung dang chay tai: http://${displayHost}:${PORT} (bind ${HOST})`);
    console.log(" Paths:");
    console.log(`  - Trang chu      : http://${displayHost}:${PORT}/`);
    console.log(`  - Kich diem      : http://${displayHost}:${PORT}/kich-diem`);
    console.log(`  - Mua item       : http://${displayHost}:${PORT}/mua-item`);
    console.log(`  - Mua tai khoan  : http://${displayHost}:${PORT}/mua-tai-khoan`);
    console.log(`  - Quan tri / Log : http://${displayHost}:${PORT}/admin`);
    console.log(` Storage SQLite    : ${dataDir}`);
    console.log(` Storage Uploads   : ${uploadsDir}`);
    if (process.env.RAILWAY_VOLUME_MOUNT_PATH) {
      console.log(` Railway Volume    : ${process.env.RAILWAY_VOLUME_MOUNT_PATH}`);
    } else if (isRailway && !process.env.DATA_DIR) {
      console.log(" [WARNING] Chua gan Railway Volume (RAILWAY_VOLUME_MOUNT_PATH)!");
      console.log("           SQLite & anh acc se bi reset khi redeploy neu chua Mount Volume vao /storage.");
    }
    console.log(` Integrity SHA-256 : ${integrity.ok ? "VALID" : "WARNING!"} (${CONFIG_SHA256.slice(0, 16)}...)`);

    if (store.bootstrapCredentials) {
      console.log("--------------------------------------------------------------");
      console.log(" [FIRST RUN] Da tao tai khoan Admin ngau nhien:");
      console.log(`  Username: ${store.bootstrapCredentials.username}`);
      console.log(`  Password: ${store.bootstrapCredentials.password}`);
      if (!isCloudHost) {
        const credNotePath = path.join(ROOT_DIR, ".bootstrap-credentials.txt");
        const content = [
          "TAI KHOAN QUAN TRI KHOI TAO LAN DAU (HAY DOI MAT KHAU TRONG .env)",
          `Username: ${store.bootstrapCredentials.username}`,
          `Password: ${store.bootstrapCredentials.password}`
        ].join("\n");
        try {
          fs.writeFileSync(credNotePath, content, { encoding: "utf8", mode: 0o600 });
          console.log("  (Da luu tam vao .bootstrap-credentials.txt - hay tao .env truoc khi deploy!)");
        } catch (writeErr) {
          console.warn("  (Khong ghi duoc .bootstrap-credentials.txt:", writeErr.message, ")");
        }
      } else {
        console.log("  (Khuyen nghi set ADMIN_USER & ADMIN_PASS trong Variables cua Railway)");
      }
    }
    console.log("==============================================================");
  });
}

module.exports = {
  createAppServer
};

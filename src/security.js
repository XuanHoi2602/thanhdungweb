"use strict";

const crypto = require("node:crypto");
const path = require("node:path");

function escapeHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/`/g, "&#96;");
}

function sanitizePlainText(value, maxLength = 500, { multiline = false } = {}) {
  let str = String(value ?? "");
  str = str.replace(/\r\n?/g, "\n");
  // Strip ASCII control characters (except \n when multiline is enabled)
  str = multiline
    ? str.replace(/[\u0000-\u0009\u000B-\u001F\u007F]/g, "")
    : str.replace(/[\u0000-\u001F\u007F]/g, " ");
  if (!multiline) {
    str = str.replace(/\s+/g, " ");
  } else {
    str = str.replace(/\n{4,}/g, "\n\n\n");
  }
  str = str.trim();
  if (str.length > maxLength) {
    str = str.slice(0, maxLength).trim();
  }
  return str;
}

function sanitizeSearchQuery(value) {
  return sanitizePlainText(value, 80, { multiline: false });
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = crypto.scryptSync(String(password), salt, 64).toString("hex");
  return `scrypt$${salt}$${derived}`;
}

function verifyPassword(password, storedHash) {
  if (typeof password !== "string" || typeof storedHash !== "string") {
    return false;
  }
  const parts = storedHash.split("$");
  if (parts.length !== 3 || parts[0] !== "scrypt") {
    return false;
  }
  const [, salt, expectedHex] = parts;
  if (!salt || !expectedHex) return false;
  try {
    const derived = crypto.scryptSync(password, salt, 64);
    const expected = Buffer.from(expectedHex, "hex");
    if (derived.length !== expected.length) return false;
    return crypto.timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

function sha256Hex(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function safeEqualStrings(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

function generateNonce() {
  return crypto.randomBytes(16).toString("base64");
}

function generateToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString("base64url");
}

function shouldTrustProxy() {
  if (process.env.TRUST_PROXY === "1") return true;
  if (process.env.TRUST_PROXY === "0") return false;
  return Boolean(
    process.env.RAILWAY_ENVIRONMENT ||
      process.env.RAILWAY_SERVICE_ID ||
      process.env.RENDER
  );
}

function isHttpsRequest(req) {
  if (process.env.FORCE_SECURE_COOKIE === "1") return true;
  if (req.socket && req.socket.encrypted) return true;
  if (shouldTrustProxy()) {
    const proto = String(req.headers["x-forwarded-proto"] || "")
      .split(",")[0]
      .trim()
      .toLowerCase();
    return proto === "https";
  }
  return false;
}

function getSessionCookieName(req) {
  return isHttpsRequest(req) ? "__Host-td_session" : "td_session";
}

function parseCookies(cookieHeader) {
  const result = Object.create(null);
  if (!cookieHeader || typeof cookieHeader !== "string") return result;
  for (const part of cookieHeader.split(";")) {
    const eqIdx = part.indexOf("=");
    if (eqIdx <= 0) continue;
    const key = part.slice(0, eqIdx).trim();
    const val = part.slice(eqIdx + 1).trim();
    if (key) result[key] = decodeURIComponentSafe(val);
  }
  return result;
}

function decodeURIComponentSafe(val) {
  try {
    return decodeURIComponent(val);
  } catch {
    return val;
  }
}

function buildSessionCookie(req, token, maxAgeSeconds = 28800) {
  const name = getSessionCookieName(req);
  const parts = [
    `${name}=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${maxAgeSeconds}`
  ];
  if (isHttpsRequest(req)) {
    parts.push("Secure");
  }
  return parts.join("; ");
}

function buildClearSessionCookie(req) {
  const cookiesToClear = ["td_session", "__Host-td_session"];
  return cookiesToClear.map((name) => {
    const parts = [
      `${name}=`,
      "Path=/",
      "HttpOnly",
      "SameSite=Lax",
      "Max-Age=0"
    ];
    if (name.startsWith("__Host-") || isHttpsRequest(req)) {
      parts.push("Secure");
    }
    return parts.join("; ");
  });
}

function getClientIp(req) {
  if (shouldTrustProxy()) {
    const fwd = String(req.headers["x-forwarded-for"] || "")
      .split(",")[0]
      .trim();
    if (fwd) return fwd.slice(0, 64);
  }
  return String((req.socket && req.socket.remoteAddress) || "unknown").slice(0, 64);
}

function setCommonHardeningHeaders(req, res) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), geolocation=(), microphone=()");
  res.setHeader("Cross-Origin-Resource-Policy", "same-origin");
  if (isHttpsRequest(req)) {
    res.setHeader("Strict-Transport-Security", "max-age=300; includeSubDomains");
  }
}

function setHtmlSecurityHeaders(req, res, nonce, { cacheControl = "no-cache" } = {}) {
  setCommonHardeningHeaders(req, res);
  res.setHeader(
    "Reporting-Endpoints",
    'csp-endpoint="/api/csp-report", default="/api/csp-report"'
  );
  res.setHeader(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      `script-src 'nonce-${nonce}' 'report-sample'`,
      "style-src 'self' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' blob:",
      "connect-src 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "object-src 'none'",
      "base-uri 'none'",
      "report-to csp-endpoint"
    ].join("; ") + ";"
  );
  res.setHeader(
    "Content-Security-Policy-Report-Only",
    "require-trusted-types-for 'script'; report-to csp-endpoint;"
  );
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  res.setHeader("Cache-Control", cacheControl);
  res.setHeader("Vary", "Sec-Fetch-Dest, Sec-Fetch-Mode, Sec-Fetch-Site, Cookie");
}

function setJsonSecurityHeaders(req, res, { cacheControl = "no-store" } = {}) {
  setCommonHardeningHeaders(req, res);
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", cacheControl);
  res.setHeader("Vary", "Sec-Fetch-Dest, Sec-Fetch-Mode, Sec-Fetch-Site, Origin");
}

function setUploadSecurityHeaders(req, res, mimeType) {
  setCommonHardeningHeaders(req, res);
  res.setHeader("Content-Type", mimeType);
  res.setHeader("Content-Security-Policy", "default-src 'none'; sandbox;");
  res.setHeader("Content-Disposition", "inline");
  res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
}

/**
 * Fetch Metadata + Origin isolation defense.
 * Must run BEFORE auth/session checks so rejected cross-site calls leak zero timing/state.
 */
function checkFetchMetadataAndOrigin(req, res, { isApi = false } = {}) {
  res.setHeader("Vary", "Sec-Fetch-Dest, Sec-Fetch-Mode, Sec-Fetch-Site");

  const site = String(req.headers["sec-fetch-site"] || "").toLowerCase();
  const mode = String(req.headers["sec-fetch-mode"] || "").toLowerCase();
  const dest = String(req.headers["sec-fetch-dest"] || "").toLowerCase();
  const method = String(req.method || "GET").toUpperCase();
  const isMutation = !["GET", "HEAD", "OPTIONS"].includes(method);

  if (site) {
    const strictlySameOrigin = site === "same-origin" || site === "none";
    const allowedNavGet =
      !isApi &&
      !isMutation &&
      site === "cross-site" &&
      mode === "navigate" &&
      method === "GET" &&
      !["object", "embed"].includes(dest);

    if (!strictlySameOrigin && !allowedNavGet) {
      return { ok: false, reason: `Blocked by Fetch Metadata (site=${site}, mode=${mode}, dest=${dest})` };
    }
  }

  // Fallback / additional Origin verification for mutating requests
  if (isMutation) {
    const originHeader = req.headers.origin;
    const hostHeader = req.headers.host;
    if (originHeader && hostHeader) {
      try {
        const parsedOrigin = new URL(originHeader);
        if (parsedOrigin.host !== hostHeader) {
          return { ok: false, reason: `Mismatched Origin (${parsedOrigin.host} vs ${hostHeader})` };
        }
      } catch {
        return { ok: false, reason: "Malformed Origin header" };
      }
    }
  }

  return { ok: true };
}

class RateLimiter {
  constructor() {
    this.buckets = new Map();
    this.lastSweep = Date.now();
  }

  consume(key, maxHits, windowMs) {
    const now = Date.now();
    if (now - this.lastSweep > 60_000) {
      this.sweep(now);
    }

    let bucket = this.buckets.get(key);
    if (!bucket || now - bucket.windowStart >= windowMs) {
      bucket = { windowStart: now, count: 1, windowMs };
      this.buckets.set(key, bucket);
      return { allowed: true, remaining: maxHits - 1, retryAfterSec: 0 };
    }

    if (bucket.count >= maxHits) {
      const retryAfterSec = Math.max(
        1,
        Math.ceil((bucket.windowStart + windowMs - now) / 1000)
      );
      return { allowed: false, remaining: 0, retryAfterSec };
    }

    bucket.count += 1;
    return { allowed: true, remaining: maxHits - bucket.count, retryAfterSec: 0 };
  }

  sweep(now) {
    this.lastSweep = now;
    for (const [key, bucket] of this.buckets.entries()) {
      if (now - bucket.windowStart >= bucket.windowMs) {
        this.buckets.delete(key);
      }
    }
  }
}

function readRequestBody(req, maxBytes) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let total = 0;
    let settled = false;

    req.on("data", (chunk) => {
      if (settled) return;
      total += chunk.length;
      if (total > maxBytes) {
        settled = true;
        const err = new Error("Payload Too Large");
        err.statusCode = 413;
        reject(err);
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });

    req.on("end", () => {
      if (settled) return;
      settled = true;
      resolve(Buffer.concat(chunks));
    });

    req.on("error", (err) => {
      if (settled) return;
      settled = true;
      reject(err);
    });
  });
}

/**
 * Pure Buffer multipart/form-data parser (binary-safe for PNG/JPEG/WebP).
 */
function parseMultipartFormData(bodyBuffer, contentTypeHeader) {
  const ct = String(contentTypeHeader || "");
  const match = ct.match(/multipart\/form-data\s*;\s*boundary=(?:"([^"]+)"|([^;\s]+))/i);
  if (!match) {
    throw Object.assign(new Error("Invalid multipart Content-Type"), { statusCode: 400 });
  }
  const boundary = match[1] || match[2];
  if (!boundary || boundary.length > 120) {
    throw Object.assign(new Error("Invalid multipart boundary"), { statusCode: 400 });
  }

  const delimiter = Buffer.from(`--${boundary}`, "latin1");
  const headerEndMarker = Buffer.from("\r\n\r\n", "latin1");
  const fields = Object.create(null);
  const files = Object.create(null);

  let pos = bodyBuffer.indexOf(delimiter);
  if (pos === -1) {
    throw Object.assign(new Error("Missing multipart boundary"), { statusCode: 400 });
  }

  let partCount = 0;
  while (pos !== -1) {
    pos += delimiter.length;

    // Closing boundary `--`
    if (bodyBuffer[pos] === 0x2d && bodyBuffer[pos + 1] === 0x2d) {
      break;
    }

    // Skip CRLF after delimiter
    if (bodyBuffer[pos] === 0x0d && bodyBuffer[pos + 1] === 0x0a) {
      pos += 2;
    } else if (bodyBuffer[pos] === 0x0a) {
      pos += 1;
    }

    const nextDelim = bodyBuffer.indexOf(delimiter, pos);
    if (nextDelim === -1) break;

    partCount += 1;
    if (partCount > 20) {
      throw Object.assign(new Error("Too many multipart fields"), { statusCode: 400 });
    }

    const headerEnd = bodyBuffer.indexOf(headerEndMarker, pos);
    if (headerEnd === -1 || headerEnd > nextDelim) {
      pos = nextDelim;
      continue;
    }

    const rawHeaders = bodyBuffer.subarray(pos, headerEnd).toString("latin1");
    let dataStart = headerEnd + 4;
    let dataEnd = nextDelim;
    if (dataEnd >= dataStart + 2 && bodyBuffer[dataEnd - 2] === 0x0d && bodyBuffer[dataEnd - 1] === 0x0a) {
      dataEnd -= 2;
    } else if (dataEnd >= dataStart + 1 && bodyBuffer[dataEnd - 1] === 0x0a) {
      dataEnd -= 1;
    }

    const dispMatch = rawHeaders.match(/content-disposition\s*:[^\r\n]*\bname="([^"]+)"/i);
    if (dispMatch) {
      const fieldName = dispMatch[1];
      const fileMatch = rawHeaders.match(/\bfilename="([^"]*)"/i);
      const typeMatch = rawHeaders.match(/content-type\s*:\s*([^\r\n;]+)/i);
      const partBuf = bodyBuffer.subarray(dataStart, dataEnd);

      if (fileMatch) {
        files[fieldName] = {
          filename: path.basename(fileMatch[1]),
          declaredType: typeMatch ? typeMatch[1].trim().toLowerCase() : "",
          data: partBuf
        };
      } else {
        fields[fieldName] = partBuf.toString("utf8");
      }
    }

    pos = nextDelim;
  }

  return { fields, files };
}

/**
 * Magic-bytes verifier & real image dimension extractor (PNG, JPEG, WebP ONLY).
 * Blocks SVG, HTML, polyglot fake images, and zero/oversized images.
 */
function inspectImageMagicBytes(buf) {
  if (!Buffer.isBuffer(buf) || buf.length < 24 || buf.length > 5 * 1024 * 1024) {
    return null;
  }

  // Reject HTML/SVG-looking lead bytes cleanly
  const leadAscii = buf.subarray(0, Math.min(buf.length, 64)).toString("utf8").trimStart().toLowerCase();
  if (leadAscii.startsWith("<svg") || leadAscii.startsWith("<?xml") || leadAscii.startsWith("<html") || leadAscii.startsWith("<!doctype")) {
    return null;
  }

  // 1. PNG: 89 50 4E 47 0D 0A 1A 0A + IHDR
  if (
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47 &&
    buf[4] === 0x0d &&
    buf[5] === 0x0a &&
    buf[6] === 0x1a &&
    buf[7] === 0x0a &&
    buf.subarray(12, 16).toString("ascii") === "IHDR"
  ) {
    const width = buf.readUInt32BE(16);
    const height = buf.readUInt32BE(20);
    if (width >= 1 && width <= 10000 && height >= 1 && height <= 10000) {
      return { ext: ".png", mime: "image/png", width, height };
    }
    return null;
  }

  // 2. JPEG: FF D8 FF
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    let offset = 2;
    while (offset + 4 <= buf.length) {
      if (buf[offset] !== 0xff) break;
      while (offset < buf.length && buf[offset] === 0xff) offset += 1;
      if (offset >= buf.length) break;
      const marker = buf[offset];
      offset += 1;

      if (marker === 0xd9 || marker === 0xda) break;
      if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd8)) continue;
      if (offset + 2 > buf.length) break;

      const segLen = buf.readUInt16BE(offset);
      if (segLen < 2 || offset + segLen > buf.length) break;

      const isSof =
        (marker >= 0xc0 && marker <= 0xc3) ||
        (marker >= 0xc5 && marker <= 0xc7) ||
        (marker >= 0xc9 && marker <= 0xcb) ||
        (marker >= 0xcd && marker <= 0xcf);

      if (isSof && offset + 7 <= buf.length) {
        const height = buf.readUInt16BE(offset + 3);
        const width = buf.readUInt16BE(offset + 5);
        if (width >= 1 && width <= 10000 && height >= 1 && height <= 10000) {
          return { ext: ".jpg", mime: "image/jpeg", width, height };
        }
        return null;
      }

      offset += segLen;
    }
    return null;
  }

  // 3. WebP: RIFF....WEBP
  if (
    buf.length >= 30 &&
    buf.subarray(0, 4).toString("ascii") === "RIFF" &&
    buf.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    const chunk = buf.subarray(12, 16).toString("ascii");
    if (chunk === "VP8 " && buf[23] === 0x9d && buf[24] === 0x01 && buf[25] === 0x2a) {
      const width = buf.readUInt16LE(26) & 0x3fff;
      const height = buf.readUInt16LE(28) & 0x3fff;
      if (width >= 1 && width <= 10000 && height >= 1 && height <= 10000) {
        return { ext: ".webp", mime: "image/webp", width, height };
      }
    } else if (chunk === "VP8L" && buf[20] === 0x2f) {
      const b0 = buf[21];
      const b1 = buf[22];
      const b2 = buf[23];
      const b3 = buf[24];
      const width = 1 + (b0 | ((b1 & 0x3f) << 8));
      const height = 1 + (((b1 & 0xc0) >> 6) | (b2 << 2) | ((b3 & 0x0f) << 10));
      if (width >= 1 && width <= 10000 && height >= 1 && height <= 10000) {
        return { ext: ".webp", mime: "image/webp", width, height };
      }
    } else if (chunk === "VP8X") {
      const width = 1 + (buf[24] | (buf[25] << 8) | (buf[26] << 16));
      const height = 1 + (buf[27] | (buf[28] << 8) | (buf[29] << 16));
      if (width >= 1 && width <= 10000 && height >= 1 && height <= 10000) {
        return { ext: ".webp", mime: "image/webp", width, height };
      }
    }
    return null;
  }

  return null;
}

function resolveSafeSubpath(baseDir, requestedRelPath) {
  const safeBase = path.resolve(baseDir);
  const candidate = path.resolve(safeBase, requestedRelPath);
  if (candidate !== safeBase && !candidate.startsWith(safeBase + path.sep)) {
    return null;
  }
  return candidate;
}

module.exports = {
  escapeHtml,
  sanitizePlainText,
  sanitizeSearchQuery,
  hashPassword,
  verifyPassword,
  sha256Hex,
  safeEqualStrings,
  generateNonce,
  generateToken,
  isHttpsRequest,
  getSessionCookieName,
  parseCookies,
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
};

"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const crypto = require("node:crypto");
const { createAppServer } = require("../server");
const { initDatabase } = require("../src/db");

function buildValidPngBuffer(width = 32, height = 24) {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 2; // RGB
  const ihdrLen = Buffer.alloc(4);
  ihdrLen.writeUInt32BE(13, 0);
  const ihdrType = Buffer.from("IHDR", "ascii");
  const ihdrCrc = Buffer.alloc(4); // Minimal fixture for magic bytes + dimensions
  const iend = Buffer.from([0, 0, 0, 0, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82]);
  return Buffer.concat([signature, ihdrLen, ihdrType, ihdrData, ihdrCrc, iend]);
}

function buildValidJpegBuffer(width = 1280, height = 720) {
  // Standard SOI + JFIF APP0 (18 bytes) + SOF0 (11 bytes) + EOI (2 bytes) = 33 bytes
  const soi = Buffer.from([0xff, 0xd8]);
  const app0 = Buffer.from([
    0xff, 0xe0, 0x00, 0x10,
    0x4a, 0x46, 0x49, 0x46, 0x00,
    0x01, 0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00
  ]);
  const sof0 = Buffer.alloc(11);
  sof0[0] = 0xff;
  sof0[1] = 0xc0;
  sof0.writeUInt16BE(9, 2); // segLen
  sof0[4] = 8; // precision
  sof0.writeUInt16BE(height, 5);
  sof0.writeUInt16BE(width, 7);
  sof0[9] = 3; // components
  const eoi = Buffer.from([0xff, 0xd9]);
  return Buffer.concat([soi, app0, sof0, eoi]);
}

function buildValidWebpBuffer(width = 960, height = 540) {
  const buf = Buffer.alloc(30);
  buf.write("RIFF", 0, "ascii");
  buf.writeUInt32LE(22, 4);
  buf.write("WEBP", 8, "ascii");
  buf.write("VP8X", 12, "ascii");
  buf.writeUInt32LE(10, 16);
  const wMinus1 = width - 1;
  const hMinus1 = height - 1;
  buf[24] = wMinus1 & 0xff;
  buf[25] = (wMinus1 >> 8) & 0xff;
  buf[26] = (wMinus1 >> 16) & 0xff;
  buf[27] = hMinus1 & 0xff;
  buf[28] = (hMinus1 >> 8) & 0xff;
  buf[29] = (hMinus1 >> 16) & 0xff;
  return buf;
}

function buildMultipartPayload(fields, fileField) {
  const boundary = `----TestBoundary${crypto.randomBytes(6).toString("hex")}`;
  const parts = [];

  for (const [key, val] of Object.entries(fields)) {
    parts.push(
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="${key}"\r\n\r\n${val}\r\n`,
        "utf8"
      )
    );
  }

  if (fileField) {
    parts.push(
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="${fileField.name}"; filename="${fileField.filename}"\r\nContent-Type: ${fileField.mime}\r\n\r\n`,
        "utf8"
      )
    );
    parts.push(fileField.data);
    parts.push(Buffer.from("\r\n", "utf8"));
  }

  parts.push(Buffer.from(`--${boundary}--\r\n`, "utf8"));
  return {
    boundary,
    body: Buffer.concat(parts)
  };
}

async function runTests() {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "td-nro-test-"));
  const testDataDir = path.join(tempDir, "data");
  const testUploadsDir = path.join(tempDir, "uploads");
  const adminPass = "TestStrongPass@2026";

  const { server } = createAppServer({
    dataDir: testDataDir,
    uploadsDir: testUploadsDir,
    dbPath: path.join(testDataDir, "shop.db"),
    adminUser: "thanhdung",
    adminPass
  });

  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    console.log("1. Testing Multi-Path HTML Routes & Namek Jade Lock & CSP Nonce...");
    const routes = [
      {
        path: "/",
        mustInclude: [
          "THANH DUNG NRO",
          "viewport-fit=cover",
          'data-palette="namek-jade"',
          "0368018920",
          "Tài khoản chính chủ",
          "Kích điểm",
          "Dịch Vụ Bán Vàng",
          "Dịch Vụ Bán Ngọc",
          "GDTG Uy Tín",
          "/kich-diem",
          "/mua-item",
          "/mua-tai-khoan"
        ]
      },
      { path: "/kich-diem", mustInclude: ["300.000 đ / lượt", "810.000 đ / gói", "Thuê Set Thần", "GDTG 20/24", "Không nhận giao dịch"] },
      {
        path: "/mua-item",
        mustInclude: [
          'id="item-table-body"',
          'id="bang-gia-item"',
          'id="vang-ngoc"',
          'id="kich-manh"',
          'id="inline-order-summary"',
          "x99 Cuồng nộ",
          "15.000 đ / x99",
          "x99 Bổ huyết",
          "x99 Giáp Xên bọ hung",
          "x99 Máy dò Capsule kì bí",
          "Dùi đục",
          "Vàng tươi (x15)",
          "Vàng die (x60)",
          "Ngọc kí (x11)",
          "Ngọc vé (x10)",
          "Sao pha lê đỏ",
          "Sao pha lê lam",
          "Sao pha lê vàng",
          "Sao pha lê lục",
          "Ngọc Rồng 3 sao",
          "Hút 5% HP",
          "Hút 5% KI",
          "+5% vàng rơi",
          "+5% TNSM",
          "Bảng Thông Tin Các Loại Mảnh",
          "Mảnh Đội trưởng Vàng",
          "10 mảnh",
          "30 mảnh",
          "Mảnh Rồng thần Namếc",
          "3 mảnh",
          "15 mảnh",
          "Mảnh Khỉ Oozaru",
          "125 mảnh"
        ],
        mustNotInclude: [
          'id="catalog-grid"',
          'id="calc-spl-fieldset"',
          'data-category="vang-ngoc"',
          'data-item-id="gold-fresh"',
          'data-item-id="gem-ve"'
        ]
      },
      {
        path: "/mua-tai-khoan",
        mustInclude: [
          "Acc Đậu thần cấp 5",
          "Acc Clone 340k SM",
          "Kho Tài Khoản NRO",
          "Trái Đất",
          "Namếc",
          "Xayda",
          'id="acc-lightbox-stage"',
          'id="acc-zoom-in-btn"',
          'id="acc-zoom-out-btn"',
          'id="acc-lightbox-expand-btn"'
        ]
      },
      {
        path: "/admin",
        mustInclude: ["Quản Trị Shop Thanh Dung", "Trạng Thái Thanh Toán", "login-username", "login-password", '<meta name="robots" content="noindex, nofollow">'],
        mustNotInclude: ['value="thanhdung"', 'id="admin-item-form"', 'id="admin-items-table"', 'id="admin-services-table"', 'id="acc-edit-dialog"'],
        isAdminRoute: true
      }
    ];

    const forbiddenUiJargon = [
      "Anti-Tamper",
      "SHA-256",
      "Namek Jade",
      "Uy Tín SP123",
      "Fetch Metadata",
      "HttpOnly",
      "magic bytes",
      "Backend",
      "Frontend",
      "(icon TeaMobi chính gốc)",
      "Kho đầy đủ Cuồng nộ",
      "TeaMobi",
      "(ID 441)",
      "(ID 442)",
      "(ID 446)",
      "(ID 447)",
      "ID 718",
      "(NR 3s)",
      "(BH)",
      "(GX)",
      "(MD CSKB)",
      "(Có SLL)",
      "(SLL)",
      "copy-full-post-btn",
      "Sao chép bảng giá tổng"
    ];

    const publicHiddenAdminTokens = [
      'href="/admin"',
      "Quản trị",
      "Đăng Nhập Quản Trị",
      "Đăng Nhập Up Acc",
      "toggle-admin-acc-panel",
      'id="quan-ly-acc"',
      'id="admin-item-form"',
      'id="admin-items-table"',
      'id="admin-services-table"',
      'id="acc-edit-dialog"'
    ];

    const seenNonces = new Set();
    for (const r of routes) {
      const resp = await fetch(`${baseUrl}${r.path}`);
      assert.equal(resp.status, 200, `${r.path} should return 200`);
      const csp = resp.headers.get("content-security-policy") || "";
      assert.match(csp, /script-src 'nonce-([^']+)' 'report-sample'/, `Missing nonce CSP on ${r.path}`);
      assert.match(csp, /frame-ancestors 'none'/, `Missing frame-ancestors none on ${r.path}`);
      assert.match(csp, /object-src 'none'/, `Missing object-src none on ${r.path}`);
      assert.equal(resp.headers.get("x-content-type-options"), "nosniff");
      assert.equal(resp.headers.get("x-frame-options"), "DENY");
      assert.equal(resp.headers.get("cross-origin-opener-policy"), "same-origin-allow-popups");
      if (r.isAdminRoute) {
        assert.equal(resp.headers.get("x-robots-tag"), "noindex, nofollow", "/admin must send X-Robots-Tag noindex");
      }

      const nonceMatch = csp.match(/script-src 'nonce-([^']+)'/);
      seenNonces.add(nonceMatch[1]);

      const html = await resp.text();
      assert(!html.includes("demo-theme-bar"), `Palette demo bar should be removed on ${r.path}`);
      assert(!html.includes("dragon-gold"), `Old palette should be locked out on ${r.path}`);
      for (const jargon of forbiddenUiJargon) {
        assert(!html.toLowerCase().includes(jargon.toLowerCase()), `Forbidden UI jargon "${jargon}" leaked on ${r.path}`);
      }
      if (!r.isAdminRoute) {
        for (const adminToken of publicHiddenAdminTokens) {
          assert(!html.includes(adminToken), `Hidden admin UI/link "${adminToken}" leaked on public route ${r.path}`);
        }
      }
      if (r.mustNotInclude) {
        for (const banned of r.mustNotInclude) {
          assert(!html.includes(banned), `Route ${r.path} should not include deprecated markup: ${banned}`);
        }
      }
      assert(html.includes(`nonce="${nonceMatch[1]}"`), `HTML script tags should stamp matching nonce on ${r.path}`);
      for (const token of r.mustInclude) {
        assert(html.includes(token), `Route ${r.path} missing expected content: ${token}`);
      }
    }
    assert.equal(seenNonces.size, routes.length, "Each HTML response must receive a unique cryptographic nonce");

    console.log("2. Testing Frontend Zero-DOM-Sink Hygiene, CSS Balance, Static Assets & Traversal Protection...");
    const appJs = fs.readFileSync(path.join(__dirname, "..", "public", "app.js"), "utf8");
    for (const sink of [".innerHTML", ".outerHTML", "insertAdjacentHTML", "document.write(", "eval("]) {
      assert(!appJs.includes(sink), `Dangerous sink found in public/app.js: ${sink}`);
    }
    assert(!appJs.includes("copy-full-post-btn"), "Removed full ad post copy handler must stay absent from app.js");
    const stylesCss = fs.readFileSync(path.join(__dirname, "..", "public", "styles.css"), "utf8");
    let cssDepth = 0;
    let cssMinDepth = 0;
    for (let i = 0; i < stylesCss.length; i += 1) {
      if (stylesCss[i] === "{") cssDepth += 1;
      else if (stylesCss[i] === "}") {
        cssDepth -= 1;
        if (cssDepth < cssMinDepth) cssMinDepth = cssDepth;
      }
    }
    assert.equal(cssDepth, 0, "public/styles.css must have balanced braces");
    assert.equal(cssMinDepth, 0, "public/styles.css must never drop below depth 0");
    assert(stylesCss.includes("--target-size: 44px"), "styles.css must include touch target sizing");
    assert(stylesCss.includes("env(safe-area-inset-bottom"), "styles.css must pad mobile UI for safe-area insets");

    for (const staticOk of [
      { url: "/styles.css", ct: "text/css" },
      { url: "/app.js", ct: "application/javascript" },
      { url: "/assets/favicon.svg", ct: "image/svg+xml" },
      { url: "/assets/hero-shenron.jpg", ct: "image/jpeg" },
      { url: "/assets/qr-mb-thanhdung.jpg", ct: "image/jpeg" },
      { url: "/api/health", ct: "application/json" }
    ]) {
      const resp = await fetch(`${baseUrl}${staticOk.url}`);
      assert.equal(resp.status, 200, `${staticOk.url} should return 200`);
      assert((resp.headers.get("content-type") || "").includes(staticOk.ct), `${staticOk.url} unexpected Content-Type`);
    }

    const headHealth = await fetch(`${baseUrl}/api/health`, { method: "HEAD" });
    assert.equal(headHealth.status, 200, "HEAD /api/health should return 200");

    const trailingResp = await fetch(`${baseUrl}/kich-diem/`, { redirect: "manual" });
    assert.equal(trailingResp.status, 301, "Trailing slash should 301 redirect cleanly");
    assert.equal(trailingResp.headers.get("location"), "/kich-diem");

    for (const forbiddenPath of ["/server.js", "/package.json", "/.env", "/src/db.js", "/assets/../../server.js", "/uploads/evil.html"]) {
      const resp = await fetch(`${baseUrl}${forbiddenPath}`);
      assert([403, 404].includes(resp.status), `Sensitive/invalid path ${forbiddenPath} must not be served cleanly (got ${resp.status})`);
    }

    console.log("3. Testing Shop Config Integrity & Signature Endpoint...");
    const shopDataResp = await fetch(`${baseUrl}/api/shop-data`);
    assert.equal(shopDataResp.status, 200);
    const shopData = await shopDataResp.json();
    assert.equal(shopData.bank.accountNumber, "0368018920");
    assert.equal(shopData.bank.accountOwner, "NGUYỄN HOÀNG THANH DUNG");
    assert.equal(shopData.contacts.facebookUrl, "https://www.facebook.com/Thanhdungg.Kem");
    assert.equal(shopData.contacts.zaloUrl, "https://zalo.me/84368018920");
    assert.equal(shopData.integrity.ok, true, "QR integrity SHA-256 must verify clean");
    assert(shopData.fullAdPost.includes("Sao pha lê 4 loại"), "Full ad post should list clean 4 SPL types");
    assert(shopData.fullAdPost.includes("Ngọc Rồng 3 sao"), "Full ad post should list NR 3 sao");
    assert(shopData.fullAdPost.includes("10/125/125"), "Full ad post should list Manh Khi tiers");
    assert(!shopData.fullAdPost.includes("ID 718"), "Full ad post should not contain internal ID notes");
    assert(!shopData.fullAdPost.includes("441"), "Full ad post should not contain SPL ID notes");

    console.log("4. Testing Fetch Metadata Isolation & Auth Gates...");
    const crossSiteAttempt = await fetch(`${baseUrl}/api/accounts`, {
      method: "POST",
      headers: { "Sec-Fetch-Site": "cross-site", "Sec-Fetch-Mode": "cors" }
    });
    assert.equal(crossSiteAttempt.status, 403, "Cross-site POST must be blocked before auth");

    const unauthPost = await fetch(`${baseUrl}/api/accounts`, {
      method: "POST",
      headers: { "Sec-Fetch-Site": "same-origin" }
    });
    assert.equal(unauthPost.status, 401, "Unauthenticated POST /api/accounts must return 401");

    const badLogin = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "thanhdung", password: "wrong-password" })
    });
    assert.equal(badLogin.status, 401);

    console.log("5. Testing Admin Login, Cookie Flags & CSRF Protection...");
    const goodLogin = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "thanhdung", password: adminPass })
    });
    assert.equal(goodLogin.status, 200);
    const setCookieHeader = goodLogin.headers.get("set-cookie") || "";
    assert(setCookieHeader.includes("td_session="), "Expected session cookie");
    assert(setCookieHeader.includes("HttpOnly"), "Cookie must be HttpOnly");
    assert(setCookieHeader.includes("SameSite=Lax"), "Cookie must be SameSite=Lax");

    const sessionCookie = setCookieHeader.split(";")[0];
    const loginJson = await goodLogin.json();
    assert(loginJson.csrfToken && loginJson.csrfToken.length >= 20, "CSRF token required");

    console.log("6. Testing Malicious File Upload Rejection (SVG XSS & Spoofed MIME)...");
    const fakeSvgPayload = buildMultipartPayload(
      {
        title: "Acc Test XSS",
        price_vnd: "500000",
        server_name: "SP1",
        planet: "Namếc",
        note: "Test note"
      },
      {
        name: "image",
        filename: "avatar.png",
        mime: "image/png",
        data: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"><script>alert(1)</script></svg>')
      }
    );

    const rejectedUpload = await fetch(`${baseUrl}/api/accounts`, {
      method: "POST",
      headers: {
        Cookie: sessionCookie,
        "X-CSRF-Token": loginJson.csrfToken,
        "Content-Type": `multipart/form-data; boundary=${fakeSvgPayload.boundary}`
      },
      body: fakeSvgPayload.body
    });
    assert.equal(rejectedUpload.status, 400, "Spoofed SVG XSS upload must be rejected with 400");

    const badCsrfUpload = await fetch(`${baseUrl}/api/accounts`, {
      method: "POST",
      headers: {
        Cookie: sessionCookie,
        "X-CSRF-Token": "forged-csrf-token",
        "Content-Type": `multipart/form-data; boundary=${fakeSvgPayload.boundary}`
      },
      body: fakeSvgPayload.body
    });
    assert.equal(badCsrfUpload.status, 403, "Invalid CSRF token must be rejected with 403");

    console.log("7. Testing Real PNG Account Upload, Stored XSS Escaping, Status Patch & Delete...");
    const xssPayloadNote = 'Full set <script>alert("xss")</script> & link http://evil.test\nBông tai c2 + SK5';
    const validPng = buildValidPngBuffer(640, 400);
    const validPayload = buildMultipartPayload(
      {
        title: 'Acc Namếc <img src=x onerror=alert(1)> VIP',
        price_vnd: "750000",
        server_name: "SP1",
        planet: "Namếc",
        note: xssPayloadNote
      },
      {
        name: "image",
        filename: "hero-acc.png",
        mime: "image/png",
        data: validPng
      }
    );

    const uploadResp = await fetch(`${baseUrl}/api/accounts`, {
      method: "POST",
      headers: {
        Cookie: sessionCookie,
        "X-CSRF-Token": loginJson.csrfToken,
        "Content-Type": `multipart/form-data; boundary=${validPayload.boundary}`
      },
      body: validPayload.body
    });
    assert.equal(uploadResp.status, 201, "Valid PNG account upload should return 201");
    const uploadJson = await uploadResp.json();
    const acc = uploadJson.account;
    assert.equal(acc.server_name, "SP1");
    assert.equal(acc.planet, "Namếc");
    assert.equal(acc.price_vnd, 750000);
    assert.equal(acc.image_width, 640);
    assert.equal(acc.image_height, 400);
    assert.match(acc.image_path, /^\/uploads\/[0-9a-f-]{36}\.png$/);

    // Verify served uploaded image has hardened headers
    const imgResp = await fetch(`${baseUrl}${acc.image_path}`);
    assert.equal(imgResp.status, 200);
    assert.equal(imgResp.headers.get("content-type"), "image/png");
    assert.equal(imgResp.headers.get("x-content-type-options"), "nosniff");
    assert.match(imgResp.headers.get("content-security-policy") || "", /default-src 'none'; sandbox;/);

    // Verify SSR /mua-tai-khoan escapes injected HTML tags safely!
    const accPageResp = await fetch(`${baseUrl}/mua-tai-khoan`);
    const accPageHtml = await accPageResp.text();
    assert(!accPageHtml.includes('<script>alert("xss")</script>'), "Raw <script> tag must NEVER appear unescaped in SSR HTML");
    assert(!accPageHtml.includes('<img src=x onerror=alert(1)>'), "Raw <img> XSS tag must NEVER appear unescaped in SSR HTML");
    assert(accPageHtml.includes("&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;"), "Ad note must be HTML-escaped safely");
    assert(accPageHtml.includes(acc.code));

    // Verify server/planet filter API
    const filterResp = await fetch(`${baseUrl}/api/accounts?server=SP1&planet=${encodeURIComponent("Namếc")}`);
    const filterJson = await filterResp.json();
    assert.equal(filterJson.accounts.length, 1);

    // Update status -> sold
    const patchResp = await fetch(`${baseUrl}/api/accounts/${acc.id}`, {
      method: "PATCH",
      headers: {
        Cookie: sessionCookie,
        "X-CSRF-Token": loginJson.csrfToken,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ status: "sold" })
    });
    assert.equal(patchResp.status, 200);
    const patchJson = await patchResp.json();
    assert.equal(patchJson.account.status, "sold");

    // SQL injection filter probe returns 0 without crashing
    const sqliResp = await fetch(`${baseUrl}/api/accounts?server=${encodeURIComponent("' OR '1'='1")}`);
    assert.equal(sqliResp.status, 200);
    const sqliJson = await sqliResp.json();
    assert.equal(sqliJson.accounts.length, 0);

    // JPEG & WebP magic bytes + dimensions validation
    const jpgPayload = buildMultipartPayload(
      { title: "Acc Xayda Test JPG", price_vnd: "1200000", server_name: "SP2", planet: "Xayda", note: "Set full thần linh" },
      { name: "image", filename: "acc.jpg", mime: "image/jpeg", data: buildValidJpegBuffer(1280, 720) }
    );
    const jpgResp = await fetch(`${baseUrl}/api/accounts`, {
      method: "POST",
      headers: { Cookie: sessionCookie, "X-CSRF-Token": loginJson.csrfToken, "Content-Type": `multipart/form-data; boundary=${jpgPayload.boundary}` },
      body: jpgPayload.body
    });
    assert.equal(jpgResp.status, 201);
    const jpgJson = await jpgResp.json();
    assert.equal(jpgJson.account.image_width, 1280);
    assert.equal(jpgJson.account.image_height, 720);
    assert.match(jpgJson.account.image_path, /\.jpg$/);

    const webpPayload = buildMultipartPayload(
      { title: "Acc Trái Đất WebP", price_vnd: "950000", server_name: "Server 1", planet: "Trái Đất", note: "SK5 + Bông tai c2" },
      { name: "image", filename: "acc.webp", mime: "image/webp", data: buildValidWebpBuffer(960, 540) }
    );
    const webpResp = await fetch(`${baseUrl}/api/accounts`, {
      method: "POST",
      headers: { Cookie: sessionCookie, "X-CSRF-Token": loginJson.csrfToken, "Content-Type": `multipart/form-data; boundary=${webpPayload.boundary}` },
      body: webpPayload.body
    });
    assert.equal(webpResp.status, 201);
    const webpJson = await webpResp.json();
    assert.equal(webpJson.account.image_width, 960);
    assert.equal(webpJson.account.image_height, 540);
    assert.match(webpJson.account.image_path, /\.webp$/);

    // Verify audit log & CSP report endpoint work seamlessly
    const cspPost = await fetch(`${baseUrl}/api/csp-report`, {
      method: "POST",
      headers: { "Content-Type": "application/csp-report" },
      body: JSON.stringify({
        "csp-report": {
          "blocked-uri": "https://evil.example/inject.js?token=secret",
          "violated-directive": "script-src",
          "document-uri": "http://127.0.0.1/mua-item?debug=1",
          "script-sample": "alert(1)"
        }
      })
    });
    assert.equal(cspPost.status, 204);

    const auditResp = await fetch(`${baseUrl}/api/admin/audit`, {
      headers: { Cookie: sessionCookie }
    });
    assert.equal(auditResp.status, 200);
    const auditJson = await auditResp.json();
    assert(auditJson.auditLogs.length >= 2, "Audit logs must record login & upload actions");
    assert(auditJson.cspReports.length === 1, "CSP reports must be stored");
    assert(!auditJson.cspReports[0].blocked_uri.includes("secret"), "Query strings must be stripped from CSP report URIs");

    const authedAdminPage = await fetch(`${baseUrl}/admin`, {
      headers: { Cookie: sessionCookie }
    });
    assert.equal(authedAdminPage.status, 200);
    const authedAdminHtml = await authedAdminPage.text();
    assert(authedAdminHtml.includes("Lịch Sử Đăng Nhập"));
    assert(authedAdminHtml.includes("Cảnh Báo Bất Thường"));
    assert(authedAdminHtml.includes('id="admin-item-form"'));
    assert(authedAdminHtml.includes('id="admin-items-table"'));
    assert(authedAdminHtml.includes('id="admin-services-table"'));
    assert(authedAdminHtml.includes('id="acc-edit-dialog"'));
    assert(authedAdminHtml.includes("acc-save-price-btn"));
    assert(authedAdminHtml.includes("acc-edit-btn"));
    for (const jargon of [...forbiddenUiJargon, "Audit Logs", "CSP Reports"]) {
      assert(!authedAdminHtml.toLowerCase().includes(jargon.toLowerCase()), `Forbidden UI jargon "${jargon}" leaked on authenticated /admin`);
    }

    // Delete account + verify PNG deleted on disk
    const delResp = await fetch(`${baseUrl}/api/accounts/${acc.id}`, {
      method: "DELETE",
      headers: {
        Cookie: sessionCookie,
        "X-CSRF-Token": loginJson.csrfToken
      }
    });
    assert.equal(delResp.status, 200);
    const imgAfterDel = await fetch(`${baseUrl}${acc.image_path}`);
    assert.equal(imgAfterDel.status, 404, "Deleted account image file must be removed from uploads/");

    console.log("9. Testing Admin Shop Item CMS, Live Price Edits & Service Price Updates...");
    const unauthItemPost = await fetch(`${baseUrl}/api/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Hack Item", category: "khac", price: 1000, unit: "cái", desc: "Test" })
    });
    assert.equal(unauthItemPost.status, 401, "Unauthenticated POST /api/items must return 401");

    const badCsrfItemPost = await fetch(`${baseUrl}/api/items`, {
      method: "POST",
      headers: { Cookie: sessionCookie, "X-CSRF-Token": "wrong-token", "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Hack Item", category: "khac", price: 1000, unit: "cái", desc: "Test" })
    });
    assert.equal(badCsrfItemPost.status, 403, "Invalid CSRF token on POST /api/items must return 403");

    const unauthSvcPatch = await fetch(`${baseUrl}/api/services/kik-diem`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ price: 999000 })
    });
    assert.equal(unauthSvcPatch.status, 401, "Unauthenticated PATCH /api/services/* must return 401");

    // Reject spoofed SVG upload on item icon
    const fakeSvgIconPayload = buildMultipartPayload(
      { name: "Item SVG Test", category: "khac", kind: "fixed", price: "15000", unit: "cái", desc: "Test SVG block" },
      { name: "iconFile", filename: "evil.png", mime: "image/png", data: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>') }
    );
    const badIconResp = await fetch(`${baseUrl}/api/items`, {
      method: "POST",
      headers: {
        Cookie: sessionCookie,
        "X-CSRF-Token": loginJson.csrfToken,
        "Content-Type": `multipart/form-data; boundary=${fakeSvgIconPayload.boundary}`
      },
      body: fakeSvgIconPayload.body
    });
    assert.equal(badIconResp.status, 400, "Spoofed SVG upload on /api/items must return 400");

    // Create item via JSON (category "khac" triggers dynamic filter tab + verify XSS escaping)
    const createJsonItemResp = await fetch(`${baseUrl}/api/items`, {
      method: "POST",
      headers: {
        Cookie: sessionCookie,
        "X-CSRF-Token": loginJson.csrfToken,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: "Bông tai Porata <script>alert(1)</script>",
        category: "khac",
        kind: "fixed",
        price: 35000,
        unit: "cái",
        desc: "Tăng chỉ số <img src=x onerror=alert(1)> VIP",
        icon: "/assets/icons/2754.png"
      })
    });
    assert.equal(createJsonItemResp.status, 201);
    const createdJsonItem = (await createJsonItemResp.json()).item;
    assert.equal(createdJsonItem.unitPriceLabel, "35.000 đ / 1 cái");
    assert.equal(createdJsonItem.category, "khac");

    // Create item via multipart + real PNG icon
    const customPngIcon = buildValidPngBuffer(48, 48);
    const createPngItemPayload = buildMultipartPayload(
      {
        name: "Cải trang Broly Admin Test",
        category: "khac",
        kind: "fixed",
        price: "25000",
        unit: "bộ",
        desc: "Item thêm từ Admin kèm icon riêng",
        isActive: "1"
      },
      { name: "iconFile", filename: "broly.png", mime: "image/png", data: customPngIcon }
    );
    const createPngItemResp = await fetch(`${baseUrl}/api/items`, {
      method: "POST",
      headers: {
        Cookie: sessionCookie,
        "X-CSRF-Token": loginJson.csrfToken,
        "Content-Type": `multipart/form-data; boundary=${createPngItemPayload.boundary}`
      },
      body: createPngItemPayload.body
    });
    assert.equal(createPngItemResp.status, 201);
    const pngItem = (await createPngItemResp.json()).item;
    assert.match(pngItem.icon, /^\/uploads\/[0-9a-f-]{36}\.png$/);

    // Public /mua-item must render new items, dynamic "khac" tab, and escape XSS safely
    const muaItemWithNewHtml = await (await fetch(`${baseUrl}/mua-item`)).text();
    assert(muaItemWithNewHtml.includes('data-category="khac"'), "New 'khac' item should activate 'Vật phẩm khác' tab on /mua-item");
    assert(muaItemWithNewHtml.includes("Cải trang Broly Admin Test"));
    assert(muaItemWithNewHtml.includes("35.000 đ / 1 cái"));
    assert(!muaItemWithNewHtml.includes("<script>alert(1)</script>"), "Raw <script> in item name must be escaped on /mua-item");
    assert(!muaItemWithNewHtml.includes("<img src=x onerror=alert(1)>"), "Raw <img> XSS in item desc must be escaped on /mua-item");
    assert(muaItemWithNewHtml.includes("&lt;script&gt;alert(1)&lt;/script&gt;"));

    // Update price inline via PATCH /api/items/:id
    const patchItemPriceResp = await fetch(`${baseUrl}/api/items/${pngItem.dbId}`, {
      method: "PATCH",
      headers: {
        Cookie: sessionCookie,
        "X-CSRF-Token": loginJson.csrfToken,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ price: 42000 })
    });
    assert.equal(patchItemPriceResp.status, 200);
    const updatedPngItem = (await patchItemPriceResp.json()).item;
    assert.equal(updatedPngItem.unitPriceLabel, "42.000 đ / bộ");

    const muaItemUpdatedHtml = await (await fetch(`${baseUrl}/mua-item`)).text();
    assert(muaItemUpdatedHtml.includes("42.000 đ / bộ"), "Updated item price must reflect on /mua-item immediately");

    // Hide item -> excluded from public API and /mua-item, visible only via ?include_hidden=1 while authed
    const hideItemResp = await fetch(`${baseUrl}/api/items/${pngItem.dbId}`, {
      method: "PATCH",
      headers: {
        Cookie: sessionCookie,
        "X-CSRF-Token": loginJson.csrfToken,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ isActive: false })
    });
    assert.equal(hideItemResp.status, 200);
    const pubItemsAfterHide = (await (await fetch(`${baseUrl}/api/items`)).json()).items;
    assert(!pubItemsAfterHide.some((it) => it.dbId === pngItem.dbId), "Hidden item must not appear in public GET /api/items");
    const adminItemsAfterHide = (
      await (await fetch(`${baseUrl}/api/items?include_hidden=1`, { headers: { Cookie: sessionCookie } })).json()
    ).items;
    assert(adminItemsAfterHide.some((it) => it.dbId === pngItem.dbId), "Hidden item must appear for admin include_hidden=1");
    const unauthHiddenProbe = (await (await fetch(`${baseUrl}/api/items?include_hidden=1`)).json()).items;
    assert(!unauthHiddenProbe.some((it) => it.dbId === pngItem.dbId), "Unauthenticated ?include_hidden=1 must ignore flag");

    // Delete both custom items and verify uploaded icon removed from disk
    const delPngItemResp = await fetch(`${baseUrl}/api/items/${pngItem.dbId}`, {
      method: "DELETE",
      headers: { Cookie: sessionCookie, "X-CSRF-Token": loginJson.csrfToken }
    });
    assert.equal(delPngItemResp.status, 200);
    const delIconCheck = await fetch(`${baseUrl}${pngItem.icon}`);
    assert.equal(delIconCheck.status, 404, "Deleted item custom uploaded icon must be removed from uploads/");
    await fetch(`${baseUrl}/api/items/${createdJsonItem.dbId}`, {
      method: "DELETE",
      headers: { Cookie: sessionCookie, "X-CSRF-Token": loginJson.csrfToken }
    });

    // Update service price -> reflected immediately on /kich-diem
    const patchSvcResp = await fetch(`${baseUrl}/api/services/kik-diem`, {
      method: "PATCH",
      headers: {
        Cookie: sessionCookie,
        "X-CSRF-Token": loginJson.csrfToken,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ price: 320000 })
    });
    assert.equal(patchSvcResp.status, 200);
    const patchSvcJson = await patchSvcResp.json();
    assert.equal(patchSvcJson.service.price, 320000);
    assert.equal(patchSvcJson.service.priceText, "320.000 đ / lượt");
    const kichDiemUpdatedHtml = await (await fetch(`${baseUrl}/kich-diem`)).text();
    assert(kichDiemUpdatedHtml.includes("320.000 đ / lượt"), "Updated service price must reflect live on /kich-diem");

    // Update posted account price & title via PATCH /api/accounts/:id -> reflected on /mua-tai-khoan
    const patchJpgAccResp = await fetch(`${baseUrl}/api/accounts/${jpgJson.account.id}`, {
      method: "PATCH",
      headers: {
        Cookie: sessionCookie,
        "X-CSRF-Token": loginJson.csrfToken,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ price_vnd: 1350000, title: "Acc Xayda Đã Sửa Giá" })
    });
    assert.equal(patchJpgAccResp.status, 200);
    const accUpdatedHtml = await (await fetch(`${baseUrl}/mua-tai-khoan`)).text();
    assert(accUpdatedHtml.includes("1.350.000 đ"));
    assert(accUpdatedHtml.includes("Acc Xayda Đã Sửa Giá"));

    // Logout clears session cookie
    const logoutResp = await fetch(`${baseUrl}/api/auth/logout`, {
      method: "POST",
      headers: {
        Cookie: sessionCookie,
        "X-CSRF-Token": loginJson.csrfToken
      }
    });
    assert.equal(logoutResp.status, 200);
    assert.match(logoutResp.headers.get("clear-site-data") || "", /"cookies"/);

    const meAfterLogout = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Cookie: sessionCookie }
    });
    const meJson = await meAfterLogout.json();
    assert.equal(meJson.authenticated, false);

    console.log("8. Testing Railway Volume Auto-Mapping & Proxy HTTPS Cookie Hardening...");
    const railwayMountDir = path.join(tempDir, "railway-storage");
    const prevEnv = {
      RAILWAY_VOLUME_MOUNT_PATH: process.env.RAILWAY_VOLUME_MOUNT_PATH,
      RAILWAY_ENVIRONMENT: process.env.RAILWAY_ENVIRONMENT,
      TRUST_PROXY: process.env.TRUST_PROXY,
      DATA_DIR: process.env.DATA_DIR,
      UPLOADS_DIR: process.env.UPLOADS_DIR
    };
    delete process.env.DATA_DIR;
    delete process.env.UPLOADS_DIR;
    process.env.RAILWAY_VOLUME_MOUNT_PATH = railwayMountDir;
    process.env.RAILWAY_ENVIRONMENT = "production";
    delete process.env.TRUST_PROXY;

    const rwInstance = createAppServer({ adminUser: "thanhdung", adminPass });
    try {
      assert.equal(rwInstance.dataDir, path.join(railwayMountDir, "data"));
      assert.equal(rwInstance.uploadsDir, path.join(railwayMountDir, "uploads"));
      assert(fs.existsSync(path.join(railwayMountDir, "data", "shop.db")), "SQLite DB should initialize inside Railway volume");

      await new Promise((resolve) => rwInstance.server.listen(0, "127.0.0.1", resolve));
      const rwPort = rwInstance.server.address().port;
      const rwLogin = await fetch(`http://127.0.0.1:${rwPort}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Forwarded-Proto": "https"
        },
        body: JSON.stringify({ username: "thanhdung", password: adminPass })
      });
      assert.equal(rwLogin.status, 200);
      const rwCookie = rwLogin.headers.get("set-cookie") || "";
      assert(rwCookie.includes("__Host-td_session="), "Railway HTTPS proxy must elevate cookie to __Host-td_session");
      assert(rwCookie.includes("; Secure"), "Railway HTTPS proxy must enforce Secure cookie flag");
      assert.match(rwLogin.headers.get("strict-transport-security") || "", /max-age=31536000/, "Railway HTTPS proxy must set 1-year HSTS header");

      const hostCookieValue = rwCookie.split(";")[0].split("=").slice(1).join("=");
      const downgradeAuth = await fetch(`http://127.0.0.1:${rwPort}/api/auth/me`, {
        headers: {
          "X-Forwarded-Proto": "https",
          Cookie: `td_session=${hostCookieValue}`
        }
      });
      assert.equal((await downgradeAuth.json()).authenticated, false, "HTTPS requests must reject legacy non-__Host session cookie");

      const strictAuth = await fetch(`http://127.0.0.1:${rwPort}/api/auth/me`, {
        headers: {
          "X-Forwarded-Proto": "https",
          Cookie: `__Host-td_session=${hostCookieValue}`
        }
      });
      assert.equal((await strictAuth.json()).authenticated, true, "HTTPS requests must accept __Host-td_session cookie");

      process.env.TRUST_PROXY = "0";
      const untrustedLogin = await fetch(`http://127.0.0.1:${rwPort}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Forwarded-Proto": "https"
        },
        body: JSON.stringify({ username: "thanhdung", password: adminPass })
      });
      const untrustedCookie = untrustedLogin.headers.get("set-cookie") || "";
      assert(!untrustedCookie.includes("__Host-td_session="), "TRUST_PROXY=0 must ignore spoofed X-Forwarded-Proto");
    } finally {
      rwInstance.server.closeAllConnections();
      await new Promise((resolve) => rwInstance.server.close(resolve));
      for (const [k, v] of Object.entries(prevEnv)) {
        if (v === undefined) delete process.env[k];
        else process.env[k] = v;
      }
    }

    console.log("10. Testing Open Redirect Defense, JSON Null/Array Guards, Price=0 Quote, Brute-Force Lock & Session Rotation...");
    for (const evilPath of ["/%2fevil.com/", "///evil.com/", "/%5cevil.com/"]) {
      const redirProbe = await fetch(`${baseUrl}${evilPath}`, { redirect: "manual" });
      assert.equal(redirProbe.status, 400, `Open-redirect path ${evilPath} must return 400`);
      assert.equal(redirProbe.headers.get("location"), null, `Path ${evilPath} must never emit Location redirect header`);
    }

    // Re-login after logout for authenticated regression checks
    const freshLogin = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "thanhdung", password: adminPass })
    });
    assert.equal(freshLogin.status, 200);
    const freshCookie = (freshLogin.headers.get("set-cookie") || "").split(";")[0];
    const freshCsrf = (await freshLogin.json()).csrfToken;

    const svcZeroResp = await fetch(`${baseUrl}/api/services/kik-diem`, {
      method: "PATCH",
      headers: {
        Cookie: freshCookie,
        "X-CSRF-Token": freshCsrf,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ price: 0 })
    });
    assert.equal(svcZeroResp.status, 200);
    const svcZeroJson = await svcZeroResp.json();
    assert.equal(svcZeroJson.service.price, 0);
    assert.equal(svcZeroJson.service.priceText, "Báo giá theo yêu cầu");

    for (const badPayload of ["null", "[]", '"str"', "123"]) {
      const badAccPatch = await fetch(`${baseUrl}/api/accounts/${jpgJson.account.id}`, {
        method: "PATCH",
        headers: { Cookie: freshCookie, "X-CSRF-Token": freshCsrf, "Content-Type": "application/json" },
        body: badPayload
      });
      assert.equal(badAccPatch.status, 400, `PATCH /api/accounts with JSON ${badPayload} must return 400`);

      const badSvcPatch = await fetch(`${baseUrl}/api/services/kik-diem`, {
        method: "PATCH",
        headers: { Cookie: freshCookie, "X-CSRF-Token": freshCsrf, "Content-Type": "application/json" },
        body: badPayload
      });
      assert.equal(badSvcPatch.status, 400, `PATCH /api/services with JSON ${badPayload} must return 400`);

      const badItemPost = await fetch(`${baseUrl}/api/items`, {
        method: "POST",
        headers: { Cookie: freshCookie, "X-CSRF-Token": freshCsrf, "Content-Type": "application/json" },
        body: badPayload
      });
      assert.equal(badItemPost.status, 400, `POST /api/items with JSON ${badPayload} must return 400`);

      const badLoginPayload = await fetch(`${baseUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: badPayload
      });
      assert.equal(badLoginPayload.status, 400, `POST /api/auth/login with JSON ${badPayload} must return 400`);
    }

    // Distributed brute-force across distinct IPs against single username must trigger 429
    const bruteMount = path.join(tempDir, "brute-data");
    const prevTrust = process.env.TRUST_PROXY;
    process.env.TRUST_PROXY = "1";
    const bruteApp = createAppServer({
      dataDir: bruteMount,
      uploadsDir: path.join(tempDir, "brute-uploads"),
      dbPath: path.join(bruteMount, "shop.db"),
      adminUser: "bruteadmin",
      adminPass: "InitialPass#2026"
    });
    try {
      await new Promise((resolve) => bruteApp.server.listen(0, "127.0.0.1", resolve));
      const bPort = bruteApp.server.address().port;
      let hitRateLimit = false;
      for (let i = 1; i <= 15; i += 1) {
        const resp = await fetch(`http://127.0.0.1:${bPort}/api/auth/login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Forwarded-For": `203.0.113.${i}`
          },
          body: JSON.stringify({ username: "bruteadmin", password: "wrong" })
        });
        if (resp.status === 429) {
          hitRateLimit = true;
          break;
        }
      }
      assert(hitRateLimit, "Distributed per-username login attempts must trigger 429 rate limit");
    } finally {
      bruteApp.server.closeAllConnections();
      await new Promise((resolve) => bruteApp.server.close(resolve));
      if (prevTrust === undefined) delete process.env.TRUST_PROXY;
      else process.env.TRUST_PROXY = prevTrust;
    }

    // Password rotation on DB restart must revoke all existing admin sessions
    const rotDbPath = path.join(tempDir, "rot.db");
    const store1 = initDatabase({ dbPath: rotDbPath, adminUser: "rotadmin", adminPass: "PassOne@2026" });
    const rotAdmin = store1.verifyAdminLogin("rotadmin", "PassOne@2026");
    assert(rotAdmin);
    const oldSess = store1.createSession(rotAdmin.id, "test");
    assert(store1.getSessionByToken(oldSess.rawToken));
    store1.close();

    const store2 = initDatabase({ dbPath: rotDbPath, adminUser: "rotadmin", adminPass: "PassTwo@2026" });
    assert.equal(store2.getSessionByToken(oldSess.rawToken), null, "Rotating ADMIN_PASS must revoke pre-existing sessions");
    assert(store2.verifyAdminLogin("rotadmin", "PassTwo@2026"));
    store2.close();

    console.log("ALL MULTI-PATH, ACCOUNT UPLOAD, RAILWAY & SECURITY TESTS PASSED!");
  } finally {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

runTests().catch((err) => {
  console.error("TEST FAILED:", err);
  process.exit(1);
});

"use strict";

const {
  OFFICIAL_CONTACTS,
  OFFICIAL_BANK,
  ALLOWED_PLANETS,
  ALLOWED_SERVERS,
  KICH_DIEM_SERVICES,
  ITEM_CARDS,
  ITEM_PRICE_ROWS,
  STARTER_ACCS,
  CONFIG_SHA256
} = require("./config");
const { escapeHtml } = require("./security");

const ROUTE_META = {
  "/": {
    title: "Shop Ngọc Rồng Online Thanh Dung | Kích Điểm, Mua Item, Mua Bán Acc",
    description:
      "Shop game Ngọc Rồng Online Thanh Dung chính chủ tone Namek Xanh Ngọc: Kích điểm 300k, Nạp CR 810k done 3s, Kho Item x99 - Đá NC - Vàng Ngọc SPL, Mua bán Tài khoản có ảnh xác thực, GDTG 20/24."
  },
  "/kich-diem": {
    title: "Kích Điểm 300k · Nạp CR 810k · Thuê Set · Săn Đệ · GDTG 20/24 | Thanh Dung NRO",
    description:
      "Chuyên mục Kích điểm 300.000 đ, Nạp CR 810.000 đ done 3s, Thuê Set Thần 3 hành tinh / Set SMTN 5s 10.000 đ/ngày, Săn Đệ SS Skill 5, GDTG 20/24, Thu All Acc & Rút VTS Tín dụng."
  },
  "/mua-item": {
    title: "Mua Item NRO · Cuồng Nộ, BH, GX, Đá NC, Vàng, Ngọc, SPL | Thanh Dung NRO",
    description:
      "Bảng giá chi tiết Item x99 Cuồng nộ, Bổ huyết, Giáp Xên, Máy dò CSKB, 5 loại Đá nâng cấp x999, Dùi đục SLL, Vàng tươi x15 / die x60, Ngọc kí x11 / Ngọc vé x10 (ID 718), SPL, NR 3s, Mảnh Đội trưởng Vàng & Máy tính 2 chiều."
  },
  "/mua-tai-khoan": {
    title: "Mua Bán Tài Khoản Ngọc Rồng Online · SP123 & All Server | Thanh Dung NRO",
    description:
      "Mua bán tài khoản Ngọc Rồng Online uy tín: Acc Đậu 5 8.000 đ, Acc Clone 340k SM 3.000 đ, Kho Acc NRO đủ server Trái Đất / Namếc / Xayda kèm ảnh chi tiết & giá công khai."
  },
  "/admin": {
    title: "Quản Trị Đăng Acc & Kiểm Tra Bảo Mật Chính Chủ | Thanh Dung NRO",
    description:
      "Bảng điều khiển quản trị Shop Ngọc Rồng Online Thanh Dung: Đăng bán tài khoản kèm ảnh, kiểm tra SHA-256 chính chủ & nhật ký bảo mật."
  }
};

function formatVndServer(amount) {
  if (!amount || amount <= 0) return "Liên hệ";
  return `${new Intl.NumberFormat("vi-VN").format(amount)} đ`;
}

function renderIconsGroup(icons) {
  return icons
    .map(
      (icon) => `
      <span class="item-slot" title="${escapeHtml(icon.alt)}">
        <img src="${escapeHtml(icon.src)}" alt="${escapeHtml(icon.alt)}" width="${Number(icon.width)}" height="${Number(icon.height)}" loading="lazy" class="game-sprite">
      </span>`
    )
    .join("");
}

function renderNavLinks(activePath, extraClass = "") {
  const links = [
    { href: "/", label: "Trang chủ" },
    { href: "/kich-diem", label: "Kích điểm & Dịch vụ" },
    { href: "/mua-item", label: "Mua Item & Tính đơn" },
    { href: "/mua-tai-khoan", label: "Mua Tài khoản" },
    { href: "/admin", label: "Quản trị" }
  ];

  return `<ul class="nav-list ${escapeHtml(extraClass)}">
    ${links
      .map((item) => {
        const current = item.href === activePath ? ' aria-current="page" class="is-current"' : "";
        return `<li><a href="${item.href}"${current}>${escapeHtml(item.label)}</a></li>`;
      })
      .join("")}
  </ul>`;
}

function renderVerifiedBankSection(integrity) {
  const qrImgMarkup = integrity.qrValid
    ? `<img
        src="${escapeHtml(OFFICIAL_BANK.qrImageUrl)}"
        alt="Mã QR chuyển khoản MB Bank chính chủ ${escapeHtml(OFFICIAL_BANK.accountOwner)} STK ${escapeHtml(OFFICIAL_BANK.accountNumber)}"
        width="682"
        height="1024"
        loading="lazy"
        data-verified-role="qr-img"
        class="qr-img"
      >`
    : `<div class="integrity-alert" role="alert">
        <strong>Cảnh báo toàn vẹn tệp QR!</strong>
        <span>Ảnh mã QR trên máy chủ không khớp chữ ký SHA-256 chính chủ. Tạm khóa hiển thị QR — vui lòng đối chiếu trực tiếp STK bên cạnh và nhắn Zalo chính chủ.</span>
      </div>`;

  return `
    <section id="thanh-toan" class="bank-section">
      <div class="container">
        <div class="section-head">
          <div>
            <span class="eyebrow">Xác minh chuyển khoản chính chủ</span>
            <h2>Mã QR &amp; Số Tài Khoản Ngân Hàng Duy Nhất</h2>
            <p class="pretty-text">
              Cảnh giác giả mạo! Shop <strong>chỉ sử dụng duy nhất 1 tài khoản MB Bank</strong> được khóa cứng từ máy chủ dưới đây — luôn đối chiếu đúng tên chủ tài khoản trước khi chuyển tiền.
            </p>
          </div>
          <span class="pill pill-jade integrity-pill" id="integrity-badge">
            <span class="dot-live" aria-hidden="true"></span>
            Xác thực máy chủ: ${integrity.ok ? "Toàn vẹn SHA-256" : "Cần kiểm tra QR"}
          </span>
        </div>

        <div class="bank-grid">
          <div class="bank-info-card">
            <div class="bank-badge-row">
              <span class="pill pill-gold">${escapeHtml(OFFICIAL_BANK.bankName)}</span>
              <span class="pill pill-jade">Khóa cứng Anti-Tamper</span>
            </div>

            <h3>Thông Tin Chuyển Khoản Chính Thức</h3>

            <dl class="bank-details-list">
              <div class="bank-detail-row">
                <dt>Ngân hàng</dt>
                <dd><strong>${escapeHtml(OFFICIAL_BANK.bankName)}</strong></dd>
              </div>
              <div class="bank-detail-row">
                <dt>Chủ tài khoản</dt>
                <dd class="bank-copy-line">
                  <strong class="bank-owner" data-verified-role="bank-owner">${escapeHtml(OFFICIAL_BANK.accountOwner)}</strong>
                  <button type="button" class="btn btn-outline btn-sm copy-btn verified-bank-copy" data-copy-target="owner" data-copy="${escapeHtml(OFFICIAL_BANK.accountOwner)}" data-label="tên chủ TK ${escapeHtml(OFFICIAL_BANK.accountOwner)}">Copy tên</button>
                </dd>
              </div>
              <div class="bank-detail-row bank-row-highlight">
                <dt>Số tài khoản (STK)</dt>
                <dd class="bank-copy-line">
                  <strong class="bank-stk mono-num" data-verified-role="bank-stk">${escapeHtml(OFFICIAL_BANK.accountNumber)}</strong>
                  <button type="button" class="btn btn-primary btn-sm copy-btn verified-bank-copy" data-copy-target="stk" data-copy="${escapeHtml(OFFICIAL_BANK.accountNumber)}" data-label="số tài khoản MB Bank ${escapeHtml(OFFICIAL_BANK.accountNumber)}">Copy STK</button>
                </dd>
              </div>
              <div class="bank-detail-row">
                <dt>Nội dung CK gợi ý</dt>
                <dd><code>Tên FB / Zalo + Mã Acc hoặc Dịch vụ</code> (nhắn bill ngay sau khi CK)</dd>
              </div>
            </dl>

            <ul class="bank-verify-list">
              <li><strong>Đối chiếu tên:</strong> App ngân hàng phải hiện đúng tên <code>${escapeHtml(OFFICIAL_BANK.accountOwner)}</code>. Mọi tài khoản tên khác đều là giả mạo.</li>
              <li><strong>Trùng SĐT Zalo:</strong> STK <code>${escapeHtml(OFFICIAL_BANK.accountNumber)}</code> trùng khớp hoàn toàn với Zalo chính chủ <code>${escapeHtml(OFFICIAL_CONTACTS.zaloDisplay)}</code>.</li>
              <li><strong>Chống sửa link/STK:</strong> Toàn bộ thông tin thanh toán được khóa bất biến phía Backend và kiểm tra chéo liên tục ở Frontend.</li>
            </ul>

            <div class="bank-cta-row">
              <button type="button" class="btn btn-primary copy-btn verified-bank-copy" data-copy-target="stk" data-copy="${escapeHtml(OFFICIAL_BANK.accountNumber)}" data-label="số tài khoản ${escapeHtml(OFFICIAL_BANK.accountNumber)}">Sao chép STK: ${escapeHtml(OFFICIAL_BANK.accountNumber)}</button>
              <a href="${escapeHtml(OFFICIAL_CONTACTS.zaloUrl)}" target="_blank" rel="noopener noreferrer" data-verified-role="zalo-link" class="btn btn-secondary">Gửi bill Zalo</a>
              <a href="${escapeHtml(OFFICIAL_CONTACTS.facebookUrl)}" target="_blank" rel="noopener noreferrer" data-verified-role="fb-link" class="btn btn-outline">Gửi bill Facebook</a>
            </div>
          </div>

          <div class="qr-showcase-card">
            <div class="qr-frame">
              ${qrImgMarkup}
            </div>
            <div class="qr-caption-box">
              <p class="qr-caption-text">Quét trực tiếp bằng app ngân hàng / MoMo hoặc tải ảnh mã QR về máy để quét từ thư viện.</p>
              ${
                integrity.qrValid
                  ? `<a href="${escapeHtml(OFFICIAL_BANK.qrImageUrl)}" download="${escapeHtml(OFFICIAL_BANK.qrDownloadName)}" class="btn btn-outline btn-full">Tải ảnh mã QR chính chủ</a>`
                  : ""
              }
            </div>
          </div>
        </div>
      </div>
    </section>
  `;
}

function renderContactsSection() {
  return `
    <section id="lien-he" class="contact-section">
      <div class="container">
        <div class="section-head">
          <div>
            <span class="eyebrow">Xác minh chính chủ</span>
            <h2>Liên Hệ &amp; Cộng Đồng Thanh Dung</h2>
            <p class="pretty-text">Cảnh giác tài khoản giả mạo! Chỉ giao dịch qua đúng 4 đường dẫn chính thức đã khóa xác thực dưới đây.</p>
          </div>
        </div>

        <ul class="contact-grid" role="list">
          <li class="contact-card">
            <span class="contact-type">Zalo Cá Nhân Chính Chủ</span>
            <h3>Zalo Thanh Dung</h3>
            <p class="contact-handle mono-num">${escapeHtml(OFFICIAL_CONTACTS.zaloDisplay)}</p>
            <p class="contact-url">zalo.me/84368018920</p>
            <div class="contact-actions">
              <a href="${escapeHtml(OFFICIAL_CONTACTS.zaloUrl)}" target="_blank" rel="noopener noreferrer" data-verified-role="zalo-link" class="btn btn-primary">Mở Zalo ngay</a>
              <button type="button" class="btn btn-outline copy-btn" data-copy-target="zaloRawPhone" data-copy="${escapeHtml(OFFICIAL_CONTACTS.zaloRawPhone)}" data-label="số Zalo ${escapeHtml(OFFICIAL_CONTACTS.zaloRawPhone)}">Copy SĐT</button>
            </div>
          </li>

          <li class="contact-card">
            <span class="contact-type">Facebook Cá Nhân Chính Chủ</span>
            <h3>Thanh Dung (Kem)</h3>
            <p class="contact-handle">${escapeHtml(OFFICIAL_CONTACTS.facebookHandle)}</p>
            <p class="contact-url">Inbox mua bán, GDTG, thu acc</p>
            <div class="contact-actions">
              <a href="${escapeHtml(OFFICIAL_CONTACTS.facebookUrl)}" target="_blank" rel="noopener noreferrer" data-verified-role="fb-link" class="btn btn-primary">Inbox Facebook</a>
              <button type="button" class="btn btn-outline copy-btn" data-copy-target="facebookUrl" data-copy="${escapeHtml(OFFICIAL_CONTACTS.facebookUrl)}" data-label="link Facebook chính chủ">Copy Link</button>
            </div>
          </li>

          <li class="contact-card">
            <span class="contact-type">Nhóm Chat Zalo</span>
            <h3>Link Box Zalo SP1</h3>
            <p class="contact-handle">${escapeHtml(OFFICIAL_CONTACTS.zaloBoxSp1Display)}</p>
            <p class="contact-url">Cập nhật kèo, hàng mới, GDTG nhanh</p>
            <div class="contact-actions">
              <a href="${escapeHtml(OFFICIAL_CONTACTS.zaloBoxSp1Url)}" target="_blank" rel="noopener noreferrer" data-verified-role="box-sp1" class="btn btn-secondary">Vào Box SP1</a>
              <button type="button" class="btn btn-outline copy-btn" data-copy-target="zaloBoxSp1Url" data-copy="${escapeHtml(OFFICIAL_CONTACTS.zaloBoxSp1Url)}" data-label="link Box Zalo SP1">Copy Link</button>
            </div>
          </li>

          <li class="contact-card">
            <span class="contact-type">Group Cộng Đồng Facebook</span>
            <h3>Group SP123 Thanh Dung</h3>
            <p class="contact-handle">ID: ${escapeHtml(OFFICIAL_CONTACTS.fbGroupSp123Id)}</p>
            <p class="contact-url">Giao lưu, check uy tín &amp; mua bán SP123</p>
            <div class="contact-actions">
              <a href="${escapeHtml(OFFICIAL_CONTACTS.fbGroupSp123Url)}" target="_blank" rel="noopener noreferrer" data-verified-role="group-sp123" class="btn btn-secondary">Vào Group FB</a>
              <button type="button" class="btn btn-outline copy-btn" data-copy-target="fbGroupSp123Url" data-copy="${escapeHtml(OFFICIAL_CONTACTS.fbGroupSp123Url)}" data-label="link Group SP123 Thanh Dung">Copy Link</button>
            </div>
          </li>
        </ul>
      </div>
    </section>
  `;
}

function renderProductCard(item, { showDayPicker = false } = {}) {
  const iconsMarkup = renderIconsGroup(item.icons);
  const tagClass = item.tagClass ? ` ${item.tagClass}` : "";

  let actionsMarkup = "";
  if (item.anchorHref) {
    actionsMarkup = `
      <a href="${escapeHtml(item.anchorHref)}" class="btn btn-card-add">${escapeHtml(item.anchorLabel)}</a>
      <a href="${escapeHtml(OFFICIAL_CONTACTS.zaloUrl)}" target="_blank" rel="noopener noreferrer" data-verified-role="zalo-link" class="btn btn-card-link">Mua ngay</a>
    `;
  } else {
    actionsMarkup = `
      <button type="button" class="btn btn-card-add" data-id="${escapeHtml(item.id)}" data-name="${escapeHtml(item.orderName)}" data-price="${Number(item.price)}" data-unit="${escapeHtml(item.unit)}">
        ${item.price > 0 ? "+ Thêm vào đơn" : "+ Ghi vào đơn"}
      </button>
      <a href="${escapeHtml(OFFICIAL_CONTACTS.zaloUrl)}" target="_blank" rel="noopener noreferrer" data-verified-role="zalo-link" class="btn btn-card-link">${escapeHtml(item.ctaLabel || "Đặt Zalo")}</a>
    `;
  }

  const extraDayPicker = showDayPicker
    ? `<div class="inline-qty-bar">
        <label for="qty-${escapeHtml(item.id)}">Số ngày thuê:</label>
        <div class="item-qty-picker item-qty-row" data-item-id="${escapeHtml(item.id)}" data-item-name="${escapeHtml(item.orderName)}" data-item-price="${Number(item.price)}" data-item-unit="${escapeHtml(item.unit)}">
          <button type="button" class="qty-btn row-dec" aria-label="Giảm số ngày">&minus;</button>
          <input id="qty-${escapeHtml(item.id)}" type="number" class="item-qty-input mono-num" value="1" min="1" max="365" inputmode="numeric">
          <button type="button" class="qty-btn row-inc" aria-label="Tăng số ngày">+</button>
          <span class="mono-num row-subtotal">${escapeHtml(formatVndServer(item.price))}</span>
          <button type="button" class="btn btn-primary btn-sm row-add-btn">+ Thêm</button>
        </div>
      </div>`
    : "";

  return `
    <li class="product-card" data-category="${escapeHtml(item.category || "dich-vu")}" data-keywords="${escapeHtml(item.keywords)}">
      <div class="card-top">
        <span class="cat-badge">${escapeHtml(item.badge)}</span>
        <span class="tag-pill${tagClass}">${escapeHtml(item.tag)}</span>
      </div>
      <div class="card-visual-row">
        <div class="item-slot-group">
          ${iconsMarkup}
        </div>
        <h3>${escapeHtml(item.name)}</h3>
      </div>
      <p class="card-note">${escapeHtml(item.note)}</p>
      ${extraDayPicker}
      <div class="card-price-row">
        <span class="price-main mono-num">${escapeHtml(item.priceText)}</span>
      </div>
      <div class="card-actions">
        ${actionsMarkup}
      </div>
    </li>
  `;
}

function renderAccountCardMarkup(acc, { isAdmin = false } = {}) {
  const isSold = acc.status === "sold";
  const planetSlug =
    acc.planet === "Namếc"
      ? "planet-namek"
      : acc.planet === "Xayda"
        ? "planet-xayda"
        : "planet-earth";

  const adminBar = isAdmin
    ? `<div class="acc-admin-controls">
        <button type="button" class="btn btn-outline btn-sm acc-toggle-status-btn" data-acc-id="${Number(acc.id)}" data-next-status="${isSold ? "available" : "sold"}">
          ${isSold ? "Mở bán lại" : "Đánh dấu Đã bán"}
        </button>
        <button type="button" class="btn btn-danger-outline btn-sm acc-delete-btn" data-acc-id="${Number(acc.id)}" data-acc-code="${escapeHtml(acc.code)}">
          Xóa Acc
        </button>
      </div>`
    : "";

  return `
    <article class="account-card${isSold ? " is-sold" : ""}" data-acc-id="${Number(acc.id)}">
      <button type="button" class="acc-photo-trigger" data-acc-lightbox-id="${Number(acc.id)}" aria-label="Phóng to ảnh ${escapeHtml(acc.title || acc.code)}">
        <img
          src="${escapeHtml(acc.image_path)}"
          alt="Ảnh tài khoản ${escapeHtml(acc.code)} - ${escapeHtml(acc.server_name)} - ${escapeHtml(acc.planet)}"
          width="${Number(acc.image_width)}"
          height="${Number(acc.image_height)}"
          loading="lazy"
          class="acc-photo-img"
        >
        <span class="acc-photo-badge">${isSold ? "ĐÃ BÁN" : "SẴN HÀNG"}</span>
        <span class="acc-zoom-hint">Bấm xem ảnh lớn</span>
      </button>

      <div class="acc-card-body">
        <div class="acc-meta-top">
          <span class="cat-badge mono-num">#${escapeHtml(acc.code)}</span>
          <div class="acc-pills">
            <span class="tag-pill tag-jade">${escapeHtml(acc.server_name)}</span>
            <span class="tag-pill ${planetSlug}">${escapeHtml(acc.planet)}</span>
          </div>
        </div>

        <h3 class="acc-title">${escapeHtml(acc.title)}</h3>
        <p class="acc-note-text">${escapeHtml(acc.note)}</p>

        <div class="card-price-row">
          <span class="price-main mono-num">${escapeHtml(formatVndServer(acc.price_vnd))}</span>
          <span class="price-sub">${isSold ? "Đã giao dịch xong" : "Có thể gửi đơn ngay"}</span>
        </div>

        <div class="card-actions">
          <button
            type="button"
            class="btn btn-card-add acc-order-btn"
            data-id="acc-${Number(acc.id)}"
            data-name="Acc #${escapeHtml(acc.code)} (${escapeHtml(acc.server_name)} · ${escapeHtml(acc.planet)})"
            data-price="${Number(acc.price_vnd)}"
            data-unit="acc"
            ${isSold ? "disabled" : ""}
          >
            ${isSold ? "Đã bán" : "+ Thêm vào đơn"}
          </button>
          <a href="${escapeHtml(OFFICIAL_CONTACTS.zaloUrl)}" target="_blank" rel="noopener noreferrer" data-verified-role="zalo-link" class="btn btn-card-link">Check Acc</a>
        </div>
        ${adminBar}
      </div>
    </article>
  `;
}

function renderHomeView({ latestAccounts, integrity }) {
  const teaserCards =
    latestAccounts.length > 0
      ? `<div class="acc-grid" id="home-acc-teaser">
          ${latestAccounts.slice(0, 3).map((acc) => renderAccountCardMarkup(acc)).join("")}
        </div>`
      : `<div class="empty-state-box">
          <p>Kho Acc Đậu 5 (<code>8.000 đ</code>) &amp; Acc Clone 340k SM (<code>3.000 đ</code>) luôn sẵn số lượng lớn. Xem chi tiết kho Acc hoặc đăng Acc mới tại mục <strong>Mua Tài Khoản</strong>.</p>
          <a href="/mua-tai-khoan" class="btn btn-primary">Mở Kho Tài Khoản NRO</a>
        </div>`;

  return `
    <section id="top" class="hero-section">
      <div class="container hero-grid">
        <div class="hero-copy">
          <div class="hero-pills">
            <span class="pill pill-jade">
              <span class="dot-live" aria-hidden="true"></span>
              Namek Xanh Ngọc · Done 3s
            </span>
            <span class="pill pill-gold">Bảo mật BMTT · Chống giả mạo Link &amp; STK</span>
          </div>

          <h1 class="hero-title">
            Shop Ngọc Rồng Online
            <span class="hero-accent">Thanh Dung SP123</span>
          </h1>

          <p class="hero-desc pretty-text">
            Hệ thống website chính chủ đã phân khu rõ ràng 3 chuyên trang dịch vụ:
            <strong>Kích Điểm &amp; Nạp CR</strong>, <strong>Kho Item &amp; Đá Vàng Ngọc</strong>, và <strong>Mua Bán Tài Khoản NRO</strong> kèm kiểm tra toàn vẹn đường dẫn &amp; STK MB Bank <code>0368018920</code>.
          </p>

          <div class="hero-cta-row">
            <a href="${escapeHtml(OFFICIAL_CONTACTS.zaloUrl)}" target="_blank" rel="noopener noreferrer" data-verified-role="zalo-link" class="btn btn-primary">
              <span>Chat Zalo: ${escapeHtml(OFFICIAL_CONTACTS.zaloDisplay)}</span>
            </a>
            <a href="${escapeHtml(OFFICIAL_CONTACTS.facebookUrl)}" target="_blank" rel="noopener noreferrer" data-verified-role="fb-link" class="btn btn-secondary">
              <span>Inbox Facebook Thanh Dung</span>
            </a>
            <button type="button" id="copy-full-post-btn" class="btn btn-outline">
              <span>Sao chép bảng giá tổng</span>
            </button>
          </div>

          <dl class="hero-metrics">
            <div class="metric-card">
              <dt>Kích điểm / Nạp CR</dt>
              <dd class="mono-num">Done 3s</dd>
            </div>
            <div class="metric-card">
              <dt>Vàng Tươi / Vàng Die</dt>
              <dd class="mono-num">x15 / x60</dd>
            </div>
            <div class="metric-card">
              <dt>Ngọc Kí / Ngọc Vé</dt>
              <dd class="mono-num">x11 / x10</dd>
            </div>
            <div class="metric-card">
              <dt>Trung Gian Uy Tín</dt>
              <dd class="mono-num">GDTG 20/24</dd>
            </div>
          </dl>
        </div>

        <div class="hero-visual">
          <div class="orb-stage">
            <img
              src="/assets/hero-shenron.jpg"
              alt="Rồng Thần Shenron xanh ngọc cùng bảy viên Ngọc Rồng phát sáng trên bệ đá và các viên Capsule đặc trưng"
              width="1200"
              height="896"
              fetchpriority="high"
              class="hero-img"
            >
            <div class="hero-caption-bar">
              <div class="caption-item">
                <span class="caption-label">Nạp Siêu Tốc Done 3s</span>
                <strong class="mono-num">Kích điểm 300.000 đ · Nạp CR 810.000 đ</strong>
              </div>
              <div class="caption-item">
                <span class="caption-label">Cộng Đồng SP123 Chính Chủ</span>
                <strong>Box Zalo SP1 &amp; Group FB Thanh Dung</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="path-hub-section" aria-label="Ba chuyên trang mua bán chính thức">
      <div class="container">
        <div class="section-head">
          <div>
            <span class="eyebrow">Phân khu đường dẫn riêng biệt</span>
            <h2>Chọn Nhanh Chuyên Trang Dịch Vụ NRO</h2>
            <p class="pretty-text">Mỗi mảng bán hàng có đường dẫn riêng biệt, giữ nguyên giỏ đơn tính nhanh xuyên suốt khi bạn chuyển trang.</p>
          </div>
        </div>

        <div class="hub-grid">
          <article class="hub-card">
            <div class="hub-icon-row">
              <span class="item-slot"><img src="/assets/icons/7223.png" alt="" width="72" height="72" class="game-sprite"></span>
              <span class="item-slot"><img src="/assets/icons/5004.png" alt="" width="72" height="72" class="game-sprite"></span>
              <span class="item-slot"><img src="/assets/icons/5007.png" alt="" width="96" height="68" class="game-sprite"></span>
            </div>
            <span class="eyebrow">Path: <code>/kich-diem</code></span>
            <h3>Kích Điểm · Nạp CR · Thuê Set · Săn Đệ &amp; GDTG</h3>
            <p class="pretty-text">Nhận kích điểm 300.000 đ, nạp CR 810.000 đ done 3s, thuê Set Thần 3 hành tinh / SMTN 5s 10.000 đ/ngày, săn đệ SS Skill 5, GDTG 20/24 (ko mail sống), thu all acc &amp; rút VTS.</p>
            <a href="/kich-diem" class="btn btn-primary btn-full">Vào trang Kích Điểm &amp; Dịch Vụ</a>
          </article>

          <article class="hub-card">
            <div class="hub-icon-row">
              <span class="item-slot"><img src="/assets/icons/2754.png" alt="" width="76" height="80" class="game-sprite"></span>
              <span class="item-slot"><img src="/assets/icons/6765.png" alt="" width="72" height="72" class="game-sprite"></span>
              <span class="item-slot"><img src="/assets/icons/8935.png" alt="" width="84" height="84" class="game-sprite"></span>
            </div>
            <span class="eyebrow">Path: <code>/mua-item</code></span>
            <h3>Mua Item x99 · Đá NC · Vàng · Ngọc · SPL &amp; Mảnh</h3>
            <p class="pretty-text">Bảng giá riêng từng loại Item chọn số lượng: Cuồng nộ 15k, BH/GX 10k, MD CSKB 40k, 5 loại Đá NC 20k/999, Dùi đục SLL 10k, Vàng tươi x15 / die x60, Ngọc kí x11 / Ngọc vé x10 (ID 718), Máy tính 2 chiều.</p>
            <a href="/mua-item" class="btn btn-primary btn-full">Vào trang Mua Item &amp; Tính Đơn</a>
          </article>

          <article class="hub-card">
            <div class="hub-icon-row">
              <span class="item-slot"><img src="/assets/icons/241.png" alt="" width="48" height="48" class="game-sprite"></span>
              <span class="item-slot"><img src="/assets/icons/1089.png" alt="" width="48" height="64" class="game-sprite"></span>
              <span class="item-slot"><img src="/assets/icons/15614.png" alt="" width="80" height="80" class="game-sprite"></span>
            </div>
            <span class="eyebrow">Path: <code>/mua-tai-khoan</code></span>
            <h3>Mua Bán Tài Khoản NRO (Có Ảnh Acc &amp; Lọc Server)</h3>
            <p class="pretty-text">Acc Đậu 5 (8.000 đ), Acc Clone 340k SM (3.000 đ) và Kho Tài Khoản NRO đăng bán kèm ảnh thật, giá VNĐ, Server, Hành tinh (Trái Đất / Namếc / Xayda) &amp; ghi chú quảng cáo chi tiết.</p>
            <a href="/mua-tai-khoan" class="btn btn-primary btn-full">Vào Kho Mua Bán Tài Khoản</a>
          </article>
        </div>
      </div>
    </section>

    <section class="catalog-section home-acc-preview">
      <div class="container">
        <div class="section-head">
          <div>
            <span class="eyebrow">Cập nhật mới nhất</span>
            <h2>Tài Khoản NRO Đang Giao Dịch</h2>
            <p class="pretty-text">Các acc nổi bật mới đăng từ khu vực quản trị chính chủ — kiểm tra Server, Hành tinh và thêm thẳng vào đơn gửi Zalo / Facebook.</p>
          </div>
          <a href="/mua-tai-khoan" class="btn btn-outline">Xem toàn bộ Kho Acc &rarr;</a>
        </div>
        ${teaserCards}
      </div>
    </section>

    ${renderVerifiedBankSection(integrity)}
    ${renderContactsSection()}
  `;
}

function renderKichDiemView({ integrity }) {
  const cardsHtml = KICH_DIEM_SERVICES.map((svc) =>
    renderProductCard(svc, { showDayPicker: svc.id === "thue-set" })
  ).join("");

  return `
    <section class="subhero-section">
      <div class="container subhero-inner">
        <div class="hero-pills">
          <span class="pill pill-jade">Path: <code>/kich-diem</code></span>
          <span class="pill pill-gold">Xử lý Done 3s · GDTG 20/24</span>
        </div>
        <h1>Dịch Vụ Kích Điểm · Nạp CR · Thuê Set · Săn Đệ &amp; GDTG</h1>
        <p class="pretty-text">
          Chuyên mục riêng dành cho dịch vụ nạp game siêu tốc, cho thuê Set Thần Linh / SMTN 5s, săn đệ tử SS – Skill 5, làm trung gian GDTG 20/24, thu mua all acc &amp; rút VTS – Tín dụng.
        </p>
        <div class="hero-cta-row">
          <a href="${escapeHtml(OFFICIAL_CONTACTS.zaloUrl)}" target="_blank" rel="noopener noreferrer" data-verified-role="zalo-link" class="btn btn-primary">Nhắn Zalo đặt Kích điểm / CR</a>
          <a href="#thanh-toan" class="btn btn-outline">Xem STK &amp; Mã QR chính chủ</a>
        </div>
      </div>
    </section>

    <section class="catalog-section">
      <div class="container">
        <div class="section-head">
          <div>
            <span class="eyebrow">Bảng dịch vụ trọng điểm</span>
            <h2>Kích Điểm 300k · Nạp CR 810k · Thuê Set · Săn Đệ · GDTG</h2>
            <p class="pretty-text">Bấm <strong>+ Thêm vào đơn</strong> để gom yêu cầu, sau đó gửi tin nhắn trực tiếp sang Facebook hoặc Zalo Thanh Dung.</p>
          </div>
        </div>

        <ul id="catalog-grid" class="catalog-grid" role="list">
          ${cardsHtml}
        </ul>
      </div>
    </section>

    <section class="services-section">
      <div class="container">
        <div class="section-head">
          <div>
            <span class="eyebrow">Quy tắc &amp; cam kết</span>
            <h2>Nguyên Tắc GDTG · Thu Mua &amp; Bảo Mật Khách Hàng</h2>
            <p class="pretty-text">Minh bạch quy định trước khi giao dịch để bảo vệ tài khoản và quyền lợi của cả bên mua lẫn bên bán.</p>
          </div>
        </div>

        <div class="pillars-grid">
          <article class="pillar-card">
            <div class="item-slot" aria-hidden="true">
              <img src="/assets/icons/5007.png" alt="" width="96" height="68" loading="lazy" class="game-sprite">
            </div>
            <h3>GDTG 20/24 Siêu Tốc</h3>
            <p class="pretty-text">Nhận làm trung gian giao dịch acc, đồ, vàng, ngọc hoạt động 20/24 mỗi ngày.</p>
            <ul class="rule-list">
              <li><strong>Thời gian:</strong> Trực chiến 20/24h hàng ngày</li>
              <li><strong>Tốc độ:</strong> Kiểm tra thông tin &amp; bàn giao siêu tốc</li>
              <li class="rule-warn"><strong>Lưu ý quan trọng:</strong> Không nhận giao dịch <u>mail sống</u></li>
            </ul>
          </article>

          <article class="pillar-card">
            <div class="item-slot" aria-hidden="true">
              <img src="/assets/icons/15614.png" alt="" width="80" height="80" loading="lazy" class="game-sprite">
            </div>
            <h3>Thu All Acc + Đồ Tầm Trung &rarr; Siêu Phẩm</h3>
            <p class="pretty-text">Thu mua nhanh tài khoản và đồ VIP toàn server, giải ngân gọn ngay khi chốt kèo.</p>
            <ul class="rule-list">
              <li><strong>Phạm vi:</strong> All acc + đồ tầm trung đến siêu phẩm</li>
              <li><strong>Cam kết:</strong> Bảo mật thông tin (BMTT) 100%</li>
              <li class="rule-warn"><strong>Nguyên tắc:</strong> Ko bắt scam — giao dịch sạch</li>
            </ul>
          </article>

          <article class="pillar-card">
            <div class="item-slot" aria-hidden="true">
              <img src="/assets/icons/15686.png" alt="" width="92" height="92" loading="lazy" class="game-sprite">
            </div>
            <h3>Nhận Rút VTS — Tín Dụng</h3>
            <p class="pretty-text">Hỗ trợ rút Ví Trả Sau (VTS) và thẻ Tín Dụng kín đáo, hỗ trợ nhiệt tình 20/24.</p>
            <ul class="rule-list">
              <li><strong>Hỗ trợ:</strong> Ví Trả Sau (VTS) &amp; Thẻ Tín Dụng</li>
              <li><strong>Bảo mật:</strong> Xử lý kín đáo, an toàn thông tin</li>
              <li><strong>Thủ tục:</strong> Inbox Zalo / FB chính chủ để báo phí</li>
            </ul>
          </article>
        </div>
      </div>
    </section>

    ${renderVerifiedBankSection(integrity)}
  `;
}

function renderMuaItemView({ integrity }) {
  const cardsHtml = ITEM_CARDS.map((item) => renderProductCard(item)).join("");
  const tableRowsHtml = ITEM_PRICE_ROWS.map(
    (row) => `
      <tr class="item-qty-row" data-item-id="${escapeHtml(row.id)}" data-item-name="${escapeHtml(row.name)}" data-item-price="${Number(row.price)}" data-item-unit="${escapeHtml(row.unit)}">
        <td>
          <span class="table-item-cell">
            <img src="${escapeHtml(row.icon)}" alt="${escapeHtml(row.iconAlt)}" width="${Number(row.width)}" height="${Number(row.height)}" loading="lazy" class="table-sprite">
            <span>${escapeHtml(row.name)}</span>
          </span>
        </td>
        <td><span class="row-cat-tag">${escapeHtml(row.group)}</span></td>
        <td class="mono-num"><strong>${escapeHtml(row.unitPriceLabel)}</strong></td>
        <td>
          <div class="item-qty-picker">
            <button type="button" class="qty-btn row-dec" aria-label="Giảm số lượng ${escapeHtml(row.name)}">&minus;</button>
            <input type="number" class="item-qty-input mono-num" value="${Number(row.defaultQty)}" min="1" max="${Number(row.maxQty)}" inputmode="numeric" aria-label="Số lượng ${escapeHtml(row.name)}">
            <button type="button" class="qty-btn row-inc" aria-label="Tăng số lượng ${escapeHtml(row.name)}">+</button>
          </div>
        </td>
        <td class="mono-num row-subtotal">${escapeHtml(formatVndServer(row.price * row.defaultQty))}</td>
        <td><button type="button" class="btn btn-card-add row-add-btn">+ Thêm vào đơn</button></td>
      </tr>
    `
  ).join("");

  return `
    <section class="subhero-section">
      <div class="container subhero-inner">
        <div class="hero-pills">
          <span class="pill pill-jade">Path: <code>/mua-item</code></span>
          <span class="pill pill-gold">Chuẩn Icon TeaMobi · Chọn SL Từng Loại</span>
        </div>
        <h1>Mua Item x99 · Đá Nâng Cấp · Vàng · Ngọc · SPL &amp; Mảnh</h1>
        <p class="pretty-text">
          Kho đầy đủ Cuồng nộ (15k), Bổ huyết / Giáp Xên (10k), Máy dò CSKB (40k), 5 loại Đá NC (20k/999), Dùi đục SLL (10k), Vàng tươi x15 / die x60, Ngọc kí x11 / Ngọc vé x10 (ID 718), SPL, NR 3s và Mảnh Khỉ / Rồng / Đội trưởng Vàng.
        </p>
      </div>
    </section>

    <section id="bang-gia-item" class="item-pricing-section">
      <div class="container">
        <div class="section-head">
          <div>
            <span class="eyebrow">Chọn nhanh theo số lượng</span>
            <h2>Bảng Giá Riêng Các Loại Item &amp; Vật Phẩm</h2>
            <p class="pretty-text">Chọn đúng số lượng từng loại item bạn cần mua rồi bấm <strong>+ Thêm vào đơn</strong> để tự động tính tổng tiền.</p>
          </div>
          <button type="button" id="open-order-from-items-btn" class="btn btn-primary">
            Xem đơn &amp; Gửi FB / Zalo
          </button>
        </div>

        <div class="item-pricing-card">
          <div class="table-scroll">
            <table class="item-pricing-table">
              <caption>Bảng giá niêm yết chi tiết từng loại item (icon TeaMobi chính gốc)</caption>
              <thead>
                <tr>
                  <th scope="col">Loại Item / Vật Phẩm</th>
                  <th scope="col">Nhóm</th>
                  <th scope="col">Đơn Giá</th>
                  <th scope="col">Số Lượng Chọn</th>
                  <th scope="col">Thành Tiền</th>
                  <th scope="col">Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                ${tableRowsHtml}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>

    <section class="catalog-section">
      <div class="container">
        <div class="section-head">
          <div>
            <span class="eyebrow">Lọc &amp; tìm vật phẩm</span>
            <h2>Danh Mục Chi Tiết Từng Nhóm Item</h2>
          </div>
        </div>

        <div class="catalog-controls">
          <search>
            <form id="catalog-search-form" class="search-form" role="search">
              <label for="catalog-search" class="visually-hidden">Tìm item hoặc vật phẩm</label>
              <div class="search-input-wrap">
                <svg class="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                  <circle cx="11" cy="11" r="8"/>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <input
                  type="search"
                  id="catalog-search"
                  name="q"
                  placeholder="Tìm nhanh: cuồng nộ, bổ huyết, giáp xên, cskb, dùi đục, đá nc, đội trưởng vàng, spl, 3s..."
                  autocomplete="off"
                >
                <button type="button" id="clear-search-btn" class="btn-clear-search" hidden aria-label="Xóa từ khóa tìm kiếm">Xóa</button>
              </div>
            </form>
          </search>

          <div class="filter-tabs" role="group" aria-label="Lọc nhóm item">
            <button type="button" class="filter-btn is-active" data-category="all" aria-pressed="true">Tất cả (${ITEM_CARDS.length})</button>
            <button type="button" class="filter-btn" data-category="item-x99" aria-pressed="false">Item x99</button>
            <button type="button" class="filter-btn" data-category="da-duiduc" aria-pressed="false">Đá NC &amp; Dùi đục</button>
            <button type="button" class="filter-btn" data-category="vang-ngoc" aria-pressed="false">Vàng &amp; Ngọc</button>
            <button type="button" class="filter-btn" data-category="spl-manh" aria-pressed="false">SPL · NR 3s · Mảnh</button>
          </div>
        </div>

        <p id="catalog-status" class="catalog-status" aria-live="polite">Đang hiển thị tất cả ${ITEM_CARDS.length} nhóm item &amp; vật phẩm.</p>

        <ul id="catalog-grid" class="catalog-grid" role="list">
          ${cardsHtml}
        </ul>
      </div>
    </section>

    <section id="vang-ngoc" class="rates-section">
      <div class="container rates-grid">
        <div class="rates-table-card">
          <span class="eyebrow">Tỉ giá cập nhật</span>
          <h2>Bảng Quy Đổi Vàng · Ngọc · SPL · NR 3s</h2>
          <p class="pretty-text">Tất cả tỉ lệ giao dịch được niêm yết công khai, rõ ràng để anh em dễ tính toán trước khi nhắn tin.</p>

          <div class="table-scroll">
            <table>
              <caption>Bảng tỉ lệ quy đổi và đơn giá tại Shop Thanh Dung</caption>
              <thead>
                <tr>
                  <th scope="col">Mặt hàng</th>
                  <th scope="col">Tỉ lệ / Đơn giá</th>
                  <th scope="col">Ghi chú</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><span class="table-item-cell"><img src="/assets/icons/4028.png" alt="" width="84" height="36" loading="lazy" class="table-sprite"><span>Thỏi vàng / Vàng Tươi</span></span></td>
                  <td class="mono-num"><strong>x15</strong></td>
                  <td>15 triệu vàng / 1.000 đ</td>
                </tr>
                <tr>
                  <td><span class="table-item-cell"><img src="/assets/icons/930.png" alt="" width="64" height="56" loading="lazy" class="table-sprite"><span>Vàng Die</span></span></td>
                  <td class="mono-num"><strong>x60</strong></td>
                  <td>60 triệu vàng / 1.000 đ</td>
                </tr>
                <tr>
                  <td><span class="table-item-cell"><img src="/assets/icons/932.png" alt="" width="56" height="56" loading="lazy" class="table-sprite"><span>Ngọc Kí</span></span></td>
                  <td class="mono-num"><strong>x11</strong></td>
                  <td>11 ngọc / 1.000 đ (giao ngọc kí)</td>
                </tr>
                <tr>
                  <td><span class="table-item-cell"><img src="/assets/icons/6765.png" alt="Vé tặng ngọc ID 718" width="72" height="72" loading="lazy" class="table-sprite"><span>Ngọc Vé</span></span></td>
                  <td class="mono-num"><strong>x10</strong></td>
                  <td>10 ngọc / 1.000 đ (Vé tặng ngọc ID 718)</td>
                </tr>
                <tr>
                  <td><span class="table-item-cell"><img src="/assets/icons/1420.png" alt="" width="64" height="64" loading="lazy" class="table-sprite"><span>x999 Đá Nâng Cấp</span></span></td>
                  <td class="mono-num"><strong>20.000 đ / 999</strong></td>
                  <td>Lục bảo, Saphia, Ruby, Titan, Thạch anh tím</td>
                </tr>
                <tr>
                  <td><span class="table-item-cell"><img src="/assets/icons/12139.png" alt="" width="80" height="76" loading="lazy" class="table-sprite"><span>Dùi đục</span></span></td>
                  <td class="mono-num"><strong>10.000 đ / 1 cái</strong></td>
                  <td>Có số lượng lớn (SLL)</td>
                </tr>
                <tr>
                  <td><span class="table-item-cell"><img src="/assets/icons/3887.png" alt="" width="64" height="64" loading="lazy" class="table-sprite"><span>Sao pha lê (SPL)</span></span></td>
                  <td class="mono-num"><strong>1.000 đ / 1 viên</strong></td>
                  <td>Đủ các màu chỉ số</td>
                </tr>
                <tr>
                  <td><span class="table-item-cell"><img src="/assets/icons/421.png" alt="" width="64" height="64" loading="lazy" class="table-sprite"><span>Ngọc Rồng 3 sao (NR 3s)</span></span></td>
                  <td class="mono-num"><strong>2.500 đ / 1 viên</strong></td>
                  <td>Sẵn hàng giao nhanh</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="calculator-card">
          <span class="eyebrow">Công cụ tính nhẩm 2 chiều</span>
          <h2>Máy Tính Nhanh Vàng, Ngọc &amp; Vật Phẩm</h2>
          <p class="pretty-text">Chọn <strong>tính theo số tiền</strong> hoặc <strong>tính theo số lượng</strong> muốn mua để xem chi tiết nhận được &amp; thành tiền VNĐ.</p>

          <form id="rate-calc-form" class="calc-form">
            <fieldset class="calc-fieldset">
              <legend>Chế độ tính</legend>
              <div class="mode-pills">
                <label class="radio-pill" for="mode-by-money">
                  <input type="radio" id="mode-by-money" name="calcMode" value="by-money" checked>
                  <span>Theo số tiền (nghìn đ)</span>
                </label>
                <label class="radio-pill" for="mode-by-qty">
                  <input type="radio" id="mode-by-qty" name="calcMode" value="by-qty">
                  <span>Theo số lượng cần mua</span>
                </label>
              </div>
            </fieldset>

            <fieldset class="calc-fieldset">
              <legend>Chọn loại cần tính</legend>
              <div class="radio-pills">
                <label class="radio-pill" for="calc-gold-fresh">
                  <input type="radio" id="calc-gold-fresh" name="calcType" value="gold-fresh" checked>
                  <img src="/assets/icons/4028.png" alt="" width="84" height="36" loading="lazy" class="pill-sprite">
                  <span>Vàng tươi (x15)</span>
                </label>
                <label class="radio-pill" for="calc-gold-die">
                  <input type="radio" id="calc-gold-die" name="calcType" value="gold-die">
                  <img src="/assets/icons/930.png" alt="" width="64" height="56" loading="lazy" class="pill-sprite">
                  <span>Vàng die (x60)</span>
                </label>
                <label class="radio-pill" for="calc-gem-ki">
                  <input type="radio" id="calc-gem-ki" name="calcType" value="gem-ki">
                  <img src="/assets/icons/932.png" alt="" width="56" height="56" loading="lazy" class="pill-sprite">
                  <span>Ngọc kí (x11)</span>
                </label>
                <label class="radio-pill" for="calc-gem-ve">
                  <input type="radio" id="calc-gem-ve" name="calcType" value="gem-ve">
                  <img src="/assets/icons/6765.png" alt="Vé tặng ngọc ID 718" width="72" height="72" loading="lazy" class="pill-sprite">
                  <span>Ngọc vé (x10)</span>
                </label>
                <label class="radio-pill" for="calc-spl">
                  <input type="radio" id="calc-spl" name="calcType" value="spl">
                  <img src="/assets/icons/3887.png" alt="" width="64" height="64" loading="lazy" class="pill-sprite">
                  <span>SPL · 1.000 đ / 1v</span>
                </label>
                <label class="radio-pill" for="calc-nr3s">
                  <input type="radio" id="calc-nr3s" name="calcType" value="nr3s">
                  <img src="/assets/icons/421.png" alt="" width="64" height="64" loading="lazy" class="pill-sprite">
                  <span>NR 3s · 2.500 đ / 1v</span>
                </label>
              </div>
            </fieldset>

            <div class="field-group">
              <label id="calc-input-label" for="calc-amount">Số tiền dự kiến mua (nghìn VNĐ, ví dụ 100 = 100.000 đ)</label>
              <input
                type="number"
                id="calc-amount"
                name="calcInput"
                min="1"
                max="1000000"
                step="1"
                value="100"
                inputmode="numeric"
                required
              >
              <span id="calc-input-hint" class="field-hint">Nhập số tiền theo đơn vị nghìn đồng (ví dụ 50 = 50.000 đ, 100 = 100.000 đ).</span>
            </div>

            <div class="calc-output" aria-live="polite">
              <span id="calc-output-label" class="calc-output-label">Ước tính nhận được:</span>
              <strong id="calc-result-main" class="mono-num">1.500 triệu vàng</strong>
              <span id="calc-result-sub" class="calc-output-sub">Tương ứng 100.000 đ theo tỉ lệ Vàng tươi x15</span>
            </div>

            <button type="button" id="add-calc-to-order" class="btn btn-primary btn-full">
              + Thêm mục này vào đơn tính nhanh
            </button>
          </form>
        </div>
      </div>
    </section>

    ${renderVerifiedBankSection(integrity)}
  `;
}

function renderAdminAuthAndUploadSection({ session, showToggleNote = true }) {
  const loginBlock = `
    <div id="admin-auth-box" class="admin-panel-card"${session ? " hidden" : ""}>
      <div class="section-head compact-head">
        <div>
          <span class="eyebrow">Xác thực chủ shop</span>
          <h2>Đăng Nhập Quản Trị Để Up Hình &amp; Đăng Bán Acc</h2>
          <p class="pretty-text">Chỉ chủ shop có phiên đăng nhập hợp lệ (<code>HttpOnly</code> + CSRF + <code>Fetch Metadata</code>) mới được phép tải ảnh và đăng bán tài khoản mới.</p>
        </div>
      </div>

      <form id="admin-login-form" class="secure-form" method="POST" action="/api/auth/login">
        <div class="form-row-2">
          <div class="field-group">
            <label for="login-username">Tên đăng nhập quản trị</label>
            <input type="text" id="login-username" name="username" autocomplete="username" maxlength="40" required value="thanhdung">
          </div>

          <div class="field-group">
            <label for="login-password">Mật khẩu quản trị</label>
            <div class="password-input-wrap">
              <input type="password" id="login-password" name="password" autocomplete="current-password" maxlength="128" required>
              <button type="button" id="toggle-password-btn" class="btn btn-outline btn-sm" aria-pressed="false" aria-label="Hiện mật khẩu">
                Hiện
              </button>
            </div>
          </div>
        </div>

        <p id="admin-login-error" class="form-error" role="alert" hidden></p>

        <div class="form-actions-row">
          <button type="submit" id="admin-login-submit" class="btn btn-primary">Đăng nhập Chủ Shop</button>
        </div>
      </form>
    </div>
  `;

  const serverOptions = ALLOWED_SERVERS.map(
    (sv) => `<option value="${escapeHtml(sv)}">${escapeHtml(sv)}</option>`
  ).join("");

  const planetRadios = ALLOWED_PLANETS.map(
    (planet, idx) => `
      <label class="radio-pill" for="upload-planet-${idx}">
        <input type="radio" id="upload-planet-${idx}" name="planet" value="${escapeHtml(planet)}"${idx === 0 ? " checked" : ""}>
        <span>${escapeHtml(planet)}</span>
      </label>
    `
  ).join("");

  const uploadBlock = `
    <div id="admin-upload-box" class="admin-panel-card"${session ? "" : " hidden"}>
      <div class="section-head compact-head">
        <div>
          <span class="eyebrow">Đăng Acc NRO Chính Chủ</span>
          <h2>Up Hình Acc · Giá · Server · Hành Tinh · Ghi Chú Quảng Cáo</h2>
          <p class="pretty-text">
            Ảnh upload được kiểm tra chữ ký nhị phân (<code>PNG / JPG / WebP</code> tối đa 5MB), đổi tên UUID ngẫu nhiên và tự loại bỏ nguy cơ chèn mã độc SVG/HTML.
          </p>
        </div>
        <div class="admin-session-bar">
          <span class="pill pill-jade">Đang đăng nhập: <strong id="admin-session-user">${escapeHtml(session ? session.username : "")}</strong></span>
          <button type="button" id="admin-logout-btn" class="btn btn-outline btn-sm">Đăng xuất</button>
        </div>
      </div>

      <form id="account-upload-form" class="secure-form" method="POST" action="/api/accounts" enctype="multipart/form-data">
        <div class="upload-grid">
          <div class="upload-drop-col">
            <label for="acc-image-input">Ảnh chụp tài khoản NRO (PNG / JPG / WebP, tối đa 5MB) <span class="req-star">*</span></label>
            <input
              type="file"
              id="acc-image-input"
              name="image"
              accept="image/png,image/jpeg,image/webp"
              required
              aria-describedby="acc-image-hint"
            >
            <span id="acc-image-hint" class="field-hint">Chọn ảnh hành trang, đệ tử, chỉ số acc (hệ thống tự đọc magic bytes chống giả mạo file).</span>

            <div id="acc-preview-frame" class="acc-preview-frame" hidden>
              <img id="acc-preview-img" src="/assets/favicon.svg" alt="Xem trước ảnh acc chuẩn bị đăng" width="320" height="200">
              <div class="acc-preview-meta">
                <span id="acc-preview-info" class="mono-num"></span>
                <button type="button" id="acc-preview-clear-btn" class="btn btn-outline btn-sm">Xóa ảnh chọn</button>
              </div>
            </div>
          </div>

          <div class="upload-fields-col">
            <div class="field-group">
              <label for="acc-title">Tiêu đề / Mô tả ngắn Acc <span class="req-star">*</span></label>
              <input type="text" id="acc-title" name="title" maxlength="90" required placeholder="Ví dụ: Acc Trái Đất 60 tỷ + Set Kích Hoạt Kaioken">
            </div>

            <div class="form-row-2">
              <div class="field-group">
                <label for="acc-price">Giá bán (VNĐ) <span class="req-star">*</span></label>
                <input type="number" id="acc-price" name="price_vnd" min="1000" max="500000000" step="1000" inputmode="numeric" required placeholder="Ví dụ: 450000">
                <span id="acc-price-preview" class="field-hint mono-num">Hiển thị: —</span>
              </div>

              <div class="field-group">
                <label for="acc-server">Server <span class="req-star">*</span></label>
                <select id="acc-server" name="server_name" required>
                  ${serverOptions}
                </select>
              </div>
            </div>

            <fieldset class="calc-fieldset">
              <legend>Hành tinh <span class="req-star">*</span></legend>
              <div class="planet-radio-row">
                ${planetRadios}
              </div>
            </fieldset>

            <div class="field-group">
              <label for="acc-note">Ghi chú quảng cáo <span class="req-star">*</span></label>
              <textarea id="acc-note" name="note" rows="4" maxlength="1200" required placeholder="Ví dụ: Sức đánh gốc 15k, đệ Ma Bư skill 5, Bông tai cấp 2, đồ 5s/7s, đăng ký ảo trắng thông tin..."></textarea>
            </div>
          </div>
        </div>

        <p id="account-upload-status" class="form-status" role="status" hidden></p>

        <div class="form-actions-row">
          <button type="submit" id="account-upload-submit" class="btn btn-primary">Đăng Bán Tài Khoản Lên Shop</button>
        </div>
      </form>
    </div>
  `;

  return `${showToggleNote ? "" : ""}${loginBlock}${uploadBlock}`;
}

function renderMuaTaiKhoanView({ accounts, session, integrity }) {
  const starterMarkup = STARTER_ACCS.map(
    (acc) => `
      <article class="starter-acc-card">
        <div class="card-top">
          <span class="cat-badge">Acc Phổ Thông · Giao Nhanh</span>
          <span class="tag-pill tag-hot">${escapeHtml(acc.tag)}</span>
        </div>
        <div class="card-visual-row">
          <div class="item-slot-group">
            <span class="item-slot"><img src="${escapeHtml(acc.icon)}" alt="${escapeHtml(acc.iconAlt)}" width="${Number(acc.width)}" height="${Number(acc.height)}" class="game-sprite"></span>
          </div>
          <h3>${escapeHtml(acc.name)}</h3>
        </div>
        <p class="card-note">${escapeHtml(acc.note)}</p>
        <div class="card-price-row">
          <span class="price-main mono-num">${escapeHtml(acc.priceText)}</span>
        </div>
        <div class="inline-qty-bar">
          <div class="item-qty-picker item-qty-row" data-item-id="${escapeHtml(acc.id)}" data-item-name="${escapeHtml(acc.name)}" data-item-price="${Number(acc.price)}" data-item-unit="${escapeHtml(acc.unit)}">
            <button type="button" class="qty-btn row-dec" aria-label="Giảm số lượng ${escapeHtml(acc.name)}">&minus;</button>
            <input type="number" class="item-qty-input mono-num" value="1" min="1" max="999" inputmode="numeric" aria-label="Số lượng ${escapeHtml(acc.name)}">
            <button type="button" class="qty-btn row-inc" aria-label="Tăng số lượng ${escapeHtml(acc.name)}">+</button>
            <span class="mono-num row-subtotal">${escapeHtml(formatVndServer(acc.price))}</span>
            <button type="button" class="btn btn-primary btn-sm row-add-btn">+ Thêm vào đơn</button>
          </div>
        </div>
      </article>
    `
  ).join("");

  const serverFilterOptions = ALLOWED_SERVERS.map(
    (sv) => `<option value="${escapeHtml(sv)}">${escapeHtml(sv)}</option>`
  ).join("");

  const accGridContent =
    accounts.length > 0
      ? accounts.map((acc) => renderAccountCardMarkup(acc, { isAdmin: Boolean(session) })).join("")
      : `<div class="empty-state-box">
          <h3>Chưa có tài khoản VIP nào trong kho</h3>
          <p class="pretty-text">Chủ shop có thể đăng nhập ở khung <strong>Quản lý đăng Acc</strong> bên dưới để up ảnh acc, giá bán, server, hành tinh và ghi chú quảng cáo lên ngay.</p>
        </div>`;

  return `
    <section class="subhero-section">
      <div class="container subhero-inner">
        <div class="hero-pills">
          <span class="pill pill-jade">Path: <code>/mua-tai-khoan</code></span>
          <span class="pill pill-gold">Up Hình · Giá · Server · Hành Tinh · Ghi Chú</span>
        </div>
        <h1>Mua Bán Tài Khoản Ngọc Rồng Online · SP123 &amp; All Server</h1>
        <p class="pretty-text">
          Cung cấp Acc Đậu thần cấp 5 (<code>8.000 đ</code>), Acc Clone 340k SM (<code>3.000 đ</code>) và Kho Tài Khoản NRO đủ server Trái Đất · Namếc · Xayda kèm ảnh thật, giá niêm yết và ghi chú quảng cáo minh bạch.
        </p>
        <div class="hero-cta-row">
          <a href="#kho-tai-khoan" class="btn btn-primary">Xem Kho Acc (${accounts.length})</a>
          <button type="button" id="toggle-admin-acc-panel" class="btn btn-secondary">
            ${session ? "Mở Form Đăng Acc Mới (Admin)" : "Đăng Nhập Up Acc (Chủ Shop)"}
          </button>
        </div>
      </div>
    </section>

    <section class="starter-acc-section" aria-label="Acc Đậu 5 và Acc Clone sẵn SLL">
      <div class="container">
        <div class="section-head">
          <div>
            <span class="eyebrow">Hàng sẵn số lượng lớn</span>
            <h2>Acc Đậu Thần Cấp 5 &amp; Acc Clone 340k Sức Mạnh</h2>
          </div>
        </div>
        <div class="starter-acc-grid">
          ${starterMarkup}
        </div>
      </div>
    </section>

    <section id="quan-ly-acc" class="admin-inline-section"${session ? "" : " hidden"}>
      <div class="container">
        ${renderAdminAuthAndUploadSection({ session })}
      </div>
    </section>

    <section id="kho-tai-khoan" class="catalog-section">
      <div class="container">
        <div class="section-head">
          <div>
            <span class="eyebrow">Lọc theo Server · Hành tinh</span>
            <h2>Kho Tài Khoản NRO Đang Rao Bán</h2>
            <p id="acc-gallery-status" class="pretty-text" aria-live="polite">Đang hiển thị ${accounts.length} tài khoản trong kho.</p>
          </div>
        </div>

        <div class="acc-filter-bar">
          <search>
            <form id="acc-filter-form" class="acc-filter-grid" role="search">
              <div class="field-group">
                <label for="acc-search-input">Tìm mã acc / ghi chú / chi tiết</label>
                <input type="search" id="acc-search-input" name="q" placeholder="Ví dụ: set kích hoạt, skill 5, td, bông tai..." autocomplete="off">
              </div>

              <div class="field-group">
                <label for="acc-filter-server">Lọc Server</label>
                <select id="acc-filter-server" name="server">
                  <option value="all">Tất cả Server</option>
                  ${serverFilterOptions}
                </select>
              </div>

              <div class="field-group">
                <label for="acc-filter-planet">Lọc Hành tinh</label>
                <select id="acc-filter-planet" name="planet">
                  <option value="all">Tất cả Hành tinh</option>
                  <option value="Trái Đất">Trái Đất</option>
                  <option value="Namếc">Namếc</option>
                  <option value="Xayda">Xayda</option>
                </select>
              </div>

              <div class="field-group">
                <label for="acc-filter-status">Trạng thái</label>
                <select id="acc-filter-status" name="status">
                  <option value="all">Tất cả</option>
                  <option value="available">Đang bán</option>
                  <option value="sold">Đã bán</option>
                </select>
              </div>
            </form>
          </search>
        </div>

        <div id="acc-gallery-grid" class="acc-grid" data-is-admin="${session ? "1" : "0"}">
          ${accGridContent}
        </div>
      </div>
    </section>

    ${renderVerifiedBankSection(integrity)}
  `;
}

function renderAdminConsoleView({ session, accounts, auditLogs, cspReports, integrity }) {
  const adminMgmtBlock = session
    ? `
      <section class="admin-mgmt-section">
        <div class="container">
          <div class="section-head">
            <div>
              <span class="eyebrow">Quản lý kho Acc</span>
              <h2>Danh Sách Tài Khoản Đã Đăng (${accounts.length})</h2>
            </div>
          </div>

          <div class="item-pricing-card">
            <div class="table-scroll">
              <table class="item-pricing-table" id="admin-acc-table">
                <caption>Quản lý giá, trạng thái &amp; xóa tài khoản đã đăng</caption>
                <thead>
                  <tr>
                    <th scope="col">Mã Acc</th>
                    <th scope="col">Ảnh &amp; Tiêu đề</th>
                    <th scope="col">Server · Hành tinh</th>
                    <th scope="col">Giá (VNĐ)</th>
                    <th scope="col">Trạng thái</th>
                    <th scope="col">Thao tác</th>
                  </tr>
                </thead>
                <tbody id="admin-acc-tbody">
                  ${
                    accounts.length === 0
                      ? '<tr><td colspan="6">Chưa có tài khoản nào được đăng.</td></tr>'
                      : accounts
                          .map(
                            (acc) => `
                        <tr data-acc-row-id="${Number(acc.id)}">
                          <td class="mono-num"><strong>#${escapeHtml(acc.code)}</strong></td>
                          <td>
                            <div class="table-item-cell">
                              <img src="${escapeHtml(acc.image_path)}" alt="" width="${Number(acc.image_width)}" height="${Number(acc.image_height)}" class="table-sprite">
                              <span>${escapeHtml(acc.title)}</span>
                            </div>
                          </td>
                          <td>${escapeHtml(acc.server_name)} · ${escapeHtml(acc.planet)}</td>
                          <td class="mono-num"><strong>${escapeHtml(formatVndServer(acc.price_vnd))}</strong></td>
                          <td>
                            <span class="tag-pill ${acc.status === "sold" ? "tag-crimson" : "tag-jade"}">
                              ${acc.status === "sold" ? "Đã bán" : "Đang bán"}
                            </span>
                          </td>
                          <td>
                            <div class="table-action-group">
                              <button type="button" class="btn btn-outline btn-sm acc-toggle-status-btn" data-acc-id="${Number(acc.id)}" data-next-status="${acc.status === "sold" ? "available" : "sold"}">
                                ${acc.status === "sold" ? "Mở bán" : "Đã bán"}
                              </button>
                              <button type="button" class="btn btn-danger-outline btn-sm acc-delete-btn" data-acc-id="${Number(acc.id)}" data-acc-code="${escapeHtml(acc.code)}">
                                Xóa
                              </button>
                            </div>
                          </td>
                        </tr>
                      `
                          )
                          .join("")
                  }
                </tbody>
              </table>
            </div>
          </div>

          <div class="security-audit-grid">
            <div class="rates-table-card">
              <span class="eyebrow">Nhật ký bảo mật Backend</span>
              <h3>Lịch Sử Đăng Nhập &amp; Thao Tác (Audit Logs)</h3>
              <div class="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th scope="col">Thời gian</th>
                      <th scope="col">Sự kiện</th>
                      <th scope="col">Tác nhân</th>
                      <th scope="col">Chi tiết</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${
                      auditLogs.length === 0
                        ? '<tr><td colspan="4">Chưa có sự kiện nào được ghi nhận.</td></tr>'
                        : auditLogs
                            .map(
                              (log) => `
                          <tr>
                            <td class="mono-num">${escapeHtml(log.created_at.slice(0, 19).replace("T", " "))}</td>
                            <td><code>${escapeHtml(log.event_type)}</code></td>
                            <td>${escapeHtml(log.actor)}</td>
                            <td>${escapeHtml(log.detail)}</td>
                          </tr>
                        `
                            )
                            .join("")
                    }
                  </tbody>
                </table>
              </div>
            </div>

            <div class="rates-table-card">
              <span class="eyebrow">Giám sát CSP &amp; Anti-XSS</span>
              <h3>Báo Cáo Vi Phạm Mã Độc (CSP Reports)</h3>
              <div class="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th scope="col">Thời gian</th>
                      <th scope="col">Directive</th>
                      <th scope="col">Blocked URI</th>
                      <th scope="col">Sample</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${
                      cspReports.length === 0
                        ? '<tr><td colspan="4">Không phát hiện tập lệnh/nguồn lạ vi phạm CSP.</td></tr>'
                        : cspReports
                            .map(
                              (rep) => `
                          <tr>
                            <td class="mono-num">${escapeHtml(rep.created_at.slice(0, 19).replace("T", " "))}</td>
                            <td><code>${escapeHtml(rep.violated_directive)}</code></td>
                            <td>${escapeHtml(rep.blocked_uri)}</td>
                            <td><code>${escapeHtml(rep.script_sample)}</code></td>
                          </tr>
                        `
                            )
                            .join("")
                    }
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </section>
    `
    : "";

  return `
    <section class="subhero-section">
      <div class="container subhero-inner">
        <div class="hero-pills">
          <span class="pill pill-jade">Path: <code>/admin</code></span>
          <span class="pill pill-gold">CSP Nonce · Fetch Metadata · Magic Bytes Upload</span>
        </div>
        <h1>Quản Trị Shop &amp; Trung Tâm Bảo Mật Chính Chủ</h1>
        <p class="pretty-text">
          Khu vực dành riêng cho chủ shop để đăng bán tài khoản (kèm upload ảnh acc), quản lý trạng thái đơn và theo dõi toàn vẹn đường dẫn Facebook / Zalo / STK MB Bank <code>${escapeHtml(OFFICIAL_BANK.accountNumber)}</code>.
        </p>
      </div>
    </section>

    <section class="admin-shield-section">
      <div class="container">
        <div class="shield-card">
          <div>
            <span class="eyebrow">Anti-Tamper Checksum</span>
            <h2>Kiểm Tra Toàn Vẹn Chính Chủ Hệ Thống</h2>
            <ul class="bank-verify-list">
              <li><strong>Trạng thái tổng thể:</strong> <code>${integrity.ok ? "HỢP LỆ (100% CHÍNH CHỦ)" : "CẢNH BÁO TỆP QR BỊ SỬA ĐỔI"}</code></li>
              <li><strong>Config SHA-256 (Links + STK):</strong> <code>${escapeHtml(CONFIG_SHA256)}</code></li>
              <li><strong>QR MB Bank SHA-256:</strong> <code>${escapeHtml(integrity.qrActualSha256 || "MISSING")}</code></li>
              <li><strong>STK Bất Biến:</strong> <code>${escapeHtml(OFFICIAL_BANK.accountNumber)}</code> — <strong>${escapeHtml(OFFICIAL_BANK.accountOwner)}</strong></li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <section class="admin-console-form-section">
      <div class="container">
        ${renderAdminAuthAndUploadSection({ session })}
      </div>
    </section>

    ${adminMgmtBlock}
  `;
}

function renderPage({ route, nonce, csrfToken, session, integrity, data = {} }) {
  const meta = ROUTE_META[route] || ROUTE_META["/"];
  let mainHtml = "";

  if (route === "/kich-diem") {
    mainHtml = renderKichDiemView({ integrity });
  } else if (route === "/mua-item") {
    mainHtml = renderMuaItemView({ integrity });
  } else if (route === "/mua-tai-khoan") {
    mainHtml = renderMuaTaiKhoanView({
      accounts: data.accounts || [],
      session,
      integrity
    });
  } else if (route === "/admin") {
    mainHtml = renderAdminConsoleView({
      session,
      accounts: data.accounts || [],
      auditLogs: data.auditLogs || [],
      cspReports: data.cspReports || [],
      integrity
    });
  } else {
    mainHtml = renderHomeView({
      latestAccounts: data.accounts || [],
      integrity
    });
  }

  const csrfMetaTag = csrfToken
    ? `<meta name="csrf-token" content="${escapeHtml(csrfToken)}">`
    : "";

  return `<!DOCTYPE html>
<html lang="vi" data-palette="namek-jade">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light dark">
  ${csrfMetaTag}
  <script nonce="${escapeHtml(nonce)}">
    {
      try {
        const savedScheme = localStorage.getItem("color-scheme");
        if (savedScheme === "light" || savedScheme === "dark") {
          const meta = document.querySelector('meta[name="color-scheme"]');
          if (meta) meta.content = savedScheme;
          document.documentElement.classList.add(savedScheme === "dark" ? "theme-dark" : "theme-light");
        }
      } catch {}
    }
  </script>
  <title>${escapeHtml(meta.title)}</title>
  <meta name="description" content="${escapeHtml(meta.description)}">
  <link rel="icon" type="image/svg+xml" href="/assets/favicon.svg">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap">
  <link rel="stylesheet" href="/styles.css">
  <script nonce="${escapeHtml(nonce)}" defer src="/app.js"></script>
</head>
<body data-route="${escapeHtml(route)}" data-config-sha256="${escapeHtml(CONFIG_SHA256)}">
  <a href="#main-content" class="skip-link visually-hidden">Chuyển thẳng tới nội dung chính</a>

  <div id="header-sentinel" class="header-sentinel" aria-hidden="true"></div>
  <div class="sticky-header-container">
    <header class="site-header">
      <div class="container header-inner">
        <a href="/" class="brand" aria-label="Trang chủ Shop NRO Thanh Dung">
          <svg class="brand-orb" width="36" height="36" viewBox="0 0 64 64" aria-hidden="true">
            <defs>
              <radialGradient id="brand-orb-g" cx="35%" cy="30%" r="70%">
                <stop offset="0%" stop-color="#fff7cc"/>
                <stop offset="35%" stop-color="#fbbf24"/>
                <stop offset="80%" stop-color="#d97706"/>
                <stop offset="100%" stop-color="#78350f"/>
              </radialGradient>
            </defs>
            <circle cx="32" cy="32" r="28" fill="url(#brand-orb-g)" stroke="#34d399" stroke-width="2.5"/>
            <ellipse cx="23" cy="20" rx="8" ry="4.5" transform="rotate(-30 23 20)" fill="#ffffff" fill-opacity="0.45"/>
            <g fill="#dc2626">
              <path d="M23 20l1.6 3.2 3.5.5-2.5 2.5.6 3.5-3.2-1.7-3.2 1.7.6-3.5-2.5-2.5 3.5-.5z"/>
              <path d="M41 20l1.6 3.2 3.5.5-2.5 2.5.6 3.5-3.2-1.7-3.2 1.7.6-3.5-2.5-2.5 3.5-.5z"/>
              <path d="M23 36l1.6 3.2 3.5.5-2.5 2.5.6 3.5-3.2-1.7-3.2 1.7.6-3.5-2.5-2.5 3.5-.5z"/>
              <path d="M41 36l1.6 3.2 3.5.5-2.5 2.5.6 3.5-3.2-1.7-3.2 1.7.6-3.5-2.5-2.5 3.5-.5z"/>
            </g>
          </svg>
          <span class="brand-text">
            <strong class="brand-name">${escapeHtml(OFFICIAL_CONTACTS.shortName)}</strong>
            <span class="brand-sub">Namek Jade · Uy Tín SP123</span>
          </span>
        </a>

        <nav class="primary-nav" aria-label="Điều hướng chính">
          ${renderNavLinks(route)}
        </nav>

        <div class="header-actions">
          <button type="button" id="theme-toggle" class="btn-icon-ghost" aria-pressed="false">
            <svg class="icon-svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="4"/>
              <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
            </svg>
            <span id="theme-toggle-label">Chế độ Tối</span>
          </button>

          <button type="button" id="open-order-btn" class="btn-order">
            <svg class="icon-svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 0 1-8 0"/>
            </svg>
            <span>Đơn tính nhanh</span>
            <span id="order-count" class="count-badge" aria-live="polite">0</span>
          </button>
        </div>
      </div>

      <nav class="mobile-path-nav" aria-label="Chuyển khu dịch vụ trên điện thoại">
        <div class="container">
          ${renderNavLinks(route, "mobile-path-list")}
        </div>
      </nav>
    </header>
  </div>

  <main id="main-content" tabindex="-1">
    <div id="tamper-warning-banner" class="container tamper-warning-banner" role="alert" hidden>
      <strong>Cảnh báo bảo mật trình duyệt!</strong>
      <span>Phát hiện dấu hiệu can thiệp thay đổi đường dẫn chính chủ hoặc số tài khoản trong trang. Dữ liệu đã được khôi phục về cấu hình máy chủ gốc (${escapeHtml(OFFICIAL_BANK.accountNumber)} - ${escapeHtml(OFFICIAL_BANK.accountOwner)}).</span>
    </div>

    ${mainHtml}
  </main>

  <footer class="site-footer">
    <div class="container footer-inner">
      <div>
        <strong class="footer-brand">${escapeHtml(OFFICIAL_CONTACTS.shopName)}</strong>
        <p class="footer-note">Phân khu: <a href="/kich-diem">/kich-diem</a> · <a href="/mua-item">/mua-item</a> · <a href="/mua-tai-khoan">/mua-tai-khoan</a> · <a href="/admin">/admin</a> — STK MB Bank duy nhất: <code class="mono-num">${escapeHtml(OFFICIAL_BANK.accountNumber)}</code></p>
      </div>
      <div class="footer-links">
        <a href="${escapeHtml(OFFICIAL_CONTACTS.facebookUrl)}" target="_blank" rel="noopener noreferrer" data-verified-role="fb-link">Facebook</a>
        <a href="${escapeHtml(OFFICIAL_CONTACTS.zaloUrl)}" target="_blank" rel="noopener noreferrer" data-verified-role="zalo-link">Zalo</a>
        <a href="${escapeHtml(OFFICIAL_CONTACTS.zaloBoxSp1Url)}" target="_blank" rel="noopener noreferrer" data-verified-role="box-sp1">Box SP1</a>
        <a href="${escapeHtml(OFFICIAL_CONTACTS.fbGroupSp123Url)}" target="_blank" rel="noopener noreferrer" data-verified-role="group-sp123">Group SP123</a>
      </div>
    </div>
  </footer>

  <aside class="mobile-dock" aria-label="Liên hệ và giỏ đơn nhanh">
    <a href="${escapeHtml(OFFICIAL_CONTACTS.zaloUrl)}" target="_blank" rel="noopener noreferrer" data-verified-role="zalo-link" class="dock-link dock-zalo">Zalo ${escapeHtml(OFFICIAL_CONTACTS.zaloDisplay)}</a>
    <button type="button" id="mobile-open-order" class="dock-btn">
      Đơn tính (<span id="mobile-order-count">0</span>)
    </button>
  </aside>

  <!-- Native Modal Dialog for Order Builder -->
  <dialog id="order-dialog" closedby="any" aria-labelledby="order-dialog-title">
    <div class="dialog-shell">
      <div class="dialog-head">
        <div>
          <h2 id="order-dialog-title">Đơn Tính Nhanh &amp; Gửi Tin Nhắn</h2>
          <p class="dialog-sub">Đơn được lưu tự động khi bạn chuyển qua lại giữa Kích điểm, Mua Item và Mua Tài Khoản. Bấm gửi FB hoặc Zalo để tự copy đơn.</p>
        </div>
        <form method="dialog">
          <button type="submit" class="btn-dialog-close" aria-label="Đóng hộp thoại đơn hàng">&times;</button>
        </form>
      </div>

      <div id="order-items-wrap" class="order-items-wrap">
        <p id="order-empty-msg" class="order-empty">Chưa có mục nào trong đơn. Hãy chọn số lượng ở <a href="/mua-item">Mua Item</a>, <a href="/kich-diem">Kích điểm</a> hoặc <a href="/mua-tai-khoan">Mua Tài khoản</a>.</p>
        <ul id="order-items-list" class="order-items-list" role="list"></ul>
      </div>

      <div class="order-extra">
        <label for="order-note">Ghi chú (Server / Tên nhân vật / Hành tinh / Yêu cầu riêng):</label>
        <textarea id="order-note" name="orderNote" rows="2" placeholder="Ví dụ: Server SP1, tên nhân vật..., cần lấy ngay..."></textarea>
      </div>

      <div class="order-total-bar">
        <span>Tạm tính (các mục cố định giá):</span>
        <strong id="order-total-price" class="mono-num">0 đ</strong>
      </div>

      <div class="order-bank-mini">
        <div class="order-bank-text">
          <strong>MB Bank chính chủ:</strong>
          <span class="mono-num" data-verified-role="bank-stk">${escapeHtml(OFFICIAL_BANK.accountNumber)}</span> — <span data-verified-role="bank-owner">${escapeHtml(OFFICIAL_BANK.accountOwner)}</span>
        </div>
        <div class="order-bank-actions">
          <button type="button" class="btn btn-outline btn-sm copy-btn verified-bank-copy" data-copy-target="stk" data-copy="${escapeHtml(OFFICIAL_BANK.accountNumber)}" data-label="số tài khoản ${escapeHtml(OFFICIAL_BANK.accountNumber)}">Copy STK</button>
          <a href="${route === "/admin" ? "/#thanh-toan" : "#thanh-toan"}" id="jump-to-qr-link" class="btn btn-outline btn-sm">Xem mã QR</a>
        </div>
      </div>

      <p id="order-send-status" class="order-send-status" hidden aria-live="polite"></p>

      <div class="dialog-actions dialog-send-row">
        <button type="button" id="send-fb-order-btn" class="btn btn-facebook">Gửi đơn vào Facebook</button>
        <button type="button" id="send-zalo-order-btn" class="btn btn-zalo">Gửi đơn vào Zalo</button>
      </div>

      <div class="dialog-actions dialog-util-row">
        <button type="button" id="copy-order-btn" class="btn btn-outline">Chỉ sao chép đơn</button>
        <button type="button" id="clear-order-btn" class="btn btn-outline">Xóa tất cả</button>
      </div>
    </div>
  </dialog>

  <!-- Account Image Lightbox Dialog -->
  <dialog id="acc-lightbox-dialog" closedby="any" aria-labelledby="acc-lightbox-title">
    <div class="dialog-shell">
      <div class="dialog-head">
        <div>
          <h2 id="acc-lightbox-title">Chi tiết ảnh Tài Khoản</h2>
          <p id="acc-lightbox-sub" class="dialog-sub"></p>
        </div>
        <form method="dialog">
          <button type="submit" class="btn-dialog-close" aria-label="Đóng xem ảnh acc">&times;</button>
        </form>
      </div>
      <div class="lightbox-img-wrap">
        <img id="acc-lightbox-img" src="/assets/favicon.svg" alt="Ảnh tài khoản chi tiết" width="800" height="450">
      </div>
      <p id="acc-lightbox-note" class="acc-note-text"></p>
      <div class="dialog-actions">
        <button type="button" id="acc-lightbox-add-btn" class="btn btn-primary">+ Thêm Acc này vào đơn</button>
        <a id="acc-lightbox-zalo-link" href="${escapeHtml(OFFICIAL_CONTACTS.zaloUrl)}" target="_blank" rel="noopener noreferrer" data-verified-role="zalo-link" class="btn btn-zalo">Hỏi mua qua Zalo</a>
      </div>
    </div>
  </dialog>

  <!-- Native Popover Toast Notification -->
  <div class="toast-region" aria-live="polite" aria-atomic="true">
    <div id="app-toast" class="toast-box" popover="manual" role="status">
      <span id="toast-message">Đã sao chép!</span>
      <button type="button" id="toast-close-btn" class="toast-close" popovertarget="app-toast" popovertargetaction="hide" aria-label="Đóng thông báo">&times;</button>
    </div>
  </div>
</body>
</html>`;
}

module.exports = {
  renderPage
};

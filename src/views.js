"use strict";

const {
  OFFICIAL_CONTACTS,
  OFFICIAL_BANK,
  ALLOWED_PLANETS,
  ALLOWED_SERVERS,
  ALLOWED_ITEM_CATEGORIES,
  ALLOWED_ITEM_TAG_CLASSES,
  BUNDLED_ITEM_ICONS,
  KICH_DIEM_SERVICES,
  MANH_ACTIVATION_INFOS,
  ITEM_PRICE_ROWS,
  STARTER_ACCS,
  CONFIG_SHA256
} = require("./config");
const { escapeHtml } = require("./security");

const ROUTE_META = {
  "/": {
    title: "Shop Ngọc Rồng Online Thanh Dung | Kích Điểm, Mua Item, Mua Bán Acc",
    description:
      "Shop game Ngọc Rồng Online Thanh Dung chính chủ: Kích điểm 300k, Nạp CR 810k done 3s, Kho Item x99 - Đá NC - Vàng Ngọc SPL, Mua bán Tài khoản có ảnh xác thực, GDTG 20/24."
  },
  "/kich-diem": {
    title: "Kích Điểm 300k · Nạp CR 810k · Thuê Set · Săn Đệ · GDTG 20/24 | Thanh Dung NRO",
    description:
      "Chuyên mục Kích điểm 300.000 đ, Nạp CR 810.000 đ done 3s, Thuê Set Thần 3 hành tinh / Set SMTN 5s 10.000 đ/ngày, Săn Đệ SS Skill 5, GDTG 20/24, Thu All Acc & Rút VTS Tín dụng."
  },
  "/mua-item": {
    title: "Mua Item NRO · Cuồng Nộ, Đá NC, Sao Pha Lê, Vàng Ngọc | Thanh Dung NRO",
    description:
      "Bảng chọn số lượng & tính giá 1 chạm cho Item x99, 5 loại Đá nâng cấp x999, Dùi đục SLL, 4 loại Sao pha lê, Ngọc Rồng 3 sao, Kích mảnh và Máy tính Vàng · Ngọc 2 chiều."
  },
  "/mua-tai-khoan": {
    title: "Mua Bán Tài Khoản Ngọc Rồng Online · Đủ Server | Thanh Dung NRO",
    description:
      "Mua bán tài khoản Ngọc Rồng Online uy tín: Acc Đậu 5 8.000 đ, Acc Clone 340k SM 3.000 đ, Kho Acc NRO đủ server Trái Đất / Namếc / Xayda kèm ảnh chi tiết & giá công khai."
  },
  "/admin": {
    title: "Quản Trị Shop & Đăng Bán Tài Khoản | Thanh Dung NRO",
    description:
      "Trang quản trị Shop Ngọc Rồng Online Thanh Dung: Đăng bán tài khoản kèm ảnh, quản lý trạng thái và xác nhận thông tin thanh toán chính chủ."
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
    { href: "/mua-tai-khoan", label: "Mua Tài khoản" }
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
        <strong>Cảnh báo xác thực mã QR!</strong>
        <span>Ảnh mã QR hiện tại không khớp bản gốc chính chủ. Tạm ẩn QR — vui lòng đối chiếu trực tiếp STK bên cạnh và nhắn Zalo chính chủ.</span>
      </div>`;

  return `
    <section id="thanh-toan" class="bank-section">
      <div class="container">
        <div class="section-head">
          <div>
            <span class="eyebrow">Xác minh chuyển khoản chính chủ</span>
            <h2>Mã QR &amp; Số Tài Khoản Ngân Hàng Duy Nhất</h2>
            <p class="pretty-text">
              Cảnh giác giả mạo! Shop <strong>chỉ sử dụng duy nhất 1 tài khoản MB Bank</strong> dưới đây — luôn đối chiếu đúng tên chủ tài khoản trước khi chuyển tiền.
            </p>
          </div>
          <span class="pill pill-jade integrity-pill" id="integrity-badge">
            <span class="dot-live" aria-hidden="true"></span>
            ${integrity.ok ? "Tài khoản chính chủ" : "Vui lòng kiểm tra lại STK"}
          </span>
        </div>

        <div class="bank-grid">
          <div class="bank-info-card">
            <div class="bank-badge-row">
              <span class="pill pill-gold">${escapeHtml(OFFICIAL_BANK.bankName)}</span>
              <span class="pill pill-jade">Chuyển khoản 24/7</span>
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
              <li><strong>An toàn giao dịch:</strong> Không chuyển khoản qua bất kỳ trung gian hay số tài khoản lạ nào ngoài thông tin trên.</li>
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
            <p class="pretty-text">Cảnh giác tài khoản giả mạo! Chỉ giao dịch qua đúng 4 kênh liên hệ chính thức dưới đây.</p>
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
            <span class="contact-type">Group Chat Zalo</span>
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
      <a href="${escapeHtml(OFFICIAL_CONTACTS.zaloUrl)}" target="_blank" rel="noopener noreferrer" data-verified-role="zalo-link" class="btn btn-card-link direct-service-link" data-service-name="${escapeHtml(item.name)}" data-service-price="${escapeHtml(item.priceText || (item.price > 0 ? formatVndServer(item.price) : 'Liên hệ'))}">Mua ngay</a>
    `;
  } else {
    actionsMarkup = `
      <button type="button" class="btn btn-card-add" data-id="${escapeHtml(item.id)}" data-name="${escapeHtml(item.orderName)}" data-price="${Number(item.price)}" data-unit="${escapeHtml(item.unit)}">
        ${item.price > 0 ? "+ Thêm vào đơn" : "+ Ghi vào đơn"}
      </button>
      <a href="${escapeHtml(OFFICIAL_CONTACTS.zaloUrl)}" target="_blank" rel="noopener noreferrer" data-verified-role="zalo-link" class="btn btn-card-link direct-service-link" data-service-name="${escapeHtml(item.name)}" data-service-price="${escapeHtml(item.priceText || (item.price > 0 ? formatVndServer(item.price) : 'Liên hệ'))}">${escapeHtml(item.ctaLabel || "Đặt Zalo")}</a>
    `;
  }

  const extraDayPicker = showDayPicker
    ? `<div class="inline-qty-bar">
        <label for="qty-${escapeHtml(item.id)}">Số ngày thuê:</label>
        <div class="item-qty-picker item-qty-row" data-item-id="${escapeHtml(item.id)}" data-item-name="${escapeHtml(item.orderName)}" data-item-kind="fixed" data-item-price="${Number(item.price)}" data-item-unit="${escapeHtml(item.unit)}" data-item-step="1">
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
        <span class="acc-zoom-hint">Phóng to &amp; zoom xem kỹ</span>
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
          <a href="${escapeHtml(OFFICIAL_CONTACTS.zaloUrl)}" target="_blank" rel="noopener noreferrer" data-verified-role="zalo-link" class="btn btn-card-link direct-acc-link" data-acc-code="${escapeHtml(acc.code)}" data-acc-server="${escapeHtml(acc.server_name)}" data-acc-planet="${escapeHtml(acc.planet)}" data-acc-price="${escapeHtml(formatVndServer(acc.price_vnd))}">Check Acc</a>
        </div>
        ${adminBar}
      </div>
    </article>
  `;
}

function findServiceById(list, fallbackList, id) {
  return (
    (Array.isArray(list) && list.find((x) => x.id === id)) ||
    fallbackList.find((x) => x.id === id) ||
    { price: 0, priceText: "Liên hệ" }
  );
}

function renderHomeView({ latestAccounts, services = KICH_DIEM_SERVICES, starterAccs = STARTER_ACCS, integrity }) {
  const kikDiem = findServiceById(services, KICH_DIEM_SERVICES, "kik-diem");
  const napCr = findServiceById(services, KICH_DIEM_SERVICES, "nap-cr");
  const thueSet = findServiceById(services, KICH_DIEM_SERVICES, "thue-set");
  const accDau5 = findServiceById(starterAccs, STARTER_ACCS, "acc-dau5");
  const accClone = findServiceById(starterAccs, STARTER_ACCS, "acc-clone");

  const teaserCards =
    latestAccounts.length > 0
      ? `<div class="acc-grid" id="home-acc-teaser">
          ${latestAccounts.slice(0, 3).map((acc) => renderAccountCardMarkup(acc)).join("")}
        </div>`
      : `<div class="empty-state-box">
          <p>Kho Acc Đậu 5 (<code>${escapeHtml(formatVndServer(accDau5.price))}</code>) &amp; Acc Clone 340k SM (<code>${escapeHtml(formatVndServer(accClone.price))}</code>) luôn sẵn số lượng lớn. Xem toàn bộ danh sách tài khoản theo Server tại mục <strong>Mua Tài Khoản</strong>.</p>
          <a href="/mua-tai-khoan" class="btn btn-primary">Mở Kho Tài Khoản NRO</a>
        </div>`;

  return `
    <section id="top" class="hero-section">
      <div class="container hero-grid">
        <div class="hero-copy">
          <h1 class="hero-title">
            Shop Ngọc Rồng Online
            <span class="hero-accent">Thanh Dung NRO</span>
          </h1>

          <p class="hero-desc pretty-text">
            Website chính chủ chia thành 3 khu dịch vụ rõ ràng:
            <strong>Kích Điểm &amp; Nạp CR</strong>, <strong>Kho Item &amp; Đá Vàng Ngọc</strong>, và <strong>Mua Bán Tài Khoản NRO</strong> — thanh toán duy nhất qua STK MB Bank <code>0368018920</code>.
          </p>

          <div class="hero-cta-row">
            <a href="${escapeHtml(OFFICIAL_CONTACTS.zaloUrl)}" target="_blank" rel="noopener noreferrer" data-verified-role="zalo-link" class="btn btn-primary">
              <span>Liên Hệ Zalo</span>
            </a>
            <a href="${escapeHtml(OFFICIAL_CONTACTS.facebookUrl)}" target="_blank" rel="noopener noreferrer" data-verified-role="fb-link" class="btn btn-secondary">
              <span>Liên Hệ Facebook</span>
            </a>
          </div>

          <dl class="hero-metrics">
            <div class="metric-card">
              <dt>Kích điểm</dt>
              <dd>Done Siêu Tốc</dd>
            </div>
            <div class="metric-card">
              <dt>Dịch Vụ Bán Vàng</dt>
              <dd>Tươi: x15 <span class="metric-sep">·</span> Die: x60</dd>
            </div>
            <div class="metric-card">
              <dt>Dịch Vụ Bán Ngọc</dt>
              <dd>Kí: x11 <span class="metric-sep">·</span> Vé: x10</dd>
            </div>
            <div class="metric-card">
              <dt>GDTG Uy Tín</dt>
              <dd>Time: 20/24h</dd>
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
                <strong class="mono-num">Kích điểm ${escapeHtml(formatVndServer(kikDiem.price))} · Nạp CR ${escapeHtml(formatVndServer(napCr.price))}</strong>
              </div>
              <div class="caption-item">
                <span class="caption-label">Cộng Đồng Chính Chủ</span>
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
            <span class="eyebrow">Danh mục dịch vụ</span>
            <h2>Chọn Nhanh Chuyên Trang Dịch Vụ NRO</h2>
            <p class="pretty-text">Mỗi mảng dịch vụ có trang đặt hàng riêng, giỏ đơn tính nhanh luôn được giữ nguyên khi bạn chuyển qua lại.</p>
          </div>
        </div>

        <div class="hub-grid">
          <article class="hub-card">
            <div class="hub-icon-row">
              <span class="item-slot"><img src="/assets/icons/7223.png" alt="" width="72" height="72" class="game-sprite"></span>
              <span class="item-slot"><img src="/assets/icons/5004.png" alt="" width="72" height="72" class="game-sprite"></span>
              <span class="item-slot"><img src="/assets/icons/5007.png" alt="" width="96" height="68" class="game-sprite"></span>
            </div>
            <span class="eyebrow">Nạp &amp; Dịch vụ</span>
            <h3>Kích Điểm · Nạp CR · Thuê Set · Săn Đệ &amp; GDTG</h3>
            <p class="pretty-text">Nhận kích điểm ${escapeHtml(formatVndServer(kikDiem.price))}, nạp CR ${escapeHtml(formatVndServer(napCr.price))} done 3s, thuê Set Thần 3 hành tinh / SMTN 5s ${escapeHtml(thueSet.priceText)}, săn đệ SS Skill 5, GDTG 20/24 (ko mail sống), thu all acc &amp; rút VTS.</p>
            <a href="/kich-diem" class="btn btn-primary btn-full">Vào trang Kích Điểm &amp; Dịch Vụ</a>
          </article>

          <article class="hub-card">
            <div class="hub-icon-row">
              <span class="item-slot"><img src="/assets/icons/2754.png" alt="" width="76" height="80" class="game-sprite"></span>
              <span class="item-slot"><img src="/assets/icons/6765.png" alt="" width="72" height="72" class="game-sprite"></span>
              <span class="item-slot"><img src="/assets/icons/8935.png" alt="" width="84" height="84" class="game-sprite"></span>
            </div>
            <span class="eyebrow">Vật phẩm · Vàng · Ngọc</span>
            <h3>Mua Item x99 · Đá NC · Sao Pha Lê &amp; Vàng Ngọc</h3>
            <p class="pretty-text">Gộp gọn bảng chọn số lượng &amp; tính giá: Item x99, 5 loại Đá NC, Dùi đục, 4 loại Sao pha lê, Ngọc Rồng 3 sao, Kích mảnh và Máy tính Vàng · Ngọc 2 chiều.</p>
            <a href="/mua-item" class="btn btn-primary btn-full">Vào trang Mua Item &amp; Tính Đơn</a>
          </article>

          <article class="hub-card">
            <div class="hub-icon-row">
              <span class="item-slot"><img src="/assets/icons/241.png" alt="" width="48" height="48" class="game-sprite"></span>
              <span class="item-slot"><img src="/assets/icons/1089.png" alt="" width="48" height="64" class="game-sprite"></span>
              <span class="item-slot"><img src="/assets/icons/15614.png" alt="" width="80" height="80" class="game-sprite"></span>
            </div>
            <span class="eyebrow">Tài khoản NRO</span>
            <h3>Mua Bán Tài Khoản NRO (Có Ảnh Acc &amp; Lọc Server)</h3>
            <p class="pretty-text">Acc Đậu 5 (${escapeHtml(formatVndServer(accDau5.price))}), Acc Clone 340k SM (${escapeHtml(formatVndServer(accClone.price))}) và Kho Tài Khoản NRO đăng bán kèm ảnh thật, giá VNĐ, Server, Hành tinh (Trái Đất / Namếc / Xayda) &amp; ghi chú quảng cáo chi tiết.</p>
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
            <p class="pretty-text">Các acc nổi bật mới đăng từ shop — kiểm tra Server, Hành tinh và thêm thẳng vào đơn gửi Zalo / Facebook.</p>
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

function renderKichDiemView({ services = KICH_DIEM_SERVICES, integrity }) {
  const activeServices = services.length > 0 ? services : KICH_DIEM_SERVICES;
  const kikDiem = findServiceById(activeServices, KICH_DIEM_SERVICES, "kik-diem");
  const napCr = findServiceById(activeServices, KICH_DIEM_SERVICES, "nap-cr");
  const cardsHtml = activeServices.map((svc) =>
    renderProductCard(svc, { showDayPicker: svc.id === "thue-set" })
  ).join("");

  return `
    <section class="subhero-section">
      <div class="container subhero-inner">
        <div class="hero-pills">
          <span class="pill pill-jade">Kích điểm · Nạp CR · Thuê Set</span>
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
            <h2>Kích Điểm ${escapeHtml(formatVndServer(kikDiem.price))} · Nạp CR ${escapeHtml(formatVndServer(napCr.price))} · Thuê Set · Săn Đệ · GDTG</h2>
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

function formatRowInitialSubtotal(row) {
  if (row.kind === "quote") {
    return { main: "Báo giá theo lô", hint: "Liên hệ Zalo / FB" };
  }
  if (row.kind === "rate" && row.ratePerK > 0) {
    const cost = Math.max(1, Math.round((row.defaultQty / row.ratePerK) * 1000));
    let hint = "";
    if (row.id === "gem-ve") {
      const tickets = row.defaultQty / 10;
      hint = Number.isInteger(tickets)
        ? `= ${new Intl.NumberFormat("vi-VN").format(tickets)} vé`
        : `~${tickets.toLocaleString("vi-VN", { maximumFractionDigits: 1 })} vé`;
    } else if ((row.id === "gold-fresh" || row.id === "gold-die") && row.defaultQty >= 1000) {
      hint = `~${(row.defaultQty / 1000).toLocaleString("vi-VN", { maximumFractionDigits: 2 })} tỷ vàng`;
    }
    return { main: formatVndServer(cost), hint };
  }
  return { main: formatVndServer(row.price * row.defaultQty), hint: "" };
}

function renderMuaItemView({ items = ITEM_PRICE_ROWS, integrity }) {
  const activeItems = Array.isArray(items) ? items : ITEM_PRICE_ROWS;
  const categoryCounts = {
    all: activeItems.length,
    "item-x99": activeItems.filter((r) => r.category === "item-x99").length,
    "da-duiduc": activeItems.filter((r) => r.category === "da-duiduc").length,
    spl: activeItems.filter((r) => r.category === "spl").length,
    "nr-manh": activeItems.filter((r) => r.category === "nr-manh").length,
    khac: activeItems.filter((r) => r.category === "khac").length
  };

  const tableRowsHtml = activeItems.map((row) => {
    const initial = formatRowInitialSubtotal(row);
    const tagBadge = row.tag
      ? `<span class="tag-pill ${escapeHtml(row.tagClass || "")}">${escapeHtml(row.tag)}</span>`
      : "";
    const hintHtml = initial.hint
      ? `<span class="row-sub-hint">${escapeHtml(initial.hint)}</span>`
      : `<span class="row-sub-hint" hidden></span>`;

    return `
      <tr
        class="item-qty-row"
        data-category="${escapeHtml(row.category)}"
        data-keywords="${escapeHtml(row.keywords || "")}"
        data-item-id="${escapeHtml(row.id)}"
        data-item-name="${escapeHtml(row.orderName || row.name)}"
        data-item-kind="${escapeHtml(row.kind)}"
        data-item-price="${Number(row.price)}"
        data-item-rate-per-k="${Number(row.ratePerK || 0)}"
        data-item-unit="${escapeHtml(row.unit)}"
        data-item-step="${Number(row.step || 1)}"
      >
        <th scope="row" class="th-item">
          <div class="table-item-cell">
            <img src="${escapeHtml(row.icon)}" alt="${escapeHtml(row.iconAlt || row.name)}" width="${Number(row.width) || 64}" height="${Number(row.height) || 64}" loading="lazy" class="table-sprite">
            <div class="table-item-copy">
              <div class="table-item-title-row">
                <strong>${escapeHtml(row.name)}</strong>
                ${tagBadge}
              </div>
              <span class="table-item-desc">${escapeHtml(row.desc || "")}</span>
            </div>
          </div>
        </th>
        <td class="td-price mono-num"><strong>${escapeHtml(row.unitPriceLabel)}</strong></td>
        <td class="td-qty">
          <div class="item-qty-picker">
            <button type="button" class="qty-btn row-dec" aria-label="Giảm số lượng ${escapeHtml(row.name)}">&minus;</button>
            <input type="number" class="item-qty-input mono-num" value="${Number(row.defaultQty) || 1}" min="1" max="${Number(row.maxQty) || 9999}" step="1" inputmode="numeric" aria-label="Số lượng ${escapeHtml(row.name)}">
            <button type="button" class="qty-btn row-inc" aria-label="Tăng số lượng ${escapeHtml(row.name)}">+</button>
            <span class="qty-unit-hint">${escapeHtml(row.unit)}</span>
          </div>
        </td>
        <td class="td-subtotal mono-num">
          <strong class="row-subtotal">${escapeHtml(initial.main)}</strong>
          ${hintHtml}
        </td>
        <td class="td-action">
          <button type="button" class="btn btn-card-add btn-sm row-add-btn">
            ${row.kind === "quote" ? "+ Ghi đơn" : "+ Thêm"}<span class="visually-hidden"> ${escapeHtml(row.name)} vào đơn</span>
          </button>
        </td>
      </tr>
    `;
  }).join("");

  const manhCardsHtml = MANH_ACTIVATION_INFOS.map((manh) => {
    const tiersHtml = manh.tiers
      .map(
        (t) => `
          <div class="manh-tier-row">
            <dt class="manh-tier-pill ${t.tone === "shadow" ? "manh-tier-shadow" : "manh-tier-level"}">${escapeHtml(t.label)}:</dt>
            <dd class="manh-qty-pill mono-num">${escapeHtml(t.amount)}</dd>
          </div>
        `
      )
      .join("");

    return `
      <li class="manh-card manh-card-compact">
        <div class="manh-card-head">
          <div class="manh-stack-slot" aria-hidden="true">
            <img src="${escapeHtml(manh.icon)}" alt="" width="${Number(manh.width)}" height="${Number(manh.height)}" loading="lazy" class="game-sprite">
            <span class="manh-stack-num mono-num">${escapeHtml(manh.stackCount)}</span>
          </div>
          <div class="manh-head-copy">
            <span class="cat-badge">${escapeHtml(manh.badge)}</span>
            <h3>${escapeHtml(manh.name)}</h3>
          </div>
        </div>
        <dl class="manh-spec-list">
          ${tiersHtml}
        </dl>
        <div class="card-actions">
          <button type="button" class="btn btn-card-add btn-sm" data-id="${escapeHtml(manh.id)}" data-name="${escapeHtml(manh.orderName)}" data-price="0" data-unit="mảnh">
            + Ghi vào đơn<span class="visually-hidden"> ${escapeHtml(manh.name)}</span>
          </button>
          <a href="${escapeHtml(OFFICIAL_CONTACTS.zaloUrl)}" target="_blank" rel="noopener noreferrer" data-verified-role="zalo-link" class="btn btn-card-link btn-sm">Hỏi giá Zalo<span class="visually-hidden"> về ${escapeHtml(manh.name)}</span></a>
        </div>
      </li>
    `;
  }).join("");

  return `
    <section class="subhero-section compact-subhero">
      <div class="container subhero-inner">
        <div class="hero-pills">
          <span class="pill pill-jade">Item x99 · Đá NC · Sao pha lê · Ngọc Rồng 3 sao · Kích mảnh</span>
        </div>
        <h1>Mua Item &amp; Tính Giá Nhanh</h1>
        <p class="pretty-text">Chọn số lượng vật phẩm ở bảng dưới để tính giá tức thì, hoặc dùng Máy Tính Vàng · Ngọc 2 chiều ngay bên dưới.</p>
        <div class="hero-cta-row">
          <a href="#bang-gia-item" class="btn btn-primary">Bảng tính Item &amp; Giá</a>
          <a href="#vang-ngoc" class="btn btn-secondary">Quy đổi Vàng · Ngọc 2 chiều</a>
          <a href="#kich-manh" class="btn btn-outline">Thông tin Kích mảnh</a>
        </div>
      </div>
    </section>

    <section id="bang-gia-item" class="item-pricing-section">
      <div class="container">
        <div class="section-head">
          <div>
            <span class="eyebrow">Chọn số lượng &amp; tự động tính tiền</span>
            <h2>Bảng Mua Bán Item · Đá NC · Sao Pha Lê &amp; Mảnh</h2>
            <p class="pretty-text">Chỉnh số lượng ở dòng cần mua rồi bấm <strong>+ Thêm</strong>, sau đó mở đơn để kiểm tra và gửi sang shop.</p>
          </div>
          <button type="button" id="open-order-from-items-btn" class="btn btn-primary">
            Xem đơn &amp; Gửi FB / Zalo
          </button>
        </div>

        <div class="item-pricing-card">
          <div class="table-toolbar">
            <search>
              <form id="item-search-form" class="search-form" role="search">
                <label for="item-search" class="visually-hidden">Tìm mặt hàng trong bảng</label>
                <div class="search-input-wrap">
                  <svg class="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                    <circle cx="11" cy="11" r="8"/>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  </svg>
                  <input
                    type="search"
                    id="item-search"
                    name="q"
                    autocorrect="off"
                    autocapitalize="off"
                    spellcheck="false"
                    enterkeyhint="search"
                    placeholder="Tìm nhanh: cuồng nộ, bổ huyết, đá nc, dùi đục, sao pha lê, ngọc rồng 3 sao, mảnh khỉ..."
                    autocomplete="off"
                  >
                  <button type="button" id="clear-search-btn" class="btn-clear-search" hidden aria-label="Xóa từ khóa tìm kiếm">Xóa</button>
                </div>
              </form>
            </search>

            <div class="filter-tabs" role="group" aria-label="Lọc nhóm mặt hàng">
              <button type="button" class="filter-btn is-active" data-category="all" aria-pressed="true">Tất cả (${categoryCounts.all})</button>
              <button type="button" class="filter-btn" data-category="item-x99" aria-pressed="false">Item x99 (${categoryCounts["item-x99"]})</button>
              <button type="button" class="filter-btn" data-category="da-duiduc" aria-pressed="false">Đá NC &amp; Dùi đục (${categoryCounts["da-duiduc"]})</button>
              <button type="button" class="filter-btn" data-category="spl" aria-pressed="false">Sao pha lê (${categoryCounts.spl})</button>
              <button type="button" class="filter-btn" data-category="nr-manh" aria-pressed="false">Ngọc Rồng &amp; Mảnh (${categoryCounts["nr-manh"]})</button>
              ${categoryCounts.khac > 0 ? `<button type="button" class="filter-btn" data-category="khac" aria-pressed="false">Vật phẩm khác (${categoryCounts.khac})</button>` : ""}
            </div>
          </div>

          <p id="item-table-status" class="catalog-status" aria-live="polite">Đang hiển thị tất cả ${categoryCounts.all} mặt hàng.</p>

          <div tabindex="0" role="region" aria-labelledby="item-table-caption" class="table-wrapper">
            <table class="item-pricing-table item-catalog-table">
              <caption id="item-table-caption" class="visually-hidden">Bảng chọn số lượng và tính giá Item, Đá NC, Dùi đục, Sao pha lê, Ngọc Rồng 3 sao và Mảnh</caption>
              <thead>
                <tr>
                  <th scope="col">Mặt Hàng</th>
                  <th scope="col">Đơn Giá / Tỉ Lệ</th>
                  <th scope="col">Số Lượng</th>
                  <th scope="col">Thành Tiền</th>
                  <th scope="col">Thao Tác</th>
                </tr>
              </thead>
              <tbody id="item-table-body">
                ${tableRowsHtml}
                <tr id="item-empty-row"${activeItems.length === 0 ? "" : " hidden"}>
                  <td colspan="5" class="item-empty-cell">
                    Không tìm thấy mặt hàng phù hợp với từ khóa hiện tại.
                    <button type="button" id="reset-item-filter-btn" class="btn btn-outline btn-sm">Hiện tất cả</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="table-order-footer">
            <span id="inline-order-summary" class="mono-num" aria-live="polite">Đơn tính nhanh: chưa có mặt hàng nào.</span>
            <button type="button" id="open-order-inline-btn" class="btn btn-primary btn-sm">Mở đơn &amp; Gửi FB / Zalo</button>
          </div>
        </div>
      </div>
    </section>

    <section class="rates-section">
      <div class="container rates-grid">
        <div id="vang-ngoc" class="calculator-card">
          <span class="eyebrow">Quy đổi nhanh 2 chiều</span>
          <h2>Máy Tính Nhanh Vàng &amp; Ngọc</h2>
          <p class="pretty-text">Tính nhẩm nhanh theo <strong>số tiền (VNĐ)</strong> hoặc theo <strong>số vàng / ngọc</strong> muốn mua rồi thêm thẳng vào đơn.</p>

          <form id="rate-calc-form" class="calc-form">
            <fieldset class="calc-fieldset">
              <legend>Chế độ tính</legend>
              <div class="mode-pills">
                <label class="radio-pill" for="mode-by-money">
                  <input type="radio" id="mode-by-money" name="calcMode" value="by-money" checked>
                  <span>Theo số tiền (VNĐ)</span>
                </label>
                <label class="radio-pill" for="mode-by-qty">
                  <input type="radio" id="mode-by-qty" name="calcMode" value="by-qty">
                  <span>Theo số vàng / ngọc</span>
                </label>
              </div>
            </fieldset>

            <fieldset class="calc-fieldset">
              <legend>Chọn loại Vàng / Ngọc</legend>
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
                  <img src="/assets/icons/6765.png" alt="Vé tặng ngọc" width="72" height="72" loading="lazy" class="pill-sprite">
                  <span>Ngọc vé (x10)</span>
                </label>
              </div>
            </fieldset>

            <div class="field-group">
              <label id="calc-input-label" for="calc-amount">Số tiền dự kiến mua (VNĐ, ví dụ 50.000 hoặc 100.000)</label>
              <input
                type="text"
                id="calc-amount"
                name="calcInput"
                value="100.000"
                inputmode="numeric"
                autocomplete="off"
                spellcheck="false"
                required
              >
              <span id="calc-input-hint" class="field-hint">Nhập số tiền VNĐ đầy đủ (ví dụ 50.000 hoặc 100.000).</span>
            </div>

            <div class="calc-output" aria-live="polite">
              <span id="calc-output-label" class="calc-output-label">Ước tính nhận được:</span>
              <strong id="calc-result-main" class="mono-num">1.500.000.000 vàng (1,5 tỷ vàng)</strong>
              <span id="calc-result-sub" class="calc-output-sub">Tương ứng 100.000 đ theo tỉ lệ Vàng tươi x15</span>
            </div>

            <button type="button" id="add-calc-to-order" class="btn btn-primary btn-full">
              + Thêm vào đơn tính nhanh
            </button>
          </form>
        </div>

        <div id="kich-manh" class="manh-summary-card">
          <span class="eyebrow">Thông tin kích mảnh</span>
          <h2>Bảng Thông Tin Các Loại Mảnh</h2>
          <p class="pretty-text">Số lượng mảnh cần để kích hoạt bóng và nâng cấp LV cho từng loại mảnh sưu tầm.</p>

          <ul class="manh-compact-list" role="list">
            ${manhCardsHtml}
          </ul>
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
          <p class="pretty-text">Chỉ tài khoản quản trị của chủ shop mới được phép tải ảnh và đăng bán tài khoản mới lên hệ thống.</p>
        </div>
      </div>

      <form id="admin-login-form" class="secure-form" method="POST" action="/api/auth/login">
        <div class="form-row-2">
          <div class="field-group">
            <label for="login-username">Tên đăng nhập quản trị</label>
            <input type="text" id="login-username" name="username" autocomplete="username" autocorrect="off" autocapitalize="none" spellcheck="false" maxlength="40" required placeholder="Nhập tên đăng nhập">
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
            Hỗ trợ ảnh <code>PNG / JPG / WebP</code> tối đa 5MB để hiển thị rõ nét trong kho tài khoản.
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
            <span id="acc-image-hint" class="field-hint">Chọn ảnh hành trang, đệ tử, chỉ số acc từ máy tính hoặc điện thoại.</span>

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

function renderMuaTaiKhoanView({ accounts, starterAccs = STARTER_ACCS, session, integrity }) {
  const activeStarterAccs = starterAccs.length > 0 ? starterAccs : STARTER_ACCS;
  const accDau5 = findServiceById(activeStarterAccs, STARTER_ACCS, "acc-dau5");
  const accClone = findServiceById(activeStarterAccs, STARTER_ACCS, "acc-clone");

  const starterMarkup = activeStarterAccs.map(
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
          <div class="item-qty-picker item-qty-row" data-item-id="${escapeHtml(acc.id)}" data-item-name="${escapeHtml(acc.name)}" data-item-kind="fixed" data-item-price="${Number(acc.price)}" data-item-unit="${escapeHtml(acc.unit)}" data-item-step="1">
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
          <h3>Kho tài khoản VIP đang được cập nhật thêm</h3>
          <p class="pretty-text">Bạn có thể chọn nhanh Acc Đậu 5 / Acc Clone ở trên hoặc nhắn Zalo <code>${escapeHtml(OFFICIAL_CONTACTS.zaloDisplay)}</code> để shop gửi ảnh acc theo Server yêu cầu.</p>
        </div>`;

  return `
    <section class="subhero-section">
      <div class="container subhero-inner">
        <div class="hero-pills">
          <span class="pill pill-jade">Kho Mua Bán Tài Khoản</span>
          <span class="pill pill-gold">Ảnh Thật · Giá Niêm Yết · Đủ Server</span>
        </div>
        <h1>Mua Bán Tài Khoản Ngọc Rồng Online · Đủ Server</h1>
        <p class="pretty-text">
          Cung cấp Acc Đậu thần cấp 5 (<code>${escapeHtml(formatVndServer(accDau5.price))}</code>), Acc Clone 340k SM (<code>${escapeHtml(formatVndServer(accClone.price))}</code>) và Kho Tài Khoản NRO đủ server Trái Đất · Namếc · Xayda kèm ảnh thật, giá niêm yết và ghi chú minh bạch.
        </p>
        <div class="hero-cta-row">
          <a href="#kho-tai-khoan" class="btn btn-primary">Xem Kho Acc (${accounts.length})</a>
          <a href="#thanh-toan" class="btn btn-outline">Xem STK &amp; Mã QR chính chủ</a>
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

function renderAdminConsoleView({ session, accounts, items = [], services = [], starterAccs = [], auditLogs, cspReports, integrity }) {
  const itemCategoryOptions = ALLOWED_ITEM_CATEGORIES.map(
    (cat) => `<option value="${escapeHtml(cat.id)}">${escapeHtml(cat.label)}</option>`
  ).join("");

  const tagClassLabels = {
    "": "Mặc định",
    "tag-jade": "Xanh ngọc",
    "tag-hot": "Vàng nổi bật",
    "tag-crimson": "Đỏ nổi bật",
    "planet-earth": "Xanh dương (TĐ)",
    "planet-namek": "Xanh lá (Namếc)",
    "planet-xayda": "Vàng đất (Xayda)"
  };

  const tagClassOptions = ALLOWED_ITEM_TAG_CLASSES.map(
    (cls) => `<option value="${escapeHtml(cls)}">${escapeHtml(tagClassLabels[cls] || cls)}</option>`
  ).join("");

  const bundledIconOptions = BUNDLED_ITEM_ICONS.map(
    (ic) => `<option value="${escapeHtml(ic.path)}">${escapeHtml(ic.label)}</option>`
  ).join("");

  const unitPresetChips = ["cái", "viên", "x99", "bộ", "mảnh", "lô 999", "lượt"]
    .map((u) => `<button type="button" class="btn btn-outline btn-sm admin-unit-chip" data-unit="${escapeHtml(u)}">${escapeHtml(u)}</button>`)
    .join("");

  const adminItemRowsHtml =
    items.length === 0
      ? '<tr><td colspan="4">Chưa có mặt hàng nào. Hãy thêm mặt hàng mới ở biểu mẫu bên trên.</td></tr>'
      : items
          .map((item) => {
            const hiddenBadge = item.isActive
              ? '<span class="tag-pill tag-jade">Đang bán</span>'
              : '<span class="tag-pill tag-crimson">Đang ẩn</span>';
            const tagBadge = item.tag
              ? `<span class="tag-pill ${escapeHtml(item.tagClass || "")}">${escapeHtml(item.tag)}</span>`
              : "";
            const priceCellInner =
              item.kind === "quote"
                ? `<span class="tag-pill">Báo giá theo lô</span><span class="admin-unit-caption">Khách liên hệ Zalo / FB</span>`
                : `<div class="admin-inline-price-box">
                    <input type="number" class="admin-inline-price-input mono-num" value="${Number(item.price)}" min="100" max="500000000" step="100" inputmode="numeric" aria-label="Đơn giá ${escapeHtml(item.name)}">
                    <button type="button" class="btn btn-outline btn-sm admin-item-save-price-btn" data-item-db-id="${Number(item.dbId)}">Lưu giá</button>
                  </div>
                  <span class="admin-unit-caption mono-num">${escapeHtml(item.unitPriceLabel)}</span>`;

            return `
              <tr data-item-db-id="${Number(item.dbId)}" class="${item.isActive ? "" : "is-hidden-row"}">
                <th scope="row" class="th-admin-item">
                  <div class="table-item-cell">
                    <img src="${escapeHtml(item.icon)}" alt="" width="${Number(item.width) || 48}" height="${Number(item.height) || 48}" class="table-sprite">
                    <div class="table-item-copy">
                      <div class="table-item-title-row">
                        <strong>${escapeHtml(item.name)}</strong>
                        <span class="cat-badge">${escapeHtml(item.group)}</span>
                        ${tagBadge}
                      </div>
                      <span class="table-item-desc">${escapeHtml(item.desc || "")}</span>
                    </div>
                  </div>
                </th>
                <td class="td-admin-price">${priceCellInner}</td>
                <td class="td-admin-status">${hiddenBadge}</td>
                <td class="td-admin-actions">
                  <div class="table-action-group">
                    <button type="button" class="btn btn-outline btn-sm admin-item-edit-btn" data-item-db-id="${Number(item.dbId)}">Sửa</button>
                    <button type="button" class="btn btn-outline btn-sm admin-item-toggle-btn" data-item-db-id="${Number(item.dbId)}" data-next-active="${item.isActive ? "0" : "1"}">${item.isActive ? "Ẩn" : "Hiện"}</button>
                    <button type="button" class="btn btn-danger-outline btn-sm admin-item-delete-btn" data-item-db-id="${Number(item.dbId)}" data-item-name="${escapeHtml(item.name)}">Xóa</button>
                  </div>
                </td>
              </tr>
            `;
          })
          .join("");

  const combinedServices = [...services, ...starterAccs];
  const adminServicesRowsHtml = combinedServices
    .map(
      (svc) => `
      <tr data-service-key="${escapeHtml(svc.id)}">
        <th scope="row" class="th-admin-svc">
          <div class="admin-svc-head">
            <span class="cat-badge">${svc.kind === "starter" ? "Acc Phổ Thông" : "Dịch Vụ"}</span>
            <input type="text" class="admin-svc-name-input" value="${escapeHtml(svc.name)}" maxlength="90" aria-label="Tên ${escapeHtml(svc.name)}">
            <span class="admin-unit-caption mono-num">Hiển thị: ${escapeHtml(svc.priceText)}</span>
          </div>
        </th>
        <td class="td-admin-svc-note">
          <input type="text" class="admin-svc-note-input" value="${escapeHtml(svc.note || "")}" maxlength="300" aria-label="Mô tả ${escapeHtml(svc.name)}">
        </td>
        <td class="td-admin-svc-price">
          <div class="admin-inline-price-box">
            <input type="number" class="admin-svc-price-input mono-num" value="${Number(svc.price)}" min="0" max="500000000" step="1000" inputmode="numeric" aria-label="Giá ${escapeHtml(svc.name)}">
            <span class="admin-unit-suffix">/ ${escapeHtml(svc.unit)}</span>
          </div>
          <span class="admin-unit-caption">(0 = Báo giá Zalo / FB)</span>
        </td>
        <td class="td-admin-actions">
          <button type="button" class="btn btn-primary btn-sm admin-svc-save-btn" data-service-key="${escapeHtml(svc.id)}">Lưu</button>
        </td>
      </tr>
    `
    )
    .join("");

  const quickNavBlock = session
    ? `
      <nav class="admin-quick-nav container" aria-label="Điều hướng nhanh quản trị">
        <a href="#admin-items-section" class="btn btn-outline btn-sm">Thêm &amp; Sửa Item (<span id="admin-nav-items-count">${items.length}</span>)</a>
        <a href="#admin-services-section" class="btn btn-outline btn-sm">Giá Dịch Vụ (${combinedServices.length})</a>
        <a href="#admin-upload-box" class="btn btn-outline btn-sm">Đăng Acc Mới</a>
        <a href="#admin-acc-section" class="btn btn-outline btn-sm">Kho Acc (<span id="admin-nav-acc-count">${accounts.length}</span>)</a>
        <a href="#admin-audit-section" class="btn btn-outline btn-sm">Nhật ký</a>
      </nav>
    `
    : "";

  const adminMgmtBlock = session
    ? `
      <section id="admin-items-section" class="admin-mgmt-section">
        <div class="container">
          <div class="section-head">
            <div>
              <span class="eyebrow">Quản lý kho Item &amp; Giá bán</span>
              <h2>Thêm Mặt Hàng Mới &amp; Chỉnh Sửa Giá Item (<span id="admin-items-count">${items.length}</span>)</h2>
              <p class="pretty-text">Mặt hàng thêm mới hoặc sửa giá sẽ cập nhật ngay trên trang Mua Item cho khách chọn đơn.</p>
            </div>
          </div>

          <div class="admin-panel-card admin-item-form-card">
            <div id="item-edit-banner" class="admin-edit-banner" hidden>
              <span>Đang chỉnh sửa mặt hàng: <strong id="item-edit-banner-name"></strong></span>
              <button type="button" id="item-edit-cancel-btn" class="btn btn-outline btn-sm">Hủy sửa &amp; Thêm mới</button>
            </div>

            <form id="admin-item-form" class="secure-form" method="POST" action="/api/items" enctype="multipart/form-data">
              <input type="hidden" id="item-edit-id" value="">

              <div class="form-row-2">
                <div class="field-group">
                  <label for="item-name">Tên mặt hàng cần bán <span class="req-star">*</span></label>
                  <input type="text" id="item-name" name="name" maxlength="90" required placeholder="Ví dụ: Bông tai Porata cấp 2 / Cải trang Broly">
                </div>

                <div class="field-group">
                  <label for="item-category">Nhóm danh mục <span class="req-star">*</span></label>
                  <select id="item-category" name="category" required>
                    ${itemCategoryOptions}
                  </select>
                </div>
              </div>

              <div class="form-row-2">
                <div class="field-group">
                  <label for="item-kind">Hình thức tính giá <span class="req-star">*</span></label>
                  <select id="item-kind" name="kind">
                    <option value="fixed">Cố định đơn giá (VNĐ)</option>
                    <option value="quote">Báo giá theo lô (Khách nhắn Zalo/FB)</option>
                  </select>
                </div>

                <div class="field-group">
                  <label for="item-price">Đơn giá (VNĐ) <span class="req-star">*</span></label>
                  <input type="number" id="item-price" name="price" min="100" max="500000000" step="100" inputmode="numeric" value="10000" required>
                  <span id="admin-item-price-preview" class="field-hint mono-num">Hiển thị: 10.000 đ / 1 cái</span>
                </div>
              </div>

              <div class="form-row-2">
                <div class="field-group">
                  <label for="item-unit">Đơn vị bán <span class="req-star">*</span></label>
                  <input type="text" id="item-unit" name="unit" maxlength="24" value="cái" required placeholder="cái, viên, x99, bộ, mảnh, lô 999">
                  <div class="admin-unit-chips" aria-label="Chọn nhanh đơn vị">
                    ${unitPresetChips}
                  </div>
                </div>

                <div class="form-row-2">
                  <div class="field-group">
                    <label for="item-default-qty">SL mặc định trong bảng</label>
                    <input type="number" id="item-default-qty" name="defaultQty" min="1" max="9999" value="1" inputmode="numeric">
                  </div>
                  <div class="field-group">
                    <label for="item-sort-order">Thứ tự ưu tiên</label>
                    <input type="number" id="item-sort-order" name="sortOrder" min="0" max="9999" value="200" inputmode="numeric">
                  </div>
                </div>
              </div>

              <div class="form-row-2">
                <div class="field-group">
                  <label for="item-tag">Nhãn nổi bật ngắn (tuỳ chọn)</label>
                  <input type="text" id="item-tag" name="tag" maxlength="32" placeholder="Ví dụ: Sẵn kho, Giá mềm, Mới về">
                </div>

                <div class="field-group">
                  <label for="item-tag-class">Màu nhãn</label>
                  <select id="item-tag-class" name="tagClass">
                    ${tagClassOptions}
                  </select>
                </div>
              </div>

              <div class="admin-icon-picker-row">
                <div class="item-slot admin-icon-preview-box" aria-hidden="true">
                  <img id="admin-item-icon-preview" src="/assets/icons/2754.png" alt="Xem trước icon mặt hàng" width="48" height="48" class="game-sprite">
                </div>

                <div class="field-group">
                  <label for="item-icon-select">Chọn biểu tượng Item có sẵn</label>
                  <select id="item-icon-select" name="icon">
                    ${bundledIconOptions}
                  </select>
                </div>

                <div class="field-group">
                  <label for="item-icon-file">Hoặc tải ảnh Icon riêng (PNG/JPG/WebP ≤ 5MB)</label>
                  <div class="admin-icon-file-wrap">
                    <input type="file" id="item-icon-file" name="iconFile" accept="image/png,image/jpeg,image/webp">
                    <button type="button" id="item-icon-file-clear" class="btn btn-outline btn-sm" hidden>Bỏ ảnh riêng</button>
                  </div>
                </div>
              </div>

              <div class="field-group">
                <label for="item-desc">Mô tả công dụng / nội dung chi tiết <span class="req-star">*</span></label>
                <textarea id="item-desc" name="desc" rows="2" maxlength="240" required placeholder="Ví dụ: Tăng sức đánh, chỉ số hoặc lưu ý quy cách giao dịch cho khách hàng..."></textarea>
              </div>

              <div class="form-row-2">
                <div class="field-group">
                  <label for="item-keywords">Từ khóa tìm kiếm nhanh (tuỳ chọn)</label>
                  <input type="text" id="item-keywords" name="keywords" maxlength="180" placeholder="Ví dụ: cải trang bong tai porata x99 vip">
                </div>

                <div class="field-group">
                  <span class="field-label-text">Trạng thái hiển thị</span>
                  <label class="radio-pill admin-checkbox-pill" for="item-is-active">
                    <input type="checkbox" id="item-is-active" name="isActive" value="1" checked>
                    <span>Hiển thị công khai trên trang Mua Item</span>
                  </label>
                </div>
              </div>

              <p id="admin-item-status" class="form-status" role="status" hidden></p>

              <div class="form-actions-row">
                <button type="submit" id="admin-item-submit" class="btn btn-primary">+ Thêm Item Vào Bảng Giá</button>
                <button type="button" id="admin-item-reset-btn" class="btn btn-outline">Làm mới biểu mẫu</button>
              </div>
            </form>
          </div>

          <div class="item-pricing-card admin-items-list-card">
            <div class="table-toolbar">
              <div class="search-input-wrap">
                <svg class="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                  <circle cx="11" cy="11" r="8"/>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <input type="search" id="admin-item-search" placeholder="Lọc nhanh item cần chỉnh giá hoặc sửa mô tả..." autocomplete="off">
              </div>
            </div>

            <p id="admin-items-status" class="catalog-status" aria-live="polite">Đang có ${items.length} mặt hàng trong kho bảng giá.</p>

            <div tabindex="0" role="region" aria-labelledby="admin-items-caption" class="table-wrapper admin-table-wrapper">
              <table class="item-pricing-table admin-cms-table" id="admin-items-table">
                <caption id="admin-items-caption" class="visually-hidden">Danh sách Item, chỉnh giá nhanh, ẩn hiện và xóa mặt hàng</caption>
                <thead>
                  <tr>
                    <th scope="col">Mặt hàng &amp; Nội dung</th>
                    <th scope="col">Đơn giá (VNĐ)</th>
                    <th scope="col">Trạng thái</th>
                    <th scope="col">Thao tác</th>
                  </tr>
                </thead>
                <tbody id="admin-items-tbody">
                  ${adminItemRowsHtml}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      <section id="admin-services-section" class="admin-mgmt-section admin-services-mgmt-section">
        <div class="container">
          <div class="section-head">
            <div>
              <span class="eyebrow">Cập nhật giá dịch vụ &amp; Acc phổ thông</span>
              <h2>Chỉnh Sửa Giá Kích Điểm · Nạp CR · Thuê Set · Acc Đậu 5 / Clone</h2>
              <p class="pretty-text">Thay đổi trực tiếp tên, mô tả hoặc giá bán rồi bấm <strong>Lưu</strong> ở dòng tương ứng.</p>
            </div>
          </div>

          <div class="item-pricing-card">
            <div tabindex="0" role="region" aria-labelledby="admin-services-caption" class="table-wrapper admin-table-wrapper">
              <table class="item-pricing-table admin-cms-table" id="admin-services-table">
                <caption id="admin-services-caption" class="visually-hidden">Chỉnh sửa giá và mô tả dịch vụ và Acc phổ thông</caption>
                <thead>
                  <tr>
                    <th scope="col">Dịch vụ / Loại Acc</th>
                    <th scope="col">Nội dung mô tả</th>
                    <th scope="col">Giá bán (VNĐ)</th>
                    <th scope="col">Lưu</th>
                  </tr>
                </thead>
                <tbody id="admin-services-tbody">
                  ${adminServicesRowsHtml}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      <section id="admin-acc-section" class="admin-mgmt-section">
        <div class="container">
          <div class="section-head">
            <div>
              <span class="eyebrow">Quản lý kho Acc</span>
              <h2>Danh Sách Tài Khoản Đã Đăng (<span id="admin-acc-count">${accounts.length}</span>)</h2>
            </div>
          </div>

          <div class="item-pricing-card">
            <div tabindex="0" role="region" aria-labelledby="admin-acc-caption" class="table-wrapper admin-table-wrapper">
              <table class="item-pricing-table admin-cms-table" id="admin-acc-table">
                <caption id="admin-acc-caption">Quản lý giá, sửa thông tin, trạng thái &amp; xóa tài khoản đã đăng</caption>
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
                          <th scope="row" class="mono-num"><strong>#${escapeHtml(acc.code)}</strong></th>
                          <td>
                            <div class="table-item-cell">
                              <img src="${escapeHtml(acc.image_path)}" alt="" width="${Number(acc.image_width)}" height="${Number(acc.image_height)}" class="table-sprite">
                              <span>${escapeHtml(acc.title)}</span>
                            </div>
                          </td>
                          <td>${escapeHtml(acc.server_name)} · ${escapeHtml(acc.planet)}</td>
                          <td class="td-admin-price">
                            <div class="admin-inline-price-box">
                              <input type="number" class="acc-inline-price-input admin-inline-price-input mono-num" value="${Number(acc.price_vnd)}" min="1000" max="500000000" step="1000" inputmode="numeric" aria-label="Giá Acc ${escapeHtml(acc.code)}">
                              <button type="button" class="btn btn-outline btn-sm acc-save-price-btn" data-acc-id="${Number(acc.id)}">Lưu giá</button>
                            </div>
                            <span class="admin-unit-caption mono-num">${escapeHtml(formatVndServer(acc.price_vnd))}</span>
                          </td>
                          <td>
                            <span class="tag-pill ${acc.status === "sold" ? "tag-crimson" : "tag-jade"}">
                              ${acc.status === "sold" ? "Đã bán" : "Đang bán"}
                            </span>
                          </td>
                          <td class="td-admin-actions">
                            <div class="table-action-group">
                              <button type="button" class="btn btn-outline btn-sm acc-edit-btn" data-acc-id="${Number(acc.id)}">Sửa</button>
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

          <div id="admin-audit-section" class="security-audit-grid">
            <div class="rates-table-card">
              <span class="eyebrow">Nhật ký hoạt động</span>
              <h3>Lịch Sử Đăng Nhập &amp; Thao Tác</h3>
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
              <span class="eyebrow">Theo dõi an toàn trang web</span>
              <h3>Cảnh Báo Bất Thường</h3>
              <div class="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th scope="col">Thời gian</th>
                      <th scope="col">Loại cảnh báo</th>
                      <th scope="col">Nguồn lạ</th>
                      <th scope="col">Chi tiết</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${
                      cspReports.length === 0
                        ? '<tr><td colspan="4">Không ghi nhận dấu hiệu bất thường nào.</td></tr>'
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
          <span class="pill pill-jade">Khu vực quản trị</span>
          <span class="pill pill-gold">Quản lý Item · Giá · Tài khoản</span>
        </div>
        <h1>Quản Trị Shop Thanh Dung</h1>
        <p class="pretty-text">
          Khu vực dành riêng cho chủ shop để thêm/sửa mặt hàng, chỉnh giá dịch vụ, đăng bán tài khoản kèm hình ảnh và theo dõi thanh toán chính chủ MB Bank <code>${escapeHtml(OFFICIAL_BANK.accountNumber)}</code>.
        </p>
      </div>
    </section>

    ${quickNavBlock}

    <section class="admin-shield-section">
      <div class="container">
        <div class="shield-card">
          <div>
            <span class="eyebrow">Thông tin chính chủ đang áp dụng</span>
            <h2>Trạng Thái Thanh Toán &amp; Liên Hệ Chính Thức</h2>
            <ul class="bank-verify-list">
              <li><strong>Trạng thái mã QR:</strong> <code>${integrity.ok ? "Đang dùng đúng ảnh QR chính chủ" : "Cảnh báo: Ảnh mã QR không khớp bản gốc"}</code></li>
              <li><strong>Ngân hàng &amp; STK:</strong> <code>${escapeHtml(OFFICIAL_BANK.accountNumber)}</code> — <strong>${escapeHtml(OFFICIAL_BANK.accountOwner)}</strong> (${escapeHtml(OFFICIAL_BANK.bankShort)})</li>
              <li><strong>Facebook &amp; Zalo:</strong> <code>${escapeHtml(OFFICIAL_CONTACTS.facebookHandle)}</code> · Zalo <code>${escapeHtml(OFFICIAL_CONTACTS.zaloDisplay)}</code></li>
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
  const services = Array.isArray(data.services) && data.services.length > 0 ? data.services : KICH_DIEM_SERVICES;
  const starterAccs = Array.isArray(data.starterAccs) && data.starterAccs.length > 0 ? data.starterAccs : STARTER_ACCS;
  const items = Array.isArray(data.items) ? data.items : ITEM_PRICE_ROWS;
  let mainHtml = "";

  if (route === "/kich-diem") {
    mainHtml = renderKichDiemView({ services, integrity });
  } else if (route === "/mua-item") {
    mainHtml = renderMuaItemView({ items, integrity });
  } else if (route === "/mua-tai-khoan") {
    mainHtml = renderMuaTaiKhoanView({
      accounts: data.accounts || [],
      starterAccs,
      session,
      integrity
    });
  } else if (route === "/admin") {
    mainHtml = renderAdminConsoleView({
      session,
      accounts: data.accounts || [],
      items: data.items || [],
      services,
      starterAccs,
      auditLogs: data.auditLogs || [],
      cspReports: data.cspReports || [],
      integrity
    });
  } else {
    mainHtml = renderHomeView({
      latestAccounts: data.accounts || [],
      services,
      starterAccs,
      integrity
    });
  }

  const csrfMetaTag = csrfToken
    ? `<meta name="csrf-token" content="${escapeHtml(csrfToken)}">`
    : "";
  const robotsMetaTag =
    route === "/admin" ? `<meta name="robots" content="noindex, nofollow">` : "";

  const accEditServerOptions = ALLOWED_SERVERS.map(
    (sv) => `<option value="${escapeHtml(sv)}">${escapeHtml(sv)}</option>`
  ).join("");
  const accEditPlanetOptions = ALLOWED_PLANETS.map(
    (pl) => `<option value="${escapeHtml(pl)}">${escapeHtml(pl)}</option>`
  ).join("");
  const accEditDialogHtml =
    route === "/admin" && session
      ? `
  <!-- Admin Account Edit Dialog -->
  <dialog id="acc-edit-dialog" closedby="any" aria-labelledby="acc-edit-title">
    <div class="dialog-shell">
      <div class="dialog-head">
        <div>
          <h2 id="acc-edit-title">Chỉnh Sửa Tài Khoản <span id="acc-edit-code-label" class="mono-num"></span></h2>
          <p class="dialog-sub">Cập nhật tiêu đề, giá bán, server, hành tinh hoặc ghi chú rao bán.</p>
        </div>
        <form method="dialog">
          <button type="submit" class="btn-dialog-close" aria-label="Đóng hộp thoại sửa tài khoản">&times;</button>
        </form>
      </div>

      <form id="acc-edit-form" class="secure-form">
        <input type="hidden" id="acc-edit-id" value="">

        <div class="field-group">
          <label for="acc-edit-title-input">Tiêu đề tài khoản <span class="req-star">*</span></label>
          <input type="text" id="acc-edit-title-input" name="title" minlength="3" maxlength="90" required autofocus>
        </div>

        <div class="form-row-2">
          <div class="field-group">
            <label for="acc-edit-price-input">Giá bán (VNĐ) <span class="req-star">*</span></label>
            <input type="number" id="acc-edit-price-input" name="price_vnd" min="1000" max="500000000" step="1000" inputmode="numeric" required>
            <span id="acc-edit-price-preview" class="field-hint mono-num">Hiển thị: —</span>
          </div>

          <div class="field-group">
            <label for="acc-edit-server-select">Server <span class="req-star">*</span></label>
            <select id="acc-edit-server-select" name="server_name" required>
              ${accEditServerOptions}
            </select>
          </div>
        </div>

        <div class="field-group">
          <label for="acc-edit-planet-select">Hành tinh <span class="req-star">*</span></label>
          <select id="acc-edit-planet-select" name="planet" required>
            ${accEditPlanetOptions}
          </select>
        </div>

        <div class="field-group">
          <label for="acc-edit-note-input">Ghi chú rao bán chi tiết <span class="req-star">*</span></label>
          <textarea id="acc-edit-note-input" name="note" rows="4" minlength="3" maxlength="1200" required></textarea>
        </div>

        <p id="acc-edit-status" class="form-status" role="status" hidden></p>

        <div class="dialog-actions">
          <button type="submit" id="acc-edit-submit-btn" class="btn btn-primary">Lưu thay đổi Acc</button>
          <button type="button" id="acc-edit-cancel-btn" class="btn btn-outline">Hủy</button>
        </div>
      </form>
    </div>
  </dialog>`
      : "";

  return `<!DOCTYPE html>
<html lang="vi" data-palette="namek-jade">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <meta name="color-scheme" content="light dark">
  ${robotsMetaTag}
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
          </span>
        </a>

        <nav class="primary-nav" aria-label="Điều hướng chính">
          ${renderNavLinks(route)}
        </nav>

        <div class="header-actions">
          <button type="button" id="theme-toggle" class="btn-icon-ghost" aria-pressed="false" aria-label="Chuyển chế độ Sáng hoặc Tối">
            <svg class="icon-svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="4"/>
              <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
            </svg>
            <span id="theme-toggle-label" class="theme-toggle-text">Chế độ Tối</span>
          </button>

          <button type="button" id="open-order-btn" class="btn-order" aria-label="Mở đơn tính nhanh">
            <svg class="icon-svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 0 1-8 0"/>
            </svg>
            <span class="order-btn-label">Đơn tính nhanh</span>
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
      <strong>Cảnh báo an toàn giao dịch!</strong>
      <span>Phát hiện dấu hiệu thay đổi bất thường về đường dẫn liên hệ hoặc số tài khoản trên trình duyệt. Hệ thống đã tự khôi phục về thông tin chính chủ (${escapeHtml(OFFICIAL_BANK.accountNumber)} - ${escapeHtml(OFFICIAL_BANK.accountOwner)}).</span>
    </div>

    ${mainHtml}
  </main>

  <footer class="site-footer">
    <div class="container footer-inner">
      <div>
        <strong class="footer-brand">${escapeHtml(OFFICIAL_CONTACTS.shopName)}</strong>
        <p class="footer-note">Danh mục: <a href="/kich-diem">Kích điểm &amp; Dịch vụ</a> · <a href="/mua-item">Mua Item</a> · <a href="/mua-tai-khoan">Mua Tài khoản</a> — STK MB Bank duy nhất: <code class="mono-num">${escapeHtml(OFFICIAL_BANK.accountNumber)}</code></p>
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

      <div class="order-syntax-panel">
        <div class="order-syntax-head">
          <label for="order-syntax-text">
            <strong>Cú pháp tin nhắn theo đơn đặt:</strong>
          </label>
          <button type="button" id="copy-syntax-btn" class="btn btn-outline btn-sm">Sao chép cú pháp</button>
        </div>
        <textarea id="order-syntax-text" class="order-syntax-textarea mono-num" readonly rows="5" spellcheck="false" placeholder="Cú pháp tin nhắn gửi shop sẽ tự động hiển thị tại đây khi bạn chọn sản phẩm..."></textarea>
        <span class="order-syntax-hint">Cú pháp được tạo tự động chuẩn hóa. Khi bấm <strong>Gửi đơn vào Zalo / Facebook</strong>, hệ thống sẽ tự sao chép cú pháp này để bạn chỉ cần Dán (Ctrl+V) gửi chủ shop.</span>
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

  <!-- Order Syntax Copied Confirmation Dialog -->
  <dialog id="order-confirm-dialog" class="confirm-dialog" closedby="any" aria-labelledby="order-confirm-title">
    <div class="dialog-shell confirm-shell">
      <div class="dialog-head confirm-head">
        <div class="confirm-title-group">
          <span class="confirm-badge-icon" aria-hidden="true">✓</span>
          <div>
            <h2 id="order-confirm-title">Đã Sao Chép Cú Pháp Đơn Hàng</h2>
            <p class="dialog-sub">Cú pháp đã sẵn sàng trong bộ nhớ tạm.</p>
          </div>
        </div>
        <form method="dialog">
          <button type="submit" class="btn-dialog-close" aria-label="Đóng thông báo">&times;</button>
        </form>
      </div>

      <div class="confirm-body">
        <p class="confirm-guide">
          Hệ thống đã tự động tạo và sao chép cú pháp theo đơn đặt của bạn. Hãy bấm <strong>OK</strong> bên dưới để mở <span id="confirm-platform-name">Zalo</span>, sau đó chỉ cần <strong>Dán (Ctrl + V / Giữ màn hình chọn Dán)</strong> vào khung chat gửi shop.
        </p>

        <div class="confirm-preview-wrap">
          <div class="confirm-preview-head">
            <label for="confirm-syntax-preview">Nội dung cú pháp đã sao chép:</label>
            <button type="button" id="confirm-recopy-btn" class="btn btn-outline btn-sm">Copy lại</button>
          </div>
          <textarea id="confirm-syntax-preview" class="confirm-syntax-textarea mono-num" readonly rows="6" spellcheck="false" aria-label="Nội dung cú pháp đơn hàng đã sao chép"></textarea>
        </div>
      </div>

      <div class="dialog-actions confirm-actions">
        <button type="button" id="confirm-open-chat-btn" class="btn btn-zalo btn-lg">OK — Nhắn Tin Qua Zalo</button>
        <button type="button" id="confirm-back-btn" class="btn btn-outline">Xem lại đơn</button>
      </div>
    </div>
  </dialog>

  <!-- Account Image Lightbox Dialog -->
  <dialog id="acc-lightbox-dialog" class="lightbox-dialog" closedby="any" aria-labelledby="acc-lightbox-title">
    <div class="dialog-shell lightbox-shell">
      <div class="dialog-head">
        <div>
          <h2 id="acc-lightbox-title">Chi tiết ảnh Tài Khoản</h2>
          <p id="acc-lightbox-sub" class="dialog-sub"></p>
        </div>
        <div class="lightbox-head-actions">
          <button type="button" id="acc-zoom-reset-btn" class="btn btn-outline btn-sm mono-num" aria-live="polite" title="Bấm để đưa ảnh về kích thước 100% (phím 0)">100%</button>
          <a id="acc-lightbox-raw-link" href="/assets/favicon.svg" target="_blank" rel="noopener noreferrer" class="btn btn-outline btn-sm">Ảnh gốc &nearr;</a>
          <button type="button" id="acc-lightbox-expand-btn" class="btn btn-outline btn-sm" aria-pressed="false">Toàn khung</button>
          <form method="dialog">
            <button type="submit" id="acc-lightbox-close-btn" class="btn-dialog-close" autofocus aria-label="Đóng xem ảnh acc">&times;</button>
          </form>
        </div>
      </div>

      <p id="acc-lightbox-hint" class="lightbox-gesture-hint">PC: Cuộn con lăn chuột hoặc bấm vào ảnh để phóng to, kéo thả để soi từng góc · Điện thoại: Dùng 2 ngón tay kéo ra / thu vào để phóng to.</p>

      <div id="acc-lightbox-stage" class="lightbox-stage" data-zoom="fit" data-fit-axis="width" tabindex="0" aria-label="Khung xem ảnh tài khoản có thể phóng to và kéo">
        <div class="lightbox-stage-inner">
          <img id="acc-lightbox-img" src="/assets/favicon.svg" alt="Ảnh tài khoản chi tiết" width="800" height="450" draggable="false">
        </div>
      </div>

      <p id="acc-lightbox-note" class="acc-note-text lightbox-note"></p>
      <div class="dialog-actions">
        <button type="button" id="acc-lightbox-add-btn" class="btn btn-primary">+ Thêm Acc này vào đơn</button>
        <a id="acc-lightbox-zalo-link" href="${escapeHtml(OFFICIAL_CONTACTS.zaloUrl)}" target="_blank" rel="noopener noreferrer" data-verified-role="zalo-link" class="btn btn-zalo">Hỏi mua qua Zalo</a>
      </div>
    </div>
  </dialog>
  ${accEditDialogHtml}

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

(() => {
  "use strict";

  const VERIFIED = Object.freeze({
    facebookUrl: "https://www.facebook.com/Thanhdungg.Kem",
    zaloUrl: "http://zalo.me/84368018920",
    zaloBoxSp1Url: "https://zalo.me/g/ryvnof825",
    fbGroupSp123Url: "https://www.facebook.com/groups/661620508010330?locale=vi_VN",
    zaloRawPhone: "0368018920",
    accountOwner: "NGUYỄN HOÀNG THANH DUNG",
    accountNumber: "0368018920",
    qrImageUrl: "/assets/qr-mb-thanhdung.jpg"
  });

  let fullAdPostText = [
    "🔥 SHOP NGỌC RỒNG ONLINE THANH DUNG 🔥",
    "✅ Nhận kích điểm 300.000 đ - nạp CR 810.000 đ done 3s",
    "✅ Bán x99 Cuồng nộ 15.000 đ / x99 - x99 Bổ huyết 10.000 đ / x99 - x99 Giáp Xên bọ hung 10.000 đ / x99",
    "✅ Bán x999 đá nâng cấp các loại 20.000 đ / 999 - dùi đục 10.000 đ / 1 cái có SLL",
    "✅ Bán x99 máy dò CSKB 40.000 đ / x99",
    "✅ Cho thuê set thần 3 hành tinh up thức ăn, set SMTN TĐ, XD 5s 10.000 đ / 1 ngày",
    "✅ Bán vàng tươi x15, vàng die x60 - ngọc kí x11, ngọc vé (ID 718) x10",
    "✅ Bán SPL 4 loại: Đỏ 441 (Hút HP), Lam 442 (Hút KI), Vàng 446 (+5% vàng), Lục 447 (+5% TNSM) — 1.000 đ / 1 viên",
    "✅ Bán mảnh khỉ (10/125/125), mảnh rồng (3/15), mảnh Đội trưởng Vàng (10/30)",
    "✅ Nhận săn đệ SS - skill 5",
    "✅ Bán acc đậu 5 8.000 đ / 1 acc - acc clone 340k SM 3.000 đ / 1 acc",
    "✅ Bán NR 3s 2.500 đ / 1 viên",
    "✅ Nhận rút VTS tín dụng",
    "✅ Nhận GDTG 20/24 siêu tốc (không nhận mail sống)",
    "✅ Thu all acc + đồ tầm trung => siêu phẩm (BMTT ko bắt scam)",
    `📌 Link box sp1: ${VERIFIED.zaloBoxSp1Url}`,
    `📌 Link group sp123 Thanh Dung: ${VERIFIED.fbGroupSp123Url}`,
    `🏦 MB Bank chính chủ: ${VERIFIED.accountNumber} - ${VERIFIED.accountOwner}`,
    `💬 Facebook: ${VERIFIED.facebookUrl}`,
    `💬 Zalo: ${VERIFIED.zaloUrl} (0368.018.920)`
  ].join("\n");

  const metaCsrfEl = document.querySelector('meta[name="csrf-token"]');
  let csrfToken = metaCsrfEl ? metaCsrfEl.getAttribute("content") || "" : "";

  const readStorage = (key) => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  };

  const writeStorage = (key, value) => {
    try {
      localStorage.setItem(key, value);
    } catch {
      // Ignore storage quota errors
    }
  };

  const removeStorage = (key) => {
    try {
      localStorage.removeItem(key);
    } catch {
      // Ignore storage errors
    }
  };

  const formatNumber = (num) => new Intl.NumberFormat("vi-VN").format(num);

  const formatVND = (amount) => {
    if (!amount || amount <= 0) return "Liên hệ";
    return `${formatNumber(amount)} đ`;
  };

  const normalizeText = (str) =>
    (str || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d");

  const safeImagePath = (src) => {
    if (typeof src !== "string") return "/assets/favicon.svg";
    if (/^\/uploads\/[0-9a-f-]{36}\.(png|jpg|webp)$/.test(src)) return src;
    if (/^\/assets\/[A-Za-z0-9._/-]+$/.test(src) && !src.includes("..")) return src;
    return "/assets/favicon.svg";
  };

  /* =========================================================
     1. Toast Notifications (Native Popover API + Fallback)
     ========================================================= */
  const toastEl = document.getElementById("app-toast");
  const toastMsgEl = document.getElementById("toast-message");
  const toastCloseBtn = document.getElementById("toast-close-btn");
  const supportsPopover = "popover" in HTMLElement.prototype;
  let toastTimer = null;

  const hideToast = () => {
    if (!toastEl) return;
    if (supportsPopover) {
      if (toastEl.matches(":popover-open")) {
        toastEl.hidePopover();
      }
    } else {
      toastEl.classList.remove("is-open");
    }
  };

  const showToast = (message) => {
    if (!toastEl || !toastMsgEl) return;
    toastMsgEl.textContent = message;

    if (supportsPopover) {
      if (!toastEl.matches(":popover-open")) {
        toastEl.showPopover();
      }
    } else {
      toastEl.classList.add("is-open");
    }

    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(hideToast, 4000);
  };

  if (toastCloseBtn && !supportsPopover) {
    toastCloseBtn.addEventListener("click", hideToast);
  }

  /* =========================================================
     2. Reliable Clipboard Helper (Zero inline styles for CSP)
     ========================================================= */
  const orderDialog = document.getElementById("order-dialog");

  const copyTextSync = (text) => {
    const host = orderDialog && orderDialog.open ? orderDialog : document.body;
    const prevFocus = document.activeElement;
    const temp = document.createElement("textarea");
    temp.value = text;
    temp.setAttribute("readonly", "");
    temp.className = "clipboard-proxy";
    host.appendChild(temp);
    temp.focus();
    temp.select();

    let copied = false;
    try {
      copied = document.execCommand("copy");
    } catch {
      copied = false;
    }
    host.removeChild(temp);
    if (prevFocus && typeof prevFocus.focus === "function") {
      prevFocus.focus({ preventScroll: true });
    }

    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).catch(() => {});
      copied = true;
    }
    return copied;
  };

  const copyToClipboard = (text, label) => {
    const ok = copyTextSync(text);
    if (ok) {
      showToast(`Đã sao chép ${label}!`);
    } else {
      showToast("Trình duyệt chặn copy tự động, bạn hãy bôi đen và copy thủ công.");
    }
    return ok;
  };

  /* =========================================================
     3. Anti-Tamper DOM Guard & Backend Verification
     ========================================================= */
  const tamperBanner = document.getElementById("tamper-warning-banner");
  let suppressObserver = false;

  const expectedByRole = {
    "fb-link": { attr: "href", value: VERIFIED.facebookUrl },
    "zalo-link": { attr: "href", value: VERIFIED.zaloUrl },
    "box-sp1": { attr: "href", value: VERIFIED.zaloBoxSp1Url },
    "group-sp123": { attr: "href", value: VERIFIED.fbGroupSp123Url },
    "bank-stk": { text: VERIFIED.accountNumber },
    "bank-owner": { text: VERIFIED.accountOwner },
    "qr-img": { attr: "src", value: VERIFIED.qrImageUrl }
  };

  const verifyAndHealDom = () => {
    let tampered = false;
    suppressObserver = true;
    try {
      document.querySelectorAll("[data-verified-role]").forEach((el) => {
        const role = el.getAttribute("data-verified-role");
        const spec = expectedByRole[role];
        if (!spec) return;

        if (spec.attr) {
          const cur = el.getAttribute(spec.attr);
          if (cur !== spec.value) {
            tampered = true;
            el.setAttribute(spec.attr, spec.value);
          }
        }
        if (spec.text !== undefined) {
          if ((el.textContent || "").trim() !== spec.text) {
            tampered = true;
            el.textContent = spec.text;
          }
        }
      });

      document.querySelectorAll(".verified-bank-copy").forEach((btn) => {
        const target = btn.getAttribute("data-copy-target");
        const expected = target === "owner" ? VERIFIED.accountOwner : VERIFIED.accountNumber;
        if (btn.getAttribute("data-copy") !== expected) {
          tampered = true;
          btn.setAttribute("data-copy", expected);
        }
      });
    } finally {
      suppressObserver = false;
    }

    if (tampered && tamperBanner) {
      tamperBanner.hidden = false;
    }
    return !tampered;
  };

  const domObserver = new MutationObserver(() => {
    if (!suppressObserver) {
      verifyAndHealDom();
    }
  });

  domObserver.observe(document.body, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ["href", "src", "data-copy", "data-verified-role"]
  });

  verifyAndHealDom();

  const syncWithBackendShopData = async () => {
    try {
      const resp = await fetch("/api/shop-data", { credentials: "same-origin" });
      if (!resp.ok) return;
      const data = await resp.json();
      if (!data || !data.ok) return;

      if (typeof data.fullAdPost === "string" && data.fullAdPost.length > 50) {
        fullAdPostText = data.fullAdPost;
      }

      const expectedSha = document.body.getAttribute("data-config-sha256");
      const mismatch =
        (expectedSha && data.configSha256 !== expectedSha) ||
        !data.bank ||
        data.bank.accountNumber !== VERIFIED.accountNumber ||
        !data.contacts ||
        data.contacts.facebookUrl !== VERIFIED.facebookUrl ||
        data.contacts.zaloUrl !== VERIFIED.zaloUrl;

      if (mismatch && tamperBanner) {
        tamperBanner.hidden = false;
      }
      verifyAndHealDom();
    } catch {
      // Offline / transient error ignored cleanly
    }
  };
  syncWithBackendShopData();

  /* =========================================================
     4. Two-State Color Scheme Toggle (Namek Jade Locked)
     ========================================================= */
  const themeBtn = document.getElementById("theme-toggle");
  const themeLabel = document.getElementById("theme-toggle-label");
  const metaColorScheme = document.querySelector('meta[name="color-scheme"]');
  const darkMediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

  const syncThemeUI = () => {
    const saved = readStorage("color-scheme");
    const systemIsDark = darkMediaQuery.matches;
    const isPinned = saved === "light" || saved === "dark";
    const activeTheme = isPinned ? saved : systemIsDark ? "dark" : "light";

    document.documentElement.classList.remove("theme-light", "theme-dark");
    if (isPinned) {
      document.documentElement.classList.add(saved === "dark" ? "theme-dark" : "theme-light");
      if (metaColorScheme) metaColorScheme.content = saved;
    } else {
      if (metaColorScheme) metaColorScheme.content = "light dark";
    }

    if (themeBtn && themeLabel) {
      themeBtn.setAttribute("aria-pressed", String(isPinned));
      themeLabel.textContent = isPinned
        ? "Dùng theo máy"
        : activeTheme === "dark"
          ? "Chế độ Sáng"
          : "Chế độ Tối";
    }
  };

  if (themeBtn) {
    themeBtn.addEventListener("click", () => {
      const saved = readStorage("color-scheme");
      if (saved === "light" || saved === "dark") {
        removeStorage("color-scheme");
      } else {
        const opposite = darkMediaQuery.matches ? "light" : "dark";
        writeStorage("color-scheme", opposite);
      }
      syncThemeUI();
    });
  }

  darkMediaQuery.addEventListener("change", syncThemeUI);
  syncThemeUI();

  /* =========================================================
     5. Sticky Header Scroll-State Fallback
     ========================================================= */
  const stickyHeader = document.querySelector(".sticky-header-container");
  const headerSentinel = document.getElementById("header-sentinel");
  if (stickyHeader && headerSentinel && !(window.CSS && CSS.supports("container-type", "scroll-state"))) {
    const observer = new IntersectionObserver(
      ([entry]) => {
        stickyHeader.classList.toggle("is-stuck", !entry.isIntersecting);
      },
      { threshold: [0] }
    );
    observer.observe(headerSentinel);
  }

  /* =========================================================
     6. Catalog Search & Category Filter (/mua-item)
     ========================================================= */
  const searchForm = document.getElementById("catalog-search-form");
  const searchInput = document.getElementById("catalog-search");
  const clearSearchBtn = document.getElementById("clear-search-btn");
  const filterBtns = Array.from(document.querySelectorAll(".filter-btn"));
  const productCards = Array.from(document.querySelectorAll("#catalog-grid .product-card"));
  const catalogStatus = document.getElementById("catalog-status");
  let activeCategory = "all";

  const applyCatalogFilter = () => {
    const query = normalizeText(searchInput ? searchInput.value.trim() : "");
    if (clearSearchBtn) {
      clearSearchBtn.hidden = query.length === 0;
    }

    let visibleCount = 0;
    productCards.forEach((card) => {
      const cat = card.dataset.category || "";
      const haystack = normalizeText(`${card.textContent} ${card.dataset.keywords || ""}`);
      const matchCategory = activeCategory === "all" || cat === activeCategory;
      const matchQuery = !query || haystack.includes(query);
      const isVisible = matchCategory && matchQuery;
      card.hidden = !isVisible;
      if (isVisible) visibleCount += 1;
    });

    if (catalogStatus) {
      if (visibleCount === 0) {
        catalogStatus.textContent =
          "Không tìm thấy mục nào khớp từ khóa. Thử tìm: cuồng nộ, bổ huyết, giáp xên, cskb, dùi đục, đá nc, đội trưởng vàng, spl 441 442 446 447, 3s...";
      } else if (activeCategory === "all" && !query) {
        catalogStatus.textContent = `Đang hiển thị tất cả ${visibleCount} nhóm sản phẩm.`;
      } else {
        catalogStatus.textContent = `Tìm thấy ${visibleCount} nhóm item phù hợp.`;
      }
    }
  };

  if (searchForm) {
    searchForm.addEventListener("submit", (e) => e.preventDefault());
  }
  if (searchInput) {
    searchInput.addEventListener("input", applyCatalogFilter);
  }
  if (clearSearchBtn && searchInput) {
    clearSearchBtn.addEventListener("click", () => {
      searchInput.value = "";
      applyCatalogFilter();
      searchInput.focus();
    });
  }
  filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      activeCategory = btn.dataset.category || "all";
      filterBtns.forEach((item) => {
        const selected = item === btn;
        item.classList.toggle("is-active", selected);
        item.setAttribute("aria-pressed", String(selected));
      });
      applyCatalogFilter();
    });
  });

  /* =========================================================
     7. Bidirectional Calculator (/mua-item)
     ========================================================= */
  const calcForm = document.getElementById("rate-calc-form");
  const calcSplFieldset = document.getElementById("calc-spl-fieldset");
  const calcAmountInput = document.getElementById("calc-amount");
  const calcInputLabel = document.getElementById("calc-input-label");
  const calcInputHint = document.getElementById("calc-input-hint");
  const calcOutputLabel = document.getElementById("calc-output-label");
  const calcResultMain = document.getElementById("calc-result-main");
  const calcResultSub = document.getElementById("calc-result-sub");
  const addCalcBtn = document.getElementById("add-calc-to-order");

  const SPL_VARIANT_MAP = {
    441: { key: "spl-441", name: "Sao pha lê đỏ (ID 441)", effect: "Hút 5% HP" },
    442: { key: "spl-442", name: "Sao pha lê lam (ID 442)", effect: "Hút 5% KI" },
    446: { key: "spl-446", name: "Sao pha lê vàng (ID 446)", effect: "+5% vàng rơi" },
    447: { key: "spl-447", name: "Sao pha lê lục (ID 447)", effect: "+5% TNSM" }
  };

  const getSelectedSplVariant = () => {
    if (!calcForm) return SPL_VARIANT_MAP[441];
    const checked = calcForm.querySelector('input[name="splVariant"]:checked');
    const code = checked ? checked.value : "441";
    return SPL_VARIANT_MAP[code] || SPL_VARIANT_MAP[441];
  };

  const CALC_CONFIG = {
    "gold-fresh": {
      label: "Vàng tươi",
      rateText: "Vàng tươi x15",
      qtyLabel: "Số triệu vàng tươi muốn mua",
      qtyHint: "Nhập số triệu vàng tươi cần mua (ví dụ 1500 = 1,5 tỷ vàng = 100.000 đ).",
      unitsPerK: 15,
      computeFromMoneyK: (k) => {
        const millions = k * 15;
        const billions = millions >= 1000 ? ` (~${(millions / 1000).toLocaleString("vi-VN")} tỷ)` : "";
        return `${formatNumber(millions)} triệu vàng${billions}`;
      },
      computeFromQty: (qty) => {
        const costVND = Math.max(1, Math.round((qty / 15) * 1000));
        const billions = qty >= 1000 ? ` (~${(qty / 1000).toLocaleString("vi-VN")} tỷ)` : "";
        return {
          costVND,
          qtyText: `${formatNumber(qty)} triệu vàng${billions}`,
          subText: `Mua ${formatNumber(qty)} triệu vàng theo tỉ lệ Vàng tươi x15`
        };
      }
    },
    "gold-die": {
      label: "Vàng die",
      rateText: "Vàng die x60",
      qtyLabel: "Số triệu vàng die muốn mua",
      qtyHint: "Nhập số triệu vàng die cần mua (ví dụ 6000 = 6 tỷ vàng = 100.000 đ).",
      unitsPerK: 60,
      computeFromMoneyK: (k) => {
        const millions = k * 60;
        const billions = millions >= 1000 ? ` (~${(millions / 1000).toLocaleString("vi-VN")} tỷ)` : "";
        return `${formatNumber(millions)} triệu vàng${billions}`;
      },
      computeFromQty: (qty) => {
        const costVND = Math.max(1, Math.round((qty / 60) * 1000));
        const billions = qty >= 1000 ? ` (~${(qty / 1000).toLocaleString("vi-VN")} tỷ)` : "";
        return {
          costVND,
          qtyText: `${formatNumber(qty)} triệu vàng${billions}`,
          subText: `Mua ${formatNumber(qty)} triệu vàng theo tỉ lệ Vàng die x60`
        };
      }
    },
    "gem-ki": {
      label: "Ngọc kí",
      rateText: "Ngọc kí x11",
      qtyLabel: "Số ngọc kí muốn mua",
      qtyHint: "Nhập số lượng ngọc kí cần mua (ví dụ 1100 ngọc = 100.000 đ theo tỉ lệ x11).",
      unitsPerK: 11,
      computeFromMoneyK: (k) => `${formatNumber(k * 11)} ngọc kí`,
      computeFromQty: (qty) => {
        const costVND = Math.max(1, Math.round((qty / 11) * 1000));
        return {
          costVND,
          qtyText: `${formatNumber(qty)} ngọc kí`,
          subText: `Mua ${formatNumber(qty)} ngọc theo tỉ lệ Ngọc kí x11`
        };
      }
    },
    "gem-ve": {
      label: "Ngọc vé",
      rateText: "Ngọc vé x10 (ID 718)",
      qtyLabel: "Số ngọc vé muốn mua (mỗi vé ID 718 = 10 ngọc)",
      qtyHint: "Nhập số lượng ngọc vé cần mua (ví dụ 1000 ngọc = 100 vé ID 718 = 100.000 đ).",
      unitsPerK: 10,
      computeFromMoneyK: (k) => `${formatNumber(k * 10)} ngọc (${formatNumber(k)} vé ID 718)`,
      computeFromQty: (qty) => {
        const costVND = Math.max(1, Math.round((qty / 10) * 1000));
        const tickets = qty / 10;
        const ticketNote = Number.isInteger(tickets)
          ? `${formatNumber(tickets)} vé ID 718`
          : `~${tickets.toLocaleString("vi-VN", { maximumFractionDigits: 1 })} vé ID 718`;
        return {
          costVND,
          qtyText: `${formatNumber(qty)} ngọc vé (${ticketNote})`,
          subText: `Mua ${formatNumber(qty)} ngọc theo tỉ lệ Ngọc vé x10 (${ticketNote})`
        };
      }
    },
    spl: {
      label: "Sao pha lê (SPL)",
      rateText: "SPL các loại 1.000 đ / 1 viên",
      qtyLabel: "Số viên Sao pha lê (SPL) muốn mua",
      qtyHint: "Nhập số viên SPL cần mua (đơn giá 1.000 đ / 1 viên).",
      unitsPerK: 1,
      computeFromMoneyK: (k) => `${formatNumber(k)} viên SPL`,
      computeFromQty: (qty) => ({
        costVND: qty * 1000,
        qtyText: `${formatNumber(qty)} viên SPL`,
        subText: `Mua ${formatNumber(qty)} viên theo đơn giá 1.000 đ / 1 viên`
      })
    },
    nr3s: {
      label: "Ngọc Rồng 3 sao (NR 3s)",
      rateText: "NR 3s 2.500 đ / 1 viên",
      qtyLabel: "Số viên Ngọc Rồng 3 sao (NR 3s) muốn mua",
      qtyHint: "Nhập số viên NR 3 sao cần mua (đơn giá 2.500 đ / 1 viên).",
      unitsPerK: 0.4,
      computeFromMoneyK: (k) => {
        const count = Math.floor(k / 2.5);
        const remainder = k - count * 2.5;
        return remainder > 0
          ? `${formatNumber(count)} viên NR 3s (dư ${formatVND(remainder * 1000)})`
          : `${formatNumber(count)} viên NR 3s`;
      },
      computeFromQty: (qty) => ({
        costVND: qty * 2500,
        qtyText: `${formatNumber(qty)} viên NR 3s`,
        subText: `Mua ${formatNumber(qty)} viên theo đơn giá 2.500 đ / 1 viên`
      })
    }
  };

  let previousCalcMode = "by-money";
  let currentCalcSnapshot = {
    id: "calc-gold-fresh-100k",
    name: "Vàng tươi: 1.500 triệu vàng",
    price: 100000,
    unit: "gói"
  };

  const getSelectedCalcMode = () => {
    if (!calcForm) return "by-money";
    const checked = calcForm.querySelector('input[name="calcMode"]:checked');
    return checked ? checked.value : "by-money";
  };

  const getSelectedCalcType = () => {
    if (!calcForm) return "gold-fresh";
    const checked = calcForm.querySelector('input[name="calcType"]:checked');
    return checked ? checked.value : "gold-fresh";
  };

  const syncCalcLabelsAndConversion = () => {
    if (!calcAmountInput || !calcInputLabel || !calcInputHint || !calcOutputLabel) return;
    const mode = getSelectedCalcMode();
    const typeKey = getSelectedCalcType();
    const config = CALC_CONFIG[typeKey] || CALC_CONFIG["gold-fresh"];
    const splVariant = typeKey === "spl" ? getSelectedSplVariant() : null;

    if (calcSplFieldset) {
      calcSplFieldset.hidden = typeKey !== "spl";
    }

    if (mode !== previousCalcMode) {
      const currentVal = Number(calcAmountInput.value);
      if (Number.isFinite(currentVal) && currentVal >= 1) {
        calcAmountInput.value = String(
          mode === "by-qty"
            ? Math.max(1, Math.round(currentVal * config.unitsPerK))
            : Math.max(1, Math.round(currentVal / config.unitsPerK))
        );
      } else {
        calcAmountInput.value = mode === "by-qty" ? String(Math.max(1, Math.round(100 * config.unitsPerK))) : "100";
      }
      previousCalcMode = mode;
    }

    if (mode === "by-money") {
      calcInputLabel.textContent = "Số tiền dự kiến mua (nghìn VNĐ, ví dụ 100 = 100.000 đ)";
      calcInputHint.textContent = "Nhập số tiền theo đơn vị nghìn đồng (ví dụ 50 = 50.000 đ, 100 = 100.000 đ).";
      calcOutputLabel.textContent = "Ước tính nhận được:";
    } else if (splVariant) {
      calcInputLabel.textContent = `Số viên ${splVariant.name} muốn mua`;
      calcInputHint.textContent = `Nhập số viên cần mua — ${splVariant.effect} (đơn giá 1.000 đ / 1 viên).`;
      calcOutputLabel.textContent = "Số tiền cần thanh toán:";
    } else {
      calcInputLabel.textContent = config.qtyLabel;
      calcInputHint.textContent = config.qtyHint;
      calcOutputLabel.textContent = "Số tiền cần thanh toán:";
    }
  };

  const updateCalculator = () => {
    if (!calcForm || !calcAmountInput || !calcResultMain || !calcResultSub) return;

    syncCalcLabelsAndConversion();

    const mode = getSelectedCalcMode();
    const typeKey = getSelectedCalcType();
    const config = CALC_CONFIG[typeKey] || CALC_CONFIG["gold-fresh"];
    const splVariant = typeKey === "spl" ? getSelectedSplVariant() : null;
    const activeRateText = splVariant
      ? `${splVariant.name} · ${splVariant.effect} (1.000 đ / 1 viên)`
      : config.rateText;
    const rawVal = Number(calcAmountInput.value);

    if (!Number.isFinite(rawVal) || rawVal < 1) {
      currentCalcSnapshot = null;
      calcResultMain.textContent = mode === "by-money" ? "Nhập số tiền từ 1 trở lên" : "Nhập số lượng từ 1 trở lên";
      calcResultSub.textContent = `Đang chọn: ${activeRateText}`;
      return;
    }

    const clamped = Math.min(1000000, Math.floor(rawVal));

    if (mode === "by-money") {
      const resultText = splVariant
        ? `${formatNumber(clamped)} viên ${splVariant.name}`
        : config.computeFromMoneyK(clamped);
      calcResultMain.textContent = resultText;
      calcResultSub.textContent = splVariant
        ? `Tương ứng ${formatVND(clamped * 1000)} (${splVariant.effect} · 1.000 đ / 1 viên)`
        : `Tương ứng ${formatVND(clamped * 1000)} theo tỉ lệ ${config.rateText}`;
      currentCalcSnapshot = {
        id: `calc-${splVariant ? splVariant.key : typeKey}-${clamped}k`,
        name: splVariant ? `${splVariant.name}: ${formatNumber(clamped)} viên` : `${config.label}: ${resultText}`,
        price: clamped * 1000,
        unit: "gói"
      };
    } else {
      const calcQty = splVariant
        ? {
            costVND: clamped * 1000,
            qtyText: `${formatNumber(clamped)} viên`,
            subText: `Mua ${formatNumber(clamped)} viên ${splVariant.name} (${splVariant.effect} · 1.000 đ / 1 viên)`
          }
        : config.computeFromQty(clamped);
      calcResultMain.textContent = formatVND(calcQty.costVND);
      calcResultSub.textContent = calcQty.subText;
      currentCalcSnapshot = {
        id: `calc-${splVariant ? splVariant.key : typeKey}-q${clamped}`,
        name: splVariant ? `${splVariant.name}: ${calcQty.qtyText}` : `${config.label}: ${calcQty.qtyText}`,
        price: calcQty.costVND,
        unit: "gói"
      };
    }
  };

  if (calcForm) {
    calcForm.addEventListener("input", updateCalculator);
    calcForm.addEventListener("change", updateCalculator);
    calcForm.addEventListener("submit", (e) => e.preventDefault());
    updateCalculator();
  }

  /* =========================================================
     8. Shared Cross-Path Quick Order Builder
     ========================================================= */
  const STORAGE_KEY = "thanhdung_nro_order_v2";
  const openOrderBtn = document.getElementById("open-order-btn");
  const openOrderFromItemsBtn = document.getElementById("open-order-from-items-btn");
  const mobileOpenOrderBtn = document.getElementById("mobile-open-order");
  const orderCountEl = document.getElementById("order-count");
  const mobileOrderCountEl = document.getElementById("mobile-order-count");
  const orderEmptyMsg = document.getElementById("order-empty-msg");
  const orderListEl = document.getElementById("order-items-list");
  const orderNoteEl = document.getElementById("order-note");
  const orderTotalPriceEl = document.getElementById("order-total-price");
  const orderSendStatusEl = document.getElementById("order-send-status");
  const sendFbOrderBtn = document.getElementById("send-fb-order-btn");
  const sendZaloOrderBtn = document.getElementById("send-zalo-order-btn");
  const copyOrderBtn = document.getElementById("copy-order-btn");
  const clearOrderBtn = document.getElementById("clear-order-btn");

  const loadOrder = () => {
    try {
      const raw = readStorage(STORAGE_KEY) || readStorage("thanhdung_nro_order_v1");
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  let orderItems = loadOrder();

  const saveOrder = () => {
    writeStorage(STORAGE_KEY, JSON.stringify(orderItems));
  };

  const clearSendStatus = () => {
    if (orderSendStatusEl) {
      orderSendStatusEl.hidden = true;
      orderSendStatusEl.textContent = "";
    }
  };

  const renderOrder = () => {
    const totalCount = orderItems.reduce((sum, item) => sum + item.qty, 0);
    const totalVND = orderItems.reduce((sum, item) => sum + item.price * item.qty, 0);

    if (orderCountEl) orderCountEl.textContent = String(totalCount);
    if (mobileOrderCountEl) mobileOrderCountEl.textContent = String(totalCount);

    if (!orderListEl || !orderEmptyMsg || !orderTotalPriceEl) return;

    orderListEl.textContent = "";
    orderEmptyMsg.hidden = orderItems.length > 0;

    let hasQuoteItems = false;

    orderItems.forEach((item) => {
      if (item.price <= 0) hasQuoteItems = true;

      const li = document.createElement("li");
      li.className = "order-row";

      const info = document.createElement("div");
      info.className = "order-row-info";

      const title = document.createElement("strong");
      title.textContent = item.name;

      const sub = document.createElement("span");
      sub.textContent =
        item.price > 0
          ? `${formatVND(item.price)} / ${item.unit} · Thành tiền: ${formatVND(item.price * item.qty)}`
          : `Báo giá trực tiếp (${item.unit})`;

      info.append(title, sub);

      const ctrl = document.createElement("div");
      ctrl.className = "order-row-ctrl";

      const decBtn = document.createElement("button");
      decBtn.type = "button";
      decBtn.className = "qty-btn";
      decBtn.textContent = "−";
      decBtn.setAttribute("aria-label", `Giảm số lượng ${item.name}`);
      decBtn.addEventListener("click", () => {
        if (item.qty > 1) {
          item.qty -= 1;
        } else {
          orderItems = orderItems.filter((x) => x.id !== item.id);
        }
        clearSendStatus();
        saveOrder();
        renderOrder();
      });

      const qtyVal = document.createElement("span");
      qtyVal.className = "qty-val";
      qtyVal.textContent = String(item.qty);

      const incBtn = document.createElement("button");
      incBtn.type = "button";
      incBtn.className = "qty-btn";
      incBtn.textContent = "+";
      incBtn.setAttribute("aria-label", `Tăng số lượng ${item.name}`);
      incBtn.addEventListener("click", () => {
        item.qty += 1;
        clearSendStatus();
        saveOrder();
        renderOrder();
      });

      ctrl.append(decBtn, qtyVal, incBtn);
      li.append(info, ctrl);
      orderListEl.appendChild(li);
    });

    if (orderItems.length === 0) {
      orderTotalPriceEl.textContent = "0 đ";
    } else if (totalVND === 0 && hasQuoteItems) {
      orderTotalPriceEl.textContent = "Chờ báo giá";
    } else if (hasQuoteItems) {
      orderTotalPriceEl.textContent = `${formatVND(totalVND)} + mục báo giá`;
    } else {
      orderTotalPriceEl.textContent = formatVND(totalVND);
    }
  };

  const addItemToOrder = (newItem, qtyToAdd = 1) => {
    const qty = Math.max(1, Math.min(9999, Math.floor(Number(qtyToAdd) || 1)));
    const existing = orderItems.find((item) => item.id === newItem.id);
    if (existing) {
      existing.qty += qty;
    } else {
      orderItems.push({ ...newItem, qty });
    }
    clearSendStatus();
    saveOrder();
    renderOrder();
    showToast(`Đã thêm ${qty} x "${newItem.name}" vào đơn tính nhanh.`);
  };

  // Event delegation for dynamic + static order quick-add buttons
  document.addEventListener("click", (event) => {
    const addBtn = event.target.closest("button[data-id][data-name]");
    if (addBtn) {
      addItemToOrder(
        {
          id: addBtn.dataset.id,
          name: addBtn.dataset.name,
          price: Number(addBtn.dataset.price || 0),
          unit: addBtn.dataset.unit || "mục"
        },
        1
      );
      return;
    }

    const copyBtn = event.target.closest(".copy-btn");
    if (copyBtn) {
      const targetKey = copyBtn.getAttribute("data-copy-target");
      let value = copyBtn.getAttribute("data-copy") || "";
      if (targetKey === "stk") value = VERIFIED.accountNumber;
      else if (targetKey === "owner") value = VERIFIED.accountOwner;
      else if (targetKey === "zaloRawPhone") value = VERIFIED.zaloRawPhone;
      else if (targetKey === "facebookUrl") value = VERIFIED.facebookUrl;
      else if (targetKey === "zaloBoxSp1Url") value = VERIFIED.zaloBoxSp1Url;
      else if (targetKey === "fbGroupSp123Url") value = VERIFIED.fbGroupSp123Url;

      const label = copyBtn.getAttribute("data-label") || "nội dung";
      if (value) copyToClipboard(value, label);
    }
  });

  // Quantity steppers (Item rows, Set Hire rows, Starter Acc rows)
  document.querySelectorAll(".item-qty-row").forEach((row) => {
    const decBtn = row.querySelector(".row-dec");
    const incBtn = row.querySelector(".row-inc");
    const qtyInput = row.querySelector(".item-qty-input");
    const subtotalEl = row.querySelector(".row-subtotal");
    const addRowBtn = row.querySelector(".row-add-btn");

    const unitPrice = Number(row.dataset.itemPrice || 0);
    const maxQty = Number(qtyInput ? qtyInput.max : 9999) || 9999;

    const syncRowSubtotal = () => {
      if (!qtyInput || !subtotalEl) return 1;
      let val = Math.floor(Number(qtyInput.value));
      if (!Number.isFinite(val) || val < 1) val = 1;
      if (val > maxQty) val = maxQty;
      subtotalEl.textContent = formatVND(unitPrice * val);
      return val;
    };

    if (decBtn && qtyInput) {
      decBtn.addEventListener("click", () => {
        const cur = Math.floor(Number(qtyInput.value)) || 1;
        qtyInput.value = String(Math.max(1, cur - 1));
        syncRowSubtotal();
      });
    }

    if (incBtn && qtyInput) {
      incBtn.addEventListener("click", () => {
        const cur = Math.floor(Number(qtyInput.value)) || 1;
        qtyInput.value = String(Math.min(maxQty, cur + 1));
        syncRowSubtotal();
      });
    }

    if (qtyInput) {
      qtyInput.addEventListener("input", syncRowSubtotal);
      qtyInput.addEventListener("change", () => {
        qtyInput.value = String(syncRowSubtotal());
      });
      syncRowSubtotal();
    }

    if (addRowBtn) {
      addRowBtn.addEventListener("click", () => {
        const chosenQty = syncRowSubtotal();
        if (qtyInput) qtyInput.value = String(chosenQty);
        addItemToOrder(
          {
            id: row.dataset.itemId || "item",
            name: row.dataset.itemName || "Vật phẩm",
            price: unitPrice,
            unit: row.dataset.itemUnit || "mục"
          },
          chosenQty
        );
      });
    }
  });

  if (addCalcBtn) {
    addCalcBtn.addEventListener("click", () => {
      updateCalculator();
      if (!currentCalcSnapshot) {
        showToast("Vui lòng nhập số lượng hoặc số tiền hợp lệ trước khi thêm.");
        return;
      }
      addItemToOrder(currentCalcSnapshot, 1);
    });
  }

  const openOrderModal = () => {
    if (!orderDialog) return;
    renderOrder();
    if (!orderDialog.open) {
      orderDialog.showModal();
    }
  };

  if (openOrderBtn) openOrderBtn.addEventListener("click", openOrderModal);
  if (openOrderFromItemsBtn) openOrderFromItemsBtn.addEventListener("click", openOrderModal);
  if (mobileOpenOrderBtn) mobileOpenOrderBtn.addEventListener("click", openOrderModal);

  const wireDialogBackdropFallback = (dlg) => {
    if (!dlg || "closedBy" in HTMLDialogElement.prototype) return;
    dlg.addEventListener("click", (event) => {
      if (event.target !== dlg) return;
      const rect = dlg.getBoundingClientRect();
      const inside =
        rect.top <= event.clientY &&
        event.clientY <= rect.top + rect.height &&
        rect.left <= event.clientX &&
        event.clientX <= rect.left + rect.width;
      if (!inside) dlg.close();
    });
  };

  wireDialogBackdropFallback(orderDialog);

  const buildOrderText = () => {
    const lines = ["Chào shop Thanh Dung NRO, mình cần đặt:"];
    let totalVND = 0;
    let hasQuote = false;

    orderItems.forEach((item, index) => {
      if (item.price <= 0) hasQuote = true;
      const linePrice = item.price > 0 ? formatVND(item.price * item.qty) : "Báo giá trực tiếp";
      totalVND += item.price * item.qty;
      lines.push(`${index + 1}. ${item.name} x${item.qty} (${item.unit}) — ${linePrice}`);
    });

    const note = orderNoteEl ? orderNoteEl.value.trim() : "";
    if (note) {
      lines.push(`Ghi chú: ${note}`);
    }
    if (totalVND > 0) {
      lines.push(`Tổng tạm tính: ${hasQuote ? `${formatVND(totalVND)} + mục báo giá` : formatVND(totalVND)}`);
    }

    return lines.join("\n");
  };

  const handleSendOrder = (platform) => {
    if (orderItems.length === 0) {
      showToast("Đơn đang trống — hãy chọn sản phẩm trước khi gửi!");
      return;
    }

    verifyAndHealDom();
    const orderText = buildOrderText();
    const copied = copyTextSync(orderText);
    const isFb = platform === "facebook";
    const targetUrl = isFb ? VERIFIED.facebookUrl : VERIFIED.zaloUrl;
    const channelName = isFb ? "Facebook Thanh Dung" : "Zalo Thanh Dung";

    window.open(targetUrl, "_blank", "noopener,noreferrer");

    const noticeMsg = copied
      ? `Đã sao chép toàn bộ đơn hàng và mở ${channelName}! Vào khung chat chỉ cần Dán (Ctrl+V / giữ chọn Dán) rồi bấm Gửi.`
      : `Đã mở ${channelName}. Hãy sao chép danh sách đơn ở trên và Dán vào khung chat để gửi.`;

    if (orderSendStatusEl) {
      orderSendStatusEl.textContent = noticeMsg;
      orderSendStatusEl.hidden = false;
    }
    showToast(noticeMsg);
  };

  if (sendFbOrderBtn) sendFbOrderBtn.addEventListener("click", () => handleSendOrder("facebook"));
  if (sendZaloOrderBtn) sendZaloOrderBtn.addEventListener("click", () => handleSendOrder("zalo"));

  if (copyOrderBtn) {
    copyOrderBtn.addEventListener("click", () => {
      if (orderItems.length === 0) {
        showToast("Đơn đang trống — hãy chọn sản phẩm trước khi sao chép!");
        return;
      }
      copyToClipboard(buildOrderText(), "nội dung đơn hàng");
    });
  }

  if (clearOrderBtn) {
    clearOrderBtn.addEventListener("click", () => {
      orderItems = [];
      clearSendStatus();
      saveOrder();
      renderOrder();
      showToast("Đã xóa toàn bộ đơn tính nhanh.");
    });
  }

  const jumpToQrLink = document.getElementById("jump-to-qr-link");
  if (jumpToQrLink && orderDialog) {
    jumpToQrLink.addEventListener("click", () => {
      if (orderDialog.open) orderDialog.close();
    });
  }

  const copyFullPostBtn = document.getElementById("copy-full-post-btn");
  if (copyFullPostBtn) {
    copyFullPostBtn.addEventListener("click", () => {
      copyToClipboard(fullAdPostText, "toàn bộ bảng giá Thanh Dung NRO");
    });
  }

  /* =========================================================
     9. Account Gallery, Lightbox, Image Preview Upload & Admin
     ========================================================= */
  const accGalleryGrid = document.getElementById("acc-gallery-grid");
  const accGalleryStatus = document.getElementById("acc-gallery-status");
  const accFilterForm = document.getElementById("acc-filter-form");
  const accSearchInput = document.getElementById("acc-search-input");
  const accFilterServer = document.getElementById("acc-filter-server");
  const accFilterPlanet = document.getElementById("acc-filter-planet");
  const accFilterStatus = document.getElementById("acc-filter-status");
  const toggleAdminAccPanelBtn = document.getElementById("toggle-admin-acc-panel");
  const adminInlineSection = document.getElementById("quan-ly-acc");

  const accLightboxDialog = document.getElementById("acc-lightbox-dialog");
  const accLightboxTitle = document.getElementById("acc-lightbox-title");
  const accLightboxSub = document.getElementById("acc-lightbox-sub");
  const accLightboxImg = document.getElementById("acc-lightbox-img");
  const accLightboxNote = document.getElementById("acc-lightbox-note");
  const accLightboxAddBtn = document.getElementById("acc-lightbox-add-btn");
  const accLightboxZaloLink = document.getElementById("acc-lightbox-zalo-link");

  wireDialogBackdropFallback(accLightboxDialog);

  let currentAccountsCache = [];
  let currentLightboxAcc = null;

  const isAdminUiActive = () => {
    if (accGalleryGrid && accGalleryGrid.dataset.isAdmin === "1") return true;
    const uploadBox = document.getElementById("admin-upload-box");
    return Boolean(uploadBox && !uploadBox.hidden && csrfToken);
  };

  const createAccountCardElement = (acc, isAdmin) => {
    const isSold = acc.status === "sold";
    const article = document.createElement("article");
    article.className = isSold ? "account-card is-sold" : "account-card";
    article.dataset.accId = String(acc.id);

    const photoBtn = document.createElement("button");
    photoBtn.type = "button";
    photoBtn.className = "acc-photo-trigger";
    photoBtn.dataset.accLightboxId = String(acc.id);
    photoBtn.setAttribute("aria-label", `Phóng to ảnh ${acc.title || acc.code}`);

    const img = document.createElement("img");
    img.src = safeImagePath(acc.image_path);
    img.alt = `Ảnh tài khoản ${acc.code} - ${acc.server_name} - ${acc.planet}`;
    img.width = Number(acc.image_width) || 800;
    img.height = Number(acc.image_height) || 500;
    img.loading = "lazy";
    img.className = "acc-photo-img";

    const badge = document.createElement("span");
    badge.className = "acc-photo-badge";
    badge.textContent = isSold ? "ĐÃ BÁN" : "SẴN HÀNG";

    const zoomHint = document.createElement("span");
    zoomHint.className = "acc-zoom-hint";
    zoomHint.textContent = "Bấm xem ảnh lớn";

    photoBtn.append(img, badge, zoomHint);

    const body = document.createElement("div");
    body.className = "acc-card-body";

    const metaTop = document.createElement("div");
    metaTop.className = "acc-meta-top";

    const codeSpan = document.createElement("span");
    codeSpan.className = "cat-badge mono-num";
    codeSpan.textContent = `#${acc.code}`;

    const pills = document.createElement("div");
    pills.className = "acc-pills";

    const svPill = document.createElement("span");
    svPill.className = "tag-pill tag-jade";
    svPill.textContent = acc.server_name;

    const plPill = document.createElement("span");
    const plClass =
      acc.planet === "Namếc"
        ? "planet-namek"
        : acc.planet === "Xayda"
          ? "planet-xayda"
          : "planet-earth";
    plPill.className = `tag-pill ${plClass}`;
    plPill.textContent = acc.planet;

    pills.append(svPill, plPill);
    metaTop.append(codeSpan, pills);

    const h3 = document.createElement("h3");
    h3.className = "acc-title";
    h3.textContent = acc.title;

    const noteP = document.createElement("p");
    noteP.className = "acc-note-text";
    noteP.textContent = acc.note;

    const priceRow = document.createElement("div");
    priceRow.className = "card-price-row";

    const priceMain = document.createElement("span");
    priceMain.className = "price-main mono-num";
    priceMain.textContent = formatVND(acc.price_vnd);

    const priceSub = document.createElement("span");
    priceSub.className = "price-sub";
    priceSub.textContent = isSold ? "Đã giao dịch xong" : "Có thể gửi đơn ngay";

    priceRow.append(priceMain, priceSub);

    const actions = document.createElement("div");
    actions.className = "card-actions";

    const orderBtn = document.createElement("button");
    orderBtn.type = "button";
    orderBtn.className = "btn btn-card-add acc-order-btn";
    orderBtn.dataset.id = `acc-${acc.id}`;
    orderBtn.dataset.name = `Acc #${acc.code} (${acc.server_name} · ${acc.planet})`;
    orderBtn.dataset.price = String(acc.price_vnd);
    orderBtn.dataset.unit = "acc";
    orderBtn.textContent = isSold ? "Đã bán" : "+ Thêm vào đơn";
    if (isSold) orderBtn.disabled = true;

    const checkLink = document.createElement("a");
    checkLink.href = VERIFIED.zaloUrl;
    checkLink.target = "_blank";
    checkLink.rel = "noopener noreferrer";
    checkLink.setAttribute("data-verified-role", "zalo-link");
    checkLink.className = "btn btn-card-link";
    checkLink.textContent = "Check Acc";

    actions.append(orderBtn, checkLink);
    body.append(metaTop, h3, noteP, priceRow, actions);

    if (isAdmin) {
      const adminBar = document.createElement("div");
      adminBar.className = "acc-admin-controls";

      const toggleBtn = document.createElement("button");
      toggleBtn.type = "button";
      toggleBtn.className = "btn btn-outline btn-sm acc-toggle-status-btn";
      toggleBtn.dataset.accId = String(acc.id);
      toggleBtn.dataset.nextStatus = isSold ? "available" : "sold";
      toggleBtn.textContent = isSold ? "Mở bán lại" : "Đánh dấu Đã bán";

      const delBtn = document.createElement("button");
      delBtn.type = "button";
      delBtn.className = "btn btn-danger-outline btn-sm acc-delete-btn";
      delBtn.dataset.accId = String(acc.id);
      delBtn.dataset.accCode = acc.code;
      delBtn.textContent = "Xóa Acc";

      adminBar.append(toggleBtn, delBtn);
      body.appendChild(adminBar);
    }

    article.append(photoBtn, body);
    return article;
  };

  const renderAdminTable = (accounts) => {
    const tbody = document.getElementById("admin-acc-tbody");
    if (!tbody) return;
    tbody.textContent = "";

    if (accounts.length === 0) {
      const tr = document.createElement("tr");
      const td = document.createElement("td");
      td.colSpan = 6;
      td.textContent = "Chưa có tài khoản nào được đăng.";
      tr.appendChild(td);
      tbody.appendChild(tr);
      return;
    }

    accounts.forEach((acc) => {
      const isSold = acc.status === "sold";
      const tr = document.createElement("tr");
      tr.dataset.accRowId = String(acc.id);

      const tdCode = document.createElement("td");
      tdCode.className = "mono-num";
      const codeStrong = document.createElement("strong");
      codeStrong.textContent = `#${acc.code}`;
      tdCode.appendChild(codeStrong);

      const tdInfo = document.createElement("td");
      const infoWrap = document.createElement("div");
      infoWrap.className = "table-item-cell";
      const thumb = document.createElement("img");
      thumb.src = safeImagePath(acc.image_path);
      thumb.alt = "";
      thumb.width = Number(acc.image_width) || 64;
      thumb.height = Number(acc.image_height) || 40;
      thumb.className = "table-sprite";
      const titleSpan = document.createElement("span");
      titleSpan.textContent = acc.title;
      infoWrap.append(thumb, titleSpan);
      tdInfo.appendChild(infoWrap);

      const tdSvPl = document.createElement("td");
      tdSvPl.textContent = `${acc.server_name} · ${acc.planet}`;

      const tdPrice = document.createElement("td");
      tdPrice.className = "mono-num";
      const priceStrong = document.createElement("strong");
      priceStrong.textContent = formatVND(acc.price_vnd);
      tdPrice.appendChild(priceStrong);

      const tdStatus = document.createElement("td");
      const stPill = document.createElement("span");
      stPill.className = `tag-pill ${isSold ? "tag-crimson" : "tag-jade"}`;
      stPill.textContent = isSold ? "Đã bán" : "Đang bán";
      tdStatus.appendChild(stPill);

      const tdActions = document.createElement("td");
      const actGroup = document.createElement("div");
      actGroup.className = "table-action-group";

      const toggleBtn = document.createElement("button");
      toggleBtn.type = "button";
      toggleBtn.className = "btn btn-outline btn-sm acc-toggle-status-btn";
      toggleBtn.dataset.accId = String(acc.id);
      toggleBtn.dataset.nextStatus = isSold ? "available" : "sold";
      toggleBtn.textContent = isSold ? "Mở bán" : "Đã bán";

      const delBtn = document.createElement("button");
      delBtn.type = "button";
      delBtn.className = "btn btn-danger-outline btn-sm acc-delete-btn";
      delBtn.dataset.accId = String(acc.id);
      delBtn.dataset.accCode = acc.code;
      delBtn.textContent = "Xóa";

      actGroup.append(toggleBtn, delBtn);
      tdActions.appendChild(actGroup);

      tr.append(tdCode, tdInfo, tdSvPl, tdPrice, tdStatus, tdActions);
      tbody.appendChild(tr);
    });
  };

  const fetchAndRenderAccounts = async () => {
    const params = new URLSearchParams();
    if (accSearchInput && accSearchInput.value.trim()) {
      params.set("q", accSearchInput.value.trim());
    }
    if (accFilterServer && accFilterServer.value !== "all") {
      params.set("server", accFilterServer.value);
    }
    if (accFilterPlanet && accFilterPlanet.value !== "all") {
      params.set("planet", accFilterPlanet.value);
    }
    if (accFilterStatus && accFilterStatus.value !== "all") {
      params.set("status", accFilterStatus.value);
    }

    try {
      const resp = await fetch(`/api/accounts?${params.toString()}`, { credentials: "same-origin" });
      if (!resp.ok) return;
      const data = await resp.json();
      if (!data || !data.ok || !Array.isArray(data.accounts)) return;

      currentAccountsCache = data.accounts;
      const isAdmin = isAdminUiActive();

      if (accGalleryGrid) {
        accGalleryGrid.textContent = "";
        if (data.accounts.length === 0) {
          const empty = document.createElement("div");
          empty.className = "empty-state-box";
          const h3 = document.createElement("h3");
          h3.textContent = "Không có tài khoản nào khớp bộ lọc";
          const p = document.createElement("p");
          p.className = "pretty-text";
          p.textContent = "Thử chọn 'Tất cả Server / Hành tinh' hoặc đăng Acc mới ở khung Quản lý.";
          empty.append(h3, p);
          accGalleryGrid.appendChild(empty);
        } else {
          data.accounts.forEach((acc) => {
            accGalleryGrid.appendChild(createAccountCardElement(acc, isAdmin));
          });
        }
      }

      if (accGalleryStatus) {
        accGalleryStatus.textContent = `Đang hiển thị ${data.accounts.length} tài khoản phù hợp.`;
      }

      renderAdminTable(data.accounts);
      verifyAndHealDom();
    } catch {
      // Ignore transient network errors
    }
  };

  if (accGalleryGrid || document.getElementById("home-acc-teaser") || document.getElementById("admin-acc-tbody")) {
    fetch("/api/accounts", { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d && d.ok && Array.isArray(d.accounts)) {
          currentAccountsCache = d.accounts;
        }
      })
      .catch(() => {});
  }

  let accFilterTimer = null;
  if (accFilterForm) {
    const initialParams = new URLSearchParams(window.location.search);
    if (accSearchInput && initialParams.has("q")) {
      accSearchInput.value = initialParams.get("q") || "";
    }
    if (accFilterServer && initialParams.has("server")) {
      const svVal = initialParams.get("server") || "all";
      if ([...accFilterServer.options].some((o) => o.value === svVal)) {
        accFilterServer.value = svVal;
      }
    }
    if (accFilterPlanet && initialParams.has("planet")) {
      const plVal = initialParams.get("planet") || "all";
      if ([...accFilterPlanet.options].some((o) => o.value === plVal)) {
        accFilterPlanet.value = plVal;
      }
    }
    if (accFilterStatus && initialParams.has("status")) {
      const stVal = initialParams.get("status") || "all";
      if ([...accFilterStatus.options].some((o) => o.value === stVal)) {
        accFilterStatus.value = stVal;
      }
    }

    accFilterForm.addEventListener("submit", (e) => {
      e.preventDefault();
      fetchAndRenderAccounts();
    });
    const triggerFilter = () => {
      if (accFilterTimer) clearTimeout(accFilterTimer);
      accFilterTimer = setTimeout(fetchAndRenderAccounts, 160);
    };
    if (accSearchInput) accSearchInput.addEventListener("input", triggerFilter);
    if (accFilterServer) accFilterServer.addEventListener("change", fetchAndRenderAccounts);
    if (accFilterPlanet) accFilterPlanet.addEventListener("change", fetchAndRenderAccounts);
    if (accFilterStatus) accFilterStatus.addEventListener("change", fetchAndRenderAccounts);
  }

  if (toggleAdminAccPanelBtn && adminInlineSection) {
    toggleAdminAccPanelBtn.addEventListener("click", () => {
      adminInlineSection.hidden = !adminInlineSection.hidden;
      if (!adminInlineSection.hidden) {
        adminInlineSection.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  }

  // Lightbox opening via event delegation
  document.addEventListener("click", async (event) => {
    const trigger = event.target.closest("[data-acc-lightbox-id]");
    if (!trigger || !accLightboxDialog) return;

    const accId = Number(trigger.dataset.accLightboxId);
    let acc = currentAccountsCache.find((x) => x.id === accId);
    if (!acc) {
      await fetchAndRenderAccounts();
      acc = currentAccountsCache.find((x) => x.id === accId);
    }
    if (!acc) return;

    currentLightboxAcc = acc;
    if (accLightboxTitle) accLightboxTitle.textContent = `#${acc.code} · ${acc.title}`;
    if (accLightboxSub) {
      accLightboxSub.textContent = `${acc.server_name} · ${acc.planet} · Giá: ${formatVND(acc.price_vnd)}`;
    }
    if (accLightboxImg) {
      accLightboxImg.src = safeImagePath(acc.image_path);
      accLightboxImg.width = Number(acc.image_width) || 800;
      accLightboxImg.height = Number(acc.image_height) || 500;
      accLightboxImg.alt = `Ảnh tài khoản ${acc.code}`;
    }
    if (accLightboxNote) accLightboxNote.textContent = acc.note;
    if (accLightboxAddBtn) accLightboxAddBtn.disabled = acc.status === "sold";
    if (accLightboxZaloLink) accLightboxZaloLink.href = VERIFIED.zaloUrl;

    if (!accLightboxDialog.open) accLightboxDialog.showModal();
  });

  if (accLightboxAddBtn) {
    accLightboxAddBtn.addEventListener("click", () => {
      if (!currentLightboxAcc || currentLightboxAcc.status === "sold") return;
      addItemToOrder(
        {
          id: `acc-${currentLightboxAcc.id}`,
          name: `Acc #${currentLightboxAcc.code} (${currentLightboxAcc.server_name} · ${currentLightboxAcc.planet})`,
          price: currentLightboxAcc.price_vnd,
          unit: "acc"
        },
        1
      );
      if (accLightboxDialog && accLightboxDialog.open) accLightboxDialog.close();
    });
  }

  /* Admin Auth & Account Upload/CRUD */
  const adminAuthBox = document.getElementById("admin-auth-box");
  const adminUploadBox = document.getElementById("admin-upload-box");
  const adminSessionUserEl = document.getElementById("admin-session-user");
  const adminLoginForm = document.getElementById("admin-login-form");
  const adminLoginError = document.getElementById("admin-login-error");
  const loginPasswordInput = document.getElementById("login-password");
  const togglePasswordBtn = document.getElementById("toggle-password-btn");
  const adminLogoutBtn = document.getElementById("admin-logout-btn");

  const accountUploadForm = document.getElementById("account-upload-form");
  const accImageInput = document.getElementById("acc-image-input");
  const accPreviewFrame = document.getElementById("acc-preview-frame");
  const accPreviewImg = document.getElementById("acc-preview-img");
  const accPreviewInfo = document.getElementById("acc-preview-info");
  const accPreviewClearBtn = document.getElementById("acc-preview-clear-btn");
  const accPriceInput = document.getElementById("acc-price");
  const accPricePreview = document.getElementById("acc-price-preview");
  const accountUploadStatus = document.getElementById("account-upload-status");
  const accountUploadSubmit = document.getElementById("account-upload-submit");

  let activePreviewBlobUrl = "";

  const revokeActivePreview = () => {
    if (activePreviewBlobUrl) {
      URL.revokeObjectURL(activePreviewBlobUrl);
      activePreviewBlobUrl = "";
    }
    if (accPreviewFrame) accPreviewFrame.hidden = true;
    if (accPreviewImg) accPreviewImg.src = "/assets/favicon.svg";
    if (accPreviewInfo) accPreviewInfo.textContent = "";
  };

  if (togglePasswordBtn && loginPasswordInput) {
    togglePasswordBtn.addEventListener("click", () => {
      const showing = loginPasswordInput.type === "text";
      loginPasswordInput.type = showing ? "password" : "text";
      togglePasswordBtn.setAttribute("aria-pressed", String(!showing));
      togglePasswordBtn.textContent = showing ? "Hiện" : "Ẩn";
      togglePasswordBtn.setAttribute("aria-label", showing ? "Hiện mật khẩu" : "Ẩn mật khẩu");
    });
  }

  if (accImageInput) {
    accImageInput.addEventListener("change", () => {
      revokeActivePreview();
      const file = accImageInput.files && accImageInput.files[0];
      if (!file) return;

      if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
        showToast("Chỉ chấp nhận ảnh PNG, JPG hoặc WebP.");
        accImageInput.value = "";
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        showToast("Ảnh vượt quá giới hạn 5 MB.");
        accImageInput.value = "";
        return;
      }

      activePreviewBlobUrl = URL.createObjectURL(file);
      if (accPreviewImg) {
        accPreviewImg.src = activePreviewBlobUrl;
        accPreviewImg.onload = () => {
          if (accPreviewInfo) {
            const kb = Math.round(file.size / 1024);
            accPreviewInfo.textContent = `${accPreviewImg.naturalWidth}x${accPreviewImg.naturalHeight}px · ${kb} KB`;
          }
        };
        accPreviewImg.onerror = () => {
          showToast("Không thể giải mã file ảnh này — hãy chọn ảnh PNG/JPG/WebP hợp lệ.");
          accImageInput.value = "";
          revokeActivePreview();
        };
      }
      if (accPreviewFrame) accPreviewFrame.hidden = false;
    });
  }

  if (accPreviewClearBtn && accImageInput) {
    accPreviewClearBtn.addEventListener("click", () => {
      accImageInput.value = "";
      revokeActivePreview();
    });
  }

  if (accPriceInput && accPricePreview) {
    const updatePricePreview = () => {
      const val = Number(accPriceInput.value);
      accPricePreview.textContent =
        Number.isFinite(val) && val >= 1000
          ? `Hiển thị: ${formatVND(Math.floor(val))}`
          : "Hiển thị: —";
    };
    accPriceInput.addEventListener("input", updatePricePreview);
  }

  if (adminLoginForm) {
    adminLoginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (adminLoginError) adminLoginError.hidden = true;

      const username = document.getElementById("login-username").value.trim();
      const password = loginPasswordInput ? loginPasswordInput.value : "";

      try {
        const resp = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ username, password })
        });
        const data = await resp.json();
        if (!resp.ok || !data.ok) {
          if (adminLoginError) {
            adminLoginError.textContent = data.error || "Đăng nhập thất bại.";
            adminLoginError.hidden = false;
          }
          return;
        }

        csrfToken = data.csrfToken || "";
        if (document.body.getAttribute("data-route") === "/admin") {
          window.location.reload();
          return;
        }

        if (adminAuthBox) adminAuthBox.hidden = true;
        if (adminUploadBox) adminUploadBox.hidden = false;
        if (adminSessionUserEl) adminSessionUserEl.textContent = data.username;
        if (accGalleryGrid) accGalleryGrid.dataset.isAdmin = "1";
        if (toggleAdminAccPanelBtn) toggleAdminAccPanelBtn.textContent = "Mở Form Đăng Acc Mới (Admin)";
        showToast("Đăng nhập quản trị thành công!");
        await fetchAndRenderAccounts();
      } catch {
        if (adminLoginError) {
          adminLoginError.textContent = "Không thể kết nối máy chủ.";
          adminLoginError.hidden = false;
        }
      }
    });
  }

  if (adminLogoutBtn) {
    adminLogoutBtn.addEventListener("click", async () => {
      try {
        await fetch("/api/auth/logout", {
          method: "POST",
          headers: { "X-CSRF-Token": csrfToken },
          credentials: "same-origin"
        });
      } catch {
        // Ignore
      }
      csrfToken = "";
      window.location.reload();
    });
  }

  if (accountUploadForm) {
    accountUploadForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (accountUploadStatus) {
        accountUploadStatus.hidden = true;
        accountUploadStatus.classList.remove("is-error");
      }

      const file = accImageInput && accImageInput.files && accImageInput.files[0];
      if (!file) {
        if (accountUploadStatus) {
          accountUploadStatus.textContent = "Vui lòng chọn ảnh tài khoản trước khi đăng.";
          accountUploadStatus.classList.add("is-error");
          accountUploadStatus.hidden = false;
        }
        return;
      }

      const formData = new FormData(accountUploadForm);
      if (accountUploadSubmit) accountUploadSubmit.disabled = true;

      try {
        const resp = await fetch("/api/accounts", {
          method: "POST",
          headers: { "X-CSRF-Token": csrfToken },
          credentials: "same-origin",
          body: formData
        });
        const data = await resp.json();

        if (!resp.ok || !data.ok) {
          if (accountUploadStatus) {
            accountUploadStatus.textContent = data.error || "Đăng acc thất bại.";
            accountUploadStatus.classList.add("is-error");
            accountUploadStatus.hidden = false;
          }
          return;
        }

        accountUploadForm.reset();
        revokeActivePreview();
        if (accPricePreview) accPricePreview.textContent = "Hiển thị: —";
        if (accountUploadStatus) {
          accountUploadStatus.textContent = `Đã đăng thành công Acc #${data.account.code}!`;
          accountUploadStatus.hidden = false;
        }
        showToast(`Đã đăng Acc #${data.account.code} lên shop!`);
        await fetchAndRenderAccounts();
      } catch {
        if (accountUploadStatus) {
          accountUploadStatus.textContent = "Lỗi kết nối khi tải ảnh lên máy chủ.";
          accountUploadStatus.classList.add("is-error");
          accountUploadStatus.hidden = false;
        }
      } finally {
        if (accountUploadSubmit) accountUploadSubmit.disabled = false;
      }
    });
  }

  document.addEventListener("click", async (event) => {
    const toggleBtn = event.target.closest(".acc-toggle-status-btn");
    if (toggleBtn) {
      const id = toggleBtn.dataset.accId;
      const nextStatus = toggleBtn.dataset.nextStatus;
      toggleBtn.disabled = true;
      try {
        const resp = await fetch(`/api/accounts/${encodeURIComponent(id)}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "X-CSRF-Token": csrfToken
          },
          credentials: "same-origin",
          body: JSON.stringify({ status: nextStatus })
        });
        const data = await resp.json();
        if (resp.ok && data.ok) {
          showToast(
            nextStatus === "sold"
              ? `Đã chuyển #${data.account.code} sang Đã bán.`
              : `Đã mở bán lại #${data.account.code}.`
          );
          await fetchAndRenderAccounts();
        } else {
          showToast(data.error || "Không thể cập nhật trạng thái.");
        }
      } finally {
        toggleBtn.disabled = false;
      }
      return;
    }

    const delBtn = event.target.closest(".acc-delete-btn");
    if (delBtn) {
      const id = delBtn.dataset.accId;
      const code = delBtn.dataset.accCode || id;
      if (!window.confirm(`Xác nhận xóa vĩnh viễn tài khoản #${code}?`)) {
        return;
      }
      delBtn.disabled = true;
      try {
        const resp = await fetch(`/api/accounts/${encodeURIComponent(id)}`, {
          method: "DELETE",
          headers: { "X-CSRF-Token": csrfToken },
          credentials: "same-origin"
        });
        const data = await resp.json();
        if (resp.ok && data.ok) {
          showToast(`Đã xóa Acc #${code}.`);
          await fetchAndRenderAccounts();
        } else {
          showToast(data.error || "Xóa Acc thất bại.");
        }
      } finally {
        delBtn.disabled = false;
      }
    }
  });

  renderOrder();
})();

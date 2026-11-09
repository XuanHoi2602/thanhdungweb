"use strict";

const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const ROOT_DIR = path.resolve(__dirname, "..");

function loadEnvFile(filePath = path.join(ROOT_DIR, ".env")) {
  if (!fs.existsSync(filePath)) return;
  const raw = fs.readFileSync(filePath, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex <= 0) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

function deepFreeze(obj) {
  if (!obj || typeof obj !== "object") return obj;
  Object.freeze(obj);
  for (const key of Object.keys(obj)) {
    deepFreeze(obj[key]);
  }
  return obj;
}

loadEnvFile();

/**
 * Hằng số liên hệ & chuyển khoản CHÍNH CHỦ đóng băng (Object.freeze).
 * KHÔNG BAO GIỜ lấy từ DB hay request người dùng nhằm chống kẻ gian tiêm mã độc sửa link / STK.
 */
const OFFICIAL_CONTACTS = deepFreeze({
  shopName: "Shop Ngọc Rồng Online Thanh Dung",
  shortName: "THANH DUNG NRO",
  facebookUrl: "https://www.facebook.com/Thanhdungg.Kem",
  facebookHandle: "fb.com/Thanhdungg.Kem",
  zaloUrl: "http://zalo.me/84368018920",
  zaloDisplay: "0368.018.920",
  zaloRawPhone: "0368018920",
  zaloBoxSp1Url: "https://zalo.me/g/ryvnof825",
  zaloBoxSp1Display: "zalo.me/g/ryvnof825",
  fbGroupSp123Url: "https://www.facebook.com/groups/661620508010330?locale=vi_VN",
  fbGroupSp123Id: "661620508010330"
});

const OFFICIAL_BANK = deepFreeze({
  bankName: "MB Bank (Ngân hàng TMCP Quân đội)",
  bankShort: "MB Bank",
  accountOwner: "NGUYỄN HOÀNG THANH DUNG",
  accountNumber: "0368018920",
  qrImageUrl: "/assets/qr-mb-thanhdung.jpg",
  qrDiskPath: path.join(ROOT_DIR, "assets", "qr-mb-thanhdung.jpg"),
  qrDownloadName: "QR-MB-Nguyen-Hoang-Thanh-Dung-0368018920.jpg",
  qrExpectedSha256: "c3e76ad380231bfd47483de4346333b2c6f1e7abfee1750c783882d8b6ae2832"
});

const ALLOWED_ORIGINS_OUTGOING = deepFreeze([
  "https://www.facebook.com",
  "https://zalo.me",
  "http://zalo.me"
]);

const ALLOWED_PLANETS = deepFreeze(["Trái Đất", "Namếc", "Xayda"]);

const ALLOWED_STATUSES = deepFreeze(["available", "sold"]);

const ALLOWED_SERVERS = deepFreeze([
  "SP1",
  "SP2",
  "SP3",
  "Server 1",
  "Server 2",
  "Server 3",
  "Server 4",
  "Server 5",
  "Server 6",
  "Server 7",
  "Server 8",
  "Server 9",
  "Server 10",
  "Server 11",
  "Server 12",
  "Server 13",
  "Server 14"
]);

const KICH_DIEM_SERVICES = deepFreeze([
  {
    id: "kik-diem",
    badge: "Nạp & Kích điểm",
    tag: "Done 3s",
    tagClass: "tag-hot",
    name: "Nhận Kích Điểm",
    orderName: "Nhận kích điểm",
    price: 300000,
    unit: "lượt",
    priceText: "300.000 đ / lượt",
    note: "Kích điểm siêu tốc trong 3 giây, đảm bảo an toàn, nhanh gọn.",
    keywords: "kik điểm kích điểm 300k 300.000 nạp capsule kích hoạt vé vàng",
    icons: [
      { src: "/assets/icons/7223.png", alt: "Capsule 1 món kích hoạt", width: 72, height: 72 },
      { src: "/assets/icons/15686.png", alt: "Vé vàng", width: 92, height: 92 }
    ],
    ctaLabel: "Đặt Zalo"
  },
  {
    id: "nap-cr",
    badge: "Nạp & Kích điểm",
    tag: "Done 3s",
    tagClass: "tag-hot",
    name: "Nạp CR Siêu Tốc",
    orderName: "Nạp CR (done 3s)",
    price: 810000,
    unit: "gói",
    priceText: "810.000 đ / gói",
    note: "Nạp CR hoàn thành trong 3 giây, hỗ trợ xuyên suốt ngày đêm.",
    keywords: "nạp cr 810k 810.000 done 3s capsule vàng ngọc",
    icons: [
      { src: "/assets/icons/5004.png", alt: "Capsule Vàng", width: 72, height: 72 },
      { src: "/assets/icons/932.png", alt: "Ngọc", width: 56, height: 56 }
    ],
    ctaLabel: "Đặt Zalo"
  },
  {
    id: "thue-set",
    badge: "Cho Thuê Set",
    tag: "3 Hành Tinh",
    tagClass: "tag-jade",
    name: "Thuê Set Thần 3 Hành Tinh & Set SMTN 5s",
    orderName: "Thuê Set Thần / SMTN 5s",
    price: 10000,
    unit: "ngày",
    priceText: "10.000 đ / 1 ngày",
    note: "Set Thần Linh 3 hành tinh (Trái Đất, Namếc, Xayda) up thức ăn; Set SMTN TĐ, XD 5s.",
    keywords: "cho thuê set thần linh áo thần linh namếc xayda 3 hành tinh up thức ăn bánh pudding set smtn td xd 5s bùa trí tuệ 10ka 1day 10.000",
    icons: [
      { src: "/assets/icons/4647.png", alt: "Áo Thần Linh", width: 56, height: 44 },
      { src: "/assets/icons/4657.png", alt: "Áo Thần Namếc", width: 64, height: 40 },
      { src: "/assets/icons/4652.png", alt: "Áo Thần Xayda", width: 56, height: 44 },
      { src: "/assets/icons/6324.png", alt: "Bánh Pudding", width: 60, height: 64 },
      { src: "/assets/icons/1407.png", alt: "Bùa Trí Tuệ x4", width: 64, height: 64 }
    ],
    ctaLabel: "Check lịch"
  },
  {
    id: "san-de",
    badge: "Dịch Vụ Đệ Tử",
    tag: "Uy tín",
    tagClass: "",
    name: "Nhận Săn Đệ SS — Skill 5",
    orderName: "Nhận săn đệ SS - Skill 5",
    price: 0,
    unit: "yêu cầu",
    priceText: "Báo giá theo yêu cầu",
    note: "Nhận săn đệ tử Sơ Sinh (SS) và up/mở Skill 5 theo yêu cầu, bảo mật acc tuyệt đối.",
    keywords: "nhận săn đệ ss đệ sơ sinh skill 5 đệ tử đổi đệ tử",
    icons: [
      { src: "/assets/icons/15766.png", alt: "Đổi đệ tử", width: 92, height: 92 },
      { src: "/assets/icons/7101.png", alt: "Nâng kỹ năng đệ tử", width: 80, height: 80 }
    ],
    ctaLabel: "Ib Zalo"
  },
  {
    id: "gdtg-thu-acc",
    badge: "GDTG & Thu Mua",
    tag: "Ko nhận mail sống",
    tagClass: "tag-crimson",
    name: "GDTG 20/24 & Thu Mua All Acc + Đồ",
    orderName: "GDTG 20/24 hoặc Bán Acc / Đồ",
    price: 0,
    unit: "giao dịch",
    priceText: "20/24 Siêu Tốc · BMTT",
    note: "GDTG 20/24 siêu tốc (không nhận mail sống). Thu all acc + đồ tầm trung -> siêu phẩm (BMTT ko bắt scam).",
    keywords: "gdtg trung gian 20/24 siu tốc không nhận mail sống thu all acc đồ tầm trung siêu phẩm bmtt ko bắt scam",
    icons: [
      { src: "/assets/icons/5007.png", alt: "Rương Vàng", width: 96, height: 68 },
      { src: "/assets/icons/15614.png", alt: "Bông tai Porata", width: 80, height: 80 }
    ],
    ctaLabel: "Mở GDTG Zalo"
  },
  {
    id: "rut-vts",
    badge: "Hỗ Trợ Tài Chính",
    tag: "Nhanh · Gọn",
    tagClass: "",
    name: "Nhận Rút VTS — Tín Dụng",
    orderName: "Nhận rút VTS - Tín dụng",
    price: 0,
    unit: "yêu cầu",
    priceText: "Phí ưu đãi · Ib Zalo/FB",
    note: "Hỗ trợ rút Ví Trả Sau (VTS) và thẻ Tín Dụng nhanh chóng, bảo mật thông tin khách hàng.",
    keywords: "nhận rút vts ví trả sau tín dụng thẻ tín dụng vé vàng thỏi vàng",
    icons: [
      { src: "/assets/icons/15686.png", alt: "Vé vàng", width: 92, height: 92 },
      { src: "/assets/icons/4028.png", alt: "Thỏi vàng", width: 84, height: 36 }
    ],
    ctaLabel: "Liên hệ Zalo"
  }
]);

const ITEM_CARDS = deepFreeze([
  {
    id: "cuong-no-x99",
    category: "item-x99",
    badge: "Item Hỗ Trợ",
    tag: "Sẵn kho",
    tagClass: "",
    name: "Bán x99 Cuồng nộ",
    orderName: "x99 Cuồng nộ",
    price: 15000,
    unit: "x99",
    priceText: "15.000 đ / x99",
    note: "Cuồng nộ tăng +100% sức đánh gốc trong 10 phút khi đi săn boss, pem nhau.",
    keywords: "item x99 15ka 15k 15.000 cuồng nộ cn",
    icons: [{ src: "/assets/icons/2754.png", alt: "Cuồng nộ", width: 76, height: 80 }]
  },
  {
    id: "bh-x99",
    category: "item-x99",
    badge: "Item Hỗ Trợ",
    tag: "Giá rẻ",
    tagClass: "",
    name: "Bán x99 Bổ huyết (BH)",
    orderName: "x99 Bổ huyết (BH)",
    price: 10000,
    unit: "x99",
    priceText: "10.000 đ / x99",
    note: "x99 Bổ huyết tăng +100% HP tối đa trong 10 phút, cực cần khi săn boss.",
    keywords: "x99 bh bổ huyết 10ka 10k 10.000",
    icons: [{ src: "/assets/icons/2755.png", alt: "Bổ huyết", width: 80, height: 76 }]
  },
  {
    id: "gx-x99",
    category: "item-x99",
    badge: "Item Hỗ Trợ",
    tag: "Giá rẻ",
    tagClass: "",
    name: "Bán x99 Giáp Xên bọ hung (GX)",
    orderName: "x99 Giáp Xên bọ hung (GX)",
    price: 10000,
    unit: "x99",
    priceText: "10.000 đ / x99",
    note: "x99 Giáp Xên bọ hung giảm 50% sát thương khi đi doanh trại & săn boss.",
    keywords: "x99 gx giáp xên bọ hung 10ka 10k 10.000",
    icons: [{ src: "/assets/icons/2757.png", alt: "Giáp Xên bọ hung", width: 80, height: 64 }]
  },
  {
    id: "md-cskb",
    category: "item-x99",
    badge: "Item Hỗ Trợ",
    tag: "Sẵn hàng",
    tagClass: "",
    name: "Bán x99 Máy dò Capsule kì bí (MD CSKB)",
    orderName: "x99 Máy dò Capsule kì bí (MD CSKB)",
    price: 40000,
    unit: "x99",
    priceText: "40.000 đ / x99",
    note: "x99 Máy dò Capsule kì bí dùng để tìm kiếm Viên Capsule kì bí ở tương lai.",
    keywords: "x99 md cskb máy dò capsule kì bí kỳ bí 40ka 40k 40.000",
    icons: [{ src: "/assets/icons/2758.png", alt: "Máy dò Capsule kì bí", width: 80, height: 64 }]
  },
  {
    id: "da-nc-999",
    category: "da-duiduc",
    badge: "Đá Nâng Cấp",
    tag: "Đủ 5 loại",
    tagClass: "tag-jade",
    name: "x999 Đá Nâng Cấp Các Loại",
    orderName: "x999 Đá nâng cấp các loại",
    price: 20000,
    unit: "lô 999",
    priceText: "20.000 đ / 999 viên",
    note: "Đủ bộ Đá lục bảo, Saphia, Ruby, Titan, Thạch anh tím đập đồ Bà Hạt Mít.",
    keywords: "x999 đá nc đá nâng cấp đá lục bảo saphia ruby titan thạch anh tím 20k 20.000 999",
    icons: [
      { src: "/assets/icons/1420.png", alt: "Đá lục bảo", width: 64, height: 64 },
      { src: "/assets/icons/1419.png", alt: "Đá Saphia", width: 48, height: 48 },
      { src: "/assets/icons/1416.png", alt: "Đá Ruby", width: 48, height: 48 },
      { src: "/assets/icons/1417.png", alt: "Đá Titan", width: 48, height: 48 },
      { src: "/assets/icons/1418.png", alt: "Đá thạch anh tím", width: 48, height: 48 }
    ]
  },
  {
    id: "dui-duc",
    category: "da-duiduc",
    badge: "Vật Phẩm Hỗ Trợ",
    tag: "Có SLL",
    tagClass: "tag-hot",
    name: "Bán Dùi đục (Có SLL)",
    orderName: "Dùi đục (SLL)",
    price: 10000,
    unit: "cái",
    priceText: "10.000 đ / 1 cái",
    note: "Dùi đục chính hãng TeaMobi dùng đục lỗ trang bị tại Bà Hạt Mít, sẵn số lượng lớn.",
    keywords: "dùi đục 10ka 10.000 có sll số lượng lớn",
    icons: [{ src: "/assets/icons/12139.png", alt: "Dùi đục", width: 80, height: 76 }]
  },
  {
    id: "vang-info",
    category: "vang-ngoc",
    badge: "Vàng Server",
    tag: "Giá cạnh tranh",
    tagClass: "tag-hot",
    name: "Bán Vàng Tươi & Vàng Die",
    orderName: null,
    price: 0,
    unit: "gói",
    priceText: "Tươi x15 · Die x60",
    note: "Thỏi vàng / Vàng giao dịch nhanh gọn: Vàng tươi x15, Vàng die x60 (dùng Máy tính 2 chiều bên dưới).",
    keywords: "bán vàng tươi x15 vàng die x60 thỏi vàng",
    icons: [
      { src: "/assets/icons/4028.png", alt: "Thỏi vàng", width: 84, height: 36 },
      { src: "/assets/icons/930.png", alt: "Vàng", width: 64, height: 56 }
    ],
    anchorHref: "#vang-ngoc",
    anchorLabel: "Tính tiền vàng"
  },
  {
    id: "ngoc-info",
    category: "vang-ngoc",
    badge: "Ngọc & Kí Gửi",
    tag: "2 Hình thức",
    tagClass: "tag-jade",
    name: "Bán Ngọc Kí (x11) & Ngọc Vé (x10)",
    orderName: null,
    price: 0,
    unit: "gói",
    priceText: "Ngọc kí x11 · Ngọc vé x10",
    note: "Ngọc kí x11 giao trực tiếp và Ngọc vé x10 (Vé tặng ngọc ID 718 — có ở máy tính bên dưới).",
    keywords: "bán ngọc x11 ngọc kí ngọc vé x10 vé tặng ngọc 718 ngọc xanh",
    icons: [
      { src: "/assets/icons/932.png", alt: "Ngọc kí", width: 56, height: 56 },
      { src: "/assets/icons/6765.png", alt: "Vé tặng ngọc ID 718", width: 72, height: 72 }
    ],
    anchorHref: "#vang-ngoc",
    anchorLabel: "Tính ngọc"
  },
  {
    id: "spl",
    category: "spl-manh",
    badge: "Sao Pha Lê",
    tag: "Đủ loại",
    tagClass: "",
    name: "Bán Sao pha lê (SPL) Các Loại",
    orderName: "Sao pha lê (SPL) các loại",
    price: 1000,
    unit: "viên",
    priceText: "1.000 đ / 1 viên",
    note: "Đủ màu Sao pha lê đỏ, lam, hồng, tím, cam, vàng, lục ép chỉ số trang bị.",
    keywords: "spl sao pha lê đỏ lam vàng lục các loại 1k 1v 1.000 1 viên",
    icons: [
      { src: "/assets/icons/3887.png", alt: "Sao pha lê đỏ", width: 64, height: 64 },
      { src: "/assets/icons/3888.png", alt: "Sao pha lê lam", width: 64, height: 64 },
      { src: "/assets/icons/3892.png", alt: "Sao pha lê vàng", width: 64, height: 64 },
      { src: "/assets/icons/3893.png", alt: "Sao pha lê lục", width: 64, height: 64 }
    ]
  },
  {
    id: "nr-3s",
    category: "spl-manh",
    badge: "Ngọc Rồng",
    tag: "Giá mềm",
    tagClass: "tag-hot",
    name: "Bán Ngọc Rồng 3 sao (NR 3s)",
    orderName: "Ngọc Rồng 3 sao (NR 3s)",
    price: 2500,
    unit: "viên",
    priceText: "2.500 đ / 1 viên",
    note: "Ngọc Rồng 3 sao ước rồng thần sẵn sàng giao ngay hoặc tích trữ.",
    keywords: "nr 3s ngọc rồng 3 sao 2k5 2.500 1 viên",
    icons: [{ src: "/assets/icons/421.png", alt: "Ngọc Rồng 3 sao", width: 64, height: 64 }]
  },
  {
    id: "manh-hiem",
    category: "spl-manh",
    badge: "Sưu Tầm & Mảnh",
    tag: "Sẵn hàng",
    tagClass: "",
    name: "Mảnh Khỉ · Mảnh Rồng · Mảnh Đội trưởng Vàng",
    orderName: "Mảnh Khỉ / Mảnh Rồng / Mảnh Đội trưởng Vàng",
    price: 0,
    unit: "lô",
    priceText: "Liên hệ giá theo lô",
    note: "Cung cấp Mảnh Khỉ Oozaru, Mảnh Rồng thần Namếc và Mảnh Đội trưởng Vàng (Mảnh DTV) giá tốt.",
    keywords: "mảnh khỉ oozaru mảnh rồng thần namếc mảnh dtv mảnh đội trưởng vàng 956",
    icons: [
      { src: "/assets/icons/14247.png", alt: "Mảnh Khỉ Oozaru", width: 72, height: 72 },
      { src: "/assets/icons/11048.png", alt: "Mảnh Rồng thần Namếc", width: 96, height: 96 },
      { src: "/assets/icons/8935.png", alt: "Mảnh Đội trưởng Vàng", width: 84, height: 84 }
    ]
  }
]);

const ITEM_PRICE_ROWS = deepFreeze([
  { id: "cuong-no-x99", name: "x99 Cuồng nộ", group: "Item x99", price: 15000, unit: "x99", unitPriceLabel: "15.000 đ / x99", defaultQty: 1, maxQty: 9999, icon: "/assets/icons/2754.png", iconAlt: "Cuồng nộ", width: 76, height: 80 },
  { id: "bh-x99", name: "x99 Bổ huyết (BH)", group: "Item x99", price: 10000, unit: "x99", unitPriceLabel: "10.000 đ / x99", defaultQty: 1, maxQty: 9999, icon: "/assets/icons/2755.png", iconAlt: "Bổ huyết", width: 80, height: 76 },
  { id: "gx-x99", name: "x99 Giáp Xên bọ hung (GX)", group: "Item x99", price: 10000, unit: "x99", unitPriceLabel: "10.000 đ / x99", defaultQty: 1, maxQty: 9999, icon: "/assets/icons/2757.png", iconAlt: "Giáp Xên bọ hung", width: 80, height: 64 },
  { id: "md-cskb", name: "x99 Máy dò Capsule kì bí (MD CSKB)", group: "Item x99", price: 40000, unit: "x99", unitPriceLabel: "40.000 đ / x99", defaultQty: 1, maxQty: 9999, icon: "/assets/icons/2758.png", iconAlt: "Máy dò Capsule kì bí", width: 80, height: 64 },
  { id: "dui-duc", name: "Dùi đục (Có SLL)", group: "Đục lỗ", price: 10000, unit: "cái", unitPriceLabel: "10.000 đ / 1 cái", defaultQty: 1, maxQty: 9999, icon: "/assets/icons/12139.png", iconAlt: "Dùi đục", width: 80, height: 76 },
  { id: "da-luc-bao-999", name: "x999 Đá lục bảo", group: "Đá NC", price: 20000, unit: "lô 999", unitPriceLabel: "20.000 đ / 999 viên", defaultQty: 1, maxQty: 9999, icon: "/assets/icons/1420.png", iconAlt: "Đá lục bảo", width: 64, height: 64 },
  { id: "da-saphia-999", name: "x999 Đá Saphia", group: "Đá NC", price: 20000, unit: "lô 999", unitPriceLabel: "20.000 đ / 999 viên", defaultQty: 1, maxQty: 9999, icon: "/assets/icons/1419.png", iconAlt: "Đá Saphia", width: 48, height: 48 },
  { id: "da-ruby-999", name: "x999 Đá Ruby", group: "Đá NC", price: 20000, unit: "lô 999", unitPriceLabel: "20.000 đ / 999 viên", defaultQty: 1, maxQty: 9999, icon: "/assets/icons/1416.png", iconAlt: "Đá Ruby", width: 48, height: 48 },
  { id: "da-titan-999", name: "x999 Đá Titan", group: "Đá NC", price: 20000, unit: "lô 999", unitPriceLabel: "20.000 đ / 999 viên", defaultQty: 1, maxQty: 9999, icon: "/assets/icons/1417.png", iconAlt: "Đá Titan", width: 48, height: 48 },
  { id: "da-thach-anh-999", name: "x999 Đá thạch anh tím", group: "Đá NC", price: 20000, unit: "lô 999", unitPriceLabel: "20.000 đ / 999 viên", defaultQty: 1, maxQty: 9999, icon: "/assets/icons/1418.png", iconAlt: "Đá thạch anh tím", width: 48, height: 48 },
  { id: "spl", name: "Sao pha lê (SPL) các loại", group: "Ép đồ", price: 1000, unit: "viên", unitPriceLabel: "1.000 đ / 1 viên", defaultQty: 10, maxQty: 9999, icon: "/assets/icons/3887.png", iconAlt: "Sao pha lê", width: 64, height: 64 },
  { id: "nr-3s", name: "Ngọc Rồng 3 sao (NR 3s)", group: "Ngọc Rồng", price: 2500, unit: "viên", unitPriceLabel: "2.500 đ / 1 viên", defaultQty: 10, maxQty: 9999, icon: "/assets/icons/421.png", iconAlt: "Ngọc Rồng 3 sao", width: 64, height: 64 }
]);

const STARTER_ACCS = deepFreeze([
  {
    id: "acc-dau5",
    name: "Acc Đậu thần cấp 5",
    price: 8000,
    unit: "acc",
    priceText: "8.000 đ / 1 acc",
    tag: "Sẵn SLL",
    note: "Acc Đậu thần cấp 5 sạch, đăng ký chuẩn, sẵn sàng up đệ / buff đậu ngay.",
    icon: "/assets/icons/241.png",
    iconAlt: "Đậu thần cấp 5",
    width: 48,
    height: 48
  },
  {
    id: "acc-clone",
    name: "Acc Clone 340k SM",
    price: 3000,
    unit: "acc",
    priceText: "3.000 đ / 1 acc",
    tag: "Giao ngay",
    note: "Acc Clone 340.000 sức mạnh dùng cày sự kiện, săn boss, chạy kèo cực tiện.",
    icon: "/assets/icons/1089.png",
    iconAlt: "Rada cấp 1",
    width: 48,
    height: 64
  }
]);

const FULL_AD_POST = [
  "🔥 SHOP NGỌC RỒNG ONLINE THANH DUNG 🔥",
  "✅ Nhận kích điểm 300.000 đ - nạp CR 810.000 đ done 3s",
  "✅ Bán x99 Cuồng nộ 15.000 đ / x99 - x99 Bổ huyết 10.000 đ / x99 - x99 Giáp Xên bọ hung 10.000 đ / x99",
  "✅ Bán x999 đá nâng cấp các loại 20.000 đ / 999 - dùi đục 10.000 đ / 1 cái có SLL",
  "✅ Bán x99 máy dò CSKB 40.000 đ / x99",
  "✅ Cho thuê set thần 3 hành tinh up thức ăn, set SMTN TĐ, XD 5s 10.000 đ / 1 ngày",
  "✅ Bán vàng tươi x15, vàng die x60 - ngọc kí x11, ngọc vé (ID 718) x10",
  "✅ Bán SPL các loại 1.000 đ / 1 viên",
  "✅ Bán mảnh khỉ, mảnh rồng, mảnh Đội trưởng Vàng (DTV)",
  "✅ Nhận săn đệ SS - skill 5",
  "✅ Bán acc đậu 5 8.000 đ / 1 acc - acc clone 340k sm 3.000 đ / 1 acc",
  "✅ Bán NR 3s 2.500 đ / 1 viên",
  "✅ Nhận rút VTS tín dụng",
  "✅ Nhận GDTG 20/24 siêu tốc (không nhận mail sống)",
  "✅ Thu all acc + đồ tầm trung => siêu phẩm (BMTT ko bắt scam)",
  "📌 Link box sp1: https://zalo.me/g/ryvnof825",
  "📌 Link group sp123 Thanh Dung: https://www.facebook.com/groups/661620508010330?locale=vi_VN",
  "🏦 MB Bank chính chủ: 0368018920 - NGUYỄN HOÀNG THANH DUNG",
  "💬 Facebook: https://www.facebook.com/Thanhdungg.Kem",
  "💬 Zalo: http://zalo.me/84368018920 (0368.018.920)"
].join("\n");

const CONFIG_CANONICAL_PAYLOAD = JSON.stringify({
  contacts: OFFICIAL_CONTACTS,
  bank: {
    bankName: OFFICIAL_BANK.bankName,
    accountOwner: OFFICIAL_BANK.accountOwner,
    accountNumber: OFFICIAL_BANK.accountNumber,
    qrImageUrl: OFFICIAL_BANK.qrImageUrl,
    qrExpectedSha256: OFFICIAL_BANK.qrExpectedSha256
  }
});

const CONFIG_SHA256 = crypto
  .createHash("sha256")
  .update(CONFIG_CANONICAL_PAYLOAD)
  .digest("hex");

function getOrCreateAppSecret(dataDir = path.join(ROOT_DIR, "data")) {
  if (process.env.APP_SECRET && process.env.APP_SECRET.length >= 24) {
    return process.env.APP_SECRET;
  }
  fs.mkdirSync(dataDir, { recursive: true });
  const keyFile = path.join(dataDir, ".hmac-key");
  if (fs.existsSync(keyFile)) {
    const existing = fs.readFileSync(keyFile, "utf8").trim();
    if (existing.length >= 32) return existing;
  }
  const generated = crypto.randomBytes(32).toString("hex");
  fs.writeFileSync(keyFile, generated, { encoding: "utf8", mode: 0o600 });
  return generated;
}

function verifyIntegrity() {
  let qrActualSha256 = null;
  let qrValid = false;
  try {
    const qrBytes = fs.readFileSync(OFFICIAL_BANK.qrDiskPath);
    qrActualSha256 = crypto.createHash("sha256").update(qrBytes).digest("hex");
    qrValid = qrActualSha256 === OFFICIAL_BANK.qrExpectedSha256;
  } catch {
    qrActualSha256 = null;
    qrValid = false;
  }

  return {
    ok: qrValid,
    qrValid,
    qrExpectedSha256: OFFICIAL_BANK.qrExpectedSha256,
    qrActualSha256,
    configSha256: CONFIG_SHA256,
    checkedAt: new Date().toISOString()
  };
}

module.exports = {
  ROOT_DIR,
  OFFICIAL_CONTACTS,
  OFFICIAL_BANK,
  ALLOWED_ORIGINS_OUTGOING,
  ALLOWED_PLANETS,
  ALLOWED_STATUSES,
  ALLOWED_SERVERS,
  KICH_DIEM_SERVICES,
  ITEM_CARDS,
  ITEM_PRICE_ROWS,
  STARTER_ACCS,
  FULL_AD_POST,
  CONFIG_SHA256,
  getOrCreateAppSecret,
  verifyIntegrity
};

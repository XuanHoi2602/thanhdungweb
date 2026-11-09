# Shop Ngọc Rồng Online Thanh Dung — Web Multi-Path & Bảo Mật Chính Chủ

Website bán hàng game **Ngọc Rồng Online (TeaMobi)** chính chủ với giao diện chốt tông **Namek Xanh Ngọc**, phân khu rõ ràng theo từng URL path, tích hợp quản lý **Mua Bán Tài Khoản** (upload ảnh acc thật, giá, server, hành tinh, ghi chú quảng cáo) và hệ thống **bảo mật Backend + Frontend** chống tiêm mã độc (XSS) làm đổi link hoặc số tài khoản chuyển khoản.

## 1. Cấu trúc đường dẫn (Multi-Path)

- `/` — **Trang chủ tổng quan**: Hero Shenron, 3 khu dịch vụ chính, acc nổi bật, **Mã QR & STK MB Bank chính chủ (`0368018920`)**, 4 liên hệ chính thức.
- `/kich-diem` — **Path Kích điểm & Dịch vụ VIP**: Nhận kích điểm `300.000 đ`, nạp CR `810.000 đ` done 3s, Thuê Set Thần 3 hành tinh / Set SMTN 5s `10.000 đ / ngày`, Săn Đệ SS – Skill 5, GDTG 20/24 (ko nhận mail sống), Thu All Acc (BMTT), Rút VTS – Tín dụng.
- `/mua-item` — **Path Mua Item & Tính đơn**: Bảng giá chi tiết chọn số lượng x99 Cuồng nộ (`15k`), BH/GX (`10k`), MD CSKB (`40k`), 5 loại Đá NC (`20k/999`), Dùi đục SLL (`10k`), SPL (`1k`), NR 3s (`2k5`), Mảnh Khỉ/Rồng/Đội trưởng Vàng (DTV), Bảng quy đổi Vàng (`x15` / `x60`), Ngọc kí (`x11`) / Ngọc vé (`x10` ID `718`) & Máy tính 2 chiều.
- `/mua-tai-khoan` — **Path Mua Bán Tài Khoản**: Acc Đậu 5 (`8.000 đ`), Acc Clone 340k SM (`3.000 đ`), Kho Tài Khoản NRO lọc theo **Server · Hành tinh (`Trái Đất` / `Namếc` / `Xayda`) · Trạng thái**, xem ảnh lớn và khung **Quản lý Up Hình Acc** dành cho Chủ Shop.
- `/admin` — **Quản trị & Bảo mật**: Đăng nhập Chủ Shop, đăng/sửa/xóa acc, kiểm tra toàn vẹn SHA-256 của STK/Link/QR và xem **Audit Logs / CSP Reports**.

## 2. Kiến trúc bảo mật đã triển khai

1. **Chống tiêm mã độc làm đổi Link & STK**:
   - Thông tin liên hệ chính thức (`Thanhdungg.Kem`, `0368.018.920`, Box Zalo SP1, Group FB SP123) và STK MB Bank `0368018920` - `NGUYỄN HOÀNG THANH DUNG` được **đóng băng bất biến (`Object.freeze`)** trong [src/config.js](file:///d:/NRO/Website%20TD/src/config.js), không lấy từ database ghi được.
   - Kiểm tra chữ ký **SHA-256** tệp `assets/qr-mb-thanhdung.jpg` mỗi lần phục vụ; cảnh báo ngay nếu ảnh QR bị tráo đổi.
   - Frontend [public/app.js](file:///d:/NRO/Website%20TD/public/app.js) chạy `MutationObserver` kiểm tra chéo với `/api/shop-data`: nếu có mã/extension cố tình sửa `href`, `src` hoặc STK trên DOM, hệ thống tự khôi phục về giá trị chính chủ ngay lập tức và luôn lấy link/STK trực tiếp từ hằng số đã khóa khi gửi đơn hoặc copy.
2. **CSP Nonce & Zero DOM Sinks**:
   - Sinh `nonce` ngẫu nhiên 128-bit cho từng lượt tải HTML (`script-src 'nonce-...' 'report-sample'`, `frame-ancestors 'none'`, `object-src 'none'`, `base-uri 'none'`), không dùng `innerHTML`/`eval`/inline handlers.
3. **Bảo vệ Upload Ảnh Acc & Xác thực Admin**:
   - Phiên đăng nhập `scrypt` + `timingSafeEqual`, cookie `HttpOnly; SameSite=Lax` (`__Host-` + `Secure` khi chạy HTTPS), token `X-CSRF-Token`, chặn `Cross-Site` qua `Fetch Metadata` (`Sec-Fetch-Site`), giới hạn tần suất (Rate Limit).
   - Ảnh upload bắt buộc kiểm tra **magic bytes thật (`PNG / JPG / WebP`)** tối đa `5 MB`, chặn SVG/HTML giả mạo, lưu bằng tên UUID ngẫu nhiên trong `uploads/` và trả về kèm `X-Content-Type-Options: nosniff` + `Content-Security-Policy: default-src 'none'; sandbox;`.

## 3. Chạy thử & Chuẩn bị Deploy Test

Yêu cầu **Node.js >= 22.5** (khuyến nghị Node 24/26, chạy chuẩn zero third-party `node_modules`).

```powershell
# 1. Tạo file .env từ mẫu và đổi ADMIN_PASS thật mạnh
copy .env.example .env

# 2. Chạy kiểm thử bảo mật & multi-path tự động
npm test

# 3. Khởi động máy chủ test cục bộ
npm start
```

Mở trình duyệt tới `http://127.0.0.1:3000`. Nếu chưa thiết lập `ADMIN_PASS` trong `.env`, lần chạy đầu máy chủ tự sinh mật khẩu ngẫu nhiên in ở terminal và lưu tạm vào `.bootstrap-credentials.txt`.

Khi deploy lên VPS thật sau **Nginx / Cloudflare Tunnel (HTTPS)**, bật trong `.env`:
```env
HOST=127.0.0.1
PORT=3000
TRUST_PROXY=1
FORCE_SECURE_COOKIE=1
```

## 4. Deploy nhanh lên Railway (Khuyên dùng — hỗ trợ SQLite + Upload ảnh lâu dài)

Repo đã cấu hình sẵn [`railway.toml`](railway.toml) (`builder = "RAILPACK"`, `healthcheckPath = "/api/health"`), [`.node-version`](.node-version) (`22`) và tự nhận diện môi trường Railway:
- Tự bind **IPv6/IPv4 dual-stack (`::`)** theo đúng chuẩn Healthcheck & Private Network của Railway.
- Tự bật nhận diện Reverse Proxy HTTPS (`X-Forwarded-Proto`) để cấp cookie `__Host-td_session; HttpOnly; Secure; SameSite=Lax` và header `HSTS`.
- Tự ánh xạ `data/` (SQLite) & `uploads/` (ảnh acc) vào **`RAILWAY_VOLUME_MOUNT_PATH`** khi gắn Persistent Volume.

**Các bước thao tác trên Railway:**
1. Push mã nguồn lên GitHub (`https://github.com/<user>/<repo>`).
2. Vào **Railway → New Project → Deploy from GitHub Repo** và chọn repository.
3. Vào tab **Variables** của service vừa tạo, thêm 3 biến:
   - `ADMIN_USER` = `thanhdung` (hoặc tên quản trị bạn muốn)
   - `ADMIN_PASS` = mật khẩu admin thật mạnh của bạn
   - `APP_SECRET` = chuỗi ngẫu nhiên dài 32–64 ký tự
4. **Rất quan trọng (để không mất database acc & ảnh upload khi redeploy):**
   Vào **Settings (hoặc Right-click Canvas) → Add Volume → Mount Path: `/storage`** (tuyệt đối không mount vào `/app`).
5. Vào **Settings → Networking → Generate Domain** để lấy link `https://...up.railway.app` (sau này gắn thêm Custom Domain của bạn trực tiếp tại mục này).

# Nhà Thuốc Admin — Frontend (Next.js + Bootstrap)

Giao diện quản trị cho hệ thống Quản lý Nhà thuốc, xây dựng để gọi trực tiếp
vào backend Node.js/Express có sẵn trong thư mục `be/` (không tạo thêm API
mới — chỉ dùng đúng 5 route CRUD chuẩn đã có ở mỗi router).

## 1. Cài đặt & chạy thử

```bash
cd frontend
npm install
cp .env.local.example .env.local   # rồi sửa NEXT_PUBLIC_API_URL nếu cần
npm run dev -- -p 3001             # QUAN TRỌNG: chạy ở cổng khác cổng backend
```

Mặc định backend (`be/app.js`) chạy ở `http://localhost:3000`. Vì vậy
**frontend phải chạy ở cổng khác** (khuyến nghị 3001) — không thể chạy cả hai
cùng cổng 3000.

## 2. ⚠️ BẮT BUỘC: Bật CORS ở backend

Trình duyệt sẽ **chặn mọi request** từ `http://localhost:3001` (frontend) gọi
sang `http://localhost:3000` (backend) nếu backend chưa bật CORS. Đây là yêu
cầu bắt buộc để frontend hoạt động được — không phải một API mới, chỉ là một
middleware chuẩn của Express:

```bash
cd be
npm install cors
```

Thêm 2 dòng vào đầu `be/app.js` (trước các `app.use('/api/...')`):

```js
const cors = require('cors');
app.use(cors());
```

## 3. Đăng nhập

Backend hiện **chưa có endpoint đăng nhập riêng** (`tai_khoanController` chỉ
có CRUD chuẩn), nên trang `/login` lấy toàn bộ `GET /api/tai_khoan` rồi đối
chiếu `ten_dang_nhap` / `mat_khau` ở phía client. Điều này chỉ phù hợp cho đồ
án/demo — **không dùng cho production** vì mật khẩu sẽ bị lộ ra ngoài client.
Khi cần dùng thật, nên bổ sung 1 endpoint `POST /api/tai_khoan/login` ở
backend (so sánh + hash mật khẩu bằng bcrypt) rồi thay nội dung hàm `login()`
trong `context/AuthContext.jsx`.

➡️ Để đăng nhập được, bảng `tai_khoan` trong MySQL cần có ít nhất 1 dòng dữ
liệu (thêm bằng phpMyAdmin/MySQL Workbench hoặc gọi `POST /api/tai_khoan`).

## 4. ⚠️ Giả định về tên cột (schema)

Toàn bộ model trong `be/models/*.js` đều viết dạng `SELECT * FROM ...`, nên
**không có khai báo tên cột tường minh** để tham chiếu. Vì vậy các trang ở
đây dùng quy ước đặt tên tiếng Việt phổ biến cho đồ án "Quản lý nhà thuốc".
Danh sách giả định chính (xem thêm ghi chú đầu file `lib/constants.js`):

| Bảng | Các cột được dùng trong frontend |
|---|---|
| `thuoc` | `id, ten_thuoc, id_danh_muc, id_nha_cung_cap, loai_thuoc (THUOC_THUONG/THUOC_DON), gia_ban, so_luong, don_vi_tinh, han_su_dung` |
| `mo_ta_thuoc` | `id_thuoc, thanh_phan, cong_dung, huong_dan_su_dung, bao_quan, canh_bao` |
| `anh_thuoc` | `id, id_thuoc, duong_dan_anh` |
| `danh_muc_thuoc` | `id, ten_danh_muc, mo_ta` |
| `nha_cung_cap` | `id, ten_nha_cung_cap, so_dien_thoai, email, dia_chi` |
| `bac_si` | `id, ho_ten, chuyen_khoa, so_dien_thoai, email, trang_thai` |
| `khach_hang` | `id, ho_ten, so_dien_thoai, email, dia_chi` |
| `don_thuoc` | `id, id_khach_hang, id_bac_si, ngay_ke, ghi_chu, trang_thai` |
| `chi_tiet_don_thuoc` | `id_don_thuoc, id_thuoc, so_luong, lieu_dung, cach_dung` |
| `don_dat_thuoc` | `id, id_khach_hang, ngay_dat, tong_tien, trang_thai` |
| `chi_tiet_don_dat` | `id_don_dat, id_thuoc, so_luong, don_gia, thanh_tien` |
| `lich_su_theo_doi_don` | `id_don_dat, trang_thai, thoi_gian, ghi_chu` |
| `phieu_nhap_thuoc` | `id, id_nha_cung_cap, id_nhan_vien, ngay_nhap, tong_tien, trang_thai` |
| `chi_tiet_phieu_nhap` | `id_phieu_nhap, id_thuoc, so_luong, don_gia, thanh_tien` |
| `lich_su_trang_thai_nhap` | `id_phieu_nhap, trang_thai, thoi_gian` |
| `hoa_don` | `id, id_khach_hang, id_nhan_vien, ngay_lap, tong_tien` |
| `thanh_toan` | `id, id_don_dat, phuong_thuc, so_tien, trang_thai, ngay_thanh_toan` |
| `nhan_vien` | `id, ho_ten, chuc_vu, so_dien_thoai, email` |
| `tai_khoan` | `id, ten_dang_nhap, mat_khau, vai_tro, email, trang_thai, ngay_tao` |
| `khuyen_mai` | `id, ten_khuyen_mai, phan_tram_giam, ngay_bat_dau, ngay_ket_thuc, trang_thai` |
| `danh_gia` | `id, id_khach_hang, id_thuoc, so_sao, noi_dung, ngay_danh_gia` |
| `v_thuoc_ke_don` | dùng để tổng hợp bác sĩ/khách hàng đã kê một loại thuốc đơn đặt |
| `v_thuoc_sap_het_han` | dùng cho danh sách/thống kê thuốc sắp hết hạn |

**Nếu CSDL thật của bạn dùng tên cột khác:** mở đúng trang trong
`app/admin/**/page.jsx` (hoặc component liên quan trong `components/admin/`)
và sửa lại chuỗi tên cột trong mảng `columns` / `formFields` / các lệnh gọi
`pickFirst(obj, ["ten_cot_cua_ban"], fallback)`. Hàm `pickFirst` cho phép
liệt kê nhiều tên cột khả dĩ — nó sẽ tự lấy giá trị đầu tiên tồn tại, giúp
việc thích nghi với schema thật nhanh hơn.

## 5. Cấu trúc thư mục

```
frontend/
├── app/
│   ├── login/page.jsx
│   └── admin/
│       ├── layout.jsx          # bảo vệ route (yêu cầu đăng nhập)
│       ├── page.jsx            # Dashboard
│       ├── thuoc/               (+ ?expiring=1 / ?lowstock=1)
│       ├── thuoc-thuong/
│       ├── thuoc-don-dat/ + [id]/
│       ├── danh-muc-thuoc/
│       ├── bac-si/ + [id]/
│       ├── don-thuoc/ + [id]/
│       ├── don-dat-thuoc/ + [id]/
│       ├── phieu-nhap/ + [id]/
│       ├── nha-cung-cap/
│       ├── khach-hang/ + [id]/
│       ├── nhan-vien/
│       ├── tai-khoan/
│       ├── khuyen-mai/
│       ├── danh-gia/
│       ├── hoa-don/
│       └── thanh-toan/
├── components/admin/            # AdminLayout, Sidebar, Header, DataTable,
│                                 # Modal, GenericCrudPage, ThuocForm, ...
├── context/AuthContext.jsx
├── lib/                          # apiClient, constants, format, helpers
└── services/                     # 1 file / entity, dùng chung 1 factory CRUD
```

### Vì sao nhiều trang rất ngắn?
Các trang CRUD đơn giản (danh mục, nhà cung cấp, khuyến mãi, đánh giá, nhân
viên, hóa đơn, thanh toán...) đều dùng chung component
`components/admin/GenericCrudPage.jsx` — chỉ cần khai báo `columns` và
`formFields` là có ngay bảng dữ liệu + tìm kiếm + phân trang + thêm/sửa/xóa
với đầy đủ trạng thái loading/rỗng/lỗi/toast thông báo. Các luồng nghiệp vụ
phức tạp hơn (thuốc, đơn đặt thuốc, phiếu nhập, bác sĩ, khách hàng) được viết
riêng để xử lý đúng luồng trạng thái, bảng liên kết, và các hành động đặc thù
(xác nhận nhập kho, chuyển trạng thái đơn, khóa/mở khóa tài khoản...).

## 6. Những điểm nghiệp vụ đáng chú ý

- **Phân loại thuốc**: dựa đúng vào cột `loai_thuoc` (`THUOC_THUONG` /
  `THUOC_DON`) — không suy đoán qua tên thuốc, đúng theo yêu cầu đề bài.
- **Thuốc thường/đơn đặt** dùng chung 1 danh sách (`thuoc`) và 1 form
  (`ThuocForm`), chỉ khác ở việc khóa cứng `loai_thuoc` khi thêm mới.
- **Mô tả chi tiết thuốc** (thành phần, công dụng, HDSD, bảo quản, cảnh báo)
  lưu ở bảng riêng `mo_ta_thuoc`; **hình ảnh** lưu ở bảng riêng `anh_thuoc` —
  đúng theo 2 controller `mo_ta_thuocController` và `anh_thuocController` đã
  có sẵn. Xem `lib/thuocHelpers.js`.
- **Đơn đặt thuốc**: luồng trạng thái Chờ xác nhận → Đã xác nhận → Đang chuẩn
  bị → Đang giao → Hoàn thành, cộng thêm trạng thái Đã hủy riêng. Mỗi lần đổi
  trạng thái sẽ ghi thêm 1 dòng vào `lich_su_theo_doi_don` để có dòng thời
  gian (timeline) ở trang chi tiết.
- **Phiếu nhập thuốc**: nút "Xác nhận nhập kho" ở trang chi tiết sẽ cộng dồn
  `so_luong` nhập vào tồn kho từng thuốc (`thuoc.so_luong`) và chuyển trạng
  thái phiếu sang "Đã xác nhận" — chỉ nên bấm một lần để tránh cộng trùng.
- **Tài khoản**: hỗ trợ khóa/mở khóa (`trang_thai = KHOA / HOAT_DONG`) và
  chọn vai trò (`vai_tro`: KHACH_HANG / BAC_SI / NHAN_VIEN / ADMIN).

## 7. Trạng thái UI chuẩn hoá

Mọi trang danh sách đều xử lý đủ 4 trạng thái: đang tải (`Loading`), có dữ
liệu (bảng + phân trang), rỗng (`EmptyState`), và lỗi kết nối API
(`ErrorState` kèm nút "Thử lại"). Thông báo thao tác (thêm/sửa/xóa thành
công hoặc lỗi) hiển thị qua toast góc trên bên phải (`components/admin/Toast.jsx`).

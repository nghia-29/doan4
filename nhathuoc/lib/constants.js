// ============================================================================
// GHI CHÚ QUAN TRỌNG VỀ SCHEMA (đọc kỹ trước khi chỉnh sửa)
// ----------------------------------------------------------------------------
// Các controller/model trong thư mục `be` đều dùng "SELECT * FROM ..." nên
// không có khai báo tên cột tường minh. Vì vậy các tên trường (field) dùng
// trong frontend này là quy ước phổ biến cho hệ CSDL "Quản lý nhà thuốc"
// (đồ án Node/Express + MySQL). Nếu CSDL thật của bạn đặt tên cột khác,
// chỉ cần sửa lại các key tương ứng trong từng trang `app/admin/**/page.jsx`
// hoặc trong `lib/constants.js` (đối với các hằng số dùng chung) — toàn bộ
// bảng, form, filter đều lấy dữ liệu qua tên trường khai báo tường minh nên
// việc đổi tên cột chỉ cần sửa 1-2 chỗ trên mỗi trang.
// ============================================================================

// Phân loại thuốc theo cột `thuoc.loai_ke_don` trong schema thực tế.
export const LOAI_THUOC = {
  THUONG: "khong_ke_don",
  DON: "ke_don",
};

export const LOAI_THUOC_LABEL = {
  [LOAI_THUOC.THUONG]: "Thuốc thường",
  [LOAI_THUOC.DON]: "Thuốc đơn đặt",
};

export const LOAI_THUOC_OPTIONS = [
  { value: "", label: "Tất cả loại thuốc" },
  { value: LOAI_THUOC.THUONG, label: "Thuốc thường" },
  { value: LOAI_THUOC.DON, label: "Thuốc đơn đặt" },
];

// Trạng thái tồn kho của thuốc
export const TRANG_THAI_THUOC_OPTIONS = [
  { value: "", label: "Tất cả trạng thái" },
  { value: "CON_HANG", label: "Còn hàng" },
  { value: "SAP_HET", label: "Sắp hết hàng" },
  { value: "HET_HANG", label: "Hết hàng" },
];

export function getTrangThaiThuoc(soLuong) {
  const n = Number(soLuong);
  if (Number.isNaN(n)) return { value: "CON_HANG", label: "Còn hàng", color: "success" };
  if (n <= 0) return { value: "HET_HANG", label: "Hết hàng", color: "danger" };
  if (n <= 20) return { value: "SAP_HET", label: "Sắp hết hàng", color: "warning" };
  return { value: "CON_HANG", label: "Còn hàng", color: "success" };
}

// Luồng trạng thái đơn đặt thuốc
export const DON_DAT_TRANG_THAI = [
  { value: "cho_xac_nhan", label: "Chờ xác nhận", color: "secondary", icon: "bi-hourglass-split" },
  { value: "dang_giao", label: "Đang giao", color: "warning", icon: "bi-truck" },
  { value: "hoan_thanh", label: "Hoàn thành", color: "success", icon: "bi-check-circle-fill" },
  { value: "da_huy", label: "Đã hủy", color: "danger", icon: "bi-x-circle-fill" },
];

export function getDonDatTrangThaiMeta(value) {
  return (
    DON_DAT_TRANG_THAI.find((t) => t.value === value) || {
      value: value || "CHO_XAC_NHAN",
      label: value || "Chờ xác nhận",
      color: "secondary",
      icon: "bi-question-circle",
    }
  );
}

// Trạng thái phiếu nhập
export const PHIEU_NHAP_TRANG_THAI = [
  { value: "tao_moi", label: "Tạo mới", color: "secondary" },
  { value: "cho_duyet", label: "Chờ duyệt", color: "warning" },
  { value: "da_nhap_kho", label: "Đã nhập kho", color: "success" },
  { value: "da_huy", label: "Đã hủy", color: "danger" },
];

export function getPhieuNhapTrangThaiMeta(value) {
  return (
    PHIEU_NHAP_TRANG_THAI.find((t) => t.value === value) || {
      value: value || "CHO_XAC_NHAN",
      label: value || "Chờ xác nhận",
      color: "secondary",
    }
  );
}

// Vai trò tài khoản
export const VAI_TRO_OPTIONS = [
  { value: "khach_hang", label: "Khách hàng" },
  { value: "bac_si", label: "Bác sĩ" },
  { value: "nv_quan_ly", label: "Nhân viên quản lý" },
  { value: "duoc_si", label: "Dược sĩ" },
  { value: "admin", label: "Admin" },
];

export const VAI_TRO_ADMIN = "admin";
export const VAI_TRO_NHAN_VIEN = ["nv_quan_ly", "duoc_si"];

export function isAdminRole(role) {
  return String(role).toLowerCase() === VAI_TRO_ADMIN;
}

export function isStaffRole(role) {
  return VAI_TRO_NHAN_VIEN.includes(String(role).toLowerCase());
}

export function isCustomerRole(role) {
  return String(role).toLowerCase() === "khach_hang";
}

export function getHomeForRole(role) {
  if (isAdminRole(role)) return "/admin";
  if (isStaffRole(role)) return "/nhan-vien";
  return "/khach-hang";
}

export function getVaiTroLabel(value) {
  const found = VAI_TRO_OPTIONS.find(
    (v) => String(v.value).toLowerCase() === String(value).toLowerCase() || v.label === value
  );
  return found ? found.label : value || "—";
}

// Trạng thái tài khoản
export const TRANG_THAI_TAI_KHOAN = {
  HOAT_DONG: 1,
  KHOA: 0,
};

// Danh mục Sidebar
export const MENU_GROUPS = [
  {
    title: "Tổng quan",
    items: [{ href: "/admin", label: "Dashboard", icon: "bi-speedometer2" }],
  },
  {
    title: "Quản lý bán hàng",
    items: [
      { href: "/admin/hoa-don", label: "Hóa đơn", icon: "bi-receipt" },
      { href: "/admin/don-dat-thuoc", label: "Đơn đặt thuốc", icon: "bi-cart-check" },
      { href: "/admin/don-thuoc", label: "Đơn thuốc (kê đơn)", icon: "bi-file-medical" },
      { href: "/admin/thanh-toan", label: "Thanh toán", icon: "bi-credit-card" },
    ],
  },
  {
    title: "Quản lý nhập hàng",
    items: [
      { href: "/admin/phieu-nhap", label: "Phiếu nhập thuốc", icon: "bi-box-arrow-in-down" },
      { href: "/admin/nha-cung-cap", label: "Nhà cung cấp", icon: "bi-truck" },
    ],
  },
  {
    title: "Quản lý người dùng",
    items: [
      { href: "/admin/tai-khoan", label: "Tài khoản", icon: "bi-shield-lock" },
    ],
  },
];

export const STAFF_MENU_GROUPS = [
  {
    title: "Tổng quan",
    items: [{ href: "/nhan-vien", label: "Tổng quan nhân viên", icon: "bi-speedometer2" }],
  },
  {
    title: "Vận hành nhà thuốc",
    items: [
      { href: "/admin/thuoc", label: "Danh sách thuốc", icon: "bi-capsule" },
      { href: "/admin/thuoc-thuong", label: "Thuốc thường", icon: "bi-bag-check" },
      { href: "/admin/thuoc-don-dat", label: "Thuốc kê đơn", icon: "bi-file-earmark-medical" },
      { href: "/admin/danh-muc-thuoc", label: "Danh mục thuốc", icon: "bi-tags" },
      { href: "/admin/nha-cung-cap", label: "Nhà cung cấp", icon: "bi-truck" },
      { href: "/admin/bac-si", label: "Bác sĩ", icon: "bi-person-badge" },
      { href: "/admin/khach-hang", label: "Khách hàng", icon: "bi-people" },
      { href: "/admin/nhan-vien", label: "Nhân viên", icon: "bi-person-workspace" },
    ],
  },
];

export const PAGE_SIZE = 10;

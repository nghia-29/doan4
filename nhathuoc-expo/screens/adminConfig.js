export const ADMIN_ENTITIES = {
  thuoc: {
    title: 'Danh sách thuốc',
    resource: 'thuoc',
    label: 'thuốc',
    searchKeys: ['ten_thuoc', 'ma_sku', 'loai_ke_don'],
    fields: [
      { name: 'ten_thuoc', label: 'Tên thuốc', required: true },
      { name: 'ma_sku', label: 'Mã SKU' },
      { name: 'gia_ban', label: 'Giá bán', keyboardType: 'numeric' },
      { name: 'so_luong_ton', label: 'Số lượng tồn', keyboardType: 'numeric' },
      { name: 'don_vi_tinh', label: 'Đơn vị tính' },
      { name: 'loai_ke_don', label: 'Loại (ke_don/khong_ke_don)' },
      { name: 'id_danh_muc', label: 'ID danh mục', keyboardType: 'numeric' },
      { name: 'id_nha_cung_cap', label: 'ID nhà cung cấp', keyboardType: 'numeric' },
    ],
    columns: ['ten_thuoc', 'gia_ban', 'so_luong_ton', 'loai_ke_don'],
  },
  danh_muc_thuoc: {
    title: 'Danh mục thuốc', resource: 'danh_muc_thuoc', label: 'danh mục',
    searchKeys: ['ten_danh_muc', 'mo_ta'], fields: [{ name: 'ten_danh_muc', label: 'Tên danh mục', required: true }, { name: 'mo_ta', label: 'Mô tả', multiline: true }], columns: ['ten_danh_muc', 'mo_ta'],
  },
  nha_cung_cap: {
    title: 'Nhà cung cấp', resource: 'nha_cung_cap', label: 'nhà cung cấp',
    searchKeys: ['ten_nha_cung_cap', 'so_dien_thoai', 'email'], fields: [{ name: 'ten_nha_cung_cap', label: 'Tên nhà cung cấp', required: true }, { name: 'so_dien_thoai', label: 'Số điện thoại' }, { name: 'email', label: 'Email' }, { name: 'dia_chi', label: 'Địa chỉ', multiline: true }], columns: ['ten_nha_cung_cap', 'so_dien_thoai', 'email'],
  },
  bac_si: {
    title: 'Bác sĩ', resource: 'bac_si', label: 'bác sĩ', searchKeys: ['ho_ten', 'chuyen_khoa', 'so_dien_thoai'],
    fields: [{ name: 'ho_ten', label: 'Họ tên', required: true }, { name: 'chuyen_khoa', label: 'Chuyên khoa' }, { name: 'so_dien_thoai', label: 'Số điện thoại' }, { name: 'email', label: 'Email' }, { name: 'trang_thai', label: 'Trạng thái' }], columns: ['ho_ten', 'chuyen_khoa', 'so_dien_thoai'],
  },
  khach_hang: {
    title: 'Khách hàng', resource: 'khach_hang', label: 'khách hàng', searchKeys: ['ho_ten', 'so_dien_thoai', 'email'],
    fields: [{ name: 'ho_ten', label: 'Họ tên', required: true }, { name: 'so_dien_thoai', label: 'Số điện thoại' }, { name: 'email', label: 'Email' }, { name: 'dia_chi', label: 'Địa chỉ', multiline: true }], columns: ['ho_ten', 'so_dien_thoai', 'email'],
  },
  nhan_vien: {
    title: 'Nhân viên', resource: 'nhan_vien', label: 'nhân viên', searchKeys: ['ho_ten', 'chuc_vu', 'so_dien_thoai'],
    fields: [{ name: 'ho_ten', label: 'Họ tên', required: true }, { name: 'chuc_vu', label: 'Chức vụ' }, { name: 'so_dien_thoai', label: 'Số điện thoại' }, { name: 'email', label: 'Email' }], columns: ['ho_ten', 'chuc_vu', 'so_dien_thoai'],
  },
  tai_khoan: {
    title: 'Tài khoản', resource: 'tai_khoan', label: 'tài khoản', searchKeys: ['ten_dang_nhap', 'email', 'trang_thai'],
    fields: [{ name: 'ten_dang_nhap', label: 'Tên đăng nhập', required: true }, { name: 'mat_khau', label: 'Mật khẩu' }, { name: 'email', label: 'Email' }, { name: 'id_vai_tro', label: 'ID vai trò', keyboardType: 'numeric' }, { name: 'trang_thai', label: 'Trạng thái (1/0)' }], columns: ['ten_dang_nhap', 'email', 'trang_thai'],
  },
  khuyen_mai: {
    title: 'Khuyến mãi', resource: 'khuyen_mai', label: 'khuyến mãi', searchKeys: ['ten_khuyen_mai', 'trang_thai'],
    fields: [{ name: 'ten_khuyen_mai', label: 'Tên khuyến mãi', required: true }, { name: 'phan_tram_giam', label: 'Phần trăm giảm', keyboardType: 'numeric' }, { name: 'ngay_bat_dau', label: 'Ngày bắt đầu' }, { name: 'ngay_ket_thuc', label: 'Ngày kết thúc' }, { name: 'trang_thai', label: 'Trạng thái' }], columns: ['ten_khuyen_mai', 'phan_tram_giam', 'trang_thai'],
  },
  hoa_don: {
    title: 'Hóa đơn', resource: 'hoa_don', label: 'hóa đơn', searchKeys: ['id', 'id_khach_hang', 'tong_tien'],
    fields: [{ name: 'id_khach_hang', label: 'ID khách hàng', keyboardType: 'numeric' }, { name: 'id_nhan_vien', label: 'ID nhân viên', keyboardType: 'numeric' }, { name: 'ngay_lap', label: 'Ngày lập' }, { name: 'tong_tien', label: 'Tổng tiền', keyboardType: 'numeric' }], columns: ['id_khach_hang', 'ngay_lap', 'tong_tien'],
  },
  thanh_toan: {
    title: 'Thanh toán', resource: 'thanh_toan', label: 'thanh toán', searchKeys: ['id_don_dat', 'phuong_thuc', 'trang_thai'],
    fields: [{ name: 'id_don_dat', label: 'ID đơn đặt', keyboardType: 'numeric' }, { name: 'phuong_thuc', label: 'Phương thức' }, { name: 'so_tien', label: 'Số tiền', keyboardType: 'numeric' }, { name: 'trang_thai', label: 'Trạng thái' }], columns: ['id_don_dat', 'phuong_thuc', 'so_tien', 'trang_thai'],
  },
  don_dat_thuoc: {
    title: 'Đơn đặt thuốc', resource: 'don_dat_thuoc', label: 'đơn đặt thuốc', searchKeys: ['id', 'id_khach_hang', 'trang_thai'],
    fields: [{ name: 'id_khach_hang', label: 'ID khách hàng', keyboardType: 'numeric' }, { name: 'ngay_dat', label: 'Ngày đặt' }, { name: 'tong_tien', label: 'Tổng tiền', keyboardType: 'numeric' }, { name: 'trang_thai', label: 'Trạng thái' }], columns: ['id_khach_hang', 'ngay_dat', 'tong_tien', 'trang_thai'],
  },
  phieu_nhap_thuoc: {
    title: 'Phiếu nhập thuốc', resource: 'phieu_nhap_thuoc', label: 'phiếu nhập thuốc', searchKeys: ['id', 'id_nha_cung_cap', 'trang_thai'],
    fields: [{ name: 'id_nha_cung_cap', label: 'ID nhà cung cấp', keyboardType: 'numeric' }, { name: 'id_nhan_vien', label: 'ID nhân viên', keyboardType: 'numeric' }, { name: 'ngay_nhap', label: 'Ngày nhập' }, { name: 'tong_tien', label: 'Tổng tiền', keyboardType: 'numeric' }, { name: 'trang_thai', label: 'Trạng thái' }], columns: ['id_nha_cung_cap', 'ngay_nhap', 'tong_tien', 'trang_thai'],
  },
};

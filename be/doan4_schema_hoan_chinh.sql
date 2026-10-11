-- =========================================================================
-- CSDL BÁN THUỐC TÂY TRỰC TUYẾN - SCHEMA HOÀN CHỈNH v5 (doan4)
-- Thay đổi so với v4 (chức năng YÊU CẦU KÊ ĐƠN):
--   Luồng: Bệnh nhân gửi yêu cầu (VD: bị sốt) -> dược sĩ tiếp nhận ->
--          dược sĩ kê 1 TOA gồm nhiều loại thuốc (hạ sốt, kháng sinh, bù nước...)
--          -> dược sĩ KHÁC duyệt toa -> bệnh nhân đặt mua theo toa.
--   - Thêm bảng yeu_cau_ke_don (triệu chứng, dị ứng, trạng thái xử lý)
--   - don_thuoc thêm cột id_yeu_cau (toa sinh ra từ yêu cầu nào)
--   - Thủ tục: sp_tiep_nhan_yeu_cau, sp_ke_don_tu_yeu_cau, sp_tu_choi_yeu_cau,
--              sp_kiem_duoc_si (chỉ dược sĩ có CCHN mới xử lý được yêu cầu)
--   - Trigger: toa từ yêu cầu phải đúng chủ yêu cầu + đúng dược sĩ đã tiếp nhận;
--              yêu cầu đã xử lý xong không mở lại được
--   - View v_yeu_cau_ke_don, v_yeu_cau_cho_tiep_nhan
--   - Dữ liệu mẫu: bệnh "Sốt" + phác đồ sốt 4 thuốc + 3 yêu cầu mẫu
--
-- Thay đổi của v4 so với v3:
--   - Thêm bảng benh (danh mục bệnh, mã ICD-10)
--   - Thêm bảng phac_do + chi_tiet_phac_do (NHÓM THUỐC điều trị theo bệnh)
--   - don_thuoc thêm: id_benh, id_phac_do, chan_doan
--   - Thủ tục sp_ap_dung_phac_do: đổ cả nhóm thuốc của phác đồ vào toa
--   - Trigger kiểm soát toa: toa phải tạo ở 'cho_duyet', chỉ duyệt được khi
--     có chẩn đoán và từ 2 thuốc trở lên; toa đã duyệt thì khóa danh sách thuốc
--   - View v_toa_con_lai có thêm tên bệnh + chẩn đoán
--
-- Chức năng giữ nguyên:
--   1. Kiểm tra thuốc kê đơn chặt theo thực tế:
--        - đơn hàng phải có toa, toa phải đúng chủ, đã duyệt, còn hiệu lực
--        - thuốc phải nằm trong toa
--        - tổng SL mua (cộng dồn các đơn chưa hủy) <= SL được kê
--   2. Quản lý theo lô (lo_thuoc), xuất kho FEFO (hết hạn trước xuất trước)
--   3. Chỉ trừ kho khi đơn được xác nhận; hủy đơn đã xuất thì hoàn kho đúng lô
--   4. View v_toa_con_lai, v_ton_kho_theo_lo
--   5. Kiểm soát chéo: người kê toa không được tự duyệt toa của mình
--
-- FILE NÀY TỰ ĐỦ: chạy 1 lần, từ đầu đến cuối, trong 1 phiên (có DROP DATABASE).
-- Ảnh: copy thư mục images/ vào frontend/public/images/
-- Mật khẩu dạng chữ thường chỉ để demo, KHÔNG dùng thật.
-- Dữ liệu bệnh / phác đồ / liều dùng chỉ để DEMO, dược sĩ thật cần rà lại.
-- =========================================================================

DROP DATABASE IF EXISTS doan4;
CREATE DATABASE doan4 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE doan4;
SET NAMES utf8mb4;

-- =========================================================================
-- 1. TÀI KHOẢN VÀ PHÂN QUYỀN
-- =========================================================================

CREATE TABLE vai_tro (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ten_vai_tro VARCHAR(50) NOT NULL UNIQUE
    -- khach_hang, nv_quan_ly, duoc_si (kiêm kê đơn), admin
);

CREATE TABLE tai_khoan (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ten_dang_nhap VARCHAR(50) NOT NULL UNIQUE,
    mat_khau VARCHAR(255) NOT NULL,
    id_vai_tro INT NOT NULL,
    trang_thai INT DEFAULT 1 COMMENT '1: Hoạt động, 0: Khóa',
    ngay_tao DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_vai_tro) REFERENCES vai_tro(id)
);

-- =========================================================================
-- 2. NGƯỜI DÙNG (khách hàng, nhân viên gồm cả dược sĩ)
-- =========================================================================

CREATE TABLE khach_hang (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_tai_khoan INT NOT NULL UNIQUE,
    ho_ten VARCHAR(100) NOT NULL,
    so_dien_thoai VARCHAR(15),
    email VARCHAR(100),
    dia_chi TEXT,
    ngay_sinh DATE,
    FOREIGN KEY (id_tai_khoan) REFERENCES tai_khoan(id)
);

CREATE TABLE nhan_vien (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_tai_khoan INT NOT NULL UNIQUE,
    ho_ten VARCHAR(100) NOT NULL,
    so_dien_thoai VARCHAR(15),
    email VARCHAR(100),
    chuyen_khoa VARCHAR(100) NULL COMMENT 'Dùng cho dược sĩ có kê đơn',
    so_chung_chi_hanh_nghe VARCHAR(50) NULL COMMENT 'Chứng chỉ hành nghề của dược sĩ kê đơn',
    -- Vai trò cụ thể (nhân viên kho, dược sĩ, quản lý...) lấy từ tai_khoan.id_vai_tro
    FOREIGN KEY (id_tai_khoan) REFERENCES tai_khoan(id)
);

-- =========================================================================
-- 3. NHÀ CUNG CẤP VÀ DANH MỤC
-- =========================================================================

CREATE TABLE nha_cung_cap (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ten_nha_cung_cap VARCHAR(150) NOT NULL,
    ma_so_thue VARCHAR(20),
    so_dien_thoai VARCHAR(15),
    email VARCHAR(100),
    dia_chi TEXT,
    nguoi_lien_he VARCHAR(100),
    trang_thai INT DEFAULT 1 COMMENT '1: đang hợp tác, 0: ngừng hợp tác'
);

CREATE TABLE danh_muc_thuoc (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ten_danh_muc VARCHAR(100) NOT NULL,
    mo_ta TEXT
);

-- =========================================================================
-- 4. THUỐC (bảng lõi, gọn) + MÔ TẢ CHI TIẾT (bảng mở rộng 1-1) + ẢNH
-- =========================================================================

CREATE TABLE thuoc (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ma_sku VARCHAR(50) UNIQUE COMMENT 'Mã sản phẩm nội bộ để tra cứu/quét mã',
    ten_thuoc VARCHAR(150) NOT NULL,
    id_danh_muc INT NOT NULL,
    id_nha_cung_cap INT NOT NULL,
    loai_ke_don ENUM('khong_ke_don','ke_don') NOT NULL DEFAULT 'khong_ke_don'
        COMMENT 'khong_ke_don: OTC - bán tự do | ke_don: bắt buộc có toa',
    so_dang_ky VARCHAR(50) COMMENT 'Số đăng ký lưu hành do Bộ Y tế cấp',
    don_vi_tinh VARCHAR(20),
    gia_ban DECIMAL(15,2) NOT NULL,
    so_luong_ton INT DEFAULT 0
        COMMENT 'CỘT TỔNG HỢP = tổng lo_thuoc.so_luong_ton, do trigger tự cập nhật, KHÔNG sửa tay',
    han_su_dung DATE
        COMMENT 'CỘT TỔNG HỢP = HSD sớm nhất của các lô còn hàng, do trigger tự cập nhật',
    trang_thai INT DEFAULT 1 COMMENT '1: đang bán, 0: ngừng bán',
    ngay_tao DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_danh_muc) REFERENCES danh_muc_thuoc(id),
    FOREIGN KEY (id_nha_cung_cap) REFERENCES nha_cung_cap(id),
    INDEX idx_thuoc_ten (ten_thuoc),
    INDEX idx_thuoc_loai_ke_don (loai_ke_don)
);

-- Mô tả/thông tin chi tiết của thuốc, tách riêng để bảng thuoc gọn,
-- truy vấn danh sách/tìm kiếm nhanh hơn (chỉ join khi xem trang chi tiết)
CREATE TABLE mo_ta_thuoc (
    id_thuoc INT PRIMARY KEY,
    thuong_hieu VARCHAR(150),
    dang_bao_che VARCHAR(100) COMMENT 'Viên nén, viên nang, siro, ống tiêm...',
    quy_cach_dong_goi VARCHAR(100) COMMENT 'VD: Hộp 10 vỉ x 10 viên',
    ham_luong VARCHAR(100) COMMENT 'VD: 500mg',
    thanh_phan TEXT,
    cong_dung TEXT,
    doi_tuong_su_dung TEXT,
    huong_dan_su_dung TEXT,
    lieu_dung_khuyen_cao TEXT COMMENT 'Chỉ áp dụng rõ ràng cho thuốc không kê đơn',
    bao_quan TEXT,
    canh_bao TEXT COMMENT 'Chống chỉ định, tác dụng phụ, thận trọng',
    FOREIGN KEY (id_thuoc) REFERENCES thuoc(id) ON DELETE CASCADE
);

CREATE TABLE anh_thuoc (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_thuoc INT NOT NULL,
    duong_dan_anh VARCHAR(255) NOT NULL,
    la_anh_chinh TINYINT(1) DEFAULT 0,
    thu_tu INT DEFAULT 0,
    FOREIGN KEY (id_thuoc) REFERENCES thuoc(id) ON DELETE CASCADE
);

-- =========================================================================
-- 5. GIỎ HÀNG
-- =========================================================================

CREATE TABLE gio_hang (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_khach_hang INT NOT NULL,
    id_thuoc INT NOT NULL,
    so_luong INT NOT NULL DEFAULT 1,
    ngay_them DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_gio_hang (id_khach_hang, id_thuoc),
    FOREIGN KEY (id_khach_hang) REFERENCES khach_hang(id),
    FOREIGN KEY (id_thuoc) REFERENCES thuoc(id)
);

-- =========================================================================
-- 5b. BỆNH VÀ PHÁC ĐỒ (NHÓM THUỐC ĐIỀU TRỊ THEO BỆNH)
-- =========================================================================

CREATE TABLE benh (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ma_icd VARCHAR(10) NULL UNIQUE COMMENT 'Mã ICD-10, VD: J02',
    ten_benh VARCHAR(150) NOT NULL,
    mo_ta TEXT NULL
);

-- Phác đồ = nhóm thuốc mẫu cho 1 bệnh (1 bệnh có thể có nhiều phác đồ)
CREATE TABLE phac_do (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_benh INT NOT NULL,
    ten_phac_do VARCHAR(150) NOT NULL,
    mo_ta TEXT NULL,
    trang_thai INT DEFAULT 1 COMMENT '1: đang dùng, 0: ngừng',
    FOREIGN KEY (id_benh) REFERENCES benh(id)
);

CREATE TABLE chi_tiet_phac_do (
    id_phac_do INT NOT NULL,
    id_thuoc INT NOT NULL,
    so_luong_goi_y INT NOT NULL DEFAULT 1,
    lieu_dung TEXT NULL,
    so_ngay_dung INT NULL,
    PRIMARY KEY (id_phac_do, id_thuoc),
    FOREIGN KEY (id_phac_do) REFERENCES phac_do(id) ON DELETE CASCADE,
    FOREIGN KEY (id_thuoc) REFERENCES thuoc(id)
);

-- =========================================================================
-- 5c. YÊU CẦU KÊ ĐƠN (bệnh nhân mô tả bệnh, dược sĩ tiếp nhận và kê toa)
-- =========================================================================

CREATE TABLE yeu_cau_ke_don (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_khach_hang INT NOT NULL,
    ten_benh_khai VARCHAR(150) NOT NULL COMMENT 'Bệnh/triệu chứng chính khách tự khai, VD: Sốt',
    trieu_chung TEXT NOT NULL COMMENT 'Mô tả chi tiết: nhiệt độ, các triệu chứng kèm theo...',
    thoi_gian_bi_benh VARCHAR(100) NULL COMMENT 'VD: 2 ngày',
    di_ung_thuoc TEXT NULL COMMENT 'Thuốc/thành phần khách từng dị ứng',
    benh_nen_thuoc_dang_dung TEXT NULL COMMENT 'Bệnh nền, thuốc đang dùng, có thai/cho con bú...',
    trang_thai VARCHAR(30) NOT NULL DEFAULT 'cho_tiep_nhan'
        COMMENT 'cho_tiep_nhan, da_tiep_nhan, da_ke_don, tu_choi, da_huy',
    id_nhan_vien_tiep_nhan INT NULL COMMENT 'Dược sĩ tiếp nhận (cũng là người kê toa)',
    ngay_tiep_nhan DATETIME NULL,
    ly_do_tu_choi TEXT NULL COMMENT 'VD: cần đi khám trực tiếp',
    ngay_tao DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_khach_hang) REFERENCES khach_hang(id),
    FOREIGN KEY (id_nhan_vien_tiep_nhan) REFERENCES nhan_vien(id),
    INDEX idx_yc_trang_thai (trang_thai)
);

-- =========================================================================
-- 6. ĐƠN THUỐC (TOA THUỐC) - bắt buộc với thuốc kê đơn
-- =========================================================================

CREATE TABLE don_thuoc (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_khach_hang INT NOT NULL,
    id_nhan_vien_ke_don INT NULL COMMENT 'Dược sĩ kê đơn; NULL nếu KH tự upload ảnh toa từ bên ngoài',
    id_yeu_cau INT NULL COMMENT 'Yêu cầu kê đơn sinh ra toa này; NULL nếu toa do KH upload từ bên ngoài',
    id_benh INT NULL COMMENT 'Bệnh chính được chẩn đoán',
    id_phac_do INT NULL COMMENT 'Phác đồ (nhóm thuốc) đã áp dụng, NULL nếu kê tay',
    chan_doan TEXT NULL COMMENT 'Chẩn đoán chi tiết (có thể kèm bệnh phụ)',
    hinh_anh_don_thuoc VARCHAR(255) NULL COMMENT 'Đường dẫn ảnh chụp toa thuốc',
    ngay_ke_don DATE NOT NULL,
    so_ngay_hieu_luc INT NOT NULL DEFAULT 5
        COMMENT 'Số ngày kể từ ngày kê mà toa còn được dùng để mua thuốc (toa bệnh mạn tính có thể đặt dài hơn). Hãy đối chiếu quy định hiện hành',
    trang_thai VARCHAR(30) NOT NULL DEFAULT 'cho_duyet' COMMENT 'cho_duyet, da_duyet, tu_choi',
    id_nhan_vien_duyet INT NULL COMMENT 'Dược sĩ thực hiện duyệt đơn',
    ngay_duyet DATETIME NULL,
    ghi_chu_duyet TEXT NULL,
    ngay_tao DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_khach_hang) REFERENCES khach_hang(id),
    FOREIGN KEY (id_nhan_vien_ke_don) REFERENCES nhan_vien(id),
    FOREIGN KEY (id_nhan_vien_duyet) REFERENCES nhan_vien(id),
    FOREIGN KEY (id_benh) REFERENCES benh(id),
    FOREIGN KEY (id_phac_do) REFERENCES phac_do(id),
    FOREIGN KEY (id_yeu_cau) REFERENCES yeu_cau_ke_don(id)
);

CREATE TABLE chi_tiet_don_thuoc (
    id_don_thuoc INT NOT NULL,
    id_thuoc INT NOT NULL,
    so_luong_ke INT NOT NULL,
    lieu_dung TEXT NULL COMMENT 'VD: Ngày uống 2 lần, mỗi lần 1 viên sau ăn',
    so_ngay_dung INT NULL,
    PRIMARY KEY (id_don_thuoc, id_thuoc),
    FOREIGN KEY (id_don_thuoc) REFERENCES don_thuoc(id),
    FOREIGN KEY (id_thuoc) REFERENCES thuoc(id)
);

-- =========================================================================
-- 7. KHUYẾN MÃI
-- =========================================================================

CREATE TABLE khuyen_mai (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ma_code VARCHAR(50) NOT NULL UNIQUE,
    mo_ta VARCHAR(255),
    loai_giam ENUM('phan_tram','tien_mat') NOT NULL,
    gia_tri_giam DECIMAL(15,2) NOT NULL,
    don_toi_thieu DECIMAL(15,2) DEFAULT 0,
    ngay_bat_dau DATETIME NOT NULL,
    ngay_ket_thuc DATETIME NOT NULL,
    so_luong_toi_da INT NULL COMMENT 'NULL = không giới hạn lượt dùng',
    so_luong_da_dung INT DEFAULT 0,
    trang_thai INT DEFAULT 1
);

-- =========================================================================
-- 8. ĐẶT THUỐC, THEO DÕI, THANH TOÁN, HÓA ĐƠN
-- =========================================================================

CREATE TABLE don_dat_thuoc (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_khach_hang INT NOT NULL,
    id_don_thuoc INT NULL COMMENT 'Bắt buộc nếu đơn hàng chứa thuốc kê đơn; toa phải da_duyet, đúng chủ, còn hiệu lực',
    id_khuyen_mai INT NULL,
    ngay_dat DATETIME DEFAULT CURRENT_TIMESTAMP,
    tong_tien DECIMAL(15,2) NOT NULL COMMENT 'Tổng tiền hàng trước giảm giá',
    giam_gia DECIMAL(15,2) DEFAULT 0,
    thanh_tien DECIMAL(15,2) NOT NULL COMMENT 'tong_tien - giam_gia',
    dia_chi_giao_hang TEXT NOT NULL,
    so_dien_thoai_nhan VARCHAR(15),
    trang_thai VARCHAR(50) DEFAULT 'cho_xac_nhan'
        COMMENT 'cho_xac_nhan, da_xac_nhan, dang_chuan_bi, dang_giao, hoan_thanh, da_huy',
    da_xuat_kho TINYINT(1) NOT NULL DEFAULT 0
        COMMENT '1: đã trừ kho (do trigger khi đơn được xác nhận), 0: chưa trừ. KHÔNG sửa tay',
    FOREIGN KEY (id_khach_hang) REFERENCES khach_hang(id),
    FOREIGN KEY (id_don_thuoc) REFERENCES don_thuoc(id),
    FOREIGN KEY (id_khuyen_mai) REFERENCES khuyen_mai(id),
    INDEX idx_don_dat_trang_thai (trang_thai)
);

CREATE TABLE chi_tiet_don_dat (
    id_don_dat INT NOT NULL,
    id_thuoc INT NOT NULL,
    so_luong INT NOT NULL,
    don_gia DECIMAL(15,2) NOT NULL,
    PRIMARY KEY (id_don_dat, id_thuoc),
    FOREIGN KEY (id_don_dat) REFERENCES don_dat_thuoc(id),
    FOREIGN KEY (id_thuoc) REFERENCES thuoc(id)
);

CREATE TABLE lich_su_theo_doi_don (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_don_dat INT NOT NULL,
    trang_thai_cap_nhat VARCHAR(50) NOT NULL,
    thoi_gian_cap_nhat DATETIME DEFAULT CURRENT_TIMESTAMP,
    ghi_chu TEXT,
    FOREIGN KEY (id_don_dat) REFERENCES don_dat_thuoc(id)
);

CREATE TABLE thanh_toan (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_don_dat INT NOT NULL,
    phuong_thuc VARCHAR(30) NOT NULL COMMENT 'COD, chuyen_khoan, vi_dien_tu',
    ma_giao_dich VARCHAR(100) NULL COMMENT 'Mã GD từ cổng thanh toán, NULL nếu COD',
    so_tien DECIMAL(15,2) NOT NULL,
    trang_thai VARCHAR(30) DEFAULT 'cho_thanh_toan'
        COMMENT 'cho_thanh_toan, da_thanh_toan, that_bai, da_hoan_tien',
    thoi_gian_thanh_toan DATETIME NULL,
    FOREIGN KEY (id_don_dat) REFERENCES don_dat_thuoc(id)
);

CREATE TABLE hoa_don (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_don_dat INT NOT NULL UNIQUE,
    so_hoa_don VARCHAR(50) NOT NULL UNIQUE,
    ngay_xuat DATETIME DEFAULT CURRENT_TIMESTAMP,
    tong_tien_truoc_thue DECIMAL(15,2) NOT NULL,
    thue_vat DECIMAL(15,2) DEFAULT 0,
    tong_tien_sau_thue DECIMAL(15,2) NOT NULL,
    FOREIGN KEY (id_don_dat) REFERENCES don_dat_thuoc(id)
);

-- =========================================================================
-- 9. ĐÁNH GIÁ
-- =========================================================================

CREATE TABLE danh_gia (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_khach_hang INT NOT NULL,
    id_thuoc INT NOT NULL,
    so_sao INT CHECK (so_sao BETWEEN 1 AND 5),
    noi_dung TEXT,
    ngay_danh_gia DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_khach_hang) REFERENCES khach_hang(id),
    FOREIGN KEY (id_thuoc) REFERENCES thuoc(id)
);

-- =========================================================================
-- 10. NHẬP KHO, LÔ THUỐC, XUẤT KHO THEO LÔ
-- =========================================================================

CREATE TABLE phieu_nhap_thuoc (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_nhan_vien INT NOT NULL,
    id_nha_cung_cap INT NOT NULL,
    ngay_nhap DATETIME DEFAULT CURRENT_TIMESTAMP,
    tong_tien DECIMAL(15,2) DEFAULT 0,
    ghi_chu TEXT,
    FOREIGN KEY (id_nhan_vien) REFERENCES nhan_vien(id),
    FOREIGN KEY (id_nha_cung_cap) REFERENCES nha_cung_cap(id)
);

CREATE TABLE chi_tiet_phieu_nhap (
    id_phieu_nhap INT NOT NULL,
    id_thuoc INT NOT NULL,
    so_luong INT NOT NULL,
    gia_nhap DECIMAL(15,2) NOT NULL,
    so_lo VARCHAR(50) COMMENT 'Số lô sản xuất',
    han_su_dung DATE NOT NULL COMMENT 'Hạn dùng riêng của lô này',
    PRIMARY KEY (id_phieu_nhap, id_thuoc),
    FOREIGN KEY (id_phieu_nhap) REFERENCES phieu_nhap_thuoc(id),
    FOREIGN KEY (id_thuoc) REFERENCES thuoc(id)
);

CREATE TABLE lich_su_trang_thai_nhap (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_phieu_nhap INT NOT NULL,
    trang_thai VARCHAR(50) NOT NULL COMMENT 'tao_moi, cho_duyet, da_nhap_kho, da_huy',
    thoi_gian_cap_nhat DATETIME DEFAULT CURRENT_TIMESTAMP,
    nguoi_cap_nhat INT NOT NULL,
    ghi_chu TEXT,
    FOREIGN KEY (id_phieu_nhap) REFERENCES phieu_nhap_thuoc(id)
);

-- Tồn kho thực tế theo từng lô (nguồn sự thật của tồn kho)
CREATE TABLE lo_thuoc (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_thuoc INT NOT NULL,
    so_lo VARCHAR(50) NOT NULL,
    han_su_dung DATE NULL COMMENT 'NULL với dụng cụ y tế không có HSD',
    so_luong_ton INT NOT NULL DEFAULT 0,
    gia_nhap DECIMAL(15,2) NULL,
    id_phieu_nhap INT NULL COMMENT 'NULL với lô tồn đầu kỳ',
    ngay_tao DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_lo (id_thuoc, so_lo),
    INDEX idx_lo_fefo (id_thuoc, han_su_dung),
    CONSTRAINT chk_lo_ton CHECK (so_luong_ton >= 0),
    FOREIGN KEY (id_thuoc) REFERENCES thuoc(id),
    FOREIGN KEY (id_phieu_nhap) REFERENCES phieu_nhap_thuoc(id)
);

-- Mỗi đơn hàng đã lấy hàng từ lô nào (truy vết + hoàn kho đúng lô)
CREATE TABLE chi_tiet_xuat_lo (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_don_dat INT NOT NULL,
    id_thuoc INT NOT NULL,
    id_lo INT NOT NULL,
    so_luong INT NOT NULL,
    FOREIGN KEY (id_don_dat) REFERENCES don_dat_thuoc(id),
    FOREIGN KEY (id_thuoc) REFERENCES thuoc(id),
    FOREIGN KEY (id_lo) REFERENCES lo_thuoc(id),
    INDEX idx_xuat_don (id_don_dat)
);

-- =========================================================================
-- 11. THỦ TỤC + TRIGGER - LOGIC NGHIỆP VỤ
-- =========================================================================

DELIMITER $$

-- 11.1 Đồng bộ thuoc.so_luong_ton và thuoc.han_su_dung từ các lô
CREATE PROCEDURE sp_dong_bo_ton_thuoc(IN p_id_thuoc INT)
BEGIN
    UPDATE thuoc
    SET so_luong_ton = (SELECT COALESCE(SUM(so_luong_ton), 0)
                        FROM lo_thuoc WHERE id_thuoc = p_id_thuoc),
        han_su_dung  = COALESCE((SELECT MIN(han_su_dung) FROM lo_thuoc
                                 WHERE id_thuoc = p_id_thuoc AND so_luong_ton > 0),
                                han_su_dung)
    WHERE id = p_id_thuoc;
END$$

-- 11.2 Kiểm tra 1 dòng chi tiết đơn đặt (dùng cho INSERT và UPDATE)
CREATE PROCEDURE sp_kiem_tra_dong_don_dat(
    IN p_id_don_dat INT, IN p_id_thuoc INT, IN p_so_luong INT)
BEGIN
    DECLARE v_loai VARCHAR(20);
    DECLARE v_ten VARCHAR(150);
    DECLARE v_dang_ban INT;
    DECLARE v_ton INT;
    DECLARE v_id_kh INT;
    DECLARE v_id_toa INT;
    DECLARE v_ngay_dat DATETIME;
    DECLARE v_toa_kh INT;
    DECLARE v_toa_tt VARCHAR(30);
    DECLARE v_toa_ngay DATE;
    DECLARE v_toa_hl INT;
    DECLARE v_so_ke INT;
    DECLARE v_da_mua INT;
    DECLARE v_msg VARCHAR(255);

    IF p_so_luong IS NULL OR p_so_luong <= 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Số lượng phải lớn hơn 0';
    END IF;

    SELECT loai_ke_don, ten_thuoc, trang_thai, so_luong_ton
      INTO v_loai, v_ten, v_dang_ban, v_ton
      FROM thuoc WHERE id = p_id_thuoc;

    IF v_ten IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Thuốc không tồn tại';
    END IF;
    IF v_dang_ban <> 1 THEN
        SET v_msg = CONCAT('Thuốc "', v_ten, '" đã ngừng bán');
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = v_msg;
    END IF;
    -- Kiểm tra mềm: chưa giữ hàng khi đặt, bước xuất kho sẽ kiểm tra lại
    IF p_so_luong > v_ton THEN
        SET v_msg = CONCAT('Không đủ tồn kho cho "', v_ten, '" (còn ', v_ton, ')');
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = v_msg;
    END IF;

    IF v_loai = 'ke_don' THEN
        SELECT id_khach_hang, id_don_thuoc, ngay_dat
          INTO v_id_kh, v_id_toa, v_ngay_dat
          FROM don_dat_thuoc WHERE id = p_id_don_dat;

        IF v_id_toa IS NULL THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Đơn hàng chứa thuốc kê đơn nhưng chưa có đơn thuốc kèm theo';
        END IF;

        -- FOR UPDATE: khóa dòng toa để 2 đơn đặt cùng lúc không cùng vượt SL kê
        SELECT id_khach_hang, trang_thai, ngay_ke_don, so_ngay_hieu_luc
          INTO v_toa_kh, v_toa_tt, v_toa_ngay, v_toa_hl
          FROM don_thuoc WHERE id = v_id_toa FOR UPDATE;

        IF v_toa_kh <> v_id_kh THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Đơn thuốc này không thuộc về khách hàng đặt đơn';
        END IF;
        IF v_toa_tt <> 'da_duyet' THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Đơn thuốc kèm theo chưa được dược sĩ duyệt';
        END IF;
        IF DATE(v_ngay_dat) > DATE_ADD(v_toa_ngay, INTERVAL v_toa_hl DAY) THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Đơn thuốc đã hết thời hạn hiệu lực';
        END IF;

        SELECT so_luong_ke INTO v_so_ke
          FROM chi_tiet_don_thuoc
         WHERE id_don_thuoc = v_id_toa AND id_thuoc = p_id_thuoc;

        IF v_so_ke IS NULL THEN
            SET v_msg = CONCAT('Thuốc "', v_ten, '" không nằm trong đơn thuốc');
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = v_msg;
        END IF;

        -- Tổng đã mua theo toa này ở các đơn chưa hủy (trừ chính dòng đang xét)
        SELECT COALESCE(SUM(ct.so_luong), 0) INTO v_da_mua
          FROM chi_tiet_don_dat ct
          JOIN don_dat_thuoc d ON d.id = ct.id_don_dat
         WHERE d.id_don_thuoc = v_id_toa
           AND ct.id_thuoc = p_id_thuoc
           AND d.trang_thai <> 'da_huy'
           AND NOT (ct.id_don_dat = p_id_don_dat AND ct.id_thuoc = p_id_thuoc);

        IF v_da_mua + p_so_luong > v_so_ke THEN
            SET v_msg = CONCAT('Vượt số lượng được kê cho "', v_ten, '": kê ',
                               v_so_ke, ', đã mua ', v_da_mua, ', đang đặt ', p_so_luong);
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = v_msg;
        END IF;
    END IF;
END$$

-- 11.3 Xuất kho theo FEFO cho 1 đơn hàng (lô hết hạn trước, bỏ qua lô đã quá hạn)
CREATE PROCEDURE sp_xuat_kho_don(IN p_id_don_dat INT)
BEGIN
    DECLARE v_done INT DEFAULT 0;
    DECLARE v_thuoc INT;
    DECLARE v_sl INT;
    DECLARE v_con INT;
    DECLARE v_lo INT;
    DECLARE v_lo_ton INT;
    DECLARE v_lay INT;
    DECLARE v_msg VARCHAR(255);
    DECLARE cur CURSOR FOR
        SELECT id_thuoc, so_luong FROM chi_tiet_don_dat WHERE id_don_dat = p_id_don_dat;
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = 1;

    OPEN cur;
    doc_dong: LOOP
        FETCH cur INTO v_thuoc, v_sl;
        IF v_done = 1 THEN LEAVE doc_dong; END IF;

        SET v_con = v_sl;
        WHILE v_con > 0 DO
            SET v_lo = NULL;
            SELECT id, so_luong_ton INTO v_lo, v_lo_ton
              FROM lo_thuoc
             WHERE id_thuoc = v_thuoc
               AND so_luong_ton > 0
               AND (han_su_dung IS NULL OR han_su_dung >= CURDATE())
             ORDER BY (han_su_dung IS NULL), han_su_dung, id
             LIMIT 1 FOR UPDATE;

            IF v_lo IS NULL THEN
                SET v_msg = CONCAT('Không đủ hàng còn hạn để xuất kho (thuốc id ', v_thuoc, ')');
                SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = v_msg;
            END IF;

            SET v_lay = LEAST(v_con, v_lo_ton);
            UPDATE lo_thuoc SET so_luong_ton = so_luong_ton - v_lay WHERE id = v_lo;
            INSERT INTO chi_tiet_xuat_lo (id_don_dat, id_thuoc, id_lo, so_luong)
            VALUES (p_id_don_dat, v_thuoc, v_lo, v_lay);
            SET v_con = v_con - v_lay;
        END WHILE;
    END LOOP;
    CLOSE cur;
END$$

-- 11.4 Hoàn kho đúng lô khi hủy đơn đã xuất kho
CREATE PROCEDURE sp_hoan_kho_don(IN p_id_don_dat INT)
BEGIN
    UPDATE lo_thuoc l
    JOIN (SELECT id_lo, SUM(so_luong) AS sl
            FROM chi_tiet_xuat_lo WHERE id_don_dat = p_id_don_dat
           GROUP BY id_lo) x ON x.id_lo = l.id
    SET l.so_luong_ton = l.so_luong_ton + x.sl;

    DELETE FROM chi_tiet_xuat_lo WHERE id_don_dat = p_id_don_dat;
END$$

-- 11.5 Kiểm tra khi thêm dòng chi tiết đơn đặt
CREATE TRIGGER trg_ctdd_before_insert
BEFORE INSERT ON chi_tiet_don_dat
FOR EACH ROW
BEGIN
    CALL sp_kiem_tra_dong_don_dat(NEW.id_don_dat, NEW.id_thuoc, NEW.so_luong);
END$$

-- 11.6 Kiểm tra khi sửa số lượng / đổi thuốc (chặn lách luật bằng UPDATE)
CREATE TRIGGER trg_ctdd_before_update
BEFORE UPDATE ON chi_tiet_don_dat
FOR EACH ROW
BEGIN
    IF NEW.so_luong <> OLD.so_luong OR NEW.id_thuoc <> OLD.id_thuoc THEN
        CALL sp_kiem_tra_dong_don_dat(NEW.id_don_dat, NEW.id_thuoc, NEW.so_luong);
    END IF;
END$$

-- 11.7 Xuất kho khi xác nhận đơn, hoàn kho khi hủy đơn đã xuất
CREATE TRIGGER trg_don_dat_doi_trang_thai
BEFORE UPDATE ON don_dat_thuoc
FOR EACH ROW
BEGIN
    IF OLD.trang_thai = 'da_huy' AND NEW.trang_thai <> 'da_huy' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Đơn đã hủy không thể mở lại, hãy tạo đơn mới';
    END IF;

    -- Xác nhận (hoặc nhảy cóc sang các bước sau) mà chưa xuất kho => xuất kho
    IF OLD.da_xuat_kho = 0
       AND NEW.trang_thai IN ('da_xac_nhan', 'dang_chuan_bi', 'dang_giao', 'hoan_thanh') THEN
        CALL sp_xuat_kho_don(NEW.id);
        SET NEW.da_xuat_kho = 1;
    END IF;

    -- Hủy đơn đã xuất kho => hoàn kho đúng lô (hủy khi chưa xuất thì không cần hoàn)
    IF NEW.trang_thai = 'da_huy' AND OLD.trang_thai <> 'da_huy' AND OLD.da_xuat_kho = 1 THEN
        CALL sp_hoan_kho_don(NEW.id);
        SET NEW.da_xuat_kho = 0;
    END IF;
END$$

-- 11.8 Nhập hàng => tạo / cộng dồn lô
CREATE TRIGGER trg_nhap_kho_tao_lo
AFTER INSERT ON chi_tiet_phieu_nhap
FOR EACH ROW
BEGIN
    INSERT INTO lo_thuoc (id_thuoc, so_lo, han_su_dung, so_luong_ton, gia_nhap, id_phieu_nhap)
    VALUES (NEW.id_thuoc,
            COALESCE(NEW.so_lo, CONCAT('PN', NEW.id_phieu_nhap)),
            NEW.han_su_dung, NEW.so_luong, NEW.gia_nhap, NEW.id_phieu_nhap)
    ON DUPLICATE KEY UPDATE so_luong_ton = so_luong_ton + VALUES(so_luong_ton);
END$$

-- 11.9 Mọi thay đổi ở lô => đồng bộ cột tổng hợp ở bảng thuoc
CREATE TRIGGER trg_lo_after_insert AFTER INSERT ON lo_thuoc
FOR EACH ROW
BEGIN
    CALL sp_dong_bo_ton_thuoc(NEW.id_thuoc);
END$$

CREATE TRIGGER trg_lo_after_update AFTER UPDATE ON lo_thuoc
FOR EACH ROW
BEGIN
    CALL sp_dong_bo_ton_thuoc(NEW.id_thuoc);
END$$

CREATE TRIGGER trg_lo_after_delete AFTER DELETE ON lo_thuoc
FOR EACH ROW
BEGIN
    CALL sp_dong_bo_ton_thuoc(OLD.id_thuoc);
END$$

-- 11.10 Kiểm soát toa thuốc
-- Toa phải tạo ở 'cho_duyet' -> thêm thuốc -> mới được duyệt
CREATE TRIGGER trg_don_thuoc_before_insert
BEFORE INSERT ON don_thuoc
FOR EACH ROW
BEGIN
    DECLARE v_yc_kh INT;
    DECLARE v_yc_nv INT;
    DECLARE v_yc_tt VARCHAR(30);

    -- Toa sinh từ yêu cầu: đúng chủ yêu cầu, đúng dược sĩ đã tiếp nhận
    IF NEW.id_yeu_cau IS NOT NULL THEN
        SELECT id_khach_hang, id_nhan_vien_tiep_nhan, trang_thai
          INTO v_yc_kh, v_yc_nv, v_yc_tt
          FROM yeu_cau_ke_don WHERE id = NEW.id_yeu_cau;
        IF v_yc_tt IS NULL THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Yêu cầu kê đơn không tồn tại';
        END IF;
        IF v_yc_tt <> 'da_tiep_nhan' THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Yêu cầu kê đơn phải ở trạng thái da_tiep_nhan mới kê toa được';
        END IF;
        IF v_yc_kh <> NEW.id_khach_hang THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Toa không cùng khách hàng với yêu cầu kê đơn';
        END IF;
        IF NEW.id_nhan_vien_ke_don IS NULL OR NEW.id_nhan_vien_ke_don <> v_yc_nv THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Chỉ dược sĩ đã tiếp nhận yêu cầu mới được kê toa';
        END IF;
    END IF;

    IF NEW.id_nhan_vien_ke_don IS NOT NULL
       AND NEW.id_nhan_vien_duyet IS NOT NULL
       AND NEW.id_nhan_vien_ke_don = NEW.id_nhan_vien_duyet THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Người kê đơn không được tự duyệt đơn thuốc của mình';
    END IF;
    IF NEW.trang_thai = 'da_duyet' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Toa phải tạo ở trạng thái cho_duyet, thêm thuốc rồi mới duyệt';
    END IF;
END$$

CREATE TRIGGER trg_don_thuoc_before_update
BEFORE UPDATE ON don_thuoc
FOR EACH ROW
BEGIN
    DECLARE v_so_thuoc INT;

    IF NEW.id_nhan_vien_ke_don IS NOT NULL
       AND NEW.id_nhan_vien_duyet IS NOT NULL
       AND NEW.id_nhan_vien_ke_don = NEW.id_nhan_vien_duyet THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Người kê đơn không được tự duyệt đơn thuốc của mình';
    END IF;

    IF NEW.trang_thai = 'da_duyet' AND OLD.trang_thai <> 'da_duyet' THEN
        IF NEW.id_benh IS NULL AND (NEW.chan_doan IS NULL OR NEW.chan_doan = '') THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Toa chưa có chẩn đoán/bệnh, không thể duyệt';
        END IF;

        SELECT COUNT(*) INTO v_so_thuoc
          FROM chi_tiet_don_thuoc WHERE id_don_thuoc = NEW.id;

        -- Muốn cho phép toa 1 thuốc thì đổi số 2 thành 1
        IF v_so_thuoc < 2 THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Toa phải có từ 2 loại thuốc trở lên (nhóm thuốc điều trị)';
        END IF;
    END IF;
END$$

-- Toa đã duyệt thì khóa danh sách thuốc (tránh sửa SL kê sau khi duyệt)
CREATE TRIGGER trg_ctdt_before_insert
BEFORE INSERT ON chi_tiet_don_thuoc
FOR EACH ROW
BEGIN
    DECLARE v_tt VARCHAR(30);
    SELECT trang_thai INTO v_tt FROM don_thuoc WHERE id = NEW.id_don_thuoc;
    IF v_tt = 'da_duyet' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Toa đã duyệt, không thể thêm thuốc vào toa';
    END IF;
END$$

CREATE TRIGGER trg_ctdt_before_update
BEFORE UPDATE ON chi_tiet_don_thuoc
FOR EACH ROW
BEGIN
    DECLARE v_tt VARCHAR(30);
    SELECT trang_thai INTO v_tt FROM don_thuoc WHERE id = OLD.id_don_thuoc;
    IF v_tt = 'da_duyet' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Toa đã duyệt, không thể sửa thuốc trong toa';
    END IF;
END$$

CREATE TRIGGER trg_ctdt_before_delete
BEFORE DELETE ON chi_tiet_don_thuoc
FOR EACH ROW
BEGIN
    DECLARE v_tt VARCHAR(30);
    SELECT trang_thai INTO v_tt FROM don_thuoc WHERE id = OLD.id_don_thuoc;
    IF v_tt = 'da_duyet' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Toa đã duyệt, không thể xóa thuốc khỏi toa';
    END IF;
END$$

-- 11.11 Áp dụng phác đồ: copy cả nhóm thuốc của phác đồ vào toa
CREATE PROCEDURE sp_ap_dung_phac_do(IN p_id_don_thuoc INT, IN p_id_phac_do INT)
BEGIN
    DECLARE v_benh INT;

    SELECT id_benh INTO v_benh FROM phac_do
     WHERE id = p_id_phac_do AND trang_thai = 1;
    IF v_benh IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Phác đồ không tồn tại hoặc đã ngừng dùng';
    END IF;

    INSERT INTO chi_tiet_don_thuoc (id_don_thuoc, id_thuoc, so_luong_ke, lieu_dung, so_ngay_dung)
    SELECT p_id_don_thuoc, id_thuoc, so_luong_goi_y, lieu_dung, so_ngay_dung
      FROM chi_tiet_phac_do WHERE id_phac_do = p_id_phac_do
    ON DUPLICATE KEY UPDATE so_luong_ke = VALUES(so_luong_ke),
                            lieu_dung = VALUES(lieu_dung),
                            so_ngay_dung = VALUES(so_ngay_dung);

    UPDATE don_thuoc SET id_benh = v_benh, id_phac_do = p_id_phac_do
     WHERE id = p_id_don_thuoc;
END$$

-- 11.12 Kiểm tra nhân viên là dược sĩ hợp lệ (vai trò duoc_si, đang hoạt động, có CCHN)
CREATE PROCEDURE sp_kiem_duoc_si(IN p_id_nhan_vien INT)
BEGIN
    DECLARE v_ok INT DEFAULT 0;
    SELECT COUNT(*) INTO v_ok
      FROM nhan_vien n
      JOIN tai_khoan t ON t.id = n.id_tai_khoan
      JOIN vai_tro v ON v.id = t.id_vai_tro
     WHERE n.id = p_id_nhan_vien
       AND v.ten_vai_tro = 'duoc_si'
       AND t.trang_thai = 1
       AND n.so_chung_chi_hanh_nghe IS NOT NULL;
    IF v_ok = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Chỉ dược sĩ (có chứng chỉ hành nghề) mới được xử lý yêu cầu kê đơn';
    END IF;
END$$

-- 11.13 Dược sĩ tiếp nhận yêu cầu của bệnh nhân
CREATE PROCEDURE sp_tiep_nhan_yeu_cau(IN p_id_yeu_cau INT, IN p_id_nhan_vien INT)
BEGIN
    DECLARE v_tt VARCHAR(30);

    CALL sp_kiem_duoc_si(p_id_nhan_vien);

    SELECT trang_thai INTO v_tt FROM yeu_cau_ke_don WHERE id = p_id_yeu_cau FOR UPDATE;
    IF v_tt IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Yêu cầu kê đơn không tồn tại';
    END IF;
    IF v_tt <> 'cho_tiep_nhan' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Yêu cầu không ở trạng thái chờ tiếp nhận';
    END IF;

    UPDATE yeu_cau_ke_don
       SET trang_thai = 'da_tiep_nhan',
           id_nhan_vien_tiep_nhan = p_id_nhan_vien,
           ngay_tiep_nhan = NOW()
     WHERE id = p_id_yeu_cau;
END$$

-- 11.14 Dược sĩ kê toa nhiều thuốc từ yêu cầu đã tiếp nhận
--   p_id_phac_do: truyền phác đồ để đổ cả nhóm thuốc vào toa (hoặc NULL để kê tay
--                 bằng INSERT chi_tiet_don_thuoc sau đó). Toa tạo ở 'cho_duyet',
--                 dược sĩ khác sẽ duyệt.
CREATE PROCEDURE sp_ke_don_tu_yeu_cau(
    IN  p_id_yeu_cau INT,
    IN  p_id_nhan_vien INT,
    IN  p_id_benh INT,
    IN  p_id_phac_do INT,
    IN  p_chan_doan TEXT,
    IN  p_ngay_ke DATE,
    IN  p_so_ngay_hieu_luc INT,
    OUT p_id_don_thuoc INT)
BEGIN
    DECLARE v_tt VARCHAR(30);
    DECLARE v_kh INT;
    DECLARE v_nv INT;

    CALL sp_kiem_duoc_si(p_id_nhan_vien);

    SELECT trang_thai, id_khach_hang, id_nhan_vien_tiep_nhan
      INTO v_tt, v_kh, v_nv
      FROM yeu_cau_ke_don WHERE id = p_id_yeu_cau FOR UPDATE;

    IF v_tt IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Yêu cầu kê đơn không tồn tại';
    END IF;
    IF v_tt <> 'da_tiep_nhan' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Yêu cầu phải được tiếp nhận trước khi kê toa';
    END IF;
    IF v_nv <> p_id_nhan_vien THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Chỉ dược sĩ đã tiếp nhận yêu cầu mới được kê toa';
    END IF;
    IF p_id_benh IS NULL AND p_id_phac_do IS NULL AND (p_chan_doan IS NULL OR p_chan_doan = '') THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Phải có bệnh, phác đồ hoặc chẩn đoán để kê toa';
    END IF;
    IF p_id_phac_do IS NOT NULL AND p_id_benh IS NOT NULL
       AND NOT EXISTS (SELECT 1 FROM phac_do WHERE id = p_id_phac_do AND id_benh = p_id_benh) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Phác đồ không thuộc bệnh đã chọn';
    END IF;

    INSERT INTO don_thuoc (id_khach_hang, id_nhan_vien_ke_don, id_yeu_cau, id_benh, chan_doan,
                           ngay_ke_don, so_ngay_hieu_luc, trang_thai)
    VALUES (v_kh, p_id_nhan_vien, p_id_yeu_cau, p_id_benh, p_chan_doan,
            COALESCE(p_ngay_ke, CURDATE()), COALESCE(p_so_ngay_hieu_luc, 5), 'cho_duyet');
    SET p_id_don_thuoc = LAST_INSERT_ID();

    IF p_id_phac_do IS NOT NULL THEN
        CALL sp_ap_dung_phac_do(p_id_don_thuoc, p_id_phac_do);
    END IF;

    UPDATE yeu_cau_ke_don SET trang_thai = 'da_ke_don' WHERE id = p_id_yeu_cau;
END$$

-- 11.15 Dược sĩ từ chối yêu cầu (VD: triệu chứng nặng, cần đi khám trực tiếp)
CREATE PROCEDURE sp_tu_choi_yeu_cau(
    IN p_id_yeu_cau INT, IN p_id_nhan_vien INT, IN p_ly_do TEXT)
BEGIN
    DECLARE v_tt VARCHAR(30);
    DECLARE v_nv INT;

    CALL sp_kiem_duoc_si(p_id_nhan_vien);

    IF p_ly_do IS NULL OR p_ly_do = '' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Phải ghi lý do từ chối';
    END IF;

    SELECT trang_thai, id_nhan_vien_tiep_nhan INTO v_tt, v_nv
      FROM yeu_cau_ke_don WHERE id = p_id_yeu_cau FOR UPDATE;
    IF v_tt IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Yêu cầu kê đơn không tồn tại';
    END IF;
    IF v_tt NOT IN ('cho_tiep_nhan', 'da_tiep_nhan') THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Yêu cầu đã xử lý xong, không thể từ chối';
    END IF;
    IF v_tt = 'da_tiep_nhan' AND v_nv <> p_id_nhan_vien THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Yêu cầu đang do dược sĩ khác phụ trách';
    END IF;

    UPDATE yeu_cau_ke_don
       SET trang_thai = 'tu_choi',
           id_nhan_vien_tiep_nhan = p_id_nhan_vien,
           ngay_tiep_nhan = COALESCE(ngay_tiep_nhan, NOW()),
           ly_do_tu_choi = p_ly_do
     WHERE id = p_id_yeu_cau;
END$$

-- 11.16 Yêu cầu đã xử lý xong thì không mở lại; khách chỉ tự hủy được khi chưa tiếp nhận
CREATE TRIGGER trg_yeu_cau_before_update
BEFORE UPDATE ON yeu_cau_ke_don
FOR EACH ROW
BEGIN
    IF OLD.trang_thai IN ('da_ke_don', 'tu_choi', 'da_huy')
       AND NEW.trang_thai <> OLD.trang_thai THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Yêu cầu đã xử lý xong, không thể đổi trạng thái; hãy tạo yêu cầu mới';
    END IF;
    IF NEW.trang_thai = 'da_huy' AND OLD.trang_thai <> 'cho_tiep_nhan' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Chỉ hủy được yêu cầu khi dược sĩ chưa tiếp nhận';
    END IF;
END$$

DELIMITER ;

-- =========================================================================
-- 12. VIEW TIỆN TRA CỨU
-- =========================================================================

CREATE VIEW v_thuoc_ke_don AS
SELECT id, ten_thuoc, so_dang_ky FROM thuoc WHERE loai_ke_don = 'ke_don';

-- Lô sắp hết hạn trong 60 ngày
CREATE VIEW v_thuoc_sap_het_han AS
SELECT t.id, t.ten_thuoc, l.so_lo, l.han_su_dung, l.so_luong_ton
FROM lo_thuoc l JOIN thuoc t ON t.id = l.id_thuoc
WHERE l.so_luong_ton > 0
  AND l.han_su_dung IS NOT NULL
  AND l.han_su_dung <= DATE_ADD(CURDATE(), INTERVAL 60 DAY);

-- Tồn kho theo lô, sắp theo FEFO
CREATE VIEW v_ton_kho_theo_lo AS
SELECT t.id AS id_thuoc, t.ten_thuoc, l.so_lo, l.han_su_dung, l.so_luong_ton
FROM lo_thuoc l JOIN thuoc t ON t.id = l.id_thuoc
WHERE l.so_luong_ton > 0
ORDER BY t.id, (l.han_su_dung IS NULL), l.han_su_dung;

-- Số lượng còn được mua theo từng toa (kèm tên bệnh + chẩn đoán)
CREATE VIEW v_toa_con_lai AS
SELECT x.*, (x.so_luong_ke - x.da_mua) AS con_lai
FROM (
    SELECT dt.id AS id_don_thuoc,
           dt.id_khach_hang,
           dt.trang_thai AS trang_thai_toa,
           b.ten_benh,
           dt.chan_doan,
           DATE_ADD(dt.ngay_ke_don, INTERVAL dt.so_ngay_hieu_luc DAY) AS han_dung_toa,
           ct.id_thuoc,
           t.ten_thuoc,
           ct.so_luong_ke,
           COALESCE((SELECT SUM(c.so_luong)
                       FROM chi_tiet_don_dat c
                       JOIN don_dat_thuoc d ON d.id = c.id_don_dat
                      WHERE d.id_don_thuoc = dt.id
                        AND c.id_thuoc = ct.id_thuoc
                        AND d.trang_thai <> 'da_huy'), 0) AS da_mua
    FROM don_thuoc dt
    JOIN chi_tiet_don_thuoc ct ON ct.id_don_thuoc = dt.id
    JOIN thuoc t ON t.id = ct.id_thuoc
    LEFT JOIN benh b ON b.id = dt.id_benh
) x;

-- Yêu cầu kê đơn kèm khách, dược sĩ tiếp nhận và toa sinh ra
CREATE VIEW v_yeu_cau_ke_don AS
SELECT yc.id AS id_yeu_cau,
       kh.ho_ten AS khach_hang,
       yc.ten_benh_khai,
       yc.trieu_chung,
       yc.di_ung_thuoc,
       yc.trang_thai AS trang_thai_yeu_cau,
       nv.ho_ten AS duoc_si_tiep_nhan,
       yc.ngay_tao,
       yc.ly_do_tu_choi,
       dt.id AS id_don_thuoc,
       dt.trang_thai AS trang_thai_toa,
       (SELECT COUNT(*) FROM chi_tiet_don_thuoc c WHERE c.id_don_thuoc = dt.id) AS so_loai_thuoc
FROM yeu_cau_ke_don yc
JOIN khach_hang kh ON kh.id = yc.id_khach_hang
LEFT JOIN nhan_vien nv ON nv.id = yc.id_nhan_vien_tiep_nhan
LEFT JOIN don_thuoc dt ON dt.id_yeu_cau = yc.id;

-- Hàng đợi cho dược sĩ: yêu cầu chưa ai tiếp nhận, cũ nhất lên trước
CREATE VIEW v_yeu_cau_cho_tiep_nhan AS
SELECT yc.id AS id_yeu_cau, kh.ho_ten AS khach_hang, kh.so_dien_thoai,
       yc.ten_benh_khai, yc.trieu_chung, yc.thoi_gian_bi_benh,
       yc.di_ung_thuoc, yc.benh_nen_thuoc_dang_dung, yc.ngay_tao
FROM yeu_cau_ke_don yc
JOIN khach_hang kh ON kh.id = yc.id_khach_hang
WHERE yc.trang_thai = 'cho_tiep_nhan'
ORDER BY yc.ngay_tao;

-- =========================================================================
-- 13. DỮ LIỆU MẪU - PHẦN GỐC
-- Lưu ý: so_luong_ton trong bảng thuoc là tồn ban đầu, được đưa vào lô
-- "TON-DAU-<SKU>" ở bảng lo_thuoc (ID thuốc 1-3 và 4-16 dùng ID cứng vì DB
-- vừa tạo mới). Đơn hàng mẫu được tạo ở trạng thái cho_xac_nhan rồi UPDATE
-- sang trạng thái cuối để trigger xuất kho FEFO chạy đúng nghiệp vụ.
-- =========================================================================

INSERT INTO vai_tro (ten_vai_tro) VALUES
('khach_hang'), ('nv_quan_ly'), ('duoc_si'), ('admin');   -- id 1,2,3,4

INSERT INTO tai_khoan (ten_dang_nhap, mat_khau, id_vai_tro, trang_thai) VALUES
('khachhang1', '123456', 1, 1),   -- tk 1
('nhanvien1',  '123456', 2, 1),   -- tk 2
('duocsi1',    '123456', 3, 1),   -- tk 3
('admin1',     '123456', 4, 1);   -- tk 4

INSERT INTO khach_hang (id_tai_khoan, ho_ten, so_dien_thoai, email, dia_chi, ngay_sinh) VALUES
(1, 'Nguyễn Văn Khách', '0901234567', 'khachhang1@gmail.com', '123 Lê Lợi, Quận 1, TP.HCM', '1995-05-15');

INSERT INTO nhan_vien (id_tai_khoan, ho_ten, so_dien_thoai, email, chuyen_khoa, so_chung_chi_hanh_nghe) VALUES
(2, 'Lê Quản Lý',       '0923456789', 'quanly1@nhathuoc.com', NULL, NULL),                        -- nv 1
(3, 'Phạm Thị Dược Sĩ', '0934567890', 'duocsi1@nhathuoc.com', 'Dược lâm sàng', 'CCHN-00981');    -- nv 2

INSERT INTO nha_cung_cap (ten_nha_cung_cap, ma_so_thue, so_dien_thoai, email, dia_chi, nguoi_lien_he) VALUES
('Công ty Dược Hậu Giang', '1800156801', '02923891433', 'dhg@dhgpharma.com.vn', '288 Bis Nguyễn Văn Cừ, Cần Thơ', 'Nguyễn Văn A'),
('Công ty Cổ phần Traphaco', '0100108656', '02436815151', 'info@traphaco.com.vn', '75 Yên Ninh, Ba Đình, Hà Nội', 'Trần Thị B');

INSERT INTO danh_muc_thuoc (ten_danh_muc, mo_ta) VALUES
('Thuốc giảm đau, hạ sốt', 'Các loại thuốc giúp giảm triệu chứng đau và hạ sốt'),
('Thuốc kháng sinh', 'Thuốc điều trị các bệnh nhiễm khuẩn'),
('Thực phẩm chức năng', 'Hỗ trợ bồi bổ sức khỏe');

-- Danh mục bệnh (dùng cho chẩn đoán trên toa thuốc)
INSERT INTO benh (ma_icd, ten_benh, mo_ta) VALUES
('J02', 'Viêm họng cấp',                          'Viêm họng do vi khuẩn/virus'),
('J22', 'Nhiễm khuẩn đường hô hấp dưới',          'Viêm phế quản, viêm phổi nhẹ'),
('K21', 'Trào ngược dạ dày - thực quản',          'Kèm viêm loét dạ dày'),
('I10', 'Tăng huyết áp',                          'Tăng huyết áp nguyên phát'),
('E11', 'Đái tháo đường type 2',                  'Đái tháo đường không phụ thuộc insulin'),
('R50', 'Sốt cấp',                                 'Sốt do nhiễm khuẩn/virus, dược sĩ đánh giá trước khi kê đơn');

INSERT INTO thuoc (ma_sku, ten_thuoc, id_danh_muc, id_nha_cung_cap, loai_ke_don, so_dang_ky, don_vi_tinh, gia_ban, so_luong_ton, han_su_dung) VALUES
('SKU001', 'Paracetamol 500mg', 1, 1, 'khong_ke_don', 'VD-54321-18', 'Hộp', 35000.00, 150, '2026-12-31'),
('SKU002', 'Amoxicillin 500mg', 2, 1, 'ke_don', 'VD-12345-19', 'Vỉ', 45000.00, 200, '2027-06-30'),
('SKU003', 'Boganic', 3, 2, 'khong_ke_don', NULL, 'Hộp', 95000.00, 50, '2026-10-15');

-- Lô tồn đầu kỳ cho thuốc 1-3 (trigger tự đồng bộ lại thuoc.so_luong_ton)
INSERT INTO lo_thuoc (id_thuoc, so_lo, han_su_dung, so_luong_ton) VALUES
(1, 'TON-DAU-SKU001', '2026-12-31', 150),
(2, 'TON-DAU-SKU002', '2027-06-30', 200),
(3, 'TON-DAU-SKU003', '2026-10-15',  50);

INSERT INTO mo_ta_thuoc (id_thuoc, thuong_hieu, dang_bao_che, quy_cach_dong_goi, ham_luong, thanh_phan, cong_dung, doi_tuong_su_dung, huong_dan_su_dung, lieu_dung_khuyen_cao, bao_quan, canh_bao) VALUES
(1, 'DHG Pharma', 'Viên nén', 'Hộp 10 vỉ x 10 viên', '500mg', 'Paracetamol',
 'Giảm đau, hạ sốt nhanh chóng', 'Người lớn và trẻ em trên 12 tuổi',
 'Uống với nhiều nước sau ăn', 'Người lớn: 1-2 viên/lần, cách 4-6 giờ, tối đa 8 viên/ngày',
 'Nơi khô ráo, dưới 30°C, tránh ánh sáng', 'Không dùng quá liều, thận trọng với người suy gan'),
(2, 'DHG Pharma', 'Viên nang', 'Vỉ 10 viên', '500mg', 'Amoxicillin trihydrat',
 'Điều trị nhiễm khuẩn hô hấp, tai mũi họng', 'Theo chỉ định kê đơn',
 'Uống theo đúng liều và đủ thời gian trong toa', NULL,
 'Nơi khô ráo, dưới 30°C', 'Chỉ dùng khi có toa thuốc, ngưng thuốc nếu dị ứng'),
(3, 'Traphaco', 'Viên nén bao phim', 'Hộp 5 vỉ x 10 viên', NULL, 'Cao atisô, rau đắng đất',
 'Mát gan, giải độc gan', 'Người lớn', 'Uống sau ăn', '1-2 viên/lần, 2-3 lần/ngày',
 'Nơi khô ráo, tránh ánh sáng', 'Không dùng cho phụ nữ có thai chưa hỏi ý kiến dược sĩ');

INSERT INTO anh_thuoc (id_thuoc, duong_dan_anh, la_anh_chinh, thu_tu) VALUES
(1, '/images/thuoc/paracetamol_1.jpg', 1, 1),
(2, '/images/thuoc/amoxicillin_1.jpg', 1, 1),
(3, '/images/thuoc/boganic_1.jpg', 1, 1);

INSERT INTO gio_hang (id_khach_hang, id_thuoc, so_luong) VALUES
(1, 3, 1);

INSERT INTO khuyen_mai (ma_code, mo_ta, loai_giam, gia_tri_giam, don_toi_thieu, ngay_bat_dau, ngay_ket_thuc, so_luong_toi_da) VALUES
('CHAOMUNG10', 'Giảm 10% cho đơn hàng đầu tiên', 'phan_tram', 10, 50000, '2026-01-01', '2026-12-31', 1000);

-- Toa mẫu 1: khách tự upload ảnh toa (không có người kê trong hệ thống).
-- Phải tạo ở cho_duyet -> thêm thuốc (nhóm 2 thuốc) -> dược sĩ nv 2 duyệt
INSERT INTO don_thuoc (id_khach_hang, id_nhan_vien_ke_don, id_benh, chan_doan, hinh_anh_don_thuoc, ngay_ke_don, trang_thai) VALUES
(1, NULL, 1, 'Viêm họng cấp', '/images/don_thuoc/toa_1.jpg', '2026-09-20', 'cho_duyet');

INSERT INTO chi_tiet_don_thuoc (id_don_thuoc, id_thuoc, so_luong_ke, lieu_dung, so_ngay_dung) VALUES
(1, 2, 1, 'Ngày uống 3 lần, mỗi lần 1 viên sau ăn', 7),
(1, 1, 1, 'Uống 1 viên khi sốt hoặc đau, cách nhau 4-6 giờ', 3);

-- Duyệt sau khi đã có đủ thuốc (trigger kiểm tra chẩn đoán + từ 2 thuốc)
UPDATE don_thuoc
   SET trang_thai = 'da_duyet', id_nhan_vien_duyet = 2, ngay_duyet = NOW(),
       ghi_chu_duyet = 'Toa hợp lệ, đã đối chiếu với cơ sở khám'
 WHERE id = 1;

-- ngay_dat đặt cụ thể (trong hạn hiệu lực của toa) để trigger kiểm tra toa cho qua
INSERT INTO don_dat_thuoc (id_khach_hang, id_don_thuoc, id_khuyen_mai, ngay_dat, tong_tien, giam_gia, thanh_tien, dia_chi_giao_hang, so_dien_thoai_nhan, trang_thai) VALUES
(1, 1, NULL, '2026-09-21 10:00:00', 45000.00, 0, 45000.00, '123 Lê Lợi, Quận 1, TP.HCM', '0901234567', 'cho_xac_nhan');

-- Kích hoạt trigger kiểm tra: đúng chủ toa, toa đã duyệt, còn hạn, thuốc nằm trong toa, SL <= SL kê
-- (Kho CHƯA bị trừ; chỉ trừ khi đơn chuyển sang da_xac_nhan)
INSERT INTO chi_tiet_don_dat (id_don_dat, id_thuoc, so_luong, don_gia) VALUES
(1, 2, 1, 45000.00);

INSERT INTO lich_su_theo_doi_don (id_don_dat, trang_thai_cap_nhat, ghi_chu) VALUES
(1, 'cho_xac_nhan', 'Khách hàng vừa đặt đơn mới trên app di động');

INSERT INTO thanh_toan (id_don_dat, phuong_thuc, ma_giao_dich, so_tien, trang_thai, thoi_gian_thanh_toan) VALUES
(1, 'vi_dien_tu', 'MOMO20260920001', 45000.00, 'da_thanh_toan', NOW());

INSERT INTO hoa_don (id_don_dat, so_hoa_don, tong_tien_truoc_thue, thue_vat, tong_tien_sau_thue) VALUES
(1, 'HD2026000001', 45000.00, 0, 45000.00);

INSERT INTO danh_gia (id_khach_hang, id_thuoc, so_sao, noi_dung) VALUES
(1, 1, 5, 'Thuốc tác dụng rất nhanh, giá hợp lý, giao hàng chuẩn.');

-- tong_tien = 100*25000 + 100*30000 = 5.500.000
INSERT INTO phieu_nhap_thuoc (id_nhan_vien, id_nha_cung_cap, tong_tien, ghi_chu) VALUES
(1, 1, 5500000.00, 'Nhập lô hàng bổ sung tháng 9');

-- Kích hoạt trigger: tự tạo lô mới + đồng bộ tồn kho
INSERT INTO chi_tiet_phieu_nhap (id_phieu_nhap, id_thuoc, so_luong, gia_nhap, so_lo, han_su_dung) VALUES
(1, 1, 100, 25000.00, 'L19283', '2026-12-31'),
(1, 2, 100, 30000.00, 'L19284', '2027-06-30');

INSERT INTO lich_su_trang_thai_nhap (id_phieu_nhap, trang_thai, nguoi_cap_nhat, ghi_chu) VALUES
(1, 'da_nhap_kho', 1, 'Đã kiểm tra chất lượng và số lượng lô hàng');

-- =========================================================================
-- 14. DỮ LIỆU MẪU BỔ SUNG
-- =========================================================================

-- 14.1 TÀI KHOẢN (5-10) -----------------------------------------------------
INSERT INTO tai_khoan (ten_dang_nhap, mat_khau, id_vai_tro, trang_thai) VALUES
('khachhang2', '123456', 1, 1),  -- tk 5
('khachhang3', '123456', 1, 1),  -- tk 6
('khachhang4', '123456', 1, 0),  -- tk 7 (tài khoản bị khóa, để test khóa/mở khóa)
('duocsi2',    '123456', 3, 1),  -- tk 8
('duocsi3',    '123456', 3, 1),  -- tk 9
('nhanvien2',  '123456', 2, 1);  -- tk 10

INSERT INTO khach_hang (id_tai_khoan, ho_ten, so_dien_thoai, email, dia_chi, ngay_sinh) VALUES
(5, 'Trần Thị Mai',   '0902345678', 'mai.tran@gmail.com',  '45 Nguyễn Huệ, Quận 1, TP.HCM',        '1990-03-22'),
(6, 'Lê Hoàng Nam',   '0903456789', 'nam.le@gmail.com',    '12 Trần Phú, Hải Châu, Đà Nẵng',       '1988-11-05'),
(7, 'Phạm Quốc Bảo',  '0904567890', 'bao.pham@gmail.com',  '78 Lý Thường Kiệt, Hoàn Kiếm, Hà Nội', '2001-07-18');

INSERT INTO nhan_vien (id_tai_khoan, ho_ten, so_dien_thoai, email, chuyen_khoa, so_chung_chi_hanh_nghe) VALUES
(8,  'Nguyễn Văn Hùng', '0915678901', 'duocsi2@nhathuoc.com', 'Tiêu hóa',            'CCHN-01234'),  -- nv 3
(9,  'Đỗ Thị Lan',      '0916789012', 'duocsi3@nhathuoc.com', 'Tim mạch - Nội tiết', 'CCHN-05678'),  -- nv 4
(10, 'Vũ Minh Kho',     '0945678901', 'kho1@nhathuoc.com',    NULL,                  NULL);          -- nv 5

-- 14.2 NHÀ CUNG CẤP (3-5) VÀ DANH MỤC (4-8) ---------------------------------
INSERT INTO nha_cung_cap (ten_nha_cung_cap, ma_so_thue, so_dien_thoai, email, dia_chi, nguoi_lien_he) VALUES
('Sanofi Việt Nam',        '0300581342', '02838298526', 'contact@sanofi.vn',    '10 Hàm Nghi, Quận 1, TP.HCM',       'Lê Văn C'),
('Công ty CP Imexpharm',   '1400112087', '02773851941', 'imex@imexpharm.com',   '4 Lê Thánh Tôn, Cao Lãnh, Đồng Tháp','Phạm Thị D'),
('Công ty CP Domesco',     '1400460395', '02773852278', 'info@domesco.com',     '66 Quốc lộ 30, Cao Lãnh, Đồng Tháp', 'Hoàng Văn E');

INSERT INTO danh_muc_thuoc (ten_danh_muc, mo_ta) VALUES
('Vitamin & khoáng chất',       'Bổ sung vitamin, tăng cường đề kháng'),
('Thuốc tiêu hóa',              'Điều trị rối loạn tiêu hóa, dạ dày, tiêu chảy'),
('Thuốc ho - cảm cúm - dị ứng', 'Giảm triệu chứng cảm cúm, ho, dị ứng'),
('Thuốc tim mạch - tiểu đường', 'Điều trị huyết áp, đái tháo đường (thuốc kê đơn)'),
('Dụng cụ y tế',                'Máy đo, khẩu trang, nhiệt kế và dụng cụ chăm sóc sức khỏe');

-- 14.3 THUỐC (4-16). Có cả hàng sắp hết, sắp hết hạn, hết hàng để test dashboard
INSERT INTO thuoc (ma_sku, ten_thuoc, id_danh_muc, id_nha_cung_cap, loai_ke_don, so_dang_ky, don_vi_tinh, gia_ban, so_luong_ton, han_su_dung) VALUES
('SKU004', 'Vitamin C 500mg',        4, 3, 'khong_ke_don', 'VD-20111-13', 'Hộp',  60000.00,  20, '2027-08-31'),  -- 4
('SKU005', 'Decolgen Forte',         6, 4, 'khong_ke_don', 'VD-31022-19', 'Hộp',  28000.00,   8, '2027-03-31'),  -- 5 sắp hết hàng
('SKU006', 'Berberin 100mg',         5, 5, 'khong_ke_don', 'VD-15530-11', 'Lọ',   12000.00,   6, '2026-11-10'),  -- 6 sắp hết hàng + sắp hết hạn
('SKU007', 'Omeprazole 20mg',        5, 4, 'ke_don',       'VD-27788-17', 'Hộp',  55000.00,  90, '2027-05-31'),  -- 7
('SKU008', 'Cefuroxime 500mg',       2, 4, 'ke_don',       'VD-19045-13', 'Hộp', 120000.00,  60, '2027-01-31'),  -- 8
('SKU009', 'Amlodipine 5mg',         7, 5, 'ke_don',       'VD-22310-15', 'Hộp',  40000.00,  50, '2027-09-30'),  -- 9
('SKU010', 'Metformin 850mg',        7, 5, 'ke_don',       'VD-26654-17', 'Hộp',  48000.00,   4, '2027-04-30'),  -- 10 sắp hết hàng
('SKU011', 'Siro ho Prospan',        6, 3, 'khong_ke_don', 'VN-16789-13', 'Chai', 89000.00,  20, '2027-10-31'),  -- 11
('SKU012', 'Oresol 245',             5, 5, 'khong_ke_don', 'VD-12099-10', 'Hộp',  25000.00, 200, '2026-10-20'),  -- 12 sắp hết hạn
('SKU013', 'Máy đo huyết áp bắp tay',8, 3, 'khong_ke_don', NULL,          'Cái', 850000.00,  15, NULL),          -- 13
('SKU014', 'Khẩu trang y tế 4 lớp',  8, 5, 'khong_ke_don', NULL,          'Hộp',  35000.00, 300, '2028-01-01'),  -- 14
('SKU015', 'Ibuprofen 400mg',        1, 1, 'khong_ke_don', 'VD-24410-16', 'Hộp',  42000.00,   0, '2027-02-28'),  -- 15 hết hàng
('SKU016', 'Loratadine 10mg',        6, 1, 'khong_ke_don', 'VD-17733-12', 'Hộp',  30000.00,   0, '2027-06-30');  -- 16 (nhập kho ở mục 14.10)

-- Lô tồn đầu kỳ cho thuốc 4-14 (thuốc 15, 16 hết hàng nên chưa có lô)
-- Lưu ý: Oresol (id 12) có lô HSD 2026-10-20. Nếu chạy file này SAU ngày đó,
-- xuất kho đơn mẫu có Oresol sẽ báo "Không đủ hàng còn hạn" -> hãy dời HSD lô này.
INSERT INTO lo_thuoc (id_thuoc, so_lo, han_su_dung, so_luong_ton) VALUES
(4,  'TON-DAU-SKU004', '2027-08-31',  20),
(5,  'TON-DAU-SKU005', '2027-03-31',   8),
(6,  'TON-DAU-SKU006', '2026-11-10',   6),
(7,  'TON-DAU-SKU007', '2027-05-31',  90),
(8,  'TON-DAU-SKU008', '2027-01-31',  60),
(9,  'TON-DAU-SKU009', '2027-09-30',  50),
(10, 'TON-DAU-SKU010', '2027-04-30',   4),
(11, 'TON-DAU-SKU011', '2027-10-31',  20),
(12, 'TON-DAU-SKU012', '2026-10-20', 200),
(13, 'TON-DAU-SKU013', NULL,          15),
(14, 'TON-DAU-SKU014', '2028-01-01', 300);

INSERT INTO mo_ta_thuoc (id_thuoc, thuong_hieu, dang_bao_che, quy_cach_dong_goi, ham_luong, thanh_phan, cong_dung, doi_tuong_su_dung, huong_dan_su_dung, lieu_dung_khuyen_cao, bao_quan, canh_bao) VALUES
(4,  'Sanofi', 'Viên sủi', 'Tuýp 20 viên', '500mg', 'Acid ascorbic (Vitamin C)',
 'Bổ sung vitamin C, tăng sức đề kháng', 'Người lớn và trẻ em trên 6 tuổi', 'Hòa tan 1 viên trong 200ml nước rồi uống',
 '1 viên/ngày', 'Nơi khô ráo, đậy kín nắp', 'Thận trọng với người có sỏi thận'),
(5,  'Imexpharm', 'Viên nén bao phim', 'Hộp 25 vỉ x 4 viên', NULL, 'Paracetamol, Phenylephrine, Chlorpheniramine',
 'Giảm nghẹt mũi, sổ mũi, đau đầu, sốt do cảm cúm', 'Người lớn và trẻ em trên 12 tuổi', 'Uống sau ăn với nước',
 '1 viên/lần, 3 lần/ngày', 'Dưới 30°C, tránh ẩm', 'Gây buồn ngủ, không lái xe khi dùng'),
(6,  'Domesco', 'Viên nén', 'Lọ 100 viên', '100mg', 'Berberin clorid',
 'Hỗ trợ điều trị tiêu chảy, lỵ, viêm ruột', 'Người lớn', 'Uống trước hoặc sau ăn',
 '2-4 viên/lần, 2 lần/ngày', 'Nơi khô ráo, tránh ánh sáng', 'Không dùng cho phụ nữ có thai'),
(7,  'Imexpharm', 'Viên nang', 'Hộp 3 vỉ x 10 viên', '20mg', 'Omeprazole',
 'Điều trị viêm loét dạ dày - tá tràng, trào ngược dạ dày', 'Theo chỉ định kê đơn', 'Uống trước bữa sáng 30 phút',
 NULL, 'Dưới 30°C', 'Chỉ dùng khi có toa thuốc'),
(8,  'Imexpharm', 'Viên nén bao phim', 'Hộp 2 vỉ x 5 viên', '500mg', 'Cefuroxime axetil',
 'Điều trị nhiễm khuẩn đường hô hấp, tiết niệu, da', 'Theo chỉ định kê đơn', 'Uống ngay sau bữa ăn',
 NULL, 'Dưới 25°C, tránh ẩm', 'Chống chỉ định với người dị ứng cephalosporin'),
(9,  'Domesco', 'Viên nén', 'Hộp 3 vỉ x 10 viên', '5mg', 'Amlodipine besylate',
 'Điều trị tăng huyết áp, đau thắt ngực', 'Theo chỉ định kê đơn', 'Uống 1 lần/ngày, cùng giờ mỗi ngày',
 NULL, 'Nơi khô ráo, dưới 30°C', 'Có thể gây phù mắt cá chân, chóng mặt'),
(10, 'Domesco', 'Viên nén bao phim', 'Hộp 3 vỉ x 10 viên', '850mg', 'Metformin hydroclorid',
 'Điều trị đái tháo đường type 2', 'Theo chỉ định kê đơn', 'Uống trong hoặc ngay sau bữa ăn',
 NULL, 'Dưới 30°C', 'Thận trọng với người suy thận, suy gan'),
(11, 'Prospan', 'Siro', 'Chai 100ml', NULL, 'Chiết xuất lá thường xuân',
 'Long đờm, giảm ho do viêm phế quản, cảm lạnh', 'Trẻ em và người lớn', 'Lắc đều trước khi dùng',
 'Trẻ 2-6 tuổi: 2.5ml/lần, 2 lần/ngày. Người lớn: 5ml/lần, 3 lần/ngày', 'Dưới 25°C, dùng trong 3 tháng sau khi mở nắp', 'Không dùng cho trẻ dưới 2 tuổi'),
(12, 'Domesco', 'Bột pha dung dịch', 'Hộp 20 gói', NULL, 'Natri clorid, Kali clorid, Glucose khan',
 'Bù nước và điện giải khi tiêu chảy, mất nước', 'Mọi lứa tuổi', 'Hòa 1 gói với 200ml nước sôi để nguội',
 'Uống từng ngụm nhỏ nhiều lần', 'Nơi khô ráo, kín', 'Dung dịch đã pha chỉ dùng trong 24 giờ'),
(13, 'Omron', 'Thiết bị điện tử', 'Hộp 1 máy + bao đựng', NULL, 'Không áp dụng',
 'Đo huyết áp và nhịp tim tại nhà', 'Người lớn', 'Ngồi nghỉ 5 phút, đặt vòng bít ngang tim rồi bấm đo',
 NULL, 'Tránh va đập, tránh ẩm', 'Không thay thế chẩn đoán của bác sĩ'),
(14, 'Domesco', 'Khẩu trang', 'Hộp 50 cái', NULL, 'Vải không dệt, lớp lọc kháng khuẩn',
 'Ngăn bụi và giọt bắn', 'Mọi đối tượng', 'Đeo úp kín mũi miệng, bấm thanh kim loại',
 NULL, 'Nơi khô ráo, sạch sẽ', 'Không tái sử dụng'),
(15, 'DHG Pharma', 'Viên nén bao phim', 'Hộp 10 vỉ x 10 viên', '400mg', 'Ibuprofen',
 'Giảm đau, kháng viêm, hạ sốt', 'Người lớn và trẻ em trên 12 tuổi', 'Uống sau ăn no',
 '1 viên/lần, 3 lần/ngày, cách nhau 6-8 giờ', 'Dưới 30°C', 'Không dùng cho người loét dạ dày'),
(16, 'DHG Pharma', 'Viên nén', 'Hộp 1 vỉ x 10 viên', '10mg', 'Loratadine',
 'Giảm triệu chứng viêm mũi dị ứng, mề đay', 'Người lớn và trẻ em trên 12 tuổi', 'Uống 1 lần/ngày',
 '1 viên/ngày', 'Nơi khô ráo, dưới 30°C', 'Thận trọng với người suy gan nặng');

-- 14.4 ẢNH THUỐC - mỗi thuốc 3 ảnh: 1 ảnh chính + 2 ảnh phụ -----------------
-- (thuốc 1-3 đã có ảnh chính _1 ở phần gốc, ở đây chỉ bổ sung _2, _3)
INSERT INTO anh_thuoc (id_thuoc, duong_dan_anh, la_anh_chinh, thu_tu) VALUES
(1, '/images/thuoc/paracetamol_2.jpg', 0, 2),
(1, '/images/thuoc/paracetamol_3.jpg', 0, 3),
(2, '/images/thuoc/amoxicillin_2.jpg', 0, 2),
(2, '/images/thuoc/amoxicillin_3.jpg', 0, 3),
(3, '/images/thuoc/boganic_2.jpg', 0, 2),
(3, '/images/thuoc/boganic_3.jpg', 0, 3),
(4, '/images/thuoc/vitamin_c_1.jpg', 1, 1),
(4, '/images/thuoc/vitamin_c_2.jpg', 0, 2),
(4, '/images/thuoc/vitamin_c_3.jpg', 0, 3),
(5, '/images/thuoc/decolgen_1.jpg', 1, 1),
(5, '/images/thuoc/decolgen_2.jpg', 0, 2),
(5, '/images/thuoc/decolgen_3.jpg', 0, 3),
(6, '/images/thuoc/berberin_1.jpg', 1, 1),
(6, '/images/thuoc/berberin_2.jpg', 0, 2),
(6, '/images/thuoc/berberin_3.jpg', 0, 3),
(7, '/images/thuoc/omeprazole_1.jpg', 1, 1),
(7, '/images/thuoc/omeprazole_2.jpg', 0, 2),
(7, '/images/thuoc/omeprazole_3.jpg', 0, 3),
(8, '/images/thuoc/cefuroxime_1.jpg', 1, 1),
(8, '/images/thuoc/cefuroxime_2.jpg', 0, 2),
(8, '/images/thuoc/cefuroxime_3.jpg', 0, 3),
(9, '/images/thuoc/amlodipine_1.jpg', 1, 1),
(9, '/images/thuoc/amlodipine_2.jpg', 0, 2),
(9, '/images/thuoc/amlodipine_3.jpg', 0, 3),
(10, '/images/thuoc/metformin_1.jpg', 1, 1),
(10, '/images/thuoc/metformin_2.jpg', 0, 2),
(10, '/images/thuoc/metformin_3.jpg', 0, 3),
(11, '/images/thuoc/prospan_1.jpg', 1, 1),
(11, '/images/thuoc/prospan_2.jpg', 0, 2),
(11, '/images/thuoc/prospan_3.jpg', 0, 3),
(12, '/images/thuoc/oresol_1.jpg', 1, 1),
(12, '/images/thuoc/oresol_2.jpg', 0, 2),
(12, '/images/thuoc/oresol_3.jpg', 0, 3),
(13, '/images/thuoc/may_do_huyet_ap_1.jpg', 1, 1),
(13, '/images/thuoc/may_do_huyet_ap_2.jpg', 0, 2),
(13, '/images/thuoc/may_do_huyet_ap_3.jpg', 0, 3),
(14, '/images/thuoc/khau_trang_1.jpg', 1, 1),
(14, '/images/thuoc/khau_trang_2.jpg', 0, 2),
(14, '/images/thuoc/khau_trang_3.jpg', 0, 3),
(15, '/images/thuoc/ibuprofen_1.jpg', 1, 1),
(15, '/images/thuoc/ibuprofen_2.jpg', 0, 2),
(15, '/images/thuoc/ibuprofen_3.jpg', 0, 3),
(16, '/images/thuoc/loratadine_1.jpg', 1, 1),
(16, '/images/thuoc/loratadine_2.jpg', 0, 2),
(16, '/images/thuoc/loratadine_3.jpg', 0, 3);

-- 14.5 GIỎ HÀNG --------------------------------------------------------------
INSERT INTO gio_hang (id_khach_hang, id_thuoc, so_luong) VALUES
(2, 4, 2),
(3, 16, 1),
(4, 14, 3);

-- 14.6 KHUYẾN MÃI (2-4) --------------------------------------------------------
INSERT INTO khuyen_mai (ma_code, mo_ta, loai_giam, gia_tri_giam, don_toi_thieu, ngay_bat_dau, ngay_ket_thuc, so_luong_toi_da) VALUES
('GIAM20K',    'Giảm 20.000đ cho đơn từ 200.000đ',  'tien_mat', 20000, 200000, '2026-09-01', '2026-12-31', 500),
('FREESHIP15', 'Hỗ trợ phí ship 15.000đ',           'tien_mat', 15000, 100000, '2026-09-01', '2026-10-31', NULL),
('HETHAN2025', 'Mã đã hết hạn (dùng để test)',      'phan_tram', 5,     0,     '2025-01-01', '2025-12-31', 100);

-- =========================================================================
-- 14.7 -> 14.10: KHÔNG DÙNG ID CỨNG (dùng biến @...). Chạy CẢ ĐOẠN trong
-- 1 phiên vì các biến @... chỉ tồn tại trong phiên làm việc.
-- =========================================================================

-- 0. TRA CỨU ID THEO KHÓA TỰ NHIÊN
SET @kh1 := (SELECT kh.id FROM khach_hang kh JOIN tai_khoan t ON t.id = kh.id_tai_khoan WHERE t.ten_dang_nhap = 'khachhang1');
SET @kh2 := (SELECT kh.id FROM khach_hang kh JOIN tai_khoan t ON t.id = kh.id_tai_khoan WHERE t.ten_dang_nhap = 'khachhang2');
SET @kh3 := (SELECT kh.id FROM khach_hang kh JOIN tai_khoan t ON t.id = kh.id_tai_khoan WHERE t.ten_dang_nhap = 'khachhang3');
SET @kh4 := (SELECT kh.id FROM khach_hang kh JOIN tai_khoan t ON t.id = kh.id_tai_khoan WHERE t.ten_dang_nhap = 'khachhang4');

-- Dược sĩ kê đơn
SET @ds2 := (SELECT n.id FROM nhan_vien n JOIN tai_khoan t ON t.id = n.id_tai_khoan WHERE t.ten_dang_nhap = 'duocsi2');
SET @ds3 := (SELECT n.id FROM nhan_vien n JOIN tai_khoan t ON t.id = n.id_tai_khoan WHERE t.ten_dang_nhap = 'duocsi3');

SET @nv_ql  := (SELECT n.id FROM nhan_vien n JOIN tai_khoan t ON t.id = n.id_tai_khoan WHERE t.ten_dang_nhap = 'nhanvien1');
SET @nv_ds  := (SELECT n.id FROM nhan_vien n JOIN tai_khoan t ON t.id = n.id_tai_khoan WHERE t.ten_dang_nhap = 'duocsi1');
SET @nv_kho := (SELECT n.id FROM nhan_vien n JOIN tai_khoan t ON t.id = n.id_tai_khoan WHERE t.ten_dang_nhap = 'nhanvien2');

SET @t1  := (SELECT id FROM thuoc WHERE ma_sku = 'SKU001');
SET @t4  := (SELECT id FROM thuoc WHERE ma_sku = 'SKU004');
SET @t5  := (SELECT id FROM thuoc WHERE ma_sku = 'SKU005');
SET @t7  := (SELECT id FROM thuoc WHERE ma_sku = 'SKU007');
SET @t8  := (SELECT id FROM thuoc WHERE ma_sku = 'SKU008');
SET @t9  := (SELECT id FROM thuoc WHERE ma_sku = 'SKU009');
SET @t10 := (SELECT id FROM thuoc WHERE ma_sku = 'SKU010');
SET @t11 := (SELECT id FROM thuoc WHERE ma_sku = 'SKU011');
SET @t12 := (SELECT id FROM thuoc WHERE ma_sku = 'SKU012');
SET @t13 := (SELECT id FROM thuoc WHERE ma_sku = 'SKU013');
SET @t14 := (SELECT id FROM thuoc WHERE ma_sku = 'SKU014');
SET @t16 := (SELECT id FROM thuoc WHERE ma_sku = 'SKU016');

SET @km1 := (SELECT id FROM khuyen_mai WHERE ma_code = 'CHAOMUNG10');

SET @ncc_dhg    := (SELECT id FROM nha_cung_cap WHERE ten_nha_cung_cap = 'Công ty Dược Hậu Giang');
SET @ncc_sanofi := (SELECT id FROM nha_cung_cap WHERE ten_nha_cung_cap = 'Sanofi Việt Nam');

-- KIỂM TRA: tất cả các giá trị dưới đây phải KHÁC NULL
SELECT @kh1 kh1, @kh2 kh2, @kh3 kh3, @kh4 kh4, @ds2 ds2, @ds3 ds3,
       @nv_ql nv_ql, @nv_ds nv_ds, @nv_kho nv_kho, @km1 km1,
       @ncc_dhg ncc_dhg, @ncc_sanofi ncc_sanofi;
SELECT @t1 t1, @t4 t4, @t5 t5, @t7 t7, @t8 t8, @t9 t9, @t10 t10,
       @t11 t11, @t12 t12, @t13 t13, @t14 t14, @t16 t16;

-- 14.7 PHÁC ĐỒ (NHÓM THUỐC THEO BỆNH) + ĐƠN THUỐC ---------------------------
SET @t2  := (SELECT id FROM thuoc WHERE ma_sku = 'SKU002');
SET @b1  := (SELECT id FROM benh WHERE ma_icd = 'J02');
SET @b2  := (SELECT id FROM benh WHERE ma_icd = 'J22');
SET @b4  := (SELECT id FROM benh WHERE ma_icd = 'I10');

-- Phác đồ 1: Viêm họng cấp
INSERT INTO phac_do (id_benh, ten_phac_do, mo_ta)
VALUES (@b1, 'Phác đồ viêm họng cấp do vi khuẩn', 'Kháng sinh + hạ sốt giảm đau');
SET @pd1 := LAST_INSERT_ID();
INSERT INTO chi_tiet_phac_do (id_phac_do, id_thuoc, so_luong_goi_y, lieu_dung, so_ngay_dung) VALUES
(@pd1, @t2, 1, 'Ngày uống 3 lần, mỗi lần 1 viên sau ăn', 7),
(@pd1, @t1, 1, 'Uống 1 viên khi sốt hoặc đau, cách nhau 4-6 giờ', 3);

-- Phác đồ 2: Nhiễm khuẩn hô hấp dưới (kháng sinh + bảo vệ dạ dày + long đờm)
INSERT INTO phac_do (id_benh, ten_phac_do, mo_ta)
VALUES (@b2, 'Phác đồ nhiễm khuẩn hô hấp dưới', 'Kháng sinh + bảo vệ dạ dày + long đờm');
SET @pd2 := LAST_INSERT_ID();
INSERT INTO chi_tiet_phac_do (id_phac_do, id_thuoc, so_luong_goi_y, lieu_dung, so_ngay_dung) VALUES
(@pd2, @t8,  1, 'Uống 1 viên x 2 lần/ngày sau ăn', 5),
(@pd2, @t7,  2, 'Uống 1 viên/ngày trước bữa sáng 30 phút', 14),
(@pd2, @t11, 1, 'Người lớn 5ml/lần, 3 lần/ngày', 7);

-- Phác đồ 3: Tăng huyết áp kèm đái tháo đường
INSERT INTO phac_do (id_benh, ten_phac_do, mo_ta)
VALUES (@b4, 'Phác đồ tăng huyết áp kèm đái tháo đường type 2', 'Hạ áp + hạ đường huyết, dùng dài ngày');
SET @pd3 := LAST_INSERT_ID();
INSERT INTO chi_tiet_phac_do (id_phac_do, id_thuoc, so_luong_goi_y, lieu_dung, so_ngay_dung) VALUES
(@pd3, @t9,  2, 'Uống 1 viên/ngày vào buổi sáng', 30),
(@pd3, @t10, 1, 'Uống 1 viên x 2 lần/ngày trong bữa ăn', 30);

-- Toa 2: dược sĩ @ds2 kê theo phác đồ 2, @nv_ds duyệt
INSERT INTO don_thuoc (id_khach_hang, id_nhan_vien_ke_don, chan_doan, hinh_anh_don_thuoc, ngay_ke_don, trang_thai)
VALUES (@kh2, @ds2, 'Nhiễm khuẩn hô hấp dưới, kèm trào ngược dạ dày', '/images/don_thuoc/toa_2.jpg', '2026-09-22', 'cho_duyet');
SET @dt2 := LAST_INSERT_ID();
CALL sp_ap_dung_phac_do(@dt2, @pd2);
UPDATE don_thuoc SET trang_thai = 'da_duyet', id_nhan_vien_duyet = @nv_ds, ngay_duyet = NOW(), ghi_chu_duyet = 'Toa hợp lệ'
 WHERE id = @dt2;

-- Toa 3: KH tự upload, chờ duyệt (chưa nhập thuốc, dược sĩ sẽ nhập từ ảnh)
INSERT INTO don_thuoc (id_khach_hang, id_nhan_vien_ke_don, hinh_anh_don_thuoc, ngay_ke_don, trang_thai)
VALUES (@kh3, NULL, '/images/don_thuoc/toa_3.jpg', '2026-09-25', 'cho_duyet');
SET @dt3 := LAST_INSERT_ID();

-- Toa 4: dược sĩ @ds3 kê theo phác đồ 3, @nv_ds duyệt
INSERT INTO don_thuoc (id_khach_hang, id_nhan_vien_ke_don, chan_doan, hinh_anh_don_thuoc, ngay_ke_don, trang_thai)
VALUES (@kh4, @ds3, 'Tăng huyết áp kèm đái tháo đường type 2', '/images/don_thuoc/toa_4.jpg', '2026-09-27', 'cho_duyet');
SET @dt4 := LAST_INSERT_ID();
CALL sp_ap_dung_phac_do(@dt4, @pd3);
UPDATE don_thuoc SET trang_thai = 'da_duyet', id_nhan_vien_duyet = @nv_ds, ngay_duyet = NOW(),
       ghi_chu_duyet = 'Đã đối chiếu chứng chỉ hành nghề của người kê đơn'
 WHERE id = @dt4;

-- Toa 5: bị từ chối (ảnh mờ)
INSERT INTO don_thuoc (id_khach_hang, id_nhan_vien_ke_don, id_benh, chan_doan, hinh_anh_don_thuoc, ngay_ke_don, trang_thai, id_nhan_vien_duyet, ngay_duyet, ghi_chu_duyet)
VALUES (@kh2, @ds2, @b2, 'Nhiễm khuẩn hô hấp dưới', '/images/don_thuoc/toa_5.jpg', '2026-09-28', 'tu_choi', @nv_ds, NOW(), 'Ảnh toa mờ, không đọc được liều dùng');
SET @dt5 := LAST_INSERT_ID();
INSERT INTO chi_tiet_don_thuoc (id_don_thuoc, id_thuoc, so_luong_ke, lieu_dung, so_ngay_dung) VALUES
(@dt5, @t8, 1, 'Không đọc được', NULL),
(@dt5, @t7, 2, 'Không đọc được', NULL);

-- 14.7b PHÁC ĐỒ SỐT + YÊU CẦU KÊ ĐƠN ---------------------------------------------
SET @b_sot := (SELECT id FROM benh WHERE ma_icd = 'R50');

-- Phác đồ 4: Sốt cấp nghi nhiễm khuẩn = hạ sốt + kháng sinh + bù nước + vitamin C
INSERT INTO phac_do (id_benh, ten_phac_do, mo_ta)
VALUES (@b_sot, 'Phác đồ sốt cấp nghi nhiễm khuẩn', 'Hạ sốt + kháng sinh + bù nước điện giải + vitamin C');
SET @pd4 := LAST_INSERT_ID();
INSERT INTO chi_tiet_phac_do (id_phac_do, id_thuoc, so_luong_goi_y, lieu_dung, so_ngay_dung) VALUES
(@pd4, @t1,  1, 'Hạ sốt: uống 1 viên khi sốt hoặc đau, cách nhau 4-6 giờ', 3),
(@pd4, @t2,  1, 'Kháng sinh: ngày uống 3 lần, mỗi lần 1 viên sau ăn', 7),
(@pd4, @t12, 2, 'Bù nước: hòa 1 gói với 200ml nước, uống từng ngụm nhỏ', 3),
(@pd4, @t4,  1, 'Vitamin C: hòa 1 viên sủi với 200ml nước, ngày 1 lần', 10);

-- Yêu cầu 1: khách 3 bị sốt -> dược sĩ @ds3 tiếp nhận -> kê toa 4 thuốc -> @nv_ds duyệt
INSERT INTO yeu_cau_ke_don (id_khach_hang, ten_benh_khai, trieu_chung, thoi_gian_bi_benh, di_ung_thuoc, benh_nen_thuoc_dang_dung, ngay_tao)
VALUES (@kh3, 'Sốt', 'Sốt 38,8°C, đau họng, mệt mỏi, ho nhẹ', '2 ngày', 'Không', 'Không có bệnh nền, không dùng thuốc khác', '2026-10-05 08:30:00');
SET @yc1 := LAST_INSERT_ID();
CALL sp_tiep_nhan_yeu_cau(@yc1, @ds3);
CALL sp_ke_don_tu_yeu_cau(@yc1, @ds3, @b_sot, @pd4, 'Sốt cấp nghi nhiễm khuẩn hô hấp trên', '2026-10-05', 5, @dt6);
UPDATE don_thuoc SET trang_thai = 'da_duyet', id_nhan_vien_duyet = @nv_ds, ngay_duyet = NOW(),
       ghi_chu_duyet = 'Nhóm thuốc phù hợp triệu chứng, khách không dị ứng'
 WHERE id = @dt6;

-- Yêu cầu 2: đang chờ dược sĩ tiếp nhận (hiện trong v_yeu_cau_cho_tiep_nhan)
INSERT INTO yeu_cau_ke_don (id_khach_hang, ten_benh_khai, trieu_chung, thoi_gian_bi_benh, di_ung_thuoc, ngay_tao)
VALUES (@kh1, 'Ho, sổ mũi', 'Ho khan, sổ mũi, hơi sốt nhẹ', '1 ngày', 'Dị ứng Penicillin', '2026-10-06 19:10:00');
SET @yc2 := LAST_INSERT_ID();

-- Yêu cầu 3: bị từ chối vì triệu chứng cần khám trực tiếp
INSERT INTO yeu_cau_ke_don (id_khach_hang, ten_benh_khai, trieu_chung, thoi_gian_bi_benh, ngay_tao)
VALUES (@kh2, 'Đau đầu', 'Đau đầu dữ dội, chóng mặt, buồn nôn kéo dài', '1 tuần', '2026-10-06 21:00:00');
SET @yc3 := LAST_INSERT_ID();
CALL sp_tu_choi_yeu_cau(@yc3, @ds2, 'Triệu chứng kéo dài, cần thăm khám trực tiếp, không kê đơn từ xa');

-- 14.8 ĐƠN ĐẶT THUỐC ------------------------------------------------------------
-- Tạo đơn ở trạng thái cho_xac_nhan -> thêm chi tiết (trigger kiểm tra toa, SL,
-- tồn kho) -> UPDATE sang trạng thái cuối (trigger xuất kho FEFO / không xuất nếu hủy).
INSERT INTO don_dat_thuoc (id_khach_hang, id_don_thuoc, id_khuyen_mai, ngay_dat, tong_tien, giam_gia, thanh_tien, dia_chi_giao_hang, so_dien_thoai_nhan, trang_thai)
VALUES (@kh2, @dt2, NULL, '2026-09-23 09:15:00', 290000.00, 0.00, 290000.00, '45 Nguyễn Huệ, Quận 1, TP.HCM', '0902345678', 'cho_xac_nhan');
SET @dd2 := LAST_INSERT_ID();

INSERT INTO don_dat_thuoc (id_khach_hang, id_don_thuoc, id_khuyen_mai, ngay_dat, tong_tien, giam_gia, thanh_tien, dia_chi_giao_hang, so_dien_thoai_nhan, trang_thai)
VALUES (@kh3, NULL, @km1, '2026-09-24 14:30:00', 145000.00, 14500.00, 130500.00, '12 Trần Phú, Hải Châu, Đà Nẵng', '0903456789', 'cho_xac_nhan');
SET @dd3 := LAST_INSERT_ID();

-- tong_tien = 2*40000 + 1*48000 = 128.000
INSERT INTO don_dat_thuoc (id_khach_hang, id_don_thuoc, id_khuyen_mai, ngay_dat, tong_tien, giam_gia, thanh_tien, dia_chi_giao_hang, so_dien_thoai_nhan, trang_thai)
VALUES (@kh4, @dt4, NULL, '2026-09-28 08:00:00', 128000.00, 0.00, 128000.00, '78 Lý Thường Kiệt, Hoàn Kiếm, Hà Nội', '0904567890', 'cho_xac_nhan');
SET @dd4 := LAST_INSERT_ID();

INSERT INTO don_dat_thuoc (id_khach_hang, id_don_thuoc, id_khuyen_mai, ngay_dat, tong_tien, giam_gia, thanh_tien, dia_chi_giao_hang, so_dien_thoai_nhan, trang_thai)
VALUES (@kh1, NULL, NULL, '2026-09-26 19:45:00', 145000.00, 0.00, 145000.00, '123 Lê Lợi, Quận 1, TP.HCM', '0901234567', 'cho_xac_nhan');
SET @dd5 := LAST_INSERT_ID();

INSERT INTO don_dat_thuoc (id_khach_hang, id_don_thuoc, id_khuyen_mai, ngay_dat, tong_tien, giam_gia, thanh_tien, dia_chi_giao_hang, so_dien_thoai_nhan, trang_thai)
VALUES (@kh2, NULL, NULL, '2026-09-27 10:20:00', 850000.00, 0.00, 850000.00, '45 Nguyễn Huệ, Quận 1, TP.HCM', '0902345678', 'cho_xac_nhan');
SET @dd6 := LAST_INSERT_ID();

UPDATE khuyen_mai SET so_luong_da_dung = so_luong_da_dung + 1 WHERE id = @km1;

INSERT INTO chi_tiet_don_dat (id_don_dat, id_thuoc, so_luong, don_gia) VALUES
(@dd2, @t7,  2,  55000.00),
(@dd2, @t8,  1, 120000.00),
(@dd2, @t4,  1,  60000.00),
(@dd3, @t5,  2,  28000.00),
(@dd3, @t11, 1,  89000.00),
(@dd4, @t9,  2,  40000.00),
(@dd4, @t10, 1,  48000.00),
(@dd5, @t12, 3,  25000.00),
(@dd5, @t14, 2,  35000.00),
(@dd6, @t13, 1, 850000.00);

-- Chuyển trạng thái: trigger tự xuất kho FEFO (dd2, dd3, dd5) hoặc không động đến kho (dd6 hủy khi chưa xuất)
UPDATE don_dat_thuoc SET trang_thai = 'dang_giao'  WHERE id = @dd2;
UPDATE don_dat_thuoc SET trang_thai = 'hoan_thanh' WHERE id = @dd3;
UPDATE don_dat_thuoc SET trang_thai = 'hoan_thanh' WHERE id = @dd5;
UPDATE don_dat_thuoc SET trang_thai = 'da_huy'     WHERE id = @dd6;
-- dd4 giữ nguyên cho_xac_nhan (để test: chưa trừ kho, dược sĩ chưa xác nhận)

INSERT INTO lich_su_theo_doi_don (id_don_dat, trang_thai_cap_nhat, thoi_gian_cap_nhat, ghi_chu) VALUES
(@dd2, 'cho_xac_nhan',  '2026-09-23 09:15:00', 'Khách hàng đặt đơn có toa thuốc'),
(@dd2, 'da_xac_nhan',   '2026-09-23 10:00:00', 'Dược sĩ đã xác nhận toa'),
(@dd2, 'dang_chuan_bi', '2026-09-23 13:00:00', 'Đang đóng gói'),
(@dd2, 'dang_giao',     '2026-09-24 08:30:00', 'Bàn giao cho đơn vị vận chuyển'),
(@dd3, 'cho_xac_nhan',  '2026-09-24 14:30:00', 'Khách hàng đặt đơn mới'),
(@dd3, 'dang_giao',     '2026-09-25 09:00:00', 'Đang giao hàng'),
(@dd3, 'hoan_thanh',    '2026-09-26 16:00:00', 'Giao thành công'),
(@dd4, 'cho_xac_nhan',  '2026-09-28 08:00:00', 'Khách hàng đặt đơn có toa thuốc'),
(@dd5, 'cho_xac_nhan',  '2026-09-26 19:45:00', 'Khách hàng đặt đơn mới'),
(@dd5, 'hoan_thanh',    '2026-09-27 15:00:00', 'Giao thành công'),
(@dd6, 'cho_xac_nhan',  '2026-09-27 10:20:00', 'Khách hàng đặt đơn mới'),
(@dd6, 'da_huy',        '2026-09-27 11:00:00', 'Khách hàng yêu cầu hủy');

INSERT INTO thanh_toan (id_don_dat, phuong_thuc, ma_giao_dich, so_tien, trang_thai, thoi_gian_thanh_toan) VALUES
(@dd2, 'chuyen_khoan', 'VCB20260923001',  290000.00, 'da_thanh_toan',  '2026-09-23 09:20:00'),
(@dd3, 'COD',           NULL,             130500.00, 'da_thanh_toan',  '2026-09-26 16:00:00'),
(@dd4, 'vi_dien_tu',   'MOMO20260928002', 128000.00, 'cho_thanh_toan', NULL),
(@dd5, 'vi_dien_tu',   'MOMO20260926003', 145000.00, 'da_thanh_toan',  '2026-09-26 19:47:00'),
(@dd6, 'chuyen_khoan', 'VCB20260927004',  850000.00, 'da_hoan_tien',   '2026-09-27 10:25:00');

INSERT INTO hoa_don (id_don_dat, so_hoa_don, ngay_xuat, tong_tien_truoc_thue, thue_vat, tong_tien_sau_thue) VALUES
(@dd3, 'HD2026000002', '2026-09-26 16:05:00', 130500.00, 0, 130500.00),
(@dd5, 'HD2026000003', '2026-09-27 15:05:00', 145000.00, 0, 145000.00);

-- 14.9 ĐÁNH GIÁ -------------------------------------------------------------------
INSERT INTO danh_gia (id_khach_hang, id_thuoc, so_sao, noi_dung) VALUES
(@kh2, @t7,  5, 'Đúng thuốc trong toa, đóng gói cẩn thận.'),
(@kh2, @t4,  4, 'Viên sủi dễ uống, vị cam dễ chịu.'),
(@kh3, @t5,  4, 'Giảm nghẹt mũi nhanh nhưng hơi buồn ngủ.'),
(@kh3, @t11, 5, 'Siro ho cho bé hiệu quả, bé dễ uống.'),
(@kh1, @t12, 5, 'Giá rẻ, tiện mang theo đi du lịch.'),
(@kh1, @t14, 3, 'Khẩu trang ổn nhưng hơi mỏng.'),
(@kh3, @t1,  5, 'Paracetamol chính hãng, giao nhanh.');

-- 14.10 NHẬP KHO ------------------------------------------------------------------
-- Trigger tự tạo lô mới và đồng bộ tồn kho. Tổng tiền = tổng (so_luong * gia_nhap).
INSERT INTO phieu_nhap_thuoc (id_nhan_vien, id_nha_cung_cap, ngay_nhap, tong_tien, ghi_chu)
VALUES (@nv_kho, @ncc_sanofi, '2026-09-15 09:00:00', 7250000.00, 'Nhập Vitamin C và siro ho Prospan');
SET @pn2 := LAST_INSERT_ID();

INSERT INTO phieu_nhap_thuoc (id_nhan_vien, id_nha_cung_cap, ngay_nhap, tong_tien, ghi_chu)
VALUES (@nv_kho, @ncc_dhg, '2026-09-20 10:30:00', 2750000.00, 'Nhập bổ sung Amlodipine và Loratadine');
SET @pn3 := LAST_INSERT_ID();

INSERT INTO chi_tiet_phieu_nhap (id_phieu_nhap, id_thuoc, so_luong, gia_nhap, so_lo, han_su_dung) VALUES
(@pn2, @t4,  100, 40000.00, 'L20001', '2027-08-31'),
(@pn2, @t11,  50, 65000.00, 'L20002', '2027-10-31'),
(@pn3, @t9,   50, 25000.00, 'L20003', '2027-09-30'),
(@pn3, @t16, 100, 15000.00, 'L20004', '2027-06-30');

INSERT INTO lich_su_trang_thai_nhap (id_phieu_nhap, trang_thai, thoi_gian_cap_nhat, nguoi_cap_nhat, ghi_chu) VALUES
(@pn2, 'tao_moi',     '2026-09-15 09:00:00', @nv_kho, 'Tạo phiếu nhập'),
(@pn2, 'cho_duyet',   '2026-09-15 09:30:00', @nv_kho, 'Chờ quản lý duyệt'),
(@pn2, 'da_nhap_kho', '2026-09-15 14:00:00', @nv_ql,  'Đã kiểm tra số lượng và hạn dùng'),
(@pn3, 'tao_moi',     '2026-09-20 10:30:00', @nv_kho, 'Tạo phiếu nhập'),
(@pn3, 'da_nhap_kho', '2026-09-20 15:00:00', @nv_ql,  'Nhập kho đủ số lượng');

-- =========================================================================
-- 15. KIỂM THỬ NGHIỆP VỤ (bỏ comment từng khối; lệnh "PHẢI LỖI" sẽ báo SQLSTATE 45000)
-- =========================================================================
-- Xem toa gồm những thuốc nào, thuộc bệnh gì, còn được mua bao nhiêu:
--   SELECT id_don_thuoc, ten_benh, chan_doan, ten_thuoc, so_luong_ke, da_mua, con_lai FROM v_toa_con_lai;
--
-- (a) Mua vượt SL kê -> PHẢI LỖI "Vượt số lượng được kê..."
--     (toa dt2 kê Omeprazole x2, đơn dd2 đã mua đủ 2)
--   INSERT INTO don_dat_thuoc (id_khach_hang, id_don_thuoc, ngay_dat, tong_tien, thanh_tien, dia_chi_giao_hang)
--     VALUES (@kh2, @dt2, '2026-09-24 08:00:00', 55000, 55000, 'test');
--   INSERT INTO chi_tiet_don_dat (id_don_dat, id_thuoc, so_luong, don_gia)
--     VALUES (LAST_INSERT_ID(), @t7, 1, 55000);
--
-- (b) Thuốc không nằm trong toa -> PHẢI LỖI "không nằm trong đơn thuốc"
--     (toa dt4 chỉ có Amlodipine/Metformin, thử thêm Cefuroxime vào đơn dd4)
--   INSERT INTO chi_tiet_don_dat (id_don_dat, id_thuoc, so_luong, don_gia) VALUES (@dd4, @t8, 1, 120000);
--
-- (c) Toa của người khác -> PHẢI LỖI "không thuộc về khách hàng"
-- (d) Toa chờ duyệt (dt3) / bị từ chối (dt5) -> PHẢI LỖI "chưa được dược sĩ duyệt"
-- (e) Toa quá hạn: đặt ngay_dat sau ngay_ke_don + so_ngay_hieu_luc -> PHẢI LỖI "hết thời hạn hiệu lực"
--
-- (f) Xuất kho khi xác nhận + hoàn kho khi hủy:
--   SELECT id_thuoc, so_lo, so_luong_ton FROM v_ton_kho_theo_lo WHERE id_thuoc IN (@t9, @t10);
--   UPDATE don_dat_thuoc SET trang_thai = 'da_xac_nhan' WHERE id = @dd4;   -- trừ kho FEFO
--   SELECT * FROM chi_tiet_xuat_lo WHERE id_don_dat = @dd4;                -- lô đã lấy
--   UPDATE don_dat_thuoc SET trang_thai = 'da_huy' WHERE id = @dd4;        -- hoàn kho đúng lô
--   SELECT id_thuoc, so_lo, so_luong_ton FROM v_ton_kho_theo_lo WHERE id_thuoc IN (@t9, @t10);
--
-- (g) Người kê tự duyệt toa của mình -> PHẢI LỖI "không được tự duyệt"
--   UPDATE don_thuoc SET id_nhan_vien_duyet = id_nhan_vien_ke_don WHERE id = @dt2;
--
-- (h) Duyệt toa 3 khi chưa có thuốc / chưa có chẩn đoán -> PHẢI LỖI
--   UPDATE don_thuoc SET trang_thai = 'da_duyet', id_nhan_vien_duyet = @nv_ds WHERE id = @dt3;
--
-- (i) Thêm thuốc vào toa đã duyệt -> PHẢI LỖI "Toa đã duyệt, không thể thêm thuốc"
--   INSERT INTO chi_tiet_don_thuoc (id_don_thuoc, id_thuoc, so_luong_ke) VALUES (@dt2, @t5, 1);
--
-- (k) Luồng yêu cầu kê đơn: xem hàng đợi và kết quả
--   SELECT * FROM v_yeu_cau_cho_tiep_nhan;
--   SELECT * FROM v_yeu_cau_ke_don;
--   Xử lý yêu cầu 2 (khách dị ứng Penicillin -> dược sĩ nên kê kháng sinh khác, kê tay):
--   CALL sp_tiep_nhan_yeu_cau(@yc2, @ds2);
--   CALL sp_ke_don_tu_yeu_cau(@yc2, @ds2, @b_sot, NULL, 'Cảm cúm, sốt nhẹ', CURDATE(), 5, @dt7);
--   INSERT INTO chi_tiet_don_thuoc (id_don_thuoc, id_thuoc, so_luong_ke, lieu_dung, so_ngay_dung) VALUES
--     (@dt7, @t1, 1, 'Hạ sốt khi cần', 3), (@dt7, @t5, 1, 'Giảm nghẹt mũi, sổ mũi', 5);
--   UPDATE don_thuoc SET trang_thai='da_duyet', id_nhan_vien_duyet=@nv_ds WHERE id=@dt7;
--
-- (l) PHẢI LỖI: nhân viên không phải dược sĩ tiếp nhận yêu cầu
--   CALL sp_tiep_nhan_yeu_cau(@yc2, @nv_kho);
-- (m) PHẢI LỖI: dược sĩ khác (không phải người tiếp nhận) kê toa
--   CALL sp_tiep_nhan_yeu_cau(@yc2, @ds2);
--   CALL sp_ke_don_tu_yeu_cau(@yc2, @ds3, @b_sot, @pd4, 'x', CURDATE(), 5, @dt8);
-- (n) PHẢI LỖI: mở lại yêu cầu đã từ chối
--   UPDATE yeu_cau_ke_don SET trang_thai = 'cho_tiep_nhan' WHERE id = @yc3;
--
-- (j) Xem nhóm thuốc của từng phác đồ:
--   SELECT b.ten_benh, p.ten_phac_do, t.ten_thuoc, c.so_luong_goi_y, c.lieu_dung
--     FROM phac_do p JOIN benh b ON b.id = p.id_benh
--     JOIN chi_tiet_phac_do c ON c.id_phac_do = p.id
--     JOIN thuoc t ON t.id = c.id_thuoc ORDER BY p.id;

-- =========================================================================
-- 16. KIỂM TRA NHANH
-- =========================================================================
SELECT * FROM thuoc;
SELECT * FROM lo_thuoc;
SELECT * FROM chi_tiet_xuat_lo;
SELECT * FROM benh;
SELECT * FROM v_yeu_cau_ke_don;
SELECT * FROM v_yeu_cau_cho_tiep_nhan;
SELECT * FROM phac_do;
SELECT * FROM v_toa_con_lai;
SELECT * FROM don_dat_thuoc;
SELECT * FROM thanh_toan;
SELECT * FROM hoa_don;
SELECT * FROM v_thuoc_ke_don;
SELECT * FROM v_thuoc_sap_het_han;















-- =========================================================================
-- DỮ LIỆU MẪU BỔ SUNG CHO doan4 (schema v5)  -  khoảng 20 dòng mỗi chức năng
--
-- CÁCH CHẠY: chạy file schema v5 trước, rồi chạy file này TỪ ĐẦU ĐẾN CUỐI
-- trong CÙNG 1 PHIÊN (dùng biến @...). Không dùng ID cứng, mọi ID tra theo
-- khóa tự nhiên (username, mã SKU, mã ICD, mã khuyến mãi...).
-- File này KHÔNG có DROP DATABASE, chỉ INSERT thêm.
--
-- Số lượng thêm:
--   Khách hàng 20 (kèm tài khoản)      Nhân viên 6 (3 dược sĩ, 3 nhân viên)
--   Nhà cung cấp 15                    Danh mục thuốc 7
--   Thuốc 20 (+mô tả 20, ảnh 40, lô 19)  Bệnh 15
--   Phác đồ 15 (+41 chi tiết)          Khuyến mãi 15
--   Giỏ hàng 20                        Phiếu nhập kho 20 (+lịch sử 40)
--   Yêu cầu kê đơn 22                  Toa thuốc 20 (15 từ yêu cầu + 5 KH upload)
--   Đơn đặt thuốc 21                   Thanh toán 21, Hóa đơn 11
--   Lịch sử theo dõi đơn (tự sinh)     Đánh giá 20
--
-- Lưu ý: mật khẩu chữ thường, bệnh/phác đồ/liều dùng chỉ để DEMO.
-- Mã số thuế, SĐT, email của nhà cung cấp/khách hàng là dữ liệu giả.
-- =========================================================================

USE doan4;
SET NAMES utf8mb4;

-- =========================================================================
-- 0. TRA CỨU ID CÁC DỮ LIỆU CŨ
-- =========================================================================
SET @vt_kh := (SELECT id FROM vai_tro WHERE ten_vai_tro = 'khach_hang');
SET @vt_ql := (SELECT id FROM vai_tro WHERE ten_vai_tro = 'nv_quan_ly');
SET @vt_ds := (SELECT id FROM vai_tro WHERE ten_vai_tro = 'duoc_si');

SET @nv_ql  := (SELECT n.id FROM nhan_vien n JOIN tai_khoan t ON t.id = n.id_tai_khoan WHERE t.ten_dang_nhap = 'nhanvien1');
SET @nv_ds  := (SELECT n.id FROM nhan_vien n JOIN tai_khoan t ON t.id = n.id_tai_khoan WHERE t.ten_dang_nhap = 'duocsi1');
SET @ds2    := (SELECT n.id FROM nhan_vien n JOIN tai_khoan t ON t.id = n.id_tai_khoan WHERE t.ten_dang_nhap = 'duocsi2');
SET @ds3    := (SELECT n.id FROM nhan_vien n JOIN tai_khoan t ON t.id = n.id_tai_khoan WHERE t.ten_dang_nhap = 'duocsi3');
SET @nv_kho := (SELECT n.id FROM nhan_vien n JOIN tai_khoan t ON t.id = n.id_tai_khoan WHERE t.ten_dang_nhap = 'nhanvien2');

SET @t1  := (SELECT id FROM thuoc WHERE ma_sku = 'SKU001'),
    @t2  := (SELECT id FROM thuoc WHERE ma_sku = 'SKU002'),
    @t4  := (SELECT id FROM thuoc WHERE ma_sku = 'SKU004'),
    @t5  := (SELECT id FROM thuoc WHERE ma_sku = 'SKU005'),
    @t6  := (SELECT id FROM thuoc WHERE ma_sku = 'SKU006'),
    @t7  := (SELECT id FROM thuoc WHERE ma_sku = 'SKU007'),
    @t8  := (SELECT id FROM thuoc WHERE ma_sku = 'SKU008'),
    @t9  := (SELECT id FROM thuoc WHERE ma_sku = 'SKU009'),
    @t10 := (SELECT id FROM thuoc WHERE ma_sku = 'SKU010'),
    @t11 := (SELECT id FROM thuoc WHERE ma_sku = 'SKU011'),
    @t12 := (SELECT id FROM thuoc WHERE ma_sku = 'SKU012'),
    @t13 := (SELECT id FROM thuoc WHERE ma_sku = 'SKU013'),
    @t14 := (SELECT id FROM thuoc WHERE ma_sku = 'SKU014'),
    @t15 := (SELECT id FROM thuoc WHERE ma_sku = 'SKU015'),
    @t16 := (SELECT id FROM thuoc WHERE ma_sku = 'SKU016');

SET @ncc_dhg     := (SELECT id FROM nha_cung_cap WHERE ten_nha_cung_cap = 'Công ty Dược Hậu Giang'),
    @ncc_imex    := (SELECT id FROM nha_cung_cap WHERE ten_nha_cung_cap = 'Công ty CP Imexpharm'),
    @ncc_domesco := (SELECT id FROM nha_cung_cap WHERE ten_nha_cung_cap = 'Công ty CP Domesco');

SET @dm5 := (SELECT id FROM danh_muc_thuoc WHERE ten_danh_muc = 'Thuốc tiêu hóa'),
    @dm6 := (SELECT id FROM danh_muc_thuoc WHERE ten_danh_muc = 'Thuốc ho - cảm cúm - dị ứng'),
    @dm8 := (SELECT id FROM danh_muc_thuoc WHERE ten_danh_muc = 'Dụng cụ y tế');

SET @km_cm10 := (SELECT id FROM khuyen_mai WHERE ma_code = 'CHAOMUNG10'),
    @km_g20  := (SELECT id FROM khuyen_mai WHERE ma_code = 'GIAM20K'),
    @km_fs15 := (SELECT id FROM khuyen_mai WHERE ma_code = 'FREESHIP15');

-- =========================================================================
-- 1. TÀI KHOẢN + KHÁCH HÀNG (20) + NHÂN VIÊN (6)
-- =========================================================================
INSERT INTO tai_khoan (ten_dang_nhap, mat_khau, id_vai_tro, trang_thai) VALUES
('khachhang5',  '123456', @vt_kh, 1), ('khachhang6',  '123456', @vt_kh, 1),
('khachhang7',  '123456', @vt_kh, 1), ('khachhang8',  '123456', @vt_kh, 1),
('khachhang9',  '123456', @vt_kh, 1), ('khachhang10', '123456', @vt_kh, 1),
('khachhang11', '123456', @vt_kh, 1), ('khachhang12', '123456', @vt_kh, 1),
('khachhang13', '123456', @vt_kh, 1), ('khachhang14', '123456', @vt_kh, 1),
('khachhang15', '123456', @vt_kh, 1), ('khachhang16', '123456', @vt_kh, 1),
('khachhang17', '123456', @vt_kh, 1), ('khachhang18', '123456', @vt_kh, 1),
('khachhang19', '123456', @vt_kh, 1), ('khachhang20', '123456', @vt_kh, 1),
('khachhang21', '123456', @vt_kh, 1), ('khachhang22', '123456', @vt_kh, 1),
('khachhang23', '123456', @vt_kh, 1), ('khachhang24', '123456', @vt_kh, 1),
('duocsi4',   '123456', @vt_ds, 1), ('duocsi5',   '123456', @vt_ds, 1),
('duocsi6',   '123456', @vt_ds, 1),
('nhanvien3', '123456', @vt_ql, 1), ('nhanvien4', '123456', @vt_ql, 1),
('nhanvien5', '123456', @vt_ql, 1);

INSERT INTO khach_hang (id_tai_khoan, ho_ten, so_dien_thoai, email, dia_chi, ngay_sinh) VALUES
((SELECT id FROM tai_khoan WHERE ten_dang_nhap='khachhang5'),  'Nguyễn Thị Hoa',     '0905123456', 'hoa.nguyen@gmail.com',    '23 Hai Bà Trưng, Quận 3, TP.HCM',               '1992-02-14'),
((SELECT id FROM tai_khoan WHERE ten_dang_nhap='khachhang6'),  'Trần Văn Tuấn',      '0906234567', 'tuan.tran@gmail.com',     '56 Lê Duẩn, Hải Châu, Đà Nẵng',                 '1985-08-30'),
((SELECT id FROM tai_khoan WHERE ten_dang_nhap='khachhang7'),  'Lê Thị Thu Hà',      '0907345678', 'ha.le@gmail.com',         '89 Nguyễn Trãi, Thanh Xuân, Hà Nội',            '1979-12-05'),
((SELECT id FROM tai_khoan WHERE ten_dang_nhap='khachhang8'),  'Phạm Minh Đức',      '0908456789', 'duc.pham@gmail.com',      '14 Trần Hưng Đạo, Ninh Kiều, Cần Thơ',          '1996-04-17'),
((SELECT id FROM tai_khoan WHERE ten_dang_nhap='khachhang9'),  'Hoàng Thị Lan Anh',  '0909567890', 'lananh.hoang@gmail.com',  '102 Phan Chu Trinh, Nha Trang, Khánh Hòa',      '1983-09-09'),
((SELECT id FROM tai_khoan WHERE ten_dang_nhap='khachhang10'), 'Vũ Đình Khoa',       '0911678901', 'khoa.vu@gmail.com',       '7 Nguyễn Văn Linh, Quận 7, TP.HCM',             '1990-01-25'),
((SELECT id FROM tai_khoan WHERE ten_dang_nhap='khachhang11'), 'Đặng Thị Ngọc',      '0912789012', 'ngoc.dang@gmail.com',     '45 Điện Biên Phủ, Bình Thạnh, TP.HCM',          '1975-06-11'),
((SELECT id FROM tai_khoan WHERE ten_dang_nhap='khachhang12'), 'Bùi Quang Huy',      '0913890123', 'huy.bui@gmail.com',       '30 Lê Lợi, Huế, Thừa Thiên Huế',                '1998-10-02'),
((SELECT id FROM tai_khoan WHERE ten_dang_nhap='khachhang13'), 'Đỗ Thị Phương',      '0914901234', 'phuong.do@gmail.com',     '18 Hùng Vương, Hồng Bàng, Hải Phòng',           '1987-03-28'),
((SELECT id FROM tai_khoan WHERE ten_dang_nhap='khachhang14'), 'Ngô Văn Long',       '0915012345', 'long.ngo@gmail.com',      '66 Trần Phú, Biên Hòa, Đồng Nai',               '1969-07-19'),
((SELECT id FROM tai_khoan WHERE ten_dang_nhap='khachhang15'), 'Dương Thị Hạnh',     '0916123456', 'hanh.duong@gmail.com',    '12 Nguyễn Thái Học, Vinh, Nghệ An',             '1993-11-23'),
((SELECT id FROM tai_khoan WHERE ten_dang_nhap='khachhang16'), 'Lý Văn Thành',       '0917234567', 'thanh.ly@gmail.com',      '81 Lý Tự Trọng, Quận 1, TP.HCM',                '1982-05-06'),
((SELECT id FROM tai_khoan WHERE ten_dang_nhap='khachhang17'), 'Trịnh Thị Mỹ',       '0918345678', 'my.trinh@gmail.com',      '25 Hoàng Diệu, Ba Đình, Hà Nội',                '2000-02-12'),
((SELECT id FROM tai_khoan WHERE ten_dang_nhap='khachhang18'), 'Phan Thanh Sơn',     '0919456789', 'son.phan@gmail.com',      '9 Pasteur, Quận 3, TP.HCM',                     '1991-09-15'),
((SELECT id FROM tai_khoan WHERE ten_dang_nhap='khachhang19'), 'Võ Thị Kim Chi',     '0921567890', 'chi.vo@gmail.com',        '40 Nguyễn Du, Buôn Ma Thuột, Đắk Lắk',          '1986-12-31'),
((SELECT id FROM tai_khoan WHERE ten_dang_nhap='khachhang20'), 'Đinh Công Minh',     '0922678901', 'minh.dinh@gmail.com',     '77 Hai Bà Trưng, Hoàn Kiếm, Hà Nội',            '1972-04-08'),
((SELECT id FROM tai_khoan WHERE ten_dang_nhap='khachhang21'), 'Mai Thị Thảo',       '0923789012', 'thao.mai@gmail.com',      '5 Bạch Đằng, Hải Châu, Đà Nẵng',                '1995-08-21'),
((SELECT id FROM tai_khoan WHERE ten_dang_nhap='khachhang22'), 'Tô Văn Hải',         '0924890123', 'hai.to@gmail.com',        '33 Lê Hồng Phong, Vũng Tàu, Bà Rịa - Vũng Tàu', '1978-01-16'),
((SELECT id FROM tai_khoan WHERE ten_dang_nhap='khachhang23'), 'Châu Thị Yến',       '0925901234', 'yen.chau@gmail.com',      '60 Cách Mạng Tháng 8, Quận 10, TP.HCM',         '1989-10-27'),
((SELECT id FROM tai_khoan WHERE ten_dang_nhap='khachhang24'), 'Lưu Quốc Tuấn',      '0926012345', 'tuan.luu@gmail.com',      '21 Nguyễn Văn Cừ, Long Biên, Hà Nội',           '1994-06-03');

INSERT INTO nhan_vien (id_tai_khoan, ho_ten, so_dien_thoai, email, chuyen_khoa, so_chung_chi_hanh_nghe) VALUES
((SELECT id FROM tai_khoan WHERE ten_dang_nhap='duocsi4'),   'Trần Hữu Phước',   '0917111222', 'duocsi4@nhathuoc.com',   'Nhi khoa',            'CCHN-07812'),
((SELECT id FROM tai_khoan WHERE ten_dang_nhap='duocsi5'),   'Lâm Thị Bích',     '0917222333', 'duocsi5@nhathuoc.com',   'Da liễu - Dị ứng',    'CCHN-08345'),
((SELECT id FROM tai_khoan WHERE ten_dang_nhap='duocsi6'),   'Hồ Quang Vinh',    '0917333444', 'duocsi6@nhathuoc.com',   'Hô hấp',              'CCHN-09120'),
((SELECT id FROM tai_khoan WHERE ten_dang_nhap='nhanvien3'), 'Nguyễn Thành Kho', '0917444555', 'kho2@nhathuoc.com',      NULL, NULL),
((SELECT id FROM tai_khoan WHERE ten_dang_nhap='nhanvien4'), 'Trương Thị Kho',   '0917555666', 'kho3@nhathuoc.com',      NULL, NULL),
((SELECT id FROM tai_khoan WHERE ten_dang_nhap='nhanvien5'), 'Phan Văn Quản',    '0917666777', 'quanly2@nhathuoc.com',   NULL, NULL);

-- Biến khách hàng
SET @kh1 := (SELECT kh.id FROM khach_hang kh JOIN tai_khoan t ON t.id = kh.id_tai_khoan WHERE t.ten_dang_nhap = 'khachhang1'),
    @kh2 := (SELECT kh.id FROM khach_hang kh JOIN tai_khoan t ON t.id = kh.id_tai_khoan WHERE t.ten_dang_nhap = 'khachhang2'),
    @kh3 := (SELECT kh.id FROM khach_hang kh JOIN tai_khoan t ON t.id = kh.id_tai_khoan WHERE t.ten_dang_nhap = 'khachhang3'),
    @kh4 := (SELECT kh.id FROM khach_hang kh JOIN tai_khoan t ON t.id = kh.id_tai_khoan WHERE t.ten_dang_nhap = 'khachhang4'),
    @kh5  := (SELECT kh.id FROM khach_hang kh JOIN tai_khoan t ON t.id = kh.id_tai_khoan WHERE t.ten_dang_nhap = 'khachhang5'),
    @kh6  := (SELECT kh.id FROM khach_hang kh JOIN tai_khoan t ON t.id = kh.id_tai_khoan WHERE t.ten_dang_nhap = 'khachhang6'),
    @kh7  := (SELECT kh.id FROM khach_hang kh JOIN tai_khoan t ON t.id = kh.id_tai_khoan WHERE t.ten_dang_nhap = 'khachhang7'),
    @kh8  := (SELECT kh.id FROM khach_hang kh JOIN tai_khoan t ON t.id = kh.id_tai_khoan WHERE t.ten_dang_nhap = 'khachhang8'),
    @kh9  := (SELECT kh.id FROM khach_hang kh JOIN tai_khoan t ON t.id = kh.id_tai_khoan WHERE t.ten_dang_nhap = 'khachhang9'),
    @kh10 := (SELECT kh.id FROM khach_hang kh JOIN tai_khoan t ON t.id = kh.id_tai_khoan WHERE t.ten_dang_nhap = 'khachhang10'),
    @kh11 := (SELECT kh.id FROM khach_hang kh JOIN tai_khoan t ON t.id = kh.id_tai_khoan WHERE t.ten_dang_nhap = 'khachhang11'),
    @kh12 := (SELECT kh.id FROM khach_hang kh JOIN tai_khoan t ON t.id = kh.id_tai_khoan WHERE t.ten_dang_nhap = 'khachhang12'),
    @kh13 := (SELECT kh.id FROM khach_hang kh JOIN tai_khoan t ON t.id = kh.id_tai_khoan WHERE t.ten_dang_nhap = 'khachhang13'),
    @kh14 := (SELECT kh.id FROM khach_hang kh JOIN tai_khoan t ON t.id = kh.id_tai_khoan WHERE t.ten_dang_nhap = 'khachhang14'),
    @kh15 := (SELECT kh.id FROM khach_hang kh JOIN tai_khoan t ON t.id = kh.id_tai_khoan WHERE t.ten_dang_nhap = 'khachhang15'),
    @kh16 := (SELECT kh.id FROM khach_hang kh JOIN tai_khoan t ON t.id = kh.id_tai_khoan WHERE t.ten_dang_nhap = 'khachhang16'),
    @kh17 := (SELECT kh.id FROM khach_hang kh JOIN tai_khoan t ON t.id = kh.id_tai_khoan WHERE t.ten_dang_nhap = 'khachhang17'),
    @kh18 := (SELECT kh.id FROM khach_hang kh JOIN tai_khoan t ON t.id = kh.id_tai_khoan WHERE t.ten_dang_nhap = 'khachhang18'),
    @kh19 := (SELECT kh.id FROM khach_hang kh JOIN tai_khoan t ON t.id = kh.id_tai_khoan WHERE t.ten_dang_nhap = 'khachhang19'),
    @kh20 := (SELECT kh.id FROM khach_hang kh JOIN tai_khoan t ON t.id = kh.id_tai_khoan WHERE t.ten_dang_nhap = 'khachhang20'),
    @kh21 := (SELECT kh.id FROM khach_hang kh JOIN tai_khoan t ON t.id = kh.id_tai_khoan WHERE t.ten_dang_nhap = 'khachhang21'),
    @kh22 := (SELECT kh.id FROM khach_hang kh JOIN tai_khoan t ON t.id = kh.id_tai_khoan WHERE t.ten_dang_nhap = 'khachhang22'),
    @kh23 := (SELECT kh.id FROM khach_hang kh JOIN tai_khoan t ON t.id = kh.id_tai_khoan WHERE t.ten_dang_nhap = 'khachhang23'),
    @kh24 := (SELECT kh.id FROM khach_hang kh JOIN tai_khoan t ON t.id = kh.id_tai_khoan WHERE t.ten_dang_nhap = 'khachhang24');

-- Biến nhân viên mới
SET @ds4      := (SELECT n.id FROM nhan_vien n JOIN tai_khoan t ON t.id = n.id_tai_khoan WHERE t.ten_dang_nhap = 'duocsi4'),
    @ds5      := (SELECT n.id FROM nhan_vien n JOIN tai_khoan t ON t.id = n.id_tai_khoan WHERE t.ten_dang_nhap = 'duocsi5'),
    @ds6      := (SELECT n.id FROM nhan_vien n JOIN tai_khoan t ON t.id = n.id_tai_khoan WHERE t.ten_dang_nhap = 'duocsi6'),
    @nv_kho2  := (SELECT n.id FROM nhan_vien n JOIN tai_khoan t ON t.id = n.id_tai_khoan WHERE t.ten_dang_nhap = 'nhanvien3'),
    @nv_kho3  := (SELECT n.id FROM nhan_vien n JOIN tai_khoan t ON t.id = n.id_tai_khoan WHERE t.ten_dang_nhap = 'nhanvien4'),
    @nv_ql2   := (SELECT n.id FROM nhan_vien n JOIN tai_khoan t ON t.id = n.id_tai_khoan WHERE t.ten_dang_nhap = 'nhanvien5');

-- =========================================================================
-- 2. NHÀ CUNG CẤP (15) + DANH MỤC THUỐC (7)
-- =========================================================================
INSERT INTO nha_cung_cap (ten_nha_cung_cap, ma_so_thue, so_dien_thoai, email, dia_chi, nguoi_lien_he, trang_thai) VALUES
('Công ty CP Dược phẩm OPC',                 '0301000001', '02838123456', 'info@opc.example.vn',       '1017 Hồng Bàng, Quận 6, TP.HCM',          'Nguyễn Minh Tuấn', 1),
('Công ty CP Pymepharco',                    '4200100002', '02573823569', 'info@pyme.example.vn',      '166 Nguyễn Huệ, Tuy Hòa, Phú Yên',        'Lê Thị Hồng',      1),
('Công ty TNHH Stada Việt Nam',              '3700100003', '02743767470', 'contact@stada.example.vn',  'VSIP, Thuận An, Bình Dương',              'Phạm Quốc Việt',   1),
('Công ty CP Dược phẩm Trung ương Pharbaco', '0100100004', '02438251422', 'info@pharbaco.example.vn',  '160 Tôn Đức Thắng, Đống Đa, Hà Nội',      'Đỗ Thanh Hà',      1),
('Công ty CP Dược - Vật tư y tế Bidiphar',   '4100100005', '02563846500', 'info@bidiphar.example.vn',  '498 Nguyễn Thái Học, Quy Nhơn, Bình Định','Võ Văn Bình',      1),
('Công ty CP Dược phẩm Mekophar',            '0300100006', '02838653416', 'info@mekophar.example.vn',  '297/5 Lý Thường Kiệt, Quận 11, TP.HCM',   'Trần Thị Mai',     1),
('Công ty CP Dược phẩm Sao Kim',             '0100100007', '02439433866', 'info@saokim.example.vn',    '33 Phố Huế, Hai Bà Trưng, Hà Nội',        'Lương Văn Sơn',    1),
('Công ty CP Dược Hà Tây (Hataphar)',        '0500100008', '02433824685', 'info@hataphar.example.vn',  '10A Quang Trung, Hà Đông, Hà Nội',        'Nguyễn Thị Lụa',   1),
('Công ty CP Dược phẩm Vinphaco',            '2500100009', '02113862351', 'info@vinphaco.example.vn',  '777 Mê Linh, Vĩnh Yên, Vĩnh Phúc',        'Hoàng Đức Anh',    1),
('Công ty TNHH Thiết bị y tế An Phú',        '0300100010', '02839300123', 'sales@anphu.example.vn',    '88 Cộng Hòa, Tân Bình, TP.HCM',           'Bùi Thanh Tùng',   1),
('Công ty CP Dược Trà Vinh (TV.Pharm)',      '2100100011', '02943862700', 'info@tvpharm.example.vn',   '27 Nguyễn Chí Thanh, Trà Vinh',           'Châu Minh Hiếu',   1),
('Công ty CP Dược phẩm Pharmedic',           '0300100012', '02838551400', 'info@pharmedic.example.vn', '367 Nguyễn Trãi, Quận 1, TP.HCM',         'Lý Thị Kim',       1),
('Công ty CP Dược phẩm Euvipharm',           '1100100013', '02723836141', 'info@euvi.example.vn',      'Ấp Bình Tiền 2, Đức Hòa, Long An',        'Trịnh Văn Nam',    1),
('Công ty CP Dược phẩm Nadyphar',            '0300100014', '02838254789', 'info@nadyphar.example.vn',  '12 Phan Đăng Lưu, Phú Nhuận, TP.HCM',     'Đặng Thị Oanh',    0),
('Công ty TNHH Dược phẩm Hasan - Dermapharm','3600100015', '02513836128', 'info@hasan.example.vn',     'Đường số 2, KCN Đồng Nai, Biên Hòa',      'Phan Thị Thu',     1);

INSERT INTO danh_muc_thuoc (ten_danh_muc, mo_ta) VALUES
('Thuốc xương khớp - giảm đau cơ',        'Giảm đau, kháng viêm cơ xương khớp, miếng dán giảm đau'),
('Thuốc da liễu',                         'Kem bôi, dung dịch sát khuẩn, thuốc trị nấm và nhiễm khuẩn da'),
('Thuốc nhỏ mắt, mũi, tai',               'Dung dịch nhỏ/xịt dùng tại chỗ cho mắt, mũi, tai'),
('Thuốc hô hấp - hen suyễn',              'Thuốc giãn phế quản, long đờm, hỗ trợ hô hấp'),
('Thuốc kháng nấm - ký sinh trùng',       'Thuốc trị nấm, giun sán'),
('Chăm sóc răng miệng',                   'Kem đánh răng, nước súc miệng'),
('Sản phẩm mẹ và bé',                     'Vitamin, khoáng chất và sản phẩm chăm sóc cho trẻ nhỏ');

SET @n1  := (SELECT id FROM nha_cung_cap WHERE ten_nha_cung_cap = 'Công ty CP Dược phẩm OPC'),
    @n2  := (SELECT id FROM nha_cung_cap WHERE ten_nha_cung_cap = 'Công ty CP Pymepharco'),
    @n3  := (SELECT id FROM nha_cung_cap WHERE ten_nha_cung_cap = 'Công ty TNHH Stada Việt Nam'),
    @n4  := (SELECT id FROM nha_cung_cap WHERE ten_nha_cung_cap = 'Công ty CP Dược phẩm Trung ương Pharbaco'),
    @n5  := (SELECT id FROM nha_cung_cap WHERE ten_nha_cung_cap = 'Công ty CP Dược - Vật tư y tế Bidiphar'),
    @n6  := (SELECT id FROM nha_cung_cap WHERE ten_nha_cung_cap = 'Công ty CP Dược phẩm Mekophar'),
    @n7  := (SELECT id FROM nha_cung_cap WHERE ten_nha_cung_cap = 'Công ty CP Dược phẩm Sao Kim'),
    @n8  := (SELECT id FROM nha_cung_cap WHERE ten_nha_cung_cap = 'Công ty CP Dược Hà Tây (Hataphar)'),
    @n9  := (SELECT id FROM nha_cung_cap WHERE ten_nha_cung_cap = 'Công ty CP Dược phẩm Vinphaco'),
    @n10 := (SELECT id FROM nha_cung_cap WHERE ten_nha_cung_cap = 'Công ty TNHH Thiết bị y tế An Phú');

SET @dm9  := (SELECT id FROM danh_muc_thuoc WHERE ten_danh_muc = 'Thuốc xương khớp - giảm đau cơ'),
    @dm10 := (SELECT id FROM danh_muc_thuoc WHERE ten_danh_muc = 'Thuốc da liễu'),
    @dm11 := (SELECT id FROM danh_muc_thuoc WHERE ten_danh_muc = 'Thuốc nhỏ mắt, mũi, tai'),
    @dm12 := (SELECT id FROM danh_muc_thuoc WHERE ten_danh_muc = 'Thuốc hô hấp - hen suyễn'),
    @dm13 := (SELECT id FROM danh_muc_thuoc WHERE ten_danh_muc = 'Thuốc kháng nấm - ký sinh trùng'),
    @dm14 := (SELECT id FROM danh_muc_thuoc WHERE ten_danh_muc = 'Chăm sóc răng miệng'),
    @dm15 := (SELECT id FROM danh_muc_thuoc WHERE ten_danh_muc = 'Sản phẩm mẹ và bé');

-- =========================================================================
-- 3. THUỐC (20) + MÔ TẢ + ẢNH + LÔ TỒN ĐẦU KỲ
--    so_luong_ton / han_su_dung của bảng thuoc do trigger tự đồng bộ từ lô.
-- =========================================================================
INSERT INTO thuoc (ma_sku, ten_thuoc, id_danh_muc, id_nha_cung_cap, loai_ke_don, so_dang_ky, don_vi_tinh, gia_ban) VALUES
('SKU017', 'Diclofenac 50mg',                    @dm9,  @n1,  'ke_don',       'VD-30101-18', 'Hộp',   38000.00),
('SKU018', 'Meloxicam 7.5mg',                    @dm9,  @n1,  'ke_don',       'VD-30102-18', 'Hộp',   52000.00),
('SKU019', 'Glucosamine 1500mg',                 @dm9,  @n2,  'khong_ke_don', 'VD-30103-19', 'Hộp',  185000.00),
('SKU020', 'Miếng dán giảm đau Salonpas',        @dm9,  @n2,  'khong_ke_don', 'VD-30104-19', 'Hộp',   32000.00),
('SKU021', 'Clotrimazole 1% kem bôi',            @dm10, @n3,  'khong_ke_don', 'VD-30105-17', 'Tuýp',  22000.00),
('SKU022', 'Povidone Iod 10% (Betadine)',        @dm10, @n3,  'khong_ke_don', 'VD-30106-17', 'Chai',  38000.00),
('SKU023', 'Mupirocin 2% mỡ bôi da',             @dm10, @n4,  'ke_don',       'VD-30107-20', 'Tuýp',  65000.00),
('SKU024', 'Natri clorid 0,9% nhỏ mắt, mũi',     @dm11, @n4,  'khong_ke_don', 'VD-30108-16', 'Lọ',     6000.00),
('SKU025', 'Tobramycin 0,3% nhỏ mắt',            @dm11, @n5,  'ke_don',       'VD-30109-18', 'Lọ',    45000.00),
('SKU026', 'Xylometazolin 0,1% xịt mũi',         @dm11, @n5,  'khong_ke_don', 'VD-30110-19', 'Lọ',    55000.00),
('SKU027', 'Salbutamol 2mg',                     @dm12, @n5,  'ke_don',       'VD-30111-15', 'Vỉ',    15000.00),
('SKU028', 'Acetylcystein 200mg',                @dm12, @n6,  'khong_ke_don', 'VD-30112-18', 'Hộp',   45000.00),
('SKU029', 'Cetirizin 10mg',                     @dm6,  @n6,  'khong_ke_don', 'VD-30113-17', 'Hộp',   28000.00),
('SKU030', 'Albendazol 400mg',                   @dm13, @n8,  'ke_don',       'VD-30114-16', 'Vỉ',    18000.00),
('SKU031', 'Fluconazol 150mg',                   @dm13, @n8,  'ke_don',       'VD-30115-18', 'Hộp',   42000.00),
('SKU032', 'Kem đánh răng chống ê buốt',         @dm14, @n9,  'khong_ke_don', NULL,          'Tuýp',  68000.00),
('SKU033', 'Nước súc miệng diệt khuẩn',          @dm14, @n9,  'khong_ke_don', NULL,          'Chai',  95000.00),
('SKU034', 'Nhiệt kế điện tử',                   @dm8,  @n10, 'khong_ke_don', NULL,          'Cái',  120000.00),
('SKU035', 'Siro Canxi D3 cho bé',               @dm15, @n7,  'khong_ke_don', 'VD-30116-19', 'Chai',  78000.00),
('SKU036', 'Men vi sinh dạng gói',               @dm5,  @n7,  'khong_ke_don', 'VD-30117-20', 'Hộp',  150000.00);

SET @t17 := (SELECT id FROM thuoc WHERE ma_sku = 'SKU017'), @t18 := (SELECT id FROM thuoc WHERE ma_sku = 'SKU018'),
    @t19 := (SELECT id FROM thuoc WHERE ma_sku = 'SKU019'), @t20 := (SELECT id FROM thuoc WHERE ma_sku = 'SKU020'),
    @t21 := (SELECT id FROM thuoc WHERE ma_sku = 'SKU021'), @t22 := (SELECT id FROM thuoc WHERE ma_sku = 'SKU022'),
    @t23 := (SELECT id FROM thuoc WHERE ma_sku = 'SKU023'), @t24 := (SELECT id FROM thuoc WHERE ma_sku = 'SKU024'),
    @t25 := (SELECT id FROM thuoc WHERE ma_sku = 'SKU025'), @t26 := (SELECT id FROM thuoc WHERE ma_sku = 'SKU026'),
    @t27 := (SELECT id FROM thuoc WHERE ma_sku = 'SKU027'), @t28 := (SELECT id FROM thuoc WHERE ma_sku = 'SKU028'),
    @t29 := (SELECT id FROM thuoc WHERE ma_sku = 'SKU029'), @t30 := (SELECT id FROM thuoc WHERE ma_sku = 'SKU030'),
    @t31 := (SELECT id FROM thuoc WHERE ma_sku = 'SKU031'), @t32 := (SELECT id FROM thuoc WHERE ma_sku = 'SKU032'),
    @t33 := (SELECT id FROM thuoc WHERE ma_sku = 'SKU033'), @t34 := (SELECT id FROM thuoc WHERE ma_sku = 'SKU034'),
    @t35 := (SELECT id FROM thuoc WHERE ma_sku = 'SKU035'), @t36 := (SELECT id FROM thuoc WHERE ma_sku = 'SKU036');

-- Lô tồn đầu kỳ (SKU036 chưa có lô = đang hết hàng, sẽ nhập ở mục 8;
-- SKU025, SKU031 tồn thấp; SKU022 có lô sắp hết hạn để test dashboard)
INSERT INTO lo_thuoc (id_thuoc, so_lo, han_su_dung, so_luong_ton) VALUES
(@t17, 'TON-DAU-SKU017', '2027-11-30',  50),
(@t18, 'TON-DAU-SKU018', '2027-12-31',  40),
(@t19, 'TON-DAU-SKU019', '2028-01-31',  25),
(@t20, 'TON-DAU-SKU020', '2028-02-28',  60),
(@t21, 'TON-DAU-SKU021', '2027-10-31',  70),
(@t22, 'TON-DAU-SKU022', '2026-11-20',  40),
(@t23, 'TON-DAU-SKU023', '2027-09-30',  30),
(@t24, 'TON-DAU-SKU024', '2027-12-31', 100),
(@t25, 'TON-DAU-SKU025', '2027-06-30',   3),
(@t26, 'TON-DAU-SKU026', '2027-08-31',  45),
(@t27, 'TON-DAU-SKU027', '2027-07-31',  80),
(@t28, 'TON-DAU-SKU028', '2027-11-30',  50),
(@t29, 'TON-DAU-SKU029', '2027-12-31',  90),
(@t30, 'TON-DAU-SKU030', '2028-01-31',  60),
(@t31, 'TON-DAU-SKU031', '2027-10-31',   5),
(@t32, 'TON-DAU-SKU032', '2028-06-30',  70),
(@t33, 'TON-DAU-SKU033', '2028-03-31',  55),
(@t34, 'TON-DAU-SKU034', NULL,          25),
(@t35, 'TON-DAU-SKU035', '2027-08-31',  30);

INSERT INTO mo_ta_thuoc (id_thuoc, thuong_hieu, dang_bao_che, quy_cach_dong_goi, ham_luong, thanh_phan, cong_dung, doi_tuong_su_dung, huong_dan_su_dung, lieu_dung_khuyen_cao, bao_quan, canh_bao) VALUES
(@t17, 'OPC', 'Viên nén bao phim', 'Hộp 10 vỉ x 10 viên', '50mg', 'Diclofenac natri',
 'Giảm đau, kháng viêm trong đau lưng, đau khớp, đau sau chấn thương', 'Theo chỉ định kê đơn', 'Uống sau ăn no, nuốt nguyên viên',
 NULL, 'Dưới 30°C, tránh ẩm', 'Chống chỉ định loét dạ dày tiến triển, suy thận nặng, 3 tháng cuối thai kỳ'),
(@t18, 'OPC', 'Viên nén', 'Hộp 2 vỉ x 10 viên', '7.5mg', 'Meloxicam',
 'Giảm đau, kháng viêm trong thoái hóa khớp, viêm khớp dạng thấp', 'Theo chỉ định kê đơn', 'Uống 1 lần/ngày trong bữa ăn',
 NULL, 'Dưới 30°C', 'Thận trọng với người có bệnh dạ dày, tim mạch, suy thận'),
(@t19, 'Pymepharco', 'Viên nén bao phim', 'Hộp 3 vỉ x 10 viên', '1500mg', 'Glucosamin sulfat',
 'Hỗ trợ giảm đau và phục hồi sụn khớp', 'Người trưởng thành bị thoái hóa khớp', 'Uống 1 lần/ngày sau ăn',
 '1 viên/ngày, dùng liên tục 4-12 tuần', 'Nơi khô ráo, tránh ánh sáng', 'Thận trọng với người dị ứng hải sản có vỏ'),
(@t20, 'Hisamitsu', 'Miếng dán', 'Hộp 20 miếng', NULL, 'Methyl salicylat, L-menthol',
 'Giảm đau cơ, đau lưng, bong gân nhẹ', 'Người lớn', 'Dán lên vùng da sạch, khô, tối đa 8 giờ',
 '1 miếng/lần, 1-2 lần/ngày', 'Nơi khô mát, đậy kín', 'Không dán lên vết thương hở, ngưng dùng nếu kích ứng da'),
(@t21, 'Stada', 'Kem bôi da', 'Tuýp 15g', '1%', 'Clotrimazol',
 'Điều trị nấm da, nấm kẽ chân, lang ben', 'Người lớn và trẻ em', 'Bôi mỏng lên vùng da tổn thương sạch, khô',
 'Bôi 2 lần/ngày, kéo dài 2-4 tuần', 'Dưới 30°C', 'Tránh tiếp xúc mắt; ngưng dùng nếu da kích ứng nặng'),
(@t22, 'Stada', 'Dung dịch sát khuẩn', 'Chai 90ml', '10%', 'Povidone iod',
 'Sát khuẩn da, vết thương nhỏ, vết trầy xước', 'Mọi lứa tuổi (thận trọng với trẻ sơ sinh)', 'Bôi trực tiếp lên vùng cần sát khuẩn',
 'Bôi 1-2 lần/ngày', 'Nơi khô mát, tránh ánh sáng', 'Không dùng cho người dị ứng iod, bệnh tuyến giáp'),
(@t23, 'Pharbaco', 'Mỡ bôi da', 'Tuýp 5g', '2%', 'Mupirocin',
 'Điều trị nhiễm khuẩn da nhẹ như chốc, nhọt, viêm nang lông', 'Theo chỉ định kê đơn', 'Bôi lớp mỏng lên vùng da tổn thương',
 NULL, 'Dưới 25°C', 'Không dùng kéo dài quá 10 ngày'),
(@t24, 'Pharbaco', 'Dung dịch nhỏ', 'Lọ 10ml', '0,9%', 'Natri clorid',
 'Rửa mắt, rửa mũi, hỗ trợ giảm ngạt mũi', 'Mọi lứa tuổi', 'Nhỏ 1-2 giọt mỗi bên',
 'Dùng 2-4 lần/ngày khi cần', 'Dưới 30°C, dùng trong 1 tháng sau khi mở nắp', 'Không dùng chung lọ giữa nhiều người'),
(@t25, 'Bidiphar', 'Dung dịch nhỏ mắt', 'Lọ 5ml', '0,3%', 'Tobramycin',
 'Điều trị nhiễm khuẩn mắt ngoài như viêm kết mạc, viêm mi', 'Theo chỉ định kê đơn', 'Nhỏ vào túi kết mạc, không chạm đầu lọ vào mắt',
 NULL, 'Dưới 25°C, dùng trong 4 tuần sau khi mở', 'Chống chỉ định với người dị ứng nhóm aminoglycosid'),
(@t26, 'Bidiphar', 'Dung dịch xịt mũi', 'Lọ 10ml', '0,1%', 'Xylometazolin hydroclorid',
 'Giảm nghẹt mũi do cảm lạnh, viêm mũi dị ứng', 'Người lớn và trẻ em trên 12 tuổi', 'Xịt vào mỗi bên mũi',
 'Xịt 1-2 nhát/lần, 2-3 lần/ngày, không quá 3 ngày liên tục', 'Dưới 30°C', 'Dùng kéo dài có thể gây ngạt mũi tái phát'),
(@t27, 'Bidiphar', 'Viên nén', 'Vỉ 10 viên', '2mg', 'Salbutamol sulfat',
 'Giãn phế quản, giảm khò khè trong hen và viêm phế quản co thắt', 'Theo chỉ định kê đơn', 'Uống với nước, không nhai',
 NULL, 'Dưới 30°C', 'Có thể gây run tay, hồi hộp, nhịp tim nhanh'),
(@t28, 'Mekophar', 'Viên nang', 'Hộp 3 vỉ x 10 viên', '200mg', 'Acetylcystein',
 'Long đờm trong viêm phế quản, viêm đường hô hấp có nhiều đờm', 'Người lớn và trẻ em trên 6 tuổi', 'Uống sau ăn, uống nhiều nước',
 '1 viên/lần, 3 lần/ngày', 'Dưới 30°C, tránh ẩm', 'Thận trọng với người hen phế quản, loét dạ dày'),
(@t29, 'Mekophar', 'Viên nén bao phim', 'Hộp 1 vỉ x 10 viên', '10mg', 'Cetirizin dihydroclorid',
 'Giảm triệu chứng viêm mũi dị ứng, mề đay', 'Người lớn và trẻ em trên 12 tuổi', 'Uống 1 lần/ngày, nên uống buổi tối',
 '1 viên/ngày', 'Dưới 30°C', 'Có thể gây buồn ngủ, không lái xe khi dùng'),
(@t30, 'Hataphar', 'Viên nén', 'Vỉ 1 viên', '400mg', 'Albendazol',
 'Điều trị nhiễm giun đũa, giun kim, giun móc', 'Theo chỉ định kê đơn', 'Nhai hoặc nuốt cùng bữa ăn',
 NULL, 'Dưới 30°C', 'Không dùng cho phụ nữ có thai'),
(@t31, 'Hataphar', 'Viên nang', 'Hộp 1 viên', '150mg', 'Fluconazol',
 'Điều trị nấm Candida âm đạo, nấm da, nấm niêm mạc', 'Theo chỉ định kê đơn', 'Uống nguyên viên với nước',
 NULL, 'Dưới 30°C', 'Thận trọng với người suy gan, suy thận; không dùng cho phụ nữ có thai'),
(@t32, 'Vinphaco', 'Kem đánh răng', 'Tuýp 100g', NULL, 'Kali nitrat, Natri fluorid',
 'Giảm ê buốt răng, bảo vệ men răng', 'Người lớn', 'Chải răng 2 lần/ngày',
 NULL, 'Nơi khô ráo', 'Không nuốt kem đánh răng'),
(@t33, 'Vinphaco', 'Dung dịch súc miệng', 'Chai 250ml', NULL, 'Cetylpyridinium chloride',
 'Diệt khuẩn khoang miệng, giảm hôi miệng', 'Người lớn', 'Súc miệng 20-30 giây rồi nhổ ra',
 '10-15ml/lần, 2 lần/ngày', 'Nơi khô mát', 'Không nuốt, không dùng cho trẻ dưới 6 tuổi'),
(@t34, 'An Phú', 'Thiết bị điện tử', 'Hộp 1 cái + pin', NULL, 'Không áp dụng',
 'Đo thân nhiệt qua nách hoặc miệng, có báo bíp khi đo xong', 'Mọi lứa tuổi', 'Đặt đầu cảm biến đúng vị trí, chờ tiếng bíp',
 NULL, 'Tránh va đập, tránh ẩm', 'Vệ sinh đầu đo bằng cồn sau mỗi lần dùng'),
(@t35, 'Sao Kim', 'Siro', 'Chai 100ml', NULL, 'Canxi gluconat, Vitamin D3',
 'Bổ sung canxi và vitamin D cho trẻ nhỏ', 'Trẻ em', 'Lắc đều trước khi dùng, dùng theo hướng dẫn của dược sĩ',
 NULL, 'Dưới 30°C, đậy kín sau khi dùng', 'Không tự ý dùng quá liều khuyến cáo'),
(@t36, 'Sao Kim', 'Bột pha hỗn dịch', 'Hộp 20 gói', NULL, 'Lactobacillus acidophilus, Bifidobacterium',
 'Hỗ trợ cân bằng hệ vi sinh đường ruột, hỗ trợ tiêu hóa', 'Người lớn và trẻ em', 'Pha với nước nguội, không pha nước nóng',
 'Theo hướng dẫn trên bao bì', 'Dưới 25°C, tránh ẩm', 'Không dùng khi gói bị rách, hết hạn');

INSERT INTO anh_thuoc (id_thuoc, duong_dan_anh, la_anh_chinh, thu_tu) VALUES
(@t17, '/images/thuoc/diclofenac_1.jpg', 1, 1),       (@t17, '/images/thuoc/diclofenac_2.jpg', 0, 2),
(@t18, '/images/thuoc/meloxicam_1.jpg', 1, 1),        (@t18, '/images/thuoc/meloxicam_2.jpg', 0, 2),
(@t19, '/images/thuoc/glucosamine_1.jpg', 1, 1),      (@t19, '/images/thuoc/glucosamine_2.jpg', 0, 2),
(@t20, '/images/thuoc/salonpas_1.jpg', 1, 1),         (@t20, '/images/thuoc/salonpas_2.jpg', 0, 2),
(@t21, '/images/thuoc/clotrimazole_1.jpg', 1, 1),     (@t21, '/images/thuoc/clotrimazole_2.jpg', 0, 2),
(@t22, '/images/thuoc/betadine_1.jpg', 1, 1),         (@t22, '/images/thuoc/betadine_2.jpg', 0, 2),
(@t23, '/images/thuoc/mupirocin_1.jpg', 1, 1),        (@t23, '/images/thuoc/mupirocin_2.jpg', 0, 2),
(@t24, '/images/thuoc/natri_clorid_1.jpg', 1, 1),     (@t24, '/images/thuoc/natri_clorid_2.jpg', 0, 2),
(@t25, '/images/thuoc/tobramycin_1.jpg', 1, 1),       (@t25, '/images/thuoc/tobramycin_2.jpg', 0, 2),
(@t26, '/images/thuoc/xylometazolin_1.jpg', 1, 1),    (@t26, '/images/thuoc/xylometazolin_2.jpg', 0, 2),
(@t27, '/images/thuoc/salbutamol_1.jpg', 1, 1),       (@t27, '/images/thuoc/salbutamol_2.jpg', 0, 2),
(@t28, '/images/thuoc/acetylcystein_1.jpg', 1, 1),    (@t28, '/images/thuoc/acetylcystein_2.jpg', 0, 2),
(@t29, '/images/thuoc/cetirizin_1.jpg', 1, 1),        (@t29, '/images/thuoc/cetirizin_2.jpg', 0, 2),
(@t30, '/images/thuoc/albendazol_1.jpg', 1, 1),       (@t30, '/images/thuoc/albendazol_2.jpg', 0, 2),
(@t31, '/images/thuoc/fluconazol_1.jpg', 1, 1),       (@t31, '/images/thuoc/fluconazol_2.jpg', 0, 2),
(@t32, '/images/thuoc/kem_danh_rang_1.jpg', 1, 1),    (@t32, '/images/thuoc/kem_danh_rang_2.jpg', 0, 2),
(@t33, '/images/thuoc/nuoc_suc_mieng_1.jpg', 1, 1),   (@t33, '/images/thuoc/nuoc_suc_mieng_2.jpg', 0, 2),
(@t34, '/images/thuoc/nhiet_ke_1.jpg', 1, 1),         (@t34, '/images/thuoc/nhiet_ke_2.jpg', 0, 2),
(@t35, '/images/thuoc/canxi_d3_1.jpg', 1, 1),         (@t35, '/images/thuoc/canxi_d3_2.jpg', 0, 2),
(@t36, '/images/thuoc/men_vi_sinh_1.jpg', 1, 1),      (@t36, '/images/thuoc/men_vi_sinh_2.jpg', 0, 2);

-- =========================================================================
-- 4. BỆNH (15) + PHÁC ĐỒ (15) + CHI TIẾT PHÁC ĐỒ (41)
-- =========================================================================
INSERT INTO benh (ma_icd, ten_benh, mo_ta) VALUES
('J00', 'Cảm lạnh thông thường',            'Viêm mũi họng cấp do virus'),
('J20', 'Viêm phế quản cấp',                'Ho, có đờm, có thể kèm sốt nhẹ'),
('J45', 'Hen phế quản',                     'Khò khè, khó thở từng đợt'),
('J30', 'Viêm mũi dị ứng',                  'Hắt hơi, ngứa mũi, chảy nước mũi trong'),
('K29', 'Viêm dạ dày',                      'Đau thượng vị, ợ chua, đầy bụng'),
('A09', 'Tiêu chảy cấp',                    'Đi ngoài phân lỏng nhiều lần, nguy cơ mất nước'),
('B35', 'Nấm da',                           'Nấm da vùng bẹn, thân, kẽ chân'),
('L08', 'Nhiễm khuẩn da khu trú',           'Nhọt, chốc, viêm nang lông'),
('H10', 'Viêm kết mạc cấp',                 'Đỏ mắt, ghèn, cộm xốn'),
('M19', 'Thoái hóa khớp',                   'Đau, cứng khớp, hạn chế vận động'),
('M54', 'Đau lưng',                         'Đau thắt lưng do căng cơ hoặc thoái hóa'),
('N39', 'Nhiễm khuẩn đường tiết niệu',      'Tiểu buốt, tiểu rắt'),
('B77', 'Nhiễm giun đũa',                   'Nhiễm giun đường ruột'),
('E55', 'Thiếu vitamin D',                  'Thường gặp ở trẻ nhỏ ít tiếp xúc ánh nắng'),
('K59', 'Táo bón chức năng',                'Đi ngoài khó, phân khô cứng');

INSERT INTO phac_do (id_benh, ten_phac_do, mo_ta) VALUES
((SELECT id FROM benh WHERE ma_icd='J00'), 'Phác đồ cảm lạnh thông thường',           'Giảm triệu chứng cảm + vitamin C + rửa mũi'),
((SELECT id FROM benh WHERE ma_icd='J20'), 'Phác đồ viêm phế quản cấp',               'Kháng sinh + long đờm + hạ sốt + siro ho'),
((SELECT id FROM benh WHERE ma_icd='J45'), 'Phác đồ hen phế quản đợt nhẹ',            'Giãn phế quản + long đờm'),
((SELECT id FROM benh WHERE ma_icd='J30'), 'Phác đồ viêm mũi dị ứng',                 'Kháng histamin + rửa mũi + xịt mũi ngắn ngày'),
((SELECT id FROM benh WHERE ma_icd='K29'), 'Phác đồ viêm dạ dày',                     'Ức chế bơm proton + men vi sinh'),
((SELECT id FROM benh WHERE ma_icd='A09'), 'Phác đồ tiêu chảy cấp',                   'Bù nước điện giải + berberin + men vi sinh'),
((SELECT id FROM benh WHERE ma_icd='B35'), 'Phác đồ nấm da',                          'Kem bôi + thuốc uống kháng nấm'),
((SELECT id FROM benh WHERE ma_icd='L08'), 'Phác đồ nhiễm khuẩn da khu trú',          'Mỡ kháng sinh + sát khuẩn + giảm đau'),
((SELECT id FROM benh WHERE ma_icd='H10'), 'Phác đồ viêm kết mạc cấp',                'Nhỏ mắt kháng sinh + rửa mắt'),
((SELECT id FROM benh WHERE ma_icd='M19'), 'Phác đồ thoái hóa khớp',                  'Kháng viêm + bổ khớp + bảo vệ dạ dày + miếng dán'),
((SELECT id FROM benh WHERE ma_icd='M54'), 'Phác đồ đau lưng cấp',                    'Kháng viêm + bảo vệ dạ dày + miếng dán'),
((SELECT id FROM benh WHERE ma_icd='N39'), 'Phác đồ nhiễm khuẩn tiết niệu dưới',      'Kháng sinh + hạ sốt/giảm đau + bù nước'),
((SELECT id FROM benh WHERE ma_icd='B77'), 'Phác đồ tẩy giun',                        'Thuốc tẩy giun + vitamin hỗ trợ'),
((SELECT id FROM benh WHERE ma_icd='E55'), 'Phác đồ bổ sung canxi - vitamin D cho trẻ','Canxi D3 + men vi sinh hỗ trợ tiêu hóa'),
((SELECT id FROM benh WHERE ma_icd='J02'), 'Phác đồ viêm họng cấp (dị ứng penicillin)','Kháng sinh nhóm cephalosporin + hạ sốt + rửa mũi');
SET @pdx := LAST_INSERT_ID();
SET @pd5  := @pdx,      @pd6  := @pdx + 1,  @pd7  := @pdx + 2,  @pd8  := @pdx + 3,  @pd9  := @pdx + 4,
    @pd10 := @pdx + 5,  @pd11 := @pdx + 6,  @pd12 := @pdx + 7,  @pd13 := @pdx + 8,  @pd14 := @pdx + 9,
    @pd15 := @pdx + 10, @pd16 := @pdx + 11, @pd17 := @pdx + 12, @pd18 := @pdx + 13, @pd19 := @pdx + 14;

INSERT INTO chi_tiet_phac_do (id_phac_do, id_thuoc, so_luong_goi_y, lieu_dung, so_ngay_dung) VALUES
(@pd5,  @t5,  2, 'Uống 1 viên/lần, 3 lần/ngày sau ăn', 3),
(@pd5,  @t4,  1, 'Hòa 1 viên sủi với 200ml nước, ngày 1 lần', 10),
(@pd5,  @t24, 2, 'Rửa mũi 2-3 lần/ngày', 5),
(@pd6,  @t8,  1, 'Uống 1 viên x 2 lần/ngày sau ăn', 5),
(@pd6,  @t28, 1, 'Uống 1 viên x 3 lần/ngày sau ăn', 7),
(@pd6,  @t1,  1, 'Uống 1 viên khi sốt, cách nhau 4-6 giờ', 3),
(@pd6,  @t11, 1, 'Người lớn 5ml/lần, 3 lần/ngày', 7),
(@pd7,  @t27, 2, 'Uống 1 viên x 2-3 lần/ngày khi có khò khè', 7),
(@pd7,  @t28, 1, 'Uống 1 viên x 3 lần/ngày sau ăn', 7),
(@pd8,  @t29, 1, 'Uống 1 viên/ngày vào buổi tối', 10),
(@pd8,  @t24, 2, 'Rửa mũi 2 lần/ngày', 10),
(@pd8,  @t26, 1, 'Xịt 1-2 nhát mỗi bên mũi, không quá 3 ngày liên tục', 3),
(@pd9,  @t7,  2, 'Uống 1 viên/ngày trước bữa sáng 30 phút', 14),
(@pd9,  @t36, 1, 'Uống 1 gói/ngày pha với nước nguội', 10),
(@pd10, @t12, 3, 'Hòa 1 gói với 200ml nước, uống từng ngụm nhỏ', 3),
(@pd10, @t6,  1, 'Uống 2-4 viên/lần, 2 lần/ngày', 3),
(@pd10, @t36, 1, 'Uống 1 gói x 2 lần/ngày', 5),
(@pd11, @t21, 1, 'Bôi mỏng 2 lần/ngày lên vùng da tổn thương', 14),
(@pd11, @t31, 1, 'Uống 1 viên liều duy nhất, lặp lại sau 1 tuần nếu dược sĩ dặn', 7),
(@pd12, @t23, 1, 'Bôi lên tổn thương 2-3 lần/ngày', 7),
(@pd12, @t22, 1, 'Sát khuẩn vùng da tổn thương 1-2 lần/ngày', 7),
(@pd12, @t1,  1, 'Uống 1 viên khi đau, cách nhau 4-6 giờ', 3),
(@pd13, @t25, 1, 'Nhỏ 1-2 giọt x 4 lần/ngày', 7),
(@pd13, @t24, 2, 'Rửa mắt, nhỏ khi cộm xốn', 7),
(@pd14, @t18, 1, 'Uống 1 viên/ngày sau ăn no', 7),
(@pd14, @t19, 1, 'Uống 1 viên/ngày', 30),
(@pd14, @t7,  1, 'Uống 1 viên/ngày trước bữa sáng để bảo vệ dạ dày', 7),
(@pd14, @t20, 1, 'Dán 1 miếng/ngày vào vùng đau', 7),
(@pd15, @t17, 1, 'Uống 1 viên x 2 lần/ngày sau ăn no', 5),
(@pd15, @t7,  1, 'Uống 1 viên/ngày trước bữa sáng', 5),
(@pd15, @t20, 1, 'Dán 1 miếng/ngày vào vùng đau', 5),
(@pd16, @t8,  1, 'Uống 1 viên x 2 lần/ngày sau ăn', 5),
(@pd16, @t1,  1, 'Uống 1 viên khi đau hoặc sốt', 3),
(@pd16, @t12, 1, 'Hòa 1 gói với 200ml nước để bù nước', 3),
(@pd17, @t30, 1, 'Uống 1 viên liều duy nhất', 1),
(@pd17, @t4,  1, 'Hòa 1 viên sủi với 200ml nước, ngày 1 lần', 10),
(@pd18, @t35, 2, 'Theo hướng dẫn của dược sĩ', 30),
(@pd18, @t36, 1, 'Theo hướng dẫn trên bao bì', 10),
(@pd19, @t8,  1, 'Uống 1 viên x 2 lần/ngày sau ăn', 5),
(@pd19, @t1,  1, 'Uống 1 viên khi sốt hoặc đau', 3),
(@pd19, @t24, 1, 'Rửa mũi 2 lần/ngày', 5);

-- =========================================================================
-- 5. KHUYẾN MÃI (15)
-- =========================================================================
INSERT INTO khuyen_mai (ma_code, mo_ta, loai_giam, gia_tri_giam, don_toi_thieu, ngay_bat_dau, ngay_ket_thuc, so_luong_toi_da) VALUES
('KHACHMOI20', 'Giảm 20% cho khách mới (đơn từ 100.000đ)',    'phan_tram', 20,    100000, '2026-09-01', '2026-12-31', 500),
('VITAMIN15',  'Giảm 15% nhóm vitamin và thực phẩm chức năng','phan_tram', 15,    100000, '2026-10-01', '2026-11-30', 200),
('GIAM30K',    'Giảm 30.000đ cho đơn từ 300.000đ',            'tien_mat',  30000, 300000, '2026-09-01', '2026-12-31', 200),
('GIAM50K',    'Giảm 50.000đ cho đơn từ 500.000đ',            'tien_mat',  50000, 500000, '2026-09-15', '2027-01-31', 100),
('THUOC5',     'Giảm 5% mọi đơn hàng',                        'phan_tram', 5,     0,      '2026-10-01', '2026-12-31', 300),
('FREESHIP30', 'Hỗ trợ phí ship 30.000đ cho đơn từ 300.000đ', 'tien_mat',  30000, 300000, '2026-10-01', '2026-12-31', NULL),
('COMBO25K',   'Giảm 25.000đ cho đơn từ 250.000đ',            'tien_mat',  25000, 250000, '2026-09-01', '2026-11-30', NULL),
('SINHNHAT',   'Quà sinh nhật giảm 10%',                      'phan_tram', 10,    100000, '2026-01-01', '2026-12-31', NULL),
('FLASH10',    'Flash sale cuối tuần giảm 10%',               'phan_tram', 10,    0,      '2026-10-07', '2026-10-10', 50),
('GOLD15',     'Khách thân thiết giảm 15% đơn từ 400.000đ',   'phan_tram', 15,    400000, '2026-09-01', '2027-03-31', 150),
('NOEL2026',   'Giáng sinh giảm 12% (chưa đến đợt)',          'phan_tram', 12,    200000, '2026-12-15', '2026-12-31', 300),
('TET2027',    'Tết 2027 giảm 10% (chưa đến đợt)',            'phan_tram', 10,    150000, '2027-01-15', '2027-02-15', 1000),
('MUAHE2026',  'Mùa hè 2026 (đã hết hạn, để test)',           'phan_tram', 7,     0,      '2026-06-01', '2026-08-31', 400),
('HETHAN2024', 'Mã hết hạn năm 2024 (để test)',               'phan_tram', 8,     0,      '2024-01-01', '2024-12-31', 100),
('HETLUOT',    'Mã đã hết lượt dùng (để test)',               'tien_mat',  10000, 0,      '2026-01-01', '2026-12-31', 10);

UPDATE khuyen_mai SET so_luong_da_dung = so_luong_toi_da WHERE ma_code = 'HETLUOT';

SET @km_km20 := (SELECT id FROM khuyen_mai WHERE ma_code = 'KHACHMOI20'),
    @km_v15  := (SELECT id FROM khuyen_mai WHERE ma_code = 'VITAMIN15'),
    @km_g30  := (SELECT id FROM khuyen_mai WHERE ma_code = 'GIAM30K'),
    @km_g50  := (SELECT id FROM khuyen_mai WHERE ma_code = 'GIAM50K');

-- =========================================================================
-- 6. GIỎ HÀNG (20, mỗi khách mới 1 dòng)
-- =========================================================================
INSERT INTO gio_hang (id_khach_hang, id_thuoc, so_luong) VALUES
(@kh5,  @t1,  2), (@kh6,  @t4,  1), (@kh7,  @t14, 5), (@kh8,  @t16, 1), (@kh9,  @t5,  1),
(@kh10, @t11, 1), (@kh11, @t13, 1), (@kh12, @t12, 4), (@kh13, @t4,  2), (@kh14, @t14, 2),
(@kh15, @t20, 2), (@kh16, @t24, 3), (@kh17, @t29, 1), (@kh18, @t35, 1), (@kh19, @t21, 1),
(@kh20, @t33, 1), (@kh21, @t32, 2), (@kh22, @t34, 1), (@kh23, @t19, 1), (@kh24, @t36, 1);

-- =========================================================================
-- 7. NHẬP KHO (20 phiếu, mỗi phiếu 1 dòng; trigger tự tạo lô + đồng bộ tồn)
-- =========================================================================
INSERT INTO phieu_nhap_thuoc (id_nhan_vien, id_nha_cung_cap, ngay_nhap, tong_tien, ghi_chu) VALUES
(@nv_kho,  @ncc_imex,    '2026-09-01 09:00:00', 1800000.00, 'Nhập bổ sung Decolgen Forte (sắp hết hàng)'),
(@nv_kho2, @ncc_domesco, '2026-09-02 10:00:00',  350000.00, 'Nhập bổ sung Berberin'),
(@nv_kho,  @ncc_domesco, '2026-09-03 09:30:00', 1800000.00, 'Nhập bổ sung Metformin'),
(@nv_kho3, @ncc_dhg,     '2026-09-04 14:00:00', 3240000.00, 'Nhập Ibuprofen (đang hết hàng)'),
(@nv_kho2, @ncc_domesco, '2026-09-05 08:30:00', 2250000.00, 'Nhập Oresol lô HSD mới'),
(@nv_kho,  @ncc_dhg,     '2026-09-06 15:00:00', 4400000.00, 'Nhập Paracetamol'),
(@nv_kho3, @n1,          '2026-09-08 09:00:00', 2200000.00, 'Nhập Diclofenac'),
(@nv_kho,  @n1,          '2026-09-09 11:00:00', 2640000.00, 'Nhập Meloxicam'),
(@nv_kho2, @n2,          '2026-09-10 10:15:00', 4800000.00, 'Nhập Glucosamine'),
(@nv_kho3, @n2,          '2026-09-11 13:20:00', 3000000.00, 'Nhập miếng dán Salonpas'),
(@nv_kho,  @n3,          '2026-09-12 09:45:00', 1440000.00, 'Nhập kem Clotrimazole'),
(@nv_kho2, @n3,          '2026-09-14 16:00:00', 2000000.00, 'Nhập Betadine'),
(@nv_kho3, @n4,          '2026-09-15 08:50:00', 2520000.00, 'Nhập Mupirocin'),
(@nv_kho,  @n4,          '2026-09-17 10:40:00',  900000.00, 'Nhập Natri clorid 0,9%'),
(@nv_kho2, @n5,          '2026-09-18 14:30:00', 1400000.00, 'Nhập Tobramycin nhỏ mắt (tồn thấp)'),
(@nv_kho3, @n5,          '2026-09-20 09:15:00', 1600000.00, 'Nhập Salbutamol'),
(@nv_kho,  @n6,          '2026-09-22 11:30:00', 2800000.00, 'Nhập Acetylcystein'),
(@nv_kho2, @n6,          '2026-09-25 10:00:00', 2400000.00, 'Nhập Cetirizin'),
(@nv_kho3, @n7,          '2026-09-28 15:45:00', 3000000.00, 'Nhập Siro Canxi D3'),
(@nv_kho,  @n7,          '2026-10-02 09:30:00', 8000000.00, 'Nhập men vi sinh (đang hết hàng)');
SET @pn0 := LAST_INSERT_ID();
SET @pn1  := @pn0 + 1,  @pn2  := @pn0 + 2,  @pn3  := @pn0 + 3,  @pn4  := @pn0 + 4,  @pn5  := @pn0 + 5,
    @pn6  := @pn0 + 6,  @pn7  := @pn0 + 7,  @pn8  := @pn0 + 8,  @pn9  := @pn0 + 9,  @pn10 := @pn0 + 10,
    @pn11 := @pn0 + 11, @pn12 := @pn0 + 12, @pn13 := @pn0 + 13, @pn14 := @pn0 + 14, @pn15 := @pn0 + 15,
    @pn16 := @pn0 + 16, @pn17 := @pn0 + 17, @pn18 := @pn0 + 18, @pn19 := @pn0 + 19;

INSERT INTO chi_tiet_phieu_nhap (id_phieu_nhap, id_thuoc, so_luong, gia_nhap, so_lo, han_su_dung) VALUES
(@pn0,  @t5,  100,  18000.00, 'L30001', '2027-11-30'),
(@pn1,  @t6,   50,   7000.00, 'L30002', '2027-12-31'),
(@pn2,  @t10,  60,  30000.00, 'L30003', '2028-01-31'),
(@pn3,  @t15, 120,  27000.00, 'L30004', '2027-10-31'),
(@pn4,  @t12, 150,  15000.00, 'L30005', '2028-03-31'),
(@pn5,  @t1,  200,  22000.00, 'L30006', '2028-05-31'),
(@pn6,  @t17, 100,  22000.00, 'L30007', '2028-02-29'),
(@pn7,  @t18,  80,  33000.00, 'L30008', '2028-03-31'),
(@pn8,  @t19,  40, 120000.00, 'L30009', '2028-06-30'),
(@pn9,  @t20, 150,  20000.00, 'L30010', '2028-09-30'),
(@pn10, @t21, 120,  12000.00, 'L30011', '2028-04-30'),
(@pn11, @t22,  80,  25000.00, 'L30012', '2028-01-31'),
(@pn12, @t23,  60,  42000.00, 'L30013', '2028-02-28'),
(@pn13, @t24, 300,   3000.00, 'L30014', '2028-08-31'),
(@pn14, @t25,  50,  28000.00, 'L30015', '2027-12-31'),
(@pn15, @t27, 200,   8000.00, 'L30016', '2028-05-31'),
(@pn16, @t28, 100,  28000.00, 'L30017', '2028-03-31'),
(@pn17, @t29, 150,  16000.00, 'L30018', '2028-07-31'),
(@pn18, @t35,  60,  50000.00, 'L30019', '2028-01-31'),
(@pn19, @t36,  80, 100000.00, 'L30020', '2028-04-30');

-- Lịch sử trạng thái phiếu nhập: tao_moi (người lập) -> da_nhap_kho (quản lý)
INSERT INTO lich_su_trang_thai_nhap (id_phieu_nhap, trang_thai, thoi_gian_cap_nhat, nguoi_cap_nhat, ghi_chu)
SELECT id, 'tao_moi', ngay_nhap, id_nhan_vien, 'Tạo phiếu nhập'
  FROM phieu_nhap_thuoc WHERE id >= @pn0;
INSERT INTO lich_su_trang_thai_nhap (id_phieu_nhap, trang_thai, thoi_gian_cap_nhat, nguoi_cap_nhat, ghi_chu)
SELECT id, 'da_nhap_kho', DATE_ADD(ngay_nhap, INTERVAL 5 HOUR), @nv_ql, 'Đã kiểm tra số lượng và hạn dùng'
  FROM phieu_nhap_thuoc WHERE id >= @pn0;

-- =========================================================================
-- 8. YÊU CẦU KÊ ĐƠN (22) + TOA TỪ YÊU CẦU (15) + TOA KH TỰ UPLOAD (5)
-- =========================================================================
INSERT INTO yeu_cau_ke_don (id_khach_hang, ten_benh_khai, trieu_chung, thoi_gian_bi_benh, di_ung_thuoc, benh_nen_thuoc_dang_dung, ngay_tao) VALUES
(@kh5,  'Cảm lạnh',                 'Hắt hơi, nghẹt mũi, sổ mũi trong, đau họng nhẹ, không sốt',                   '2 ngày',  'Không', 'Không có bệnh nền',                            '2026-09-20 08:00:00'),
(@kh6,  'Ho có đờm',                'Ho nhiều về đêm, đờm vàng, sốt nhẹ 37,8°C, hơi tức ngực',                     '4 ngày',  'Không', 'Hút thuốc lá',                                 '2026-09-21 09:20:00'),
(@kh7,  'Khò khè, khó thở nhẹ',     'Khò khè khi gắng sức và về đêm, có tiền sử hen từ nhỏ',                        '3 ngày',  'Không', 'Hen phế quản đã chẩn đoán, hết thuốc',         '2026-09-22 07:45:00'),
(@kh8,  'Viêm mũi dị ứng',          'Hắt hơi liên tục buổi sáng, ngứa mũi, chảy nước mũi trong',                    '1 tuần',  'Không', 'Không',                                        '2026-09-23 18:10:00'),
(@kh9,  'Đau thượng vị',            'Đau rát vùng thượng vị sau ăn, ợ chua, đầy bụng',                              '5 ngày',  'Không', 'Hay uống cà phê, thức khuya',                  '2026-09-24 12:30:00'),
(@kh10, 'Tiêu chảy',                'Đi ngoài phân lỏng 4-5 lần/ngày, đau quặn bụng, không sốt cao',                '2 ngày',  'Không', 'Không',                                        '2026-09-25 06:50:00'),
(@kh11, 'Nấm da',                   'Mảng da đỏ hình vòng tròn ở vùng bẹn, ngứa nhiều',                             '2 tuần',  'Không', 'Đái tháo đường type 2, đang dùng Metformin',   '2026-09-26 19:00:00'),
(@kh12, 'Nhọt ngoài da',            'Nốt sưng đỏ, đau, có mủ ở cẳng tay',                                           '3 ngày',  'Không', 'Không',                                        '2026-09-27 08:40:00'),
(@kh13, 'Đỏ mắt',                   'Mắt đỏ, ghèn vàng, cộm xốn, dính mi buổi sáng',                                '2 ngày',  'Không', 'Không đeo kính áp tròng',                      '2026-09-28 07:15:00'),
(@kh14, 'Đau khớp gối',             'Đau khớp gối hai bên, cứng khớp buổi sáng, đau khi leo cầu thang',             '3 tháng', 'Không', 'Cao huyết áp, đang dùng Amlodipine',           '2026-09-29 10:00:00'),
(@kh15, 'Đau lưng',                 'Đau thắt lưng sau khi bê vật nặng, đau tăng khi cúi',                          '3 ngày',  'Không', 'Không',                                        '2026-10-01 09:05:00'),
(@kh16, 'Tiểu buốt',                'Tiểu buốt, tiểu rắt, đau nhẹ vùng hạ vị, không sốt',                           '2 ngày',  'Không', 'Không',                                        '2026-10-02 08:25:00'),
(@kh17, 'Nghi nhiễm giun',          'Đau bụng quanh rốn, ngứa hậu môn về đêm, chán ăn',                             '1 tuần',  'Không', 'Không có thai',                                '2026-10-03 07:30:00'),
(@kh18, 'Thiếu vitamin D ở trẻ',    'Bé 18 tháng tuổi, ngủ không sâu giấc, ra nhiều mồ hôi trộm, chậm mọc răng',    '2 tháng', 'Không', 'Bé nặng 11kg, không bệnh nền',                 '2026-10-03 20:00:00'),
(@kh19, 'Viêm họng',                'Đau họng, nuốt đau, sốt 38°C, amidan đỏ',                                      '2 ngày',  'Penicillin, Amoxicillin (nổi mề đay)', 'Không có thai', '2026-10-04 09:40:00'),
(@kh20, 'Đau đầu, huyết áp cao',    'Đau đầu vùng chẩm, hoa mắt, đo huyết áp tại nhà 160/100',                      '1 tuần',  'Không', 'Chưa từng điều trị huyết áp',                  '2026-10-05 10:15:00'),
(@kh21, 'Đau ngực',                 'Đau ngực trái, khó thở, vã mồ hôi khi leo cầu thang',                          '3 ngày',  'Không', 'Cha bị bệnh tim',                              '2026-10-05 19:00:00'),
(@kh22, 'Sốt cao kéo dài',          'Sốt trên 39°C năm ngày liên tục, phát ban, đau nhức mình',                     '5 ngày',  'Không', 'Không',                                        '2026-10-06 08:00:00'),
(@kh23, 'Mất ngủ',                  'Khó vào giấc, thức giấc nhiều lần trong đêm',                                  '1 tuần',  'Không', 'Không',                                        '2026-10-06 14:20:00'),
(@kh24, 'Ho kéo dài',               'Ho khan, rát họng, không sốt',                                                 '10 ngày', 'Không', 'Không',                                        '2026-10-06 21:15:00'),
(@kh5,  'Đau bụng kinh',            'Đau bụng dưới dữ dội vào kỳ kinh, buồn nôn',                                   '2 ngày',  'Không', 'Không',                                        '2026-10-07 06:30:00'),
(@kh6,  'Nổi mẩn ngứa',             'Nổi mẩn đỏ ngứa nhiều chỗ sau khi ăn hải sản',                                 '1 ngày',  'Chưa rõ', 'Không',                                      '2026-10-07 07:10:00');
SET @yc0 := LAST_INSERT_ID();
SET @yc1  := @yc0 + 1,  @yc2  := @yc0 + 2,  @yc3  := @yc0 + 3,  @yc4  := @yc0 + 4,  @yc5  := @yc0 + 5,
    @yc6  := @yc0 + 6,  @yc7  := @yc0 + 7,  @yc8  := @yc0 + 8,  @yc9  := @yc0 + 9,  @yc10 := @yc0 + 10,
    @yc11 := @yc0 + 11, @yc12 := @yc0 + 12, @yc13 := @yc0 + 13, @yc14 := @yc0 + 14, @yc15 := @yc0 + 15,
    @yc16 := @yc0 + 16, @yc17 := @yc0 + 17, @yc18 := @yc0 + 18;

-- 8a. Tiếp nhận 16 yêu cầu (15 sẽ kê toa, 1 để ở trạng thái đã tiếp nhận chưa kê)
CALL sp_tiep_nhan_yeu_cau(@yc0,  @ds6);
CALL sp_tiep_nhan_yeu_cau(@yc1,  @ds6);
CALL sp_tiep_nhan_yeu_cau(@yc2,  @ds6);
CALL sp_tiep_nhan_yeu_cau(@yc3,  @ds5);
CALL sp_tiep_nhan_yeu_cau(@yc4,  @ds2);
CALL sp_tiep_nhan_yeu_cau(@yc5,  @ds2);
CALL sp_tiep_nhan_yeu_cau(@yc6,  @ds5);
CALL sp_tiep_nhan_yeu_cau(@yc7,  @ds5);
CALL sp_tiep_nhan_yeu_cau(@yc8,  @ds4);
CALL sp_tiep_nhan_yeu_cau(@yc9,  @ds3);
CALL sp_tiep_nhan_yeu_cau(@yc10, @ds2);
CALL sp_tiep_nhan_yeu_cau(@yc11, @ds3);
CALL sp_tiep_nhan_yeu_cau(@yc12, @ds4);
CALL sp_tiep_nhan_yeu_cau(@yc13, @ds4);
CALL sp_tiep_nhan_yeu_cau(@yc14, @ds6);
CALL sp_tiep_nhan_yeu_cau(@yc15, @ds3);   -- yêu cầu 15: đã tiếp nhận, chưa kê toa

-- 8b. Kê toa theo phác đồ (toa tạo ở cho_duyet)
CALL sp_ke_don_tu_yeu_cau(@yc0,  @ds6, NULL, @pd5,  'Cảm lạnh thông thường',                      '2026-09-20', 5,  @toa0);
CALL sp_ke_don_tu_yeu_cau(@yc1,  @ds6, NULL, @pd6,  'Viêm phế quản cấp',                          '2026-09-21', 5,  @toa1);
CALL sp_ke_don_tu_yeu_cau(@yc2,  @ds6, NULL, @pd7,  'Hen phế quản đợt nhẹ, hết thuốc cắt cơn',    '2026-09-22', 5,  @toa2);
CALL sp_ke_don_tu_yeu_cau(@yc3,  @ds5, NULL, @pd8,  'Viêm mũi dị ứng',                            '2026-09-23', 5,  @toa3);
CALL sp_ke_don_tu_yeu_cau(@yc4,  @ds2, NULL, @pd9,  'Viêm dạ dày',                                '2026-09-24', 5,  @toa4);
CALL sp_ke_don_tu_yeu_cau(@yc5,  @ds2, NULL, @pd10, 'Tiêu chảy cấp, chưa có dấu hiệu mất nước nặng','2026-09-25', 5, @toa5);
CALL sp_ke_don_tu_yeu_cau(@yc6,  @ds5, NULL, @pd11, 'Nấm da vùng bẹn',                            '2026-09-26', 5,  @toa6);
CALL sp_ke_don_tu_yeu_cau(@yc7,  @ds5, NULL, @pd12, 'Nhiễm khuẩn da (nhọt) khu trú',              '2026-09-27', 5,  @toa7);
CALL sp_ke_don_tu_yeu_cau(@yc8,  @ds4, NULL, @pd13, 'Viêm kết mạc cấp',                           '2026-09-28', 5,  @toa8);
CALL sp_ke_don_tu_yeu_cau(@yc9,  @ds3, NULL, @pd14, 'Thoái hóa khớp gối',                         '2026-09-29', 10, @toa9);
CALL sp_ke_don_tu_yeu_cau(@yc10, @ds2, NULL, @pd15, 'Đau thắt lưng cấp do căng cơ',               '2026-10-01', 5,  @toa10);
CALL sp_ke_don_tu_yeu_cau(@yc11, @ds3, NULL, @pd16, 'Viêm đường tiết niệu dưới',                  '2026-10-02', 5,  @toa11);
CALL sp_ke_don_tu_yeu_cau(@yc12, @ds4, NULL, @pd17, 'Nhiễm giun đường ruột',                      '2026-10-03', 5,  @toa12);
CALL sp_ke_don_tu_yeu_cau(@yc13, @ds4, NULL, @pd18, 'Thiếu vitamin D ở trẻ nhỏ',                  '2026-10-03', 5,  @toa13);
CALL sp_ke_don_tu_yeu_cau(@yc14, @ds6, NULL, @pd19, 'Viêm họng cấp (dị ứng nhóm penicillin)',     '2026-10-04', 5,  @toa14);

-- 8c. Dược sĩ khác duyệt toa (người kê KHÁC người duyệt)
UPDATE don_thuoc
   SET trang_thai = 'da_duyet', id_nhan_vien_duyet = @nv_ds,
       ngay_duyet = TIMESTAMP(ngay_ke_don, '11:00:00'),
       ghi_chu_duyet = 'Nhóm thuốc phù hợp triệu chứng, đã đối chiếu tiền sử dị ứng'
 WHERE id IN (@toa0, @toa1, @toa2, @toa3, @toa4, @toa5, @toa6, @toa7, @toa8, @toa9,
              @toa12, @toa13, @toa14);
-- toa10 giữ cho_duyet (hàng đợi duyệt); toa11 bị từ chối:
UPDATE don_thuoc
   SET trang_thai = 'tu_choi', id_nhan_vien_duyet = @ds5,
       ngay_duyet = TIMESTAMP(ngay_ke_don, '15:00:00'),
       ghi_chu_duyet = 'Cần xét nghiệm nước tiểu trước khi dùng kháng sinh'
 WHERE id = @toa11;

-- 8d. Yêu cầu không kê toa: từ chối / khách tự hủy / còn chờ
CALL sp_tu_choi_yeu_cau(@yc16, @ds3, 'Đau ngực kèm khó thở có thể liên quan tim mạch, cần đi cấp cứu hoặc khám chuyên khoa ngay');
CALL sp_tu_choi_yeu_cau(@yc17, @ds6, 'Sốt cao kéo dài kèm phát ban, cần khám và xét nghiệm trực tiếp');
UPDATE yeu_cau_ke_don SET trang_thai = 'da_huy' WHERE id = @yc18;   -- khách tự hủy khi chưa tiếp nhận
-- @yc0+19, +20, +21 còn ở cho_tiep_nhan (hiện trong v_yeu_cau_cho_tiep_nhan)

-- Thời điểm tiếp nhận = 30 phút sau khi khách gửi yêu cầu
UPDATE yeu_cau_ke_don SET ngay_tiep_nhan = DATE_ADD(ngay_tao, INTERVAL 30 MINUTE)
 WHERE id >= @yc0 AND ngay_tiep_nhan IS NOT NULL;

-- 8e. Toa khách tự upload ảnh (5 toa): 3 duyệt, 1 chờ, 1 từ chối
INSERT INTO don_thuoc (id_khach_hang, id_nhan_vien_ke_don, id_benh, chan_doan, hinh_anh_don_thuoc,
                       ngay_ke_don, so_ngay_hieu_luc, trang_thai, id_nhan_vien_duyet, ngay_duyet, ghi_chu_duyet) VALUES
(@kh5, NULL, (SELECT id FROM benh WHERE ma_icd='K29'), 'Viêm dạ dày cấp',                '/images/don_thuoc/toa_10.jpg', '2026-09-26', 10, 'cho_duyet', NULL, NULL, NULL),
(@kh6, NULL, (SELECT id FROM benh WHERE ma_icd='M54'), 'Đau lưng, căng cơ',              '/images/don_thuoc/toa_11.jpg', '2026-09-27', 10, 'cho_duyet', NULL, NULL, NULL),
(@kh7, NULL, (SELECT id FROM benh WHERE ma_icd='I10'), 'Tăng huyết áp kèm đái tháo đường','/images/don_thuoc/toa_12.jpg','2026-09-28', 30, 'cho_duyet', NULL, NULL, NULL),
(@kh8, NULL, (SELECT id FROM benh WHERE ma_icd='M19'), 'Thoái hóa khớp',                 '/images/don_thuoc/toa_13.jpg', '2026-10-06', 10, 'cho_duyet', NULL, NULL, NULL),
(@kh9, NULL, (SELECT id FROM benh WHERE ma_icd='J30'), 'Viêm mũi dị ứng',                '/images/don_thuoc/toa_14.jpg', '2026-10-05', 5,  'tu_choi', @nv_ds, '2026-10-05 16:00:00', 'Ảnh toa mờ, không đọc được liều dùng');
SET @toa15 := LAST_INSERT_ID();
SET @toa16 := @toa15 + 1, @toa17 := @toa15 + 2, @toa18 := @toa15 + 3, @toa19 := @toa15 + 4;

INSERT INTO chi_tiet_don_thuoc (id_don_thuoc, id_thuoc, so_luong_ke, lieu_dung, so_ngay_dung) VALUES
(@toa15, @t7,  1, 'Uống 1 viên trước bữa sáng 30 phút', 14),
(@toa15, @t36, 1, 'Uống 1 gói/ngày pha với nước nguội', 10),
(@toa16, @t17, 1, 'Uống 1 viên x 2 lần/ngày sau ăn no', 5),
(@toa16, @t20, 2, 'Dán 1 miếng/ngày vào vùng đau', 5),
(@toa17, @t9,  2, 'Uống 1 viên mỗi sáng', 30),
(@toa17, @t10, 1, 'Uống 1 viên x 2 lần/ngày trong bữa ăn', 30),
(@toa18, @t18, 1, 'Uống 1 viên/ngày sau ăn no', 7),
(@toa18, @t7,  1, 'Uống 1 viên/ngày trước bữa sáng', 7),
(@toa19, @t29, 1, 'Không đọc được', NULL),
(@toa19, @t24, 2, 'Không đọc được', NULL);

UPDATE don_thuoc
   SET trang_thai = 'da_duyet', id_nhan_vien_duyet = @nv_ds,
       ngay_duyet = TIMESTAMP(ngay_ke_don, '11:00:00'),
       ghi_chu_duyet = 'Đã đối chiếu ảnh toa với cơ sở khám'
 WHERE id IN (@toa15, @toa16, @toa17);
-- toa18 giữ cho_duyet, toa19 đã tu_choi

-- =========================================================================
-- 9. ĐƠN ĐẶT THUỐC (21 đơn). Tạo ở cho_xac_nhan -> thêm chi tiết (trigger kiểm
--    tra toa, SL kê, tồn kho) -> UPDATE trạng thái (trigger xuất kho FEFO).
-- =========================================================================
INSERT INTO don_dat_thuoc (id_khach_hang, id_don_thuoc, id_khuyen_mai, ngay_dat, tong_tien, giam_gia, thanh_tien, dia_chi_giao_hang, so_dien_thoai_nhan, trang_thai) VALUES
(@kh5,  @toa0,  NULL,     '2026-09-21 09:00:00', 128000.00,      0.00, 128000.00, '', NULL, 'cho_xac_nhan'),  -- dd0
(@kh6,  @toa1,  @km_g20,  '2026-09-22 10:30:00', 289000.00,  20000.00, 269000.00, '', NULL, 'cho_xac_nhan'),  -- dd1
(@kh7,  @toa2,  NULL,     '2026-09-23 08:45:00',  75000.00,      0.00,  75000.00, '', NULL, 'cho_xac_nhan'),  -- dd2
(@kh8,  @toa3,  @km_cm10, '2026-09-24 09:30:00',  95000.00,   9500.00,  85500.00, '', NULL, 'cho_xac_nhan'),  -- dd3
(@kh9,  @toa4,  @km_g20,  '2026-09-25 14:00:00', 260000.00,  20000.00, 240000.00, '', NULL, 'cho_xac_nhan'),  -- dd4
(@kh10, @toa5,  NULL,     '2026-09-26 11:15:00', 237000.00,      0.00, 237000.00, '', NULL, 'cho_xac_nhan'),  -- dd5
(@kh11, @toa6,  NULL,     '2026-09-27 16:20:00',  64000.00,      0.00,  64000.00, '', NULL, 'cho_xac_nhan'),  -- dd6
(@kh12, @toa7,  @km_fs15, '2026-09-28 10:00:00', 138000.00,  15000.00, 123000.00, '', NULL, 'cho_xac_nhan'),  -- dd7
(@kh13, @toa8,  NULL,     '2026-09-29 13:40:00',  57000.00,      0.00,  57000.00, '', NULL, 'cho_xac_nhan'),  -- dd8
(@kh14, @toa9,  @km_g30,  '2026-09-30 09:10:00', 324000.00,  30000.00, 294000.00, '', NULL, 'cho_xac_nhan'),  -- dd9
(@kh17, @toa12, NULL,     '2026-10-04 08:30:00',  78000.00,      0.00,  78000.00, '', NULL, 'cho_xac_nhan'),  -- dd10
(@kh18, @toa13, @km_g30,  '2026-10-05 09:00:00', 306000.00,  30000.00, 276000.00, '', NULL, 'cho_xac_nhan'),  -- dd11
(@kh19, @toa14, @km_fs15, '2026-10-05 20:15:00', 161000.00,  15000.00, 146000.00, '', NULL, 'cho_xac_nhan'),  -- dd12
(@kh5,  @toa15, @km_g20,  '2026-09-27 15:00:00', 205000.00,  20000.00, 185000.00, '', NULL, 'cho_xac_nhan'),  -- dd13
(@kh6,  @toa16, NULL,     '2026-09-28 17:30:00', 102000.00,      0.00, 102000.00, '', NULL, 'cho_xac_nhan'),  -- dd14
(@kh7,  @toa17, NULL,     '2026-09-29 12:00:00', 128000.00,      0.00, 128000.00, '', NULL, 'cho_xac_nhan'),  -- dd15
(@kh20, NULL,   @km_km20, '2026-09-30 18:45:00', 203000.00,  40600.00, 162400.00, '', NULL, 'cho_xac_nhan'),  -- dd16
(@kh21, NULL,   @km_g30,  '2026-10-02 19:30:00', 381000.00,  30000.00, 351000.00, '', NULL, 'cho_xac_nhan'),  -- dd17
(@kh22, NULL,   @km_g50,  '2026-10-03 21:00:00', 970000.00,  50000.00, 920000.00, '', NULL, 'cho_xac_nhan'),  -- dd18
(@kh23, NULL,   @km_v15,  '2026-10-06 07:50:00', 369000.00,  55350.00, 313650.00, '', NULL, 'cho_xac_nhan'),  -- dd19
(@kh24, NULL,   NULL,     '2026-10-06 22:10:00', 206000.00,      0.00, 206000.00, '', NULL, 'cho_xac_nhan');  -- dd20
SET @dd0 := LAST_INSERT_ID();
SET @dd1  := @dd0 + 1,  @dd2  := @dd0 + 2,  @dd3  := @dd0 + 3,  @dd4  := @dd0 + 4,  @dd5  := @dd0 + 5,
    @dd6  := @dd0 + 6,  @dd7  := @dd0 + 7,  @dd8  := @dd0 + 8,  @dd9  := @dd0 + 9,  @dd10 := @dd0 + 10,
    @dd11 := @dd0 + 11, @dd12 := @dd0 + 12, @dd13 := @dd0 + 13, @dd14 := @dd0 + 14, @dd15 := @dd0 + 15,
    @dd16 := @dd0 + 16, @dd17 := @dd0 + 17, @dd18 := @dd0 + 18, @dd19 := @dd0 + 19, @dd20 := @dd0 + 20;

-- Địa chỉ và SĐT nhận hàng lấy theo hồ sơ khách hàng
UPDATE don_dat_thuoc d JOIN khach_hang k ON k.id = d.id_khach_hang
   SET d.dia_chi_giao_hang = k.dia_chi, d.so_dien_thoai_nhan = k.so_dien_thoai
 WHERE d.id >= @dd0;

INSERT INTO chi_tiet_don_dat (id_don_dat, id_thuoc, so_luong, don_gia) VALUES
(@dd0,  @t5,  2,  28000.00), (@dd0,  @t4,  1,  60000.00), (@dd0,  @t24, 2,   6000.00),
(@dd1,  @t8,  1, 120000.00), (@dd1,  @t28, 1,  45000.00), (@dd1,  @t1,  1,  35000.00), (@dd1, @t11, 1, 89000.00),
(@dd2,  @t27, 2,  15000.00), (@dd2,  @t28, 1,  45000.00),
(@dd3,  @t29, 1,  28000.00), (@dd3,  @t24, 2,   6000.00), (@dd3,  @t26, 1,  55000.00),
(@dd4,  @t7,  2,  55000.00), (@dd4,  @t36, 1, 150000.00),
(@dd5,  @t12, 3,  25000.00), (@dd5,  @t6,  1,  12000.00), (@dd5,  @t36, 1, 150000.00),
(@dd6,  @t21, 1,  22000.00), (@dd6,  @t31, 1,  42000.00),
(@dd7,  @t23, 1,  65000.00), (@dd7,  @t22, 1,  38000.00), (@dd7,  @t1,  1,  35000.00),
(@dd8,  @t25, 1,  45000.00), (@dd8,  @t24, 2,   6000.00),
(@dd9,  @t18, 1,  52000.00), (@dd9,  @t19, 1, 185000.00), (@dd9,  @t7,  1,  55000.00), (@dd9, @t20, 1, 32000.00),
(@dd10, @t30, 1,  18000.00), (@dd10, @t4,  1,  60000.00),
(@dd11, @t35, 2,  78000.00), (@dd11, @t36, 1, 150000.00),
(@dd12, @t8,  1, 120000.00), (@dd12, @t1,  1,  35000.00), (@dd12, @t24, 1,   6000.00),
(@dd13, @t7,  1,  55000.00), (@dd13, @t36, 1, 150000.00),
(@dd14, @t17, 1,  38000.00), (@dd14, @t20, 2,  32000.00),
(@dd15, @t9,  2,  40000.00), (@dd15, @t10, 1,  48000.00),
(@dd16, @t14, 3,  35000.00), (@dd16, @t16, 1,  30000.00), (@dd16, @t32, 1,  68000.00),
(@dd17, @t33, 1,  95000.00), (@dd17, @t32, 2,  68000.00), (@dd17, @t36, 1, 150000.00),
(@dd18, @t34, 1, 120000.00), (@dd18, @t13, 1, 850000.00),
(@dd19, @t19, 1, 185000.00), (@dd19, @t20, 2,  32000.00), (@dd19, @t4,  2,  60000.00),
(@dd20, @t11, 2,  89000.00), (@dd20, @t5,  1,  28000.00);

-- Chuyển trạng thái: trigger tự xuất kho FEFO khi xác nhận (hoặc nhảy cóc),
-- hủy đơn đã xuất kho thì hoàn kho đúng lô, hủy khi chưa xuất thì không động kho.
UPDATE don_dat_thuoc SET trang_thai = 'hoan_thanh'
 WHERE id IN (@dd0, @dd1, @dd2, @dd3, @dd4, @dd5, @dd6, @dd13, @dd14, @dd15, @dd16);
UPDATE don_dat_thuoc SET trang_thai = 'dang_giao'     WHERE id IN (@dd7, @dd8, @dd17);
UPDATE don_dat_thuoc SET trang_thai = 'dang_chuan_bi' WHERE id = @dd9;
UPDATE don_dat_thuoc SET trang_thai = 'da_xac_nhan'   WHERE id IN (@dd10, @dd11, @dd18);
UPDATE don_dat_thuoc SET trang_thai = 'da_huy'        WHERE id = @dd18;  -- đã xuất kho -> hoàn kho
UPDATE don_dat_thuoc SET trang_thai = 'da_huy'        WHERE id = @dd20;  -- chưa xuất kho -> không hoàn
-- dd12 và dd19 giữ nguyên cho_xac_nhan

-- Cập nhật lượt dùng khuyến mãi theo các đơn không bị hủy
UPDATE khuyen_mai k
  JOIN (SELECT id_khuyen_mai, COUNT(*) AS so_lan
          FROM don_dat_thuoc
         WHERE id >= @dd0 AND id_khuyen_mai IS NOT NULL AND trang_thai <> 'da_huy'
         GROUP BY id_khuyen_mai) x ON x.id_khuyen_mai = k.id
   SET k.so_luong_da_dung = k.so_luong_da_dung + x.so_lan;

-- =========================================================================
-- 10. LỊCH SỬ THEO DÕI ĐƠN (tự sinh theo trạng thái cuối của từng đơn)
-- =========================================================================
INSERT INTO lich_su_theo_doi_don (id_don_dat, trang_thai_cap_nhat, thoi_gian_cap_nhat, ghi_chu)
SELECT id, 'cho_xac_nhan', ngay_dat, 'Khách hàng đặt đơn mới'
  FROM don_dat_thuoc WHERE id >= @dd0;

INSERT INTO lich_su_theo_doi_don (id_don_dat, trang_thai_cap_nhat, thoi_gian_cap_nhat, ghi_chu)
SELECT id, 'da_xac_nhan', DATE_ADD(ngay_dat, INTERVAL 1 HOUR), 'Dược sĩ đã xác nhận đơn'
  FROM don_dat_thuoc
 WHERE id >= @dd0
   AND (trang_thai IN ('da_xac_nhan', 'dang_chuan_bi', 'dang_giao', 'hoan_thanh') OR id = @dd18);

INSERT INTO lich_su_theo_doi_don (id_don_dat, trang_thai_cap_nhat, thoi_gian_cap_nhat, ghi_chu)
SELECT id, 'dang_chuan_bi', DATE_ADD(ngay_dat, INTERVAL 4 HOUR), 'Đang đóng gói'
  FROM don_dat_thuoc
 WHERE id >= @dd0 AND trang_thai IN ('dang_chuan_bi', 'dang_giao', 'hoan_thanh');

INSERT INTO lich_su_theo_doi_don (id_don_dat, trang_thai_cap_nhat, thoi_gian_cap_nhat, ghi_chu)
SELECT id, 'dang_giao', DATE_ADD(ngay_dat, INTERVAL 1 DAY), 'Bàn giao cho đơn vị vận chuyển'
  FROM don_dat_thuoc
 WHERE id >= @dd0 AND trang_thai IN ('dang_giao', 'hoan_thanh');

INSERT INTO lich_su_theo_doi_don (id_don_dat, trang_thai_cap_nhat, thoi_gian_cap_nhat, ghi_chu)
SELECT id, 'hoan_thanh', DATE_ADD(ngay_dat, INTERVAL 2 DAY), 'Giao thành công'
  FROM don_dat_thuoc
 WHERE id >= @dd0 AND trang_thai = 'hoan_thanh';

INSERT INTO lich_su_theo_doi_don (id_don_dat, trang_thai_cap_nhat, thoi_gian_cap_nhat, ghi_chu)
SELECT id, 'da_huy', DATE_ADD(ngay_dat, INTERVAL 2 HOUR),
       IF(id = @dd18, 'Khách yêu cầu hủy sau khi xác nhận, đã hoàn kho đúng lô', 'Khách hủy đơn khi chưa xác nhận')
  FROM don_dat_thuoc
 WHERE id >= @dd0 AND trang_thai = 'da_huy';

-- =========================================================================
-- 11. THANH TOÁN (21) + HÓA ĐƠN (11 đơn hoàn thành)
-- =========================================================================
INSERT INTO thanh_toan (id_don_dat, phuong_thuc, ma_giao_dich, so_tien, trang_thai, thoi_gian_thanh_toan) VALUES
(@dd0,  'COD',          NULL,             128000.00, 'da_thanh_toan',  '2026-09-23 10:00:00'),
(@dd1,  'chuyen_khoan', 'VCB20260922101', 269000.00, 'da_thanh_toan',  '2026-09-22 10:40:00'),
(@dd2,  'vi_dien_tu',   'MOMO20260923201', 75000.00, 'da_thanh_toan',  '2026-09-23 08:50:00'),
(@dd3,  'COD',          NULL,              85500.00, 'da_thanh_toan',  '2026-09-26 15:00:00'),
(@dd4,  'chuyen_khoan', 'TCB20260925301', 240000.00, 'da_thanh_toan',  '2026-09-25 14:05:00'),
(@dd5,  'vi_dien_tu',   'ZLP20260926401', 237000.00, 'da_thanh_toan',  '2026-09-26 11:20:00'),
(@dd6,  'COD',          NULL,              64000.00, 'da_thanh_toan',  '2026-09-29 09:30:00'),
(@dd7,  'chuyen_khoan', 'VCB20260928502', 123000.00, 'da_thanh_toan',  '2026-09-28 10:05:00'),
(@dd8,  'COD',          NULL,              57000.00, 'cho_thanh_toan', NULL),
(@dd9,  'vi_dien_tu',   'MOMO20260930603', 294000.00,'da_thanh_toan',  '2026-09-30 09:15:00'),
(@dd10, 'chuyen_khoan', 'ACB20261004704',  78000.00, 'da_thanh_toan',  '2026-10-04 08:35:00'),
(@dd11, 'vi_dien_tu',   'MOMO20261005805', 276000.00,'da_thanh_toan',  '2026-10-05 09:05:00'),
(@dd12, 'COD',          NULL,             146000.00, 'cho_thanh_toan', NULL),
(@dd13, 'vi_dien_tu',   'ZLP20260927906', 185000.00, 'da_thanh_toan',  '2026-09-27 15:05:00'),
(@dd14, 'COD',          NULL,             102000.00, 'da_thanh_toan',  '2026-09-30 11:00:00'),
(@dd15, 'chuyen_khoan', 'VCB20260929107', 128000.00, 'da_thanh_toan',  '2026-09-29 12:05:00'),
(@dd16, 'vi_dien_tu',   'MOMO20260930208', 162400.00,'da_thanh_toan',  '2026-09-30 18:50:00'),
(@dd17, 'chuyen_khoan', 'TCB20261002309', 351000.00, 'da_thanh_toan',  '2026-10-02 19:35:00'),
(@dd18, 'chuyen_khoan', 'VCB20261003410', 920000.00, 'da_hoan_tien',   '2026-10-03 21:05:00'),
(@dd19, 'vi_dien_tu',   'MOMO20261006511', 313650.00,'cho_thanh_toan', NULL),
(@dd20, 'vi_dien_tu',   'ZLP20261006612', 206000.00, 'that_bai',       NULL);

INSERT INTO hoa_don (id_don_dat, so_hoa_don, ngay_xuat, tong_tien_truoc_thue, thue_vat, tong_tien_sau_thue)
SELECT id, CONCAT('HD2026', LPAD(id + 1000, 6, '0')), DATE_ADD(ngay_dat, INTERVAL 2 DAY),
       thanh_tien, 0, thanh_tien
  FROM don_dat_thuoc
 WHERE id >= @dd0 AND trang_thai = 'hoan_thanh';

-- =========================================================================
-- 12. ĐÁNH GIÁ (20)
-- =========================================================================
INSERT INTO danh_gia (id_khach_hang, id_thuoc, so_sao, noi_dung) VALUES
(@kh5,  @t5,  4, 'Giảm nghẹt mũi khá nhanh, hơi buồn ngủ.'),
(@kh5,  @t4,  5, 'Viên sủi vị cam dễ uống.'),
(@kh5,  @t36, 4, 'Dạ dày đỡ khó chịu sau vài ngày dùng.'),
(@kh6,  @t8,  5, 'Đúng thuốc trong toa, đóng gói cẩn thận.'),
(@kh6,  @t11, 4, 'Siro dễ uống, ho dịu hơn sau 2 ngày.'),
(@kh6,  @t17, 4, 'Giảm đau lưng tốt, nên uống sau ăn no.'),
(@kh6,  @t20, 5, 'Miếng dán bám chắc, ít mùi.'),
(@kh7,  @t27, 5, 'Đỡ khò khè nhanh, giao hàng đúng hẹn.'),
(@kh7,  @t9,  5, 'Thuốc huyết áp đúng toa, hạn dùng còn dài.'),
(@kh7,  @t10, 4, 'Giá hợp lý, đóng gói gọn.'),
(@kh8,  @t26, 4, 'Xịt mũi hiệu quả nhưng chỉ nên dùng ngắn ngày.'),
(@kh8,  @t29, 5, 'Hết hắt hơi sau 2 ngày.'),
(@kh9,  @t7,  4, 'Đỡ ợ chua rõ rệt, uống trước ăn sáng.'),
(@kh9,  @t36, 5, 'Gói pha dễ uống, bụng êm hơn.'),
(@kh10, @t12, 5, 'Bù nước tốt, pha đúng hướng dẫn.'),
(@kh10, @t6,  3, 'Thuốc ổn nhưng lọ hơi nhỏ.'),
(@kh11, @t21, 4, 'Bôi vài ngày đỡ ngứa.'),
(@kh11, @t31, 5, 'Một viên là xong theo hướng dẫn của dược sĩ.'),
(@kh20, @t14, 2, 'Khẩu trang hơi mỏng, đeo lâu bị nóng.'),
(@kh20, @t32, 5, 'Kem đánh răng giảm ê buốt thấy rõ sau một tuần.');

-- =========================================================================
-- 13. KIỂM TRA SAU KHI CHẠY
-- =========================================================================
-- 13a. Số dòng các bảng chính
SELECT 'khach_hang' AS bang, COUNT(*) AS so_dong FROM khach_hang
UNION ALL SELECT 'nhan_vien', COUNT(*) FROM nhan_vien
UNION ALL SELECT 'nha_cung_cap', COUNT(*) FROM nha_cung_cap
UNION ALL SELECT 'danh_muc_thuoc', COUNT(*) FROM danh_muc_thuoc
UNION ALL SELECT 'thuoc', COUNT(*) FROM thuoc
UNION ALL SELECT 'lo_thuoc', COUNT(*) FROM lo_thuoc
UNION ALL SELECT 'benh', COUNT(*) FROM benh
UNION ALL SELECT 'phac_do', COUNT(*) FROM phac_do
UNION ALL SELECT 'khuyen_mai', COUNT(*) FROM khuyen_mai
UNION ALL SELECT 'gio_hang', COUNT(*) FROM gio_hang
UNION ALL SELECT 'phieu_nhap_thuoc', COUNT(*) FROM phieu_nhap_thuoc
UNION ALL SELECT 'yeu_cau_ke_don', COUNT(*) FROM yeu_cau_ke_don
UNION ALL SELECT 'don_thuoc', COUNT(*) FROM don_thuoc
UNION ALL SELECT 'don_dat_thuoc', COUNT(*) FROM don_dat_thuoc
UNION ALL SELECT 'thanh_toan', COUNT(*) FROM thanh_toan
UNION ALL SELECT 'hoa_don', COUNT(*) FROM hoa_don
UNION ALL SELECT 'danh_gia', COUNT(*) FROM danh_gia;

-- 13b. Cột tồn tổng hợp phải khớp tổng các lô: câu này PHẢI TRẢ VỀ 0 DÒNG
SELECT t.id, t.ten_thuoc, t.so_luong_ton AS ton_bang_thuoc, COALESCE(SUM(l.so_luong_ton), 0) AS ton_theo_lo
  FROM thuoc t LEFT JOIN lo_thuoc l ON l.id_thuoc = t.id
 GROUP BY t.id, t.ten_thuoc, t.so_luong_ton
HAVING t.so_luong_ton <> COALESCE(SUM(l.so_luong_ton), 0);

-- 13c. Tổng tiền đơn phải khớp chi tiết: câu này PHẢI TRẢ VỀ 0 DÒNG
SELECT d.id, d.tong_tien, SUM(c.so_luong * c.don_gia) AS tong_chi_tiet
  FROM don_dat_thuoc d JOIN chi_tiet_don_dat c ON c.id_don_dat = d.id
 WHERE d.id >= @dd0
 GROUP BY d.id, d.tong_tien
HAVING d.tong_tien <> SUM(c.so_luong * c.don_gia);

-- 13d. Xem nhanh các view nghiệp vụ
SELECT * FROM v_yeu_cau_cho_tiep_nhan;
SELECT * FROM v_yeu_cau_ke_don;
SELECT * FROM v_toa_con_lai WHERE id_don_thuoc >= @toa0;
SELECT * FROM v_thuoc_sap_het_han;
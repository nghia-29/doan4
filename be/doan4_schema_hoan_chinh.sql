-- =========================================================================
-- CSDL BÁN THUỐC TÂY TRỰC TUYẾN - SCHEMA HOÀN CHỈNH (doan4)
-- Gộp: schema gốc doan4 + phần kê đơn/không kê đơn + các bảng lấy từ
--      file nhathuoc.mwb (giỏ hàng, ảnh thuốc, mô tả thuốc chi tiết, hóa đơn)
--      + bổ sung khuyến mãi, thanh toán cho đúng thực tế bán hàng online
-- File này CHẠY THAY THẾ cho 2 file trước, không cần chạy lại file cũ.
-- =========================================================================

DROP DATABASE IF EXISTS doan4;
CREATE DATABASE doan4 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE doan4;

-- =========================================================================
-- 1. TÀI KHOẢN VÀ PHÂN QUYỀN
-- =========================================================================

CREATE TABLE vai_tro (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ten_vai_tro VARCHAR(50) NOT NULL UNIQUE
    -- khach_hang, bac_si, nv_quan_ly, duoc_si, admin
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
-- 2. NGƯỜI DÙNG (khách hàng, nhân viên, bác sĩ)
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
    -- Vai trò cụ thể (nhân viên kho, dược sĩ, quản lý...) lấy từ tai_khoan.id_vai_tro
    FOREIGN KEY (id_tai_khoan) REFERENCES tai_khoan(id)
);

CREATE TABLE bac_si (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_tai_khoan INT NOT NULL UNIQUE,
    ho_ten VARCHAR(100) NOT NULL,
    chuyen_khoa VARCHAR(100),
    so_dien_thoai VARCHAR(15),
    so_chung_chi_hanh_nghe VARCHAR(50) COMMENT 'Số chứng chỉ hành nghề, để xác thực bác sĩ thật',
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
        COMMENT 'khong_ke_don: OTC - bán tự do | ke_don: bắt buộc có toa bác sĩ',
    so_dang_ky VARCHAR(50) COMMENT 'Số đăng ký lưu hành do Bộ Y tế cấp',
    don_vi_tinh VARCHAR(20),
    gia_ban DECIMAL(15,2) NOT NULL,
    so_luong_ton INT DEFAULT 0,
    han_su_dung DATE,
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
-- 6. ĐƠN THUỐC (TOA THUỐC) - bắt buộc với thuốc kê đơn
-- =========================================================================

CREATE TABLE don_thuoc (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_khach_hang INT NOT NULL,
    id_bac_si INT NULL COMMENT 'NULL nếu KH tự upload ảnh toa từ bên ngoài',
    hinh_anh_don_thuoc VARCHAR(255) NULL COMMENT 'Đường dẫn ảnh chụp toa thuốc',
    ngay_ke_don DATE NOT NULL,
    trang_thai VARCHAR(30) NOT NULL DEFAULT 'cho_duyet' COMMENT 'cho_duyet, da_duyet, tu_choi',
    id_nhan_vien_duyet INT NULL COMMENT 'Dược sĩ thực hiện duyệt đơn',
    ngay_duyet DATETIME NULL,
    ghi_chu_duyet TEXT NULL,
    ngay_tao DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_khach_hang) REFERENCES khach_hang(id),
    FOREIGN KEY (id_bac_si) REFERENCES bac_si(id),
    FOREIGN KEY (id_nhan_vien_duyet) REFERENCES nhan_vien(id)
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
    id_don_thuoc INT NULL COMMENT 'Bắt buộc nếu đơn hàng chứa thuốc kê đơn, phải ở trạng thái da_duyet',
    id_khuyen_mai INT NULL,
    ngay_dat DATETIME DEFAULT CURRENT_TIMESTAMP,
    tong_tien DECIMAL(15,2) NOT NULL COMMENT 'Tổng tiền hàng trước giảm giá',
    giam_gia DECIMAL(15,2) DEFAULT 0,
    thanh_tien DECIMAL(15,2) NOT NULL COMMENT 'tong_tien - giam_gia',
    dia_chi_giao_hang TEXT NOT NULL,
    so_dien_thoai_nhan VARCHAR(15),
    trang_thai VARCHAR(50) DEFAULT 'cho_xac_nhan'
        COMMENT 'cho_xac_nhan, dang_giao, hoan_thanh, da_huy',
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
-- 10. NHẬP KHO THUỐC
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

-- =========================================================================
-- 11. TRIGGER - LOGIC NGHIỆP VỤ QUAN TRỌNG
-- =========================================================================

DELIMITER $$

-- 11.1 Chặn bán thuốc kê đơn khi chưa có đơn thuốc đã được duyệt
CREATE TRIGGER trg_kiem_tra_thuoc_ke_don
BEFORE INSERT ON chi_tiet_don_dat
FOR EACH ROW
BEGIN
    DECLARE v_loai_ke_don VARCHAR(20);
    DECLARE v_id_don_thuoc INT;
    DECLARE v_trang_thai_don_thuoc VARCHAR(30);

    SELECT loai_ke_don INTO v_loai_ke_don FROM thuoc WHERE id = NEW.id_thuoc;

    IF v_loai_ke_don = 'ke_don' THEN
        SELECT id_don_thuoc INTO v_id_don_thuoc
        FROM don_dat_thuoc WHERE id = NEW.id_don_dat;

        IF v_id_don_thuoc IS NULL THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Đơn hàng chứa thuốc kê đơn nhưng chưa có đơn thuốc kèm theo';
        ELSE
            SELECT trang_thai INTO v_trang_thai_don_thuoc
            FROM don_thuoc WHERE id = v_id_don_thuoc;

            IF v_trang_thai_don_thuoc <> 'da_duyet' THEN
                SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'Đơn thuốc kèm theo chưa được dược sĩ duyệt';
            END IF;
        END IF;
    END IF;
END$$

-- 11.2 Tự động trừ tồn kho khi khách đặt hàng
CREATE TRIGGER trg_tru_ton_khi_dat_hang
AFTER INSERT ON chi_tiet_don_dat
FOR EACH ROW
BEGIN
    UPDATE thuoc SET so_luong_ton = so_luong_ton - NEW.so_luong
    WHERE id = NEW.id_thuoc;
END$$

-- 11.3 Tự động cộng tồn kho khi nhập hàng từ nhà cung cấp
CREATE TRIGGER trg_cong_ton_khi_nhap_hang
AFTER INSERT ON chi_tiet_phieu_nhap
FOR EACH ROW
BEGIN
    UPDATE thuoc SET so_luong_ton = so_luong_ton + NEW.so_luong
    WHERE id = NEW.id_thuoc;
END$$

DELIMITER ;

-- =========================================================================
-- 12. VIEW TIỆN TRA CỨU
-- =========================================================================

CREATE VIEW v_thuoc_ke_don AS
SELECT id, ten_thuoc, so_dang_ky FROM thuoc WHERE loai_ke_don = 'ke_don';

CREATE VIEW v_thuoc_sap_het_han AS
SELECT id, ten_thuoc, han_su_dung, so_luong_ton
FROM thuoc
WHERE han_su_dung <= DATE_ADD(CURDATE(), INTERVAL 60 DAY);

-- =========================================================================
-- 13. DỮ LIỆU MẪU
-- =========================================================================

INSERT INTO vai_tro (ten_vai_tro) VALUES
('khach_hang'), ('bac_si'), ('nv_quan_ly'), ('duoc_si'), ('admin');

INSERT INTO tai_khoan (ten_dang_nhap, mat_khau, id_vai_tro, trang_thai) VALUES
('khachhang1', '123456', 1, 1),
('bacsi1', '123456', 2, 1),
('nhanvien1', '123456', 3, 1),
('duocsi1', '123456', 4, 1),
('admin1', '123456', 5, 1);

INSERT INTO khach_hang (id_tai_khoan, ho_ten, so_dien_thoai, email, dia_chi, ngay_sinh) VALUES
(1, 'Nguyễn Văn Khách', '0901234567', 'khachhang1@gmail.com', '123 Lê Lợi, Quận 1, TP.HCM', '1995-05-15');

INSERT INTO bac_si (id_tai_khoan, ho_ten, chuyen_khoa, so_dien_thoai, so_chung_chi_hanh_nghe) VALUES
(2, 'Trần Thị Bác Sĩ', 'Nội tổng hợp', '0912345678', 'CCHN-00981');

INSERT INTO nhan_vien (id_tai_khoan, ho_ten, so_dien_thoai, email) VALUES
(3, 'Lê Quản Lý', '0923456789', 'quanly1@nhathuoc.com'),
(4, 'Phạm Thị Dược Sĩ', '0934567890', 'duocsi1@nhathuoc.com');

INSERT INTO nha_cung_cap (ten_nha_cung_cap, ma_so_thue, so_dien_thoai, email, dia_chi, nguoi_lien_he) VALUES
('Công ty Dược Hậu Giang', '1800156801', '02923891433', 'dhg@dhgpharma.com.vn', '288 Bis Nguyễn Văn Cừ, Cần Thơ', 'Nguyễn Văn A'),
('Công ty Cổ phần Traphaco', '0100108656', '02436815151', 'info@traphaco.com.vn', '75 Yên Ninh, Ba Đình, Hà Nội', 'Trần Thị B');

INSERT INTO danh_muc_thuoc (ten_danh_muc, mo_ta) VALUES
('Thuốc giảm đau, hạ sốt', 'Các loại thuốc giúp giảm triệu chứng đau và hạ sốt'),
('Thuốc kháng sinh', 'Thuốc điều trị các bệnh nhiễm khuẩn'),
('Thực phẩm chức năng', 'Hỗ trợ bồi bổ sức khỏe');

INSERT INTO thuoc (ma_sku, ten_thuoc, id_danh_muc, id_nha_cung_cap, loai_ke_don, so_dang_ky, don_vi_tinh, gia_ban, so_luong_ton, han_su_dung) VALUES
('SKU001', 'Paracetamol 500mg', 1, 1, 'khong_ke_don', 'VD-54321-18', 'Hộp', 35000.00, 150, '2026-12-31'),
('SKU002', 'Amoxicillin 500mg', 2, 1, 'ke_don', 'VD-12345-19', 'Vỉ', 45000.00, 200, '2027-06-30'),
('SKU003', 'Boganic', 3, 2, 'khong_ke_don', NULL, 'Hộp', 95000.00, 50, '2026-10-15');

INSERT INTO mo_ta_thuoc (id_thuoc, thuong_hieu, dang_bao_che, quy_cach_dong_goi, ham_luong, thanh_phan, cong_dung, doi_tuong_su_dung, huong_dan_su_dung, lieu_dung_khuyen_cao, bao_quan, canh_bao) VALUES
(1, 'DHG Pharma', 'Viên nén', 'Hộp 10 vỉ x 10 viên', '500mg', 'Paracetamol',
 'Giảm đau, hạ sốt nhanh chóng', 'Người lớn và trẻ em trên 12 tuổi',
 'Uống với nhiều nước sau ăn', 'Người lớn: 1-2 viên/lần, cách 4-6 giờ, tối đa 8 viên/ngày',
 'Nơi khô ráo, dưới 30°C, tránh ánh sáng', 'Không dùng quá liều, thận trọng với người suy gan'),
(2, 'DHG Pharma', 'Viên nang', 'Vỉ 10 viên', '500mg', 'Amoxicillin trihydrat',
 'Điều trị nhiễm khuẩn hô hấp, tai mũi họng', 'Theo chỉ định của bác sĩ',
 'Uống theo đúng liều và đủ thời gian bác sĩ kê', NULL,
 'Nơi khô ráo, dưới 30°C', 'Chỉ dùng khi có đơn của bác sĩ, ngưng thuốc nếu dị ứng'),
(3, 'Traphaco', 'Viên nén bao phim', 'Hộp 5 vỉ x 10 viên', NULL, 'Cao atisô, rau đắng đất',
 'Mát gan, giải độc gan', 'Người lớn', 'Uống sau ăn', '1-2 viên/lần, 2-3 lần/ngày',
 'Nơi khô ráo, tránh ánh sáng', 'Không dùng cho phụ nữ có thai chưa hỏi ý kiến bác sĩ');

INSERT INTO anh_thuoc (id_thuoc, duong_dan_anh, la_anh_chinh, thu_tu) VALUES
(1, '/images/thuoc/paracetamol_1.jpg', 1, 1),
(2, '/images/thuoc/amoxicillin_1.jpg', 1, 1),
(3, '/images/thuoc/boganic_1.jpg', 1, 1);

INSERT INTO gio_hang (id_khach_hang, id_thuoc, so_luong) VALUES
(1, 3, 1);

INSERT INTO khuyen_mai (ma_code, mo_ta, loai_giam, gia_tri_giam, don_toi_thieu, ngay_bat_dau, ngay_ket_thuc, so_luong_toi_da) VALUES
('CHAOMUNG10', 'Giảm 10% cho đơn hàng đầu tiên', 'phan_tram', 10, 50000, '2026-01-01', '2026-12-31', 1000);

INSERT INTO don_thuoc (id_khach_hang, id_bac_si, ngay_ke_don, trang_thai, id_nhan_vien_duyet, ngay_duyet, ghi_chu_duyet) VALUES
(1, 1, '2026-09-20', 'da_duyet', 2, NOW(), 'Toa hợp lệ, đã đối chiếu với bác sĩ kê');

INSERT INTO chi_tiet_don_thuoc (id_don_thuoc, id_thuoc, so_luong_ke, lieu_dung, so_ngay_dung) VALUES
(1, 2, 1, 'Ngày uống 3 lần, mỗi lần 1 viên sau ăn', 7);

INSERT INTO don_dat_thuoc (id_khach_hang, id_don_thuoc, id_khuyen_mai, tong_tien, giam_gia, thanh_tien, dia_chi_giao_hang, so_dien_thoai_nhan, trang_thai) VALUES
(1, 1, NULL, 45000.00, 0, 45000.00, '123 Lê Lợi, Quận 1, TP.HCM', '0901234567', 'cho_xac_nhan');

-- Kích hoạt trigger: kiểm tra hợp lệ + tự động trừ tồn kho
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

INSERT INTO phieu_nhap_thuoc (id_nhan_vien, id_nha_cung_cap, tong_tien, ghi_chu) VALUES
(1, 1, 5000000.00, 'Nhập lô hàng bổ sung tháng 9');

-- Kích hoạt trigger: tự động cộng tồn kho
INSERT INTO chi_tiet_phieu_nhap (id_phieu_nhap, id_thuoc, so_luong, gia_nhap, so_lo, han_su_dung) VALUES
(1, 1, 100, 25000.00, 'L19283', '2026-12-31'),
(1, 2, 100, 30000.00, 'L19284', '2027-06-30');

INSERT INTO lich_su_trang_thai_nhap (id_phieu_nhap, trang_thai, nguoi_cap_nhat, ghi_chu) VALUES
(1, 'da_nhap_kho', 1, 'Đã kiểm tra chất lượng và số lượng lô hàng');

-- =========================================================================
-- 14. KIỂM TRA NHANH
-- =========================================================================
-- SELECT * FROM thuoc;
-- SELECT * FROM mo_ta_thuoc;
-- SELECT * FROM gio_hang;
-- SELECT * FROM don_dat_thuoc;
-- SELECT * FROM thanh_toan;
-- SELECT * FROM hoa_don;
-- SELECT * FROM v_thuoc_ke_don;

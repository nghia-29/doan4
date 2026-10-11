-- =========================================================================
-- DỮ LIỆU MẪU BỔ SUNG CHO doan4
-- CÁCH DÙNG: chạy SAU khi đã chạy doan4_schema_hoan_chinh.sql (DB mới, chưa
-- thêm dữ liệu tay), vì file này dùng ID cụ thể nối tiếp dữ liệu mẫu gốc.
-- Ảnh: copy thư mục images/ (trong file zip) vào frontend/public/images/
-- Mật khẩu để dạng chữ thường cho demo (giống dữ liệu gốc), KHÔNG dùng thật.
-- =========================================================================
USE doan4;
SET NAMES utf8mb4;

-- 1. TÀI KHOẢN (6-11) -------------------------------------------------------
INSERT INTO tai_khoan (ten_dang_nhap, mat_khau, id_vai_tro, trang_thai) VALUES
('khachhang2', '123456', 1, 1),  -- 6
('khachhang3', '123456', 1, 1),  -- 7
('khachhang4', '123456', 1, 0),  -- 8 (tài khoản bị khóa, để test khóa/mở khóa)
('bacsi2',     '123456', 2, 1),  -- 9
('bacsi3',     '123456', 2, 1),  -- 10
('nhanvien2',  '123456', 3, 1);  -- 11

INSERT INTO khach_hang (id_tai_khoan, ho_ten, so_dien_thoai, email, dia_chi, ngay_sinh) VALUES
(6, 'Trần Thị Mai',   '0902345678', 'mai.tran@gmail.com',  '45 Nguyễn Huệ, Quận 1, TP.HCM',      '1990-03-22'),
(7, 'Lê Hoàng Nam',   '0903456789', 'nam.le@gmail.com',    '12 Trần Phú, Hải Châu, Đà Nẵng',     '1988-11-05'),
(8, 'Phạm Quốc Bảo',  '0904567890', 'bao.pham@gmail.com',  '78 Lý Thường Kiệt, Hoàn Kiếm, Hà Nội','2001-07-18');

INSERT INTO bac_si (id_tai_khoan, ho_ten, chuyen_khoa, so_dien_thoai, so_chung_chi_hanh_nghe) VALUES
(9,  'Nguyễn Văn Hùng', 'Tiêu hóa',          '0915678901', 'CCHN-01234'),
(10, 'Đỗ Thị Lan',      'Tim mạch - Nội tiết','0916789012', 'CCHN-05678');

INSERT INTO nhan_vien (id_tai_khoan, ho_ten, so_dien_thoai, email) VALUES
(11, 'Vũ Minh Kho', '0945678901', 'kho1@nhathuoc.com');   -- nhan_vien.id = 3

-- 2. NHÀ CUNG CẤP (3-5) VÀ DANH MỤC (4-8) ----------------------------------
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

-- 3. THUỐC (4-16). Có cả hàng sắp hết, sắp hết hạn, hết hàng để test dashboard
--    Lưu ý: so_luong_ton dưới đây là TỒN BAN ĐẦU; phần 9 (nhập kho) và phần 7
--    (đặt hàng) sẽ được trigger cộng/trừ tự động.
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
('SKU016', 'Loratadine 10mg',        6, 1, 'khong_ke_don', 'VD-17733-12', 'Hộp',  30000.00,   0, '2027-06-30');  -- 16 (sẽ được nhập kho ở phần 9)

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
 'Điều trị viêm loét dạ dày - tá tràng, trào ngược dạ dày', 'Theo chỉ định của bác sĩ', 'Uống trước bữa sáng 30 phút',
 NULL, 'Dưới 30°C', 'Chỉ dùng khi có đơn bác sĩ'),
(8,  'Imexpharm', 'Viên nén bao phim', 'Hộp 2 vỉ x 5 viên', '500mg', 'Cefuroxime axetil',
 'Điều trị nhiễm khuẩn đường hô hấp, tiết niệu, da', 'Theo chỉ định của bác sĩ', 'Uống ngay sau bữa ăn',
 NULL, 'Dưới 25°C, tránh ẩm', 'Chống chỉ định với người dị ứng cephalosporin'),
(9,  'Domesco', 'Viên nén', 'Hộp 3 vỉ x 10 viên', '5mg', 'Amlodipine besylate',
 'Điều trị tăng huyết áp, đau thắt ngực', 'Theo chỉ định của bác sĩ', 'Uống 1 lần/ngày, cùng giờ mỗi ngày',
 NULL, 'Nơi khô ráo, dưới 30°C', 'Có thể gây phù mắt cá chân, chóng mặt'),
(10, 'Domesco', 'Viên nén bao phim', 'Hộp 3 vỉ x 10 viên', '850mg', 'Metformin hydroclorid',
 'Điều trị đái tháo đường type 2', 'Theo chỉ định của bác sĩ', 'Uống trong hoặc ngay sau bữa ăn',
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

-- 4. ẢNH THUỐC (anh_thuoc) - mỗi thuốc 3 ảnh: 1 ảnh chính + 2 ảnh phụ -----
-- (thuốc 1-3 đã có ảnh chính _1 từ dữ liệu gốc, ở đây chỉ bổ sung _2, _3)
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

-- 5. GIỎ HÀNG ---------------------------------------------------------------
INSERT INTO gio_hang (id_khach_hang, id_thuoc, so_luong) VALUES
(2, 4, 2),
(3, 16, 1),
(4, 14, 3);

-- 6. KHUYẾN MÃI (2-4) -------------------------------------------------------
INSERT INTO khuyen_mai (ma_code, mo_ta, loai_giam, gia_tri_giam, don_toi_thieu, ngay_bat_dau, ngay_ket_thuc, so_luong_toi_da) VALUES
('GIAM20K',    'Giảm 20.000đ cho đơn từ 200.000đ',  'tien_mat', 20000, 200000, '2026-09-01', '2026-12-31', 500),
('FREESHIP15', 'Hỗ trợ phí ship 15.000đ',           'tien_mat', 15000, 100000, '2026-09-01', '2026-10-31', NULL),
('HETHAN2025', 'Mã đã hết hạn (dùng để test)',      'phan_tram', 5,     0,     '2025-01-01', '2025-12-31', 100);

-- 7. ĐƠN THUỐC (2-5) + CHI TIẾT ---------------------------------------------
-- hinh_anh_don_thuoc là ảnh chụp toa (thư mục images/don_thuoc)
INSERT INTO don_thuoc (id_khach_hang, id_bac_si, hinh_anh_don_thuoc, ngay_ke_don, trang_thai, id_nhan_vien_duyet, ngay_duyet, ghi_chu_duyet) VALUES
(2, 2,    '/images/don_thuoc/toa_2.jpg', '2026-09-22', 'da_duyet',  2,    NOW(), 'Toa hợp lệ'),                                   -- 2
(3, NULL, '/images/don_thuoc/toa_3.jpg', '2026-09-25', 'cho_duyet', NULL, NULL,  NULL),                                            -- 3 (KH tự upload, chờ duyệt)
(4, 3,    '/images/don_thuoc/toa_4.jpg', '2026-09-27', 'da_duyet',  2,    NOW(), 'Đã đối chiếu chứng chỉ hành nghề của bác sĩ'),  -- 4
(2, 2,    '/images/don_thuoc/toa_5.jpg', '2026-09-28', 'tu_choi',   2,    NOW(), 'Ảnh toa mờ, không đọc được liều dùng');         -- 5

INSERT INTO chi_tiet_don_thuoc (id_don_thuoc, id_thuoc, so_luong_ke, lieu_dung, so_ngay_dung) VALUES
(2, 7, 2, 'Uống 1 viên/ngày trước bữa sáng 30 phút', 14),
(2, 8, 1, 'Uống 1 viên x 2 lần/ngày sau ăn', 5),
(4, 9, 2, 'Uống 1 viên/ngày vào buổi sáng', 30),
(4, 10, 1, 'Uống 1 viên x 2 lần/ngày trong bữa ăn', 30),
(5, 8, 1, 'Không đọc được', NULL);

-- 8. ĐƠN ĐẶT THUỐC (2-6) ----------------------------------------------------
-- Thuốc kê đơn chỉ đặt được khi don_thuoc đã da_duyet (trigger kiểm tra).
INSERT INTO don_dat_thuoc (id_khach_hang, id_don_thuoc, id_khuyen_mai, ngay_dat, tong_tien, giam_gia, thanh_tien, dia_chi_giao_hang, so_dien_thoai_nhan, trang_thai) VALUES
(2, 2,    NULL, '2026-09-23 09:15:00', 290000.00,      0.00, 290000.00, '45 Nguyễn Huệ, Quận 1, TP.HCM',             '0902345678', 'dang_giao'),     -- 2
(3, NULL, 1,    '2026-09-24 14:30:00', 145000.00,  14500.00, 130500.00, '12 Trần Phú, Hải Châu, Đà Nẵng',            '0903456789', 'hoan_thanh'),    -- 3 (dùng CHAOMUNG10)
(4, 4,    NULL, '2026-09-28 08:00:00', 208000.00,      0.00, 208000.00, '78 Lý Thường Kiệt, Hoàn Kiếm, Hà Nội',      '0904567890', 'cho_xac_nhan'),  -- 4
(1, NULL, NULL, '2026-09-26 19:45:00', 145000.00,      0.00, 145000.00, '123 Lê Lợi, Quận 1, TP.HCM',                '0901234567', 'hoan_thanh'),    -- 5
(2, NULL, NULL, '2026-09-27 10:20:00', 850000.00,      0.00, 850000.00, '45 Nguyễn Huệ, Quận 1, TP.HCM',             '0902345678', 'da_huy');        -- 6

UPDATE khuyen_mai SET so_luong_da_dung = so_luong_da_dung + 1 WHERE id = 1;

-- Trigger sẽ kiểm tra thuốc kê đơn và tự trừ tồn kho
INSERT INTO chi_tiet_don_dat (id_don_dat, id_thuoc, so_luong, don_gia) VALUES
(2, 7, 2,  55000.00),
(2, 8, 1, 120000.00),
(2, 4, 1,  60000.00),
(3, 5, 2,  28000.00),
(3, 11, 1, 89000.00),
(4, 9, 2,  40000.00),
(4, 10, 1, 48000.00),
(5, 12, 3, 25000.00),
(5, 14, 2, 35000.00),
(6, 13, 1, 850000.00);

INSERT INTO lich_su_theo_doi_don (id_don_dat, trang_thai_cap_nhat, thoi_gian_cap_nhat, ghi_chu) VALUES
(2, 'cho_xac_nhan', '2026-09-23 09:15:00', 'Khách hàng đặt đơn có toa thuốc'),
(2, 'da_xac_nhan',  '2026-09-23 10:00:00', 'Dược sĩ đã xác nhận toa'),
(2, 'dang_chuan_bi','2026-09-23 13:00:00', 'Đang đóng gói'),
(2, 'dang_giao',    '2026-09-24 08:30:00', 'Bàn giao cho đơn vị vận chuyển'),
(3, 'cho_xac_nhan', '2026-09-24 14:30:00', 'Khách hàng đặt đơn mới'),
(3, 'dang_giao',    '2026-09-25 09:00:00', 'Đang giao hàng'),
(3, 'hoan_thanh',   '2026-09-26 16:00:00', 'Giao thành công'),
(4, 'cho_xac_nhan', '2026-09-28 08:00:00', 'Khách hàng đặt đơn có toa thuốc'),
(5, 'cho_xac_nhan', '2026-09-26 19:45:00', 'Khách hàng đặt đơn mới'),
(5, 'hoan_thanh',   '2026-09-27 15:00:00', 'Giao thành công'),
(6, 'cho_xac_nhan', '2026-09-27 10:20:00', 'Khách hàng đặt đơn mới'),
(6, 'da_huy',       '2026-09-27 11:00:00', 'Khách hàng yêu cầu hủy');

INSERT INTO thanh_toan (id_don_dat, phuong_thuc, ma_giao_dich, so_tien, trang_thai, thoi_gian_thanh_toan) VALUES
(2, 'chuyen_khoan', 'VCB20260923001',  290000.00, 'da_thanh_toan',  '2026-09-23 09:20:00'),
(3, 'COD',           NULL,             130500.00, 'da_thanh_toan',  '2026-09-26 16:00:00'),
(4, 'vi_dien_tu',   'MOMO20260928002', 208000.00, 'cho_thanh_toan', NULL),
(5, 'vi_dien_tu',   'MOMO20260926003', 145000.00, 'da_thanh_toan',  '2026-09-26 19:47:00'),
(6, 'chuyen_khoan', 'VCB20260927004',  850000.00, 'da_hoan_tien',   '2026-09-27 10:25:00');

INSERT INTO hoa_don (id_don_dat, so_hoa_don, ngay_xuat, tong_tien_truoc_thue, thue_vat, tong_tien_sau_thue) VALUES
(3, 'HD2026000002', '2026-09-26 16:05:00', 130500.00, 0, 130500.00),
(5, 'HD2026000003', '2026-09-27 15:05:00', 145000.00, 0, 145000.00);

-- 9. ĐÁNH GIÁ ---------------------------------------------------------------
INSERT INTO danh_gia (id_khach_hang, id_thuoc, so_sao, noi_dung) VALUES
(2, 7, 5, 'Đúng thuốc bác sĩ kê, đóng gói cẩn thận.'),
(2, 4, 4, 'Viên sủi dễ uống, vị cam dễ chịu.'),
(3, 5, 4, 'Giảm nghẹt mũi nhanh nhưng hơi buồn ngủ.'),
(3, 11, 5, 'Siro ho cho bé hiệu quả, bé dễ uống.'),
(1, 12, 5, 'Giá rẻ, tiện mang theo đi du lịch.'),
(1, 14, 3, 'Khẩu trang ổn nhưng hơi mỏng.'),
(3, 1, 5, 'Paracetamol chính hãng, giao nhanh.');

-- 10. NHẬP KHO (phiếu 2-3) --------------------------------------------------
-- Trigger tự cộng tồn kho. Tổng tiền = tổng (so_luong * gia_nhap).
INSERT INTO phieu_nhap_thuoc (id_nhan_vien, id_nha_cung_cap, ngay_nhap, tong_tien, ghi_chu) VALUES
(3, 3, '2026-09-15 09:00:00', 7250000.00, 'Nhập Vitamin C và siro ho Prospan'),   -- 2
(3, 1, '2026-09-20 10:30:00', 2750000.00, 'Nhập bổ sung Amlodipine và Loratadine'); -- 3

INSERT INTO chi_tiet_phieu_nhap (id_phieu_nhap, id_thuoc, so_luong, gia_nhap, so_lo, han_su_dung) VALUES
(2, 4,  100, 40000.00, 'L20001', '2027-08-31'),
(2, 11,  50, 65000.00, 'L20002', '2027-10-31'),
(3, 9,   50, 25000.00, 'L20003', '2027-09-30'),
(3, 16, 100, 15000.00, 'L20004', '2027-06-30');

INSERT INTO lich_su_trang_thai_nhap (id_phieu_nhap, trang_thai, thoi_gian_cap_nhat, nguoi_cap_nhat, ghi_chu) VALUES
(2, 'tao_moi',     '2026-09-15 09:00:00', 3, 'Tạo phiếu nhập'),
(2, 'cho_duyet',   '2026-09-15 09:30:00', 3, 'Chờ quản lý duyệt'),
(2, 'da_nhap_kho', '2026-09-15 14:00:00', 1, 'Đã kiểm tra số lượng và hạn dùng'),
(3, 'tao_moi',     '2026-09-20 10:30:00', 3, 'Tạo phiếu nhập'),
(3, 'da_nhap_kho', '2026-09-20 15:00:00', 1, 'Nhập kho đủ số lượng');

-- 11. KIỂM TRA NHANH --------------------------------------------------------
-- SELECT t.id, t.ten_thuoc, a.duong_dan_anh FROM thuoc t LEFT JOIN anh_thuoc a ON a.id_thuoc=t.id AND a.la_anh_chinh=1;
-- SELECT * FROM v_thuoc_sap_het_han;
-- SELECT id, ten_thuoc, so_luong_ton FROM thuoc WHERE so_luong_ton < 10;

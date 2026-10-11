require('dotenv').config({ path: require('node:path').resolve(__dirname, '../.env') });

const express = require('express');
const cors = require('cors');
const path = require('node:path');
const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), { maxAge: '1y', immutable: true }));
app.use('/images', express.static(path.join(__dirname, '..', 'nhathuoc-expo', 'files', 'images', 'images')));

app.use('/api/auth', require('./router/authRouter'));
app.use('/api', require('./middleware/authorization').authorizeApiRequest);
app.use('/api/account', require('./router/accountRouter'));
app.use('/api', require('./router/prescriptionCatalogRouter'));
app.use('/api/yeu_cau_ke_don', require('./router/yeu_cau_ke_donRouter'));

app.use('/api/anh_thuoc', require('./router/anh_thuocRouter'));
app.use('/api/bac_si', require('./router/bac_siRouter'));
app.use('/api/chi_tiet_don_dat', require('./router/chi_tiet_don_datRouter'));
app.use('/api/chi_tiet_don_thuoc', require('./router/chi_tiet_don_thuocRouter'));
app.use('/api/chi_tiet_phieu_nhap', require('./router/chi_tiet_phieu_nhapRouter'));
app.use('/api/chi_tiet_xuat_lo', require('./router/chi_tiet_xuat_loRouter'));
app.use('/api/danh_gia', require('./router/danh_giaRouter'));
app.use('/api/danh_muc_thuoc', require('./router/danh_muc_thuocRouter'));
app.use('/api/don_dat_thuoc', require('./router/don_dat_thuocRouter'));
app.use('/api/don_thuoc', require('./router/don_thuocRouter'));
app.use('/api/gio_hang', require('./router/gio_hangRouter'));
app.use('/api/hoa_don', require('./router/hoa_donRouter'));
app.use('/api/khach_hang', require('./router/khach_hangRouter'));
app.use('/api/khuyen_mai', require('./router/khuyen_maiRouter'));
app.use('/api/lich_su_theo_doi_don', require('./router/lich_su_theo_doi_donRouter'));
app.use('/api/lich_su_trang_thai_nhap', require('./router/lich_su_trang_thai_nhapRouter'));
app.use('/api/lo_thuoc', require('./router/lo_thuocRouter'));
app.use('/api/mo_ta_thuoc', require('./router/mo_ta_thuocRouter'));
app.use('/api/nha_cung_cap', require('./router/nha_cung_capRouter'));
app.use('/api/nhan_vien', require('./router/nhan_vienRouter'));
app.use('/api/phieu_nhap_thuoc', require('./router/phieu_nhap_thuocRouter'));
app.use('/api/tai_khoan', require('./router/tai_khoanRouter'));
app.use('/api/thanh_toan', require('./router/thanh_toanRouter'));
app.use('/api/thuoc', require('./router/thuocRouter'));
app.use('/api/v_thuoc_ke_don', require('./router/v_thuoc_ke_donRouter'));
app.use('/api/v_thuoc_sap_het_han', require('./router/v_thuoc_sap_het_hanRouter'));
app.use('/api/v_ton_kho_theo_lo', require('./router/v_ton_kho_theo_loRouter'));
app.use('/api/v_toa_con_lai', require('./router/v_toa_con_laiRouter'));
app.use('/api/vai_tro', require('./router/vai_troRouter'));

const port = Number(process.env.PORT || 3000);
app.listen(port, () => console.log(`Server running on port ${port}`));

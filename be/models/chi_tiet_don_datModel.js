const db = require('../common/db');
const chi_tiet_don_datModel = {
  getAll: (cb) => db.query('SELECT * FROM `chi_tiet_don_dat`', cb),
  getById: (id, cb) => db.query('SELECT * FROM `chi_tiet_don_dat` WHERE `id_don_dat` = ?', [id], cb),
  getByKeys: (idDonDat, idThuoc, cb) => db.query('SELECT * FROM `chi_tiet_don_dat` WHERE `id_don_dat` = ? AND `id_thuoc` = ?', [idDonDat, idThuoc], cb),
  create: (data, cb) => db.query(
    'INSERT INTO `chi_tiet_don_dat` (`id_don_dat`, `id_thuoc`, `so_luong`, `don_gia`) ' +
    'SELECT d.`id`, t.`id`, ?, t.`gia_ban` FROM `don_dat_thuoc` d ' +
    'JOIN `thuoc` t ON t.`id` = ? ' +
    'WHERE d.`id` = ? AND d.`trang_thai` = ? AND d.`da_xuat_kho` = 0',
    [data.so_luong, data.id_thuoc, data.id_don_dat, 'cho_xac_nhan'],
    cb
  ),
  update: (idDonDat, idThuoc, soLuong, cb) => db.query(
    'UPDATE `chi_tiet_don_dat` ct JOIN `don_dat_thuoc` d ON d.`id` = ct.`id_don_dat` ' +
    'SET ct.`so_luong` = ? WHERE ct.`id_don_dat` = ? AND ct.`id_thuoc` = ? ' +
    'AND d.`trang_thai` = ? AND d.`da_xuat_kho` = 0',
    [soLuong, idDonDat, idThuoc, 'cho_xac_nhan'],
    cb
  ),
  delete: (idDonDat, idThuoc, cb) => db.query(
    'DELETE ct FROM `chi_tiet_don_dat` ct JOIN `don_dat_thuoc` d ON d.`id` = ct.`id_don_dat` ' +
    'WHERE ct.`id_don_dat` = ? AND ct.`id_thuoc` = ? AND d.`trang_thai` = ? AND d.`da_xuat_kho` = 0',
    [idDonDat, idThuoc, 'cho_xac_nhan'],
    cb
  )
};
module.exports = chi_tiet_don_datModel;

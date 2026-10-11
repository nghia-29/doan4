const db = require('../common/db');
const chi_tiet_phieu_nhapModel = {
  getAll: (cb) => db.query('SELECT * FROM `chi_tiet_phieu_nhap`', cb),
  getById: (id, cb) => db.query('SELECT * FROM `chi_tiet_phieu_nhap` WHERE `id_phieu_nhap` = ?', [id], cb),
  getByKeys: (idPhieuNhap, idThuoc, cb) => db.query('SELECT * FROM `chi_tiet_phieu_nhap` WHERE `id_phieu_nhap` = ? AND `id_thuoc` = ?', [idPhieuNhap, idThuoc], cb),
  create: (data, cb) => db.query('INSERT INTO `chi_tiet_phieu_nhap` SET ?', [data], cb)
};
module.exports = chi_tiet_phieu_nhapModel;

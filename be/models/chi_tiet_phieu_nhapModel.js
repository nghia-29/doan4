const db = require('../common/db');
const chi_tiet_phieu_nhapModel = {
  getAll: (cb) => db.query('SELECT * FROM `chi_tiet_phieu_nhap`', cb),
  getById: (id, cb) => db.query('SELECT * FROM `chi_tiet_phieu_nhap` WHERE `id_phieu_nhap` = ?', [id], cb),
  create: (data, cb) => db.query('INSERT INTO `chi_tiet_phieu_nhap` SET ?', [data], cb),
  update: (id, data, cb) => db.query('UPDATE `chi_tiet_phieu_nhap` SET ? WHERE `id_phieu_nhap` = ?', [data, id], cb),
  delete: (id, cb) => db.query('DELETE FROM `chi_tiet_phieu_nhap` WHERE `id_phieu_nhap` = ?', [id], cb)
};
module.exports = chi_tiet_phieu_nhapModel;

const db = require('../common/db');
const lich_su_trang_thai_nhapModel = {
  getAll: (cb) => db.query('SELECT * FROM `lich_su_trang_thai_nhap`', cb),
  getById: (id, cb) => db.query('SELECT * FROM `lich_su_trang_thai_nhap` WHERE `id` = ?', [id], cb),
  create: (data, cb) => db.query('INSERT INTO `lich_su_trang_thai_nhap` SET ?', [data], cb),
  update: (id, data, cb) => db.query('UPDATE `lich_su_trang_thai_nhap` SET ? WHERE `id` = ?', [data, id], cb),
  delete: (id, cb) => db.query('DELETE FROM `lich_su_trang_thai_nhap` WHERE `id` = ?', [id], cb)
};
module.exports = lich_su_trang_thai_nhapModel;

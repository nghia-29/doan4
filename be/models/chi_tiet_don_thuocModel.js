const db = require('../common/db');
const chi_tiet_don_thuocModel = {
  getAll: (cb) => db.query('SELECT * FROM `chi_tiet_don_thuoc`', cb),
  getById: (id, cb) => db.query('SELECT * FROM `chi_tiet_don_thuoc` WHERE `id_don_thuoc` = ?', [id], cb),
  create: (data, cb) => db.query('INSERT INTO `chi_tiet_don_thuoc` SET ?', [data], cb),
  update: (id, data, cb) => db.query('UPDATE `chi_tiet_don_thuoc` SET ? WHERE `id_don_thuoc` = ?', [data, id], cb),
  delete: (id, cb) => db.query('DELETE FROM `chi_tiet_don_thuoc` WHERE `id_don_thuoc` = ?', [id], cb)
};
module.exports = chi_tiet_don_thuocModel;

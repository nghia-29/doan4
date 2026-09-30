const db = require('../common/db');
const chi_tiet_don_datModel = {
  getAll: (cb) => db.query('SELECT * FROM `chi_tiet_don_dat`', cb),
  getById: (id, cb) => db.query('SELECT * FROM `chi_tiet_don_dat` WHERE `id_don_dat` = ?', [id], cb),
  create: (data, cb) => db.query('INSERT INTO `chi_tiet_don_dat` SET ?', [data], cb),
  update: (id, data, cb) => db.query('UPDATE `chi_tiet_don_dat` SET ? WHERE `id_don_dat` = ?', [data, id], cb),
  delete: (id, cb) => db.query('DELETE FROM `chi_tiet_don_dat` WHERE `id_don_dat` = ?', [id], cb)
};
module.exports = chi_tiet_don_datModel;

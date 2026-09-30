const db = require('../common/db');
const danh_giaModel = {
  getAll: (cb) => db.query('SELECT * FROM `danh_gia`', cb),
  getById: (id, cb) => db.query('SELECT * FROM `danh_gia` WHERE `id` = ?', [id], cb),
  create: (data, cb) => db.query('INSERT INTO `danh_gia` SET ?', [data], cb),
  update: (id, data, cb) => db.query('UPDATE `danh_gia` SET ? WHERE `id` = ?', [data, id], cb),
  delete: (id, cb) => db.query('DELETE FROM `danh_gia` WHERE `id` = ?', [id], cb)
};
module.exports = danh_giaModel;

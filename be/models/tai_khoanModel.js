const db = require('../common/db');
const tai_khoanModel = {
  getAll: (cb) => db.query('SELECT * FROM `tai_khoan`', cb),
  getById: (id, cb) => db.query('SELECT * FROM `tai_khoan` WHERE `id` = ?', [id], cb),
  create: (data, cb) => db.query('INSERT INTO `tai_khoan` SET ?', [data], cb),
  update: (id, data, cb) => db.query('UPDATE `tai_khoan` SET ? WHERE `id` = ?', [data, id], cb),
  delete: (id, cb) => db.query('DELETE FROM `tai_khoan` WHERE `id` = ?', [id], cb)
};
module.exports = tai_khoanModel;

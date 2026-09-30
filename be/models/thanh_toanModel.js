const db = require('../common/db');
const thanh_toanModel = {
  getAll: (cb) => db.query('SELECT * FROM `thanh_toan`', cb),
  getById: (id, cb) => db.query('SELECT * FROM `thanh_toan` WHERE `id` = ?', [id], cb),
  create: (data, cb) => db.query('INSERT INTO `thanh_toan` SET ?', [data], cb),
  update: (id, data, cb) => db.query('UPDATE `thanh_toan` SET ? WHERE `id` = ?', [data, id], cb),
  delete: (id, cb) => db.query('DELETE FROM `thanh_toan` WHERE `id` = ?', [id], cb)
};
module.exports = thanh_toanModel;

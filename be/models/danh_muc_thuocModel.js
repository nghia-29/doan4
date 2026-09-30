const db = require('../common/db');
const danh_muc_thuocModel = {
  getAll: (cb) => db.query('SELECT * FROM `danh_muc_thuoc`', cb),
  getById: (id, cb) => db.query('SELECT * FROM `danh_muc_thuoc` WHERE `id` = ?', [id], cb),
  create: (data, cb) => db.query('INSERT INTO `danh_muc_thuoc` SET ?', [data], cb),
  update: (id, data, cb) => db.query('UPDATE `danh_muc_thuoc` SET ? WHERE `id` = ?', [data, id], cb),
  delete: (id, cb) => db.query('DELETE FROM `danh_muc_thuoc` WHERE `id` = ?', [id], cb)
};
module.exports = danh_muc_thuocModel;

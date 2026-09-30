const db = require('../common/db');
const anh_thuocModel = {
  getAll: (cb) => db.query('SELECT * FROM `anh_thuoc`', cb),
  getById: (id, cb) => db.query('SELECT * FROM `anh_thuoc` WHERE `id` = ?', [id], cb),
  create: (data, cb) => db.query('INSERT INTO `anh_thuoc` SET ?', [data], cb),
  update: (id, data, cb) => db.query('UPDATE `anh_thuoc` SET ? WHERE `id` = ?', [data, id], cb),
  delete: (id, cb) => db.query('DELETE FROM `anh_thuoc` WHERE `id` = ?', [id], cb)
};
module.exports = anh_thuocModel;

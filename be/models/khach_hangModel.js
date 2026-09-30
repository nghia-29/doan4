const db = require('../common/db');
const khach_hangModel = {
  getAll: (cb) => db.query('SELECT * FROM `khach_hang`', cb),
  getById: (id, cb) => db.query('SELECT * FROM `khach_hang` WHERE `id` = ?', [id], cb),
  create: (data, cb) => db.query('INSERT INTO `khach_hang` SET ?', [data], cb),
  update: (id, data, cb) => db.query('UPDATE `khach_hang` SET ? WHERE `id` = ?', [data, id], cb),
  delete: (id, cb) => db.query('DELETE FROM `khach_hang` WHERE `id` = ?', [id], cb)
};
module.exports = khach_hangModel;

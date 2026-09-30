const db = require('../common/db');
const nhan_vienModel = {
  getAll: (cb) => db.query('SELECT * FROM `nhan_vien`', cb),
  getById: (id, cb) => db.query('SELECT * FROM `nhan_vien` WHERE `id` = ?', [id], cb),
  create: (data, cb) => db.query('INSERT INTO `nhan_vien` SET ?', [data], cb),
  update: (id, data, cb) => db.query('UPDATE `nhan_vien` SET ? WHERE `id` = ?', [data, id], cb),
  delete: (id, cb) => db.query('DELETE FROM `nhan_vien` WHERE `id` = ?', [id], cb)
};
module.exports = nhan_vienModel;

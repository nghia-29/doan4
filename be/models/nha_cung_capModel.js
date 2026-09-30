const db = require('../common/db');
const nha_cung_capModel = {
  getAll: (cb) => db.query('SELECT * FROM `nha_cung_cap`', cb),
  getById: (id, cb) => db.query('SELECT * FROM `nha_cung_cap` WHERE `id` = ?', [id], cb),
  create: (data, cb) => db.query('INSERT INTO `nha_cung_cap` SET ?', [data], cb),
  update: (id, data, cb) => db.query('UPDATE `nha_cung_cap` SET ? WHERE `id` = ?', [data, id], cb),
  delete: (id, cb) => db.query('DELETE FROM `nha_cung_cap` WHERE `id` = ?', [id], cb)
};
module.exports = nha_cung_capModel;

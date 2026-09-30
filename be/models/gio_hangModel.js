const db = require('../common/db');
const gio_hangModel = {
  getAll: (cb) => db.query('SELECT * FROM `gio_hang`', cb),
  getById: (id, cb) => db.query('SELECT * FROM `gio_hang` WHERE `id` = ?', [id], cb),
  create: (data, cb) => db.query('INSERT INTO `gio_hang` SET ?', [data], cb),
  update: (id, data, cb) => db.query('UPDATE `gio_hang` SET ? WHERE `id` = ?', [data, id], cb),
  delete: (id, cb) => db.query('DELETE FROM `gio_hang` WHERE `id` = ?', [id], cb)
};
module.exports = gio_hangModel;

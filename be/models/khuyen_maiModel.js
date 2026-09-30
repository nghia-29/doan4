const db = require('../common/db');
const khuyen_maiModel = {
  getAll: (cb) => db.query('SELECT * FROM `khuyen_mai`', cb),
  getById: (id, cb) => db.query('SELECT * FROM `khuyen_mai` WHERE `id` = ?', [id], cb),
  create: (data, cb) => db.query('INSERT INTO `khuyen_mai` SET ?', [data], cb),
  update: (id, data, cb) => db.query('UPDATE `khuyen_mai` SET ? WHERE `id` = ?', [data, id], cb),
  delete: (id, cb) => db.query('DELETE FROM `khuyen_mai` WHERE `id` = ?', [id], cb)
};
module.exports = khuyen_maiModel;

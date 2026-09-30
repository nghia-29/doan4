const db = require('../common/db');
const vai_troModel = {
  getAll: (cb) => db.query('SELECT * FROM `vai_tro`', cb),
  getById: (id, cb) => db.query('SELECT * FROM `vai_tro` WHERE `id` = ?', [id], cb),
  create: (data, cb) => db.query('INSERT INTO `vai_tro` SET ?', [data], cb),
  update: (id, data, cb) => db.query('UPDATE `vai_tro` SET ? WHERE `id` = ?', [data, id], cb),
  delete: (id, cb) => db.query('DELETE FROM `vai_tro` WHERE `id` = ?', [id], cb)
};
module.exports = vai_troModel;

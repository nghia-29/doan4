const db = require('../common/db');
const thuocModel = {
  getAll: (cb) => db.query('SELECT * FROM `thuoc`', cb),
  getById: (id, cb) => db.query('SELECT * FROM `thuoc` WHERE `id` = ?', [id], cb),
  create: (data, cb) => db.query('INSERT INTO `thuoc` SET ?', [data], cb),
  update: (id, data, cb) => db.query('UPDATE `thuoc` SET ? WHERE `id` = ?', [data, id], cb),
  delete: (id, cb) => db.query('DELETE FROM `thuoc` WHERE `id` = ?', [id], cb)
};
module.exports = thuocModel;

const db = require('../common/db');
const hoa_donModel = {
  getAll: (cb) => db.query('SELECT * FROM `hoa_don`', cb),
  getById: (id, cb) => db.query('SELECT * FROM `hoa_don` WHERE `id` = ?', [id], cb),
  create: (data, cb) => db.query('INSERT INTO `hoa_don` SET ?', [data], cb),
  update: (id, data, cb) => db.query('UPDATE `hoa_don` SET ? WHERE `id` = ?', [data, id], cb),
  delete: (id, cb) => db.query('DELETE FROM `hoa_don` WHERE `id` = ?', [id], cb)
};
module.exports = hoa_donModel;

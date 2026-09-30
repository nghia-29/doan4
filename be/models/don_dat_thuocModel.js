const db = require('../common/db');
const don_dat_thuocModel = {
  getAll: (cb) => db.query('SELECT * FROM `don_dat_thuoc`', cb),
  getById: (id, cb) => db.query('SELECT * FROM `don_dat_thuoc` WHERE `id` = ?', [id], cb),
  create: (data, cb) => db.query('INSERT INTO `don_dat_thuoc` SET ?', [data], cb),
  update: (id, data, cb) => db.query('UPDATE `don_dat_thuoc` SET ? WHERE `id` = ?', [data, id], cb),
  delete: (id, cb) => db.query('DELETE FROM `don_dat_thuoc` WHERE `id` = ?', [id], cb)
};
module.exports = don_dat_thuocModel;

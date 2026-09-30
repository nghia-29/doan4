const db = require('../common/db');
const mo_ta_thuocModel = {
  getAll: (cb) => db.query('SELECT * FROM `mo_ta_thuoc`', cb),
  getById: (id, cb) => db.query('SELECT * FROM `mo_ta_thuoc` WHERE `id_thuoc` = ?', [id], cb),
  create: (data, cb) => db.query('INSERT INTO `mo_ta_thuoc` SET ?', [data], cb),
  update: (id, data, cb) => db.query('UPDATE `mo_ta_thuoc` SET ? WHERE `id_thuoc` = ?', [data, id], cb),
  delete: (id, cb) => db.query('DELETE FROM `mo_ta_thuoc` WHERE `id_thuoc` = ?', [id], cb)
};
module.exports = mo_ta_thuocModel;

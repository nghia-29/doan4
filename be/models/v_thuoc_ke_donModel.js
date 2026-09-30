const db = require('../common/db');
const v_thuoc_ke_donModel = {
  getAll: (cb) => db.query('SELECT * FROM `v_thuoc_ke_don`', cb),
  getById: (id, cb) => db.query('SELECT * FROM `v_thuoc_ke_don` WHERE `id` = ?', [id], cb),
  create: (data, cb) => db.query('INSERT INTO `v_thuoc_ke_don` SET ?', [data], cb),
  update: (id, data, cb) => db.query('UPDATE `v_thuoc_ke_don` SET ? WHERE `id` = ?', [data, id], cb),
  delete: (id, cb) => db.query('DELETE FROM `v_thuoc_ke_don` WHERE `id` = ?', [id], cb)
};
module.exports = v_thuoc_ke_donModel;

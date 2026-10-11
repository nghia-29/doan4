const db = require('../common/db');
const v_thuoc_ke_donModel = {
  getAll: (cb) => db.query('SELECT * FROM `v_thuoc_ke_don`', cb),
  getById: (id, cb) => db.query('SELECT * FROM `v_thuoc_ke_don` WHERE `id` = ?', [id], cb)
};
module.exports = v_thuoc_ke_donModel;

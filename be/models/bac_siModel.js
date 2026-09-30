const db = require('../common/db');
const bac_siModel = {
  getAll: (cb) => db.query('SELECT * FROM `bac_si`', cb),
  getById: (id, cb) => db.query('SELECT * FROM `bac_si` WHERE `id` = ?', [id], cb),
  create: (data, cb) => db.query('INSERT INTO `bac_si` SET ?', [data], cb),
  update: (id, data, cb) => db.query('UPDATE `bac_si` SET ? WHERE `id` = ?', [data, id], cb),
  delete: (id, cb) => db.query('DELETE FROM `bac_si` WHERE `id` = ?', [id], cb)
};
module.exports = bac_siModel;

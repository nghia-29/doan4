const db = require('../common/db');
const v_thuoc_sap_het_hanModel = {
  getAll: (cb) => db.query('SELECT * FROM `v_thuoc_sap_het_han`', cb),
  getById: (id, cb) => db.query('SELECT * FROM `v_thuoc_sap_het_han` WHERE `id` = ?', [id], cb),
  create: (data, cb) => db.query('INSERT INTO `v_thuoc_sap_het_han` SET ?', [data], cb),
  update: (id, data, cb) => db.query('UPDATE `v_thuoc_sap_het_han` SET ? WHERE `id` = ?', [data, id], cb),
  delete: (id, cb) => db.query('DELETE FROM `v_thuoc_sap_het_han` WHERE `id` = ?', [id], cb)
};
module.exports = v_thuoc_sap_het_hanModel;

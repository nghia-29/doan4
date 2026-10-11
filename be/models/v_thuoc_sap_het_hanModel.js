const db = require('../common/db');
const v_thuoc_sap_het_hanModel = {
  getAll: (cb) => db.query('SELECT * FROM `v_thuoc_sap_het_han`', cb),
  getById: (id, cb) => db.query('SELECT * FROM `v_thuoc_sap_het_han` WHERE `id` = ?', [id], cb)
};
module.exports = v_thuoc_sap_het_hanModel;

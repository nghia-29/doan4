const db = require('../common/db');
const v_ton_kho_theo_loModel = {
  getAll: (cb) => db.query('SELECT * FROM `v_ton_kho_theo_lo`', cb),
  getByThuocId: (idThuoc, cb) => db.query('SELECT * FROM `v_ton_kho_theo_lo` WHERE `id_thuoc` = ?', [idThuoc], cb)
};
module.exports = v_ton_kho_theo_loModel;

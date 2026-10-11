const db = require('../common/db');
const v_toa_con_laiModel = {
  getAll: (cb) => db.query('SELECT * FROM `v_toa_con_lai`', cb),
  getByDonThuocId: (idDonThuoc, cb) => db.query('SELECT * FROM `v_toa_con_lai` WHERE `id_don_thuoc` = ?', [idDonThuoc], cb)
};
module.exports = v_toa_con_laiModel;

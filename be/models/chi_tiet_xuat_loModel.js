const db = require('../common/db');
const chi_tiet_xuat_loModel = {
  getAll: (cb) => db.query('SELECT * FROM `chi_tiet_xuat_lo` ORDER BY `id`', cb),
  getByDonDatId: (idDonDat, cb) => db.query('SELECT * FROM `chi_tiet_xuat_lo` WHERE `id_don_dat` = ? ORDER BY `id`', [idDonDat], cb)
};
module.exports = chi_tiet_xuat_loModel;

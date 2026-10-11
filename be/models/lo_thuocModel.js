const db = require('../common/db');
const lo_thuocModel = {
  getAll: (cb) => db.query('SELECT * FROM `lo_thuoc` ORDER BY `id`', cb),
  getById: (id, cb) => db.query('SELECT * FROM `lo_thuoc` WHERE `id` = ?', [id], cb),
  getByThuocId: (idThuoc, cb) => db.query('SELECT * FROM `lo_thuoc` WHERE `id_thuoc` = ? ORDER BY (`han_su_dung` IS NULL), `han_su_dung`, `id`', [idThuoc], cb)
};
module.exports = lo_thuocModel;

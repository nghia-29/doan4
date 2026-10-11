const db = require('../common/db');
const chi_tiet_don_thuocModel = {
  getAll: (cb) => db.query('SELECT * FROM `chi_tiet_don_thuoc`', cb),
  getById: (id, cb) => db.query('SELECT * FROM `chi_tiet_don_thuoc` WHERE `id_don_thuoc` = ?', [id], cb),
  getByKeys: (idDonThuoc, idThuoc, cb) => db.query('SELECT * FROM `chi_tiet_don_thuoc` WHERE `id_don_thuoc` = ? AND `id_thuoc` = ?', [idDonThuoc, idThuoc], cb),
  create: (data, cb) => db.query(
    'INSERT INTO `chi_tiet_don_thuoc` (`id_don_thuoc`, `id_thuoc`, `so_luong_ke`, `lieu_dung`, `so_ngay_dung`) ' +
    'SELECT d.`id`, ?, ?, ?, ? FROM `don_thuoc` d WHERE d.`id` = ? AND d.`trang_thai` = ?',
    [data.id_thuoc, data.so_luong_ke, data.lieu_dung || null, data.so_ngay_dung || null, data.id_don_thuoc, 'cho_duyet'],
    cb
  ),
  update: (idDonThuoc, idThuoc, data, cb) => {
    const columns = {
      so_luong_ke: 'ct.`so_luong_ke`',
      lieu_dung: 'ct.`lieu_dung`',
      so_ngay_dung: 'ct.`so_ngay_dung`'
    };
    const updates = Object.keys(data).filter((field) => columns[field]);
    const setClause = updates.map((field) => `${columns[field]} = ?`).join(', ');
    const values = updates.map((field) => data[field]);
    return db.query(
      'UPDATE `chi_tiet_don_thuoc` ct JOIN `don_thuoc` d ON d.`id` = ct.`id_don_thuoc` ' +
      `SET ${setClause} WHERE ct.\`id_don_thuoc\` = ? AND ct.\`id_thuoc\` = ? AND d.\`trang_thai\` = ?`,
      [...values, idDonThuoc, idThuoc, 'cho_duyet'],
      cb
    );
  },
  delete: (idDonThuoc, idThuoc, cb) => db.query(
    'DELETE ct FROM `chi_tiet_don_thuoc` ct JOIN `don_thuoc` d ON d.`id` = ct.`id_don_thuoc` ' +
    'WHERE ct.`id_don_thuoc` = ? AND ct.`id_thuoc` = ? AND d.`trang_thai` = ?',
    [idDonThuoc, idThuoc, 'cho_duyet'],
    cb
  )
};
module.exports = chi_tiet_don_thuocModel;

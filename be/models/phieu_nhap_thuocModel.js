const db = require('../common/db');
const phieu_nhap_thuocModel = {
  getAll: (cb) => db.query('SELECT * FROM `phieu_nhap_thuoc`', cb),
  getById: (id, cb) => db.query('SELECT * FROM `phieu_nhap_thuoc` WHERE `id` = ?', [id], cb),
  create: (data, cb) => db.query('INSERT INTO `phieu_nhap_thuoc` SET ?', [data], cb),
  update: (id, data, cb) => db.query('UPDATE `phieu_nhap_thuoc` SET ? WHERE `id` = ?', [data, id], cb),
  delete: (id, cb) => db.query('DELETE FROM `phieu_nhap_thuoc` WHERE `id` = ?', [id], cb)
};
module.exports = phieu_nhap_thuocModel;

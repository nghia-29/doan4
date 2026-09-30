const db = require('../common/db');
const lich_su_theo_doi_donModel = {
  getAll: (cb) => db.query('SELECT * FROM `lich_su_theo_doi_don`', cb),
  getById: (id, cb) => db.query('SELECT * FROM `lich_su_theo_doi_don` WHERE `id` = ?', [id], cb),
  create: (data, cb) => db.query('INSERT INTO `lich_su_theo_doi_don` SET ?', [data], cb),
  update: (id, data, cb) => db.query('UPDATE `lich_su_theo_doi_don` SET ? WHERE `id` = ?', [data, id], cb),
  delete: (id, cb) => db.query('DELETE FROM `lich_su_theo_doi_don` WHERE `id` = ?', [id], cb)
};
module.exports = lich_su_theo_doi_donModel;

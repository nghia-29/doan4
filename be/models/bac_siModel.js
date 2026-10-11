const db = require('../common/db');
const selectDoctorEmployees = `
  SELECT employee.id, employee.id_tai_khoan, employee.ho_ten, employee.chuyen_khoa,
         employee.so_dien_thoai, employee.so_chung_chi_hanh_nghe, employee.email
  FROM nhan_vien AS employee
  INNER JOIN tai_khoan AS account ON account.id = employee.id_tai_khoan
  INNER JOIN vai_tro AS r ON r.id = account.id_vai_tro
  WHERE r.ten_vai_tro = 'duoc_si'
`;

const bac_siModel = {
  getAll: (cb) => db.query(selectDoctorEmployees, cb),
  getById: (id, cb) => db.query(`${selectDoctorEmployees} AND employee.id = ?`, [id], cb),
  create: (data, cb) => db.query(
    `INSERT INTO nhan_vien
      (id_tai_khoan, ho_ten, chuyen_khoa, so_dien_thoai, so_chung_chi_hanh_nghe, email)
     SELECT account.id, ?, ?, ?, ?, ?
     FROM tai_khoan AS account
     INNER JOIN vai_tro AS r ON r.id = account.id_vai_tro
     WHERE account.id = ? AND r.ten_vai_tro = 'duoc_si'`,
    [
      data.ho_ten,
      data.chuyen_khoa || null,
      data.so_dien_thoai || null,
      data.so_chung_chi_hanh_nghe || null,
      data.email || null,
      data.id_tai_khoan,
    ],
    cb
  ),
  update: (id, data, cb) => {
    const editableFields = [
      'ho_ten',
      'chuyen_khoa',
      'so_dien_thoai',
      'so_chung_chi_hanh_nghe',
      'email',
    ];
    const fields = editableFields.filter((field) => data[field] !== undefined);
    if (fields.length === 0) {
      return cb(null, { affectedRows: 0 });
    }
    const values = fields.map((field) => data[field]);
    const assignments = fields.map((field) => `employee.\`${field}\` = ?`).join(', ');
    return db.query(
      `UPDATE nhan_vien AS employee
       INNER JOIN tai_khoan AS account ON account.id = employee.id_tai_khoan
       INNER JOIN vai_tro AS r ON r.id = account.id_vai_tro
       SET ${assignments}
       WHERE employee.id = ? AND r.ten_vai_tro = 'duoc_si'`,
      [...values, id],
      cb
    );
  },
  delete: (id, cb) => db.query(
    `DELETE employee FROM nhan_vien AS employee
     INNER JOIN tai_khoan AS account ON account.id = employee.id_tai_khoan
     INNER JOIN vai_tro AS r ON r.id = account.id_vai_tro
     WHERE employee.id = ? AND r.ten_vai_tro = 'duoc_si'`,
    [id],
    cb
  ),
};
module.exports = bac_siModel;

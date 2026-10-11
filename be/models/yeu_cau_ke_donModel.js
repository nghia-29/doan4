const db = require('../common/db');

const requestDetailsQuery = `
  SELECT request.*,
         customer.ho_ten AS khach_hang,
         customer.so_dien_thoai,
         employee.ho_ten AS duoc_si_tiep_nhan,
         prescription.id AS id_don_thuoc,
         prescription.trang_thai AS trang_thai_toa,
         (SELECT COUNT(*)
          FROM chi_tiet_don_thuoc AS item
          WHERE item.id_don_thuoc = prescription.id) AS so_loai_thuoc
  FROM yeu_cau_ke_don AS request
  INNER JOIN khach_hang AS customer ON customer.id = request.id_khach_hang
  LEFT JOIN nhan_vien AS employee ON employee.id = request.id_nhan_vien_tiep_nhan
  LEFT JOIN don_thuoc AS prescription ON prescription.id_yeu_cau = request.id
`;

function getEmployeeId(connection, accountId) {
  return connection.query(
    `SELECT employee.id
     FROM nhan_vien AS employee
     INNER JOIN tai_khoan AS account ON account.id = employee.id_tai_khoan
     INNER JOIN vai_tro AS account_role ON account_role.id = account.id_vai_tro
     WHERE account.id = ? AND account_role.ten_vai_tro = 'duoc_si'
       AND account.trang_thai = 1
       AND employee.so_chung_chi_hanh_nghe IS NOT NULL`,
    [accountId]
  ).then(([rows]) => rows[0]?.id || null);
}

async function withPharmacistTransaction(accountId, operation) {
  const connection = await db.pool.promise().getConnection();
  let transactionStarted = false;
  try {
    await connection.beginTransaction();
    transactionStarted = true;
    const employeeId = await getEmployeeId(connection, accountId);
    if (!employeeId) {
      const error = new Error('Tài khoản không có hồ sơ dược sĩ hợp lệ.');
      error.code = 'PHARMACIST_NOT_FOUND';
      throw error;
    }
    const result = await operation(connection, employeeId);
    await connection.commit();
    transactionStarted = false;
    return result;
  } catch (error) {
    if (transactionStarted) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error('Prescription request rollback failed:', rollbackError.message);
      }
    }
    throw error;
  } finally {
    connection.release();
  }
}

const requestModel = {
  getAll: (accountId, isCustomer) => {
    const ownershipFilter = isCustomer
      ? 'WHERE customer.id_tai_khoan = ?'
      : '';
    const orderBy = ' ORDER BY request.ngay_tao DESC, request.id DESC';
    return db.pool.promise().query(
      `${requestDetailsQuery}${ownershipFilter}${orderBy}`,
      isCustomer ? [accountId] : []
    ).then(([rows]) => rows);
  },

  getQueue: () => db.pool.promise().query(
    'SELECT * FROM v_yeu_cau_cho_tiep_nhan ORDER BY ngay_tao, id_yeu_cau'
  ).then(([rows]) => rows),

  getById: (id, accountId, isCustomer) => {
    const ownershipFilter = isCustomer
      ? ' AND customer.id_tai_khoan = ?'
      : '';
    const params = isCustomer ? [id, accountId] : [id];
    return db.pool.promise().query(
      `${requestDetailsQuery} WHERE request.id = ?${ownershipFilter}`,
      params
    ).then(([rows]) => rows[0] || null);
  },

  create: (accountId, request) => db.pool.promise().query(
    `INSERT INTO yeu_cau_ke_don
       (id_khach_hang, ten_benh_khai, trieu_chung, thoi_gian_bi_benh,
        di_ung_thuoc, benh_nen_thuoc_dang_dung)
     SELECT customer.id, ?, ?, ?, ?, ?
     FROM khach_hang AS customer
     WHERE customer.id_tai_khoan = ?`,
    [
      request.ten_benh_khai,
      request.trieu_chung,
      request.thoi_gian_bi_benh,
      request.di_ung_thuoc,
      request.benh_nen_thuoc_dang_dung,
      accountId,
    ]
  ),

  cancel: (id, accountId) => db.pool.promise().query(
    `UPDATE yeu_cau_ke_don AS request
     INNER JOIN khach_hang AS customer ON customer.id = request.id_khach_hang
     SET request.trang_thai = 'da_huy'
     WHERE request.id = ? AND customer.id_tai_khoan = ?
       AND request.trang_thai = 'cho_tiep_nhan'`,
    [id, accountId]
  ),

  accept: (accountId, requestId) => withPharmacistTransaction(
    accountId,
    async (connection, employeeId) => {
      await connection.query('CALL sp_tiep_nhan_yeu_cau(?, ?)', [requestId, employeeId]);
    }
  ),

  reject: (accountId, requestId, reason) => withPharmacistTransaction(
    accountId,
    async (connection, employeeId) => {
      await connection.query(
        'CALL sp_tu_choi_yeu_cau(?, ?, ?)',
        [requestId, employeeId, reason]
      );
    }
  ),

  prescribe: (accountId, requestId, prescription) => withPharmacistTransaction(
    accountId,
    async (connection, employeeId) => {
      await connection.query(
        `CALL sp_ke_don_tu_yeu_cau(?, ?, ?, ?, ?, ?, ?, @id_don_thuoc)`,
        [
          requestId,
          employeeId,
          prescription.id_benh,
          prescription.id_phac_do,
          prescription.chan_doan,
          prescription.ngay_ke_don,
          prescription.so_ngay_hieu_luc,
        ]
      );
      const [rows] = await connection.query('SELECT @id_don_thuoc AS id_don_thuoc');
      if (!rows[0]?.id_don_thuoc) {
        throw new Error('Stored procedure did not return the created prescription id.');
      }
      return rows[0].id_don_thuoc;
    }
  ),
};

module.exports = requestModel;

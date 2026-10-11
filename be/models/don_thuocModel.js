const db = require('../common/db');
const don_thuocModel = {
  getAll: (cb) => db.query('SELECT * FROM `don_thuoc`', cb),
  getById: (id, cb) => db.query('SELECT * FROM `don_thuoc` WHERE `id` = ?', [id], cb),
  create: (data, cb) => db.query('INSERT INTO `don_thuoc` SET ?', [data], cb),
  update: (id, data, cb) => db.query('UPDATE `don_thuoc` SET ? WHERE `id` = ?', [data, id], cb),
  delete: (id, cb) => db.query('DELETE FROM `don_thuoc` WHERE `id` = ?', [id], cb),
  applyRegimen: (id, regimenId, diagnosis, cb) => {
    db.pool.getConnection((connectionError, connection) => {
      if (connectionError) return cb(connectionError);
      connection.beginTransaction((beginError) => {
        if (beginError) {
          connection.release();
          return cb(beginError);
        }

        connection.query(
          'SELECT `trang_thai` FROM `don_thuoc` WHERE `id` = ? FOR UPDATE',
          [id],
          (prescriptionError, prescriptions) => {
            if (prescriptionError || !prescriptions.length) {
              return connection.rollback(() => {
                connection.release();
                cb(prescriptionError || Object.assign(new Error('Prescription not found'), { code: 'PRESCRIPTION_NOT_FOUND' }));
              });
            }
            if (prescriptions[0].trang_thai !== 'cho_duyet') {
              return connection.rollback(() => {
                connection.release();
                cb(Object.assign(new Error('Prescription is not pending'), { code: 'PRESCRIPTION_NOT_PENDING' }));
              });
            }

            connection.query(
              'SELECT `id_benh` FROM `phac_do` WHERE `id` = ? AND `trang_thai` = 1',
              [regimenId],
              (regimenError, regimens) => {
                if (regimenError || !regimens.length) {
                  return connection.rollback(() => {
                    connection.release();
                    cb(regimenError || Object.assign(new Error('Regimen is inactive or missing'), {
                      code: 'ER_SIGNAL_EXCEPTION',
                      sqlMessage: 'Phác đồ không tồn tại hoặc đã ngừng dùng',
                    }));
                  });
                }

                connection.query(
                  'UPDATE `don_thuoc` SET `id_benh` = ?, `id_phac_do` = ?, `chan_doan` = ? WHERE `id` = ?',
                  [regimens[0].id_benh, regimenId, diagnosis, id],
                  (updateError) => {
                    if (updateError) {
                      return connection.rollback(() => {
                        connection.release();
                        cb(updateError);
                      });
                    }
                    connection.query(
                      'CALL sp_ap_dung_phac_do(?, ?)',
                      [id, regimenId],
                      (procedureError) => {
                        if (procedureError) {
                          return connection.rollback(() => {
                            connection.release();
                            cb(procedureError);
                          });
                        }
                        connection.commit((commitError) => {
                          if (commitError) {
                            return connection.rollback(() => {
                              connection.release();
                              cb(commitError);
                            });
                          }
                          connection.release();
                          cb(null);
                        });
                      }
                    );
                  }
                );
              }
            );
          }
        );
      });
    });
  },
  validatePharmacistReferences: (data, cb) => {
    const ids = [...new Set([
      data.id_nhan_vien_ke_don,
      data.id_nhan_vien_duyet,
    ].filter((id) => id !== undefined && id !== null).map(Number))];
    if (ids.some((id) => !Number.isInteger(id) || id < 1)) return cb(null, false);
    if (!ids.length) return cb(null, true);
    return db.query(
      `SELECT employee.id
       FROM nhan_vien AS employee
       INNER JOIN tai_khoan AS account ON account.id = employee.id_tai_khoan
       INNER JOIN vai_tro AS r ON r.id = account.id_vai_tro
       WHERE r.ten_vai_tro = 'duoc_si' AND employee.id IN (?)`,
      [ids],
      (error, rows) => error
        ? cb(error)
        : cb(null, rows.length === ids.length)
    );
  },
};
module.exports = don_thuocModel;

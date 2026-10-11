const db = require('../common/db');

function sendQueryResult(res, error, rows, message) {
  if (error) {
    console.error(`${message}:`, error.message);
    return res.status(500).json({ message });
  }
  return res.json(rows);
}

exports.getDiseases = (req, res) => {
  db.query(
    'SELECT `id`, `ma_icd`, `ten_benh`, `mo_ta` FROM `benh` ORDER BY `ten_benh`',
    (error, rows) => sendQueryResult(res, error, rows, 'Không thể tải danh mục bệnh.')
  );
};

exports.getRegimens = (req, res) => {
  db.query(
    `SELECT regimen.id, regimen.id_benh, regimen.ten_phac_do,
            regimen.mo_ta, disease.ten_benh
     FROM phac_do AS regimen
     INNER JOIN benh AS disease ON disease.id = regimen.id_benh
     WHERE regimen.trang_thai = 1
     ORDER BY disease.ten_benh, regimen.ten_phac_do`,
    (error, rows) => sendQueryResult(res, error, rows, 'Không thể tải danh sách phác đồ.')
  );
};

exports.getRegimenItems = (req, res) => {
  db.query(
    `SELECT item.id_phac_do, item.id_thuoc, medicine.ten_thuoc,
            medicine.don_vi_tinh, item.so_luong_goi_y,
            item.lieu_dung, item.so_ngay_dung
     FROM chi_tiet_phac_do AS item
     INNER JOIN thuoc AS medicine ON medicine.id = item.id_thuoc
     ORDER BY item.id_phac_do, medicine.ten_thuoc`,
    (error, rows) => sendQueryResult(res, error, rows, 'Không thể tải thuốc trong phác đồ.')
  );
};

const Model = require('../models/don_thuocModel');

const ALLOWED_FIELDS = new Set([
  'id_khach_hang',
  'id_nhan_vien_ke_don',
  'id_benh',
  'id_phac_do',
  'chan_doan',
  'hinh_anh_don_thuoc',
  'ngay_ke_don',
  'so_ngay_hieu_luc',
  'trang_thai',
  'id_nhan_vien_duyet',
  'ngay_duyet',
  'ghi_chu_duyet',
]);
const PRESCRIPTION_STATUSES = new Set(['cho_duyet', 'da_duyet', 'tu_choi']);

function isValidDateOnly(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value))) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function normalizePrescription(body) {
  const input = body && typeof body === 'object' && !Array.isArray(body) ? body : {};
  const fields = {};
  const unsupportedFields = Object.keys(input).filter((field) => (
    !ALLOWED_FIELDS.has(field) && field !== 'id' && field !== 'ngay_tao'
  ));
  if (unsupportedFields.length) {
    return { error: `Trường đơn thuốc không hợp lệ: ${unsupportedFields.join(', ')}` };
  }

  for (const [field, value] of Object.entries(input)) {
    if (ALLOWED_FIELDS.has(field)) fields[field] = value;
  }
  if (
    fields.trang_thai !== undefined
    && !PRESCRIPTION_STATUSES.has(fields.trang_thai)
  ) {
    return { error: 'Trạng thái đơn thuốc không hợp lệ.' };
  }
  if (
    fields.so_ngay_hieu_luc !== undefined
    && (!Number.isInteger(Number(fields.so_ngay_hieu_luc)) || Number(fields.so_ngay_hieu_luc) < 1)
  ) {
    return { error: 'Số ngày hiệu lực phải là số nguyên dương.' };
  }
  if (
    fields.ngay_ke_don !== undefined
    && !isValidDateOnly(fields.ngay_ke_don)
  ) {
    return { error: 'Ngày kê đơn phải có định dạng YYYY-MM-DD.' };
  }
  return { fields };
}

function sendDatabaseError(res, error, message) {
  if (
    error.code === 'ER_SIGNAL_EXCEPTION'
    || error.code === 'ER_NO_REFERENCED_ROW_2'
    || error.code === 'ER_DUP_ENTRY'
    || error.code === 'ER_BAD_NULL_ERROR'
  ) {
    return res.status(400).json({ message: error.sqlMessage || error.message });
  }
  console.error(`${message}:`, error.message);
  return res.status(500).json({ message });
}

exports.getAll = (req, res) => {
  Model.getAll((error, rows) => error
    ? sendDatabaseError(res, error, 'Không thể tải danh sách đơn thuốc.')
    : res.json(rows));
};

exports.getById = (req, res) => {
  Model.getById(req.params.id, (error, rows) => {
    if (error) return sendDatabaseError(res, error, 'Không thể tải đơn thuốc.');
    if (!rows.length) return res.status(404).json({ message: 'Không tìm thấy đơn thuốc.' });
    return res.json(rows[0]);
  });
};

exports.applyRegimen = (req, res) => {
  const regimenId = Number(req.body?.id_phac_do);
  if (!Number.isInteger(regimenId) || regimenId < 1) {
    return res.status(400).json({ message: 'Phác đồ điều trị không hợp lệ.' });
  }
  const diagnosis = String(req.body?.chan_doan || '').trim();
  if (!diagnosis) {
    return res.status(400).json({ message: 'Cần nhập chẩn đoán trước khi áp dụng phác đồ.' });
  }

  Model.applyRegimen(req.params.id, regimenId, diagnosis, (error) => {
    if (error) {
      if (error.code === 'PRESCRIPTION_NOT_FOUND') {
        return res.status(404).json({ message: 'Không tìm thấy toa thuốc.' });
      }
      if (error.code === 'PRESCRIPTION_NOT_PENDING') {
        return res.status(409).json({ message: 'Chỉ có thể áp dụng phác đồ cho toa đang chờ duyệt.' });
      }
      return sendDatabaseError(res, error, 'Không thể áp dụng phác đồ vào toa thuốc.');
    }
    return res.json({ message: 'Đã áp dụng phác đồ vào toa thuốc.' });
  });
};

exports.create = (req, res) => {
  const { fields, error } = normalizePrescription(req.body);
  if (error) return res.status(400).json({ message: error });
  if (!fields.id_khach_hang || !fields.ngay_ke_don) {
    return res.status(400).json({ message: 'Cần cung cấp khách hàng và ngày kê đơn.' });
  }

  Model.validatePharmacistReferences(fields, (validationError, validReferences) => {
    if (validationError) return sendDatabaseError(res, validationError, 'Không thể kiểm tra nhân viên kê toa.');
    if (!validReferences) {
      return res.status(400).json({ message: 'Người kê và người duyệt toa phải là dược sĩ có hồ sơ nhân viên.' });
    }
    Model.create(fields, (modelError, result) => {
      if (modelError) return sendDatabaseError(res, modelError, 'Không thể tạo đơn thuốc.');
      return res.status(201).json({ id: result.insertId });
    });
  });
};

exports.update = (req, res) => {
  const { fields, error } = normalizePrescription(req.body);
  if (error) return res.status(400).json({ message: error });
  if (!Object.keys(fields).length) {
    return res.status(400).json({ message: 'Cần cung cấp ít nhất một trường hợp lệ để cập nhật.' });
  }

  Model.validatePharmacistReferences(fields, (validationError, validReferences) => {
    if (validationError) return sendDatabaseError(res, validationError, 'Không thể kiểm tra nhân viên kê toa.');
    if (!validReferences) {
      return res.status(400).json({ message: 'Người kê và người duyệt toa phải là dược sĩ có hồ sơ nhân viên.' });
    }
    Model.update(req.params.id, fields, (modelError, result) => {
      if (modelError) return sendDatabaseError(res, modelError, 'Không thể cập nhật đơn thuốc.');
      if (!result.affectedRows) return res.status(404).json({ message: 'Không tìm thấy đơn thuốc.' });
      return res.json({ message: 'Updated' });
    });
  });
};

exports.delete = (req, res) => {
  Model.delete(req.params.id, (error, result) => {
    if (error) return sendDatabaseError(res, error, 'Không thể xóa đơn thuốc.');
    if (!result.affectedRows) return res.status(404).json({ message: 'Không tìm thấy đơn thuốc.' });
    return res.json({ message: 'Deleted' });
  });
};

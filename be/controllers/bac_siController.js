const Model = require('../models/bac_siModel');

function sendDatabaseError(res, error, message) {
  if (error.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({ message: 'Tài khoản đã được liên kết với hồ sơ nhân viên.' });
  }
  if (error.code === 'ER_NO_REFERENCED_ROW_2') {
    return res.status(400).json({ message: 'Tài khoản dược sĩ không hợp lệ.' });
  }
  console.error(`${message}:`, error.message);
  return res.status(500).json({ message });
}

exports.getAll = (req, res) => {
  Model.getAll((error, rows) => error
    ? sendDatabaseError(res, error, 'Không thể tải danh sách dược sĩ.')
    : res.json(rows));
};

exports.getById = (req, res) => {
  Model.getById(req.params.id, (error, rows) => {
    if (error) return sendDatabaseError(res, error, 'Không thể tải hồ sơ dược sĩ.');
    if (!rows.length) return res.status(404).json({ message: 'Không tìm thấy hồ sơ dược sĩ.' });
    return res.json(rows[0]);
  });
};

exports.create = (req, res) => {
  const body = req.body || {};
  if (!body.id_tai_khoan || !String(body.ho_ten || '').trim()) {
    return res.status(400).json({ message: 'Cần cung cấp tài khoản dược sĩ và họ tên.' });
  }
  Model.create({ ...body, ho_ten: String(body.ho_ten).trim() }, (error, result) => {
    if (error) return sendDatabaseError(res, error, 'Không thể tạo hồ sơ dược sĩ.');
    if (!result.affectedRows) {
      return res.status(400).json({ message: 'Tài khoản không tồn tại hoặc không có vai trò dược sĩ.' });
    }
    return res.status(201).json({ id: result.insertId });
  });
};

exports.update = (req, res) => {
  Model.update(req.params.id, req.body || {}, (error, result) => {
    if (error) return sendDatabaseError(res, error, 'Không thể cập nhật hồ sơ dược sĩ.');
    if (!result.affectedRows) return res.status(404).json({ message: 'Không tìm thấy hồ sơ dược sĩ.' });
    return res.json({ message: 'Updated' });
  });
};

exports.delete = (req, res) => {
  Model.delete(req.params.id, (error, result) => {
    if (error) return sendDatabaseError(res, error, 'Không thể xóa hồ sơ dược sĩ.');
    if (!result.affectedRows) return res.status(404).json({ message: 'Không tìm thấy hồ sơ dược sĩ.' });
    return res.json({ message: 'Deleted' });
  });
};

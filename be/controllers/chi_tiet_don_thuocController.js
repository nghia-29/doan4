const Model = require('../models/chi_tiet_don_thuocModel');
exports.getAll = (req, res) => { Model.getAll((err, r) => err ? res.status(500).json(err) : res.json(r)); };
exports.getById = (req, res) => { Model.getById(req.params.id, (err, r) => err ? res.status(500).json(err) : res.json(r)); };
exports.getByKeys = (req, res) => {
  Model.getByKeys(req.params.parentId, req.params.itemId, (err, rows) => {
    if (err) return res.status(500).json(err);
    if (!rows.length) return res.status(404).json({ message: 'Không tìm thấy chi tiết đơn thuốc' });
    return res.json(rows[0]);
  });
};
exports.create = (req, res) => {
  const body = req.body || {};
  if (!body.id_don_thuoc || !body.id_thuoc || !Number.isInteger(Number(body.so_luong_ke)) || Number(body.so_luong_ke) <= 0) {
    return res.status(400).json({ message: 'Cần có đơn thuốc, thuốc và số lượng kê hợp lệ' });
  }
  Model.create(body, (err, result) => {
    if (err) return res.status(500).json(err);
    if (!result.affectedRows) return res.status(409).json({ message: 'Đơn thuốc không tồn tại hoặc đã được xử lý' });
    return res.status(201).json({ id_don_thuoc: body.id_don_thuoc, id_thuoc: body.id_thuoc });
  });
};
exports.update = (req, res) => {
  const body = req.body || {};
  const allowedFields = ['so_luong_ke', 'lieu_dung', 'so_ngay_dung'];
  if (!Object.keys(body).length || Object.keys(body).some((field) => !allowedFields.includes(field))) {
    return res.status(400).json({ message: 'Thông tin chi tiết đơn thuốc không hợp lệ' });
  }
  if (body.so_luong_ke !== undefined && (!Number.isInteger(Number(body.so_luong_ke)) || Number(body.so_luong_ke) <= 0)) {
    return res.status(400).json({ message: 'Số lượng kê phải là số nguyên dương' });
  }
  if (body.so_ngay_dung !== undefined && body.so_ngay_dung !== null &&
      (!Number.isInteger(Number(body.so_ngay_dung)) || Number(body.so_ngay_dung) <= 0)) {
    return res.status(400).json({ message: 'Số ngày dùng phải là số nguyên dương hoặc null' });
  }
  Model.update(req.params.parentId, req.params.itemId, body, (err, result) => {
    if (err) return res.status(500).json(err);
    if (!result.affectedRows) return res.status(404).json({ message: 'Không tìm thấy chi tiết đơn thuốc' });
    return res.json({ message: 'Updated' });
  });
};
exports.delete = (req, res) => {
  Model.delete(req.params.parentId, req.params.itemId, (err, result) => {
    if (err) return res.status(500).json(err);
    if (!result.affectedRows) return res.status(404).json({ message: 'Không tìm thấy chi tiết đơn thuốc' });
    return res.json({ message: 'Deleted' });
  });
};

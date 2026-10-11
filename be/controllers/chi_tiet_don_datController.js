const Model = require('../models/chi_tiet_don_datModel');
exports.getAll = (req, res) => { Model.getAll((err, r) => err ? res.status(500).json(err) : res.json(r)); };
exports.getById = (req, res) => { Model.getById(req.params.id, (err, r) => err ? res.status(500).json(err) : res.json(r)); };
exports.getByKeys = (req, res) => {
  Model.getByKeys(req.params.parentId, req.params.itemId, (err, rows) => {
    if (err) return res.status(500).json(err);
    if (!rows.length) return res.status(404).json({ message: 'Không tìm thấy chi tiết đơn đặt thuốc' });
    return res.json(rows[0]);
  });
};
exports.create = (req, res) => {
  const body = req.body || {};
  if (!body.id_don_dat || !body.id_thuoc || !Number.isInteger(Number(body.so_luong)) || Number(body.so_luong) <= 0) {
    return res.status(400).json({ message: 'Cần có đơn đặt, thuốc và số lượng hợp lệ' });
  }
  Model.create(body, (err, result) => {
    if (err) return res.status(500).json(err);
    if (!result.affectedRows) return res.status(409).json({ message: 'Đơn không tồn tại hoặc không còn ở trạng thái chờ xác nhận' });
    return res.status(201).json({ id_don_dat: body.id_don_dat, id_thuoc: body.id_thuoc });
  });
};
exports.update = (req, res) => {
  const body = req.body || {};
  if (Object.keys(body).length !== 1 || !Number.isInteger(Number(body.so_luong)) || Number(body.so_luong) <= 0) {
    return res.status(400).json({ message: 'Chỉ được cập nhật số lượng hợp lệ của chi tiết đơn' });
  }
  Model.update(req.params.parentId, req.params.itemId, Number(body.so_luong), (err, result) => {
    if (err) return res.status(500).json(err);
    if (!result.affectedRows) return res.status(404).json({ message: 'Không tìm thấy chi tiết đơn đặt thuốc' });
    return res.json({ message: 'Updated' });
  });
};
exports.delete = (req, res) => {
  Model.delete(req.params.parentId, req.params.itemId, (err, result) => {
    if (err) return res.status(500).json(err);
    if (!result.affectedRows) return res.status(404).json({ message: 'Không tìm thấy chi tiết đơn đặt thuốc' });
    return res.json({ message: 'Deleted' });
  });
};

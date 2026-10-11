const Model = require('../models/chi_tiet_phieu_nhapModel');
exports.getAll = (req, res) => { Model.getAll((err, r) => err ? res.status(500).json(err) : res.json(r)); };
exports.getById = (req, res) => { Model.getById(req.params.id, (err, r) => err ? res.status(500).json(err) : res.json(r)); };
exports.getByKeys = (req, res) => {
  Model.getByKeys(req.params.parentId, req.params.itemId, (err, rows) => {
    if (err) return res.status(500).json(err);
    if (!rows.length) return res.status(404).json({ message: 'Không tìm thấy chi tiết phiếu nhập' });
    return res.json(rows[0]);
  });
};
exports.create = (req, res) => { Model.create(req.body, (err, r) => err ? res.status(500).json(err) : res.json({ id: r.insertId })); };

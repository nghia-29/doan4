const Model = require('../models/lo_thuocModel');

exports.getAll = (req, res) => {
  Model.getAll((err, rows) => err ? res.status(500).json(err) : res.json(rows));
};

exports.getById = (req, res) => {
  Model.getById(req.params.id, (err, rows) => {
    if (err) return res.status(500).json(err);
    if (!rows.length) return res.status(404).json({ message: 'Không tìm thấy lô thuốc' });
    return res.json(rows[0]);
  });
};

exports.getByThuocId = (req, res) => {
  Model.getByThuocId(req.params.idThuoc, (err, rows) => err ? res.status(500).json(err) : res.json(rows));
};

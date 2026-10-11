const Model = require('../models/v_ton_kho_theo_loModel');

exports.getAll = (req, res) => {
  Model.getAll((err, rows) => err ? res.status(500).json(err) : res.json(rows));
};

exports.getByThuocId = (req, res) => {
  Model.getByThuocId(req.params.idThuoc, (err, rows) => err ? res.status(500).json(err) : res.json(rows));
};

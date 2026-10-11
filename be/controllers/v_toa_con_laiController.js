const Model = require('../models/v_toa_con_laiModel');

exports.getAll = (req, res) => {
  Model.getAll((err, rows) => err ? res.status(500).json(err) : res.json(rows));
};

exports.getByDonThuocId = (req, res) => {
  Model.getByDonThuocId(req.params.idDonThuoc, (err, rows) => err ? res.status(500).json(err) : res.json(rows));
};

const Model = require('../models/chi_tiet_xuat_loModel');

exports.getAll = (req, res) => {
  Model.getAll((err, rows) => err ? res.status(500).json(err) : res.json(rows));
};

exports.getByDonDatId = (req, res) => {
  Model.getByDonDatId(req.params.idDonDat, (err, rows) => err ? res.status(500).json(err) : res.json(rows));
};

const Model = require('../models/v_thuoc_sap_het_hanModel');
exports.getAll = (req, res) => { Model.getAll((err, r) => err ? res.status(500).json(err) : res.json(r)); };
exports.getById = (req, res) => {
  Model.getById(req.params.id, (err, rows) => {
    if (err) return res.status(500).json(err);
    if (!rows.length) return res.status(404).json({ message: 'Không tìm thấy thuốc sắp hết hạn' });
    return res.json(rows[0]);
  });
};

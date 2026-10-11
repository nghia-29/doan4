const Model = require('../models/don_dat_thuocModel');
exports.getAll = (req, res) => { Model.getAll((err, r) => err ? res.status(500).json(err) : res.json(r)); };
exports.getById = (req, res) => { Model.getById(req.params.id, (err, r) => err ? res.status(500).json(err) : res.json(r[0])); };
exports.create = (req, res) => {
  const body = req.body || {};
  const required = ['id_khach_hang', 'tong_tien', 'thanh_tien', 'dia_chi_giao_hang'];
  if (required.some((field) => body[field] === undefined || body[field] === null)) {
    return res.status(400).json({ message: 'Thiếu thông tin bắt buộc để tạo đơn đặt thuốc' });
  }

  const order = {};
  ['id_khach_hang', 'id_don_thuoc', 'id_khuyen_mai', 'tong_tien', 'giam_gia', 'thanh_tien', 'dia_chi_giao_hang', 'so_dien_thoai_nhan']
    .forEach((field) => {
      if (body[field] !== undefined) order[field] = body[field];
    });
  order.trang_thai = 'cho_xac_nhan';
  order.da_xuat_kho = 0;
  return Model.create(order, (err, result) => err
    ? res.status(500).json(err)
    : res.status(201).json({ id: result.insertId }));
};
exports.update = (req, res) => {
  const allowedFields = ['trang_thai', 'dia_chi_giao_hang', 'so_dien_thoai_nhan'];
  const body = req.body || {};
  const fields = Object.keys(body);
  if (!fields.length || fields.some((field) => !allowedFields.includes(field))) {
    return res.status(400).json({ message: 'Chỉ được cập nhật trạng thái hoặc thông tin giao hàng của đơn' });
  }

  const statuses = ['cho_xac_nhan', 'da_xac_nhan', 'dang_chuan_bi', 'dang_giao', 'hoan_thanh', 'da_huy'];
  if (body.trang_thai !== undefined && !statuses.includes(body.trang_thai)) {
    return res.status(400).json({ message: 'Trạng thái đơn hàng không hợp lệ' });
  }

  return Model.update(req.params.id, body, (err, result) => {
    if (err) return res.status(500).json(err);
    if (!result.affectedRows) return res.status(404).json({ message: 'Không tìm thấy đơn đặt thuốc' });
    return res.json({ message: 'Updated' });
  });
};

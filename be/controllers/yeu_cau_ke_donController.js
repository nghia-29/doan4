const Model = require('../models/yeu_cau_ke_donModel');

const CUSTOMER_ROLE = 'khach_hang';
const STAFF_READ_ROLES = new Set(['admin', 'duoc_si', 'nv_quan_ly']);
const PHARMACIST_ROLE = 'duoc_si';

function sendDatabaseError(res, error, message) {
  if (
    error.code === 'ER_SIGNAL_EXCEPTION'
    || error.code === 'ER_NO_REFERENCED_ROW_2'
    || error.code === 'ER_BAD_NULL_ERROR'
  ) {
    return res.status(400).json({ message: error.sqlMessage || error.message });
  }
  if (error.code === 'PHARMACIST_NOT_FOUND') {
    return res.status(403).json({ message: error.message });
  }
  console.error(`${message}:`, error.message);
  return res.status(500).json({ message });
}

function isCustomer(user) {
  return user.role === CUSTOMER_ROLE;
}

function isStaffReader(user) {
  return STAFF_READ_ROLES.has(user.role);
}

function isPharmacist(user) {
  return user.role === PHARMACIST_ROLE;
}

function validateRequest(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { error: 'Thông tin yêu cầu kê đơn không hợp lệ.' };
  }
  const allowedFields = new Set([
    'ten_benh_khai',
    'trieu_chung',
    'thoi_gian_bi_benh',
    'di_ung_thuoc',
    'benh_nen_thuoc_dang_dung',
  ]);
  if (Object.keys(body).some((field) => !allowedFields.has(field))) {
    return { error: 'Yêu cầu chứa trường thông tin không được hỗ trợ.' };
  }
  const request = {
    ten_benh_khai: String(body.ten_benh_khai || '').trim(),
    trieu_chung: String(body.trieu_chung || '').trim(),
    thoi_gian_bi_benh: String(body.thoi_gian_bi_benh || '').trim() || null,
    di_ung_thuoc: String(body.di_ung_thuoc || '').trim() || null,
    benh_nen_thuoc_dang_dung: String(body.benh_nen_thuoc_dang_dung || '').trim() || null,
  };
  if (
    !request.ten_benh_khai
    || request.ten_benh_khai.length > 150
    || !request.trieu_chung
    || request.thoi_gian_bi_benh?.length > 100
  ) {
    return { error: 'Cần nhập bệnh/triệu chứng chính và mô tả triệu chứng hợp lệ.' };
  }
  return { request };
}

function validatePrescription(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { error: 'Thông tin kê đơn không hợp lệ.' };
  }
  const allowedFields = new Set([
    'id_benh',
    'id_phac_do',
    'chan_doan',
    'ngay_ke_don',
    'so_ngay_hieu_luc',
  ]);
  if (Object.keys(body).some((field) => !allowedFields.has(field))) {
    return { error: 'Kê đơn chứa trường thông tin không được hỗ trợ.' };
  }
  const parseOptionalId = (value, fieldName) => {
    if (value === undefined || value === null || value === '') return { value: null };
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed > 0
      ? { value: parsed }
      : { error: `${fieldName} không hợp lệ.` };
  };
  const disease = parseOptionalId(body.id_benh, 'Bệnh');
  const regimen = parseOptionalId(body.id_phac_do, 'Phác đồ');
  if (disease.error || regimen.error) return { error: disease.error || regimen.error };

  const date = body.ngay_ke_don === undefined
    ? new Date().toISOString().slice(0, 10)
    : String(body.ngay_ke_don);
  const parsedDate = new Date(`${date}T00:00:00.000Z`);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(date)
    || !Number.isFinite(parsedDate.getTime())
    || parsedDate.toISOString().slice(0, 10) !== date
  ) {
    return { error: 'Ngày kê đơn phải có định dạng YYYY-MM-DD hợp lệ.' };
  }
  const validityDays = body.so_ngay_hieu_luc === undefined
    ? 5
    : Number(body.so_ngay_hieu_luc);
  if (!Number.isInteger(validityDays) || validityDays < 1) {
    return { error: 'Số ngày hiệu lực phải là số nguyên dương.' };
  }
  const diagnosis = String(body.chan_doan || '').trim() || null;
  if (!disease.value && !regimen.value && !diagnosis) {
    return { error: 'Cần cung cấp bệnh, phác đồ hoặc chẩn đoán.' };
  }

  return {
    prescription: {
      id_benh: disease.value,
      id_phac_do: regimen.value,
      chan_doan: diagnosis,
      ngay_ke_don: date,
      so_ngay_hieu_luc: validityDays,
    },
  };
}

exports.getAll = async (req, res) => {
  if (!isCustomer(req.user) && !isStaffReader(req.user)) {
    return res.status(403).json({ message: 'Tài khoản không có quyền xem yêu cầu kê đơn.' });
  }
  try {
    return res.json(await Model.getAll(req.user.id, isCustomer(req.user)));
  } catch (error) {
    return sendDatabaseError(res, error, 'Không thể tải danh sách yêu cầu kê đơn.');
  }
};

exports.getQueue = async (req, res) => {
  if (!isPharmacist(req.user)) {
    return res.status(403).json({ message: 'Chỉ dược sĩ mới được xem hàng đợi kê đơn.' });
  }
  try {
    return res.json(await Model.getQueue());
  } catch (error) {
    return sendDatabaseError(res, error, 'Không thể tải hàng đợi kê đơn.');
  }
};

exports.getById = async (req, res) => {
  if (!isCustomer(req.user) && !isStaffReader(req.user)) {
    return res.status(403).json({ message: 'Tài khoản không có quyền xem yêu cầu kê đơn.' });
  }
  try {
    const request = await Model.getById(req.params.id, req.user.id, isCustomer(req.user));
    if (!request) return res.status(404).json({ message: 'Không tìm thấy yêu cầu kê đơn.' });
    return res.json(request);
  } catch (error) {
    return sendDatabaseError(res, error, 'Không thể tải yêu cầu kê đơn.');
  }
};

exports.create = async (req, res) => {
  if (!isCustomer(req.user)) {
    return res.status(403).json({ message: 'Chỉ khách hàng mới được tạo yêu cầu kê đơn.' });
  }
  const { request, error } = validateRequest(req.body);
  if (error) return res.status(400).json({ message: error });
  try {
    const [result] = await Model.create(req.user.id, request);
    if (!result.affectedRows) {
      return res.status(404).json({ message: 'Không tìm thấy hồ sơ khách hàng.' });
    }
    return res.status(201).json({ id: result.insertId });
  } catch (databaseError) {
    return sendDatabaseError(res, databaseError, 'Không thể tạo yêu cầu kê đơn.');
  }
};

exports.cancel = async (req, res) => {
  if (!isCustomer(req.user)) {
    return res.status(403).json({ message: 'Chỉ khách hàng mới được hủy yêu cầu của mình.' });
  }
  try {
    const [result] = await Model.cancel(req.params.id, req.user.id);
    if (!result.affectedRows) {
      return res.status(409).json({ message: 'Chỉ có thể hủy yêu cầu đang chờ dược sĩ tiếp nhận.' });
    }
    return res.json({ message: 'Đã hủy yêu cầu kê đơn.' });
  } catch (error) {
    return sendDatabaseError(res, error, 'Không thể hủy yêu cầu kê đơn.');
  }
};

exports.accept = async (req, res) => {
  if (!isPharmacist(req.user)) {
    return res.status(403).json({ message: 'Chỉ dược sĩ mới được tiếp nhận yêu cầu kê đơn.' });
  }
  try {
    await Model.accept(req.user.id, req.params.id);
    return res.json({ message: 'Đã tiếp nhận yêu cầu kê đơn.' });
  } catch (error) {
    return sendDatabaseError(res, error, 'Không thể tiếp nhận yêu cầu kê đơn.');
  }
};

exports.reject = async (req, res) => {
  if (!isPharmacist(req.user)) {
    return res.status(403).json({ message: 'Chỉ dược sĩ mới được từ chối yêu cầu kê đơn.' });
  }
  const reason = String(req.body?.ly_do_tu_choi || '').trim();
  if (!reason) return res.status(400).json({ message: 'Cần cung cấp lý do từ chối.' });
  try {
    await Model.reject(req.user.id, req.params.id, reason);
    return res.json({ message: 'Đã từ chối yêu cầu kê đơn.' });
  } catch (error) {
    return sendDatabaseError(res, error, 'Không thể từ chối yêu cầu kê đơn.');
  }
};

exports.prescribe = async (req, res) => {
  if (!isPharmacist(req.user)) {
    return res.status(403).json({ message: 'Chỉ dược sĩ mới được kê toa từ yêu cầu.' });
  }
  const { prescription, error } = validatePrescription(req.body);
  if (error) return res.status(400).json({ message: error });
  try {
    const idDonThuoc = await Model.prescribe(req.user.id, req.params.id, prescription);
    return res.status(201).json({ id_don_thuoc: idDonThuoc });
  } catch (databaseError) {
    return sendDatabaseError(res, databaseError, 'Không thể kê toa từ yêu cầu.');
  }
};

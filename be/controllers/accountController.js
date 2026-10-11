const db = require('../common/db');

const PROFILE_FIELDS = {
  ho_ten: 'ho_ten',
  so_dien_thoai: 'so_dien_thoai',
  email: 'email',
  dia_chi: 'dia_chi',
  ngay_sinh: 'ngay_sinh',
};

function sendDatabaseError(res, error, message) {
  if (error.code === 'ER_NO_REFERENCED_ROW_2' || error.code === 'ER_BAD_NULL_ERROR') {
    return res.status(400).json({ message: error.sqlMessage || error.message });
  }
  console.error(`${message}:`, error.message);
  return res.status(500).json({ message });
}

function normalizeProfile(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { error: 'Thông tin hồ sơ không hợp lệ.' };
  }
  const keys = Object.keys(body);
  if (!keys.length || keys.some((key) => !Object.prototype.hasOwnProperty.call(PROFILE_FIELDS, key))) {
    return { error: 'Chỉ được cập nhật họ tên, số điện thoại, email, địa chỉ và ngày sinh.' };
  }

  const profile = {};
  for (const field of keys) {
    const value = body[field];
    if (value !== null && value !== undefined && typeof value !== 'string') {
      return { error: `Giá trị ${field} không hợp lệ.` };
    }
    const normalized = typeof value === 'string' ? value.trim() : '';
    profile[field] = normalized || null;
  }

  if (Object.hasOwn(profile, 'ho_ten') && (!profile.ho_ten || profile.ho_ten.length > 100)) {
    return { error: 'Họ tên không được để trống và tối đa 100 ký tự.' };
  }
  if (profile.so_dien_thoai && profile.so_dien_thoai.length > 15) {
    return { error: 'Số điện thoại tối đa 15 ký tự.' };
  }
  if (profile.email && profile.email.length > 100) {
    return { error: 'Email tối đa 100 ký tự.' };
  }
  if (profile.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)) {
    return { error: 'Địa chỉ email chưa đúng định dạng.' };
  }
  if (profile.dia_chi && profile.dia_chi.length > 65535) {
    return { error: 'Địa chỉ quá dài.' };
  }
  if (profile.ngay_sinh) {
    const date = new Date(`${profile.ngay_sinh}T00:00:00.000Z`);
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(profile.ngay_sinh)
      || !Number.isFinite(date.getTime())
      || date.toISOString().slice(0, 10) !== profile.ngay_sinh
    ) {
      return { error: 'Ngày sinh phải có định dạng YYYY-MM-DD hợp lệ.' };
    }
  }
  return { profile };
}

async function loadProfile(accountId) {
  const [rows] = await db.pool.promise().query(
    `SELECT account.id AS id_tai_khoan, account.ten_dang_nhap,
            role.ten_vai_tro AS vai_tro,
            customer.id, customer.ho_ten, customer.so_dien_thoai,
            customer.email, customer.dia_chi, customer.ngay_sinh
     FROM tai_khoan AS account
     INNER JOIN vai_tro AS role ON role.id = account.id_vai_tro
     INNER JOIN khach_hang AS customer ON customer.id_tai_khoan = account.id
     WHERE account.id = ?
     LIMIT 1`,
    [accountId]
  );
  return rows[0] || null;
}

exports.getMe = async (req, res) => {
  if (req.user.role !== 'khach_hang') {
    return res.status(403).json({ message: 'Chỉ khách hàng mới được xem hồ sơ khách hàng.' });
  }
  try {
    const profile = await loadProfile(req.user.id);
    if (!profile) return res.status(404).json({ message: 'Không tìm thấy hồ sơ khách hàng.' });
    return res.json(profile);
  } catch (error) {
    return sendDatabaseError(res, error, 'Không thể tải hồ sơ tài khoản.');
  }
};

exports.updateMe = async (req, res) => {
  if (req.user.role !== 'khach_hang') {
    return res.status(403).json({ message: 'Chỉ khách hàng mới được cập nhật hồ sơ khách hàng.' });
  }
  const { profile, error } = normalizeProfile(req.body);
  if (error) return res.status(400).json({ message: error });

  const fields = Object.keys(profile);
  const assignments = fields.map((field) => `customer.\`${PROFILE_FIELDS[field]}\` = ?`);
  try {
    const [result] = await db.pool.promise().query(
      `UPDATE khach_hang AS customer
       SET ${assignments.join(', ')}
       WHERE customer.id_tai_khoan = ?`,
      [...fields.map((field) => profile[field]), req.user.id]
    );
    const updatedProfile = await loadProfile(req.user.id);
    if (!updatedProfile) {
      return res.status(404).json({ message: 'Không tìm thấy hồ sơ khách hàng.' });
    }
    return res.json(updatedProfile);
  } catch (databaseError) {
    return sendDatabaseError(res, databaseError, 'Không thể cập nhật hồ sơ tài khoản.');
  }
};

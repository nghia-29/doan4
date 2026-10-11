const crypto = require('node:crypto');
const db = require('../common/db');
const { signAccessToken } = require('../middleware/authorization');

const PASSWORD_HASH_PREFIX = 'scrypt$';

function hashPassword(password) {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16);
    crypto.scrypt(password, salt, 64, (error, derivedKey) => {
      if (error) return reject(error);
      resolve(`${PASSWORD_HASH_PREFIX}${salt.toString('hex')}$${derivedKey.toString('hex')}`);
    });
  });
}

function verifyPassword(password, storedPassword) {
  if (!String(storedPassword).startsWith(PASSWORD_HASH_PREFIX)) {
    const candidate = Buffer.from(String(password));
    const existing = Buffer.from(String(storedPassword));
    return Promise.resolve(
      candidate.length === existing.length && crypto.timingSafeEqual(candidate, existing)
    );
  }

  const [, saltHex, hashHex] = String(storedPassword).split('$');
  if (!saltHex || !hashHex || !/^[a-f0-9]+$/i.test(saltHex) || !/^[a-f0-9]+$/i.test(hashHex)) {
    return Promise.resolve(false);
  }
  const salt = Buffer.from(saltHex, 'hex');
  const expectedHash = Buffer.from(hashHex, 'hex');
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, expectedHash.length, (error, actualHash) => {
      if (error) return reject(error);
      resolve(actualHash.length === expectedHash.length && crypto.timingSafeEqual(actualHash, expectedHash));
    });
  });
}

async function login(req, res) {
  const username = String(req.body?.username || '').trim();
  const password = String(req.body?.password || '');
  if (!username || !password || password.length > 256) {
    return res.status(400).json({ message: 'Vui lòng nhập tên đăng nhập và mật khẩu.' });
  }

  try {
    const [accounts] = await db.pool.promise().query(
      `SELECT account.id, account.ten_dang_nhap, account.mat_khau, account.trang_thai, r.ten_vai_tro
       FROM tai_khoan AS account
       INNER JOIN vai_tro AS r ON r.id = account.id_vai_tro
       WHERE LOWER(account.ten_dang_nhap) = LOWER(?)
       LIMIT 1`,
      [username]
    );
    const account = accounts[0];
    if (
      !account
      || !await verifyPassword(password, account.mat_khau)
      || Number(account.trang_thai) === 0
      || String(account.trang_thai).toUpperCase() === 'KHOA'
    ) {
      return res.status(401).json({ message: 'Sai tên đăng nhập, mật khẩu hoặc tài khoản đã bị khóa.' });
    }

    const { token, expiresAt } = signAccessToken(account);
    if (!String(account.mat_khau).startsWith(PASSWORD_HASH_PREFIX)) {
      const upgradedHash = await hashPassword(password);
      await db.pool.promise().query(
        'UPDATE tai_khoan SET mat_khau = ? WHERE id = ?',
        [upgradedHash, account.id]
      );
    }

    return res.json({
      token,
      expiresAt,
      user: {
        id: account.id,
        ten_dang_nhap: account.ten_dang_nhap,
        vai_tro: String(account.ten_vai_tro).toLowerCase(),
      },
    });
  } catch (error) {
    if (error.message.includes('AUTH_TOKEN_SECRET')) {
      return res.status(503).json({ message: 'Máy chủ chưa cấu hình khóa bảo mật đăng nhập.' });
    }
    console.error('Login failed:', error.message);
    return res.status(500).json({ message: 'Không thể đăng nhập do lỗi máy chủ.' });
  }
}

async function register(req, res) {
  const fullName = String(req.body?.fullName || '').trim();
  const username = String(req.body?.username || '').trim();
  const password = String(req.body?.password || '');
  const phone = String(req.body?.phone || '').trim();
  const email = String(req.body?.email || '').trim();

  if (
    !fullName
    || fullName.length > 100
    || !/^[a-zA-Z0-9_.-]{3,50}$/.test(username)
    || password.length < 8
    || password.length > 128
    || phone.length > 15
    || email.length > 100
  ) {
    return res.status(400).json({ message: 'Thông tin đăng ký không hợp lệ.' });
  }

  let connection;
  try {
    connection = await db.pool.promise().getConnection();
    await connection.beginTransaction();
    const [roles] = await connection.query(
      'SELECT id FROM vai_tro WHERE ten_vai_tro = ? LIMIT 1',
      ['khach_hang']
    );
    if (!roles.length) throw new Error('Không tìm thấy vai trò khách hàng trong hệ thống.');

    const passwordHash = await hashPassword(password);
    const [accountResult] = await connection.query(
      'INSERT INTO tai_khoan (ten_dang_nhap, mat_khau, id_vai_tro, trang_thai) VALUES (?, ?, ?, 1)',
      [username, passwordHash, roles[0].id]
    );
    await connection.query(
      'INSERT INTO khach_hang (id_tai_khoan, ho_ten, so_dien_thoai, email) VALUES (?, ?, ?, ?)',
      [accountResult.insertId, fullName, phone || null, email || null]
    );
    await connection.commit();
    return res.status(201).json({
      message: 'Tạo tài khoản thành công.',
      user: {
        id: accountResult.insertId,
        ten_dang_nhap: username,
        vai_tro: 'khach_hang',
      },
    });
  } catch (error) {
    if (connection) await connection.rollback();
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Tên đăng nhập đã được sử dụng.' });
    }
    if (error.message.includes('vai trò khách hàng')) {
      return res.status(500).json({ message: error.message });
    }
    console.error('Registration failed:', error.message);
    return res.status(500).json({ message: 'Không thể tạo tài khoản.' });
  } finally {
    if (connection) connection.release();
  }
}

module.exports = { login, register };

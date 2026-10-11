const crypto = require('node:crypto');
const db = require('../common/db');

const STAFF_MANAGEMENT_RESOURCES = new Set([
  'phieu_nhap_thuoc',
  'chi_tiet_phieu_nhap',
  'lich_su_trang_thai_nhap',
  'chi_tiet_xuat_lo',
  'v_ton_kho_theo_lo',
  'lo_thuoc',
  'thuoc',
  'danh_muc_thuoc',
  'mo_ta_thuoc',
  'nha_cung_cap',
  'v_thuoc_ke_don',
  'v_thuoc_sap_het_han',
]);

const ADMIN_ONLY_RESOURCES = new Set(['tai_khoan', 'vai_tro', 'hoa_don']);
const PRESCRIPTION_WRITE_RESOURCES = new Set(['don_thuoc', 'chi_tiet_don_thuoc']);
const CUSTOMER_PRIVATE_RESOURCES = new Set(['gio_hang']);
const STAFF_REFERENCE_RESOURCES = new Set(['nhan_vien', 'bac_si', 'khach_hang']);
const STAFF_READ_ONLY_RESOURCES = new Set([
  'chi_tiet_xuat_lo',
  'v_ton_kho_theo_lo',
  'lo_thuoc',
  'v_thuoc_ke_don',
  'v_thuoc_sap_het_han',
]);
const STAFF_APPEND_ONLY_RESOURCES = new Set(['chi_tiet_phieu_nhap', 'lich_su_trang_thai_nhap']);
const PUBLIC_READ_RESOURCES = new Set([
  'benh',
  'phac_do',
  'chi_tiet_phac_do',
  'thuoc',
  'danh_muc_thuoc',
  'mo_ta_thuoc',
  'anh_thuoc',
  'v_thuoc_ke_don',
  'khuyen_mai',
  'danh_gia',
]);
const EMPLOYEE_FINANCIAL_READ_RESOURCES = new Set(['thanh_toan']);

function getTokenSecret() {
  const secret = process.env.AUTH_TOKEN_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('AUTH_TOKEN_SECRET must be configured with at least 32 characters.');
  }
  return secret;
}

function signAccessToken(account) {
  const expiresAt = Date.now() + 8 * 60 * 60 * 1000;
  const payload = Buffer.from(JSON.stringify({
    sub: String(account.id),
    username: account.ten_dang_nhap,
    role: String(account.ten_vai_tro).toLowerCase(),
    exp: Math.floor(expiresAt / 1000),
  })).toString('base64url');
  const signature = crypto.createHmac('sha256', getTokenSecret()).update(payload).digest('base64url');
  return { token: `${payload}.${signature}`, expiresAt };
}

function verifyAccessToken(token) {
  const [payload, signature, extra] = String(token || '').split('.');
  if (!payload || !signature || extra) return null;

  let expectedSignature;
  try {
    expectedSignature = crypto.createHmac('sha256', getTokenSecret()).update(payload).digest();
  } catch (error) {
    return null;
  }

  let actualSignature;
  try {
    actualSignature = Buffer.from(signature, 'base64url');
  } catch (error) {
    return null;
  }
  if (
    actualSignature.length !== expectedSignature.length
    || !crypto.timingSafeEqual(actualSignature, expectedSignature)
  ) return null;

  try {
    const claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (!claims.sub || !claims.role || !Number.isFinite(claims.exp) || claims.exp <= Date.now() / 1000) {
      return null;
    }
    return { id: claims.sub, username: claims.username, role: claims.role };
  } catch (error) {
    return null;
  }
}

function sendUnauthorized(res, message = 'Bạn cần đăng nhập để thực hiện thao tác này.') {
  return res.status(401).json({ message });
}

function sendForbidden(res) {
  return res.status(403).json({ message: 'Tài khoản không có quyền thực hiện thao tác này.' });
}

function getAuthenticatedUser(req, res) {
  const authorization = req.get('authorization') || '';
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    sendUnauthorized(res);
    return null;
  }
  const claims = verifyAccessToken(match[1]);
  if (!claims) {
    sendUnauthorized(res, 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.');
    return null;
  }
  return claims;
}

async function authorizeApiRequest(req, res, next) {
  const resource = req.path.split('/').filter(Boolean)[0];
  const method = req.method.toUpperCase();
  const isRead = method === 'GET' || method === 'HEAD';
  let user;
  const authenticate = async () => {
    const claims = getAuthenticatedUser(req, res);
    if (!claims) return null;
    try {
      const [accounts] = await db.pool.promise().query(
        `SELECT account.id, account.ten_dang_nhap, account.trang_thai, r.ten_vai_tro
         FROM tai_khoan AS account
         INNER JOIN vai_tro AS r ON r.id = account.id_vai_tro
         WHERE account.id = ?
         LIMIT 1`,
        [claims.id]
      );
      const account = accounts[0];
      if (
        !account
        || Number(account.trang_thai) === 0
        || String(account.trang_thai).toUpperCase() === 'KHOA'
      ) {
        sendUnauthorized(res, 'Tài khoản không tồn tại hoặc đã bị khóa.');
        return null;
      }
      user = {
        id: String(account.id),
        username: account.ten_dang_nhap,
        role: String(account.ten_vai_tro).toLowerCase(),
      };
      req.user = user;
      return user;
    } catch (error) {
      console.error('Authorization lookup failed:', error.message);
      res.status(503).json({ message: 'Không thể xác minh quyền trên máy chủ.' });
      return null;
    }
  };

  const rejectForUnauthenticatedUser = async () => {
    user = await authenticate();
    return user === null;
  };

  if (isRead && PUBLIC_READ_RESOURCES.has(resource)) return next();

  if (resource === 'yeu_cau_ke_don') {
    if (await rejectForUnauthenticatedUser()) return;
    return next();
  }

  if (resource === 'account') {
    if (await rejectForUnauthenticatedUser()) return;
    return next();
  }

  if (PRESCRIPTION_WRITE_RESOURCES.has(resource) && !isRead) {
    if (await rejectForUnauthenticatedUser()) return;
    if (user.role !== 'duoc_si') return sendForbidden(res);
    return next();
  }

  if (ADMIN_ONLY_RESOURCES.has(resource)) {
    if (await rejectForUnauthenticatedUser()) return;
    if (user.role !== 'admin') return sendForbidden(res);
    return next();
  }

  if (CUSTOMER_PRIVATE_RESOURCES.has(resource)) {
    if (await rejectForUnauthenticatedUser()) return;
    if (['duoc_si', 'nv_quan_ly'].includes(user.role)) return sendForbidden(res);
    return next();
  }

  if (STAFF_MANAGEMENT_RESOURCES.has(resource)) {
    if (await rejectForUnauthenticatedUser()) return;
    if (user.role !== 'admin' && !['duoc_si', 'nv_quan_ly'].includes(user.role)) {
      return sendForbidden(res);
    }
    if (
      user.role !== 'admin'
      && STAFF_READ_ONLY_RESOURCES.has(resource)
      && !isRead
    ) return sendForbidden(res);
    if (
      user.role !== 'admin'
      && STAFF_APPEND_ONLY_RESOURCES.has(resource)
      && method !== 'POST'
      && !isRead
    ) return sendForbidden(res);
    return next();
  }

  if (STAFF_REFERENCE_RESOURCES.has(resource)) {
    if (await rejectForUnauthenticatedUser()) return;
    if (user.role !== 'admin' && !isRead) return sendForbidden(res);
    return next();
  }

  if (resource === 'khuyen_mai' && !isRead) {
    if (await rejectForUnauthenticatedUser()) return;
    if (user.role !== 'admin') return sendForbidden(res);
    return next();
  }

  if (EMPLOYEE_FINANCIAL_READ_RESOURCES.has(resource)) {
    if (await rejectForUnauthenticatedUser()) return;
    if (user.role !== 'admin' && !isRead) return sendForbidden(res);
    return next();
  }

  if (resource === 'danh_gia' && !isRead) {
    if (await rejectForUnauthenticatedUser()) return;
    if (['duoc_si', 'nv_quan_ly'].includes(user.role)) return sendForbidden(res);
    if (user.role !== 'admin' && user.role !== 'khach_hang') return sendForbidden(res);
    return next();
  }

  return next();
}

module.exports = {
  authorizeApiRequest,
  signAccessToken,
};

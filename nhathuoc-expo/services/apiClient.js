import {
  mockGetAll,
  mockGetById,
  mockCreate,
  mockUpdate,
  mockRemove,
  mockApplyPrescriptionRegimen,
  mockUpdatePrescriptionLine,
  mockDeletePrescriptionLine,
  mockPrescriptionRequest,
  mockAccountProfile,
} from './mockStorage';
import { Platform } from 'react-native';
import { getAccessToken } from './authToken';

function resolveApiBaseUrl() {
  const configuredUrl = (process.env.EXPO_PUBLIC_API_URL || '').trim();
  if (configuredUrl) return configuredUrl.replace(/\/+$/, '');

  if (Platform.OS === 'android') return 'http://10.0.2.2:3000/api';
  if (Platform.OS === 'ios') return 'http://localhost:3000/api';
  return 'http://localhost:3000/api';
}

const API_BASE_URL = resolveApiBaseUrl();

export function resolveAssetUrl(uri) {
  if (!uri) return uri;
  if (/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(uri)) return uri;

  const apiOrigin = API_BASE_URL.replace(/\/api\/?$/, '');
  return `${apiOrigin}${uri.startsWith('/') ? uri : `/${uri}`}`;
}

function parseResourceAndId(path) {
  // e.g. "/thuoc/1" -> resource: "thuoc", id: "1"
  // e.g. "/thuoc" -> resource: "thuoc", id: null
  const clean = path.replace(/^\//, '').split('?')[0];
  const parts = clean.split('/');
  return {
    resource: parts[0],
    id: parts[1] || null,
  };
}

export async function request(path, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const { resource, id } = parseResourceAndId(path);
  const { mockContext, ...fetchOptions } = options;
  const accessToken = await getAccessToken();
  const isFormData = typeof FormData !== 'undefined' && fetchOptions.body instanceof FormData;
  let response;

  // Try HTTP first if API URL is configured or available
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), isFormData ? 30000 : 2500);

    try {
      response = await fetch(`${API_BASE_URL}${path}`, {
        ...fetchOptions,
        headers: {
          Accept: 'application/json',
          ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
          ...(accessToken ? { Authorization: ['Bearer', accessToken].join(' ') } : {}),
          ...(options.headers || {}),
        },
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (err) {
    if (accessToken && !__DEV__) {
      throw new Error('Không thể kết nối máy chủ; đã dừng yêu cầu để bảo vệ dữ liệu phiên đăng nhập.');
    }
    if (isFormData) throw new Error('Không thể kết nối máy chủ để tải ảnh lên.');
  }

  if (response && !response.ok) {
    let body = null;
    try {
      body = await response.json();
    } catch (err) {
      body = null;
    }
    throw new Error(
      body?.message ||
      body?.sqlMessage ||
      body?.error ||
      `Yêu cầu thất bại (HTTP ${response.status}).`
    );
  }
  if (response) return response.json();

  // Fallback to offline mock storage
  if (resource === 'account' && path === '/account/me') {
    const body = fetchOptions.body ? JSON.parse(fetchOptions.body) : {};
    return mockAccountProfile({
      method,
      accountId: mockContext?.accountId,
      body,
    });
  }
  if (resource === 'yeu_cau_ke_don') {
    const queueMatch = path.match(/^\/yeu_cau_ke_don\/queue(?:\?|$)/);
    const actionMatch = path.match(
      /^\/yeu_cau_ke_don\/([^/?]+)\/(accept|reject|cancel|prescription)(?:\?|$)/
    );
    const itemMatch = path.match(/^\/yeu_cau_ke_don\/([^/?]+)(?:\?|$)/);
    if (queueMatch || actionMatch || itemMatch || path === '/yeu_cau_ke_don') {
      const body = fetchOptions.body ? JSON.parse(fetchOptions.body) : {};
      return mockPrescriptionRequest({
        method,
        id: actionMatch?.[1] || itemMatch?.[1] || null,
        action: queueMatch ? 'queue' : actionMatch?.[2] || null,
        accountId: mockContext?.accountId,
        body,
      });
    }
  }
  const applyRegimenMatch = path.match(/^\/don_thuoc\/([^/?]+)\/apply-regimen(?:\?|$)/);
  if (method === 'POST' && applyRegimenMatch) {
    const body = options.body ? JSON.parse(options.body) : {};
    return mockApplyPrescriptionRegimen(
      applyRegimenMatch[1],
      body.id_phac_do,
      body.chan_doan
    );
  }
  const prescriptionLineMatch = path.match(
    /^\/chi_tiet_don_thuoc\/([^/?]+)\/([^/?]+)(?:\?|$)/
  );
  if (prescriptionLineMatch && method === 'PUT') {
    const body = options.body ? JSON.parse(options.body) : {};
    return mockUpdatePrescriptionLine(
      prescriptionLineMatch[1],
      prescriptionLineMatch[2],
      body
    );
  }
  if (prescriptionLineMatch && method === 'DELETE') {
    return mockDeletePrescriptionLine(
      prescriptionLineMatch[1],
      prescriptionLineMatch[2]
    );
  }

  if (method === 'GET') {
    if (id) {
      const item = await mockGetById(resource, id);
      if (!item) throw new Error('Không tìm thấy dữ liệu.');
      return item;
    }
    return await mockGetAll(resource);
  }

  if (method === 'POST') {
    const body = options.body ? JSON.parse(options.body) : {};
    return await mockCreate(resource, body);
  }

  if (method === 'PUT') {
    const body = options.body ? JSON.parse(options.body) : {};
    return await mockUpdate(resource, id, body);
  }

  if (method === 'DELETE') {
    return await mockRemove(resource, id);
  }

  return { message: 'OK' };
}

export function getList(path) {
  return request(path).then((body) => (Array.isArray(body) ? body : body?.data || []));
}

export function getOne(path) {
  return request(path);
}

export default { request, getList, getOne, baseUrl: API_BASE_URL };

import {
  mockGetAll,
  mockGetById,
  mockCreate,
  mockUpdate,
  mockRemove,
} from './mockStorage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

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

  // Try HTTP first if API URL is configured or available
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    const response = await fetch(`${API_BASE_URL}${path}`, {
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      signal: controller.signal,
      ...options,
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      return await response.json();
    }
  } catch (err) {
    // Backend offline or unreachable — seamlessly fall back to local mock storage
  }

  // Fallback to offline mock storage
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

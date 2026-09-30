const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

export async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    ...options,
  });

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(body?.message || body?.sqlMessage || body?.error || 'Không thể kết nối tới backend.');
  }

  return body;
}

export function getList(path) {
  return request(path).then((body) => (Array.isArray(body) ? body : body?.data || []));
}

export function getOne(path) {
  return request(path);
}

export default { request, getList, baseUrl: API_BASE_URL };

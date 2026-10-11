import apiClient from './apiClient';

async function postAuthRequest(path, payload) {
  let response;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);
  try {
    response = await fetch(`${apiClient.baseUrl}/auth/${path}`, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
  } catch (error) {
    const networkError = new Error('Không thể kết nối máy chủ xác thực.');
    networkError.networkUnavailable = true;
    throw networkError;
  } finally {
    clearTimeout(timeoutId);
  }

  let result = {};
  try {
    result = await response.json();
  } catch (error) {
    if (response.ok) throw new Error('Máy chủ xác thực trả về dữ liệu không hợp lệ.');
  }
  if (!response.ok) {
    throw new Error(result.message || `Yêu cầu xác thực thất bại (HTTP ${response.status}).`);
  }
  return result;
}

export function login(username, password) {
  return postAuthRequest('login', { username, password });
}

export function register(payload) {
  return postAuthRequest('register', payload);
}

import { request } from './apiClient';

const BASE_PATH = '/yeu_cau_ke_don';

function post(path, payload, accountId) {
  return request(path, {
    method: 'POST',
    body: JSON.stringify(payload),
    mockContext: { accountId },
  });
}

export default {
  getMine: (accountId) => request(BASE_PATH, { mockContext: { accountId } }),
  getQueue: (accountId) => request(`${BASE_PATH}/queue`, { mockContext: { accountId } }),
  getById: (id, accountId) => request(`${BASE_PATH}/${id}`, { mockContext: { accountId } }),
  create: (payload, accountId) => post(BASE_PATH, payload, accountId),
  cancel: (id, accountId) => post(`${BASE_PATH}/${id}/cancel`, {}, accountId),
  accept: (id, accountId) => post(`${BASE_PATH}/${id}/accept`, {}, accountId),
  reject: (id, payload, accountId) => post(`${BASE_PATH}/${id}/reject`, payload, accountId),
  prescribe: (id, payload, accountId) => post(`${BASE_PATH}/${id}/prescription`, payload, accountId),
};

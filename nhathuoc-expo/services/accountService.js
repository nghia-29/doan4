import { request } from './apiClient';

export default {
  getMe: (accountId) => request('/account/me', {
    mockContext: { accountId },
  }),
  updateMe: (payload, accountId) => request('/account/me', {
    method: 'PATCH',
    body: JSON.stringify(payload),
    mockContext: { accountId },
  }),
};

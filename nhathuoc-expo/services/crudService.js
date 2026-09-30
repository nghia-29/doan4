import { getList, getOne, request } from './apiClient';

export function createCrudService(resource) {
  return {
    getAll: () => getList(`/${resource}`),
    getById: (id) => getOne(`/${resource}/${id}`),
    create: (payload) => request(`/${resource}`, { method: 'POST', body: JSON.stringify(payload) }),
    update: (id, payload) => request(`/${resource}/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
    remove: (id) => request(`/${resource}/${id}`, { method: 'DELETE' }),
  };
}

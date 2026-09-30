import { getList, getOne } from './apiClient';

export default {
  getAll: () => getList('/thuoc'),
  getById: (id) => getOne(`/thuoc/${id}`),
};

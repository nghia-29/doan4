import { getList } from './apiClient';

export default {
  getAll: () => getList('/danh_muc_thuoc'),
};

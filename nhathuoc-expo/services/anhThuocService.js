import { getList } from './apiClient';

export default {
  getAll: () => getList('/anh_thuoc'),
};

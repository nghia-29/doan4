import { getOne } from './apiClient';

export default {
  getById: (id) => getOne(`/mo_ta_thuoc/${id}`),
};

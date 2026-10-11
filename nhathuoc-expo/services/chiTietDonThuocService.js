import { createCrudService } from './crudService';
import { request } from './apiClient';

const service = createCrudService('chi_tiet_don_thuoc');

export default {
  ...service,
  updateItem: (prescriptionId, medicineId, payload) => request(
    `/chi_tiet_don_thuoc/${prescriptionId}/${medicineId}`,
    { method: 'PUT', body: JSON.stringify(payload) }
  ),
  deleteItem: (prescriptionId, medicineId) => request(
    `/chi_tiet_don_thuoc/${prescriptionId}/${medicineId}`,
    { method: 'DELETE' }
  ),
};

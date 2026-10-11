import { request } from './apiClient';
import { createCrudService } from './crudService';

const service = createCrudService('don_thuoc');

export default {
  ...service,
  applyRegimen: (id, idPhacDo, chanDoan) => request(`/don_thuoc/${id}/apply-regimen`, {
    method: 'POST',
    body: JSON.stringify({ id_phac_do: idPhacDo, chan_doan: chanDoan }),
  }),
};

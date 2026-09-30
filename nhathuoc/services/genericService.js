import apiClient from "@/lib/apiClient";

/**
 * Tạo bộ service CRUD chuẩn cho một resource của backend.
 * Khớp đúng với router chuẩn hiện có trong `be/router/*.js`:
 *   GET    /api/<resource>
 *   GET    /api/<resource>/:id
 *   POST   /api/<resource>
 *   PUT    /api/<resource>/:id
 *   DELETE /api/<resource>/:id
 *
 * Không tạo thêm endpoint mới — chỉ gọi đúng 5 route đã có sẵn.
 */
export function createCrudService(resource) {
  const base = `/${resource}`;
  return {
    resource,
    getAll: async (params) => {
      const res = await apiClient.get(base, { params });
      return Array.isArray(res.data) ? res.data : res.data?.data || [];
    },
    getById: async (id) => {
      const res = await apiClient.get(`${base}/${id}`);
      return res.data;
    },
    create: async (payload) => {
      const res = await apiClient.post(base, payload);
      return res.data;
    },
    update: async (id, payload) => {
      const res = await apiClient.put(`${base}/${id}`, payload);
      return res.data;
    },
    remove: async (id) => {
      const res = await apiClient.delete(`${base}/${id}`);
      return res.data;
    },
  };
}

export default createCrudService;

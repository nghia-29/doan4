import { createCrudService } from "./genericService";

// Ánh xạ trực tiếp tới router: be/router/chi_tiet_don_thuocRouter.js -> app.use("/api/chi_tiet_don_thuoc", ...)
const chiTietDonThuocService = createCrudService("chi_tiet_don_thuoc");

export default chiTietDonThuocService;

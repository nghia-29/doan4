import { createCrudService } from "./genericService";

// Ánh xạ trực tiếp tới router: be/router/danh_giaRouter.js -> app.use("/api/danh_gia", ...)
const danhGiaService = createCrudService("danh_gia");

export default danhGiaService;

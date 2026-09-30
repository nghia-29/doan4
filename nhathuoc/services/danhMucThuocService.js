import { createCrudService } from "./genericService";

// Ánh xạ trực tiếp tới router: be/router/danh_muc_thuocRouter.js -> app.use("/api/danh_muc_thuoc", ...)
const danhMucThuocService = createCrudService("danh_muc_thuoc");

export default danhMucThuocService;

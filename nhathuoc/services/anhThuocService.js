import { createCrudService } from "./genericService";

// Ánh xạ trực tiếp tới router: be/router/anh_thuocRouter.js -> app.use("/api/anh_thuoc", ...)
const anhThuocService = createCrudService("anh_thuoc");

export default anhThuocService;

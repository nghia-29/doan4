import { createCrudService } from "./genericService";

// Ánh xạ trực tiếp tới router: be/router/phieu_nhap_thuocRouter.js -> app.use("/api/phieu_nhap_thuoc", ...)
const phieuNhapService = createCrudService("phieu_nhap_thuoc");

export default phieuNhapService;

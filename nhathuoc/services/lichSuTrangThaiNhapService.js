import { createCrudService } from "./genericService";

// Ánh xạ trực tiếp tới router: be/router/lich_su_trang_thai_nhapRouter.js -> app.use("/api/lich_su_trang_thai_nhap", ...)
const lichSuTrangThaiNhapService = createCrudService("lich_su_trang_thai_nhap");

export default lichSuTrangThaiNhapService;

import { createCrudService } from "./genericService";

// Ánh xạ trực tiếp tới router: be/router/chi_tiet_phieu_nhapRouter.js -> app.use("/api/chi_tiet_phieu_nhap", ...)
const chiTietPhieuNhapService = createCrudService("chi_tiet_phieu_nhap");

export default chiTietPhieuNhapService;

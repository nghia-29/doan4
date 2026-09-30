import { createCrudService } from "./genericService";

// Ánh xạ trực tiếp tới router: be/router/chi_tiet_don_datRouter.js -> app.use("/api/chi_tiet_don_dat", ...)
const chiTietDonDatService = createCrudService("chi_tiet_don_dat");

export default chiTietDonDatService;

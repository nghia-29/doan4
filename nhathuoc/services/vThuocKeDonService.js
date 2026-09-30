import { createCrudService } from "./genericService";

// Ánh xạ trực tiếp tới router: be/router/v_thuoc_ke_donRouter.js -> app.use("/api/v_thuoc_ke_don", ...)
const vThuocKeDonService = createCrudService("v_thuoc_ke_don");

export default vThuocKeDonService;

import { createCrudService } from "./genericService";

// Ánh xạ trực tiếp tới router: be/router/hoa_donRouter.js -> app.use("/api/hoa_don", ...)
const hoaDonService = createCrudService("hoa_don");

export default hoaDonService;

import { createCrudService } from "./genericService";

// Ánh xạ trực tiếp tới router: be/router/nhan_vienRouter.js -> app.use("/api/nhan_vien", ...)
const nhanVienService = createCrudService("nhan_vien");

export default nhanVienService;

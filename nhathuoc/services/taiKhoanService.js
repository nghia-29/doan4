import { createCrudService } from "./genericService";

// Ánh xạ trực tiếp tới router: be/router/tai_khoanRouter.js -> app.use("/api/tai_khoan", ...)
const taiKhoanService = createCrudService("tai_khoan");

export default taiKhoanService;

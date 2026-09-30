import { createCrudService } from "./genericService";

// Ánh xạ trực tiếp tới router: be/router/thanh_toanRouter.js -> app.use("/api/thanh_toan", ...)
const thanhToanService = createCrudService("thanh_toan");

export default thanhToanService;

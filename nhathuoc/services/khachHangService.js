import { createCrudService } from "./genericService";

// Ánh xạ trực tiếp tới router: be/router/khach_hangRouter.js -> app.use("/api/khach_hang", ...)
const khachHangService = createCrudService("khach_hang");

export default khachHangService;

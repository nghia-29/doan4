import { createCrudService } from "./genericService";

// Ánh xạ trực tiếp tới router: be/router/gio_hangRouter.js -> app.use("/api/gio_hang", ...)
const gioHangService = createCrudService("gio_hang");

export default gioHangService;

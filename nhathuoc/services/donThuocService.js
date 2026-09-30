import { createCrudService } from "./genericService";

// Ánh xạ trực tiếp tới router: be/router/don_thuocRouter.js -> app.use("/api/don_thuoc", ...)
const donThuocService = createCrudService("don_thuoc");

export default donThuocService;

import { createCrudService } from "./genericService";

// Ánh xạ trực tiếp tới router: be/router/don_dat_thuocRouter.js -> app.use("/api/don_dat_thuoc", ...)
const donDatThuocService = createCrudService("don_dat_thuoc");

export default donDatThuocService;

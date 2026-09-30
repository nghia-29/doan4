import { createCrudService } from "./genericService";

// Ánh xạ trực tiếp tới router: be/router/mo_ta_thuocRouter.js -> app.use("/api/mo_ta_thuoc", ...)
const moTaThuocService = createCrudService("mo_ta_thuoc");

export default moTaThuocService;

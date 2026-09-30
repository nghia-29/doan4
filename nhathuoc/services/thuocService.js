import { createCrudService } from "./genericService";

// Ánh xạ trực tiếp tới router: be/router/thuocRouter.js -> app.use("/api/thuoc", ...)
const thuocService = createCrudService("thuoc");

export default thuocService;

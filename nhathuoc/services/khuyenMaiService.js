import { createCrudService } from "./genericService";

// Ánh xạ trực tiếp tới router: be/router/khuyen_maiRouter.js -> app.use("/api/khuyen_mai", ...)
const khuyenMaiService = createCrudService("khuyen_mai");

export default khuyenMaiService;

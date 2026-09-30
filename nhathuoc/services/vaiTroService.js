import { createCrudService } from "./genericService";

// Ánh xạ trực tiếp tới router: be/router/vai_troRouter.js -> app.use("/api/vai_tro", ...)
const vaiTroService = createCrudService("vai_tro");

export default vaiTroService;

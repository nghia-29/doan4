import { createCrudService } from "./genericService";

// Ánh xạ trực tiếp tới router: be/router/bac_siRouter.js -> app.use("/api/bac_si", ...)
const bacSiService = createCrudService("bac_si");

export default bacSiService;

import { createCrudService } from "./genericService";

// Ánh xạ trực tiếp tới router: be/router/nha_cung_capRouter.js -> app.use("/api/nha_cung_cap", ...)
const nhaCungCapService = createCrudService("nha_cung_cap");

export default nhaCungCapService;

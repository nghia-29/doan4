import { createCrudService } from "./genericService";

// Ánh xạ trực tiếp tới router: be/router/v_thuoc_sap_het_hanRouter.js -> app.use("/api/v_thuoc_sap_het_han", ...)
const vThuocSapHetHanService = createCrudService("v_thuoc_sap_het_han");

export default vThuocSapHetHanService;

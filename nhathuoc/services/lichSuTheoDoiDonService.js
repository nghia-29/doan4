import { createCrudService } from "./genericService";

// Ánh xạ trực tiếp tới router: be/router/lich_su_theo_doi_donRouter.js -> app.use("/api/lich_su_theo_doi_don", ...)
const lichSuTheoDoiDonService = createCrudService("lich_su_theo_doi_don");

export default lichSuTheoDoiDonService;

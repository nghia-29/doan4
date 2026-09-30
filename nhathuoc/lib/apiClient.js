import axios from "axios";

// Địa chỉ backend Express (be/app.js). Đổi trong .env.local nếu backend chạy nơi khác.
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

// Chuẩn hoá lỗi trả về để các trang xử lý dễ dàng và nhất quán.
apiClient.interceptors.response.use(
  (res) => res,
  (error) => {
    const message =
      error?.response?.data?.message ||
      error?.response?.data?.sqlMessage ||
      error?.response?.data?.error ||
      (typeof error?.response?.data === "string" ? error.response.data : null) ||
      error?.message ||
      "Không thể kết nối tới máy chủ. Vui lòng kiểm tra backend (be) đã chạy chưa.";
    return Promise.reject({
      status: error?.response?.status || 0,
      message,
      raw: error,
    });
  }
);

export default apiClient;

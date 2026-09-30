import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

export const metadata = {
  title: "Nhà Thuốc Admin — Hệ thống quản lý nhà thuốc",
  description: "Giao diện quản trị hệ thống nhà thuốc: thuốc, đơn hàng, nhập kho, bác sĩ, khách hàng.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}

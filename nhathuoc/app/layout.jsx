import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

export const metadata = {
  title: "Nhà Thuốc Trực Tuyến",
  description: "Hệ thống ứng dụng di động Expo và web quản lý nhà thuốc trực tuyến: bán thuốc, kê đơn, đơn hàng, hóa đơn, nhập kho và quản trị.",
  openGraph: {
    title: "Nhà Thuốc Trực Tuyến",
    description: "Hệ thống ứng dụng di động Expo và web quản lý nhà thuốc trực tuyến: bán thuốc, kê đơn, đơn hàng, hóa đơn, nhập kho và quản trị.",
  },
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

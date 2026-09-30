"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Loading from "@/components/admin/Loading";
import { isAdminRole, isStaffRole } from "@/lib/constants";

const STAFF_ALLOWED_PATHS = [
  "/admin/thuoc",
  "/admin/thuoc-thuong",
  "/admin/thuoc-don-dat",
  "/admin/danh-muc-thuoc",
  "/admin/nha-cung-cap",
  "/admin/bac-si",
  "/admin/khach-hang",
  "/admin/nhan-vien",
];

const ADMIN_ALLOWED_PATHS = [
  "/admin",
  "/admin/don-dat-thuoc",
  "/admin/don-thuoc",
  "/admin/hoa-don",
  "/admin/thanh-toan",
  "/admin/phieu-nhap",
  "/admin/nha-cung-cap",
  "/admin/tai-khoan",
];

export default function AdminRootLayout({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const staffAllowed = STAFF_ALLOWED_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
  const adminAllowed = ADMIN_ALLOWED_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
  const canAccess = (isAdminRole(user?.vai_tro) && adminAllowed) || (isStaffRole(user?.vai_tro) && staffAllowed);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
    if (!loading && user && !canAccess) router.replace(isStaffRole(user.vai_tro) ? "/nhan-vien" : "/admin");
  }, [canAccess, loading, router, user, pathname]);

  if (loading || !user || !canAccess) {
    return <Loading fullscreen label="Đang xác thực..." />;
  }

  return children;
}

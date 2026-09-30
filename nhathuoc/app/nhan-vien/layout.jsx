"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Loading from "@/components/admin/Loading";
import { isAdminRole, isStaffRole } from "@/lib/constants";

export default function StaffLayout({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace("/login");
    else if (isAdminRole(user.vai_tro)) router.replace("/admin");
    else if (!isStaffRole(user.vai_tro)) router.replace("/login");
  }, [loading, router, user]);

  if (loading || !user || !isStaffRole(user.vai_tro)) {
    return <Loading fullscreen label="Đang xác thực quyền nhân viên..." />;
  }

  return children;
}
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Loading from "@/components/admin/Loading";
import { isCustomerRole } from "@/lib/constants";

export default function CustomerLayout({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  useEffect(() => { if (!loading && !user) router.replace("/login"); else if (!loading && user && !isCustomerRole(user.vai_tro)) router.replace("/"); }, [loading, router, user]);
  if (loading || !user || !isCustomerRole(user.vai_tro)) return <Loading fullscreen label="Đang xác thực tài khoản..." />;
  return children;
}
"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import AdminLayout from "@/components/admin/AdminLayout";
import ThuocListPage from "@/components/admin/ThuocListPage";
import Loading from "@/components/admin/Loading";

function ThuocPageInner() {
  const params = useSearchParams();
  const initialFilter = params.get("expiring") ? "expiring" : params.get("lowstock") ? "lowstock" : undefined;

  return (
    <AdminLayout title="Danh sách thuốc" subtitle="Toàn bộ thuốc trong hệ thống — thuốc thường và thuốc đơn đặt">
      <ThuocListPage detailMode="modal" initialFilter={initialFilter} />
    </AdminLayout>
  );
}

export default function ThuocPage() {
  return (
    <Suspense fallback={<Loading fullscreen />}>
      <ThuocPageInner />
    </Suspense>
  );
}

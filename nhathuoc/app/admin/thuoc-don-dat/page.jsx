"use client";

import AdminLayout from "@/components/admin/AdminLayout";
import ThuocListPage from "@/components/admin/ThuocListPage";
import { LOAI_THUOC } from "@/lib/constants";

export default function ThuocDonDatPage() {
  return (
    <AdminLayout
      title="Thuốc đơn đặt"
      subtitle="Thuốc cần xử lý qua đơn thuốc/đơn đặt — bắt buộc có thông tin đơn thuốc tương ứng"
    >
      <ThuocListPage
        lockLoaiThuoc={LOAI_THUOC.DON}
        detailMode="page"
        detailHrefBase="/admin/thuoc-don-dat"
        showPrescriptionColumn
      />
    </AdminLayout>
  );
}

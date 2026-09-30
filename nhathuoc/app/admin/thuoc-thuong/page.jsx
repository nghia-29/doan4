"use client";

import AdminLayout from "@/components/admin/AdminLayout";
import ThuocListPage from "@/components/admin/ThuocListPage";
import { LOAI_THUOC } from "@/lib/constants";

export default function ThuocThuongPage() {
  return (
    <AdminLayout
      title="Thuốc thường"
      subtitle="Các thuốc/sản phẩm có thể bán trực tiếp, không cần đơn thuốc"
    >
      <ThuocListPage lockLoaiThuoc={LOAI_THUOC.THUONG} detailMode="modal" />
    </AdminLayout>
  );
}

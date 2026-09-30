"use client";

import AdminLayout from "@/components/admin/AdminLayout";
import GenericCrudPage from "@/components/admin/GenericCrudPage";
import danhMucThuocService from "@/services/danhMucThuocService";
import { pickFirst } from "@/lib/format";

export default function DanhMucThuocPage() {
  return (
    <AdminLayout title="Danh mục thuốc" subtitle="Quản lý các nhóm/danh mục phân loại thuốc trong hệ thống">
      <GenericCrudPage
        service={danhMucThuocService}
        entityLabel="danh mục"
        searchKeys={["ten_danh_muc"]}
        searchPlaceholder="Tìm theo tên danh mục..."
        columns={[
          { key: "id", label: "Mã", width: 80, render: (r) => `#${r.id}` },
          { key: "ten_danh_muc", label: "Tên danh mục", render: (r) => <span className="fw-semibold">{pickFirst(r, ["ten_danh_muc"], "—")}</span> },
          { key: "mo_ta", label: "Mô tả", render: (r) => <span className="text-muted">{pickFirst(r, ["mo_ta"], "—")}</span> },
        ]}
        formFields={[
          { name: "ten_danh_muc", label: "Tên danh mục", required: true, col: "col-12" },
          { name: "mo_ta", label: "Mô tả", type: "textarea", col: "col-12" },
        ]}
      />
    </AdminLayout>
  );
}

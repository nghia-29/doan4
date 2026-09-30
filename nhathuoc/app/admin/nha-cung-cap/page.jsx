"use client";

import AdminLayout from "@/components/admin/AdminLayout";
import GenericCrudPage from "@/components/admin/GenericCrudPage";
import nhaCungCapService from "@/services/nhaCungCapService";
import { pickFirst } from "@/lib/format";

export default function NhaCungCapPage() {
  return (
    <AdminLayout title="Nhà cung cấp" subtitle="Danh sách các nhà cung cấp thuốc cho nhà thuốc">
      <GenericCrudPage
        service={nhaCungCapService}
        entityLabel="nhà cung cấp"
        searchKeys={["ten_nha_cung_cap", "so_dien_thoai", "email"]}
        searchPlaceholder="Tìm theo tên, SĐT, email..."
        columns={[
          { key: "id", label: "Mã", width: 80, render: (r) => `#${r.id}` },
          { key: "ten_nha_cung_cap", label: "Tên nhà cung cấp", render: (r) => <span className="fw-semibold">{pickFirst(r, ["ten_nha_cung_cap"], "—")}</span> },
          { key: "so_dien_thoai", label: "Số điện thoại", render: (r) => pickFirst(r, ["so_dien_thoai"], "—") },
          { key: "email", label: "Email", render: (r) => pickFirst(r, ["email"], "—") },
          { key: "dia_chi", label: "Địa chỉ", render: (r) => <span className="text-muted">{pickFirst(r, ["dia_chi"], "—")}</span> },
        ]}
        formFields={[
          { name: "ten_nha_cung_cap", label: "Tên nhà cung cấp", required: true, col: "col-12" },
          { name: "so_dien_thoai", label: "Số điện thoại" },
          { name: "email", label: "Email", type: "email" },
          { name: "dia_chi", label: "Địa chỉ", type: "textarea", col: "col-12" },
        ]}
      />
    </AdminLayout>
  );
}

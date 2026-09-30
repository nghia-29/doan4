"use client";

import AdminLayout from "@/components/admin/AdminLayout";
import GenericCrudPage from "@/components/admin/GenericCrudPage";
import nhanVienService from "@/services/nhanVienService";
import { pickFirst } from "@/lib/format";

export default function NhanVienPage() {
  return (
    <AdminLayout title="Nhân viên" subtitle="Quản lý nhân viên làm việc tại nhà thuốc">
      <GenericCrudPage
        service={nhanVienService}
        entityLabel="nhân viên"
        searchKeys={["ho_ten", "chuc_vu", "so_dien_thoai", "email"]}
        searchPlaceholder="Tìm theo tên, chức vụ, SĐT..."
        columns={[
          { key: "id", label: "Mã NV", width: 90, render: (r) => `#${r.id}` },
          { key: "ho_ten", label: "Họ tên", render: (r) => <span className="fw-semibold">{pickFirst(r, ["ho_ten"], "—")}</span> },
          { key: "chuc_vu", label: "Chức vụ", render: (r) => pickFirst(r, ["chuc_vu"], "—") },
          { key: "so_dien_thoai", label: "Số điện thoại", render: (r) => pickFirst(r, ["so_dien_thoai"], "—") },
          { key: "email", label: "Email", render: (r) => pickFirst(r, ["email"], "—") },
        ]}
        formFields={[
          { name: "ho_ten", label: "Họ tên", required: true, col: "col-12" },
          { name: "chuc_vu", label: "Chức vụ", placeholder: "VD: Thu ngân, Thủ kho..." },
          { name: "so_dien_thoai", label: "Số điện thoại" },
          { name: "email", label: "Email", type: "email" },
        ]}
      />
    </AdminLayout>
  );
}

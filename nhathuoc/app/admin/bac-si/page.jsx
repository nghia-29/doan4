"use client";

import { useRouter } from "next/navigation";
import AdminLayout from "@/components/admin/AdminLayout";
import GenericCrudPage from "@/components/admin/GenericCrudPage";
import StatusBadge from "@/components/admin/StatusBadge";
import bacSiService from "@/services/bacSiService";
import { pickFirst } from "@/lib/format";

export default function BacSiPage() {
  const router = useRouter();

  return (
    <AdminLayout title="Danh sách bác sĩ" subtitle="Quản lý thông tin bác sĩ hợp tác kê đơn với nhà thuốc">
      <GenericCrudPage
        service={bacSiService}
        entityLabel="bác sĩ"
        searchKeys={["ho_ten", "chuyen_khoa", "so_dien_thoai", "email"]}
        searchPlaceholder="Tìm theo tên, chuyên khoa, SĐT..."
        onRowClick={(row) => router.push(`/admin/bac-si/${row.id}`)}
        columns={[
          { key: "id", label: "Mã bác sĩ", width: 90, render: (r) => `#${r.id}` },
          { key: "ho_ten", label: "Họ tên", render: (r) => <span className="fw-semibold">{pickFirst(r, ["ho_ten"], "—")}</span> },
          { key: "chuyen_khoa", label: "Chuyên khoa", render: (r) => pickFirst(r, ["chuyen_khoa"], "—") },
          { key: "so_dien_thoai", label: "Số điện thoại", render: (r) => pickFirst(r, ["so_dien_thoai"], "—") },
          { key: "email", label: "Email", render: (r) => pickFirst(r, ["email"], "—") },
          {
            key: "trang_thai",
            label: "Trạng thái",
            render: (r) => {
              const active = String(pickFirst(r, ["trang_thai"], "HOAT_DONG")).toUpperCase() !== "KHOA";
              return <StatusBadge label={active ? "Đang hợp tác" : "Ngừng hợp tác"} color={active ? "success" : "secondary"} />;
            },
          },
        ]}
        formFields={[
          { name: "ho_ten", label: "Họ tên", required: true, col: "col-12" },
          { name: "chuyen_khoa", label: "Chuyên khoa", required: true },
          { name: "so_dien_thoai", label: "Số điện thoại" },
          { name: "email", label: "Email", type: "email" },
          {
            name: "trang_thai",
            label: "Trạng thái",
            type: "select",
            options: [
              { value: "HOAT_DONG", label: "Đang hợp tác" },
              { value: "KHOA", label: "Ngừng hợp tác" },
            ],
          },
        ]}
        renderRowActionsExtra={(row) => (
          <button
            className="btn btn-sm btn-outline-brand border"
            title="Xem đơn thuốc đã kê"
            onClick={() => router.push(`/admin/bac-si/${row.id}`)}
          >
            <i className="bi bi-eye" />
          </button>
        )}
      />
    </AdminLayout>
  );
}

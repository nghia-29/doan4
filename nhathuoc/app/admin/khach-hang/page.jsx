"use client";

import { useRouter } from "next/navigation";
import AdminLayout from "@/components/admin/AdminLayout";
import GenericCrudPage from "@/components/admin/GenericCrudPage";
import khachHangService from "@/services/khachHangService";
import { pickFirst } from "@/lib/format";

export default function KhachHangPage() {
  const router = useRouter();

  return (
    <AdminLayout title="Khách hàng" subtitle="Quản lý thông tin khách hàng của nhà thuốc">
      <GenericCrudPage
        service={khachHangService}
        entityLabel="khách hàng"
        searchKeys={["ho_ten", "so_dien_thoai", "email"]}
        searchPlaceholder="Tìm theo tên, SĐT, email..."
        onRowClick={(row) => router.push(`/admin/khach-hang/${row.id}`)}
        columns={[
          { key: "id", label: "Mã KH", width: 90, render: (r) => `#${r.id}` },
          { key: "ho_ten", label: "Họ tên", render: (r) => <span className="fw-semibold">{pickFirst(r, ["ho_ten"], "—")}</span> },
          { key: "so_dien_thoai", label: "Số điện thoại", render: (r) => pickFirst(r, ["so_dien_thoai"], "—") },
          { key: "email", label: "Email", render: (r) => pickFirst(r, ["email"], "—") },
          { key: "dia_chi", label: "Địa chỉ", render: (r) => <span className="text-muted">{pickFirst(r, ["dia_chi"], "—")}</span> },
        ]}
        formFields={[
          { name: "ho_ten", label: "Họ tên", required: true, col: "col-12" },
          { name: "so_dien_thoai", label: "Số điện thoại" },
          { name: "email", label: "Email", type: "email" },
          { name: "dia_chi", label: "Địa chỉ", type: "textarea", col: "col-12" },
        ]}
        renderRowActionsExtra={(row) => (
          <button
            className="btn btn-sm btn-outline-brand border"
            title="Xem lịch sử mua hàng"
            onClick={() => router.push(`/admin/khach-hang/${row.id}`)}
          >
            <i className="bi bi-clock-history" />
          </button>
        )}
      />
    </AdminLayout>
  );
}

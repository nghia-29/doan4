"use client";

import AdminLayout from "@/components/admin/AdminLayout";
import GenericCrudPage from "@/components/admin/GenericCrudPage";
import StatusBadge from "@/components/admin/StatusBadge";
import khuyenMaiService from "@/services/khuyenMaiService";
import { formatDate, pickFirst } from "@/lib/format";

export default function KhuyenMaiPage() {
  return (
    <AdminLayout title="Khuyến mãi" subtitle="Quản lý các chương trình khuyến mãi, giảm giá của nhà thuốc">
      <GenericCrudPage
        service={khuyenMaiService}
        entityLabel="khuyến mãi"
        searchKeys={["ten_khuyen_mai"]}
        searchPlaceholder="Tìm theo tên khuyến mãi..."
        columns={[
          { key: "id", label: "Mã", width: 80, render: (r) => `#${r.id}` },
          { key: "ten_khuyen_mai", label: "Tên khuyến mãi", render: (r) => <span className="fw-semibold">{pickFirst(r, ["ten_khuyen_mai"], "—")}</span> },
          { key: "phan_tram_giam", label: "Giảm giá", render: (r) => `${pickFirst(r, ["phan_tram_giam"], 0)}%` },
          { key: "ngay_bat_dau", label: "Bắt đầu", render: (r) => formatDate(pickFirst(r, ["ngay_bat_dau"], null)) },
          { key: "ngay_ket_thuc", label: "Kết thúc", render: (r) => formatDate(pickFirst(r, ["ngay_ket_thuc"], null)) },
          {
            key: "trang_thai",
            label: "Trạng thái",
            render: (r) => {
              const active = String(pickFirst(r, ["trang_thai"], "")).toUpperCase() !== "KET_THUC";
              return <StatusBadge label={active ? "Đang áp dụng" : "Đã kết thúc"} color={active ? "success" : "secondary"} />;
            },
          },
        ]}
        formFields={[
          { name: "ten_khuyen_mai", label: "Tên khuyến mãi", required: true, col: "col-12" },
          { name: "phan_tram_giam", label: "Phần trăm giảm (%)", type: "number" },
          { name: "ngay_bat_dau", label: "Ngày bắt đầu", type: "date" },
          { name: "ngay_ket_thuc", label: "Ngày kết thúc", type: "date" },
          {
            name: "trang_thai",
            label: "Trạng thái",
            type: "select",
            options: [
              { value: "DANG_AP_DUNG", label: "Đang áp dụng" },
              { value: "KET_THUC", label: "Đã kết thúc" },
            ],
          },
        ]}
      />
    </AdminLayout>
  );
}

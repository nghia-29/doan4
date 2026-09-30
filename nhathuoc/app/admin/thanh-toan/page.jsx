"use client";

import AdminLayout from "@/components/admin/AdminLayout";
import GenericCrudPage from "@/components/admin/GenericCrudPage";
import StatusBadge from "@/components/admin/StatusBadge";
import thanhToanService from "@/services/thanhToanService";
import { formatCurrency, formatDateTime, pickFirst } from "@/lib/format";

export default function ThanhToanPage() {
  return (
    <AdminLayout title="Thanh toán" subtitle="Danh sách giao dịch thanh toán cho các đơn đặt thuốc">
      <GenericCrudPage
        service={thanhToanService}
        entityLabel="giao dịch thanh toán"
        searchKeys={[]}
        columns={[
          { key: "id", label: "Mã GD", width: 90, render: (r) => `#${r.id}` },
          { key: "id_don_dat", label: "Đơn đặt", render: (r) => `#${pickFirst(r, ["id_don_dat"], "—")}` },
          { key: "phuong_thuc", label: "Phương thức", render: (r) => pickFirst(r, ["phuong_thuc"], "—") },
          { key: "so_tien", label: "Số tiền", render: (r) => <span className="fw-semibold">{formatCurrency(pickFirst(r, ["so_tien"], 0))}</span> },
          { key: "thoi_gian_thanh_toan", label: "Ngày thanh toán", render: (r) => formatDateTime(pickFirst(r, ["thoi_gian_thanh_toan"], null)) },
          {
            key: "trang_thai",
            label: "Trạng thái",
            render: (r) => {
              const ok = String(pickFirst(r, ["trang_thai"], "")).toUpperCase().includes("THANH_CONG") || String(pickFirst(r, ["trang_thai"], "")).toUpperCase() === "DA_THANH_TOAN";
              return <StatusBadge label={pickFirst(r, ["trang_thai"], "Chờ xử lý")} color={ok ? "success" : "secondary"} />;
            },
          },
        ]}
        formFields={[
          { name: "id_don_dat", label: "Mã đơn đặt thuốc", required: true, type: "number" },
          {
            name: "phuong_thuc",
            label: "Phương thức thanh toán",
            type: "select",
            options: [
              { value: "TIEN_MAT", label: "Tiền mặt" },
              { value: "CHUYEN_KHOAN", label: "Chuyển khoản" },
              { value: "VI_DIEN_TU", label: "Ví điện tử" },
            ],
          },
          { name: "so_tien", label: "Số tiền", type: "number" },
          { name: "ma_giao_dich", label: "Mã giao dịch" },
          { name: "thoi_gian_thanh_toan", label: "Thời gian thanh toán", type: "datetime-local" },
          {
            name: "trang_thai",
            label: "Trạng thái",
            type: "select",
            options: [
              { value: "DA_THANH_TOAN", label: "Đã thanh toán" },
              { value: "CHO_XU_LY", label: "Chờ xử lý" },
              { value: "THAT_BAI", label: "Thất bại" },
            ],
          },
        ]}
      />
    </AdminLayout>
  );
}

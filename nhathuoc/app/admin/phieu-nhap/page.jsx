"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "@/components/admin/AdminLayout";
import GenericCrudPage from "@/components/admin/GenericCrudPage";
import StatusBadge from "@/components/admin/StatusBadge";
import phieuNhapService from "@/services/phieuNhapService";
import nhaCungCapService from "@/services/nhaCungCapService";
import nhanVienService from "@/services/nhanVienService";
import { formatCurrency, formatDate, pickFirst } from "@/lib/format";
import { getPhieuNhapTrangThaiMeta, PHIEU_NHAP_TRANG_THAI } from "@/lib/constants";

export default function PhieuNhapPage() {
  const router = useRouter();
  const [nccList, setNccList] = useState([]);
  const [nvList, setNvList] = useState([]);

  useEffect(() => {
    nhaCungCapService.getAll().then(setNccList).catch(() => {});
    nhanVienService.getAll().then(setNvList).catch(() => {});
  }, []);

  const nccMap = useMemo(() => {
    const m = {};
    nccList.forEach((n) => (m[n.id] = pickFirst(n, ["ten_nha_cung_cap"], `#${n.id}`)));
    return m;
  }, [nccList]);

  const nvMap = useMemo(() => {
    const m = {};
    nvList.forEach((n) => (m[n.id] = pickFirst(n, ["ho_ten"], `#${n.id}`)));
    return m;
  }, [nvList]);

  return (
    <AdminLayout title="Phiếu nhập thuốc" subtitle="Quản lý các phiếu nhập hàng từ nhà cung cấp vào kho">
      <GenericCrudPage
        service={phieuNhapService}
        entityLabel="phiếu nhập"
        searchKeys={[]}
        onRowClick={(row) => router.push(`/admin/phieu-nhap/${row.id}`)}
        columns={[
          { key: "id", label: "Mã phiếu nhập", width: 120, render: (r) => `#${r.id}` },
          { key: "id_nha_cung_cap", label: "Nhà cung cấp", render: (r) => nccMap[pickFirst(r, ["id_nha_cung_cap"], "")] || "—" },
          { key: "id_nhan_vien", label: "Nhân viên nhập", render: (r) => nvMap[pickFirst(r, ["id_nhan_vien"], "")] || "—" },
          { key: "ngay_nhap", label: "Ngày nhập", render: (r) => formatDate(pickFirst(r, ["ngay_nhap", "created_at"], null)) },
          { key: "tong_tien", label: "Tổng tiền", render: (r) => <span className="fw-semibold">{formatCurrency(pickFirst(r, ["tong_tien"], 0))}</span> },
        ]}
        formFields={[
          {
            name: "id_nha_cung_cap",
            label: "Nhà cung cấp",
            type: "select",
            required: true,
            options: nccList.map((n) => ({ value: n.id, label: pickFirst(n, ["ten_nha_cung_cap"], `#${n.id}`) })),
          },
          {
            name: "id_nhan_vien",
            label: "Nhân viên nhập",
            type: "select",
            options: nvList.map((n) => ({ value: n.id, label: pickFirst(n, ["ho_ten"], `#${n.id}`) })),
          },
          { name: "ngay_nhap", label: "Ngày nhập", type: "date" },
          { name: "tong_tien", label: "Tổng tiền", type: "number" },
          { name: "ghi_chu", label: "Ghi chú", type: "textarea", col: "col-12" },
        ]}
      />
    </AdminLayout>
  );
}

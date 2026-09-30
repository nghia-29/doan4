"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "@/components/admin/AdminLayout";
import GenericCrudPage from "@/components/admin/GenericCrudPage";
import StatusBadge from "@/components/admin/StatusBadge";
import { FilterSelect } from "@/components/admin/SearchBar";
import donDatThuocService from "@/services/donDatThuocService";
import khachHangService from "@/services/khachHangService";
import { formatCurrency, formatDate, pickFirst } from "@/lib/format";
import { DON_DAT_TRANG_THAI, getDonDatTrangThaiMeta } from "@/lib/constants";

export default function DonDatThuocPage() {
  const router = useRouter();
  const [khachHangList, setKhachHangList] = useState([]);
  const [filterStatus, setFilterStatus] = useState("");

  useEffect(() => {
    khachHangService.getAll().then(setKhachHangList).catch(() => {});
  }, []);

  const khMap = useMemo(() => {
    const m = {};
    khachHangList.forEach((k) => (m[k.id] = pickFirst(k, ["ho_ten"], `#${k.id}`)));
    return m;
  }, [khachHangList]);

  return (
    <AdminLayout title="Đơn đặt thuốc" subtitle="Theo dõi và xử lý đơn đặt thuốc của khách hàng theo từng trạng thái">
      <GenericCrudPage
        service={donDatThuocService}
        entityLabel="đơn đặt thuốc"
        searchKeys={[]}
        onRowClick={(row) => router.push(`/admin/don-dat-thuoc/${row.id}`)}
        filterPredicate={(row) => !filterStatus || pickFirst(row, ["trang_thai"], "") === filterStatus}
        extraToolbar={
          <FilterSelect
            value={filterStatus}
            onChange={setFilterStatus}
            options={[{ value: "", label: "Tất cả trạng thái" }, ...DON_DAT_TRANG_THAI.map((t) => ({ value: t.value, label: t.label }))]}
          />
        }
        columns={[
          { key: "id", label: "Mã đơn", width: 90, render: (r) => `#${r.id}` },
          { key: "id_khach_hang", label: "Khách hàng", render: (r) => khMap[pickFirst(r, ["id_khach_hang"], "")] || "—" },
          { key: "ngay_dat", label: "Ngày đặt", render: (r) => formatDate(pickFirst(r, ["ngay_dat", "created_at"], null)) },
          { key: "tong_tien", label: "Tổng tiền", render: (r) => <span className="fw-semibold">{formatCurrency(pickFirst(r, ["tong_tien"], 0))}</span> },
          {
            key: "trang_thai",
            label: "Trạng thái",
            render: (r) => {
              const meta = getDonDatTrangThaiMeta(pickFirst(r, ["trang_thai"], ""));
              return <StatusBadge label={meta.label} color={meta.color} icon={meta.icon} />;
            },
          },
        ]}
        formFields={[
          {
            name: "id_khach_hang",
            label: "Khách hàng",
            type: "select",
            required: true,
            col: "col-12",
            options: khachHangList.map((k) => ({ value: k.id, label: pickFirst(k, ["ho_ten"], `#${k.id}`) })),
          },
          { name: "ngay_dat", label: "Ngày đặt", type: "date" },
          { name: "tong_tien", label: "Tổng tiền", type: "number" },
          {
            name: "trang_thai",
            label: "Trạng thái",
            type: "select",
            options: DON_DAT_TRANG_THAI.map((t) => ({ value: t.value, label: t.label })),
          },
        ]}
      />
    </AdminLayout>
  );
}

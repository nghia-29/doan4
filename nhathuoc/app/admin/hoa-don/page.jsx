"use client";

import { useEffect, useMemo, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import GenericCrudPage from "@/components/admin/GenericCrudPage";
import khachHangService from "@/services/khachHangService";
import nhanVienService from "@/services/nhanVienService";
import { formatCurrency, formatDate, pickFirst } from "@/lib/format";
import hoaDonService from "@/services/hoaDonService";

export default function HoaDonPage() {
  const [khachHangList, setKhachHangList] = useState([]);
  const [nhanVienList, setNhanVienList] = useState([]);

  useEffect(() => {
    khachHangService.getAll().then(setKhachHangList).catch(() => {});
    nhanVienService.getAll().then(setNhanVienList).catch(() => {});
  }, []);

  const khMap = useMemo(() => {
    const m = {};
    khachHangList.forEach((k) => (m[k.id] = pickFirst(k, ["ho_ten"], `#${k.id}`)));
    return m;
  }, [khachHangList]);

  const nvMap = useMemo(() => {
    const m = {};
    nhanVienList.forEach((n) => (m[n.id] = pickFirst(n, ["ho_ten"], `#${n.id}`)));
    return m;
  }, [nhanVienList]);

  return (
    <AdminLayout title="Hóa đơn" subtitle="Danh sách hóa đơn bán hàng đã lập">
      <GenericCrudPage
        service={hoaDonService}
        entityLabel="hóa đơn"
        searchKeys={["so_hoa_don"]}
        columns={[
          { key: "so_hoa_don", label: "Số hóa đơn", width: 140, render: (r) => pickFirst(r, ["so_hoa_don"], `#${r.id}`) },
          { key: "id_don_dat", label: "Đơn đặt", render: (r) => `#${pickFirst(r, ["id_don_dat"], "—")}` },
          { key: "ngay_xuat", label: "Ngày xuất", render: (r) => formatDate(pickFirst(r, ["ngay_xuat"], null)) },
          { key: "tong_tien_sau_thue", label: "Tổng tiền", render: (r) => <span className="fw-semibold">{formatCurrency(pickFirst(r, ["tong_tien_sau_thue"], 0))}</span> },
        ]}
        formFields={[
          { name: "id_don_dat", label: "Mã đơn đặt thuốc", type: "number", required: true },
          { name: "so_hoa_don", label: "Số hóa đơn", required: true },
          { name: "ngay_xuat", label: "Ngày xuất", type: "datetime-local" },
          { name: "tong_tien_truoc_thue", label: "Tổng tiền trước thuế", type: "number" },
          { name: "thue_vat", label: "Thuế VAT", type: "number" },
          { name: "tong_tien_sau_thue", label: "Tổng tiền sau thuế", type: "number" },
        ]}
      />
    </AdminLayout>
  );
}

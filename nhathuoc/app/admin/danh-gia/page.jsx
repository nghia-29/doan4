"use client";

import { useEffect, useMemo, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import GenericCrudPage from "@/components/admin/GenericCrudPage";
import danhGiaService from "@/services/danhGiaService";
import khachHangService from "@/services/khachHangService";
import thuocService from "@/services/thuocService";
import { formatDate, pickFirst } from "@/lib/format";

function Stars({ value }) {
  const n = Number(value) || 0;
  return (
    <span className="text-warning">
      {Array.from({ length: 5 }).map((_, i) => (
        <i key={i} className={`bi ${i < n ? "bi-star-fill" : "bi-star"}`} />
      ))}
    </span>
  );
}

export default function DanhGiaPage() {
  const [khachHangList, setKhachHangList] = useState([]);
  const [thuocList, setThuocList] = useState([]);

  useEffect(() => {
    khachHangService.getAll().then(setKhachHangList).catch(() => {});
    thuocService.getAll().then(setThuocList).catch(() => {});
  }, []);

  const khMap = useMemo(() => {
    const m = {};
    khachHangList.forEach((k) => (m[k.id] = pickFirst(k, ["ho_ten"], `#${k.id}`)));
    return m;
  }, [khachHangList]);

  const thuocMap = useMemo(() => {
    const m = {};
    thuocList.forEach((t) => (m[t.id] = pickFirst(t, ["ten_thuoc"], `#${t.id}`)));
    return m;
  }, [thuocList]);

  return (
    <AdminLayout title="Đánh giá" subtitle="Đánh giá của khách hàng về các sản phẩm thuốc">
      <GenericCrudPage
        service={danhGiaService}
        entityLabel="đánh giá"
        searchKeys={[]}
        columns={[
          { key: "id_khach_hang", label: "Khách hàng", render: (r) => khMap[pickFirst(r, ["id_khach_hang"], "")] || "—" },
          { key: "id_thuoc", label: "Thuốc", render: (r) => thuocMap[pickFirst(r, ["id_thuoc"], "")] || "—" },
          { key: "so_sao", label: "Đánh giá", render: (r) => <Stars value={pickFirst(r, ["so_sao"], 0)} /> },
          { key: "noi_dung", label: "Nội dung", render: (r) => <span className="text-muted">{pickFirst(r, ["noi_dung"], "—")}</span> },
          { key: "ngay_danh_gia", label: "Ngày đánh giá", render: (r) => formatDate(pickFirst(r, ["ngay_danh_gia", "created_at"], null)) },
        ]}
        formFields={[
          {
            name: "id_khach_hang",
            label: "Khách hàng",
            type: "select",
            required: true,
            options: khachHangList.map((k) => ({ value: k.id, label: pickFirst(k, ["ho_ten"], `#${k.id}`) })),
          },
          {
            name: "id_thuoc",
            label: "Thuốc",
            type: "select",
            required: true,
            options: thuocList.map((t) => ({ value: t.id, label: pickFirst(t, ["ten_thuoc"], `#${t.id}`) })),
          },
          {
            name: "so_sao",
            label: "Số sao",
            type: "select",
            options: [1, 2, 3, 4, 5].map((n) => ({ value: n, label: `${n} sao` })),
          },
          { name: "noi_dung", label: "Nội dung đánh giá", type: "textarea", col: "col-12" },
        ]}
      />
    </AdminLayout>
  );
}

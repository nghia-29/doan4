"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "@/components/admin/AdminLayout";
import GenericCrudPage from "@/components/admin/GenericCrudPage";
import donThuocService from "@/services/donThuocService";
import khachHangService from "@/services/khachHangService";
import bacSiService from "@/services/bacSiService";
import chiTietDonThuocService from "@/services/chiTietDonThuocService";
import { formatDate, pickFirst } from "@/lib/format";

export default function DonThuocPage() {
  const router = useRouter();
  const [khachHangList, setKhachHangList] = useState([]);
  const [bacSiList, setBacSiList] = useState([]);
  const [chiTietAll, setChiTietAll] = useState([]);

  useEffect(() => {
    khachHangService.getAll().then(setKhachHangList).catch(() => {});
    bacSiService.getAll().then(setBacSiList).catch(() => {});
    chiTietDonThuocService.getAll().then(setChiTietAll).catch(() => {});
  }, []);

  const khMap = useMemo(() => {
    const m = {};
    khachHangList.forEach((k) => (m[k.id] = pickFirst(k, ["ho_ten"], `#${k.id}`)));
    return m;
  }, [khachHangList]);

  const bsMap = useMemo(() => {
    const m = {};
    bacSiList.forEach((b) => (m[b.id] = pickFirst(b, ["ho_ten"], `#${b.id}`)));
    return m;
  }, [bacSiList]);

  const soThuocMap = useMemo(() => {
    const m = {};
    chiTietAll.forEach((ct) => {
      const key = pickFirst(ct, ["id_don_thuoc"], null);
      if (key === null) return;
      m[key] = (m[key] || 0) + 1;
    });
    return m;
  }, [chiTietAll]);

  return (
    <AdminLayout title="Đơn thuốc (kê đơn)" subtitle="Danh sách đơn thuốc do bác sĩ kê cho khách hàng">
      <GenericCrudPage
        service={donThuocService}
        entityLabel="đơn thuốc"
        searchKeys={[]}
        onRowClick={(row) => router.push(`/admin/don-thuoc/${row.id}`)}
        columns={[
          { key: "id", label: "Mã đơn thuốc", width: 110, render: (r) => `#${r.id}` },
          { key: "id_khach_hang", label: "Khách hàng", render: (r) => khMap[pickFirst(r, ["id_khach_hang"], "")] || "—" },
          { key: "id_bac_si", label: "Bác sĩ", render: (r) => bsMap[pickFirst(r, ["id_bac_si"], "")] || "—" },
          { key: "ngay_ke_don", label: "Ngày kê", render: (r) => formatDate(pickFirst(r, ["ngay_ke_don", "ngay_tao"], null)) },
          { key: "so_thuoc", label: "Số thuốc", render: (r) => soThuocMap[r.id] || 0 },
          { key: "trang_thai", label: "Trạng thái", render: (r) => pickFirst(r, ["trang_thai"], "cho_duyet") },
        ]}
        formFields={[
          {
            name: "id_khach_hang",
            label: "Khách hàng",
            type: "select",
            required: true,
            col: "col-12 col-md-6",
            options: khachHangList.map((k) => ({ value: k.id, label: pickFirst(k, ["ho_ten"], `#${k.id}`) })),
          },
          {
            name: "id_bac_si",
            label: "Bác sĩ kê đơn",
            type: "select",
            required: true,
            col: "col-12 col-md-6",
            options: bacSiList.map((b) => ({ value: b.id, label: pickFirst(b, ["ho_ten"], `#${b.id}`) })),
          },
          { name: "ngay_ke_don", label: "Ngày kê đơn", type: "date", col: "col-12 col-md-6" },
          {
            name: "trang_thai",
            label: "Trạng thái",
            type: "select",
            col: "col-12 col-md-6",
            options: [
              { value: "cho_duyet", label: "Chờ duyệt" },
              { value: "da_duyet", label: "Đã duyệt" },
              { value: "tu_choi", label: "Từ chối" },
            ],
          },
          { name: "ghi_chu_duyet", label: "Ghi chú duyệt", type: "textarea", col: "col-12" },
        ]}
      />
    </AdminLayout>
  );
}

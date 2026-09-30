"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AdminLayout from "@/components/admin/AdminLayout";
import Loading from "@/components/admin/Loading";
import { ErrorState, EmptyState } from "@/components/admin/StateViews";
import StatusBadge from "@/components/admin/StatusBadge";
import bacSiService from "@/services/bacSiService";
import donThuocService from "@/services/donThuocService";
import khachHangService from "@/services/khachHangService";
import { formatDate, pickFirst } from "@/lib/format";

export default function BacSiDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bacSi, setBacSi] = useState(null);
  const [donThuocList, setDonThuocList] = useState([]);
  const [khachHangMap, setKhachHangMap] = useState({});

  useEffect(() => {
    let alive = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [bs, donAll, khAll] = await Promise.all([
          bacSiService.getById(id),
          donThuocService.getAll().catch(() => []),
          khachHangService.getAll().catch(() => []),
        ]);
        if (!alive) return;
        if (!bs) {
          setError("Không tìm thấy bác sĩ này.");
          return;
        }
        setBacSi(bs);
        const map = {};
        (khAll || []).forEach((k) => (map[k.id] = pickFirst(k, ["ho_ten"], `#${k.id}`)));
        setKhachHangMap(map);
        setDonThuocList((donAll || []).filter((d) => String(pickFirst(d, ["id_bac_si"], "")) === String(id)));
      } catch (err) {
        if (alive) setError(err?.message || "Không thể tải thông tin bác sĩ.");
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    return () => {
      alive = false;
    };
  }, [id]);

  return (
    <AdminLayout
      title={bacSi ? `BS. ${pickFirst(bacSi, ["ho_ten"], "")}` : "Chi tiết bác sĩ"}
      subtitle="Thông tin bác sĩ và các đơn thuốc đã kê"
      actions={
        <button className="btn btn-outline-brand border" onClick={() => router.push("/admin/bac-si")}>
          <i className="bi bi-arrow-left me-1" /> Quay lại danh sách
        </button>
      }
    >
      {loading ? (
        <Loading label="Đang tải thông tin bác sĩ..." />
      ) : error ? (
        <ErrorState message={error} />
      ) : (
        <div className="row g-3">
          <div className="col-lg-4">
            <div className="pm-card p-4 text-center">
              <div
                className="mx-auto mb-3 rounded-circle d-flex align-items-center justify-content-center"
                style={{ width: 84, height: 84, background: "#e3f5f2", fontSize: "2rem" }}
              >
                <i className="bi bi-person-badge text-brand" />
              </div>
              <h5 className="fw-bold mb-0">{pickFirst(bacSi, ["ho_ten"], "")}</h5>
              <p className="text-muted small mb-3">{pickFirst(bacSi, ["chuyen_khoa"], "Chưa cập nhật chuyên khoa")}</p>
              <table className="table table-sm text-start mb-0">
                <tbody>
                  <tr><th className="text-muted fw-normal">Mã bác sĩ</th><td>#{bacSi?.id}</td></tr>
                  <tr><th className="text-muted fw-normal">Điện thoại</th><td>{pickFirst(bacSi, ["so_dien_thoai"], "—")}</td></tr>
                  <tr><th className="text-muted fw-normal">Email</th><td>{pickFirst(bacSi, ["email"], "—")}</td></tr>
                  <tr>
                    <th className="text-muted fw-normal">Trạng thái</th>
                    <td>
                      <StatusBadge
                        label={String(pickFirst(bacSi, ["trang_thai"], "HOAT_DONG")).toUpperCase() === "KHOA" ? "Ngừng hợp tác" : "Đang hợp tác"}
                        color={String(pickFirst(bacSi, ["trang_thai"], "HOAT_DONG")).toUpperCase() === "KHOA" ? "secondary" : "success"}
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="col-lg-8">
            <div className="pm-card p-3">
              <h6 className="fw-bold mb-3" style={{ color: "#123934" }}>
                <i className="bi bi-file-medical me-2 text-brand" />
                Đơn thuốc do bác sĩ kê ({donThuocList.length})
              </h6>
              {donThuocList.length === 0 ? (
                <EmptyState title="Chưa có đơn thuốc nào" desc="Bác sĩ này chưa kê đơn thuốc nào trong hệ thống." />
              ) : (
                <div className="table-responsive">
                  <table className="table pm-table align-middle mb-0">
                    <thead>
                      <tr>
                        <th>Mã đơn</th>
                        <th>Khách hàng</th>
                        <th>Ngày kê</th>
                        <th>Ghi chú</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {donThuocList.map((d) => (
                        <tr key={d.id} style={{ cursor: "pointer" }} onClick={() => router.push(`/admin/don-thuoc/${d.id}`)}>
                          <td className="fw-semibold">#{d.id}</td>
                          <td>{khachHangMap[pickFirst(d, ["id_khach_hang"], "")] || "—"}</td>
                          <td>{formatDate(pickFirst(d, ["ngay_ke", "ngay_tao"], null))}</td>
                          <td className="text-muted">{pickFirst(d, ["ghi_chu"], "—")}</td>
                          <td className="text-end"><i className="bi bi-chevron-right text-muted" /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AdminLayout from "@/components/admin/AdminLayout";
import Loading from "@/components/admin/Loading";
import { ErrorState, EmptyState } from "@/components/admin/StateViews";
import donThuocService from "@/services/donThuocService";
import khachHangService from "@/services/khachHangService";
import bacSiService from "@/services/bacSiService";
import chiTietDonThuocService from "@/services/chiTietDonThuocService";
import thuocService from "@/services/thuocService";
import { formatDate, pickFirst } from "@/lib/format";

export default function DonThuocDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [donThuoc, setDonThuoc] = useState(null);
  const [khachHang, setKhachHang] = useState(null);
  const [bacSi, setBacSi] = useState(null);
  const [chiTietList, setChiTietList] = useState([]);
  const [thuocMap, setThuocMap] = useState({});

  useEffect(() => {
    let alive = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const don = await donThuocService.getById(id);
        if (!don) {
          if (alive) setError("Không tìm thấy đơn thuốc này.");
          return;
        }
        const [kh, bs, chiTietAll, thuocAll] = await Promise.all([
          khachHangService.getById(pickFirst(don, ["id_khach_hang"], "")).catch(() => null),
          bacSiService.getById(pickFirst(don, ["id_bac_si"], "")).catch(() => null),
          chiTietDonThuocService.getAll().catch(() => []),
          thuocService.getAll().catch(() => []),
        ]);
        if (!alive) return;
        setDonThuoc(don);
        setKhachHang(kh);
        setBacSi(bs);
        const tMap = {};
        (thuocAll || []).forEach((t) => (tMap[t.id] = t));
        setThuocMap(tMap);
        setChiTietList((chiTietAll || []).filter((c) => String(pickFirst(c, ["id_don_thuoc"], "")) === String(id)));
      } catch (err) {
        if (alive) setError(err?.message || "Không thể tải chi tiết đơn thuốc.");
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
      title={`Đơn thuốc #${id}`}
      subtitle="Chi tiết đơn thuốc do bác sĩ kê"
      actions={
        <button className="btn btn-outline-brand border" onClick={() => router.push("/admin/don-thuoc")}>
          <i className="bi bi-arrow-left me-1" /> Quay lại danh sách
        </button>
      }
    >
      {loading ? (
        <Loading label="Đang tải chi tiết đơn thuốc..." />
      ) : error ? (
        <ErrorState message={error} />
      ) : (
        <div className="row g-3">
          <div className="col-lg-4">
            <div className="pm-card p-3 mb-3">
              <h6 className="fw-bold text-brand mb-2"><i className="bi bi-person me-1" /> Khách hàng</h6>
              {khachHang ? (
                <table className="table table-sm mb-0">
                  <tbody>
                    <tr><th className="text-muted fw-normal" style={{ width: 110 }}>Họ tên</th><td className="fw-semibold">{pickFirst(khachHang, ["ho_ten"], "—")}</td></tr>
                    <tr><th className="text-muted fw-normal">Điện thoại</th><td>{pickFirst(khachHang, ["so_dien_thoai"], "—")}</td></tr>
                    <tr><th className="text-muted fw-normal">Địa chỉ</th><td>{pickFirst(khachHang, ["dia_chi"], "—")}</td></tr>
                  </tbody>
                </table>
              ) : (
                <p className="text-muted small mb-0">Không có thông tin khách hàng.</p>
              )}
            </div>

            <div className="pm-card p-3 mb-3">
              <h6 className="fw-bold text-brand mb-2"><i className="bi bi-person-badge me-1" /> Bác sĩ kê đơn</h6>
              {bacSi ? (
                <table className="table table-sm mb-0">
                  <tbody>
                    <tr><th className="text-muted fw-normal" style={{ width: 110 }}>Họ tên</th><td className="fw-semibold">{pickFirst(bacSi, ["ho_ten"], "—")}</td></tr>
                    <tr><th className="text-muted fw-normal">Chuyên khoa</th><td>{pickFirst(bacSi, ["chuyen_khoa"], "—")}</td></tr>
                    <tr><th className="text-muted fw-normal">Điện thoại</th><td>{pickFirst(bacSi, ["so_dien_thoai"], "—")}</td></tr>
                  </tbody>
                </table>
              ) : (
                <p className="text-muted small mb-0">Không có thông tin bác sĩ.</p>
              )}
            </div>

            <div className="pm-card p-3">
              <h6 className="fw-bold text-brand mb-2"><i className="bi bi-calendar-event me-1" /> Thông tin đơn</h6>
              <table className="table table-sm mb-0">
                <tbody>
                  <tr><th className="text-muted fw-normal" style={{ width: 110 }}>Ngày kê</th><td>{formatDate(pickFirst(donThuoc, ["ngay_ke_don", "ngay_tao"], null))}</td></tr>
                  <tr><th className="text-muted fw-normal">Trạng thái</th><td>{pickFirst(donThuoc, ["trang_thai"], "—")}</td></tr>
                  <tr><th className="text-muted fw-normal">Ghi chú duyệt</th><td>{pickFirst(donThuoc, ["ghi_chu_duyet"], "—")}</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="col-lg-8">
            <div className="pm-card p-3">
              <h6 className="fw-bold mb-3" style={{ color: "#123934" }}>
                <i className="bi bi-capsule me-2 text-brand" />
                Danh sách thuốc được kê ({chiTietList.length})
              </h6>
              {chiTietList.length === 0 ? (
                <EmptyState title="Chưa có thuốc nào trong đơn" />
              ) : (
                <div className="table-responsive">
                  <table className="table pm-table align-middle mb-0">
                    <thead>
                      <tr>
                        <th>Tên thuốc</th>
                        <th>Số lượng</th>
                        <th>Liều dùng</th>
                        <th>Hướng dẫn sử dụng</th>
                      </tr>
                    </thead>
                    <tbody>
                      {chiTietList.map((c, idx) => {
                        const t = thuocMap[pickFirst(c, ["id_thuoc"], "")];
                        return (
                          <tr key={idx}>
                            <td className="fw-semibold">{t ? pickFirst(t, ["ten_thuoc"], "") : `#${pickFirst(c, ["id_thuoc"], "—")}`}</td>
                            <td>{pickFirst(c, ["so_luong_ke"], "—")}</td>
                            <td>{pickFirst(c, ["lieu_dung"], "—")}</td>
                            <td className="text-muted">{pickFirst(c, ["so_ngay_dung"], "—")} ngày</td>
                          </tr>
                        );
                      })}
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

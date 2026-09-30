"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AdminLayout from "@/components/admin/AdminLayout";
import Loading from "@/components/admin/Loading";
import { ErrorState, EmptyState } from "@/components/admin/StateViews";
import StatusBadge from "@/components/admin/StatusBadge";
import thuocService from "@/services/thuocService";
import danhMucThuocService from "@/services/danhMucThuocService";
import vThuocKeDonService from "@/services/vThuocKeDonService";
import { loadThuocDetail } from "@/lib/thuocHelpers";
import { formatCurrency, formatDate, pickFirst } from "@/lib/format";
import { getDonDatTrangThaiMeta } from "@/lib/constants";

export default function ThuocDonDatDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [thuoc, setThuoc] = useState(null);
  const [moTa, setMoTa] = useState(null);
  const [anhList, setAnhList] = useState([]);
  const [danhMucName, setDanhMucName] = useState("");
  const [keDonRows, setKeDonRows] = useState([]);

  useEffect(() => {
    let alive = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [t, detail, keDonAll, danhMucAll] = await Promise.all([
          thuocService.getById(id),
          loadThuocDetail(id),
          vThuocKeDonService.getAll().catch(() => []),
          danhMucThuocService.getAll().catch(() => []),
        ]);
        if (!alive) return;
        if (!t || t.length === 0) {
          setError("Không tìm thấy thuốc này.");
          return;
        }
        setThuoc(t);
        setMoTa(detail.moTa);
        setAnhList(detail.anhList);
        const dm = (danhMucAll || []).find((d) => String(d.id) === String(pickFirst(t, ["id_danh_muc"], "")));
        setDanhMucName(dm ? pickFirst(dm, ["ten_danh_muc"], "") : "");
        const rows = (keDonAll || []).filter((r) => String(pickFirst(r, ["id_thuoc"], "")) === String(id));
        setKeDonRows(rows);
      } catch (err) {
        if (alive) setError(err?.message || "Không thể tải chi tiết thuốc đơn đặt.");
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
      title={`Chi tiết thuốc đơn đặt${thuoc ? `: ${pickFirst(thuoc, ["ten_thuoc"], "")}` : ""}`}
      subtitle="Thông tin thuốc, bác sĩ kê đơn, đơn thuốc và khách hàng liên quan"
      actions={
        <button className="btn btn-outline-brand border" onClick={() => router.push("/admin/thuoc-don-dat")}>
          <i className="bi bi-arrow-left me-1" /> Quay lại danh sách
        </button>
      }
    >
      {loading ? (
        <Loading label="Đang tải chi tiết thuốc..." />
      ) : error ? (
        <ErrorState message={error} />
      ) : (
        <div className="row g-3">
          <div className="col-lg-4">
            <div className="pm-card p-3 mb-3">
              {anhList?.[0] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={pickFirst(anhList[0], ["duong_dan_anh", "hinh_anh"], "")}
                  alt=""
                  className="rounded w-100 mb-3 border"
                  style={{ height: 180, objectFit: "cover" }}
                  onError={(e) => (e.currentTarget.style.display = "none")}
                />
              ) : (
                <div className="rounded border bg-light d-flex align-items-center justify-content-center w-100 mb-3" style={{ height: 180 }}>
                  <i className="bi bi-file-earmark-medical fs-1 text-muted" />
                </div>
              )}
              <h5 className="fw-bold mb-1">{pickFirst(thuoc, ["ten_thuoc"], "")}</h5>
              <StatusBadge label="Thuốc đơn đặt" color="info" icon="bi-file-earmark-medical" />
              <table className="table table-sm mt-3 mb-0">
                <tbody>
                  <tr><th className="text-muted fw-normal">Mã thuốc</th><td>#{thuoc?.id}</td></tr>
                  <tr><th className="text-muted fw-normal">Danh mục</th><td>{danhMucName || "—"}</td></tr>
                  <tr><th className="text-muted fw-normal">Giá bán</th><td className="fw-semibold">{formatCurrency(pickFirst(thuoc, ["gia_ban"], 0))}</td></tr>
                  <tr><th className="text-muted fw-normal">Tồn kho</th><td>{pickFirst(thuoc, ["so_luong"], 0)} {pickFirst(thuoc, ["don_vi_tinh"], "")}</td></tr>
                  <tr><th className="text-muted fw-normal">Hạn sử dụng</th><td>{formatDate(pickFirst(thuoc, ["han_su_dung"], null))}</td></tr>
                </tbody>
              </table>
            </div>

            {moTa && (
              <div className="pm-card p-3">
                <h6 className="fw-bold text-brand mb-2">Mô tả</h6>
                <p className="small mb-2"><strong>Công dụng:</strong> {moTa.cong_dung || "—"}</p>
                <p className="small mb-2"><strong>Cảnh báo:</strong> {moTa.canh_bao || "—"}</p>
                <p className="small mb-0"><strong>Hướng dẫn sử dụng:</strong> {moTa.huong_dan_su_dung || "—"}</p>
              </div>
            )}
          </div>

          <div className="col-lg-8">
            <div className="pm-card p-3">
              <h6 className="fw-bold mb-3" style={{ color: "#123934" }}>
                <i className="bi bi-file-medical me-2 text-brand" />
                Đơn thuốc &amp; bác sĩ kê đơn liên quan
              </h6>

              {keDonRows.length === 0 ? (
                <EmptyState
                  title="Chưa có đơn thuốc nào kê thuốc này"
                  desc="Dữ liệu lấy từ view v_thuoc_ke_don — hiện chưa có bản ghi liên kết."
                  icon="bi-file-earmark-x"
                />
              ) : (
                <div className="table-responsive">
                  <table className="table pm-table align-middle mb-0">
                    <thead>
                      <tr>
                        <th>Đơn thuốc</th>
                        <th>Bác sĩ kê đơn</th>
                        <th>Khách hàng</th>
                        <th>Số lượng kê</th>
                        <th>Liều dùng</th>
                        <th>Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody>
                      {keDonRows.map((r, idx) => {
                        const meta = getDonDatTrangThaiMeta(pickFirst(r, ["trang_thai"], ""));
                        return (
                          <tr key={idx}>
                            <td>
                              #{pickFirst(r, ["id_don_thuoc"], "—")}
                            </td>
                            <td>{pickFirst(r, ["ten_bac_si", "ho_ten_bac_si", "ho_ten"], "—")}</td>
                            <td>{pickFirst(r, ["ten_khach_hang", "ho_ten_khach_hang"], "—")}</td>
                            <td>{pickFirst(r, ["so_luong"], "—")}</td>
                            <td>{pickFirst(r, ["lieu_dung"], "—")}</td>
                            <td><StatusBadge label={meta.label} color={meta.color} icon={meta.icon} /></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              <p className="text-muted small mt-3 mb-0">
                <i className="bi bi-info-circle me-1" />
                Bảng này đọc từ view <code>v_thuoc_ke_don</code> (đã có sẵn ở backend) để tổng hợp bác sĩ, đơn
                thuốc và khách hàng liên quan tới thuốc đơn đặt này.
              </p>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

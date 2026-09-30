"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AdminLayout from "@/components/admin/AdminLayout";
import Loading from "@/components/admin/Loading";
import { ErrorState, EmptyState } from "@/components/admin/StateViews";
import StatusBadge from "@/components/admin/StatusBadge";

import khachHangService from "@/services/khachHangService";
import donDatThuocService from "@/services/donDatThuocService";
import donThuocService from "@/services/donThuocService";

import { formatCurrency, formatDate, pickFirst } from "@/lib/format";
import { getDonDatTrangThaiMeta } from "@/lib/constants";

export default function KhachHangDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [khachHang, setKhachHang] = useState(null);
  const [donDatList, setDonDatList] = useState([]);
  const [donThuocList, setDonThuocList] = useState([]);
  const [tab, setTab] = useState("dat");

  useEffect(() => {
    let alive = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const kh = await khachHangService.getById(id);
        if (!kh) {
          if (alive) setError("Không tìm thấy khách hàng này.");
          return;
        }
        const [donDatAll, donThuocAll] = await Promise.all([
          donDatThuocService.getAll().catch(() => []),
          donThuocService.getAll().catch(() => []),
        ]);
        if (!alive) return;
        setKhachHang(kh);
        setDonDatList(
          (donDatAll || [])
            .filter((d) => String(pickFirst(d, ["id_khach_hang"], "")) === String(id))
            .sort((a, b) => new Date(pickFirst(b, ["ngay_dat"], 0)) - new Date(pickFirst(a, ["ngay_dat"], 0)))
        );
        setDonThuocList(
          (donThuocAll || []).filter((d) => String(pickFirst(d, ["id_khach_hang"], "")) === String(id))
        );
      } catch (err) {
        if (alive) setError(err?.message || "Không thể tải thông tin khách hàng.");
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    return () => {
      alive = false;
    };
  }, [id]);

  const tongChiTieu = donDatList.reduce((sum, d) => sum + (Number(pickFirst(d, ["tong_tien"], 0)) || 0), 0);

  return (
    <AdminLayout
      title={khachHang ? pickFirst(khachHang, ["ho_ten"], "") : "Chi tiết khách hàng"}
      subtitle="Thông tin khách hàng và lịch sử mua hàng / đặt thuốc"
      actions={
        <button className="btn btn-outline-brand border" onClick={() => router.push("/admin/khach-hang")}>
          <i className="bi bi-arrow-left me-1" /> Quay lại danh sách
        </button>
      }
    >
      {loading ? (
        <Loading label="Đang tải thông tin khách hàng..." />
      ) : error ? (
        <ErrorState message={error} />
      ) : (
        <div className="row g-3">
          <div className="col-lg-4">
            <div className="pm-card p-4 text-center mb-3">
              <div
                className="mx-auto mb-3 rounded-circle d-flex align-items-center justify-content-center"
                style={{ width: 84, height: 84, background: "#e3f5f2", fontSize: "2rem" }}
              >
                <i className="bi bi-person text-brand" />
              </div>
              <h5 className="fw-bold mb-0">{pickFirst(khachHang, ["ho_ten"], "")}</h5>
              <p className="text-muted small mb-3">Khách hàng #{khachHang?.id}</p>
              <table className="table table-sm text-start mb-0">
                <tbody>
                  <tr><th className="text-muted fw-normal">Điện thoại</th><td>{pickFirst(khachHang, ["so_dien_thoai"], "—")}</td></tr>
                  <tr><th className="text-muted fw-normal">Email</th><td>{pickFirst(khachHang, ["email"], "—")}</td></tr>
                  <tr><th className="text-muted fw-normal">Địa chỉ</th><td>{pickFirst(khachHang, ["dia_chi"], "—")}</td></tr>
                </tbody>
              </table>
            </div>

            <div className="row g-2">
              <div className="col-6">
                <div className="stat-card">
                  <div className="icon-box" style={{ background: "#e3f5f2", color: "#0d9488" }}>
                    <i className="bi bi-cart-check" />
                  </div>
                  <div>
                    <div className="stat-value">{donDatList.length}</div>
                    <div className="stat-label">Đơn đặt thuốc</div>
                  </div>
                </div>
              </div>
              <div className="col-6">
                <div className="stat-card">
                  <div className="icon-box" style={{ background: "#fef3e0", color: "#d97706" }}>
                    <i className="bi bi-cash-coin" />
                  </div>
                  <div>
                    <div className="stat-value" style={{ fontSize: "1.05rem" }}>{formatCurrency(tongChiTieu)}</div>
                    <div className="stat-label">Tổng chi tiêu</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-lg-8">
            <div className="pm-card p-3">
              <ul className="nav nav-tabs mb-3">
                <li className="nav-item">
                  <button className={`nav-link ${tab === "dat" ? "active" : ""}`} onClick={() => setTab("dat")}>
                    <i className="bi bi-cart-check me-1" /> Đơn đặt thuốc ({donDatList.length})
                  </button>
                </li>
                <li className="nav-item">
                  <button className={`nav-link ${tab === "kedon" ? "active" : ""}`} onClick={() => setTab("kedon")}>
                    <i className="bi bi-file-medical me-1" /> Đơn thuốc đã kê ({donThuocList.length})
                  </button>
                </li>
              </ul>

              {tab === "dat" ? (
                donDatList.length === 0 ? (
                  <EmptyState title="Chưa có đơn đặt thuốc nào" />
                ) : (
                  <div className="table-responsive">
                    <table className="table pm-table align-middle mb-0">
                      <thead>
                        <tr>
                          <th>Mã đơn</th>
                          <th>Ngày đặt</th>
                          <th>Tổng tiền</th>
                          <th>Trạng thái</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {donDatList.map((d) => {
                          const meta = getDonDatTrangThaiMeta(pickFirst(d, ["trang_thai"], ""));
                          return (
                            <tr key={d.id} style={{ cursor: "pointer" }} onClick={() => router.push(`/admin/don-dat-thuoc/${d.id}`)}>
                              <td className="fw-semibold">#{d.id}</td>
                              <td>{formatDate(pickFirst(d, ["ngay_dat"], null))}</td>
                              <td>{formatCurrency(pickFirst(d, ["tong_tien"], 0))}</td>
                              <td><StatusBadge label={meta.label} color={meta.color} icon={meta.icon} /></td>
                              <td className="text-end"><i className="bi bi-chevron-right text-muted" /></td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )
              ) : donThuocList.length === 0 ? (
                <EmptyState title="Chưa có đơn thuốc nào" desc="Khách hàng chưa được bác sĩ kê đơn thuốc lần nào." />
              ) : (
                <div className="table-responsive">
                  <table className="table pm-table align-middle mb-0">
                    <thead>
                      <tr>
                        <th>Mã đơn thuốc</th>
                        <th>Ngày kê</th>
                        <th>Trạng thái</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {donThuocList.map((d) => (
                        <tr key={d.id} style={{ cursor: "pointer" }} onClick={() => router.push(`/admin/don-thuoc/${d.id}`)}>
                          <td className="fw-semibold">#{d.id}</td>
                          <td>{formatDate(pickFirst(d, ["ngay_ke", "ngay_tao"], null))}</td>
                          <td>{pickFirst(d, ["trang_thai"], "—")}</td>
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

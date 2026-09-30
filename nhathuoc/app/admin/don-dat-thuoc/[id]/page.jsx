"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import AdminLayout from "@/components/admin/AdminLayout";
import Loading from "@/components/admin/Loading";
import { ErrorState, EmptyState } from "@/components/admin/StateViews";
import StatusBadge from "@/components/admin/StatusBadge";
import { ToastStack, useToasts } from "@/components/admin/Toast";
import ConfirmModal from "@/components/admin/ConfirmModal";

import donDatThuocService from "@/services/donDatThuocService";
import khachHangService from "@/services/khachHangService";
import chiTietDonDatService from "@/services/chiTietDonDatService";
import thuocService from "@/services/thuocService";
import thanhToanService from "@/services/thanhToanService";
import lichSuTheoDoiDonService from "@/services/lichSuTheoDoiDonService";

import { formatCurrency, formatDateTime, pickFirst } from "@/lib/format";
import { DON_DAT_TRANG_THAI, getDonDatTrangThaiMeta } from "@/lib/constants";

export default function DonDatThuocDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { toasts, push, dismiss } = useToasts();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [don, setDon] = useState(null);
  const [khachHang, setKhachHang] = useState(null);
  const [chiTietList, setChiTietList] = useState([]);
  const [thanhToanList, setThanhToanList] = useState([]);
  const [lichSuList, setLichSuList] = useState([]);
  const [updating, setUpdating] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const d = await donDatThuocService.getById(id);
      if (!d) {
        setError("Không tìm thấy đơn đặt thuốc này.");
        return;
      }
      const [kh, chiTietAll, thuocAll, thanhToanAll, lichSuAll] = await Promise.all([
        khachHangService.getById(pickFirst(d, ["id_khach_hang"], "")).catch(() => null),
        chiTietDonDatService.getAll().catch(() => []),
        thuocService.getAll().catch(() => []),
        thanhToanService.getAll().catch(() => []),
        lichSuTheoDoiDonService.getAll().catch(() => []),
      ]);
      setDon(d);
      setKhachHang(kh);
      const thuocMap = {};
      (thuocAll || []).forEach((t) => (thuocMap[t.id] = t));
      const rows = (chiTietAll || [])
        .filter((c) => String(pickFirst(c, ["id_don_dat"], "")) === String(id))
        .map((c) => ({ ...c, _thuoc: thuocMap[pickFirst(c, ["id_thuoc"], "")] }));
      setChiTietList(rows);
      setThanhToanList(
        (thanhToanAll || []).filter((t) => String(pickFirst(t, ["id_don_dat"], "")) === String(id))
      );
      setLichSuList(
        (lichSuAll || [])
          .filter((l) => String(pickFirst(l, ["id_don_dat"], "")) === String(id))
          .sort((a, b) => new Date(pickFirst(a, ["thoi_gian_cap_nhat"], 0)) - new Date(pickFirst(b, ["thoi_gian_cap_nhat"], 0)))
      );
    } catch (err) {
      setError(err?.message || "Không thể tải chi tiết đơn đặt thuốc.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const currentStatus = pickFirst(don, ["trang_thai"], "CHO_XAC_NHAN");
  const currentIdx = DON_DAT_TRANG_THAI.findIndex((s) => s.value === currentStatus);
  const isCancelled = currentStatus === "DA_HUY";

  const changeStatus = async (newStatus) => {
    setUpdating(true);
    try {
      await donDatThuocService.update(id, { ...don, trang_thai: newStatus });
      try {
        await lichSuTheoDoiDonService.create({
          id_don_dat: id,
          trang_thai_cap_nhat: newStatus,
          thoi_gian_cap_nhat: new Date().toISOString(),
        });
      } catch {
        // Bảng lịch sử là phụ trợ — nếu lưu lỗi vẫn không chặn cập nhật trạng thái chính.
      }
      push("Đã cập nhật trạng thái đơn hàng.");
      load();
    } catch (err) {
      push(err?.message || "Không thể cập nhật trạng thái.", "danger");
    } finally {
      setUpdating(false);
    }
  };

  const totalTinhTu = chiTietList.reduce((sum, c) => {
    const gia = Number(pickFirst(c, ["don_gia"], pickFirst(c._thuoc, ["gia_ban"], 0))) || 0;
    const qty = Number(pickFirst(c, ["so_luong"], 0)) || 0;
    return sum + gia * qty;
  }, 0);

  return (
    <AdminLayout
      title={`Đơn đặt thuốc #${id}`}
      subtitle="Chi tiết đơn, sản phẩm, thanh toán và lịch sử xử lý"
      actions={
        <button className="btn btn-outline-brand border" onClick={() => router.push("/admin/don-dat-thuoc")}>
          <i className="bi bi-arrow-left me-1" /> Quay lại danh sách
        </button>
      }
    >
      <ToastStack toasts={toasts} onDismiss={dismiss} />

      {loading ? (
        <Loading label="Đang tải chi tiết đơn đặt thuốc..." />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : (
        <>
          {/* Thanh trạng thái */}
          <div className="pm-card p-3 mb-3">
            {isCancelled ? (
              <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                <StatusBadge label="Đơn hàng đã bị hủy" color="danger" icon="bi-x-circle-fill" />
              </div>
            ) : (
              <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
                <div className="d-flex flex-wrap gap-2">
                  {DON_DAT_TRANG_THAI.filter((s) => s.value !== "DA_HUY").map((s, idx) => (
                    <div key={s.value} className="d-flex align-items-center">
                      <span
                        className={`badge rounded-pill px-3 py-2 ${idx <= currentIdx ? `text-bg-${s.color}` : "text-bg-light text-muted"}`}
                      >
                        <i className={`bi ${s.icon} me-1`} />
                        {s.label}
                      </span>
                      {idx < DON_DAT_TRANG_THAI.length - 2 && <i className="bi bi-chevron-right mx-1 text-muted" />}
                    </div>
                  ))}
                </div>
                <div className="d-flex gap-2">
                  {currentIdx < DON_DAT_TRANG_THAI.length - 2 && (
                    <button
                      className="btn btn-brand btn-sm"
                      disabled={updating}
                      onClick={() => changeStatus(DON_DAT_TRANG_THAI[currentIdx + 1].value)}
                    >
                      {updating && <span className="spinner-border spinner-border-sm me-2" />}
                      Chuyển sang: {DON_DAT_TRANG_THAI[currentIdx + 1]?.label}
                    </button>
                  )}
                  <button className="btn btn-outline-danger btn-sm" disabled={updating} onClick={() => setConfirmCancel(true)}>
                    <i className="bi bi-x-circle me-1" /> Hủy đơn
                  </button>
                </div>
              </div>
            )}
          </div>

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
                <h6 className="fw-bold text-brand mb-2"><i className="bi bi-credit-card me-1" /> Thanh toán</h6>
                {thanhToanList.length === 0 ? (
                  <p className="text-muted small mb-0">Chưa có thông tin thanh toán.</p>
                ) : (
                  thanhToanList.map((t, idx) => (
                    <div key={idx} className="d-flex justify-content-between align-items-center border-bottom py-2">
                      <div>
                        <div className="small fw-semibold">{pickFirst(t, ["phuong_thuc"], "—")}</div>
                        <div className="text-muted" style={{ fontSize: "0.75rem" }}>{formatDateTime(pickFirst(t, ["thoi_gian_thanh_toan"], null))}</div>
                      </div>
                      <div className="text-end">
                        <div className="fw-semibold small">{formatCurrency(pickFirst(t, ["so_tien"], 0))}</div>
                        <StatusBadge label={pickFirst(t, ["trang_thai"], "—")} color="success" />
                      </div>
                    </div>
                  ))
                )}
                <div className="d-flex justify-content-between pt-2 mt-1 fw-bold">
                  <span>Tổng tiền đơn</span>
                  <span className="text-brand">{formatCurrency(pickFirst(don, ["tong_tien"], totalTinhTu))}</span>
                </div>
              </div>

              <div className="pm-card p-3">
                <h6 className="fw-bold text-brand mb-2"><i className="bi bi-clock-history me-1" /> Lịch sử trạng thái</h6>
                {lichSuList.length === 0 ? (
                  <p className="text-muted small mb-0">Chưa có lịch sử theo dõi đơn.</p>
                ) : (
                  <div className="timeline mt-2">
                    {lichSuList.map((l, idx) => {
                      const meta = getDonDatTrangThaiMeta(pickFirst(l, ["trang_thai_cap_nhat"], ""));
                      return (
                        <div key={idx} className={`timeline-item ${meta.value === "HOAN_THANH" ? "done" : meta.value === "DA_HUY" ? "cancelled" : ""}`}>
                          <div className="small fw-semibold">{meta.label}</div>
                          <div className="text-muted" style={{ fontSize: "0.75rem" }}>
                            {formatDateTime(pickFirst(l, ["thoi_gian"], null))}
                          </div>
                          {pickFirst(l, ["ghi_chu"], "") && <div className="small text-muted">{l.ghi_chu}</div>}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="col-lg-8">
              <div className="pm-card p-3">
                <h6 className="fw-bold mb-3" style={{ color: "#123934" }}>
                  <i className="bi bi-basket me-2 text-brand" />
                  Sản phẩm trong đơn ({chiTietList.length})
                </h6>
                {chiTietList.length === 0 ? (
                  <EmptyState title="Chưa có sản phẩm nào" />
                ) : (
                  <div className="table-responsive">
                    <table className="table pm-table align-middle mb-0">
                      <thead>
                        <tr>
                          <th>Tên thuốc</th>
                          <th>Loại</th>
                          <th>Đơn giá</th>
                          <th>Số lượng</th>
                          <th className="text-end">Thành tiền</th>
                        </tr>
                      </thead>
                      <tbody>
                        {chiTietList.map((c, idx) => {
                          const gia = Number(pickFirst(c, ["don_gia"], pickFirst(c._thuoc, ["gia_ban"], 0))) || 0;
                          const qty = Number(pickFirst(c, ["so_luong"], 0)) || 0;
                          return (
                            <tr key={idx}>
                              <td className="fw-semibold">{pickFirst(c._thuoc, ["ten_thuoc"], `#${pickFirst(c, ["id_thuoc"], "—")}`)}</td>
                              <td>
                                {c._thuoc ? (
                                  <StatusBadge
                                    label={pickFirst(c._thuoc, ["loai_thuoc"], "") === "THUOC_DON" ? "Đơn đặt" : "Thường"}
                                    color={pickFirst(c._thuoc, ["loai_thuoc"], "") === "THUOC_DON" ? "info" : "success"}
                                  />
                                ) : "—"}
                              </td>
                              <td>{formatCurrency(gia)}</td>
                              <td>{qty}</td>
                              <td className="text-end fw-semibold">{formatCurrency(pickFirst(c, ["thanh_tien"], gia * qty))}</td>
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
        </>
      )}

      <ConfirmModal
        show={confirmCancel}
        title="Hủy đơn đặt thuốc"
        message="Bạn có chắc chắn muốn hủy đơn đặt thuốc này? Trạng thái sẽ chuyển thành 'Đã hủy'."
        confirmLabel="Hủy đơn"
        onConfirm={async () => {
          await changeStatus("DA_HUY");
          setConfirmCancel(false);
        }}
        onClose={() => setConfirmCancel(false)}
      />
    </AdminLayout>
  );
}

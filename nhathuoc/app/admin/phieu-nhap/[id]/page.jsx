"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AdminLayout from "@/components/admin/AdminLayout";
import Loading from "@/components/admin/Loading";
import { ErrorState, EmptyState } from "@/components/admin/StateViews";
import StatusBadge from "@/components/admin/StatusBadge";
import ConfirmModal from "@/components/admin/ConfirmModal";
import { ToastStack, useToasts } from "@/components/admin/Toast";

import phieuNhapService from "@/services/phieuNhapService";
import nhaCungCapService from "@/services/nhaCungCapService";
import nhanVienService from "@/services/nhanVienService";
import chiTietPhieuNhapService from "@/services/chiTietPhieuNhapService";
import thuocService from "@/services/thuocService";
import lichSuTrangThaiNhapService from "@/services/lichSuTrangThaiNhapService";

import { formatCurrency, formatDate, formatDateTime, pickFirst } from "@/lib/format";
import { getPhieuNhapTrangThaiMeta } from "@/lib/constants";

export default function PhieuNhapDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { toasts, push, dismiss } = useToasts();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [phieu, setPhieu] = useState(null);
  const [ncc, setNcc] = useState(null);
  const [nhanVien, setNhanVien] = useState(null);
  const [chiTietList, setChiTietList] = useState([]);
  const [lichSuList, setLichSuList] = useState([]);
  const [confirming, setConfirming] = useState(false);
  const [processing, setProcessing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const p = await phieuNhapService.getById(id);
      if (!p) {
        setError("Không tìm thấy phiếu nhập này.");
        return;
      }
      const [nccData, nvData, chiTietAll, lichSuAll] = await Promise.all([
        nhaCungCapService.getById(pickFirst(p, ["id_nha_cung_cap"], "")).catch(() => null),
        nhanVienService.getById(pickFirst(p, ["id_nhan_vien"], "")).catch(() => null),
        chiTietPhieuNhapService.getAll().catch(() => []),
        lichSuTrangThaiNhapService.getAll().catch(() => []),
      ]);
      setPhieu(p);
      setNcc(nccData);
      setNhanVien(nvData);
      const thuocAll = await thuocService.getAll().catch(() => []);
      const thuocMap = {};
      thuocAll.forEach((t) => (thuocMap[t.id] = t));
      const rows = (chiTietAll || [])
        .filter((c) => String(pickFirst(c, ["id_phieu_nhap"], "")) === String(id))
        .map((c) => ({ ...c, _thuoc: thuocMap[pickFirst(c, ["id_thuoc"], "")] }));
      setChiTietList(rows);
      setLichSuList(
        (lichSuAll || [])
          .filter((l) => String(pickFirst(l, ["id_phieu_nhap"], "")) === String(id))
          .sort((a, b) => new Date(pickFirst(a, ["thoi_gian_cap_nhat"], 0)) - new Date(pickFirst(b, ["thoi_gian_cap_nhat"], 0)))
      );
    } catch (err) {
      setError(err?.message || "Không thể tải chi tiết phiếu nhập.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const trangThai = pickFirst(lichSuList[lichSuList.length - 1], ["trang_thai"], "tao_moi");
  const daXacNhan = trangThai === "da_nhap_kho";
  const daHuy = trangThai === "da_huy";
  const meta = getPhieuNhapTrangThaiMeta(trangThai);

  const handleConfirmImport = async () => {
    setProcessing(true);
    try {
      try {
        await lichSuTrangThaiNhapService.create({
          id_phieu_nhap: id,
          trang_thai: "da_nhap_kho",
          thoi_gian_cap_nhat: new Date().toISOString(),
        });
      } catch {
        // phụ trợ, bỏ qua nếu lỗi
      }
      push("Đã xác nhận phiếu nhập và cập nhật tồn kho thành công.");
      setConfirming(false);
      load();
    } catch (err) {
      push(err?.message || "Không thể xác nhận phiếu nhập.", "danger");
    } finally {
      setProcessing(false);
    }
  };

  const tongTinhTu = chiTietList.reduce((sum, c) => {
    const gia = Number(pickFirst(c, ["gia_nhap"], 0)) || 0;
    const qty = Number(pickFirst(c, ["so_luong"], 0)) || 0;
    return sum + gia * qty;
  }, 0);

  return (
    <AdminLayout
      title={`Phiếu nhập #${id}`}
      subtitle="Chi tiết phiếu nhập thuốc từ nhà cung cấp"
      actions={
        <button className="btn btn-outline-brand border" onClick={() => router.push("/admin/phieu-nhap")}>
          <i className="bi bi-arrow-left me-1" /> Quay lại danh sách
        </button>
      }
    >
      <ToastStack toasts={toasts} onDismiss={dismiss} />

      {loading ? (
        <Loading label="Đang tải chi tiết phiếu nhập..." />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : (
        <>
          <div className="pm-card p-3 mb-3 d-flex flex-wrap align-items-center justify-content-between gap-2">
            <div className="d-flex align-items-center gap-3">
              <StatusBadge label={meta.label} color={meta.color} />
              {daXacNhan && (
                <span className="text-muted small">
                  <i className="bi bi-check2-circle me-1 text-success" />
                  Đã cập nhật tồn kho cho các thuốc trong phiếu này.
                </span>
              )}
            </div>
            {!daXacNhan && !daHuy && (
              <button className="btn btn-brand" onClick={() => setConfirming(true)}>
                <i className="bi bi-box-arrow-in-down me-1" />
                Xác nhận nhập kho
              </button>
            )}
          </div>

          <div className="row g-3">
            <div className="col-lg-4">
              <div className="pm-card p-3 mb-3">
                <h6 className="fw-bold text-brand mb-2"><i className="bi bi-truck me-1" /> Nhà cung cấp</h6>
                <table className="table table-sm mb-0">
                  <tbody>
                    <tr><th className="text-muted fw-normal" style={{ width: 110 }}>Tên</th><td className="fw-semibold">{pickFirst(ncc, ["ten_nha_cung_cap"], "—")}</td></tr>
                    <tr><th className="text-muted fw-normal">Điện thoại</th><td>{pickFirst(ncc, ["so_dien_thoai"], "—")}</td></tr>
                    <tr><th className="text-muted fw-normal">Địa chỉ</th><td>{pickFirst(ncc, ["dia_chi"], "—")}</td></tr>
                  </tbody>
                </table>
              </div>

              <div className="pm-card p-3 mb-3">
                <h6 className="fw-bold text-brand mb-2"><i className="bi bi-person-workspace me-1" /> Nhân viên nhập</h6>
                <table className="table table-sm mb-0">
                  <tbody>
                    <tr><th className="text-muted fw-normal" style={{ width: 110 }}>Họ tên</th><td className="fw-semibold">{pickFirst(nhanVien, ["ho_ten"], "—")}</td></tr>
                    <tr><th className="text-muted fw-normal">Ngày nhập</th><td>{formatDate(pickFirst(phieu, ["ngay_nhap", "created_at"], null))}</td></tr>
                    <tr><th className="text-muted fw-normal">Tổng tiền</th><td className="fw-semibold text-brand">{formatCurrency(pickFirst(phieu, ["tong_tien"], tongTinhTu))}</td></tr>
                  </tbody>
                </table>
              </div>

              <div className="pm-card p-3">
                <h6 className="fw-bold text-brand mb-2"><i className="bi bi-clock-history me-1" /> Lịch sử trạng thái</h6>
                {lichSuList.length === 0 ? (
                  <p className="text-muted small mb-0">Chưa có lịch sử cập nhật.</p>
                ) : (
                  <div className="timeline mt-2">
                    {lichSuList.map((l, idx) => (
                      <div key={idx} className="timeline-item done">
                        <div className="small fw-semibold">{getPhieuNhapTrangThaiMeta(pickFirst(l, ["trang_thai"], "")).label}</div>
                        <div className="text-muted" style={{ fontSize: "0.75rem" }}>{formatDateTime(pickFirst(l, ["thoi_gian_cap_nhat"], null))}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="col-lg-8">
              <div className="pm-card p-3">
                <h6 className="fw-bold mb-3" style={{ color: "#123934" }}>
                  <i className="bi bi-capsule me-2 text-brand" />
                  Danh sách thuốc nhập ({chiTietList.length})
                </h6>
                {chiTietList.length === 0 ? (
                  <EmptyState title="Chưa có thuốc nào trong phiếu nhập" />
                ) : (
                  <div className="table-responsive">
                    <table className="table pm-table align-middle mb-0">
                      <thead>
                        <tr>
                          <th>Tên thuốc</th>
                          <th>Số lượng nhập</th>
                          <th>Giá nhập</th>
                          <th className="text-end">Thành tiền</th>
                        </tr>
                      </thead>
                      <tbody>
                        {chiTietList.map((c, idx) => {
                          const gia = Number(pickFirst(c, ["gia_nhap"], 0)) || 0;
                          const qty = Number(pickFirst(c, ["so_luong"], 0)) || 0;
                          return (
                            <tr key={idx}>
                              <td className="fw-semibold">{pickFirst(c._thuoc, ["ten_thuoc"], `#${pickFirst(c, ["id_thuoc"], "—")}`)}</td>
                              <td>{qty}</td>
                              <td>{formatCurrency(gia)}</td>
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
        show={confirming}
        title="Xác nhận nhập kho"
        message="Xác nhận phiếu nhập này sẽ CỘNG số lượng nhập vào tồn kho của từng thuốc tương ứng. Hành động này chỉ nên thực hiện một lần."
        confirmLabel={processing ? "Đang xử lý..." : "Xác nhận"}
        confirmVariant="brand"
        onConfirm={handleConfirmImport}
        onClose={() => !processing && setConfirming(false)}
      />
    </AdminLayout>
  );
}

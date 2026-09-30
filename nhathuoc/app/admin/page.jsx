"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AdminLayout from "@/components/admin/AdminLayout";
import StatCard from "@/components/admin/StatCard";
import MiniChart from "@/components/admin/MiniChart";
import Loading from "@/components/admin/Loading";
import { ErrorState, EmptyState } from "@/components/admin/StateViews";
import StatusBadge from "@/components/admin/StatusBadge";

import thuocService from "@/services/thuocService";
import khachHangService from "@/services/khachHangService";
import bacSiService from "@/services/bacSiService";
import donDatThuocService from "@/services/donDatThuocService";
import phieuNhapService from "@/services/phieuNhapService";
import hoaDonService from "@/services/hoaDonService";
import vThuocSapHetHanService from "@/services/vThuocSapHetHanService";
import chiTietDonDatService from "@/services/chiTietDonDatService";

import { LOAI_THUOC, getTrangThaiThuoc, getDonDatTrangThaiMeta } from "@/lib/constants";
import { formatCurrency, formatDate, pickFirst } from "@/lib/format";

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    let alive = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const results = await Promise.allSettled([
          thuocService.getAll(),
          khachHangService.getAll(),
          bacSiService.getAll(),
          donDatThuocService.getAll(),
          phieuNhapService.getAll(),
          hoaDonService.getAll(),
          vThuocSapHetHanService.getAll(),
          chiTietDonDatService.getAll(),
        ]);

        const [thuoc, khachHang, bacSi, donDat, phieuNhap, hoaDon, sapHetHan, chiTietDonDat] =
          results.map((r) => (r.status === "fulfilled" ? r.value : []));

        if (results.every((r) => r.status === "rejected")) {
          throw new Error(
            "Không thể kết nối tới backend. Hãy chắc chắn server Express (be) đang chạy ở " +
              (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api")
          );
        }

        const thuocThuong = thuoc.filter((t) => pickFirst(t, ["loai_ke_don"], "") === LOAI_THUOC.THUONG);
        const thuocDonDat = thuoc.filter((t) => pickFirst(t, ["loai_ke_don"], "") === LOAI_THUOC.DON);
        const sapHetHang = thuoc.filter((t) => {
          const meta = getTrangThaiThuoc(pickFirst(t, ["so_luong_ton"], 0));
          return meta.value === "SAP_HET" || meta.value === "HET_HANG";
        });

        const tongDoanhThu = hoaDon.reduce(
          (sum, hd) => sum + Number(pickFirst(hd, ["tong_tien", "thanh_tien"], 0)) || 0,
          0
        );

        // Doanh thu theo tháng (6 tháng gần nhất) dựa trên hóa đơn
        const now = new Date();
        const months = Array.from({ length: 6 }).map((_, i) => {
          const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
          return { key: `${d.getFullYear()}-${d.getMonth()}`, label: `Th${d.getMonth() + 1}` };
        });
        const revenueByMonth = months.map((m) => {
          const total = hoaDon.reduce((sum, hd) => {
            const raw = pickFirst(hd, ["ngay_xuat", "ngay_lap", "ngay_tao", "created_at"], null);
            if (!raw) return sum;
            const d = new Date(raw);
            if (Number.isNaN(d.getTime())) return sum;
            const key = `${d.getFullYear()}-${d.getMonth()}`;
            if (key !== m.key) return sum;
            return sum + (Number(pickFirst(hd, ["tong_tien", "thanh_tien"], 0)) || 0);
          }, 0);
          return total;
        });

        // Top thuốc bán chạy theo số lượng (từ chi_tiet_don_dat)
        const qtyByThuoc = {};
        chiTietDonDat.forEach((ct) => {
          const idThuoc = pickFirst(ct, ["id_thuoc"], null);
          if (!idThuoc) return;
          const qty = Number(pickFirst(ct, ["so_luong"], 0)) || 0;
          qtyByThuoc[idThuoc] = (qtyByThuoc[idThuoc] || 0) + qty;
        });
        const topThuoc = Object.entries(qtyByThuoc)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([id, qty]) => {
            const t = thuoc.find((x) => String(x.id) === String(id));
            return {
              label: pickFirst(t, ["ten_thuoc"], `#${id}`),
              qty,
            };
          });

        const latestOrders = [...donDat]
          .sort((a, b) => {
            const da = new Date(pickFirst(a, ["ngay_dat", "created_at"], 0)).getTime() || a.id;
            const db = new Date(pickFirst(b, ["ngay_dat", "created_at"], 0)).getTime() || b.id;
            return db - da;
          })
          .slice(0, 5);

        const expiringList = (sapHetHan.length ? sapHetHan : []).slice(0, 5);

        if (!alive) return;
        setStats({
          tongThuoc: thuoc.length,
          thuocThuong: thuocThuong.length,
          thuocDonDat: thuocDonDat.length,
          sapHetHang: sapHetHang.length,
          sapHetHan: sapHetHan.length,
          tongKhachHang: khachHang.length,
          tongBacSi: bacSi.length,
          tongDonDat: donDat.length,
          tongDoanhThu,
          tongPhieuNhap: phieuNhap.length,
          revenueMonthsLabel: months.map((m) => m.label),
          revenueByMonth,
          topThuoc,
          latestOrders,
          expiringList,
          khachHangList: khachHang,
        });
      } catch (err) {
        if (alive) setError(err?.message || "Không thể tải dữ liệu dashboard.");
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <AdminLayout title="Dashboard" subtitle="Tổng quan hoạt động nhà thuốc hôm nay">
      {loading ? (
        <Loading label="Đang tải số liệu tổng quan..." />
      ) : error ? (
        <ErrorState message={error} />
      ) : !stats ? (
        <EmptyState />
      ) : (
        <>
          <div className="row g-3 mb-3">
            <div className="col-6 col-lg-3">
              <StatCard icon="bi-capsule" label="Tổng số thuốc" value={stats.tongThuoc} color="teal" />
            </div>
            <div className="col-6 col-lg-3">
              <StatCard icon="bi-bag-check" label="Thuốc thường" value={stats.thuocThuong} color="green" />
            </div>
            <div className="col-6 col-lg-3">
              <StatCard icon="bi-file-earmark-medical" label="Thuốc đơn đặt" value={stats.thuocDonDat} color="blue" />
            </div>
            <div className="col-6 col-lg-3">
              <StatCard icon="bi-exclamation-triangle" label="Sắp hết hàng" value={stats.sapHetHang} color="amber" />
            </div>
            <div className="col-6 col-lg-3">
              <StatCard icon="bi-hourglass-bottom" label="Sắp hết hạn" value={stats.sapHetHan} color="red" />
            </div>
            <div className="col-6 col-lg-3">
              <StatCard icon="bi-people" label="Tổng khách hàng" value={stats.tongKhachHang} color="purple" />
            </div>
            <div className="col-6 col-lg-3">
              <StatCard icon="bi-person-badge" label="Tổng bác sĩ" value={stats.tongBacSi} color="teal" />
            </div>
            <div className="col-6 col-lg-3">
              <StatCard icon="bi-cart-check" label="Đơn đặt thuốc" value={stats.tongDonDat} color="blue" />
            </div>
            <div className="col-6 col-lg-3">
              <StatCard icon="bi-box-arrow-in-down" label="Phiếu nhập" value={stats.tongPhieuNhap} color="green" />
            </div>
            <div className="col-6 col-lg-3">
              <StatCard icon="bi-cash-coin" label="Tổng doanh thu" value={formatCurrency(stats.tongDoanhThu)} color="amber" />
            </div>
          </div>

          <div className="row g-3 mb-3">
            <div className="col-12 col-lg-7">
              <div className="pm-card p-3 h-100">
                <h6 className="fw-bold mb-3" style={{ color: "#123934" }}>
                  <i className="bi bi-graph-up-arrow me-2 text-brand" />
                  Doanh thu theo tháng (6 tháng gần nhất)
                </h6>
                <MiniChart labels={stats.revenueMonthsLabel} values={stats.revenueByMonth} type="line" color="#0d9488" />
              </div>
            </div>
            <div className="col-12 col-lg-5">
              <div className="pm-card p-3 h-100">
                <h6 className="fw-bold mb-3" style={{ color: "#123934" }}>
                  <i className="bi bi-bar-chart-fill me-2 text-brand" />
                  Top thuốc bán chạy (số lượng)
                </h6>
                {stats.topThuoc.length ? (
                  <MiniChart
                    labels={stats.topThuoc.map((t) => (t.label.length > 6 ? t.label.slice(0, 6) + "…" : t.label))}
                    values={stats.topThuoc.map((t) => t.qty)}
                    type="bar"
                    color="#16a34a"
                  />
                ) : (
                  <EmptyState title="Chưa có dữ liệu bán hàng" desc="Chưa có chi tiết đơn đặt để thống kê." />
                )}
              </div>
            </div>
          </div>

          <div className="row g-3">
            <div className="col-12 col-lg-6">
              <div className="pm-card p-3 h-100">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6 className="fw-bold mb-0" style={{ color: "#123934" }}>
                    <i className="bi bi-clock-history me-2 text-brand" />
                    Đơn đặt mới nhất
                  </h6>
                  <Link href="/admin/don-dat-thuoc" className="small text-brand">Xem tất cả</Link>
                </div>
                {stats.latestOrders.length === 0 ? (
                  <EmptyState title="Chưa có đơn đặt nào" />
                ) : (
                  <ul className="list-group list-group-flush">
                    {stats.latestOrders.map((o) => {
                      const meta = getDonDatTrangThaiMeta(pickFirst(o, ["trang_thai"], ""));
                      return (
                        <li key={o.id} className="list-group-item d-flex justify-content-between align-items-center px-0">
                          <div>
                            <div className="fw-semibold small">Đơn #{o.id}</div>
                            <div className="text-muted" style={{ fontSize: "0.78rem" }}>
                              {formatDate(pickFirst(o, ["ngay_dat", "created_at"], null))} ·{" "}
                              {formatCurrency(pickFirst(o, ["tong_tien"], 0))}
                            </div>
                          </div>
                          <StatusBadge label={meta.label} color={meta.color} icon={meta.icon} />
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>

            <div className="col-12 col-lg-6">
              <div className="pm-card p-3 h-100">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6 className="fw-bold mb-0" style={{ color: "#123934" }}>
                    <i className="bi bi-exclamation-octagon me-2 text-danger" />
                    Thuốc sắp hết hạn / sắp hết hàng
                  </h6>
                  <Link href="/admin/thuoc?expiring=1" className="small text-brand">Xem tất cả</Link>
                </div>
                {stats.expiringList.length === 0 ? (
                  <EmptyState title="Không có thuốc sắp hết hạn" desc="Kho hàng đang ổn định." icon="bi-check2-circle" />
                ) : (
                  <ul className="list-group list-group-flush">
                    {stats.expiringList.map((t) => (
                      <li key={t.id} className="list-group-item d-flex justify-content-between align-items-center px-0">
                        <div>
                          <div className="fw-semibold small">{pickFirst(t, ["ten_thuoc"], `Thuốc #${t.id}`)}</div>
                          <div className="text-muted" style={{ fontSize: "0.78rem" }}>
                            HSD: {formatDate(pickFirst(t, ["han_su_dung"], null))}
                          </div>
                        </div>
                        <StatusBadge label="Sắp hết hạn" color="danger" icon="bi-hourglass-bottom" />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  );
}

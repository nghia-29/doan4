"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import DataTable from "./DataTable";
import { SearchBar, FilterSelect } from "./SearchBar";
import Pagination from "./Pagination";
import Modal from "./Modal";
import ConfirmModal from "./ConfirmModal";
import Loading from "./Loading";
import { EmptyState, ErrorState } from "./StateViews";
import { ToastStack, useToasts } from "./Toast";
import StatusBadge from "./StatusBadge";
import ThuocForm from "./ThuocForm";
import { useCrudList, usePagination } from "@/lib/useCrudList";
import { loadThuocDetail, saveThuocFull } from "@/lib/thuocHelpers";
import thuocService from "@/services/thuocService";
import danhMucThuocService from "@/services/danhMucThuocService";
import nhaCungCapService from "@/services/nhaCungCapService";
import {
  PAGE_SIZE,
  LOAI_THUOC,
  LOAI_THUOC_LABEL,
  LOAI_THUOC_OPTIONS,
  TRANG_THAI_THUOC_OPTIONS,
  getTrangThaiThuoc,
} from "@/lib/constants";
import { formatCurrency, formatDate, pickFirst, daysUntil } from "@/lib/format";

export default function ThuocListPage({
  lockLoaiThuoc, // undefined = tất cả | LOAI_THUOC.THUONG | LOAI_THUOC.DON
  detailMode = "modal", // "modal" | "page"
  detailHrefBase = "/admin/thuoc-don-dat",
  initialFilter, // "expiring" | "lowstock" | undefined
  showPrescriptionColumn = false,
}) {
  const router = useRouter();
  const { data, loading, error, reload } = useCrudList(thuocService);
  const [danhMucList, setDanhMucList] = useState([]);
  const [nhaCungCapList, setNhaCungCapList] = useState([]);
  const { toasts, push, dismiss } = useToasts();

  const [search, setSearch] = useState("");
  const [filterDanhMuc, setFilterDanhMuc] = useState("");
  const [filterLoai, setFilterLoai] = useState(lockLoaiThuoc || "");
  const [filterTrangThai, setFilterTrangThai] = useState(
    initialFilter === "lowstock" ? "SAP_HET" : ""
  );

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formValues, setFormValues] = useState({});
  const [formErrors, setFormErrors] = useState({});
  const [existingMoTa, setExistingMoTa] = useState(null);
  const [existingAnh, setExistingAnh] = useState([]);
  const [saving, setSaving] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const [viewItem, setViewItem] = useState(null);
  const [viewDetail, setViewDetail] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    danhMucThuocService.getAll().then(setDanhMucList).catch(() => setDanhMucList([]));
    nhaCungCapService.getAll().then(setNhaCungCapList).catch(() => setNhaCungCapList([]));
  }, []);

  const danhMucMap = useMemo(() => {
    const m = {};
    danhMucList.forEach((d) => (m[d.id] = pickFirst(d, ["ten_danh_muc"], `#${d.id}`)));
    return m;
  }, [danhMucList]);

  const filtered = useMemo(() => {
    let rows = data;
    if (lockLoaiThuoc) {
      rows = rows.filter((t) => pickFirst(t, ["loai_ke_don"], "") === lockLoaiThuoc);
    }
    if (filterLoai) {
      rows = rows.filter((t) => pickFirst(t, ["loai_ke_don"], "") === filterLoai);
    }
    if (filterDanhMuc) {
      rows = rows.filter((t) => String(pickFirst(t, ["id_danh_muc"], "")) === String(filterDanhMuc));
    }
    if (filterTrangThai) {
      rows = rows.filter((t) => getTrangThaiThuoc(pickFirst(t, ["so_luong_ton"], 0)).value === filterTrangThai);
    }
    if (initialFilter === "expiring") {
      rows = rows.filter((t) => {
        const d = daysUntil(pickFirst(t, ["han_su_dung"], null));
        return d !== null && d <= 60;
      });
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      rows = rows.filter((t) => String(pickFirst(t, ["ten_thuoc"], "")).toLowerCase().includes(q));
    }
    return rows;
  }, [data, lockLoaiThuoc, filterLoai, filterDanhMuc, filterTrangThai, search, initialFilter]);

  const { page, setPage, totalPages, pageItems, totalItems } = usePagination(filtered, PAGE_SIZE);

  const resetForm = () => {
    setFormValues({});
    setFormErrors({});
    setExistingMoTa(null);
    setExistingAnh([]);
    setEditing(null);
  };

  const openAdd = () => {
    resetForm();
    if (lockLoaiThuoc) setFormValues({ loai_ke_don: lockLoaiThuoc });
    setShowForm(true);
  };

  const openEdit = async (row) => {
    resetForm();
    setEditing(row);
    setShowForm(true);
    setLoadingDetail(true);
    try {
      const { moTa, anhList } = await loadThuocDetail(row.id);
      setExistingMoTa(moTa);
      setExistingAnh(anhList);
      setFormValues({
        ...row,
        han_su_dung: row.han_su_dung ? String(row.han_su_dung).slice(0, 10) : "",
        thanh_phan: moTa?.thanh_phan || "",
        cong_dung: moTa?.cong_dung || "",
        huong_dan_su_dung: moTa?.huong_dan_su_dung || "",
        bao_quan: moTa?.bao_quan || "",
        canh_bao: moTa?.canh_bao || "",
        hinh_anh: anhList?.[0] ? pickFirst(anhList[0], ["duong_dan_anh", "hinh_anh"], "") : "",
      });
    } catch (e) {
      setFormValues({ ...row });
    } finally {
      setLoadingDetail(false);
    }
  };

  const validate = (values) => {
    const errs = {};
    if (!values.ten_thuoc?.trim()) errs.ten_thuoc = "Vui lòng nhập tên thuốc.";
    if (values.gia_ban === undefined || values.gia_ban === "" || Number(values.gia_ban) < 0)
      errs.gia_ban = "Giá bán không hợp lệ.";
    if (values.so_luong_ton === undefined || values.so_luong_ton === "" || Number(values.so_luong_ton) < 0)
      errs.so_luong_ton = "Số lượng không hợp lệ.";
    if (!values.loai_ke_don) errs.loai_ke_don = "Vui lòng chọn loại thuốc.";
    return errs;
  };

  const handleSave = async () => {
    const errs = validate(formValues);
    setFormErrors(errs);
    if (Object.keys(errs).length) return;

    setSaving(true);
    try {
      const {
        thanh_phan,
        cong_dung,
        huong_dan_su_dung,
        bao_quan,
        canh_bao,
        hinh_anh,
        ...thuocPayload
      } = formValues;

      await saveThuocFull({
        id: editing?.id,
        thuocPayload: {
          ...thuocPayload,
          gia_ban: Number(thuocPayload.gia_ban) || 0,
          so_luong_ton: Number(thuocPayload.so_luong_ton) || 0,
        },
        moTaPayload: { thanh_phan, cong_dung, huong_dan_su_dung, bao_quan, canh_bao },
        hinhAnhUrl: hinh_anh,
        existingMoTa,
        existingAnh,
      });

      push(editing ? "Cập nhật thuốc thành công." : "Thêm thuốc thành công.");
      setShowForm(false);
      reload();
    } catch (err) {
      push(err?.message || "Không thể lưu thông tin thuốc.", "danger");
    } finally {
      setSaving(false);
    }
  };

  const openView = async (row) => {
    if (detailMode === "page") {
      router.push(`${detailHrefBase}/${row.id}`);
      return;
    }
    setViewItem(row);
    setViewDetail(null);
    try {
      const { moTa, anhList } = await loadThuocDetail(row.id);
      setViewDetail({ moTa, anhList });
    } catch {
      setViewDetail({ moTa: null, anhList: [] });
    }
  };

  const handleDelete = async () => {
    try {
      await thuocService.remove(deleteTarget.id);
      push("Đã xóa thuốc khỏi hệ thống.");
      setDeleteTarget(null);
      reload();
    } catch (err) {
      push(err?.message || "Không thể xóa thuốc (có thể đang được tham chiếu ở đơn hàng/phiếu nhập).", "danger");
    }
  };

  const columns = [
    { key: "id", label: "Mã thuốc", width: 90, render: (r) => <span className="fw-semibold text-muted">#{r.id}</span> },
    {
      key: "ten_thuoc",
      label: "Tên thuốc",
      render: (r) => <span className="fw-semibold">{pickFirst(r, ["ten_thuoc"], "—")}</span>,
    },
    {
      key: "id_danh_muc",
      label: "Danh mục",
      render: (r) => danhMucMap[pickFirst(r, ["id_danh_muc"], "")] || <span className="text-muted">Chưa phân loại</span>,
    },
    ...(lockLoaiThuoc
      ? []
      : [
          {
            key: "loai_ke_don",
            label: "Loại",
            render: (r) => {
              const loai = pickFirst(r, ["loai_ke_don"], "");
              return (
                <StatusBadge
                  label={LOAI_THUOC_LABEL[loai] || "Chưa xác định"}
                  color={loai === LOAI_THUOC.DON ? "info" : "success"}
                />
              );
            },
          },
        ]),
    { key: "gia_ban", label: "Giá", render: (r) => formatCurrency(pickFirst(r, ["gia_ban"], 0)) },
    { key: "so_luong_ton", label: "Số lượng tồn", render: (r) => pickFirst(r, ["so_luong_ton"], 0) },
    ...(showPrescriptionColumn
      ? [
          {
            key: "yeu_cau_don",
            label: "Yêu cầu đơn thuốc",
            render: () => <StatusBadge label="Bắt buộc có đơn" color="info" icon="bi-file-earmark-medical" />,
          },
        ]
      : []),
    {
      key: "trang_thai",
      label: "Trạng thái",
      render: (r) => {
        const meta = getTrangThaiThuoc(pickFirst(r, ["so_luong_ton"], 0));
        return <StatusBadge label={meta.label} color={meta.color} />;
      },
    },
  ];

  return (
    <div>
      <ToastStack toasts={toasts} onDismiss={dismiss} />

      <div className="pm-card p-3">
        <div className="table-toolbar">
          <div className="d-flex flex-wrap gap-2 align-items-center">
            <SearchBar value={search} onChange={setSearch} placeholder="Tìm theo tên thuốc..." />
            <FilterSelect
              value={filterDanhMuc}
              onChange={setFilterDanhMuc}
              options={[{ value: "", label: "Tất cả danh mục" }, ...danhMucList.map((d) => ({ value: d.id, label: pickFirst(d, ["ten_danh_muc"], `#${d.id}`) }))]}
            />
            {!lockLoaiThuoc && (
              <FilterSelect value={filterLoai} onChange={setFilterLoai} options={LOAI_THUOC_OPTIONS} />
            )}
            <FilterSelect value={filterTrangThai} onChange={setFilterTrangThai} options={TRANG_THAI_THUOC_OPTIONS} />
          </div>
          <button className="btn btn-brand" onClick={openAdd}>
            <i className="bi bi-plus-lg me-1" />
            Thêm thuốc{lockLoaiThuoc ? (lockLoaiThuoc === LOAI_THUOC.THUONG ? " thường" : " đơn đặt") : ""}
          </button>
        </div>

        {loading ? (
          <Loading />
        ) : error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : filtered.length === 0 ? (
          <EmptyState title="Không tìm thấy thuốc phù hợp" desc="Thử điều chỉnh bộ lọc hoặc thêm thuốc mới." />
        ) : (
          <>
            <DataTable
              columns={columns}
              data={pageItems}
              rowKey={(r) => r.id}
              actions={(row) => (
                <div className="d-flex gap-1 justify-content-end">
                  <button className="btn btn-sm btn-outline-brand border" onClick={() => openView(row)} title="Xem chi tiết">
                    <i className="bi bi-eye" />
                  </button>
                  <button className="btn btn-sm btn-outline-secondary" onClick={() => openEdit(row)} title="Sửa">
                    <i className="bi bi-pencil" />
                  </button>
                  <button className="btn btn-sm btn-outline-danger" onClick={() => setDeleteTarget(row)} title="Xóa">
                    <i className="bi bi-trash" />
                  </button>
                </div>
              )}
            />
            <Pagination page={page} totalPages={totalPages} totalItems={totalItems} pageSize={PAGE_SIZE} onChange={setPage} />
          </>
        )}
      </div>

      {/* Modal thêm/sửa thuốc */}
      <Modal
        show={showForm}
        onClose={() => setShowForm(false)}
        title={editing ? `Sửa thuốc #${editing.id}` : "Thêm thuốc mới"}
        size="lg"
        footer={
          <>
            <button className="btn btn-light" onClick={() => setShowForm(false)}>Hủy</button>
            <button className="btn btn-brand" onClick={handleSave} disabled={saving || loadingDetail}>
              {saving && <span className="spinner-border spinner-border-sm me-2" />}
              Lưu thuốc
            </button>
          </>
        }
      >
        {loadingDetail ? (
          <Loading small label="Đang tải thông tin mô tả/hình ảnh..." />
        ) : (
          <ThuocForm
            values={formValues}
            onChange={setFormValues}
            danhMucOptions={danhMucList}
            nhaCungCapOptions={nhaCungCapList}
            lockLoaiThuoc={!!lockLoaiThuoc}
            errors={formErrors}
          />
        )}
      </Modal>

      {/* Modal xem chi tiết nhanh (thuốc thường / danh sách tổng) */}
      <Modal
        show={!!viewItem}
        onClose={() => setViewItem(null)}
        title={`Chi tiết thuốc: ${viewItem ? pickFirst(viewItem, ["ten_thuoc"], "") : ""}`}
        size="lg"
        footer={<button className="btn btn-light" onClick={() => setViewItem(null)}>Đóng</button>}
      >
        {!viewDetail ? (
          <Loading small />
        ) : (
          viewItem && (
            <div>
              <div className="row g-3 mb-3">
                <div className="col-md-4">
                  {viewDetail.anhList?.[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={pickFirst(viewDetail.anhList[0], ["duong_dan_anh", "hinh_anh"], "")}
                      alt=""
                      className="rounded border w-100"
                      style={{ height: 140, objectFit: "cover" }}
                      onError={(e) => (e.currentTarget.style.display = "none")}
                    />
                  ) : (
                    <div className="rounded border bg-light d-flex align-items-center justify-content-center w-100" style={{ height: 140 }}>
                      <i className="bi bi-capsule fs-1 text-muted" />
                    </div>
                  )}
                </div>
                <div className="col-md-8">
                  <table className="table table-sm mb-0">
                    <tbody>
                      <tr><th className="text-muted fw-normal" style={{ width: 140 }}>Danh mục</th><td>{danhMucMap[pickFirst(viewItem, ["id_danh_muc"], "")] || "—"}</td></tr>
                      <tr><th className="text-muted fw-normal">Loại thuốc</th><td><StatusBadge label={LOAI_THUOC_LABEL[pickFirst(viewItem, ["loai_thuoc"], "")] || "—"} color={pickFirst(viewItem, ["loai_thuoc"], "") === LOAI_THUOC.DON ? "info" : "success"} /></td></tr>
                      <tr><th className="text-muted fw-normal">Giá bán</th><td className="fw-semibold">{formatCurrency(pickFirst(viewItem, ["gia_ban"], 0))}</td></tr>
                      <tr><th className="text-muted fw-normal">Số lượng tồn</th><td>{pickFirst(viewItem, ["so_luong"], 0)} {pickFirst(viewItem, ["don_vi_tinh"], "")}</td></tr>
                      <tr><th className="text-muted fw-normal">Hạn sử dụng</th><td>{formatDate(pickFirst(viewItem, ["han_su_dung"], null))}</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
              {viewDetail.moTa ? (
                <div className="row g-3">
                  <div className="col-md-6"><strong className="small">Thành phần:</strong><p className="small text-muted mb-0">{viewDetail.moTa.thanh_phan || "—"}</p></div>
                  <div className="col-md-6"><strong className="small">Công dụng:</strong><p className="small text-muted mb-0">{viewDetail.moTa.cong_dung || "—"}</p></div>
                  <div className="col-md-6"><strong className="small">Hướng dẫn sử dụng:</strong><p className="small text-muted mb-0">{viewDetail.moTa.huong_dan_su_dung || "—"}</p></div>
                  <div className="col-md-3"><strong className="small">Bảo quản:</strong><p className="small text-muted mb-0">{viewDetail.moTa.bao_quan || "—"}</p></div>
                  <div className="col-md-3"><strong className="small">Cảnh báo:</strong><p className="small text-muted mb-0">{viewDetail.moTa.canh_bao || "—"}</p></div>
                </div>
              ) : (
                <EmptyState title="Chưa có mô tả chi tiết" desc="Thuốc này chưa được bổ sung thông tin mô tả." />
              )}
            </div>
          )
        )}
      </Modal>

      <ConfirmModal
        show={!!deleteTarget}
        title="Xóa thuốc"
        message={`Bạn có chắc chắn muốn xóa "${deleteTarget ? pickFirst(deleteTarget, ["ten_thuoc"], "") : ""}" khỏi hệ thống?`}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}

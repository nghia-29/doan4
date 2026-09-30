"use client";

import { LOAI_THUOC } from "@/lib/constants";

export default function ThuocForm({
  values,
  onChange,
  danhMucOptions = [],
  nhaCungCapOptions = [],
  lockLoaiThuoc,
  errors = {},
}) {
  const set = (name, value) => onChange({ ...values, [name]: value });

  return (
    <div>
      <h6 className="fw-bold text-brand mb-3">
        <i className="bi bi-info-circle me-1" /> Thông tin cơ bản
      </h6>
      <div className="row g-3 mb-4">
        <div className="col-12">
          <label className="form-label small fw-semibold">
            Tên thuốc <span className="text-danger">*</span>
          </label>
          <input
            className={`form-control ${errors.ten_thuoc ? "is-invalid" : ""}`}
            value={values.ten_thuoc || ""}
            onChange={(e) => set("ten_thuoc", e.target.value)}
            placeholder="VD: Paracetamol 500mg"
          />
          {errors.ten_thuoc && <div className="invalid-feedback d-block">{errors.ten_thuoc}</div>}
        </div>

        <div className="col-md-6">
          <label className="form-label small fw-semibold">Danh mục</label>
          <select
            className="form-select"
            value={values.id_danh_muc || ""}
            onChange={(e) => set("id_danh_muc", e.target.value)}
          >
            <option value="">-- Chọn danh mục --</option>
            {danhMucOptions.map((d) => (
              <option key={d.id} value={d.id}>
                {d.ten_danh_muc}
              </option>
            ))}
          </select>
        </div>

        <div className="col-md-6">
          <label className="form-label small fw-semibold">Nhà cung cấp</label>
          <select
            className="form-select"
            value={values.id_nha_cung_cap || ""}
            onChange={(e) => set("id_nha_cung_cap", e.target.value)}
          >
            <option value="">-- Chọn nhà cung cấp --</option>
            {nhaCungCapOptions.map((n) => (
              <option key={n.id} value={n.id}>
                {n.ten_nha_cung_cap}
              </option>
            ))}
          </select>
        </div>

        <div className="col-md-6">
          <label className="form-label small fw-semibold">
            Loại thuốc <span className="text-danger">*</span>
          </label>
          <select
            className="form-select"
            value={values.loai_ke_don || ""}
            disabled={!!lockLoaiThuoc}
            onChange={(e) => set("loai_ke_don", e.target.value)}
          >
            <option value="">-- Chọn loại --</option>
            <option value={LOAI_THUOC.THUONG}>Thuốc thường (bán trực tiếp)</option>
            <option value={LOAI_THUOC.DON}>Thuốc đơn đặt (cần đơn thuốc)</option>
          </select>
          {lockLoaiThuoc && (
            <div className="form-text">Đã cố định loại thuốc theo trang quản lý hiện tại.</div>
          )}
        </div>

        <div className="col-md-6">
          <label className="form-label small fw-semibold">Đơn vị tính</label>
          <input
            className="form-control"
            value={values.don_vi_tinh || ""}
            onChange={(e) => set("don_vi_tinh", e.target.value)}
            placeholder="VD: Hộp, Vỉ, Chai"
          />
        </div>

        <div className="col-md-4">
          <label className="form-label small fw-semibold">
            Giá bán (₫) <span className="text-danger">*</span>
          </label>
          <input
            type="number"
            min="0"
            className={`form-control ${errors.gia_ban ? "is-invalid" : ""}`}
            value={values.gia_ban ?? ""}
            onChange={(e) => set("gia_ban", e.target.value)}
          />
          {errors.gia_ban && <div className="invalid-feedback d-block">{errors.gia_ban}</div>}
        </div>

        <div className="col-md-4">
          <label className="form-label small fw-semibold">
            Số lượng tồn <span className="text-danger">*</span>
          </label>
          <input
            type="number"
            min="0"
            className={`form-control ${errors.so_luong_ton ? "is-invalid" : ""}`}
            value={values.so_luong_ton ?? ""}
            onChange={(e) => set("so_luong_ton", e.target.value)}
          />
          {errors.so_luong_ton && <div className="invalid-feedback d-block">{errors.so_luong_ton}</div>}
        </div>

        <div className="col-md-4">
          <label className="form-label small fw-semibold">Hạn sử dụng</label>
          <input
            type="date"
            className="form-control"
            value={values.han_su_dung || ""}
            onChange={(e) => set("han_su_dung", e.target.value)}
          />
        </div>
      </div>

      <h6 className="fw-bold text-brand mb-3">
        <i className="bi bi-file-text me-1" /> Mô tả chi tiết
      </h6>
      <div className="row g-3 mb-4">
        <div className="col-md-6">
          <label className="form-label small fw-semibold">Thành phần</label>
          <textarea
            className="form-control"
            rows={2}
            value={values.thanh_phan || ""}
            onChange={(e) => set("thanh_phan", e.target.value)}
          />
        </div>
        <div className="col-md-6">
          <label className="form-label small fw-semibold">Công dụng</label>
          <textarea
            className="form-control"
            rows={2}
            value={values.cong_dung || ""}
            onChange={(e) => set("cong_dung", e.target.value)}
          />
        </div>
        <div className="col-md-6">
          <label className="form-label small fw-semibold">Hướng dẫn sử dụng</label>
          <textarea
            className="form-control"
            rows={2}
            value={values.huong_dan_su_dung || ""}
            onChange={(e) => set("huong_dan_su_dung", e.target.value)}
          />
        </div>
        <div className="col-md-3">
          <label className="form-label small fw-semibold">Bảo quản</label>
          <textarea
            className="form-control"
            rows={2}
            value={values.bao_quan || ""}
            onChange={(e) => set("bao_quan", e.target.value)}
          />
        </div>
        <div className="col-md-3">
          <label className="form-label small fw-semibold">Cảnh báo</label>
          <textarea
            className="form-control"
            rows={2}
            value={values.canh_bao || ""}
            onChange={(e) => set("canh_bao", e.target.value)}
          />
        </div>
      </div>

      <h6 className="fw-bold text-brand mb-3">
        <i className="bi bi-image me-1" /> Hình ảnh
      </h6>
      <div className="row g-3">
        <div className="col-md-8">
          <label className="form-label small fw-semibold">Đường dẫn hình ảnh (URL)</label>
          <input
            className="form-control"
            value={values.hinh_anh || ""}
            onChange={(e) => set("hinh_anh", e.target.value)}
            placeholder="https://..."
          />
          <div className="form-text">Dán URL ảnh sản phẩm (lưu vào bảng anh_thuoc).</div>
        </div>
        <div className="col-md-4">
          {values.hinh_anh ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={values.hinh_anh}
              alt="preview"
              className="rounded border w-100"
              style={{ height: 90, objectFit: "cover" }}
              onError={(e) => (e.currentTarget.style.display = "none")}
            />
          ) : (
            <div className="rounded border w-100 d-flex align-items-center justify-content-center text-muted bg-light" style={{ height: 90 }}>
              <i className="bi bi-image fs-4" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

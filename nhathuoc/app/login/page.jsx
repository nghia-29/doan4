"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getHomeForRole } from "@/lib/constants";

export default function LoginPage() {
  const { login, user, loading } = useAuth();
  const router = useRouter();
  const [tenDangNhap, setTenDangNhap] = useState("");
  const [matKhau, setMatKhau] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) router.replace(getHomeForRole(user.vai_tro));
  }, [loading, router, user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!tenDangNhap || !matKhau) {
      setError("Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.");
      return;
    }
    setBusy(true);
    try {
      const sessionUser = await login(tenDangNhap, matKhau);
      router.replace(getHomeForRole(sessionUser.vai_tro));
    } catch (err) {
      setError(err?.message || "Đăng nhập thất bại.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login-shell">
      <div className="login-card">
        <div className="text-center mb-4">
          <div
            className="mx-auto mb-3 d-flex align-items-center justify-content-center rounded-3"
            style={{ width: 56, height: 56, background: "#e3f5f2" }}
          >
            <i className="bi bi-capsule-pill fs-3 text-brand" />
          </div>
          <h4 className="fw-bold mb-0" style={{ color: "#123934" }}>Nhà Thuốc Admin</h4>
          <p className="text-muted small mb-0">Đăng nhập để quản lý hệ thống nhà thuốc</p>
        </div>

        {error && (
          <div className="alert alert-danger py-2 small d-flex align-items-center">
            <i className="bi bi-exclamation-triangle-fill me-2" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label small fw-semibold">Tên đăng nhập</label>
            <div className="input-group">
              <span className="input-group-text bg-white"><i className="bi bi-person" /></span>
              <input
                className="form-control"
                value={tenDangNhap}
                onChange={(e) => setTenDangNhap(e.target.value)}
                placeholder="Nhập tên đăng nhập"
                autoFocus
              />
            </div>
          </div>
          <div className="mb-3">
            <label className="form-label small fw-semibold">Mật khẩu</label>
            <div className="input-group">
              <span className="input-group-text bg-white"><i className="bi bi-lock" /></span>
              <input
                type={showPass ? "text" : "password"}
                className="form-control"
                value={matKhau}
                onChange={(e) => setMatKhau(e.target.value)}
                placeholder="Nhập mật khẩu"
              />
              <button type="button" className="btn btn-outline-secondary" onClick={() => setShowPass((v) => !v)}>
                <i className={`bi ${showPass ? "bi-eye-slash" : "bi-eye"}`} />
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-brand w-100 py-2 fw-semibold" disabled={busy}>
            {busy && <span className="spinner-border spinner-border-sm me-2" />}
            Đăng nhập
          </button>
        </form>

        <p className="text-center text-muted mt-4 mb-0" style={{ fontSize: "0.75rem" }}>
          Đăng nhập bằng tài khoản trong bảng <code>tai_khoan</code> của hệ thống.
        </p>
      </div>
    </div>
  );
}

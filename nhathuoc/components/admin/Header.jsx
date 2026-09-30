"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { getVaiTroLabel } from "@/lib/constants";

export default function Header({ onToggleSidebar }) {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const initials = (user?.ten_dang_nhap || "AD").slice(0, 2).toUpperCase();

  return (
    <header className="admin-header">
      <div className="d-flex align-items-center gap-3">
        <button className="btn btn-light d-lg-none" onClick={onToggleSidebar}>
          <i className="bi bi-list fs-5" />
        </button>
        <div className="d-none d-md-flex align-items-center text-muted small">
          <i className="bi bi-shop me-2" />
          Hệ thống quản lý Nhà Thuốc
        </div>
      </div>

      <div className="d-flex align-items-center gap-3">
        <button className="btn btn-light position-relative">
          <i className="bi bi-bell" />
        </button>

        <div className="position-relative" ref={ref}>
          <button
            className="btn btn-light d-flex align-items-center gap-2"
            onClick={() => setOpen((v) => !v)}
          >
            <span className="avatar-circle">{initials}</span>
            <span className="d-none d-sm-flex flex-column text-start" style={{ lineHeight: 1.1 }}>
              <span className="small fw-semibold">{user?.ten_dang_nhap || "Quản trị viên"}</span>
              <span className="text-muted" style={{ fontSize: "0.7rem" }}>
                {getVaiTroLabel(user?.vai_tro)}
              </span>
            </span>
            <i className="bi bi-chevron-down small text-muted" />
          </button>

          {open && (
            <div
              className="pm-card position-absolute end-0 mt-2 py-2"
              style={{ minWidth: 200, zIndex: 1040 }}
            >
              <div className="px-3 pb-2 mb-1 border-bottom">
                <div className="fw-semibold small">{user?.ten_dang_nhap}</div>
                <div className="text-muted" style={{ fontSize: "0.75rem" }}>{user?.email || "—"}</div>
              </div>
              <button className="dropdown-item-btn btn w-100 text-start px-3 py-2 text-danger" onClick={logout}>
                <i className="bi bi-box-arrow-right me-2" />
                Đăng xuất
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { isStaffRole, STAFF_MENU_GROUPS } from "@/lib/constants";
import Sidebar from "./Sidebar";
import Header from "./Header";

export default function AdminLayout({ children, title, subtitle, actions, menuGroups }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useAuth();
  const visibleMenuGroups = menuGroups || (isStaffRole(user?.vai_tro) ? STAFF_MENU_GROUPS : undefined);

  return (
    <div className="admin-shell">
      {mobileOpen && (
        <div
          className="d-lg-none"
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.4)", zIndex: 1025 }}
          onClick={() => setMobileOpen(false)}
        />
      )}
      <Sidebar mobileOpen={mobileOpen} onNavigate={() => setMobileOpen(false)} menuGroups={visibleMenuGroups} />
      <div className="admin-main">
        <Header onToggleSidebar={() => setMobileOpen((v) => !v)} />
        <main className="admin-content">
          {(title || actions) && (
            <div className="d-flex flex-wrap align-items-start justify-content-between gap-2 mb-3">
              <div>
                {title && <h1 className="page-title">{title}</h1>}
                {subtitle && <p className="page-subtitle mb-0">{subtitle}</p>}
              </div>
              {actions && <div className="d-flex gap-2 flex-wrap">{actions}</div>}
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}

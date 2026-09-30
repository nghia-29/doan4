"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MENU_GROUPS } from "@/lib/constants";

export default function Sidebar({ mobileOpen, onNavigate, menuGroups = MENU_GROUPS }) {
  const pathname = usePathname();

  const isActive = (href) => {
    const path = href.split("?")[0];
    if (path === "/admin") return pathname === "/admin";
    return pathname === path || pathname.startsWith(path + "/");
  };

  return (
    <aside className={`admin-sidebar ${mobileOpen ? "mobile-open" : ""}`}>
      <div className="sidebar-brand">
        <div className="logo-badge">
          <i className="bi bi-capsule-pill" />
        </div>
        <div className="brand-text">
          <strong>Nhà Thuốc</strong>
          <span>Hệ thống quản trị</span>
        </div>
      </div>

      <nav className="pb-4">
        {menuGroups.map((group) => (
          <div key={group.title}>
            <p className="sidebar-group-title">{group.title}</p>
            {group.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={`sidebar-link ${isActive(item.href) ? "active" : ""}`}
              >
                <i className={`bi ${item.icon}`} />
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        ))}
      </nav>
    </aside>
  );
}

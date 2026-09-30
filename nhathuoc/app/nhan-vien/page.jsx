"use client";

import Link from "next/link";
import AdminLayout from "@/components/admin/AdminLayout";
import StatCard from "@/components/admin/StatCard";
import { STAFF_MENU_GROUPS } from "@/lib/constants";

const shortcuts = [
  { href: "/admin/thuoc", icon: "bi-capsule", title: "Tra cứu thuốc", desc: "Kiểm tra giá và tồn kho" },
  { href: "/admin/danh-muc-thuoc", icon: "bi-tags", title: "Danh mục thuốc", desc: "Quản lý nhóm sản phẩm" },
  { href: "/admin/nha-cung-cap", icon: "bi-truck", title: "Nhà cung cấp", desc: "Cập nhật thông tin đối tác" },
  { href: "/admin/khach-hang", icon: "bi-people", title: "Khách hàng", desc: "Tra cứu thông tin khách hàng" },
];

export default function StaffDashboardPage() {
  return (
    <AdminLayout
      title="Khu vực nhân viên"
      subtitle="Các nghiệp vụ vận hành được phân quyền cho nhân viên nhà thuốc"
      menuGroups={STAFF_MENU_GROUPS}
    >
      <div className="row g-3 mb-4">
        <div className="col-6 col-lg-3"><StatCard icon="bi-capsule" label="Kho thuốc" value="Tra cứu" color="teal" /></div>
        <div className="col-6 col-lg-3"><StatCard icon="bi-tags" label="Danh mục" value="Cơ bản" color="blue" /></div>
        <div className="col-6 col-lg-3"><StatCard icon="bi-truck" label="Nhà cung cấp" value="Cơ bản" color="green" /></div>
        <div className="col-6 col-lg-3"><StatCard icon="bi-people" label="Khách hàng" value="Tra cứu" color="amber" /></div>
      </div>

      <div className="row g-3">
        {shortcuts.map((item) => (
          <div className="col-12 col-md-6" key={item.href}>
            <Link href={item.href} className="pm-card p-4 h-100 d-flex align-items-center gap-3 text-decoration-none">
              <span className="rounded-3 d-flex align-items-center justify-content-center bg-brand-soft text-brand" style={{ width: 48, height: 48 }}>
                <i className={`bi ${item.icon} fs-4`} />
              </span>
              <span>
                <strong className="d-block" style={{ color: "#123934" }}>{item.title}</strong>
                <span className="text-muted small">{item.desc}</span>
              </span>
              <i className="bi bi-chevron-right ms-auto text-muted" />
            </Link>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
}
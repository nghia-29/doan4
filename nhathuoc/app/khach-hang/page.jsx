"use client";

import Link from "next/link";
import StoreHeader from "@/components/store/StoreHeader";
import StoreFooter from "@/components/store/StoreFooter";
import { useAuth } from "@/context/AuthContext";

export default function CustomerPage() {
  const { user, logout } = useAuth();
  return <div className="store-shell"><StoreHeader query="" onQueryChange={() => {}} /><main className="container py-5"><div className="customer-welcome"><span className="store-kicker text-brand">TÀI KHOẢN CỦA BẠN</span><h1>Xin chào, {user?.ten_dang_nhap}</h1><p>Quản lý giỏ hàng và theo dõi hành trình chăm sóc sức khỏe của bạn.</p><div className="d-flex gap-2 flex-wrap"><Link href="/gio-hang" className="btn btn-brand">Mở giỏ hàng</Link><button className="btn btn-outline-brand" onClick={logout}>Đăng xuất</button></div></div></main><StoreFooter /></div>;
}
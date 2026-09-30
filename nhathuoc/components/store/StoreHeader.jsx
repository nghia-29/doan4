"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function StoreHeader({ query, onQueryChange }) {
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const update = () => setCartCount(JSON.parse(localStorage.getItem("nhathuoc_cart") || "[]").reduce((sum, item) => sum + item.quantity, 0));
    update();
    window.addEventListener("storage", update);
    return () => window.removeEventListener("storage", update);
  }, []);

  return <header className="store-header"><div className="container"><div className="d-flex align-items-center gap-3"><Link href="/" className="store-brand"><span><i className="bi bi-capsule-pill" /></span><strong>Nhà Thuốc<br /><em>An Tâm</em></strong></Link><div className="store-search flex-grow-1"><i className="bi bi-search" /><input value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="Tìm tên thuốc hoặc mã sản phẩm..." /></div><Link href="/gio-hang" className="store-icon-link" aria-label="Giỏ hàng"><i className="bi bi-bag" /><b>{cartCount}</b></Link><Link href="/login" className="store-account"><i className="bi bi-person-circle" /><span>Tài khoản</span></Link></div><nav className="store-nav"><Link href="/">Trang chủ</Link><Link href="/san-pham">Sản phẩm</Link><Link href="/gioi-thieu">Giới thiệu</Link><Link href="/cam-ket">Cam kết chất lượng</Link><Link href="/lien-he">Liên hệ</Link><Link href="/gio-hang" className="nav-cart"><i className="bi bi-bag me-1" />Giỏ hàng ({cartCount})</Link></nav></div></header>;
}
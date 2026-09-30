"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import StoreHeader from "@/components/store/StoreHeader";
import StoreFooter from "@/components/store/StoreFooter";
import { formatCurrency } from "@/lib/format";

export default function CartPage() {
  const [cart, setCart] = useState([]);
  useEffect(() => setCart(JSON.parse(localStorage.getItem("nhathuoc_cart") || "[]")), []);
  const save = (next) => { setCart(next); localStorage.setItem("nhathuoc_cart", JSON.stringify(next)); };
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return <div className="store-shell"><StoreHeader query="" onQueryChange={() => {}} /><main className="container py-5"><div className="d-flex justify-content-between align-items-end mb-4"><div><span className="store-kicker text-brand">MUA SẮM AN TÂM</span><h1 className="store-section-title">Giỏ hàng của bạn</h1></div><Link href="/" className="text-brand">Tiếp tục mua sắm <i className="bi bi-arrow-right ms-1" /></Link></div>{cart.length === 0 ? <div className="store-empty"><i className="bi bi-bag" /><p>Giỏ hàng đang trống.</p><Link href="/" className="btn btn-brand">Xem sản phẩm</Link></div> : <div className="row g-4"><div className="col-lg-8">{cart.map((item) => <div className="cart-row" key={item.id}><div className="cart-product"><i className="bi bi-capsule" /><div><strong>{item.name}</strong><small>{formatCurrency(item.price)} / {item.unit || "sản phẩm"}</small></div></div><div className="cart-quantity"><button onClick={() => item.quantity > 1 ? save(cart.map((row) => row.id === item.id ? { ...row, quantity: row.quantity - 1 } : row)) : save(cart.filter((row) => row.id !== item.id))}>−</button><span>{item.quantity}</span><button onClick={() => save(cart.map((row) => row.id === item.id ? { ...row, quantity: row.quantity + 1 } : row))}>+</button></div><strong>{formatCurrency(item.price * item.quantity)}</strong></div>)}</div><div className="col-lg-4"><div className="cart-summary"><h5>Tóm tắt đơn hàng</h5><div className="d-flex justify-content-between"><span>Tạm tính</span><strong>{formatCurrency(total)}</strong></div><hr /><div className="d-flex justify-content-between fs-5"><strong>Tổng cộng</strong><strong className="text-brand">{formatCurrency(total)}</strong></div><Link href="/login" className="btn btn-brand w-100 mt-4">Đăng nhập để đặt hàng</Link><small className="text-muted d-block mt-3">Bạn cần đăng nhập để lưu đơn hàng và theo dõi giao hàng.</small></div></div></div>}</main><StoreFooter /></div>;
}
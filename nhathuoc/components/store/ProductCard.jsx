"use client";

import Link from "next/link";
import { formatCurrency } from "@/lib/format";

export default function ProductCard({ product, image }) {
  const addToCart = () => {
    const cart = JSON.parse(localStorage.getItem("nhathuoc_cart") || "[]");
    const existing = cart.find((item) => String(item.id) === String(product.id));
    if (existing) existing.quantity += 1;
    else cart.push({ id: product.id, name: product.ten_thuoc, price: Number(product.gia_ban) || 0, quantity: 1, unit: product.don_vi_tinh });
    localStorage.setItem("nhathuoc_cart", JSON.stringify(cart));
    window.dispatchEvent(new Event("storage"));
  };

  return <article className="product-card"><Link href={`/san-pham/${product.id}`} className="product-image">{image?.duong_dan_anh ? <img src={image.duong_dan_anh} alt={product.ten_thuoc} onError={(event) => { event.currentTarget.style.display = "none"; }} /> : <i className="bi bi-capsule" />}</Link><div className="p-3"><small>{product.loai_ke_don === "ke_don" ? "Thuốc kê đơn" : "Thuốc không kê đơn"}</small><Link href={`/san-pham/${product.id}`} className="product-name">{product.ten_thuoc}</Link><div className="d-flex justify-content-between align-items-end gap-2 mt-3"><strong className="product-price">{formatCurrency(product.gia_ban)}</strong><button className="btn btn-brand btn-sm rounded-circle product-add" onClick={addToCart} aria-label="Thêm vào giỏ"><i className="bi bi-plus-lg" /></button></div></div></article>;
}
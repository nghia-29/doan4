"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import StoreHeader from "@/components/store/StoreHeader";
import StoreFooter from "@/components/store/StoreFooter";
import Loading from "@/components/admin/Loading";
import thuocService from "@/services/thuocService";
import moTaThuocService from "@/services/moTaThuocService";
import anhThuocService from "@/services/anhThuocService";
import { formatCurrency } from "@/lib/format";

export default function ProductDetailPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [description, setDescription] = useState(null);
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([thuocService.getById(id), moTaThuocService.getById(id).catch(() => null), anhThuocService.getAll().catch(() => [])]).then(([item, detail, images]) => { setProduct(item); setDescription(detail); setImage((images || []).find((itemImage) => String(itemImage.id_thuoc) === String(id))); }).finally(() => setLoading(false));
  }, [id]);

  const addToCart = () => {
    const cart = JSON.parse(localStorage.getItem("nhathuoc_cart") || "[]");
    const existing = cart.find((item) => String(item.id) === String(product.id));
    if (existing) existing.quantity += 1;
    else cart.push({ id: product.id, name: product.ten_thuoc, price: Number(product.gia_ban) || 0, quantity: 1, unit: product.don_vi_tinh });
    localStorage.setItem("nhathuoc_cart", JSON.stringify(cart));
    window.dispatchEvent(new Event("storage"));
  };

  return <div className="store-shell"><StoreHeader query="" onQueryChange={() => {}} /><main className="container py-5">{loading ? <Loading label="Đang tải thông tin sản phẩm..." /> : !product ? <div className="store-empty">Không tìm thấy sản phẩm.</div> : <><Link href="/" className="text-brand small"><i className="bi bi-arrow-left me-1" />Quay lại cửa hàng</Link><div className="row g-5 mt-1"><div className="col-md-5"><div className="detail-image">{image?.duong_dan_anh ? <img src={image.duong_dan_anh} alt={product.ten_thuoc} /> : <i className="bi bi-capsule" />}</div></div><div className="col-md-7"><span className="store-kicker text-brand">{product.loai_ke_don === "ke_don" ? "THUỐC KÊ ĐƠN" : "THUỐC KHÔNG KÊ ĐƠN"}</span><h1 className="detail-title">{product.ten_thuoc}</h1><div className="detail-price">{formatCurrency(product.gia_ban)} <small>/ {product.don_vi_tinh || "sản phẩm"}</small></div><p className="text-muted">Mã sản phẩm: {product.ma_sku || `SP-${product.id}`} · Còn {product.so_luong_ton || 0} sản phẩm</p><button className="btn btn-brand px-4 py-2" onClick={addToCart}><i className="bi bi-bag-plus me-2" />Thêm vào giỏ hàng</button><div className="detail-copy mt-5"><h5>Công dụng</h5><p>{description?.cong_dung || "Thông tin đang được cập nhật."}</p><h5>Hướng dẫn sử dụng</h5><p>{description?.huong_dan_su_dung || "Vui lòng đọc kỹ hướng dẫn hoặc hỏi ý kiến dược sĩ."}</p><h5>Cảnh báo</h5><p>{description?.canh_bao || "Không tự ý sử dụng thuốc kê đơn khi chưa có chỉ định."}</p></div></div></div></>}</main><StoreFooter /></div>;
}
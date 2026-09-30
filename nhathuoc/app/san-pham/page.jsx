"use client";

import { useEffect, useState } from "react";
import StoreHeader from "@/components/store/StoreHeader";
import ProductCard from "@/components/store/ProductCard";
import StoreFooter from "@/components/store/StoreFooter";
import Loading from "@/components/admin/Loading";
import thuocService from "@/services/thuocService";
import anhThuocService from "@/services/anhThuocService";

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [images, setImages] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => { Promise.all([thuocService.getAll(), anhThuocService.getAll().catch(() => [])]).then(([items, imageList]) => { setProducts(items || []); setImages(imageList || []); }).finally(() => setLoading(false)); }, []);
  const filtered = products.filter((product) => String(product.ten_thuoc || "").toLowerCase().includes(query.toLowerCase()) && Number(product.trang_thai ?? 1) === 1);
  return <div className="store-shell"><StoreHeader query={query} onQueryChange={setQuery} /><main className="container py-5"><span className="store-kicker text-brand">DANH MỤC SẢN PHẨM</span><h1 className="store-section-title mb-4">Tất cả sản phẩm</h1>{loading ? <Loading label="Đang tải sản phẩm..." /> : <div className="row g-4">{filtered.map((product) => <div className="col-12 col-sm-6 col-lg-3" key={product.id}><ProductCard product={product} image={images.find((item) => String(item.id_thuoc) === String(product.id))} /></div>)}</div>}</main><StoreFooter /></div>;
}
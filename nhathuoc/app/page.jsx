"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import StoreHeader from "@/components/store/StoreHeader";
import ProductCard from "@/components/store/ProductCard";
import StoreFooter from "@/components/store/StoreFooter";
import Loading from "@/components/admin/Loading";
import thuocService from "@/services/thuocService";
import danhMucThuocService from "@/services/danhMucThuocService";
import anhThuocService from "@/services/anhThuocService";
import { LOAI_THUOC } from "@/lib/constants";

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [images, setImages] = useState([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sort, setSort] = useState("featured");
  const [prescription, setPrescription] = useState("");
  const [stockOnly, setStockOnly] = useState(false);
  const [maxPrice, setMaxPrice] = useState(0);

  useEffect(() => {
    Promise.all([thuocService.getAll(), danhMucThuocService.getAll(), anhThuocService.getAll()])
      .then(([medicineList, categoryList, imageList]) => {
        setProducts(medicineList || []);
        setCategories(categoryList || []);
        setImages(imageList || []);
      })
      .catch(() => setError("Không thể tải danh sách thuốc. Hãy kiểm tra backend đang chạy."))
      .finally(() => setLoading(false));
  }, []);

  const filteredProducts = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const result = products.filter((product) => {
      const matchesQuery = !normalized || `${product.ten_thuoc} ${product.ma_sku || ""}`.toLowerCase().includes(normalized);
      const matchesCategory = !category || String(product.id_danh_muc) === String(category);
      const matchesPrescription = !prescription || product.loai_ke_don === prescription;
      const matchesStock = !stockOnly || Number(product.so_luong_ton || 0) > 0;
      const matchesPrice = !maxPrice || Number(product.gia_ban || 0) <= maxPrice;
      return matchesQuery && matchesCategory && matchesPrescription && matchesStock && matchesPrice && Number(product.trang_thai ?? 1) === 1;
    });
    return result.sort((a, b) => sort === "priceAsc" ? Number(a.gia_ban) - Number(b.gia_ban) : sort === "priceDesc" ? Number(b.gia_ban) - Number(a.gia_ban) : String(a.ten_thuoc).localeCompare(String(b.ten_thuoc), "vi"));
  }, [category, maxPrice, prescription, products, query, sort, stockOnly]);

  const priceCeiling = Math.max(...products.map((product) => Number(product.gia_ban) || 0), 100000);

  return (
    <div className="store-shell">
      <StoreHeader query={query} onQueryChange={setQuery} />
      <main>
        <section className="store-hero">
          <div className="container py-5">
            <div className="store-ad-copy"><span className="store-kicker">CHĂM SÓC SỨC KHỎE MỖI NGÀY</span><h1>Chăm sóc đúng cách,<br />an tâm mỗi ngày.</h1><p>Thuốc chính hãng, tư vấn tận tâm và giao hàng an toàn cho cả gia đình.</p><Link href="/san-pham" className="btn btn-light btn-lg px-4">Mua sắm ngay <i className="bi bi-arrow-right ms-2" /></Link></div>
          </div>
        </section>

        <section className="container py-5" id="san-pham">
            <div className="d-flex flex-wrap justify-content-between align-items-end gap-3 mb-4">
            <div><span className="store-kicker text-brand">DANH MỤC SẢN PHẨM</span><h2 className="store-section-title">Sản phẩm nổi bật</h2></div>
            <div className="d-flex gap-2 flex-wrap">
              <button className={`store-filter ${!category ? "active" : ""}`} onClick={() => setCategory("")}>Tất cả</button>
              {categories.map((item) => <button className={`store-filter ${String(category) === String(item.id) ? "active" : ""}`} key={item.id} onClick={() => setCategory(item.id)}>{item.ten_danh_muc}</button>)}
            </div>
          </div>
          <div className="store-filter-panel mb-4"><div className="filter-heading"><i className="bi bi-sliders me-2" />Bộ lọc sản phẩm <span>{filteredProducts.length} sản phẩm</span></div><div className="row g-3 align-items-end"><div className="col-12 col-md-3"><label>Loại thuốc</label><select className="form-select" value={prescription} onChange={(event) => setPrescription(event.target.value)}><option value="">Tất cả loại</option><option value="khong_ke_don">Không kê đơn</option><option value="ke_don">Kê đơn</option></select></div><div className="col-12 col-md-3"><label>Sắp xếp</label><select className="form-select" value={sort} onChange={(event) => setSort(event.target.value)}><option value="featured">Tên sản phẩm A-Z</option><option value="priceAsc">Giá thấp đến cao</option><option value="priceDesc">Giá cao đến thấp</option></select></div><div className="col-12 col-md-4"><label>Giá tối đa: {maxPrice ? `${maxPrice.toLocaleString("vi-VN")} ₫` : "Không giới hạn"}</label><input className="form-range" type="range" min="0" max={priceCeiling} step="5000" value={maxPrice || priceCeiling} onChange={(event) => setMaxPrice(Number(event.target.value) === priceCeiling ? 0 : Number(event.target.value))} /></div><div className="col-12 col-md-2"><label className="filter-check"><input type="checkbox" checked={stockOnly} onChange={(event) => setStockOnly(event.target.checked)} /> Còn hàng</label></div></div></div>
          {loading ? <Loading label="Đang tải sản phẩm..." /> : error ? <div className="store-empty"><i className="bi bi-wifi-off" /><p>{error}</p></div> : filteredProducts.length === 0 ? <div className="store-empty"><i className="bi bi-search" /><p>Không tìm thấy sản phẩm phù hợp.</p></div> : <div className="row g-4">{filteredProducts.map((product) => <div className="col-12 col-sm-6 col-lg-3" key={product.id}><ProductCard product={product} image={images.find((item) => String(item.id_thuoc) === String(product.id))} /></div>)}</div>}
        </section>

        <section className="store-story"><div className="container"><div className="row align-items-center g-5"><div className="col-lg-6"><span className="store-kicker text-brand">VỀ NHÀ THUỐC AN TÂM</span><h2 className="store-section-title">Một địa chỉ đáng tin cho cả gia đình.</h2><p>Chúng tôi chọn sự rõ ràng, tử tế và an toàn làm nền tảng cho từng sản phẩm.</p><Link href="/gioi-thieu" className="btn btn-outline-brand">Tìm hiểu về An Tâm <i className="bi bi-arrow-right ms-2" /></Link></div><div className="col-lg-6"><div className="story-panel"><i className="bi bi-shield-check" /><strong>Chăm sóc bằng sự tận tâm</strong><span>Đặt sức khỏe và trải nghiệm của bạn lên trước mỗi quyết định.</span></div></div></div></div></section>

        <section className="store-services"><div className="container"><div className="text-center mb-4"><span className="store-kicker text-brand">DỊCH VỤ CỦA CHÚNG TÔI</span><h2 className="store-section-title">Mọi điều bạn cần, trong một nơi</h2></div><div className="row g-3"><div className="col-md-4"><div className="service-card"><i className="bi bi-chat-heart" /><h5>Tư vấn sức khỏe</h5><p>Giải đáp cách dùng và lưu ý an toàn cùng dược sĩ.</p></div></div><div className="col-md-4"><div className="service-card"><i className="bi bi-box-seam" /><h5>Đóng gói cẩn thận</h5><p>Sản phẩm được kiểm tra trước khi gửi đến bạn.</p></div></div><div className="col-md-4"><div className="service-card"><i className="bi bi-clock-history" /><h5>Theo dõi đơn hàng</h5><p>Luôn nắm được tình trạng đơn từ lúc đặt đến khi nhận.</p></div></div></div><div className="text-center mt-4"><Link href="/cam-ket" className="btn btn-outline-brand">Xem đầy đủ cam kết <i className="bi bi-arrow-right ms-2" /></Link></div></div></section>

        <section className="store-contact"><div className="container"><div className="row g-4 align-items-center"><div className="col-lg-7"><span className="store-kicker">CẦN HỖ TRỢ?</span><h2>Đội ngũ An Tâm luôn sẵn sàng lắng nghe.</h2><p>Liên hệ để được tư vấn sản phẩm hoặc hỗ trợ đơn hàng của bạn.</p><Link href="/lien-he" className="btn btn-light">Liên hệ với chúng tôi <i className="bi bi-arrow-right ms-2" /></Link></div><div className="col-lg-5"><div className="contact-list"><span><i className="bi bi-telephone" /> 1900 6868</span><span><i className="bi bi-envelope" /> hello@nhathuocantam.vn</span><span><i className="bi bi-geo-alt" /> 123 Nguyễn Trãi, Quận 1, TP.HCM</span></div></div></div></div></section>

        <section className="store-trust"><div className="container"><div className="row g-4"><div className="col-md-4"><i className="bi bi-patch-check" /><strong>Sản phẩm chính hãng</strong><span>Nguồn gốc minh bạch, kiểm soát chất lượng.</span></div><div className="col-md-4"><i className="bi bi-person-hearts" /><strong>Tư vấn tận tâm</strong><span>Dược sĩ đồng hành trước và sau khi mua.</span></div><div className="col-md-4"><i className="bi bi-truck" /><strong>Giao hàng an toàn</strong><span>Đóng gói cẩn thận, giao tận nơi.</span></div></div></div></section>
      </main>
      <StoreFooter />
    </div>
  );
}

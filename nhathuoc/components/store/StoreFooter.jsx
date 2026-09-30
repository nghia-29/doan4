import Link from "next/link";

export default function StoreFooter() {
  return (
    <footer className="store-footer">
      <div className="container">
        <div className="store-footer-contact">
          <div>
            <span className="store-kicker">CẦN HỖ TRỢ?</span>
            <h3>Nhà Thuốc An Tâm luôn sẵn sàng đồng hành.</h3>
          </div>
          <div className="store-footer-details">
            <a href="tel:19006868"><i className="bi bi-telephone" />1900 6868</a>
            <a href="mailto:hello@nhathuocantam.vn"><i className="bi bi-envelope" />hello@nhathuocantam.vn</a>
            <span><i className="bi bi-geo-alt" />123 Nguyễn Trãi, Quận 1, TP.HCM</span>
            <span><i className="bi bi-clock" />08:00 - 21:00 mỗi ngày</span>
          </div>
        </div>
        <div className="store-footer-bottom">
          <span>© 2026 Nhà Thuốc An Tâm</span>
          <div><Link href="/gioi-thieu">Giới thiệu</Link><Link href="/cam-ket">Cam kết chất lượng</Link><Link href="/lien-he">Liên hệ</Link></div>
        </div>
      </div>
    </footer>
  );
}
"use client";

import Link from "next/link";
import StoreHeader from "./StoreHeader";
import StoreFooter from "./StoreFooter";

export default function InfoPage({ type }) {
  const content = {
    about: { kicker: "VỀ NHÀ THUỐC AN TÂM", title: "Một địa chỉ đáng tin cho cả gia đình.", text: "An Tâm được xây dựng với mong muốn đưa trải nghiệm mua thuốc trở nên rõ ràng, thuận tiện và an toàn hơn. Chúng tôi chọn sản phẩm có nguồn gốc minh bạch và luôn đặt tư vấn đúng cách lên hàng đầu." },
    quality: { kicker: "CAM KẾT CHẤT LƯỢNG", title: "Mỗi sản phẩm đều được chọn bằng trách nhiệm.", text: "Từ khâu nhập hàng, bảo quản đến đóng gói, An Tâm duy trì quy trình kiểm tra chặt chẽ. Với thuốc kê đơn, chúng tôi luôn nhắc khách hàng tuân thủ hướng dẫn của bác sĩ và dược sĩ." },
    contact: { kicker: "LIÊN HỆ", title: "Đội ngũ An Tâm luôn sẵn sàng lắng nghe.", text: "Bạn cần tư vấn sản phẩm, kiểm tra đơn hàng hay hỗ trợ sau mua? Hãy kết nối với chúng tôi qua các kênh dưới đây." },
  }[type];

  return <div className="store-shell"><StoreHeader query="" onQueryChange={() => {}} /><main className="info-page"><div className="container"><span className="store-kicker text-brand">{content.kicker}</span><h1>{content.title}</h1><p className="info-lead">{content.text}</p>{type === "about" ? <AboutContent /> : type === "quality" ? <QualityContent /> : <ContactContent />}<Link href="/san-pham" className="btn btn-brand mt-5">Xem sản phẩm <i className="bi bi-arrow-right ms-2" /></Link></div></main><StoreFooter /></div>;
}

function AboutContent() {
  return <>
    <div className="info-stats row g-3 mt-4 mb-5"><div className="col-6 col-lg-3"><strong>100%</strong><span>Nguồn gốc rõ ràng</span></div><div className="col-6 col-lg-3"><strong>08:00-21:00</strong><span>Thời gian phục vụ</span></div><div className="col-6 col-lg-3"><strong>24/7</strong><span>Đặt hàng trực tuyến</span></div><div className="col-6 col-lg-3"><strong>1 đội ngũ</strong><span>Luôn đồng hành cùng bạn</span></div></div>
    <section className="info-section"><div><span className="store-kicker text-brand">CÂU CHUYỆN AN TÂM</span><h2>Nhà thuốc bắt đầu từ một điều giản dị: giúp mọi người hiểu đúng về thuốc.</h2><p>Chúng tôi tin rằng mua thuốc không chỉ là chọn một sản phẩm trên kệ. Đó còn là việc được lắng nghe, được hướng dẫn rõ ràng và được nhắc nhở về những điều cần lưu ý. Vì vậy, An Tâm xây dựng trải nghiệm mua sắm thân thiện, dễ hiểu và có trách nhiệm.</p><p>Từ thuốc không kê đơn, thực phẩm chăm sóc sức khỏe đến thuốc kê đơn, chúng tôi luôn khuyến khích khách hàng đọc kỹ thông tin và tham khảo chuyên môn khi cần.</p></div><div className="info-quote"><i className="bi bi-quote" /><strong>Đúng sản phẩm.<br />Đúng hướng dẫn.<br />Đúng sự an tâm.</strong></div></section>
    <section className="info-section info-section-light"><div><span className="store-kicker text-brand">GIÁ TRỊ CỐT LÕI</span><h2>Ba nguyên tắc trong mọi trải nghiệm.</h2></div><div className="value-list"><article><i className="bi bi-eye" /><div><h5>Rõ ràng</h5><p>Thông tin sản phẩm, giá bán và hướng dẫn được trình bày dễ kiểm tra.</p></div></article><article><i className="bi bi-heart" /><div><h5>Tử tế</h5><p>Không tư vấn quá nhu cầu, không khuyến khích tự dùng thuốc thiếu an toàn.</p></div></article><article><i className="bi bi-shield-check" /><div><h5>Trách nhiệm</h5><p>Luôn đặt chất lượng, bảo quản và quyền lợi khách hàng lên trước.</p></div></article></div></section>
    <section className="info-process"><span className="store-kicker text-brand">CÁCH CHÚNG TÔI PHỤC VỤ</span><h2>Từ kho hàng đến tận tay bạn.</h2><div className="process-grid"><div><b>01</b><h5>Chọn lọc</h5><p>Nhập sản phẩm từ nhà cung cấp có thông tin minh bạch.</p></div><div><b>02</b><h5>Kiểm tra</h5><p>Đối chiếu số lượng, lô hàng và hạn sử dụng khi nhập kho.</p></div><div><b>03</b><h5>Tư vấn</h5><p>Hỗ trợ bạn hiểu cách dùng và những lưu ý quan trọng.</p></div><div><b>04</b><h5>Đồng hành</h5><p>Tiếp nhận phản hồi và hỗ trợ sau khi bạn nhận hàng.</p></div></div></section>
  </>;
}

function QualityContent() {
  return <>
    <section className="info-section"><div><span className="store-kicker text-brand">TIÊU CHUẨN SẢN PHẨM</span><h2>Chất lượng không chỉ nằm ở nhãn hiệu.</h2><p>Mỗi sản phẩm được đưa lên hệ thống đều gắn với thông tin cơ bản như mã SKU, danh mục, nhà cung cấp, đơn vị tính và hạn sử dụng. Điều này giúp việc tra cứu và quản lý sản phẩm rõ ràng hơn.</p></div><div className="quality-checklist"><span><i className="bi bi-check-circle-fill" />Có thông tin nguồn gốc</span><span><i className="bi bi-check-circle-fill" />Theo dõi hạn sử dụng</span><span><i className="bi bi-check-circle-fill" />Bảo quản theo hướng dẫn</span><span><i className="bi bi-check-circle-fill" />Kiểm tra trước khi giao</span></div></section>
    <section className="info-section info-section-light"><div><span className="store-kicker text-brand">TƯ VẤN THUỐC KÊ ĐƠN</span><h2>An toàn bắt đầu từ việc dùng thuốc đúng.</h2><p>Với thuốc kê đơn, An Tâm luôn nhắc khách hàng chuẩn bị đơn thuốc hợp lệ và tuân thủ chỉ định của bác sĩ. Không tự ý tăng liều, giảm liều hoặc ngừng thuốc khi chưa được tư vấn.</p></div><div className="warning-panel"><i className="bi bi-exclamation-triangle" /><strong>Thông tin quan trọng</strong><span>Nội dung trên website chỉ mang tính tham khảo, không thay thế chẩn đoán hoặc chỉ định y khoa.</span></div></section>
    <section className="info-process"><span className="store-kicker text-brand">CAM KẾT DỊCH VỤ</span><h2>Bạn luôn biết đơn hàng đang ở đâu.</h2><div className="process-grid"><div><b><i className="bi bi-box-seam" /></b><h5>Đóng gói</h5><p>Đối chiếu sản phẩm trước khi đóng gói.</p></div><div><b><i className="bi bi-truck" /></b><h5>Giao hàng</h5><p>Thông tin giao hàng được ghi nhận đầy đủ.</p></div><div><b><i className="bi bi-chat-left-text" /></b><h5>Hỗ trợ</h5><p>Tiếp nhận câu hỏi trong suốt quá trình mua.</p></div><div><b><i className="bi bi-arrow-repeat" /></b><h5>Phản hồi</h5><p>Ghi nhận và xử lý góp ý minh bạch.</p></div></div></section>
  </>;
}

function ContactContent() {
  return <><div className="contact-detail"><span><i className="bi bi-telephone" />1900 6868</span><span><i className="bi bi-envelope" />hello@nhathuocantam.vn</span><span><i className="bi bi-clock" />08:00 - 21:00 mỗi ngày</span><span><i className="bi bi-geo-alt" />123 Nguyễn Trãi, Quận 1, TP.HCM</span></div><section className="info-section mt-5"><div><span className="store-kicker text-brand">HỖ TRỢ NHANH</span><h2>Chúng tôi có thể giúp gì cho bạn?</h2></div><div className="value-list"><article><i className="bi bi-capsule" /><div><h5>Tư vấn sản phẩm</h5><p>Hỏi về công dụng, cách dùng và lưu ý khi sử dụng.</p></div></article><article><i className="bi bi-receipt" /><div><h5>Tra cứu đơn hàng</h5><p>Cung cấp mã đơn để đội ngũ kiểm tra nhanh hơn.</p></div></article></div></section></>;
}
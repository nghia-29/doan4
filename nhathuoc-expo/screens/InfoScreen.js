import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import StoreHeader from '../components/StoreHeader';
import { useCart } from '../context/CartContext';

const content = {
  about: {
    kicker: 'VỀ NHÀ THUỐC AN TÂM',
    title: 'Chăm sóc sức khỏe bằng sự tận tâm và thấu hiểu.',
    text: 'Nhà Thuốc An Tâm hướng đến trải nghiệm chăm sóc sức khỏe gần gũi, rõ ràng và thuận tiện. Từ lúc tìm hiểu sản phẩm đến khi cần hỏi về cách sử dụng, chúng tôi mong mỗi khách hàng đều nhận được thông tin dễ hiểu và sự hỗ trợ chu đáo.',
    sections: [
      {
        heading: 'Câu chuyện của An Tâm',
        detail: 'Tên gọi An Tâm thể hiện điều chúng tôi muốn mang đến trong mỗi lần khách ghé thăm: cảm giác được lắng nghe, được giải thích cặn kẽ và được hướng dẫn lựa chọn phù hợp. Chúng tôi xây dựng cửa hàng trực tuyến để khách hàng có thể tìm kiếm sản phẩm, xem thông tin và đặt hàng thuận tiện hơn.',
      },
      {
        heading: 'Sứ mệnh của chúng tôi',
        detail: 'Giúp khách hàng tiếp cận sản phẩm chăm sóc sức khỏe một cách thuận tiện, đồng thời khuyến khích việc sử dụng thuốc có trách nhiệm. An Tâm coi trọng thông tin sản phẩm rõ ràng, tư vấn đúng phạm vi chuyên môn và sự tôn trọng đối với nhu cầu riêng của từng người.',
      },
      {
        heading: 'Những điều An Tâm luôn coi trọng',
        detail: 'Tận tâm trong giao tiếp; minh bạch về thông tin và giá bán; cẩn trọng khi tiếp nhận đơn thuốc; bảo quản, kiểm tra sản phẩm theo quy trình; và bảo vệ thông tin cá nhân của khách hàng trong quá trình hỗ trợ.',
      },
      {
        heading: 'Đồng hành từ lúc tìm hiểu đến sau khi mua',
        detail: 'Khách hàng có thể tìm sản phẩm theo tên hoặc danh mục, xem thông tin cơ bản trước khi đặt hàng và liên hệ nhà thuốc khi cần hỗ trợ. Với sản phẩm kê đơn, đơn thuốc cần được tiếp nhận và thẩm định theo quy trình trước khi xử lý. Sau khi mua, khách có thể theo dõi tình trạng đơn hàng và liên hệ khi cần giải đáp.',
      },
      {
        heading: 'Sử dụng thuốc an toàn là ưu tiên chung',
        detail: 'Thông tin trên trang giúp khách tham khảo, không thay thế việc khám bệnh hoặc chỉ định của bác sĩ. Hãy dùng thuốc theo hướng dẫn của nhân viên y tế, đọc kỹ thông tin sản phẩm và hỏi dược sĩ khi chưa rõ về liều dùng, tương tác hoặc tác dụng không mong muốn. Không tự ý dùng thuốc kê đơn khi chưa có chỉ định phù hợp.',
      },
    ],
    principles: [
      {
        icon: '♡',
        title: 'Lắng nghe',
        detail: 'Tìm hiểu nhu cầu trước khi hướng dẫn.',
      },
      {
        icon: '✓',
        title: 'Rõ ràng',
        detail: 'Thông tin dễ hiểu, hỗ trợ có trách nhiệm.',
      },
      {
        icon: '✚',
        title: 'An toàn',
        detail: 'Đặt việc dùng thuốc đúng cách lên hàng đầu.',
      },
    ],
  },
  quality: {
    kicker: 'CAM KẾT CHẤT LƯỢNG',
    title: 'Mỗi sản phẩm đều được chọn bằng trách nhiệm.',
    text: 'Từ khâu nhập hàng, bảo quản kho đạt chuẩn GSP đến đóng gói giao tận tay, An Tâm duy trì quy trình kiểm tra nghiêm ngặt.',
    heading: 'An toàn bắt đầu từ việc dùng thuốc đúng.',
    detail: 'Với thuốc kê đơn, hãy chuẩn bị đơn thuốc hợp lệ và tuân thủ chỉ định của bác sĩ. Không tự ý tăng liều, giảm liều hoặc ngừng thuốc khi chưa được tư vấn bởi dược sĩ chuyên môn.',
  },
  contact: {
    kicker: 'LIÊN HỆ & TƯ VẤN',
    title: 'Đội ngũ An Tâm luôn sẵn sàng lắng nghe.',
    text: 'Bạn cần tư vấn cách dùng thuốc, tương tác thuốc, kiểm tra đơn hàng hay hỗ trợ sau mua? Đội ngũ dược sĩ đại học của chúng tôi luôn trực hỗ trợ.',
    heading: 'Chúng tôi có thể giúp gì cho bạn?',
    detail: 'Hỏi về công dụng, cách dùng, lưu ý khi sử dụng hoặc cung cấp mã đơn để đội ngũ kiểm tra nhanh hơn.',
  },
};

export default function InfoScreen({ route, navigation, onClose }) {
  const { count } = useCart();
  const page = content[route.params?.type || 'about'] || content.about;
  const isAboutPage = (route.params?.type || 'about') === 'about';

  return (
    <ScrollView style={styles.container}>
      <StoreHeader
        cartCount={count}
        onCartPress={() => navigation.navigate('Cart')}
        onAccountPress={() => navigation.navigate('Login')}
      />

      <View style={styles.content}>
        <TouchableOpacity onPress={onClose || (() => navigation.navigate('Home'))}>
          <Text style={styles.back}>‹ Về trang chủ</Text>
        </TouchableOpacity>

        <Text style={styles.kicker}>{page.kicker}</Text>
        <Text style={styles.title}>{page.title}</Text>
        <Text style={styles.lead}>{page.text}</Text>

        {isAboutPage && (
          <>
            <View style={styles.principles}>
              {page.principles.map((principle) => (
                <View key={principle.title} style={styles.principleCard}>
                  <Text style={styles.principleIcon}>{principle.icon}</Text>
                  <Text style={styles.principleTitle}>{principle.title}</Text>
                  <Text style={styles.principleDetail}>{principle.detail}</Text>
                </View>
              ))}
            </View>
            {page.sections.map((section, index) => (
              <View key={section.heading} style={styles.storySection}>
                <View style={styles.storyNumber}>
                  <Text style={styles.storyNumberText}>{String(index + 1).padStart(2, '0')}</Text>
                </View>
                <View style={styles.storyCopy}>
                  <Text style={styles.heading}>{section.heading}</Text>
                  <Text style={styles.detail}>{section.detail}</Text>
                </View>
              </View>
            ))}
          </>
        )}

        {route.params?.type === 'contact' && (
          <View style={styles.contact}>
            <Text style={styles.contactLine}>📞 Hotline: <Text style={styles.bold}>1900 6868</Text> (Miễn phí)</Text>
            <Text style={styles.contactLine}>✉️ Email: <Text style={styles.bold}>hello@nhathuocantam.vn</Text></Text>
            <Text style={styles.contactLine}>🕒 Giờ mở cửa: <Text style={styles.bold}>07:00 - 22:00 mỗi ngày</Text></Text>
            <Text style={styles.contactLine}>📍 Trụ sở: <Text style={styles.bold}>123 Nguyễn Trãi, Phường Bến Thành, Quận 1, TP.HCM</Text></Text>
            <Text style={styles.contactLine}>🏥 Chi nhánh 2: <Text style={styles.bold}>456 Hai Bà Trưng, Phường 8, Quận 3, TP.HCM</Text></Text>
          </View>
        )}

        {!isAboutPage && (
          <View style={styles.section}>
            <Text style={styles.heading}>{page.heading}</Text>
            <Text style={styles.detail}>{page.detail}</Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate(isAboutPage ? 'Products' : 'Home')}
        >
          <Text style={styles.buttonText}>
            {isAboutPage ? 'Khám phá danh mục thuốc ›' : 'Về trang chủ ›'}
          </Text>
        </TouchableOpacity>
        {isAboutPage && (
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('Contact')}
          >
            <Text style={styles.secondaryButtonText}>Liên hệ với An Tâm</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0fdfa' },
  content: { padding: 20 },
  back: { color: '#0d9488', fontWeight: '700', marginBottom: 12 },
  kicker: { color: '#0d9488', fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  title: { color: '#134e4a', fontSize: 26, fontWeight: '800', lineHeight: 34, marginTop: 6 },
  lead: { color: '#475569', fontSize: 14, lineHeight: 22, marginTop: 12 },
  principles: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 20,
  },
  principleCard: {
    flex: 1,
    minWidth: 150,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#d1fae5',
  },
  principleIcon: {
    color: '#0d9488',
    fontSize: 22,
    fontWeight: '800',
  },
  principleTitle: {
    color: '#134e4a',
    fontSize: 14,
    fontWeight: '800',
    marginTop: 8,
  },
  principleDetail: {
    color: '#64748b',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },
  storySection: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  storyNumber: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#ccfbf1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  storyNumberText: { color: '#0f766e', fontSize: 12, fontWeight: '900' },
  storyCopy: { flex: 1 },
  contact: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    gap: 8,
    marginTop: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  contactLine: { color: '#334155', fontSize: 13, lineHeight: 20 },
  bold: { fontWeight: '700', color: '#0f766e' },
  section: {
    backgroundColor: '#ccfbf1',
    borderRadius: 16,
    padding: 18,
    marginTop: 18,
  },
  heading: { color: '#134e4a', fontSize: 18, fontWeight: '800', lineHeight: 24 },
  detail: { color: '#0f766e', lineHeight: 21, fontSize: 13, marginTop: 8 },
  button: {
    backgroundColor: '#0d9488',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginTop: 22,
  },
  buttonText: { color: '#fff', fontWeight: '800', fontSize: 14 },
});

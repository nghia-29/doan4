import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import StoreHeader from '../components/StoreHeader';
import { useCart } from '../context/CartContext';

const content = {
  about: {
    kicker: 'VỀ NHÀ THUỐC AN TÂM',
    title: 'Một địa chỉ đáng tin cho cả gia đình.',
    text: 'An Tâm được xây dựng với mong muốn đưa trải nghiệm mua thuốc trở nên rõ ràng, thuận tiện và an toàn hơn. Chúng tôi chọn sản phẩm có nguồn gốc minh bạch và luôn đặt tư vấn đúng cách lên hàng đầu.',
    heading: 'Nhà thuốc bắt đầu từ một điều giản dị: giúp mọi người hiểu đúng về thuốc.',
    detail: 'Chúng tôi tin rằng mua thuốc không chỉ là chọn một sản phẩm trên kệ. Đó còn là việc được lắng nghe, được hướng dẫn rõ ràng và được nhắc nhở về những điều cần lưu ý khi dùng thuốc.',
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

export default function InfoScreen({ route, navigation }) {
  const { count } = useCart();
  const page = content[route.params?.type || 'about'];

  return (
    <ScrollView style={styles.container}>
      <StoreHeader
        cartCount={count}
        onCartPress={() => navigation.navigate('Cart')}
        onAccountPress={() => navigation.navigate('Login')}
      />

      <View style={styles.content}>
        <TouchableOpacity onPress={() => navigation.navigate('Home')}>
          <Text style={styles.back}>‹ Về trang chủ</Text>
        </TouchableOpacity>

        <Text style={styles.kicker}>{page.kicker}</Text>
        <Text style={styles.title}>{page.title}</Text>
        <Text style={styles.lead}>{page.text}</Text>

        {route.params?.type === 'contact' && (
          <View style={styles.contact}>
            <Text style={styles.contactLine}>📞 Hotline: <Text style={styles.bold}>1900 6868</Text> (Miễn phí)</Text>
            <Text style={styles.contactLine}>✉️ Email: <Text style={styles.bold}>hello@nhathuocantam.vn</Text></Text>
            <Text style={styles.contactLine}>🕒 Giờ mở cửa: <Text style={styles.bold}>07:00 - 22:00 mỗi ngày</Text></Text>
            <Text style={styles.contactLine}>📍 Trụ sở: <Text style={styles.bold}>123 Nguyễn Trãi, Phường Bến Thành, Quận 1, TP.HCM</Text></Text>
            <Text style={styles.contactLine}>🏥 Chi nhánh 2: <Text style={styles.bold}>456 Hai Bà Trưng, Phường 8, Quận 3, TP.HCM</Text></Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.heading}>{page.heading}</Text>
          <Text style={styles.detail}>{page.detail}</Text>
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('Home')}
        >
          <Text style={styles.buttonText}>Xem danh mục thuốc ›</Text>
        </TouchableOpacity>
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

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
    detail: 'Chúng tôi tin rằng mua thuốc không chỉ là chọn một sản phẩm trên kệ. Đó còn là việc được lắng nghe, được hướng dẫn rõ ràng và được nhắc nhở về những điều cần lưu ý.',
  },
  quality: {
    kicker: 'CAM KẾT CHẤT LƯỢNG',
    title: 'Mỗi sản phẩm đều được chọn bằng trách nhiệm.',
    text: 'Từ khâu nhập hàng, bảo quản đến đóng gói, An Tâm duy trì quy trình kiểm tra chặt chẽ.',
    heading: 'An toàn bắt đầu từ việc dùng thuốc đúng.',
    detail: 'Với thuốc kê đơn, hãy chuẩn bị đơn thuốc hợp lệ và tuân thủ chỉ định của bác sĩ. Không tự ý tăng liều, giảm liều hoặc ngừng thuốc khi chưa được tư vấn.',
  },
  contact: {
    kicker: 'LIÊN HỆ',
    title: 'Đội ngũ An Tâm luôn sẵn sàng lắng nghe.',
    text: 'Bạn cần tư vấn sản phẩm, kiểm tra đơn hàng hay hỗ trợ sau mua? Hãy kết nối với chúng tôi.',
    heading: 'Chúng tôi có thể giúp gì cho bạn?',
    detail: 'Hỏi về công dụng, cách dùng, lưu ý khi sử dụng hoặc cung cấp mã đơn để đội ngũ kiểm tra nhanh hơn.',
  },
};

export default function InfoScreen({ route, navigation }) {
  const { count } = useCart();
  const page = content[route.params?.type || 'about'];
  return <ScrollView style={styles.container}><StoreHeader cartCount={count} onCartPress={() => navigation.navigate('Cart')} onAccountPress={() => navigation.navigate('Login')} /><View style={styles.content}><Text style={styles.kicker}>{page.kicker}</Text><Text style={styles.title}>{page.title}</Text><Text style={styles.lead}>{page.text}</Text>{route.params?.type === 'contact' && <View style={styles.contact}><Text>📞 1900 6868</Text><Text>✉️ hello@nhathuocantam.vn</Text><Text>🕒 08:00 - 21:00 mỗi ngày</Text><Text>📍 123 Nguyễn Trãi, Quận 1, TP.HCM</Text></View>}<View style={styles.section}><Text style={styles.heading}>{page.heading}</Text><Text style={styles.detail}>{page.detail}</Text></View><TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Home')}><Text style={styles.buttonText}>Xem sản phẩm</Text></TouchableOpacity></View></ScrollView>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f9ff' },
  content: { padding: 20 },
  kicker: { color: '#2cb67d', fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  title: { color: '#0f172a', fontSize: 30, fontWeight: '800', lineHeight: 37, marginTop: 7 },
  lead: { color: '#475569', fontSize: 16, lineHeight: 24, marginTop: 14 },
  contact: { backgroundColor: '#fff', borderRadius: 16, padding: 18, gap: 13, marginTop: 22 },
  section: { backgroundColor: '#eefbf7', borderRadius: 18, padding: 20, marginTop: 22 },
  heading: { color: '#0f172a', fontSize: 21, fontWeight: '800', lineHeight: 28 },
  detail: { color: '#475569', lineHeight: 23, fontSize: 15, marginTop: 10 },
  button: { backgroundColor: '#1d9bf0', borderRadius: 13, padding: 14, alignItems: 'center', marginTop: 24 },
  buttonText: { color: '#fff', fontWeight: '800' },
});

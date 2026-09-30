import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import StoreHeader from '../components/StoreHeader';
import { useCart } from '../context/CartContext';
import { formatPrice } from '../data/mockData';

export default function CartScreen({ navigation }) {
  const { items, count, total, increaseItem, decreaseItem, removeItem } = useCart();

  return (
    <View style={styles.container}>
      <StoreHeader cartCount={count} onCartPress={() => {}} onAccountPress={() => navigation.navigate('Login')} />
      <View style={styles.content}>
        <Text style={styles.kicker}>MUA SẮM AN TÂM</Text>
        <Text style={styles.title}>Giỏ hàng của bạn</Text>
        {items.length === 0 ? (
          <View style={styles.empty}><Text style={styles.emptyIcon}>🛍️</Text><Text style={styles.emptyText}>Giỏ hàng đang trống.</Text><TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Home')}><Text style={styles.buttonText}>Xem sản phẩm</Text></TouchableOpacity></View>
        ) : (
          <>
            {items.map((item) => <View style={styles.row} key={item.id}><View style={styles.rowInfo}><Text style={styles.name}>{item.name}</Text><Text style={styles.price}>{formatPrice(item.price)}</Text></View><View style={styles.quantity}><TouchableOpacity onPress={() => decreaseItem(item.id)}><Text style={styles.quantityButton}>−</Text></TouchableOpacity><Text>{item.quantity}</Text><TouchableOpacity onPress={() => increaseItem(item.id)}><Text style={styles.quantityButton}>+</Text></TouchableOpacity></View><TouchableOpacity onPress={() => removeItem(item.id)}><Text style={styles.remove}>×</Text></TouchableOpacity></View>)}
            <View style={styles.summary}><Text style={styles.summaryLabel}>Tổng cộng</Text><Text style={styles.total}>{formatPrice(total)}</Text><TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Login')}><Text style={styles.buttonText}>Đăng nhập để đặt hàng</Text></TouchableOpacity><Text style={styles.note}>Bạn cần đăng nhập để lưu đơn hàng và theo dõi giao hàng.</Text></View>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f9ff' },
  content: { padding: 20 },
  kicker: { color: '#2cb67d', fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  title: { color: '#0f172a', fontSize: 28, fontWeight: '800', marginTop: 6, marginBottom: 20 },
  empty: { alignItems: 'center', paddingVertical: 70 },
  emptyIcon: { fontSize: 48 },
  emptyText: { color: '#475569', fontSize: 16, marginTop: 12 },
  row: { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#e8edf6' },
  rowInfo: { flex: 1 },
  name: { color: '#0f172a', fontWeight: '700', fontSize: 15 },
  price: { color: '#1d9bf0', marginTop: 5 },
  quantity: { flexDirection: 'row', alignItems: 'center', gap: 12, marginHorizontal: 12 },
  quantityButton: { color: '#1d9bf0', fontSize: 23, fontWeight: '700' },
  remove: { color: '#e11d48', fontSize: 24 },
  summary: { backgroundColor: '#fff', borderRadius: 16, padding: 18, marginTop: 16 },
  summaryLabel: { color: '#475569' },
  total: { color: '#1d9bf0', fontSize: 25, fontWeight: '800', marginTop: 5 },
  button: { backgroundColor: '#1d9bf0', borderRadius: 13, padding: 14, alignItems: 'center', marginTop: 18 },
  buttonText: { color: '#fff', fontWeight: '800' },
  note: { color: '#64748b', fontSize: 12, marginTop: 12, lineHeight: 18 },
});

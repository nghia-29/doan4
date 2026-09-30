import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import ProductCard from '../components/ProductCard';
import StoreHeader from '../components/StoreHeader';
import thuocService from '../services/thuocService';
import anhThuocService from '../services/anhThuocService';
import { useCart } from '../context/CartContext';

function normalizeProduct(product, images) {
  const image = images.find((item) => String(item.id_thuoc) === String(product.id));
  return {
    id: product.id,
    name: product.ten_thuoc || 'Sản phẩm chưa đặt tên',
    price: Number(product.gia_ban) || 0,
    category: product.loai_ke_don === 'ke_don' ? 'Thuốc kê đơn' : 'Thuốc không kê đơn',
    image: image?.duong_dan_anh || null,
    badge: product.loai_ke_don === 'ke_don' ? 'Kê đơn' : 'Không kê đơn',
    active: Number(product.trang_thai ?? 1) === 1,
  };
}

export default function ProductsScreen({ navigation }) {
  const { addItem, count } = useCart();
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([thuocService.getAll(), anhThuocService.getAll().catch(() => [])])
      .then(([items, images]) => setProducts(items.map((item) => normalizeProduct(item, images))))
      .catch((requestError) => setError(requestError.message || 'Không thể tải sản phẩm.'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = products.filter((item) => item.active && item.name.toLowerCase().includes(query.toLowerCase()));
  return <ScrollView style={styles.container}><StoreHeader cartCount={count} onCartPress={() => navigation.navigate('Cart')} onAccountPress={() => navigation.navigate('Login')} /><View style={styles.content}><Text style={styles.kicker}>DANH MỤC SẢN PHẨM</Text><Text style={styles.title}>Tất cả sản phẩm</Text><TextInput value={query} onChangeText={setQuery} placeholder="Tìm tên thuốc hoặc mã sản phẩm..." placeholderTextColor="#94a3b8" style={styles.input} />{loading ? <ActivityIndicator size="large" color="#1d9bf0" style={styles.loader} /> : error ? <Text style={styles.error}>{error}</Text> : <View style={styles.grid}>{filtered.map((item) => <View style={styles.col} key={item.id}><ProductCard item={item} onAddToCart={addItem} onViewDetails={(product) => navigation.navigate('ProductDetail', { id: product.id })} /></View>)}</View>}</View></ScrollView>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f9ff' },
  content: { padding: 20 },
  kicker: { color: '#2cb67d', fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  title: { color: '#0f172a', fontSize: 29, fontWeight: '800', marginTop: 6, marginBottom: 18 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#dfeaf7', borderRadius: 13, padding: 14, color: '#0f172a', marginBottom: 18 },
  loader: { marginTop: 40 },
  error: { color: '#be123c', textAlign: 'center', marginTop: 30 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  col: { width: '48%', marginBottom: 16 },
});

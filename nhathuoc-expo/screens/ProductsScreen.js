import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import ProductCard from '../components/ProductCard';
import StoreHeader from '../components/StoreHeader';
import thuocService from '../services/thuocService';
import anhThuocService from '../services/anhThuocService';
import danhMucThuocService from '../services/danhMucThuocService';
import { useCart } from '../context/CartContext';

function normalizeProduct(product, images, categoryMap) {
  const image = images.find((item) => String(item.id_thuoc) === String(product.id));
  const categoryName = categoryMap[String(product.id_danh_muc)] || 'Thuốc';
  return {
    id: product.id,
    name: product.ten_thuoc || 'Sản phẩm chưa đặt tên',
    price: Number(product.gia_ban) || 0,
    category: categoryName,
    image: image?.duong_dan_anh || null,
    badge: product.loai_ke_don === 'ke_don' ? 'Kê đơn' : 'Không kê đơn',
    active: Number(product.trang_thai ?? 1) === 1,
  };
}

export default function ProductsScreen({ navigation }) {
  const { addItem, count } = useCart();
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      thuocService.getAll(),
      anhThuocService.getAll().catch(() => []),
      danhMucThuocService.getAll().catch(() => []),
    ])
      .then(([items, images, cats]) => {
        const catMap = Object.fromEntries(cats.map((c) => [String(c.id), c.ten_danh_muc]));
        setCategories(cats);
        setProducts(items.map((item) => normalizeProduct(item, images, catMap)));
      })
      .catch((requestError) => setError(requestError.message || 'Không thể tải sản phẩm.'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = products.filter((item) => {
    const matchQuery = !query || item.name.toLowerCase().includes(query.toLowerCase());
    const matchCat = !selectedCategory || item.category === selectedCategory;
    return item.active && matchQuery && matchCat;
  });

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

        <Text style={styles.kicker}>DANH MỤC DƯỢC PHẨM</Text>
        <Text style={styles.title}>Tất cả sản phẩm</Text>

        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Tìm tên thuốc, biệt dược, mã sản phẩm..."
          placeholderTextColor="#94a3b8"
          style={styles.input}
        />

        {/* Category horizontal filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
          <TouchableOpacity
            style={[styles.catChip, !selectedCategory && styles.catChipActive]}
            onPress={() => setSelectedCategory('')}
          >
            <Text style={[styles.catText, !selectedCategory && styles.catTextActive]}>
              Tất cả ({products.length})
            </Text>
          </TouchableOpacity>
          {categories.map((c) => (
            <TouchableOpacity
              key={c.id}
              style={[
                styles.catChip,
                selectedCategory === c.ten_danh_muc && styles.catChipActive,
              ]}
              onPress={() => setSelectedCategory(c.ten_danh_muc)}
            >
              <Text
                style={[
                  styles.catText,
                  selectedCategory === c.ten_danh_muc && styles.catTextActive,
                ]}
              >
                {c.ten_danh_muc}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {loading ? (
          <ActivityIndicator size="large" color="#0d9488" style={styles.loader} />
        ) : error ? (
          <Text style={styles.error}>{error}</Text>
        ) : (
          <View style={styles.grid}>
            {filtered.map((item) => (
              <View style={styles.col} key={item.id}>
                <ProductCard
                  item={item}
                  onAddToCart={addItem}
                  onViewDetails={(product) =>
                    navigation.navigate('ProductDetail', { id: product.id })
                  }
                />
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0fdfa' },
  content: { padding: 18 },
  back: { color: '#0d9488', fontWeight: '700', marginBottom: 8 },
  kicker: { color: '#0d9488', fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  title: { color: '#134e4a', fontSize: 26, fontWeight: '800', marginTop: 4, marginBottom: 14 },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    padding: 12,
    color: '#0f172a',
    fontSize: 14,
    marginBottom: 12,
  },
  catScroll: { flexDirection: 'row', marginBottom: 14 },
  catChip: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 999,
    paddingHorizontal: 13,
    paddingVertical: 7,
    marginRight: 8,
  },
  catChipActive: { backgroundColor: '#0d9488', borderColor: '#0d9488' },
  catText: { color: '#475569', fontSize: 12, fontWeight: '700' },
  catTextActive: { color: '#fff' },
  loader: { marginTop: 40 },
  error: { color: '#b91c1c', textAlign: 'center', marginTop: 30 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  col: { width: '48%', marginBottom: 14 },
});

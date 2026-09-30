import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import CategoryChips from '../components/CategoryChips';
import ProductCard from '../components/ProductCard';
import SectionHeader from '../components/SectionHeader';
import ServiceCard from '../components/ServiceCard';
import StoreHeader from '../components/StoreHeader';
import { services } from '../data/mockData';
import { useCart } from '../context/CartContext';
import thuocService from '../services/thuocService';
import danhMucThuocService from '../services/danhMucThuocService';
import anhThuocService from '../services/anhThuocService';

const fallbackCategories = ['Tất cả'];

function normalizeProduct(product, categoryMap, imageList) {
  const image = imageList.find((item) => String(item.id_thuoc) === String(product.id));
  const categoryName = categoryMap[String(product.id_danh_muc)] || 'Sức khỏe';

  return {
    id: product.id,
    name: product.ten_thuoc || 'Sản phẩm chưa đặt tên',
    price: Number(product.gia_ban) || 0,
    stock: Number(product.so_luong_ton ?? product.so_luong ?? 0),
    category: categoryName,
    image: image?.duong_dan_anh || null,
    badge: product.loai_ke_don === 'ke_don' ? 'Kê đơn' : 'Không kê đơn',
    active: Number(product.trang_thai ?? 1) === 1,
  };
}

export default function HomeScreen({ navigation }) {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');
  const [categories, setCategories] = useState(fallbackCategories);
  const [products, setProducts] = useState([]);
  const { addItem, count } = useCart();
  const [sort, setSort] = useState('featured');
  const [prescription, setPrescription] = useState('');
  const [stockOnly, setStockOnly] = useState(false);
  const [maxPrice, setMaxPrice] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  React.useEffect(() => {
    Promise.all([
      thuocService.getAll(),
      danhMucThuocService.getAll(),
      anhThuocService.getAll().catch(() => []),
    ])
      .then(([productList, categoryList, imageList]) => {
        const categoryMap = Object.fromEntries(
          categoryList.map((item) => [String(item.id), item.ten_danh_muc || 'Sức khỏe']),
        );
        setCategories(['Tất cả', ...categoryList.map((item) => item.ten_danh_muc).filter(Boolean)]);
        setProducts(productList.map((item) => normalizeProduct(item, categoryMap, imageList)));
      })
      .catch((requestError) => setError(requestError.message || 'Không thể tải danh sách thuốc.'))
      .finally(() => setLoading(false));
  }, []);

  const filteredProducts = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return products.filter((item) => {
      const matchText = !keyword || item.name.toLowerCase().includes(keyword);
      const matchCategory = selectedCategory === 'Tất cả' || item.category === selectedCategory;
      const matchPrescription = !prescription || item.badge === (prescription === 'ke_don' ? 'Kê đơn' : 'Không kê đơn');
      const matchStock = !stockOnly || item.stock > 0;
      const matchPrice = !maxPrice || item.price <= maxPrice;
      return matchText && matchCategory && matchPrescription && matchStock && matchPrice && item.active;
    });
  }, [maxPrice, prescription, products, query, selectedCategory, sort, stockOnly]);

  const sortedProducts = [...filteredProducts].sort((left, right) => {
    if (sort === 'priceAsc') return left.price - right.price;
    if (sort === 'priceDesc') return right.price - left.price;
    return left.name.localeCompare(right.name, 'vi');
  });

  const priceCeiling = Math.max(...products.map((item) => item.price), 100000);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <StoreHeader cartCount={count} onCartPress={() => navigation.navigate('Cart')} onAccountPress={() => navigation.navigate('Login')} />

      <View style={styles.searchWrap}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Tìm thuốc, vitamin, thực phẩm..."
          placeholderTextColor="#7f8ba3"
          style={styles.searchInput}
        />
      </View>

      <View style={styles.heroCard}>
        <Text style={styles.kicker}>CHĂM SÓC SỨC KHỎE MỖI NGÀY</Text>
        <Text style={styles.heroTitle}>Chăm sóc đúng cách,{"\n"}an tâm mỗi ngày.</Text>
        <Text style={styles.heroText}>Thuốc chính hãng, tư vấn tận tâm và giao hàng an toàn cho cả gia đình.</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.navigate('Products')}>
          <Text style={styles.primaryButtonText}>Mua sắm ngay</Text>
        </TouchableOpacity>
      </View>

      <SectionHeader kicker="DANH MỤC SẢN PHẨM" title="Sản phẩm nổi bật" />

      <CategoryChips
        categories={categories}
        selectedCategory={selectedCategory}
        onSelect={setSelectedCategory}
      />

      <View style={styles.filterPanel}>
        <Text style={styles.filterTitle}>Bộ lọc sản phẩm ({sortedProducts.length})</Text>
        <View style={styles.filterRow}>
          {[
            ['featured', 'Tên A-Z'],
            ['priceAsc', 'Giá thấp'],
            ['priceDesc', 'Giá cao'],
          ].map(([value, label]) => (
            <TouchableOpacity key={value} style={[styles.filterChip, sort === value && styles.filterChipActive]} onPress={() => setSort(value)}>
              <Text style={[styles.filterText, sort === value && styles.filterTextActive]}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.filterRow}>
          <TouchableOpacity style={[styles.filterChip, prescription === 'khong_ke_don' && styles.filterChipActive]} onPress={() => setPrescription((value) => value === 'khong_ke_don' ? '' : 'khong_ke_don')}><Text style={[styles.filterText, prescription === 'khong_ke_don' && styles.filterTextActive]}>Không kê đơn</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.filterChip, prescription === 'ke_don' && styles.filterChipActive]} onPress={() => setPrescription((value) => value === 'ke_don' ? '' : 'ke_don')}><Text style={[styles.filterText, prescription === 'ke_don' && styles.filterTextActive]}>Kê đơn</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.filterChip, stockOnly && styles.filterChipActive]} onPress={() => setStockOnly((value) => !value)}><Text style={[styles.filterText, stockOnly && styles.filterTextActive]}>Còn hàng</Text></TouchableOpacity>
        </View>
        <View style={styles.filterRow}>
          {[0, Math.round(priceCeiling * 0.25), Math.round(priceCeiling * 0.5), priceCeiling].map((value) => (
            <TouchableOpacity key={value} style={[styles.priceChip, maxPrice === value && styles.filterChipActive]} onPress={() => setMaxPrice(value)}>
              <Text style={[styles.filterText, maxPrice === value && styles.filterTextActive]}>{value ? `≤ ${value.toLocaleString('vi-VN')}đ` : 'Mọi giá'}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.productGrid}>
        {loading ? (
          <View style={styles.statusBox}>
            <ActivityIndicator size="large" color="#1d9bf0" />
            <Text style={styles.statusText}>Đang tải sản phẩm...</Text>
          </View>
        ) : error ? (
          <View style={styles.statusBox}>
            <Text style={styles.statusText}>{error}</Text>
            <Text style={styles.statusHint}>Kiểm tra backend và EXPO_PUBLIC_API_URL.</Text>
          </View>
        ) : sortedProducts.length === 0 ? (
          <View style={styles.statusBox}>
            <Text style={styles.statusText}>Không tìm thấy sản phẩm phù hợp.</Text>
          </View>
        ) : sortedProducts.map((item) => (
            <View key={item.id} style={styles.productCol}>
              <ProductCard item={item} onAddToCart={addItem} onViewDetails={(product) => navigation.navigate('ProductDetail', { id: product.id })} />
            </View>
          ))}
      </View>

      <View style={styles.storyWrap}>
        <SectionHeader kicker="VỀ NHÀ THUỐC AN TÂM" title="Một địa chỉ đáng tin cho cả gia đình." alignLeft />
        <Text style={styles.storyText}>Chúng tôi chọn sự rõ ràng, tử tế và an toàn làm nền tảng cho từng sản phẩm.</Text>
        <TouchableOpacity style={styles.linkButton} onPress={() => navigation.navigate('About')}>
          <Text style={styles.linkButtonText}>Tìm hiểu về An Tâm →</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.servicesWrap}>
        <SectionHeader kicker="DỊCH VỤ CỦA CHÚNG TÔI" title="Mọi điều bạn cần, trong một nơi" alignLeft />
        {services.map((item) => (
          <ServiceCard key={item.title} item={item} />
        ))}
        <TouchableOpacity style={styles.linkButton} onPress={() => navigation.navigate('Quality')}>
          <Text style={styles.linkButtonText}>Xem cam kết chất lượng →</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.contactCard}>
        <Text style={styles.kicker}>CẦN HỖ TRỢ?</Text>
        <Text style={styles.contactTitle}>Đội ngũ An Tâm luôn sẵn sàng lắng nghe.</Text>
        <Text style={styles.contactItem}>📞 1900 6868</Text>
        <Text style={styles.contactItem}>✉️ hello@nhathuocantam.vn</Text>
        <Text style={styles.contactItem}>📍 123 Nguyễn Trãi, Quận 1, TP.HCM</Text>
        <TouchableOpacity style={styles.contactButton} onPress={() => navigation.navigate('Contact')}>
          <Text style={styles.contactButtonText}>Liên hệ với chúng tôi</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>© 2026 Nhà Thuốc An Tâm</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f9ff',
  },
  searchWrap: {
    paddingHorizontal: 20,
    marginTop: 10,
  },
  searchInput: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#dfeaf7',
    fontSize: 15,
    color: '#0f172a',
  },
  heroCard: {
    marginHorizontal: 20,
    marginTop: 18,
    backgroundColor: '#1ec0a6',
    borderRadius: 22,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 8,
  },
  kicker: {
    color: '#e8f8f4',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.7,
  },
  heroTitle: {
    marginTop: 10,
    color: '#fff',
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '800',
  },
  heroText: {
    marginTop: 10,
    color: '#ebfffb',
    fontSize: 14,
    lineHeight: 20,
  },
  primaryButton: {
    marginTop: 18,
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    width: 170,
  },
  primaryButtonText: {
    color: '#0f172a',
    fontWeight: '700',
    fontSize: 15,
  },
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 14,
    marginTop: 18,
    justifyContent: 'space-between',
  },
  filterPanel: {
    marginHorizontal: 20,
    marginTop: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e8edf6',
  },
  filterTitle: {
    color: '#0f172a',
    fontWeight: '800',
    marginBottom: 8,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  filterChip: {
    borderWidth: 1,
    borderColor: '#dfeaf7',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  priceChip: {
    flex: 1,
    minWidth: 66,
    borderWidth: 1,
    borderColor: '#dfeaf7',
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 7,
    alignItems: 'center',
  },
  filterChipActive: {
    backgroundColor: '#1d9bf0',
    borderColor: '#1d9bf0',
  },
  filterText: {
    color: '#475569',
    fontSize: 11,
    fontWeight: '700',
  },
  filterTextActive: {
    color: '#fff',
  },
  productCol: {
    width: '48%',
    marginBottom: 16,
  },
  statusBox: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 34,
  },
  statusText: {
    color: '#334155',
    fontSize: 15,
    textAlign: 'center',
    marginTop: 10,
  },
  statusHint: {
    color: '#64748b',
    fontSize: 13,
    marginTop: 6,
  },
  storyWrap: {
    backgroundColor: '#eefbf7',
    marginTop: 24,
    paddingHorizontal: 20,
    paddingTop: 26,
    paddingBottom: 30,
  },
  storyText: {
    marginTop: 10,
    color: '#475569',
    fontSize: 15,
    lineHeight: 22,
  },
  linkButton: {
    alignSelf: 'flex-start',
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#1d9bf0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  linkButtonText: {
    color: '#1d9bf0',
    fontWeight: '700',
  },
  servicesWrap: {
    paddingHorizontal: 20,
    marginTop: 28,
  },
  contactCard: {
    marginHorizontal: 20,
    marginTop: 26,
    backgroundColor: '#1d9bf0',
    borderRadius: 18,
    padding: 20,
  },
  contactTitle: {
    fontSize: 23,
    fontWeight: '800',
    color: '#fff',
    marginTop: 6,
    marginBottom: 12,
  },
  contactItem: {
    color: '#ecf9ff',
    fontSize: 15,
    marginBottom: 8,
  },
  contactButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  contactButtonText: {
    color: '#0f172a',
    fontWeight: '700',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 26,
    backgroundColor: '#f5f9ff',
  },
  footerText: {
    color: '#64748b',
    fontSize: 13,
  },
});

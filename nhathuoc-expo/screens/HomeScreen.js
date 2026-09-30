import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
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
import { useAuth } from '../context/AuthContext';
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
  const { user } = useAuth();
  const [sort, setSort] = useState('featured');
  const [prescription, setPrescription] = useState('');
  const [stockOnly, setStockOnly] = useState(false);
  const [maxPrice, setMaxPrice] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = useCallback(() => {
    setLoading(true);
    setError('');
    Promise.all([
      thuocService.getAll(),
      danhMucThuocService.getAll(),
      anhThuocService.getAll().catch(() => []),
    ])
      .then(([productList, categoryList, imageList]) => {
        const categoryMap = Object.fromEntries(
          categoryList.map((item) => [String(item.id), item.ten_danh_muc || 'Sức khỏe'])
        );
        setCategories(['Tất cả', ...categoryList.map((item) => item.ten_danh_muc).filter(Boolean)]);
        setProducts(productList.map((item) => normalizeProduct(item, categoryMap, imageList)));
      })
      .catch((requestError) => setError(requestError.message || 'Không thể tải danh sách thuốc.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredProducts = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return products.filter((item) => {
      const matchText = !keyword || item.name.toLowerCase().includes(keyword);
      const matchCategory = selectedCategory === 'Tất cả' || item.category === selectedCategory;
      const matchPrescription =
        !prescription || item.badge === (prescription === 'ke_don' ? 'Kê đơn' : 'Không kê đơn');
      const matchStock = !stockOnly || item.stock > 0;
      const matchPrice = !maxPrice || item.price <= maxPrice;
      return matchText && matchCategory && matchPrescription && matchStock && matchPrice && item.active;
    });
  }, [maxPrice, prescription, products, query, selectedCategory, stockOnly]);

  const sortedProducts = [...filteredProducts].sort((left, right) => {
    if (sort === 'priceAsc') return left.price - right.price;
    if (sort === 'priceDesc') return right.price - left.price;
    return left.name.localeCompare(right.name, 'vi');
  });

  const priceCeiling = Math.max(...products.map((item) => item.price), 100000);

  const role = String(user?.vai_tro || '').toLowerCase();
  const isAdmin = role.includes('admin');
  const isStaff = ['duoc_si', 'nv_quan_ly', 'nhan_vien'].some((r) => role.includes(r));

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={loadData} />}
    >
      <StoreHeader
        cartCount={count}
        onCartPress={() => navigation.navigate('Cart')}
        onAccountPress={() => navigation.navigate('Login')}
      />

      {/* User Portal Bar if logged in */}
      {user && (
        <View style={styles.userBanner}>
          <Text style={styles.userGreeting}>
            Xin chào, <Text style={styles.userBold}>{user.ten_dang_nhap}</Text> ({user.vai_tro})
          </Text>
          <View style={styles.portalLinks}>
            {isAdmin && (
              <TouchableOpacity
                style={styles.portalBtn}
                onPress={() => navigation.navigate('AdminDashboard')}
              >
                <Text style={styles.portalBtnText}>⚙️ Quản trị</Text>
              </TouchableOpacity>
            )}
            {isStaff && (
              <TouchableOpacity
                style={styles.portalBtn}
                onPress={() => navigation.navigate('Staff')}
              >
                <Text style={styles.portalBtnText}>🩺 Dược sĩ</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.portalBtn}
              onPress={() => navigation.navigate('Customer')}
            >
              <Text style={styles.portalBtnText}>📦 Đơn của tôi</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Search Input */}
      <View style={styles.searchWrap}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Tìm thuốc, vitamin, thực phẩm chức năng..."
          placeholderTextColor="#7f8ba3"
          style={styles.searchInput}
        />
      </View>

      {/* Hero Banner */}
      <View style={styles.heroCard}>
        <Text style={styles.kicker}>CHĂM SÓC SỨC KHỎE MỖI NGÀY</Text>
        <Text style={styles.heroTitle}>Chăm sóc đúng cách,{"\n"}an tâm mỗi ngày.</Text>
        <Text style={styles.heroText}>
          Thuốc chính hãng 100%, tư vấn tận tâm bởi đội ngũ dược sĩ và giao hàng an toàn tận nơi.
        </Text>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.navigate('Products')}
        >
          <Text style={styles.primaryButtonText}>Mua sắm ngay ›</Text>
        </TouchableOpacity>
      </View>

      <SectionHeader kicker="DANH MỤC SẢN PHẨM" title="Sản phẩm nổi bật" />

      <CategoryChips
        categories={categories}
        selectedCategory={selectedCategory}
        onSelect={setSelectedCategory}
      />

      {/* Filter Panel */}
      <View style={styles.filterPanel}>
        <Text style={styles.filterTitle}>Bộ lọc sản phẩm ({sortedProducts.length})</Text>
        <View style={styles.filterRow}>
          {[
            ['featured', 'Tên A-Z'],
            ['priceAsc', 'Giá thấp'],
            ['priceDesc', 'Giá cao'],
          ].map(([value, label]) => (
            <TouchableOpacity
              key={value}
              style={[styles.filterChip, sort === value && styles.filterChipActive]}
              onPress={() => setSort(value)}
            >
              <Text style={[styles.filterText, sort === value && styles.filterTextActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterChip, prescription === 'khong_ke_don' && styles.filterChipActive]}
            onPress={() =>
              setPrescription((v) => (v === 'khong_ke_don' ? '' : 'khong_ke_don'))
            }
          >
            <Text
              style={[
                styles.filterText,
                prescription === 'khong_ke_don' && styles.filterTextActive,
              ]}
            >
              Không kê đơn
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, prescription === 'ke_don' && styles.filterChipActive]}
            onPress={() => setPrescription((v) => (v === 'ke_don' ? '' : 'ke_don'))}
          >
            <Text
              style={[styles.filterText, prescription === 'ke_don' && styles.filterTextActive]}
            >
              Kê đơn
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, stockOnly && styles.filterChipActive]}
            onPress={() => setStockOnly((v) => !v)}
          >
            <Text style={[styles.filterText, stockOnly && styles.filterTextActive]}>
              Còn hàng
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.filterRow}>
          {[0, Math.round(priceCeiling * 0.25), Math.round(priceCeiling * 0.5), priceCeiling].map(
            (val) => (
              <TouchableOpacity
                key={val}
                style={[styles.priceChip, maxPrice === val && styles.filterChipActive]}
                onPress={() => setMaxPrice(val)}
              >
                <Text style={[styles.filterText, maxPrice === val && styles.filterTextActive]}>
                  {val ? `≤ ${val.toLocaleString('vi-VN')}đ` : 'Mọi giá'}
                </Text>
              </TouchableOpacity>
            )
          )}
        </View>
      </View>

      {/* Product Grid */}
      <View style={styles.productGrid}>
        {loading ? (
          <View style={styles.statusBox}>
            <ActivityIndicator size="large" color="#0d9488" />
            <Text style={styles.statusText}>Đang tải sản phẩm...</Text>
          </View>
        ) : error ? (
          <View style={styles.statusBox}>
            <Text style={styles.statusText}>{error}</Text>
          </View>
        ) : sortedProducts.length === 0 ? (
          <View style={styles.statusBox}>
            <Text style={styles.statusText}>Không tìm thấy sản phẩm phù hợp.</Text>
          </View>
        ) : (
          sortedProducts.map((item) => (
            <View key={item.id} style={styles.productCol}>
              <ProductCard
                item={item}
                onAddToCart={addItem}
                onViewDetails={(product) =>
                  navigation.navigate('ProductDetail', { id: product.id })
                }
              />
            </View>
          ))
        )}
      </View>

      {/* Story Wrap */}
      <View style={styles.storyWrap}>
        <SectionHeader
          kicker="VỀ NHÀ THUỐC AN TÂM"
          title="Một địa chỉ đáng tin cho cả gia đình."
          alignLeft
        />
        <Text style={styles.storyText}>
          Chúng tôi chọn sự rõ ràng, tử tế và an toàn làm nền tảng cho từng sản phẩm. Mỗi viên thuốc được trao đến tay khách hàng là một cam kết trách nhiệm.
        </Text>
        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => navigation.navigate('About')}
        >
          <Text style={styles.linkButtonText}>Tìm hiểu về An Tâm →</Text>
        </TouchableOpacity>
      </View>

      {/* Services Wrap */}
      <View style={styles.servicesWrap}>
        <SectionHeader
          kicker="DỊCH VỤ CỦA CHÚNG TÔI"
          title="Mọi điều bạn cần, trong một nơi"
          alignLeft
        />
        {services.map((item) => (
          <ServiceCard key={item.title} item={item} />
        ))}
        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => navigation.navigate('Quality')}
        >
          <Text style={styles.linkButtonText}>Xem cam kết chất lượng →</Text>
        </TouchableOpacity>
      </View>

      {/* Contact Card */}
      <View style={styles.contactCard}>
        <Text style={styles.kickerLight}>CẦN HỖ TRỢ?</Text>
        <Text style={styles.contactTitle}>Đội ngũ An Tâm luôn sẵn sàng lắng nghe.</Text>
        <Text style={styles.contactItem}>📞 1900 6868 (Tư vấn miễn phí)</Text>
        <Text style={styles.contactItem}>✉️ hello@nhathuocantam.vn</Text>
        <Text style={styles.contactItem}>📍 123 Nguyễn Trãi, Quận 1, TP.HCM</Text>
        <TouchableOpacity
          style={styles.contactButton}
          onPress={() => navigation.navigate('Contact')}
        >
          <Text style={styles.contactButtonText}>Liên hệ với chúng tôi</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>© 2026 Nhà Thuốc An Tâm · Ứng dụng di động Expo</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0fdfa' },
  userBanner: {
    marginHorizontal: 18,
    marginTop: 10,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ccfbf1',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  userGreeting: { color: '#134e4a', fontSize: 13 },
  userBold: { fontWeight: '800' },
  portalLinks: { flexDirection: 'row', gap: 6 },
  portalBtn: {
    backgroundColor: '#0d9488',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  portalBtnText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  searchWrap: { paddingHorizontal: 18, marginTop: 10 },
  searchInput: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    fontSize: 14,
    color: '#0f172a',
  },
  heroCard: {
    marginHorizontal: 18,
    marginTop: 16,
    backgroundColor: '#0d9488',
    borderRadius: 22,
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  kicker: { color: '#ccfbf1', fontSize: 11, fontWeight: '800', letterSpacing: 0.8 },
  kickerLight: { color: '#ccfbf1', fontSize: 11, fontWeight: '800', letterSpacing: 0.8 },
  heroTitle: {
    marginTop: 8,
    color: '#fff',
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '800',
  },
  heroText: { marginTop: 8, color: '#f0fdfa', fontSize: 13, lineHeight: 19 },
  primaryButton: {
    marginTop: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 11,
    paddingHorizontal: 20,
    alignSelf: 'flex-start',
  },
  primaryButtonText: { color: '#0d9488', fontWeight: '800', fontSize: 14 },
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 14,
    marginTop: 14,
    justifyContent: 'space-between',
  },
  filterPanel: {
    marginHorizontal: 18,
    marginTop: 14,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  filterTitle: { color: '#134e4a', fontWeight: '800', fontSize: 13, marginBottom: 6 },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  filterChip: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 6,
    backgroundColor: '#fff',
  },
  priceChip: {
    flex: 1,
    minWidth: 64,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 6,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  filterChipActive: { backgroundColor: '#0d9488', borderColor: '#0d9488' },
  filterText: { color: '#475569', fontSize: 11, fontWeight: '700' },
  filterTextActive: { color: '#fff' },
  productCol: { width: '48%', marginBottom: 14 },
  statusBox: { width: '100%', alignItems: 'center', paddingVertical: 30 },
  statusText: { color: '#64748b', fontSize: 14, marginTop: 8 },
  storyWrap: {
    backgroundColor: '#ccfbf1',
    marginTop: 24,
    paddingHorizontal: 18,
    paddingTop: 24,
    paddingBottom: 28,
  },
  storyText: { marginTop: 8, color: '#134e4a', fontSize: 14, lineHeight: 21 },
  linkButton: {
    alignSelf: 'flex-start',
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#0d9488',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 9,
    backgroundColor: '#fff',
  },
  linkButtonText: { color: '#0d9488', fontWeight: '800', fontSize: 13 },
  servicesWrap: { paddingHorizontal: 18, marginTop: 24 },
  contactCard: {
    marginHorizontal: 18,
    marginTop: 24,
    backgroundColor: '#0f766e',
    borderRadius: 18,
    padding: 20,
  },
  contactTitle: { fontSize: 22, fontWeight: '800', color: '#fff', marginTop: 4, marginBottom: 12 },
  contactItem: { color: '#ccfbf1', fontSize: 14, marginBottom: 6 },
  contactButton: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  contactButtonText: { color: '#0f766e', fontWeight: '800', fontSize: 14 },
  footer: { alignItems: 'center', paddingVertical: 24, backgroundColor: '#f0fdfa' },
  footerText: { color: '#94a3b8', fontSize: 12 },
});

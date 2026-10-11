import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import ProductCard from '../components/ProductCard';
import StoreHeader from '../components/StoreHeader';
import { formatPrice } from '../data/mockData';
import { useCart } from '../context/CartContext';
import { createCrudService } from '../services/crudService';
import { isPromotionActive } from '../utils/promotions';

function getPromotionDescription(promotion) {
  if (promotion.mo_ta) return promotion.mo_ta;
  if (promotion.loai_giam === 'phan_tram') {
    return `Giảm ${Number(promotion.gia_tri_giam)}% cho đơn hàng`;
  }
  return `Giảm ${formatPrice(promotion.gia_tri_giam)} cho đơn hàng`;
}

function formatPromotionEndDate(value) {
  const date = new Date(String(value || '').replace(' ', 'T'));
  return Number.isNaN(date.getTime())
    ? String(value || '')
    : date.toLocaleDateString('vi-VN');
}

function normalizeProduct(product, images, categoryMap) {
  const image = images.find((item) => String(item.id_thuoc) === String(product.id));
  return {
    id: product.id,
    name: product.ten_thuoc || 'Sản phẩm chưa đặt tên',
    price: Number(product.gia_ban) || 0,
    stock: Number(product.so_luong_ton ?? product.so_luong ?? 0),
    category: categoryMap[String(product.id_danh_muc)] || 'Thuốc',
    image: image?.duong_dan_anh || null,
    badge: product.loai_ke_don === 'ke_don' ? 'Kê đơn' : 'Không kê đơn',
    active: Number(product.trang_thai ?? 1) === 1,
  };
}

export default function PromotionsScreen({ navigation }) {
  const { addItem, count } = useCart();
  const [promotions, setPromotions] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');

    try {
      const [promotionList, medicineList, imageList, categoryList] = await Promise.all([
        createCrudService('khuyen_mai').getAll(),
        createCrudService('thuoc').getAll(),
        createCrudService('anh_thuoc').getAll(),
        createCrudService('danh_muc_thuoc').getAll(),
      ]);

      const now = Date.now();
      const categoryMap = Object.fromEntries(
        categoryList.map((category) => [String(category.id), category.ten_danh_muc])
      );
      setPromotions(promotionList.filter((promotion) => isPromotionActive(promotion, now)));
      setProducts(
        medicineList
          .filter((product) => Number(product.trang_thai ?? 1) === 1)
          .map((product) => normalizeProduct(product, imageList, categoryMap))
      );
    } catch (requestError) {
      setError(requestError.message || 'Không thể tải chương trình khuyến mãi.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => loadData(true)} />
      }
    >
      <StoreHeader
        cartCount={count}
        onCartPress={() => navigation.navigate('Cart')}
        onAccountPress={() => navigation.navigate('Login')}
      />

      <View style={styles.content}>
        <TouchableOpacity onPress={() => navigation.navigate('Home')}>
          <Text style={styles.back}>‹ Về trang chủ</Text>
        </TouchableOpacity>

        <Text style={styles.kicker}>ƯU ĐÃI DÀNH CHO BẠN</Text>
        <Text style={styles.title}>Khuyến mãi đang áp dụng</Text>
        <Text style={styles.subtitle}>
          Chọn sản phẩm, nhập mã khuyến mãi ở giỏ hàng và kiểm tra điều kiện đơn tối thiểu.
        </Text>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={() => loadData()}>
              <Text style={styles.retryText}>Thử tải lại</Text>
            </TouchableOpacity>
          </View>
        ) : loading ? (
          <ActivityIndicator size="large" color="#0d9488" style={styles.loader} />
        ) : promotions.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyIcon}>🎁</Text>
            <Text style={styles.emptyTitle}>Hiện chưa có mã khuyến mãi nào</Text>
            <Text style={styles.emptyText}>
              Các ưu đãi mới sẽ được cập nhật tại đây. Bạn vẫn có thể xem toàn bộ sản phẩm của nhà thuốc.
            </Text>
          </View>
        ) : (
          <>
            {promotions.map((promotion) => (
              <View key={promotion.id} style={styles.promotionCard}>
                <View style={styles.promotionIcon}>
                  <Text style={styles.promotionIconText}>%</Text>
                </View>
                <View style={styles.promotionInfo}>
                  <Text style={styles.promotionDescription}>
                    {getPromotionDescription(promotion)}
                  </Text>
                  <Text style={styles.promotionCode}>{promotion.ma_code}</Text>
                  <Text style={styles.promotionCondition}>
                    Đơn tối thiểu {formatPrice(promotion.don_toi_thieu || 0)}
                    {promotion.ngay_ket_thuc
                      ? ` · Hạn đến ${formatPromotionEndDate(promotion.ngay_ket_thuc)}`
                      : ''}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.useCodeButton}
                  onPress={() => navigation.navigate('Cart', { couponCode: promotion.ma_code })}
                >
                  <Text style={styles.useCodeText}>Dùng mã</Text>
                </TouchableOpacity>
              </View>
            ))}

            <View style={styles.eligibilityNotice}>
              <Text style={styles.eligibilityTitle}>Sản phẩm áp dụng ưu đãi đơn hàng</Text>
              <Text style={styles.eligibilityText}>
                Mã giảm giá áp dụng trên tổng đơn hàng khi đạt điều kiện, không làm thay đổi giá niêm yết riêng của từng sản phẩm.
              </Text>
            </View>
          </>
        )}

        {!loading && products.length > 0 && (
          <View style={styles.productSection}>
            <Text style={styles.productSectionTitle}>Sản phẩm có thể mua cùng ưu đãi</Text>
            <View style={styles.productGrid}>
              {products.map((product) => (
                <View key={product.id} style={styles.productColumn}>
                  <ProductCard
                    item={product}
                    onAddToCart={addItem}
                    onViewDetails={(item) =>
                      navigation.navigate('ProductDetail', { id: item.id })
                    }
                  />
                </View>
              ))}
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0fdfa' },
  content: { padding: 18 },
  back: { color: '#0d9488', fontWeight: '700', marginBottom: 12 },
  kicker: { color: '#0d9488', fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  title: { color: '#134e4a', fontSize: 26, fontWeight: '800', marginTop: 5 },
  subtitle: { color: '#64748b', fontSize: 13, lineHeight: 20, marginTop: 8, marginBottom: 14 },
  promotionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#99f6e4',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  promotionIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ccfbf1',
    marginRight: 12,
  },
  promotionIconText: { color: '#0f766e', fontSize: 22, fontWeight: '900' },
  promotionInfo: { flex: 1 },
  promotionDescription: { color: '#134e4a', fontSize: 14, fontWeight: '800' },
  promotionCode: { color: '#0d9488', fontSize: 13, fontWeight: '900', marginTop: 4 },
  promotionCondition: { color: '#64748b', fontSize: 11, marginTop: 3 },
  useCodeButton: {
    backgroundColor: '#0d9488',
    borderRadius: 9,
    paddingHorizontal: 11,
    paddingVertical: 8,
    marginLeft: 8,
  },
  useCodeText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  eligibilityNotice: {
    backgroundColor: '#ecfdf5',
    borderRadius: 12,
    padding: 13,
    marginTop: 4,
    marginBottom: 18,
  },
  eligibilityTitle: { color: '#0f766e', fontSize: 12, fontWeight: '800' },
  eligibilityText: { color: '#475569', fontSize: 11, lineHeight: 17, marginTop: 4 },
  productSection: { marginTop: 8 },
  productSectionTitle: { color: '#134e4a', fontSize: 18, fontWeight: '800', marginBottom: 12 },
  productGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  productColumn: { width: '48%', marginBottom: 14 },
  loader: { marginVertical: 36 },
  emptyBox: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    marginTop: 6,
    marginBottom: 20,
  },
  emptyIcon: { fontSize: 32 },
  emptyTitle: { color: '#134e4a', fontSize: 15, fontWeight: '800', marginTop: 10 },
  emptyText: { color: '#64748b', fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 6 },
  errorBox: { backgroundColor: '#fff1f2', borderRadius: 12, padding: 14, marginTop: 8 },
  errorText: { color: '#be123c', fontSize: 13 },
  retryText: { color: '#0f766e', fontWeight: '800', fontSize: 12, marginTop: 8 },
});

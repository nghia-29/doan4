import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import StoreHeader from '../components/StoreHeader';
import thuocService from '../services/thuocService';
import anhThuocService from '../services/anhThuocService';
import moTaThuocService from '../services/moTaThuocService';
import danhGiaService from '../services/danhGiaService';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { formatPrice } from '../data/mockData';

export default function ProductDetailScreen({ route, navigation }) {
  const { id } = route.params;
  const { addItem, count } = useCart();
  const { user } = useAuth();

  const [product, setProduct] = useState(null);
  const [description, setDescription] = useState(null);
  const [image, setImage] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('cong_dung'); // 'cong_dung' | 'lieu_dung' | 'canh_bao' | 'thanh_phan'
  const [newReviewStar, setNewReviewStar] = useState(5);
  const [newReviewContent, setNewReviewContent] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadProductData();
  }, [id]);

  const loadProductData = async () => {
    setLoading(true);
    try {
      const [item, detail, images, allReviews] = await Promise.all([
        thuocService.getById(id),
        moTaThuocService.getById(id).catch(() => null),
        anhThuocService.getAll().catch(() => []),
        danhGiaService.getAll().catch(() => []),
      ]);

      setProduct(item);
      setDescription(detail);
      setImage(images.find((img) => String(img.id_thuoc) === String(id)));
      setReviews(allReviews.filter((r) => String(r.id_thuoc) === String(id)));
    } catch (requestError) {
      setError(requestError.message || 'Không thể tải thông tin sản phẩm.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (!product) return;
    for (let i = 0; i < quantity; i++) {
      addItem({
        id: product.id,
        name: product.ten_thuoc,
        price: Number(product.gia_ban) || 0,
        unit: product.don_vi_tinh,
        image: image?.duong_dan_anh,
      });
    }
    Alert.alert(
      'Đã thêm vào giỏ',
      `Đã thêm ${quantity} ${product.don_vi_tinh || 'sản phẩm'} ${product.ten_thuoc} vào giỏ hàng.`,
      [
        { text: 'Tiếp tục xem' },
        { text: 'Mở giỏ hàng', onPress: () => navigation.navigate('Cart') },
      ]
    );
  };

  const submitReview = async () => {
    if (!newReviewContent.trim()) {
      Alert.alert('Nhận xét', 'Vui lòng nhập nội dung đánh giá của bạn.');
      return;
    }
    setSubmittingReview(true);
    try {
      await danhGiaService.create({
        id_thuoc: id,
        id_khach_hang: user?.id || 1,
        so_sao: newReviewStar,
        noi_dung: newReviewContent.trim(),
        ngay_danh_gia: new Date().toISOString().slice(0, 10),
      });
      setNewReviewContent('');
      await loadProductData();
      Alert.alert('Cảm ơn bạn', 'Đánh giá sản phẩm của bạn đã được ghi nhận.');
    } catch (e) {
      Alert.alert('Lỗi', e.message || 'Không thể gửi đánh giá.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const isPrescription = product?.loai_ke_don === 'ke_don';

  return (
    <View style={styles.container}>
      <StoreHeader
        cartCount={count}
        onCartPress={() => navigation.navigate('Cart')}
        onAccountPress={() => navigation.navigate('Login')}
      />

      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>‹ Quay lại danh mục thuốc</Text>
        </TouchableOpacity>

        {loading ? (
          <ActivityIndicator style={styles.loader} size="large" color="#0d9488" />
        ) : error ? (
          <Text style={styles.error}>{error}</Text>
        ) : !product ? (
          <Text style={styles.error}>Không tìm thấy thông tin thuốc.</Text>
        ) : (
          <>
            {/* Image & Banner */}
            <View style={styles.imageBox}>
              {image?.duong_dan_anh ? (
                <Image
                  source={{ uri: image.duong_dan_anh }}
                  style={styles.image}
                  resizeMode="cover"
                />
              ) : (
                <Text style={styles.placeholder}>💊</Text>
              )}
              <View
                style={[
                  styles.badge,
                  isPrescription ? styles.badgePrescription : styles.badgeOTC,
                ]}
              >
                <Text
                  style={[
                    styles.badgeText,
                    isPrescription ? styles.badgeTextPrescription : styles.badgeTextOTC,
                  ]}
                >
                  {isPrescription ? 'THUỐC KÊ ĐƠN (ETC)' : 'THUỐC KHÔNG KÊ ĐƠN (OTC)'}
                </Text>
              </View>
            </View>

            {/* Title & Price */}
            <Text style={styles.title}>{product.ten_thuoc}</Text>
            <View style={styles.brandRow}>
              <Text style={styles.brandText}>
                Hãng SX: <Text style={styles.brandBold}>{description?.thuong_hieu || 'Chính hãng'}</Text>
              </Text>
              <Text style={styles.skuText}>Mã SKU: {product.ma_sku || `SP-${product.id}`}</Text>
            </View>

            <View style={styles.priceRow}>
              <Text style={styles.price}>{formatPrice(product.gia_ban)}</Text>
              <Text style={styles.unit}>/ {product.don_vi_tinh || 'Hộp'}</Text>
              <View style={styles.stockTag}>
                <Text style={styles.stockText}>
                  Còn {product.so_luong_ton || 0} {product.don_vi_tinh || 'sản phẩm'}
                </Text>
              </View>
            </View>

            {isPrescription && (
              <View style={styles.prescriptionNotice}>
                <Text style={styles.prescriptionNoticeTitle}>⚠️ Lưu ý thuốc kê đơn</Text>
                <Text style={styles.prescriptionNoticeText}>
                  Thuốc này cần có đơn của bác sĩ. Dược sĩ Nhà Thuốc An Tâm sẽ liên hệ kiểm tra toa thuốc trước khi giao.
                </Text>
              </View>
            )}

            {/* Quantity Adjuster & Add To Cart */}
            <View style={styles.purchaseBox}>
              <View style={styles.qtyRow}>
                <Text style={styles.qtyLabel}>Số lượng mua:</Text>
                <View style={styles.qtyControl}>
                  <TouchableOpacity
                    style={styles.qtyBtn}
                    onPress={() => setQuantity((q) => Math.max(1, q - 1))}
                  >
                    <Text style={styles.qtyBtnText}>−</Text>
                  </TouchableOpacity>
                  <Text style={styles.qtyValue}>{quantity}</Text>
                  <TouchableOpacity
                    style={styles.qtyBtn}
                    onPress={() => setQuantity((q) => q + 1)}
                  >
                    <Text style={styles.qtyBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity style={styles.addToCartBtn} onPress={handleAddToCart}>
                <Text style={styles.addToCartText}>
                  Thêm vào giỏ ({formatPrice(Number(product.gia_ban) * quantity)})
                </Text>
              </TouchableOpacity>
            </View>

            {/* Detailed Medical Information Tabs */}
            <Text style={styles.detailHeading}>Thông tin chi tiết & Hướng dẫn</Text>
            <View style={styles.tabButtonsRow}>
              {[
                ['cong_dung', 'Công dụng'],
                ['thanh_phan', 'Thành phần'],
                ['lieu_dung', 'Liều dùng'],
                ['canh_bao', 'Cảnh báo'],
              ].map(([key, label]) => (
                <TouchableOpacity
                  key={key}
                  style={[styles.tabButton, activeTab === key && styles.tabButtonActive]}
                  onPress={() => setActiveTab(key)}
                >
                  <Text
                    style={[styles.tabButtonText, activeTab === key && styles.tabButtonTextActive]}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.tabContentBox}>
              {activeTab === 'cong_dung' && (
                <>
                  <Text style={styles.contentLabel}>Chỉ định & Công dụng:</Text>
                  <Text style={styles.contentText}>
                    {description?.cong_dung || 'Giảm đau, hạ sốt, hỗ trợ điều trị theo chỉ định.'}
                  </Text>
                  <Text style={styles.contentLabel}>Đối tượng sử dụng:</Text>
                  <Text style={styles.contentText}>
                    {description?.doi_tuong_su_dung || 'Người lớn và trẻ em theo chỉ dẫn.'}
                  </Text>
                </>
              )}

              {activeTab === 'thanh_phan' && (
                <>
                  <Text style={styles.contentLabel}>Hoạt chất & Hàm lượng:</Text>
                  <Text style={styles.contentText}>
                    {description?.thanh_phan || 'Thông tin hoạt chất chính của thuốc'}
                    {description?.ham_luong ? ` (${description.ham_luong})` : ''}
                  </Text>
                  <Text style={styles.contentLabel}>Dạng bào chế & Quy cách:</Text>
                  <Text style={styles.contentText}>
                    {description?.dang_bao_che || 'Viên nén'} · {description?.quy_cach_dong_goi || 'Hộp'}
                  </Text>
                </>
              )}

              {activeTab === 'lieu_dung' && (
                <>
                  <Text style={styles.contentLabel}>Hướng dẫn sử dụng:</Text>
                  <Text style={styles.contentText}>
                    {description?.huong_dan_su_dung || 'Uống với nước lọc sau bữa ăn.'}
                  </Text>
                  <Text style={styles.contentLabel}>Liều dùng khuyến cáo:</Text>
                  <Text style={styles.contentText}>
                    {description?.lieu_dung_khuyen_cao || 'Theo chỉ định của bác sĩ hoặc hướng dẫn trên bao bì.'}
                  </Text>
                </>
              )}

              {activeTab === 'canh_bao' && (
                <>
                  <Text style={styles.contentLabel}>Cảnh báo & Chống chỉ định:</Text>
                  <Text style={styles.contentText}>
                    {description?.canh_bao || 'Không dùng quá liều quy định. Tham khảo ý kiến bác sĩ nếu có triệu chứng bất thường.'}
                  </Text>
                  <Text style={styles.contentLabel}>Bảo quản:</Text>
                  <Text style={styles.contentText}>
                    {description?.bao_quan || 'Nơi khô ráo, thoáng mát, nhiệt độ dưới 30°C, tránh ánh sáng.'}
                  </Text>
                </>
              )}
            </View>

            {/* Reviews Section */}
            <View style={styles.reviewsSection}>
              <Text style={styles.detailHeading}>Đánh giá từ khách hàng ({reviews.length})</Text>
              {reviews.map((r) => (
                <View key={r.id} style={styles.reviewItem}>
                  <View style={styles.reviewHeader}>
                    <Text style={styles.reviewStars}>{'⭐'.repeat(Number(r.so_sao) || 5)}</Text>
                    <Text style={styles.reviewDate}>{r.ngay_danh_gia || 'Gần đây'}</Text>
                  </View>
                  <Text style={styles.reviewText}>{r.noi_dung}</Text>
                </View>
              ))}

              {/* Add Review Box */}
              <View style={styles.addReviewCard}>
                <Text style={styles.addReviewTitle}>Viết nhận xét của bạn</Text>
                <View style={styles.starSelectRow}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity key={star} onPress={() => setNewReviewStar(star)}>
                      <Text style={styles.starIcon}>
                        {star <= newReviewStar ? '⭐' : '☆'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TextInput
                  value={newReviewContent}
                  onChangeText={setNewReviewContent}
                  placeholder="Chia sẻ cảm nhận về hiệu quả thuốc, đóng gói và dịch vụ..."
                  placeholderTextColor="#94a3b8"
                  multiline
                  style={styles.reviewInput}
                />
                <TouchableOpacity
                  style={styles.submitReviewBtn}
                  onPress={submitReview}
                  disabled={submittingReview}
                >
                  <Text style={styles.submitReviewText}>
                    {submittingReview ? 'Đang gửi...' : 'Gửi đánh giá'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0fdfa' },
  content: { padding: 18, paddingBottom: 50 },
  loader: { marginTop: 60 },
  error: { color: '#b91c1c', textAlign: 'center', padding: 30 },
  back: { color: '#0d9488', fontWeight: '700', marginBottom: 12 },
  imageBox: {
    height: 280,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
    position: 'relative',
  },
  image: { width: '100%', height: '100%' },
  placeholder: { flex: 1, textAlign: 'center', textAlignVertical: 'center', fontSize: 70 },
  badge: {
    position: 'absolute',
    left: 12,
    top: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  badgeOTC: { backgroundColor: '#dcfce7' },
  badgePrescription: { backgroundColor: '#fee2e2' },
  badgeText: { fontSize: 11, fontWeight: '800' },
  badgeTextOTC: { color: '#15803d' },
  badgeTextPrescription: { color: '#b91c1c' },
  title: { color: '#134e4a', fontSize: 24, fontWeight: '800' },
  brandRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4, marginBottom: 10 },
  brandText: { color: '#64748b', fontSize: 12 },
  brandBold: { color: '#0f766e', fontWeight: '700' },
  skuText: { color: '#94a3b8', fontSize: 12 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 14 },
  price: { color: '#0d9488', fontWeight: '800', fontSize: 24 },
  unit: { color: '#64748b', fontSize: 14, marginLeft: 4 },
  stockTag: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginLeft: 'auto',
  },
  stockText: { color: '#475569', fontSize: 11, fontWeight: '600' },
  prescriptionNotice: {
    backgroundColor: '#fff1f2',
    borderWidth: 1,
    borderColor: '#fecdd3',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  prescriptionNoticeTitle: { color: '#be123c', fontWeight: '800', fontSize: 13, marginBottom: 2 },
  prescriptionNoticeText: { color: '#881337', fontSize: 12, lineHeight: 18 },
  purchaseBox: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 20,
  },
  qtyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  qtyLabel: { color: '#334155', fontWeight: '700', fontSize: 14 },
  qtyControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  qtyBtn: { paddingHorizontal: 14, paddingVertical: 8 },
  qtyBtnText: { color: '#0d9488', fontSize: 18, fontWeight: '800' },
  qtyValue: { color: '#0f172a', fontWeight: '800', fontSize: 15, minWidth: 26, textAlign: 'center' },
  addToCartBtn: {
    backgroundColor: '#0d9488',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  addToCartText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  detailHeading: { color: '#134e4a', fontSize: 18, fontWeight: '800', marginBottom: 12, marginTop: 8 },
  tabButtonsRow: { flexDirection: 'row', gap: 6, marginBottom: 10 },
  tabButton: {
    flex: 1,
    backgroundColor: '#e6fffa',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  tabButtonActive: { backgroundColor: '#0d9488' },
  tabButtonText: { color: '#0f766e', fontWeight: '700', fontSize: 12 },
  tabButtonTextActive: { color: '#fff' },
  tabContentBox: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 20,
  },
  contentLabel: { color: '#0f766e', fontWeight: '800', fontSize: 13, marginTop: 6, marginBottom: 2 },
  contentText: { color: '#334155', fontSize: 13, lineHeight: 20, marginBottom: 8 },
  reviewsSection: { marginTop: 6 },
  reviewItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 8,
  },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  reviewStars: { fontSize: 14 },
  reviewDate: { color: '#94a3b8', fontSize: 11 },
  reviewText: { color: '#334155', fontSize: 13, lineHeight: 18 },
  addReviewCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginTop: 10,
  },
  addReviewTitle: { color: '#134e4a', fontWeight: '800', fontSize: 14, marginBottom: 8 },
  starSelectRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  starIcon: { fontSize: 24 },
  reviewInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    padding: 10,
    minHeight: 70,
    textAlignVertical: 'top',
    color: '#0f172a',
    fontSize: 13,
    marginBottom: 10,
  },
  submitReviewBtn: {
    backgroundColor: '#0d9488',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  submitReviewText: { color: '#fff', fontWeight: '800', fontSize: 13 },
});

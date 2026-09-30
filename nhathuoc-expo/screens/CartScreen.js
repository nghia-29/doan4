import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import StoreHeader from '../components/StoreHeader';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { createCrudService } from '../services/crudService';
import { formatPrice } from '../data/mockData';

export default function CartScreen({ navigation }) {
  const { items, count, total, increaseItem, decreaseItem, removeItem, clearCart } =
    useCart();
  const { user } = useAuth();

  // Coupon voucher state
  const [couponCode, setCouponCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');

  // Shipping & recipient info
  const [customerName, setCustomerName] = useState('Nguyễn Văn Khách');
  const [phone, setPhone] = useState('0901234567');
  const [address, setAddress] = useState('123 Lê Lợi, Phường Bến Nghé, Quận 1, TP.HCM');
  const [note, setNote] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('tien_mat'); // 'tien_mat' | 'chuyen_khoan' | 'vi_dien_tu'

  // Submitting state & Success modal
  const [submitting, setSubmitting] = useState(false);
  const [successOrder, setSuccessOrder] = useState(null);

  const applyCoupon = async () => {
    setCouponError('');
    if (!couponCode.trim()) return;
    try {
      const coupons = await createCrudService('khuyen_mai').getAll();
      const codeUpper = couponCode.trim().toUpperCase();
      const found = coupons.find((c) => String(c.ma_code).toUpperCase() === codeUpper);

      if (!found) {
        setCouponError('Mã khuyến mãi không tồn tại hoặc đã hết hạn.');
        setDiscountAmount(0);
        setAppliedCoupon(null);
        return;
      }

      if (found.don_toi_thieu && total < Number(found.don_toi_thieu)) {
        setCouponError(
          `Đơn hàng tối thiểu để áp dụng mã này là ${formatPrice(found.don_toi_thieu)}.`
        );
        return;
      }

      let discount = 0;
      if (found.loai_giam === 'phan_tram') {
        discount = Math.round((total * Number(found.gia_tri_giam)) / 100);
      } else {
        discount = Number(found.gia_tri_giam);
      }

      setDiscountAmount(discount);
      setAppliedCoupon(found);
      Alert.alert('Thành công', `Đã áp dụng mã ${found.ma_code}: Giảm ${formatPrice(discount)}!`);
    } catch (e) {
      setCouponError('Không thể kiểm tra mã khuyến mãi.');
    }
  };

  const finalTotal = Math.max(0, total - discountAmount);

  const placeOrder = async () => {
    if (!customerName.trim() || !phone.trim() || !address.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập đầy đủ Tên, Số điện thoại và Địa chỉ nhận hàng.');
      return;
    }

    setSubmitting(true);
    try {
      const donDatService = createCrudService('don_dat_thuoc');
      const chiTietService = createCrudService('chi_tiet_don_dat');
      const historyService = createCrudService('lich_su_theo_doi_don');
      const thanhToanService = createCrudService('thanh_toan');
      const hoaDonService = createCrudService('hoa_don');

      const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 19);

      // 1. Create order
      const newOrder = await donDatService.create({
        id_khach_hang: user?.id || 1,
        id_don_thuoc: null,
        id_khuyen_mai: appliedCoupon?.id || null,
        tong_tien: total,
        giam_gia: discountAmount,
        thanh_tien: finalTotal,
        dia_chi_giao_hang: address.trim(),
        so_dien_thoai_nhan: phone.trim(),
        trang_thai: 'cho_xac_nhan',
        ngay_dat: nowStr,
      });

      const orderId = newOrder.id;

      // 2. Save line items
      for (const item of items) {
        await chiTietService.create({
          id_don_dat: orderId,
          id_thuoc: item.id,
          so_luong: item.quantity,
          don_gia: item.price,
        }).catch(() => {});
      }

      // 3. Create status history log
      await historyService.create({
        id_don_dat: orderId,
        trang_thai_cap_nhat: 'cho_xac_nhan',
        ghi_chu: note.trim() || 'Khách hàng vừa đặt đơn mới từ ứng dụng di động',
        thoi_gian_cap_nhat: nowStr,
      }).catch(() => {});

      // 4. Create payment transaction
      await thanhToanService.create({
        id_don_dat: orderId,
        phuong_thuc: paymentMethod,
        ma_giao_dich: `${paymentMethod.toUpperCase()}${Date.now().toString().slice(-6)}`,
        so_tien: finalTotal,
        trang_thai: paymentMethod === 'tien_mat' ? 'cho_thanh_toan' : 'da_thanh_toan',
        thoi_gian_thanh_toan: paymentMethod === 'tien_mat' ? null : nowStr,
      }).catch(() => {});

      // 5. Create invoice
      await hoaDonService.create({
        id_don_dat: orderId,
        so_hoa_don: `HD${Date.now().toString().slice(-8)}`,
        tong_tien_truoc_thue: finalTotal,
        thue_vat: 0,
        tong_tien_sau_thue: finalTotal,
        ngay_lap: nowStr,
      }).catch(() => {});

      // 6. Clear cart & open success modal
      if (clearCart) clearCart();
      setSuccessOrder({ id: orderId, finalTotal });
    } catch (e) {
      Alert.alert('Không thể đặt hàng', e.message || 'Lỗi xử lý đơn hàng.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <StoreHeader
        cartCount={count}
        onCartPress={() => {}}
        onAccountPress={() => navigation.navigate('Login')}
      />

      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity onPress={() => navigation.navigate('Home')}>
          <Text style={styles.back}>‹ Tiếp tục mua thuốc</Text>
        </TouchableOpacity>

        <Text style={styles.kicker}>MUA SẮM AN TÂM</Text>
        <Text style={styles.title}>Giỏ hàng của bạn ({items.length})</Text>

        {items.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🛍️</Text>
            <Text style={styles.emptyText}>Giỏ hàng của bạn đang trống.</Text>
            <Text style={styles.emptySub}>
              Hãy khám phá các danh mục thuốc chính hãng, vitamin và thực phẩm chức năng.
            </Text>
            <TouchableOpacity
              style={styles.browseBtn}
              onPress={() => navigation.navigate('Products')}
            >
              <Text style={styles.browseBtnText}>Xem danh mục thuốc ngay</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Cart Items List */}
            <View style={styles.itemsSection}>
              {items.map((item) => (
                <View style={styles.itemRow} key={item.id}>
                  <View style={styles.itemIconBox}>
                    <Text style={styles.itemIcon}>💊</Text>
                  </View>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName} numberOfLines={2}>
                      {item.name}
                    </Text>
                    <Text style={styles.itemPrice}>
                      {formatPrice(item.price)}{' '}
                      <Text style={styles.itemUnit}>/ {item.unit || 'hộp'}</Text>
                    </Text>
                  </View>

                  <View style={styles.quantityControls}>
                    <TouchableOpacity
                      style={styles.qtyBtn}
                      onPress={() => decreaseItem(item.id)}
                    >
                      <Text style={styles.qtyBtnText}>−</Text>
                    </TouchableOpacity>
                    <Text style={styles.qtyVal}>{item.quantity}</Text>
                    <TouchableOpacity
                      style={styles.qtyBtn}
                      onPress={() => increaseItem(item.id)}
                    >
                      <Text style={styles.qtyBtnText}>+</Text>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    style={styles.removeBtn}
                    onPress={() => removeItem(item.id)}
                  >
                    <Text style={styles.removeBtnText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            {/* Voucher Section */}
            <View style={styles.couponCard}>
              <Text style={styles.cardHeader}>Mã giảm giá / Voucher</Text>
              <View style={styles.couponInputRow}>
                <TextInput
                  value={couponCode}
                  onChangeText={setCouponCode}
                  placeholder="Nhập mã (e.g. CHAOMUNG10, GIAM20K)"
                  placeholderTextColor="#94a3b8"
                  style={styles.couponInput}
                  autoCapitalize="characters"
                />
                <TouchableOpacity style={styles.couponApplyBtn} onPress={applyCoupon}>
                  <Text style={styles.couponApplyText}>Áp dụng</Text>
                </TouchableOpacity>
              </View>
              {couponError ? <Text style={styles.couponErrorText}>{couponError}</Text> : null}
              {appliedCoupon && (
                <Text style={styles.couponSuccessText}>
                  ✓ Đã áp dụng: {appliedCoupon.mo_ta} (-{formatPrice(discountAmount)})
                </Text>
              )}
            </View>

            {/* Delivery Information */}
            <View style={styles.formCard}>
              <Text style={styles.cardHeader}>Thông tin giao hàng</Text>
              <Text style={styles.inputLabel}>Họ và tên người nhận *</Text>
              <TextInput
                value={customerName}
                onChangeText={setCustomerName}
                placeholder="Nguyễn Văn A"
                placeholderTextColor="#94a3b8"
                style={styles.formInput}
              />

              <Text style={styles.inputLabel}>Số điện thoại nhận hàng *</Text>
              <TextInput
                value={phone}
                onChangeText={setPhone}
                placeholder="0901234567"
                placeholderTextColor="#94a3b8"
                keyboardType="phone-pad"
                style={styles.formInput}
              />

              <Text style={styles.inputLabel}>Địa chỉ giao hàng chi tiết *</Text>
              <TextInput
                value={address}
                onChangeText={setAddress}
                placeholder="Số nhà, tên đường, phường/xã, quận/huyện..."
                placeholderTextColor="#94a3b8"
                multiline
                style={[styles.formInput, { minHeight: 60 }]}
              />

              <Text style={styles.inputLabel}>Ghi chú cho dược sĩ / shipper</Text>
              <TextInput
                value={note}
                onChangeText={setNote}
                placeholder="Giao giờ hành chính, gọi trước khi đến..."
                placeholderTextColor="#94a3b8"
                style={styles.formInput}
              />
            </View>

            {/* Payment Method */}
            <View style={styles.formCard}>
              <Text style={styles.cardHeader}>Phương thức thanh toán</Text>
              <TouchableOpacity
                style={[
                  styles.paymentOption,
                  paymentMethod === 'tien_mat' && styles.paymentOptionActive,
                ]}
                onPress={() => setPaymentMethod('tien_mat')}
              >
                <Text style={styles.paymentRadio}>
                  {paymentMethod === 'tien_mat' ? '🔘' : '⚪'}
                </Text>
                <View>
                  <Text style={styles.paymentTitle}>Thanh toán tiền mặt khi nhận hàng (COD)</Text>
                  <Text style={styles.paymentSub}>Kiểm tra hàng trước khi thanh toán</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.paymentOption,
                  paymentMethod === 'chuyen_khoan' && styles.paymentOptionActive,
                ]}
                onPress={() => setPaymentMethod('chuyen_khoan')}
              >
                <Text style={styles.paymentRadio}>
                  {paymentMethod === 'chuyen_khoan' ? '🔘' : '⚪'}
                </Text>
                <View>
                  <Text style={styles.paymentTitle}>Chuyển khoản ngân hàng (VietQR)</Text>
                  <Text style={styles.paymentSub}>Quét mã QR tự động xác nhận</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.paymentOption,
                  paymentMethod === 'vi_dien_tu' && styles.paymentOptionActive,
                ]}
                onPress={() => setPaymentMethod('vi_dien_tu')}
              >
                <Text style={styles.paymentRadio}>
                  {paymentMethod === 'vi_dien_tu' ? '🔘' : '⚪'}
                </Text>
                <View>
                  <Text style={styles.paymentTitle}>Ví điện tử MoMo / ZaloPay</Text>
                  <Text style={styles.paymentSub}>Thanh toán an toàn, bảo mật</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Order Summary & Confirm */}
            <View style={styles.summaryCard}>
              <Text style={styles.cardHeader}>Tóm tắt chi phí</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Tạm tính tiền thuốc:</Text>
                <Text style={styles.summaryVal}>{formatPrice(total)}</Text>
              </View>
              {discountAmount > 0 && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Giảm giá voucher:</Text>
                  <Text style={[styles.summaryVal, { color: '#e11d48' }]}>
                    -{formatPrice(discountAmount)}
                  </Text>
                </View>
              )}
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Phí giao hàng:</Text>
                <Text style={[styles.summaryVal, { color: '#16a34a' }]}>Miễn phí (0đ)</Text>
              </View>

              <View style={styles.summaryDivider} />

              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Tổng thanh toán:</Text>
                <Text style={styles.totalVal}>{formatPrice(finalTotal)}</Text>
              </View>

              <TouchableOpacity
                style={styles.checkoutBtn}
                onPress={placeOrder}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.checkoutBtnText}>Xác nhận đặt hàng ngay</Text>
                )}
              </TouchableOpacity>
              <Text style={styles.guaranteeText}>
                🛡️ Cam kết 100% thuốc chính hãng · Đổi trả trong 30 ngày
              </Text>
            </View>
          </>
        )}
      </ScrollView>

      {/* Order Success Modal */}
      <Modal visible={!!successOrder} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <Text style={styles.modalSuccessIcon}>🎉</Text>
            <Text style={styles.modalSuccessTitle}>Đặt hàng thành công!</Text>
            <Text style={styles.modalSuccessCode}>
              Mã đơn hàng: #{successOrder?.id}
            </Text>
            <Text style={styles.modalSuccessAmount}>
              Tổng tiền: {formatPrice(successOrder?.finalTotal)}
            </Text>
            <Text style={styles.modalSuccessDesc}>
              Dược sĩ sẽ kiểm tra đơn thuốc và gọi xác nhận trước khi giao hàng tới bạn.
            </Text>

            <TouchableOpacity
              style={styles.modalTrackBtn}
              onPress={() => {
                setSuccessOrder(null);
                navigation.navigate('Customer');
              }}
            >
              <Text style={styles.modalTrackBtnText}>Xem & Theo dõi đơn hàng</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalHomeBtn}
              onPress={() => {
                setSuccessOrder(null);
                navigation.navigate('Home');
              }}
            >
              <Text style={styles.modalHomeBtnText}>Quay về trang chủ</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0fdfa' },
  content: { padding: 18, paddingBottom: 50 },
  back: { color: '#0d9488', fontWeight: '700', marginBottom: 10 },
  kicker: { color: '#0d9488', fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  title: { color: '#134e4a', fontSize: 26, fontWeight: '800', marginTop: 4, marginBottom: 16 },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 52, marginBottom: 10 },
  emptyText: { color: '#1e293b', fontSize: 18, fontWeight: '800' },
  emptySub: { color: '#64748b', fontSize: 13, textAlign: 'center', marginTop: 6, maxWidth: 280 },
  browseBtn: {
    backgroundColor: '#0d9488',
    borderRadius: 12,
    paddingHorizontal: 22,
    paddingVertical: 13,
    marginTop: 20,
  },
  browseBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  itemsSection: { marginBottom: 14 },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  itemIconBox: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#e6fffa',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  itemIcon: { fontSize: 20 },
  itemInfo: { flex: 1, paddingRight: 6 },
  itemName: { color: '#0f172a', fontWeight: '700', fontSize: 14 },
  itemPrice: { color: '#0d9488', fontWeight: '800', fontSize: 13, marginTop: 2 },
  itemUnit: { color: '#64748b', fontWeight: '400', fontSize: 11 },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  qtyBtn: { paddingHorizontal: 10, paddingVertical: 6 },
  qtyBtnText: { color: '#0d9488', fontSize: 16, fontWeight: '800' },
  qtyVal: { color: '#0f172a', fontWeight: '700', fontSize: 13, minWidth: 20, textAlign: 'center' },
  removeBtn: { padding: 8, marginLeft: 6 },
  removeBtnText: { color: '#94a3b8', fontSize: 16, fontWeight: '700' },
  couponCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 14,
  },
  cardHeader: { color: '#134e4a', fontSize: 15, fontWeight: '800', marginBottom: 10 },
  couponInputRow: { flexDirection: 'row', gap: 8 },
  couponInput: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: '#0f172a',
  },
  couponApplyBtn: {
    backgroundColor: '#0d9488',
    borderRadius: 10,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  couponApplyText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  couponErrorText: { color: '#dc2626', fontSize: 12, marginTop: 6 },
  couponSuccessText: { color: '#15803d', fontSize: 12, fontWeight: '700', marginTop: 6 },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 14,
  },
  inputLabel: { color: '#334155', fontSize: 12, fontWeight: '700', marginBottom: 4, marginTop: 6 },
  formInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0f172a',
    marginBottom: 6,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 8,
  },
  paymentOptionActive: { borderColor: '#0d9488', backgroundColor: '#f0fdfa' },
  paymentRadio: { fontSize: 16, marginRight: 10 },
  paymentTitle: { color: '#0f172a', fontWeight: '700', fontSize: 13 },
  paymentSub: { color: '#64748b', fontSize: 11, marginTop: 1 },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  summaryLabel: { color: '#64748b', fontSize: 13 },
  summaryVal: { color: '#1e293b', fontSize: 13, fontWeight: '600' },
  summaryDivider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 10 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { color: '#0f172a', fontSize: 16, fontWeight: '800' },
  totalVal: { color: '#0d9488', fontSize: 22, fontWeight: '800' },
  checkoutBtn: {
    backgroundColor: '#0d9488',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  checkoutBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  guaranteeText: { color: '#64748b', fontSize: 11, textAlign: 'center', marginTop: 10 },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(15,23,42,.6)',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 22,
    padding: 24,
    alignItems: 'center',
  },
  modalSuccessIcon: { fontSize: 50, marginBottom: 8 },
  modalSuccessTitle: { color: '#134e4a', fontSize: 22, fontWeight: '800' },
  modalSuccessCode: { color: '#0d9488', fontSize: 16, fontWeight: '800', marginTop: 6 },
  modalSuccessAmount: { color: '#1e293b', fontSize: 14, fontWeight: '600', marginTop: 4 },
  modalSuccessDesc: {
    color: '#64748b',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 10,
    marginBottom: 20,
  },
  modalTrackBtn: {
    width: '100%',
    backgroundColor: '#0d9488',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    marginBottom: 10,
  },
  modalTrackBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  modalHomeBtn: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalHomeBtnText: { color: '#475569', fontWeight: '700', fontSize: 14 },
});

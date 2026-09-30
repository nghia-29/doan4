import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import StoreHeader from '../components/StoreHeader';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { createCrudService } from '../services/crudService';
import { formatPrice, formatDate, getOrderStatusMeta } from '../data/mockData';

export default function CustomerScreen({ navigation }) {
  const { user, logout } = useAuth();
  const { count } = useCart();
  const [tab, setTab] = useState('orders'); // 'orders' | 'prescriptions' | 'profile'
  const [orders, setOrders] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [customerInfo, setCustomerInfo] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderLines, setOrderLines] = useState([]);
  const [allMedicines, setAllMedicines] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [orderList, presList, custs, meds, allLines] = await Promise.all([
        createCrudService('don_dat_thuoc').getAll().catch(() => []),
        createCrudService('don_thuoc').getAll().catch(() => []),
        createCrudService('khach_hang').getAll().catch(() => []),
        createCrudService('thuoc').getAll().catch(() => []),
        createCrudService('chi_tiet_don_dat').getAll().catch(() => []),
      ]);

      const foundCustomer = custs.find(
        (c) => String(c.id_tai_khoan) === String(user?.id) || c.id === 1
      );
      setCustomerInfo(foundCustomer || custs[0]);

      const custId = foundCustomer?.id || 1;
      const myOrders = orderList.filter((o) => String(o.id_khach_hang) === String(custId));
      const myPres = presList.filter((p) => String(p.id_khach_hang) === String(custId));

      setOrders(myOrders);
      setPrescriptions(myPres);
      setAllMedicines(meds);
      setOrderLines(allLines);
    } catch (e) {
      console.warn('Lỗi tải dữ liệu khách hàng:', e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const viewOrderModal = (order) => {
    setSelectedOrder(order);
    setModalVisible(true);
  };

  const getItemsForOrder = (orderId) => {
    return orderLines.filter((line) => String(line.id_don_dat) === String(orderId));
  };

  return (
    <View style={styles.container}>
      <StoreHeader
        cartCount={count}
        onCartPress={() => navigation.navigate('Cart')}
        onAccountPress={() => navigation.navigate('Login')}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadData} />}
      >
        <TouchableOpacity onPress={() => navigation.navigate('Home')}>
          <Text style={styles.back}>‹ Quay lại mua sắm</Text>
        </TouchableOpacity>

        {/* Customer Greeting Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarBox}>
            <Text style={styles.avatarText}>
              {(customerInfo?.ho_ten || user?.ten_dang_nhap || 'KH')[0].toUpperCase()}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.kicker}>TÀI KHOẢN KHÁCH HÀNG</Text>
            <Text style={styles.customerName}>
              {customerInfo?.ho_ten || user?.ten_dang_nhap || 'Quý khách'}
            </Text>
            <Text style={styles.customerMeta}>
              📞 {customerInfo?.so_dien_thoai || '0901234567'} · ✉️ {customerInfo?.email || 'khachhang@nhathuoc.vn'}
            </Text>
          </View>
        </View>

        {/* Tab switcher */}
        <View style={styles.tabsRow}>
          <TouchableOpacity
            style={[styles.tabBtn, tab === 'orders' && styles.tabBtnActive]}
            onPress={() => setTab('orders')}
          >
            <Text style={[styles.tabText, tab === 'orders' && styles.tabTextActive]}>
              📦 Đơn hàng ({orders.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, tab === 'prescriptions' && styles.tabBtnActive]}
            onPress={() => setTab('prescriptions')}
          >
            <Text style={[styles.tabText, tab === 'prescriptions' && styles.tabTextActive]}>
              🩺 Toa thuốc ({prescriptions.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, tab === 'profile' && styles.tabBtnActive]}
            onPress={() => setTab('profile')}
          >
            <Text style={[styles.tabText, tab === 'profile' && styles.tabTextActive]}>
              👤 Thông tin
            </Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator style={styles.loader} size="large" color="#0d9488" />
        ) : tab === 'orders' ? (
          /* ORDERS TAB */
          <View style={styles.tabContent}>
            {orders.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyIcon}>🛍️</Text>
                <Text style={styles.emptyTitle}>Bạn chưa có đơn đặt hàng nào</Text>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => navigation.navigate('Products')}
                >
                  <Text style={styles.actionBtnText}>Mua thuốc ngay</Text>
                </TouchableOpacity>
              </View>
            ) : (
              orders.map((ord) => {
                const meta = getOrderStatusMeta(ord.trang_thai);
                const items = getItemsForOrder(ord.id);
                return (
                  <TouchableOpacity
                    key={ord.id}
                    style={styles.orderCard}
                    onPress={() => viewOrderModal(ord)}
                  >
                    <View style={styles.orderHeader}>
                      <Text style={styles.orderId}>Đơn hàng #{ord.id}</Text>
                      <View style={[styles.statusBadge, { backgroundColor: meta.bg }]}>
                        <Text style={[styles.statusText, { color: meta.color }]}>
                          {meta.label}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.orderDate}>Ngày đặt: {ord.ngay_dat || 'Mới đặt'}</Text>
                    <Text style={styles.orderAddress} numberOfLines={1}>
                      📍 {ord.dia_chi_giao_hang || 'Tại quầy'}
                    </Text>
                    <View style={styles.orderDivider} />
                    <View style={styles.orderFooter}>
                      <Text style={styles.orderItemsCount}>
                        {items.length > 0 ? `${items.length} sản phẩm` : 'Xem chi tiết'}
                      </Text>
                      <Text style={styles.orderTotal}>
                        {formatPrice(ord.thanh_tien || ord.tong_tien)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        ) : tab === 'prescriptions' ? (
          /* PRESCRIPTIONS TAB */
          <View style={styles.tabContent}>
            {prescriptions.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyIcon}>📋</Text>
                <Text style={styles.emptyTitle}>Chưa có toa thuốc nào được lưu</Text>
                <Text style={styles.emptySub}>
                  Toa thuốc kê bởi bác sĩ sẽ được lưu và kiểm tra tại đây.
                </Text>
              </View>
            ) : (
              prescriptions.map((pres) => (
                <View key={pres.id} style={styles.presCard}>
                  <View style={styles.orderHeader}>
                    <Text style={styles.presTitle}>Toa thuốc #{pres.id}</Text>
                    <View
                      style={[
                        styles.statusBadge,
                        pres.trang_thai === 'da_duyet'
                          ? { backgroundColor: '#dcfce7' }
                          : { backgroundColor: '#fef9c3' },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          pres.trang_thai === 'da_duyet'
                            ? { color: '#15803d' }
                            : { color: '#b45309' },
                        ]}
                      >
                        {pres.trang_thai === 'da_duyet' ? '✓ Đã duyệt' : '⏳ Chờ duyệt'}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.presDate}>Ngày kê: {formatDate(pres.ngay_ke_don)}</Text>
                  {pres.ghi_chu_duyet ? (
                    <Text style={styles.presNote}>
                      Dược sĩ ghi chú: {pres.ghi_chu_duyet}
                    </Text>
                  ) : null}
                </View>
              ))
            )}
          </View>
        ) : (
          /* PROFILE TAB */
          <View style={styles.tabContent}>
            <View style={styles.profileCard}>
              <Text style={styles.profileSectionTitle}>Hồ sơ khách hàng</Text>
              <View style={styles.profileRow}>
                <Text style={styles.pLabel}>Họ và tên:</Text>
                <Text style={styles.pVal}>{customerInfo?.ho_ten || 'Nguyễn Văn Khách'}</Text>
              </View>
              <View style={styles.profileRow}>
                <Text style={styles.pLabel}>Số điện thoại:</Text>
                <Text style={styles.pVal}>{customerInfo?.so_dien_thoai || '0901234567'}</Text>
              </View>
              <View style={styles.profileRow}>
                <Text style={styles.pLabel}>Email:</Text>
                <Text style={styles.pVal}>{customerInfo?.email || 'khachhang1@gmail.com'}</Text>
              </View>
              <View style={styles.profileRow}>
                <Text style={styles.pLabel}>Địa chỉ giao hàng:</Text>
                <Text style={styles.pVal}>{customerInfo?.dia_chi || '123 Lê Lợi, Q.1, TP.HCM'}</Text>
              </View>
              <View style={styles.profileRow}>
                <Text style={styles.pLabel}>Ngày sinh:</Text>
                <Text style={styles.pVal}>{formatDate(customerInfo?.ngay_sinh) || '15/05/1995'}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.logoutBtn}
              onPress={async () => {
                await logout();
                navigation.navigate('Home');
              }}
            >
              <Text style={styles.logoutBtnText}>Đăng xuất tài khoản</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Order Detail Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Chi tiết đơn hàng #{selectedOrder?.id}</Text>
            <ScrollView style={styles.modalBody}>
              <Text style={styles.modalLabel}>Địa chỉ giao hàng:</Text>
              <Text style={styles.modalVal}>{selectedOrder?.dia_chi_giao_hang || '—'}</Text>

              <Text style={styles.modalLabel}>Số điện thoại nhận:</Text>
              <Text style={styles.modalVal}>{selectedOrder?.so_dien_thoai_nhan || '—'}</Text>

              <Text style={styles.modalLabel}>Danh sách thuốc:</Text>
              {getItemsForOrder(selectedOrder?.id).map((line, idx) => {
                const med = allMedicines.find((m) => String(m.id) === String(line.id_thuoc));
                return (
                  <View key={line.id || idx} style={styles.modalLine}>
                    <Text style={styles.modalLineName}>
                      {med?.ten_thuoc || `Thuốc #${line.id_thuoc}`}
                    </Text>
                    <Text style={styles.modalLinePrice}>
                      {line.so_luong} x {formatPrice(line.don_gia)} = {formatPrice(line.so_luong * line.don_gia)}
                    </Text>
                  </View>
                );
              })}

              <View style={styles.modalDivider} />
              <View style={styles.modalTotalRow}>
                <Text style={styles.modalTotalLabel}>Tổng thanh toán:</Text>
                <Text style={styles.modalTotalVal}>
                  {formatPrice(selectedOrder?.thanh_tien || selectedOrder?.tong_tien)}
                </Text>
              </View>
            </ScrollView>

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeBtnText}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0fdfa' },
  content: { padding: 18, paddingBottom: 40 },
  back: { color: '#0d9488', fontWeight: '700', marginBottom: 12 },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
  },
  avatarBox: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#0d9488',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 22 },
  profileInfo: { flex: 1 },
  kicker: { color: '#0d9488', fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
  customerName: { color: '#134e4a', fontSize: 18, fontWeight: '800', marginTop: 2 },
  customerMeta: { color: '#64748b', fontSize: 12, marginTop: 3 },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: '#e6fffa',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabBtnActive: { backgroundColor: '#0d9488' },
  tabText: { color: '#0f766e', fontWeight: '700', fontSize: 12 },
  tabTextActive: { color: '#fff' },
  tabContent: { marginTop: 4 },
  loader: { marginTop: 40 },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 12,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  orderId: { color: '#0f172a', fontWeight: '800', fontSize: 15 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 11, fontWeight: '800' },
  orderDate: { color: '#64748b', fontSize: 12 },
  orderAddress: { color: '#475569', fontSize: 12, marginTop: 4 },
  orderDivider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 10 },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderItemsCount: { color: '#0d9488', fontWeight: '700', fontSize: 12 },
  orderTotal: { color: '#134e4a', fontWeight: '800', fontSize: 16 },
  emptyBox: { alignItems: 'center', paddingVertical: 50 },
  emptyIcon: { fontSize: 48, marginBottom: 10 },
  emptyTitle: { color: '#1e293b', fontSize: 16, fontWeight: '700' },
  emptySub: { color: '#64748b', fontSize: 13, marginTop: 4, textAlign: 'center' },
  actionBtn: {
    backgroundColor: '#0d9488',
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 11,
    marginTop: 14,
  },
  actionBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  presCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 10,
  },
  presTitle: { color: '#0f172a', fontWeight: '800', fontSize: 15 },
  presDate: { color: '#64748b', fontSize: 12, marginTop: 4 },
  presNote: { color: '#0f766e', fontSize: 12, marginTop: 6, fontStyle: 'italic' },
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
  },
  profileSectionTitle: { color: '#134e4a', fontSize: 16, fontWeight: '800', marginBottom: 14 },
  profileRow: { marginBottom: 12 },
  pLabel: { color: '#64748b', fontSize: 12 },
  pVal: { color: '#0f172a', fontSize: 14, fontWeight: '700', marginTop: 2 },
  logoutBtn: {
    borderWidth: 1,
    borderColor: '#f43f5e',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  logoutBtnText: { color: '#e11d48', fontWeight: '800' },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15,23,42,.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalTitle: { color: '#134e4a', fontSize: 18, fontWeight: '800', marginBottom: 12 },
  modalBody: { maxHeight: 340 },
  modalLabel: { color: '#64748b', fontSize: 12, fontWeight: '700', marginTop: 8 },
  modalVal: { color: '#0f172a', fontSize: 13, marginTop: 2 },
  modalLine: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 8,
    marginTop: 6,
  },
  modalLineName: { color: '#0f172a', fontWeight: '700', fontSize: 13 },
  modalLinePrice: { color: '#64748b', fontSize: 12, marginTop: 2 },
  modalDivider: { height: 1, backgroundColor: '#e2e8f0', marginVertical: 12 },
  modalTotalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTotalLabel: { color: '#0f172a', fontWeight: '800', fontSize: 14 },
  modalTotalVal: { color: '#0d9488', fontWeight: '800', fontSize: 18 },
  closeBtn: {
    backgroundColor: '#0d9488',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    marginTop: 14,
  },
  closeBtnText: { color: '#fff', fontWeight: '800' },
});

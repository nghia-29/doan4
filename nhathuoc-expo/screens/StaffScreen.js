import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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

export default function StaffScreen({ navigation }) {
  const { user, logout } = useAuth();
  const { count } = useCart();
  const [activeTab, setActiveTab] = useState('prescriptions'); // 'prescriptions' | 'orders' | 'inventory'
  const [pendingPrescriptions, setPendingPrescriptions] = useState([]);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [lowStockMeds, setLowStockMeds] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [presList, orderList, medList] = await Promise.all([
        createCrudService('don_thuoc').getAll().catch(() => []),
        createCrudService('don_dat_thuoc').getAll().catch(() => []),
        createCrudService('thuoc').getAll().catch(() => []),
      ]);

      setPendingPrescriptions(presList.filter((p) => p.trang_thai !== 'da_duyet'));
      setPendingOrders(orderList.filter((o) => o.trang_thai === 'cho_xac_nhan' || o.trang_thai === 'dang_giao'));
      setLowStockMeds(medList.filter((m) => Number(m.so_luong_ton || 0) < 30));
    } catch (e) {
      console.warn('Lỗi tải dữ liệu nhân viên:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const quickApproveOrder = async (orderId) => {
    try {
      const orderService = createCrudService('don_dat_thuoc');
      const order = await orderService.getById(orderId);
      await orderService.update(orderId, { ...order, trang_thai: 'dang_giao' });
      await createCrudService('lich_su_theo_doi_don').create({
        id_don_dat: orderId,
        trang_thai_cap_nhat: 'dang_giao',
        ghi_chu: 'Dược sĩ/Nhân viên đã xác nhận và chuyển sang giao hàng',
        thoi_gian_cap_nhat: new Date().toISOString().replace('T', ' ').slice(0, 19),
      }).catch(() => {});
      await loadData();
      Alert.alert('Thành công', 'Đã chuyển trạng thái đơn hàng sang: Đang giao.');
    } catch (e) {
      Alert.alert('Lỗi', e.message || 'Không thể cập nhật đơn hàng');
    }
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
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => navigation.navigate('Home')}>
            <Text style={styles.back}>‹ Cửa hàng</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.adminLink}
            onPress={() => navigation.navigate('AdminDashboard')}
          >
            <Text style={styles.adminLinkText}>Mở toàn bộ trang quản trị ›</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.kicker}>KHU VỰC NHÂN VIÊN & DƯỢC SĨ</Text>
        <Text style={styles.title}>Bàn làm việc nghiệp vụ</Text>
        <Text style={styles.subtitle}>
          Xin chào, {user?.ten_dang_nhap || 'Dược sĩ'} ({user?.vai_tro || 'Dược sĩ phụ trách'})
        </Text>

        {/* Quick KPI stats */}
        <View style={styles.kpiRow}>
          <View style={[styles.kpiCard, { borderLeftColor: '#0d9488' }]}>
            <Text style={styles.kpiVal}>{pendingPrescriptions.length}</Text>
            <Text style={styles.kpiLabel}>Toa thuốc cần duyệt</Text>
          </View>
          <View style={[styles.kpiCard, { borderLeftColor: '#0284c7' }]}>
            <Text style={styles.kpiVal}>{pendingOrders.length}</Text>
            <Text style={styles.kpiLabel}>Đơn chờ xác nhận</Text>
          </View>
          <View style={[styles.kpiCard, { borderLeftColor: '#f59e0b' }]}>
            <Text style={styles.kpiVal}>{lowStockMeds.length}</Text>
            <Text style={styles.kpiLabel}>Thuốc sắp hết hàng</Text>
          </View>
        </View>

        {/* Tab switcher */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'prescriptions' && styles.tabActive]}
            onPress={() => setActiveTab('prescriptions')}
          >
            <Text style={[styles.tabText, activeTab === 'prescriptions' && styles.tabTextActive]}>
              🩺 Duyệt toa ({pendingPrescriptions.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'orders' && styles.tabActive]}
            onPress={() => setActiveTab('orders')}
          >
            <Text style={[styles.tabText, activeTab === 'orders' && styles.tabTextActive]}>
              🛒 Xử lý đơn ({pendingOrders.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'inventory' && styles.tabActive]}
            onPress={() => setActiveTab('inventory')}
          >
            <Text style={[styles.tabText, activeTab === 'inventory' && styles.tabTextActive]}>
              📦 Kho & Cảnh báo
            </Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator style={styles.loader} size="large" color="#0d9488" />
        ) : activeTab === 'prescriptions' ? (
          /* PRESCRIPTIONS TAB */
          <View style={styles.section}>
            {pendingPrescriptions.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>🎉</Text>
                <Text style={styles.emptyText}>Hiện tại không có toa thuốc nào chờ duyệt.</Text>
              </View>
            ) : (
              pendingPrescriptions.map((pres) => (
                <View key={pres.id} style={styles.card}>
                  <View style={styles.cardRow}>
                    <Text style={styles.cardTitle}>Toa thuốc #{pres.id}</Text>
                    <View style={styles.statusWait}>
                      <Text style={styles.statusWaitText}>Chờ duyệt</Text>
                    </View>
                  </View>
                  <Text style={styles.cardText}>
                    Bệnh nhân: Khách hàng #{pres.id_khach_hang} · Bác sĩ kê: #{pres.id_bac_si}
                  </Text>
                  <Text style={styles.cardDate}>Ngày kê: {formatDate(pres.ngay_ke_don)}</Text>
                  <TouchableOpacity
                    style={styles.reviewBtn}
                    onPress={() =>
                      navigation.navigate('AdminPrescriptionDetail', { id: pres.id })
                    }
                  >
                    <Text style={styles.reviewBtnText}>Thẩm định & Duyệt toa này ›</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        ) : activeTab === 'orders' ? (
          /* ORDERS TAB */
          <View style={styles.section}>
            {pendingOrders.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>✅</Text>
                <Text style={styles.emptyText}>Tất cả đơn đặt hàng đều đã được xử lý.</Text>
              </View>
            ) : (
              pendingOrders.map((ord) => {
                const meta = getOrderStatusMeta(ord.trang_thai);
                return (
                  <View key={ord.id} style={styles.card}>
                    <View style={styles.cardRow}>
                      <Text style={styles.cardTitle}>Đơn hàng #{ord.id}</Text>
                      <View style={[styles.statusBadge, { backgroundColor: meta.bg }]}>
                        <Text style={[styles.statusBadgeText, { color: meta.color }]}>
                          {meta.label}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.cardText}>
                      Khách hàng: #{ord.id_khach_hang} · SĐT: {ord.so_dien_thoai_nhan || '—'}
                    </Text>
                    <Text style={styles.cardText}>Địa chỉ: {ord.dia_chi_giao_hang || '—'}</Text>
                    <Text style={styles.cardPrice}>
                      Tổng tiền: {formatPrice(ord.thanh_tien || ord.tong_tien)}
                    </Text>
                    <View style={styles.orderActions}>
                      <TouchableOpacity
                        style={styles.viewDetailBtn}
                        onPress={() => navigation.navigate('AdminOrderDetail', { id: ord.id })}
                      >
                        <Text style={styles.viewDetailText}>Xem chi tiết</Text>
                      </TouchableOpacity>
                      {ord.trang_thai === 'cho_xac_nhan' && (
                        <TouchableOpacity
                          style={styles.approveOrderBtn}
                          onPress={() => quickApproveOrder(ord.id)}
                        >
                          <Text style={styles.approveOrderText}>✓ Xác nhận giao hàng</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                );
              })
            )}
          </View>
        ) : (
          /* INVENTORY TAB */
          <View style={styles.section}>
            <Text style={styles.subHeading}>Thuốc tồn kho thấp cần nhập thêm</Text>
            {lowStockMeds.map((med) => (
              <View key={med.id} style={styles.medRow}>
                <View style={styles.medInfo}>
                  <Text style={styles.medName}>{med.ten_thuoc}</Text>
                  <Text style={styles.medMeta}>
                    Mã SKU: {med.ma_sku || 'N/A'} · Giá: {formatPrice(med.gia_ban)}
                  </Text>
                </View>
                <View style={styles.stockBadge}>
                  <Text style={styles.stockVal}>{med.so_luong_ton || 0}</Text>
                  <Text style={styles.stockUnit}>{med.don_vi_tinh || 'hộp'}</Text>
                </View>
              </View>
            ))}

            <TouchableOpacity
              style={styles.newReceiptBtn}
              onPress={() => navigation.navigate('AdminCrud', { entity: 'phieu_nhap_thuoc' })}
            >
              <Text style={styles.newReceiptBtnText}>+ Lập phiếu nhập kho mới</Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={async () => {
            await logout();
            navigation.navigate('Home');
          }}
        >
          <Text style={styles.logoutBtnText}>Đăng xuất tài khoản</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0fdfa' },
  content: { padding: 18, paddingBottom: 40 },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  back: { color: '#0d9488', fontWeight: '700', fontSize: 13 },
  adminLink: {
    backgroundColor: '#ccfbf1',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  adminLinkText: { color: '#0f766e', fontWeight: '800', fontSize: 12 },
  kicker: { color: '#0d9488', fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  title: { color: '#134e4a', fontSize: 26, fontWeight: '800', marginTop: 4 },
  subtitle: { color: '#64748b', fontSize: 13, marginTop: 4, marginBottom: 16 },
  kpiRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  kpiCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderLeftWidth: 3,
  },
  kpiVal: { color: '#0f172a', fontWeight: '800', fontSize: 18 },
  kpiLabel: { color: '#64748b', fontSize: 11, marginTop: 2 },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#e6fffa',
    borderRadius: 12,
    padding: 4,
    marginBottom: 14,
  },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 9 },
  tabActive: { backgroundColor: '#0d9488' },
  tabText: { color: '#0f766e', fontWeight: '700', fontSize: 11 },
  tabTextActive: { color: '#fff' },
  section: { marginTop: 4 },
  loader: { marginTop: 40 },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyIcon: { fontSize: 40, marginBottom: 8 },
  emptyText: { color: '#64748b', fontSize: 14 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 10,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardTitle: { color: '#0f172a', fontWeight: '800', fontSize: 15 },
  statusWait: { backgroundColor: '#fef9c3', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusWaitText: { color: '#a16207', fontWeight: '800', fontSize: 11 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusBadgeText: { fontWeight: '800', fontSize: 11 },
  cardText: { color: '#475569', fontSize: 13, marginBottom: 3 },
  cardDate: { color: '#94a3b8', fontSize: 12, marginTop: 4 },
  cardPrice: { color: '#0d9488', fontWeight: '800', fontSize: 15, marginTop: 6 },
  reviewBtn: {
    backgroundColor: '#0d9488',
    borderRadius: 9,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  reviewBtnText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  orderActions: { flexDirection: 'row', gap: 10, marginTop: 10 },
  viewDetailBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingVertical: 9,
    alignItems: 'center',
  },
  viewDetailText: { color: '#475569', fontWeight: '700', fontSize: 12 },
  approveOrderBtn: {
    flex: 1,
    backgroundColor: '#0d9488',
    borderRadius: 8,
    paddingVertical: 9,
    alignItems: 'center',
  },
  approveOrderText: { color: '#fff', fontWeight: '800', fontSize: 12 },
  subHeading: { color: '#134e4a', fontWeight: '800', fontSize: 15, marginBottom: 10 },
  medRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 8,
  },
  medInfo: { flex: 1 },
  medName: { color: '#0f172a', fontWeight: '700', fontSize: 14 },
  medMeta: { color: '#64748b', fontSize: 12, marginTop: 2 },
  stockBadge: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
  },
  stockVal: { color: '#dc2626', fontWeight: '800', fontSize: 16 },
  stockUnit: { color: '#dc2626', fontSize: 10 },
  newReceiptBtn: {
    backgroundColor: '#0d9488',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 14,
  },
  newReceiptBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  logoutBtn: {
    borderWidth: 1,
    borderColor: '#f43f5e',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginTop: 24,
    backgroundColor: '#fff',
  },
  logoutBtnText: { color: '#e11d48', fontWeight: '800' },
});

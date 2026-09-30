import React, { useCallback, useEffect, useState } from 'react';
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
import StoreHeader from '../components/StoreHeader';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { ADMIN_ENTITIES } from './adminConfig';
import { createCrudService } from '../services/crudService';
import { formatPrice } from '../data/mockData';

const GROUPS = [
  'Dược phẩm & Kho',
  'Bán hàng & Đơn thuốc',
  'Tài chính & Khuyến mãi',
  'Đối tác & Hệ thống',
];

const ENTITY_ICONS = {
  thuoc: '💊',
  mo_ta_thuoc: '📝',
  danh_muc_thuoc: '🏷️',
  anh_thuoc: '🖼️',
  phieu_nhap_thuoc: '📦',
  chi_tiet_phieu_nhap: '📋',
  lich_su_trang_thai_nhap: '⏱️',
  don_dat_thuoc: '🛒',
  chi_tiet_don_dat: '🧾',
  don_thuoc: '🩺',
  chi_tiet_don_thuoc: '📑',
  lich_su_theo_doi_don: '🚚',
  gio_hang: '🛍️',
  hoa_don: '📜',
  thanh_toan: '💳',
  khuyen_mai: '🎁',
  nha_cung_cap: '🏭',
  bac_si: '👨‍⚕️',
  khach_hang: '👥',
  nhan_vien: '🧑‍💼',
  tai_khoan: '🔐',
  vai_tro: '🛡️',
  danh_gia: '⭐',
  v_thuoc_ke_don: '🔖',
  v_thuoc_sap_het_han: '⚠️',
};

export default function AdminDashboardScreen({ navigation }) {
  const { user, logout } = useAuth();
  const { count } = useCart();
  const [search, setSearch] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('Tất cả');
  const [stats, setStats] = useState({
    thuocCount: 0,
    khachHangCount: 0,
    donDatCount: 0,
    tongDoanhThu: 0,
    phieuNhapCount: 0,
    bacSiCount: 0,
  });
  const [alerts, setAlerts] = useState({
    sapHetHan: [],
    lowStock: [],
    pendingOrders: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [thuocList, khachList, donList, phieuList, bacSiList, sapHetHanList] =
        await Promise.all([
          createCrudService('thuoc').getAll().catch(() => []),
          createCrudService('khach_hang').getAll().catch(() => []),
          createCrudService('don_dat_thuoc').getAll().catch(() => []),
          createCrudService('phieu_nhap_thuoc').getAll().catch(() => []),
          createCrudService('bac_si').getAll().catch(() => []),
          createCrudService('v_thuoc_sap_het_han').getAll().catch(() => []),
        ]);

      const revenue = donList.reduce(
        (sum, order) => sum + Number(order.thanh_tien || order.tong_tien || 0),
        0
      );
      const lowStock = thuocList.filter((item) => Number(item.so_luong_ton || 0) < 20);
      const pending = donList.filter((order) => order.trang_thai === 'cho_xac_nhan').length;

      setStats({
        thuocCount: thuocList.length,
        khachHangCount: khachList.length,
        donDatCount: donList.length,
        tongDoanhThu: revenue,
        phieuNhapCount: phieuList.length,
        bacSiCount: bacSiList.length,
      });

      setAlerts({
        sapHetHan: sapHetHanList,
        lowStock,
        pendingOrders: pending,
      });
    } catch (e) {
      setError(e.message || 'Không thể tải số liệu quản trị.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const allEntities = Object.entries(ADMIN_ENTITIES).map(([key, config]) => ({
    key,
    ...config,
    icon: ENTITY_ICONS[key] || '📁',
  }));

  const filteredEntities = allEntities.filter((item) => {
    const matchGroup = selectedGroup === 'Tất cả' || item.group === selectedGroup;
    const matchSearch =
      !search ||
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.resource.toLowerCase().includes(search.toLowerCase());
    return matchGroup && matchSearch;
  });

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
            <Text style={styles.backLink}>‹ Về cửa hàng</Text>
          </TouchableOpacity>
          <View style={styles.userBadge}>
            <Text style={styles.userBadgeText}>
              {user?.ten_dang_nhap || 'Admin'} ({user?.vai_tro || 'quản trị'})
            </Text>
          </View>
        </View>

        <Text style={styles.kicker}>TRUNG TÂM QUẢN TRỊ</Text>
        <Text style={styles.title}>Quản lý Nhà Thuốc</Text>
        <Text style={styles.subtitle}>
          Tổng quan vận hành, số liệu và quản lý 25 danh mục dữ liệu hệ thống
        </Text>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { borderLeftColor: '#0d9488' }]}>
            <Text style={styles.statLabel}>Thuốc trong kho</Text>
            <Text style={[styles.statValue, { color: '#0d9488' }]}>{stats.thuocCount}</Text>
            <Text style={styles.statSub}>Sản phẩm niêm yết</Text>
          </View>
          <View style={[styles.statCard, { borderLeftColor: '#0284c7' }]}>
            <Text style={styles.statLabel}>Đơn đặt hàng</Text>
            <Text style={[styles.statValue, { color: '#0284c7' }]}>{stats.donDatCount}</Text>
            <Text style={styles.statSub}>{alerts.pendingOrders} đơn chờ duyệt</Text>
          </View>
          <View style={[styles.statCard, { borderLeftColor: '#16a34a' }]}>
            <Text style={styles.statLabel}>Doanh thu ghi nhận</Text>
            <Text style={[styles.statValue, { color: '#16a34a', fontSize: 18 }]}>
              {formatPrice(stats.tongDoanhThu)}
            </Text>
            <Text style={styles.statSub}>Từ đơn đã tạo</Text>
          </View>
          <View style={[styles.statCard, { borderLeftColor: '#eab308' }]}>
            <Text style={styles.statLabel}>Khách hàng & Bác sĩ</Text>
            <Text style={[styles.statValue, { color: '#ca8a04' }]}>
              {stats.khachHangCount + stats.bacSiCount}
            </Text>
            <Text style={styles.statSub}>{stats.khachHangCount} khách · {stats.bacSiCount} bác sĩ</Text>
          </View>
        </View>

        {/* Operational Alerts */}
        {(alerts.sapHetHan.length > 0 || alerts.lowStock.length > 0 || alerts.pendingOrders > 0) && (
          <View style={styles.alertBox}>
            <Text style={styles.alertHeader}>🔔 Cảnh báo vận hành cần chú ý</Text>
            {alerts.pendingOrders > 0 && (
              <TouchableOpacity
                style={styles.alertRow}
                onPress={() => navigation.navigate('AdminCrud', { entity: 'don_dat_thuoc' })}
              >
                <Text style={styles.alertItem}>
                  • Có <Text style={styles.bold}>{alerts.pendingOrders} đơn hàng mới</Text> đang chờ xác nhận.
                </Text>
                <Text style={styles.alertAction}>Xem ›</Text>
              </TouchableOpacity>
            )}
            {alerts.sapHetHan.length > 0 && (
              <TouchableOpacity
                style={styles.alertRow}
                onPress={() => navigation.navigate('AdminCrud', { entity: 'v_thuoc_sap_het_han' })}
              >
                <Text style={styles.alertItem}>
                  • Có <Text style={styles.bold}>{alerts.sapHetHan.length} thuốc sắp hết hạn</Text> trong vòng 60 ngày.
                </Text>
                <Text style={styles.alertAction}>Xem ›</Text>
              </TouchableOpacity>
            )}
            {alerts.lowStock.length > 0 && (
              <TouchableOpacity
                style={styles.alertRow}
                onPress={() => navigation.navigate('AdminCrud', { entity: 'thuoc' })}
              >
                <Text style={styles.alertItem}>
                  • Có <Text style={styles.bold}>{alerts.lowStock.length} mặt hàng sắp hết</Text> (tồn kho &lt; 20).
                </Text>
                <Text style={styles.alertAction}>Xem ›</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Search & Groups Filter */}
        <View style={styles.searchSection}>
          <Text style={styles.sectionTitle}>Danh mục quản lý ({allEntities.length})</Text>
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Tìm theo tên module (thuốc, đơn, hóa đơn, khách...)"
            placeholderTextColor="#94a3b8"
            style={styles.searchInput}
          />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.groupsScroll}>
            {['Tất cả', ...GROUPS].map((group) => (
              <TouchableOpacity
                key={group}
                style={[styles.groupChip, selectedGroup === group && styles.groupChipActive]}
                onPress={() => setSelectedGroup(group)}
              >
                <Text
                  style={[styles.groupText, selectedGroup === group && styles.groupTextActive]}
                >
                  {group}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Entity List */}
        <View style={styles.entityGrid}>
          {filteredEntities.map((item) => (
            <TouchableOpacity
              key={item.key}
              style={styles.entityCard}
              onPress={() => navigation.navigate('AdminCrud', { entity: item.key })}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.cardIcon}>{item.icon}</Text>
                <Text style={styles.cardArrow}>›</Text>
              </View>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardResource}>{item.resource}</Text>
              <View style={styles.cardBadge}>
                <Text style={styles.cardBadgeText}>{item.group}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={async () => {
            await logout();
            navigation.navigate('Home');
          }}
        >
          <Text style={styles.logoutBtnText}>Đăng xuất tài khoản quản trị</Text>
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
  backLink: { color: '#0d9488', fontWeight: '700', fontSize: 14 },
  userBadge: {
    backgroundColor: '#ccfbf1',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  userBadgeText: { color: '#0f766e', fontSize: 12, fontWeight: '700' },
  kicker: { color: '#0d9488', fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  title: { color: '#134e4a', fontSize: 28, fontWeight: '800', marginTop: 4 },
  subtitle: { color: '#64748b', fontSize: 13, marginTop: 4, marginBottom: 18 },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderLeftWidth: 4,
  },
  statLabel: { color: '#64748b', fontSize: 12, fontWeight: '600' },
  statValue: { fontSize: 22, fontWeight: '800', marginTop: 4 },
  statSub: { color: '#94a3b8', fontSize: 11, marginTop: 4 },
  alertBox: {
    backgroundColor: '#fffbeb',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#fef08a',
    marginBottom: 18,
  },
  alertHeader: { color: '#92400e', fontWeight: '800', fontSize: 14, marginBottom: 8 },
  alertRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
  },
  alertItem: { color: '#78350f', fontSize: 13, flex: 1 },
  alertAction: { color: '#0d9488', fontWeight: '800', fontSize: 14, paddingLeft: 8 },
  bold: { fontWeight: '700' },
  searchSection: { marginBottom: 14 },
  sectionTitle: { color: '#134e4a', fontSize: 18, fontWeight: '800', marginBottom: 10 },
  searchInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    padding: 12,
    fontSize: 14,
    color: '#0f172a',
    marginBottom: 10,
  },
  groupsScroll: { flexDirection: 'row', marginBottom: 6 },
  groupChip: {
    backgroundColor: '#fff',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 7,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  groupChipActive: {
    backgroundColor: '#0d9488',
    borderColor: '#0d9488',
  },
  groupText: { color: '#475569', fontSize: 12, fontWeight: '700' },
  groupTextActive: { color: '#fff' },
  entityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 6,
  },
  entityCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardIcon: { fontSize: 24 },
  cardArrow: { fontSize: 20, color: '#94a3b8' },
  cardTitle: { color: '#0f172a', fontSize: 14, fontWeight: '800', marginTop: 8 },
  cardResource: { color: '#64748b', fontSize: 11, marginTop: 2, fontFamily: 'monospace' },
  cardBadge: {
    backgroundColor: '#f1f5f9',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  cardBadgeText: { color: '#475569', fontSize: 10, fontWeight: '600' },
  logoutBtn: {
    borderWidth: 1,
    borderColor: '#f43f5e',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginTop: 24,
    backgroundColor: '#fff',
  },
  logoutBtnText: { color: '#e11d48', fontWeight: '800', fontSize: 14 },
  errorBox: {
    backgroundColor: '#fee2e2',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
  },
  errorText: { color: '#b91c1c', fontSize: 13 },
});

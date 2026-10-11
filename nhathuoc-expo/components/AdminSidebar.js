import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { useAuth } from '../context/AuthContext';
import {
  isAdminRole,
  isPharmacistRole,
  STAFF_MANAGEMENT_ENTITY_KEYS,
} from '../utils/workspaceAccess';

const ADMIN_SECTIONS = [
  {
    title: 'TỔNG QUAN',
    items: [{ key: 'dashboard', icon: '▦', label: 'Bảng điều khiển', screen: 'AdminDashboard' }],
  },
  {
    title: 'TÀI KHOẢN & NHÂN SỰ',
    items: [
      { key: 'tai_khoan', icon: '◎', label: 'Tài khoản', entity: 'tai_khoan' },
      { key: 'nhan_vien', icon: '♙', label: 'Nhân viên', entity: 'nhan_vien' },
      { key: 'bac_si', icon: '⚕', label: 'Dược sĩ kê đơn', entity: 'bac_si' },
      { key: 'khach_hang', icon: '♧', label: 'Khách hàng', entity: 'khach_hang' },
      { key: 'vai_tro', icon: '⛨', label: 'Vai trò', entity: 'vai_tro' },
    ],
  },
  {
    title: 'BÁN HÀNG & TÀI CHÍNH',
    items: [
      { key: 'don_dat_thuoc', icon: '▣', label: 'Đơn hàng', entity: 'don_dat_thuoc' },
      { key: 'chi_tiet_don_dat', icon: '☷', label: 'Chi tiết đơn hàng', entity: 'chi_tiet_don_dat' },
      { key: 'lich_su_theo_doi_don', icon: '◷', label: 'Lịch sử đơn hàng', entity: 'lich_su_theo_doi_don' },
      { key: 'don_thuoc', icon: '☷', label: 'Đơn thuốc', screen: 'Staff', params: { tab: 'prescriptions' } },
      { key: 'chi_tiet_don_thuoc', icon: '≡', label: 'Chi tiết đơn thuốc', entity: 'chi_tiet_don_thuoc' },
      { key: 'v_toa_con_lai', icon: '▤', label: 'Toa thuốc còn lại', entity: 'v_toa_con_lai' },
      { key: 'gio_hang', icon: '🛒', label: 'Giỏ hàng', entity: 'gio_hang' },
      { key: 'khuyen_mai', icon: '％', label: 'Khuyến mãi', entity: 'khuyen_mai' },
      { key: 'hoa_don', icon: '▤', label: 'Hóa đơn', entity: 'hoa_don' },
      { key: 'thanh_toan', icon: '＄', label: 'Thanh toán', entity: 'thanh_toan' },
      { key: 'danh_gia', icon: '☆', label: 'Đánh giá', entity: 'danh_gia' },
    ],
  },
];

const STAFF_MANAGEMENT_ITEMS = [
  { key: 'phieu_nhap_thuoc', icon: '⇣', label: 'Phiếu nhập kho' },
  { key: 'chi_tiet_phieu_nhap', icon: '☷', label: 'Chi tiết nhập kho' },
  { key: 'lich_su_trang_thai_nhap', icon: '◷', label: 'Lịch sử nhập kho' },
  { key: 'chi_tiet_xuat_lo', icon: '⇡', label: 'Xuất kho theo lô' },
  { key: 'v_ton_kho_theo_lo', icon: '▤', label: 'Tồn kho FEFO' },
  { key: 'lo_thuoc', icon: '◉', label: 'Lô thuốc' },
  { key: 'thuoc', icon: '✚', label: 'Thuốc' },
  { key: 'danh_muc_thuoc', icon: '◈', label: 'Danh mục thuốc' },
  { key: 'mo_ta_thuoc', icon: '≡', label: 'Mô tả thuốc' },
  { key: 'nha_cung_cap', icon: '⌂', label: 'Nhà cung cấp' },
  { key: 'v_thuoc_ke_don', icon: '▤', label: 'Thuốc kê đơn' },
  { key: 'v_thuoc_sap_het_han', icon: '⚠', label: 'Thuốc sắp hết hạn' },
].filter((item) => STAFF_MANAGEMENT_ENTITY_KEYS.includes(item.key));

const STAFF_SECTIONS = [
  {
    title: 'NGHIỆP VỤ',
    items: [
      { key: 'prescriptions', icon: '☷', label: 'Yêu cầu & duyệt toa', screen: 'Staff', params: { tab: 'prescriptions' } },
      { key: 'orders', icon: '▣', label: 'Xử lý đơn hàng', screen: 'Staff', params: { tab: 'orders' } },
      { key: 'inventory', icon: '▤', label: 'Kho & cảnh báo', screen: 'Staff', params: { tab: 'inventory' } },
    ],
  },
  {
    title: 'KHO & SẢN PHẨM',
    items: STAFF_MANAGEMENT_ITEMS.slice(0, 10).map((item) => ({ ...item, entity: item.key })),
  },
  {
    title: 'DỮ LIỆU THUỐC',
    items: STAFF_MANAGEMENT_ITEMS.slice(10).map((item) => ({ ...item, entity: item.key })),
  },
];

export default function AdminSidebar({ activeKey, navigation, variant = 'admin' }) {
  const { width } = useWindowDimensions();
  const { user, logout } = useAuth();
  const compact = width < 720;
  const sections = variant === 'staff'
    ? [
      ...STAFF_SECTIONS.map((section) => ({
        ...section,
        items: section.items.filter(
          (item) => item.key !== 'prescriptions' || isPharmacistRole(user?.vai_tro)
        ),
      })).filter((section) => section.items.length),
      ...(isAdminRole(user?.vai_tro)
        ? [{
          title: 'QUẢN TRỊ',
          items: [{ key: 'admin', icon: '⚙', label: 'Quản trị hệ thống', screen: 'AdminDashboard' }],
        }]
        : []),
    ]
    : ADMIN_SECTIONS.map((section) => ({
      ...section,
      items: section.items.filter(
        (item) => !['don_thuoc', 'chi_tiet_don_thuoc'].includes(item.key)
          || isPharmacistRole(user?.vai_tro)
      ),
    })).filter((section) => section.items.length).concat({
      title: 'DƯỢC PHẨM & KHO',
      items: STAFF_MANAGEMENT_ITEMS.map((item) => ({ ...item, entity: item.key })),
    });

  const openItem = (item) => {
    if (item.screen) {
      navigation.navigate(item.screen, item.params);
      return;
    }
    navigation.navigate('AdminCrud', { entity: item.entity });
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
    } catch (error) {
      Alert.alert('Không thể đăng xuất', error.message || 'Vui lòng thử lại.');
    }
  };

  return (
    <View style={[styles.sidebar, compact && styles.compactSidebar]}>
      <View style={styles.brand}>
        <View style={styles.brandMark}><Text style={styles.brandMarkText}>LT</Text></View>
        {!compact && (
          <View>
            <Text style={styles.brandName}>NHÀ THUỐC LT</Text>
            <Text style={styles.brandCaption}>HỆ THỐNG QUẢN TRỊ</Text>
          </View>
        )}
      </View>

      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Xem trang chủ"
        style={[styles.homeButton, compact && styles.compactHomeButton]}
        onPress={() => navigation.navigate('Home')}
      >
        <Text style={styles.homeIcon}>⌂</Text>
        {!compact && <Text style={styles.homeText}>Xem Trang Chủ</Text>}
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.menu}>
        {sections.map((section) => (
          <View key={section.title} style={styles.section}>
            {!compact && <Text style={styles.sectionTitle}>{section.title}</Text>}
            {section.items.map((item) => {
              const active = activeKey === item.key;
              return (
                <TouchableOpacity
                  key={item.key}
                  accessibilityRole="button"
                  accessibilityLabel={item.label}
                  accessibilityState={{ selected: active }}
                  style={[styles.item, active && styles.activeItem, compact && styles.compactItem]}
                  onPress={() => openItem(item)}
                >
                  <Text style={[styles.itemIcon, active && styles.activeItemText]}>{item.icon}</Text>
                  {!compact && (
                    <Text style={[styles.itemLabel, active && styles.activeItemText]} numberOfLines={1}>
                      {item.label}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </ScrollView>

      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Đăng xuất"
        style={[styles.logout, compact && styles.compactItem]}
        onPress={handleLogout}
      >
        <Text style={styles.logoutIcon}>↪</Text>
        {!compact && <Text style={styles.logoutText}>Đăng xuất hệ thống</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    width: 258,
    flexShrink: 0,
    height: '100%',
    backgroundColor: '#102a2a',
    paddingHorizontal: 14,
    paddingTop: 18,
    paddingBottom: 14,
    borderRightWidth: 1,
    borderRightColor: '#173b3a',
  },
  compactSidebar: { width: 68, paddingHorizontal: 7 },
  brand: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#244342',
  },
  brandMark: {
    height: 36,
    width: 36,
    borderRadius: 11,
    backgroundColor: '#0d9488',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  brandMarkText: { color: '#fff', fontWeight: '900', fontSize: 13 },
  brandName: { color: '#f0fdfa', fontSize: 13, fontWeight: '900', letterSpacing: 0.3 },
  brandCaption: { color: '#86a8a5', fontSize: 9, fontWeight: '700', marginTop: 3, letterSpacing: 0.5 },
  homeButton: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
    backgroundColor: '#174644',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#27625e',
  },
  compactHomeButton: { marginHorizontal: 2 },
  homeIcon: { color: '#5eead4', fontSize: 16, fontWeight: '900', marginRight: 7 },
  homeText: { color: '#d1fae5', fontSize: 12, fontWeight: '800' },
  menu: { paddingTop: 8, paddingBottom: 14 },
  section: { marginTop: 17 },
  sectionTitle: {
    color: '#70908e',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.6,
    paddingHorizontal: 10,
    marginBottom: 7,
  },
  item: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    borderRadius: 9,
    marginBottom: 3,
  },
  compactItem: { justifyContent: 'center', paddingHorizontal: 0 },
  activeItem: { backgroundColor: '#1a4845', borderLeftWidth: 3, borderLeftColor: '#2dd4bf' },
  itemIcon: { width: 24, color: '#8aaba7', fontSize: 16, textAlign: 'center' },
  itemLabel: { color: '#c0d2d0', fontSize: 12, fontWeight: '600', marginLeft: 8, flex: 1 },
  activeItemText: { color: '#5eead4', fontWeight: '800' },
  logout: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#244342',
    paddingHorizontal: 10,
    paddingTop: 10,
  },
  logoutIcon: { width: 24, color: '#fda4af', fontSize: 16, textAlign: 'center' },
  logoutText: { color: '#fda4af', fontSize: 12, fontWeight: '700', marginLeft: 8 },
});

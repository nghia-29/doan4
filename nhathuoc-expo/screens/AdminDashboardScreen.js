import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import StoreHeader from '../components/StoreHeader';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { createCrudService } from '../services/crudService';

const resources = [
  ['thuoc', '💊', 'Thuốc'], ['danh_muc_thuoc', '🏷️', 'Danh mục'], ['nha_cung_cap', '🚚', 'Nhà cung cấp'], ['bac_si', '🩺', 'Bác sĩ'], ['khach_hang', '👥', 'Khách hàng'], ['nhan_vien', '🧑‍💼', 'Nhân viên'], ['don_dat_thuoc', '🛒', 'Đơn đặt thuốc'], ['phieu_nhap_thuoc', '📦', 'Phiếu nhập'], ['hoa_don', '🧾', 'Hóa đơn'], ['tai_khoan', '🔐', 'Tài khoản'], ['khuyen_mai', '🏷️', 'Khuyến mãi'], ['thanh_toan', '💳', 'Thanh toán'],
];

export default function AdminDashboardScreen({ navigation }) {
  const { user, logout } = useAuth();
  const { count } = useCart();
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    setLoading(true); setError('');
    const result = await Promise.all(resources.slice(0, 9).map(async ([resource, , label]) => { try { return [label, (await createCrudService(resource).getAll()).length]; } catch { return [label, 0]; } }));
    setStats(result); setLoading(false);
  }, []);
  useEffect(() => { load().catch(() => { setError('Không thể tải số liệu dashboard.'); setLoading(false); }); }, [load]);

  return <View style={styles.container}><StoreHeader cartCount={count} onCartPress={() => navigation.navigate('Cart')} onAccountPress={() => navigation.navigate('Login')} /><ScrollView refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />} contentContainerStyle={styles.content}><Text style={styles.kicker}>KHU VỰC QUẢN TRỊ</Text><Text style={styles.title}>Dashboard</Text><Text style={styles.subtitle}>Xin chào, {user?.ten_dang_nhap || 'quản trị viên'}</Text>{error ? <Text style={styles.error}>{error}</Text> : loading ? <ActivityIndicator size="large" color="#1d9bf0" style={styles.loader} /> : <View style={styles.stats}>{stats.map(([label, value]) => <View style={styles.stat} key={label}><Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>)}</View>}<Text style={styles.sectionTitle}>Quản lý dữ liệu</Text><View style={styles.menu}>{resources.map(([resource, icon, label]) => <TouchableOpacity key={resource} style={styles.menuItem} onPress={() => navigation.navigate('AdminCrud', { entity: resource })}><Text style={styles.icon}>{icon}</Text><Text style={styles.menuLabel}>{label}</Text><Text style={styles.arrow}>›</Text></TouchableOpacity>)}</View><TouchableOpacity style={styles.logout} onPress={async () => { await logout(); navigation.navigate('Home'); }}><Text style={styles.logoutText}>Đăng xuất tài khoản</Text></TouchableOpacity></ScrollView></View>;
}

const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: '#f5f9ff' }, content: { padding: 20, paddingBottom: 40 }, kicker: { color: '#2cb67d', fontSize: 11, fontWeight: '800', letterSpacing: 1 }, title: { color: '#0f172a', fontSize: 31, fontWeight: '800', marginTop: 5 }, subtitle: { color: '#64748b', marginTop: 5 }, loader: { margin: 35 }, error: { color: '#be123c', marginTop: 25 }, stats: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 22 }, stat: { width: '48%', backgroundColor: '#fff', borderRadius: 15, padding: 15, marginBottom: 10, borderWidth: 1, borderColor: '#e8edf6' }, statValue: { color: '#1d9bf0', fontSize: 26, fontWeight: '800' }, statLabel: { color: '#475569', marginTop: 3 }, sectionTitle: { color: '#0f172a', fontSize: 21, fontWeight: '800', marginTop: 22, marginBottom: 10 }, menu: { backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#e8edf6' }, menuItem: { flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: '#eef2f7' }, icon: { fontSize: 21, width: 38 }, menuLabel: { flex: 1, color: '#0f172a', fontWeight: '700' }, arrow: { color: '#94a3b8', fontSize: 25 }, logout: { borderWidth: 1, borderColor: '#e11d48', borderRadius: 13, padding: 14, alignItems: 'center', marginTop: 22 }, logoutText: { color: '#e11d48', fontWeight: '800' },
});

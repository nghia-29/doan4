import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import StoreHeader from '../components/StoreHeader';
import { useCart } from '../context/CartContext';
import { createCrudService } from '../services/crudService';

const statuses = [
  ['cho_xac_nhan', 'Chờ xác nhận'],
  ['dang_giao', 'Đang giao'],
  ['hoan_thanh', 'Hoàn thành'],
  ['da_huy', 'Đã hủy'],
];

export default function AdminOrderDetailScreen({ route, navigation }) {
  const { id } = route.params;
  const { count } = useCart();
  const orderService = createCrudService('don_dat_thuoc');
  const historyService = createCrudService('lich_su_theo_doi_don');
  const [order, setOrder] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [item, events] = await Promise.all([orderService.getById(id), historyService.getAll().catch(() => [])]);
      setOrder(item);
      setHistory(events.filter((event) => String(event.id_don_dat) === String(id)));
    } catch (requestError) { setError(requestError.message); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [id]);

  const changeStatus = async (status) => {
    setUpdating(true);
    try {
      await orderService.update(id, { ...order, trang_thai: status });
      await historyService.create({ id_don_dat: id, trang_thai_cap_nhat: status, thoi_gian_cap_nhat: new Date().toISOString() }).catch(() => {});
      await load();
      Alert.alert('Thành công', 'Đã cập nhật trạng thái đơn hàng.');
    } catch (requestError) { Alert.alert('Không thể cập nhật', requestError.message); } finally { setUpdating(false); }
  };

  const current = order?.trang_thai || 'cho_xac_nhan';
  return <View style={styles.container}><StoreHeader cartCount={count} onCartPress={() => navigation.navigate('Cart')} onAccountPress={() => navigation.navigate('Login')} /><View style={styles.content}>{loading ? <ActivityIndicator size="large" color="#1d9bf0" /> : error ? <Text style={styles.error}>{error}</Text> : <><TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.back}>‹ Danh sách đơn</Text></TouchableOpacity><Text style={styles.kicker}>CHI TIẾT ĐƠN ĐẶT</Text><Text style={styles.title}>Đơn hàng #{id}</Text><View style={styles.card}><Text style={styles.label}>Trạng thái hiện tại</Text><Text style={styles.status}>{statuses.find(([value]) => value === current)?.[1] || current}</Text><Text style={styles.total}>Tổng tiền: {Number(order?.tong_tien || 0).toLocaleString('vi-VN')} đ</Text>{statuses.filter(([value]) => value !== current && (current !== 'da_huy' || value === 'cho_xac_nhan')).map(([value, label]) => <TouchableOpacity key={value} style={styles.action} onPress={() => changeStatus(value)} disabled={updating}><Text style={styles.actionText}>{updating ? 'Đang cập nhật...' : `Chuyển sang: ${label}`}</Text></TouchableOpacity>)}</View><Text style={styles.heading}>Lịch sử xử lý ({history.length})</Text>{history.map((event, index) => <View style={styles.history} key={`${event.id || index}`}><Text style={styles.historyTitle}>{event.trang_thai_cap_nhat || event.trang_thai}</Text><Text style={styles.historyDate}>{event.thoi_gian_cap_nhat || '—'}</Text></View>)}</>}</View></View>;
}

const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: '#f5f9ff' }, content: { padding: 20 }, back: { color: '#1d9bf0', fontWeight: '700', marginBottom: 18 }, kicker: { color: '#2cb67d', fontSize: 11, fontWeight: '800', letterSpacing: 1 }, title: { color: '#0f172a', fontSize: 29, fontWeight: '800', marginTop: 6 }, card: { backgroundColor: '#fff', borderRadius: 16, padding: 18, marginTop: 18, borderWidth: 1, borderColor: '#e8edf6' }, label: { color: '#64748b' }, status: { color: '#1d9bf0', fontSize: 22, fontWeight: '800', marginTop: 5 }, total: { color: '#334155', marginTop: 12 }, action: { backgroundColor: '#1d9bf0', borderRadius: 11, padding: 12, alignItems: 'center', marginTop: 12 }, actionText: { color: '#fff', fontWeight: '800' }, heading: { color: '#0f172a', fontWeight: '800', fontSize: 19, marginTop: 24, marginBottom: 10 }, history: { backgroundColor: '#fff', borderLeftWidth: 3, borderLeftColor: '#2cb67d', padding: 12, marginBottom: 8 }, historyTitle: { color: '#0f172a', fontWeight: '700' }, historyDate: { color: '#64748b', fontSize: 12, marginTop: 4 }, error: { color: '#be123c' },
});

import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import StoreHeader from '../components/StoreHeader';
import { useCart } from '../context/CartContext';
import { createCrudService } from '../services/crudService';

export default function AdminReceiptDetailScreen({ route, navigation }) {
  const { id } = route.params;
  const { count } = useCart();
  const receiptService = createCrudService('phieu_nhap_thuoc');
  const historyService = createCrudService('lich_su_trang_thai_nhap');
  const [receipt, setReceipt] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [item, events] = await Promise.all([receiptService.getById(id), historyService.getAll().catch(() => [])]);
      setReceipt(item);
      setHistory(events.filter((event) => String(event.id_phieu_nhap) === String(id)));
    } catch (requestError) { setError(requestError.message); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [id]);

  const confirmed = history.some((event) => (event.trang_thai || '').toLowerCase() === 'da_nhap_kho');
  const confirmImport = async () => {
    setProcessing(true);
    try {
      await historyService.create({ id_phieu_nhap: id, trang_thai: 'da_nhap_kho', thoi_gian_cap_nhat: new Date().toISOString() });
      await load();
      Alert.alert('Thành công', 'Đã xác nhận nhập kho và cập nhật lịch sử.');
    } catch (requestError) { Alert.alert('Không thể xác nhận', requestError.message); } finally { setProcessing(false); }
  };

  return <View style={styles.container}><StoreHeader cartCount={count} onCartPress={() => navigation.navigate('Cart')} onAccountPress={() => navigation.navigate('Login')} /><View style={styles.content}>{loading ? <ActivityIndicator size="large" color="#1d9bf0" /> : error ? <Text style={styles.error}>{error}</Text> : <><TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.back}>‹ Danh sách phiếu nhập</Text></TouchableOpacity><Text style={styles.kicker}>CHI TIẾT PHIẾU NHẬP</Text><Text style={styles.title}>Phiếu nhập #{id}</Text><View style={styles.card}><Text style={styles.label}>Nhà cung cấp: #{receipt?.id_nha_cung_cap || '—'}</Text><Text style={styles.label}>Nhân viên nhập: #{receipt?.id_nhan_vien || '—'}</Text><Text style={styles.total}>Tổng tiền: {Number(receipt?.tong_tien || 0).toLocaleString('vi-VN')} đ</Text><Text style={confirmed ? styles.confirmed : styles.pending}>{confirmed ? 'Đã nhập kho' : 'Chưa xác nhận nhập kho'}</Text>{!confirmed && <TouchableOpacity style={styles.action} onPress={confirmImport} disabled={processing}><Text style={styles.actionText}>{processing ? 'Đang xử lý...' : 'Xác nhận nhập kho'}</Text></TouchableOpacity>}</View><Text style={styles.heading}>Lịch sử ({history.length})</Text>{history.map((event, index) => <View style={styles.history} key={`${event.id || index}`}><Text style={styles.historyTitle}>{event.trang_thai}</Text><Text style={styles.historyDate}>{event.thoi_gian_cap_nhat || '—'}</Text></View>)}</>}</View></View>;
}

const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: '#f5f9ff' }, content: { padding: 20 }, back: { color: '#1d9bf0', fontWeight: '700', marginBottom: 18 }, kicker: { color: '#2cb67d', fontSize: 11, fontWeight: '800', letterSpacing: 1 }, title: { color: '#0f172a', fontSize: 29, fontWeight: '800', marginTop: 6 }, card: { backgroundColor: '#fff', borderRadius: 16, padding: 18, marginTop: 18, borderWidth: 1, borderColor: '#e8edf6' }, label: { color: '#475569', marginBottom: 8 }, total: { color: '#0f172a', fontWeight: '800', fontSize: 18, marginTop: 8 }, confirmed: { color: '#15803d', fontWeight: '800', marginTop: 14 }, pending: { color: '#b45309', fontWeight: '800', marginTop: 14 }, action: { backgroundColor: '#1d9bf0', borderRadius: 11, padding: 13, alignItems: 'center', marginTop: 15 }, actionText: { color: '#fff', fontWeight: '800' }, heading: { color: '#0f172a', fontWeight: '800', fontSize: 19, marginTop: 24, marginBottom: 10 }, history: { backgroundColor: '#fff', borderLeftWidth: 3, borderLeftColor: '#2cb67d', padding: 12, marginBottom: 8 }, historyTitle: { color: '#0f172a', fontWeight: '700' }, historyDate: { color: '#64748b', fontSize: 12, marginTop: 4 }, error: { color: '#be123c' },
});

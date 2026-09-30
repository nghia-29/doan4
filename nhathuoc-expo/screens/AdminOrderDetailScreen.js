import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import StoreHeader from '../components/StoreHeader';
import { useCart } from '../context/CartContext';
import { createCrudService } from '../services/crudService';
import { formatPrice, getOrderStatusMeta } from '../data/mockData';

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
  const itemsService = createCrudService('chi_tiet_don_dat');
  const historyService = createCrudService('lich_su_theo_doi_don');
  const paymentService = createCrudService('thanh_toan');
  const customerService = createCrudService('khach_hang');
  const medicineService = createCrudService('thuoc');

  const [order, setOrder] = useState(null);
  const [orderItems, setOrderItems] = useState([]);
  const [history, setHistory] = useState([]);
  const [payment, setPayment] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [ord, allItems, allHistory, allPayments, allCustomers, allMeds] =
        await Promise.all([
          orderService.getById(id),
          itemsService.getAll().catch(() => []),
          historyService.getAll().catch(() => []),
          paymentService.getAll().catch(() => []),
          customerService.getAll().catch(() => []),
          medicineService.getAll().catch(() => []),
        ]);

      setOrder(ord);
      setOrderItems(allItems.filter((line) => String(line.id_don_dat) === String(id)));
      setHistory(allHistory.filter((event) => String(event.id_don_dat) === String(id)));
      setPayment(allPayments.find((p) => String(p.id_don_dat) === String(id)));
      setCustomer(allCustomers.find((c) => String(c.id) === String(ord?.id_khach_hang)));
      setMedicines(allMeds);
    } catch (requestError) {
      setError(requestError.message || 'Không thể tải đơn hàng.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const changeStatus = async (newStatus) => {
    setUpdating(true);
    try {
      await orderService.update(id, { ...order, trang_thai: newStatus });
      await historyService
        .create({
          id_don_dat: id,
          trang_thai_cap_nhat: newStatus,
          ghi_chu: `Quản trị viên chuyển trạng thái sang ${newStatus}`,
          thoi_gian_cap_nhat: new Date().toISOString().replace('T', ' ').slice(0, 19),
        })
        .catch(() => {});
      await loadData();
      Alert.alert('Thành công', 'Đã cập nhật trạng thái đơn hàng.');
    } catch (requestError) {
      Alert.alert('Không thể cập nhật', requestError.message);
    } finally {
      setUpdating(false);
    }
  };

  const currentStatus = order?.trang_thai || 'cho_xac_nhan';
  const meta = getOrderStatusMeta(currentStatus);

  return (
    <View style={styles.container}>
      <StoreHeader
        cartCount={count}
        onCartPress={() => navigation.navigate('Cart')}
        onAccountPress={() => navigation.navigate('Login')}
      />

      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>‹ Danh sách đơn hàng</Text>
        </TouchableOpacity>

        <Text style={styles.kicker}>CHI TIẾT ĐƠN HÀNG</Text>
        <Text style={styles.title}>Đơn đặt #{id}</Text>

        {loading ? (
          <ActivityIndicator size="large" color="#0d9488" style={styles.loader} />
        ) : error ? (
          <Text style={styles.error}>{error}</Text>
        ) : (
          <>
            {/* Status card */}
            <View style={styles.card}>
              <View style={styles.badgeRow}>
                <Text style={styles.cardLabel}>Trạng thái hiện tại:</Text>
                <View style={[styles.statusBadge, { backgroundColor: meta.bg }]}>
                  <Text style={[styles.statusText, { color: meta.color }]}>{meta.label}</Text>
                </View>
              </View>

              <Text style={styles.infoLine}>
                <Text style={styles.infoLabel}>Khách hàng:</Text>{' '}
                {customer?.ho_ten || `Khách hàng #${order?.id_khach_hang}`}
              </Text>
              <Text style={styles.infoLine}>
                <Text style={styles.infoLabel}>SĐT nhận hàng:</Text>{' '}
                {order?.so_dien_thoai_nhan || customer?.so_dien_thoai || '—'}
              </Text>
              <Text style={styles.infoLine}>
                <Text style={styles.infoLabel}>Địa chỉ giao hàng:</Text>{' '}
                {order?.dia_chi_giao_hang || '—'}
              </Text>
              <Text style={styles.infoLine}>
                <Text style={styles.infoLabel}>Ngày đặt:</Text> {order?.ngay_dat || '—'}
              </Text>

              {payment && (
                <Text style={styles.infoLine}>
                  <Text style={styles.infoLabel}>Thanh toán:</Text>{' '}
                  {payment.phuong_thuc === 'vi_dien_tu'
                    ? 'Ví điện tử'
                    : payment.phuong_thuc === 'chuyen_khoan'
                    ? 'Chuyển khoản'
                    : 'Tiền mặt khi nhận (COD)'}{' '}
                  · ({payment.trang_thai === 'da_thanh_toan' ? 'Đã thanh toán' : 'Chưa thanh toán'})
                </Text>
              )}

              <View style={styles.divider} />

              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Tạm tính:</Text>
                <Text style={styles.priceVal}>{formatPrice(order?.tong_tien)}</Text>
              </View>
              {Number(order?.giam_gia || 0) > 0 && (
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>Giảm giá voucher:</Text>
                  <Text style={[styles.priceVal, { color: '#e11d48' }]}>
                    -{formatPrice(order?.giam_gia)}
                  </Text>
                </View>
              )}
              <View style={[styles.priceRow, { marginTop: 6 }]}>
                <Text style={styles.totalLabel}>Thành tiền:</Text>
                <Text style={styles.totalVal}>
                  {formatPrice(order?.thanh_tien || order?.tong_tien)}
                </Text>
              </View>

              <Text style={styles.actionPrompt}>Chuyển trạng thái đơn:</Text>
              <View style={styles.actionRow}>
                {statuses.map(([st, label]) => (
                  <TouchableOpacity
                    key={st}
                    style={[
                      styles.actionChip,
                      currentStatus === st && styles.actionChipActive,
                    ]}
                    onPress={() => changeStatus(st)}
                    disabled={updating || currentStatus === st}
                  >
                    <Text
                      style={[
                        styles.actionChipText,
                        currentStatus === st && styles.actionChipTextActive,
                      ]}
                    >
                      {label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Line Items */}
            <Text style={styles.sectionHeading}>Sản phẩm trong đơn ({orderItems.length})</Text>
            {orderItems.map((line, idx) => {
              const med = medicines.find((m) => String(m.id) === String(line.id_thuoc));
              return (
                <View key={line.id || idx} style={styles.itemCard}>
                  <View style={styles.itemHeader}>
                    <Text style={styles.itemName}>
                      {med?.ten_thuoc || `Thuốc #${line.id_thuoc}`}
                    </Text>
                    <Text style={styles.itemTotal}>
                      {formatPrice(Number(line.don_gia) * Number(line.so_luong))}
                    </Text>
                  </View>
                  <Text style={styles.itemDetail}>
                    Số lượng: {line.so_luong} {med?.don_vi_tinh || 'hộp'} x {formatPrice(line.don_gia)}
                  </Text>
                </View>
              );
            })}

            {/* History Timeline */}
            <Text style={styles.sectionHeading}>Lịch sử cập nhật ({history.length})</Text>
            {history.map((event, index) => (
              <View style={styles.historyCard} key={`${event.id || index}`}>
                <Text style={styles.historyStatus}>
                  {getOrderStatusMeta(event.trang_thai_cap_nhat).label}
                </Text>
                {event.ghi_chu ? (
                  <Text style={styles.historyNote}>{event.ghi_chu}</Text>
                ) : null}
                <Text style={styles.historyTime}>{event.thoi_gian_cap_nhat || '—'}</Text>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0fdfa' },
  content: { padding: 18, paddingBottom: 40 },
  back: { color: '#0d9488', fontWeight: '700', marginBottom: 10 },
  kicker: { color: '#0d9488', fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  title: { color: '#134e4a', fontSize: 26, fontWeight: '800', marginTop: 4, marginBottom: 14 },
  loader: { marginTop: 40 },
  error: { color: '#b91c1c' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 18,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardLabel: { color: '#64748b', fontSize: 13, fontWeight: '600' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontWeight: '800', fontSize: 12 },
  infoLine: { color: '#334155', fontSize: 13, marginBottom: 5 },
  infoLabel: { color: '#64748b', fontWeight: '600' },
  divider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 12 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  priceLabel: { color: '#64748b', fontSize: 13 },
  priceVal: { color: '#334155', fontWeight: '600', fontSize: 13 },
  totalLabel: { color: '#0f172a', fontWeight: '800', fontSize: 15 },
  totalVal: { color: '#0d9488', fontWeight: '800', fontSize: 18 },
  actionPrompt: {
    color: '#0f172a',
    fontWeight: '700',
    fontSize: 13,
    marginTop: 14,
    marginBottom: 8,
  },
  actionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  actionChip: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    backgroundColor: '#fff',
  },
  actionChipActive: { backgroundColor: '#0d9488', borderColor: '#0d9488' },
  actionChipText: { color: '#475569', fontSize: 12, fontWeight: '700' },
  actionChipTextActive: { color: '#fff' },
  sectionHeading: {
    color: '#134e4a',
    fontWeight: '800',
    fontSize: 17,
    marginTop: 10,
    marginBottom: 10,
  },
  itemCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 8,
  },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  itemName: { color: '#0f172a', fontWeight: '700', fontSize: 14, flex: 1 },
  itemTotal: { color: '#0d9488', fontWeight: '800', fontSize: 14 },
  itemDetail: { color: '#64748b', fontSize: 12, marginTop: 4 },
  historyCard: {
    backgroundColor: '#fff',
    borderLeftWidth: 3,
    borderLeftColor: '#0d9488',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  historyStatus: { color: '#0f172a', fontWeight: '700', fontSize: 13 },
  historyNote: { color: '#475569', fontSize: 12, marginTop: 2 },
  historyTime: { color: '#94a3b8', fontSize: 11, marginTop: 4 },
});

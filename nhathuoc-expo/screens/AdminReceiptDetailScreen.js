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
import { formatPrice, formatDate } from '../data/mockData';

export default function AdminReceiptDetailScreen({ route, navigation }) {
  const { id } = route.params;
  const { count } = useCart();
  const receiptService = createCrudService('phieu_nhap_thuoc');
  const itemsService = createCrudService('chi_tiet_phieu_nhap');
  const historyService = createCrudService('lich_su_trang_thai_nhap');
  const supplierService = createCrudService('nha_cung_cap');
  const staffService = createCrudService('nhan_vien');
  const medicineService = createCrudService('thuoc');

  const [receipt, setReceipt] = useState(null);
  const [items, setItems] = useState([]);
  const [history, setHistory] = useState([]);
  const [supplier, setSupplier] = useState(null);
  const [staff, setStaff] = useState(null);
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [rcpt, allItems, allHistory, allSuppliers, allStaff, allMeds] =
        await Promise.all([
          receiptService.getById(id),
          itemsService.getAll().catch(() => []),
          historyService.getAll().catch(() => []),
          supplierService.getAll().catch(() => []),
          staffService.getAll().catch(() => []),
          medicineService.getAll().catch(() => []),
        ]);

      setReceipt(rcpt);
      setItems(allItems.filter((line) => String(line.id_phieu_nhap) === String(id)));
      setHistory(allHistory.filter((event) => String(event.id_phieu_nhap) === String(id)));
      setSupplier(allSuppliers.find((s) => String(s.id) === String(rcpt?.id_nha_cung_cap)));
      setStaff(allStaff.find((st) => String(st.id) === String(rcpt?.id_nhan_vien)));
      setMedicines(allMeds);
    } catch (requestError) {
      setError(requestError.message || 'Không thể tải phiếu nhập.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const confirmed = history.some(
    (event) => (event.trang_thai || '').toLowerCase() === 'da_nhap_kho'
  );

  const confirmImport = async () => {
    setProcessing(true);
    try {
      await historyService.create({
        id_phieu_nhap: id,
        trang_thai: 'da_nhap_kho',
        nguoi_cap_nhat: staff?.id || 1,
        ghi_chu: 'Thủ kho xác nhận hàng đã kiểm tra thực tế và nhập kho thành công.',
        thoi_gian_cap_nhat: new Date().toISOString().replace('T', ' ').slice(0, 19),
      });

      // Update stock quantity for each medicine in this receipt
      for (const line of items) {
        const med = medicines.find((m) => String(m.id) === String(line.id_thuoc));
        if (med) {
          const newStock = Number(med.so_luong_ton || 0) + Number(line.so_luong || 0);
          await medicineService.update(med.id, { ...med, so_luong_ton: newStock }).catch(() => {});
        }
      }

      await loadData();
      Alert.alert('Thành công', 'Đã xác nhận nhập kho và cộng số lượng tồn kho của thuốc.');
    } catch (requestError) {
      Alert.alert('Không thể xác nhận', requestError.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <View style={styles.container}>
      <StoreHeader
        cartCount={count}
        onCartPress={() => navigation.navigate('Cart')}
        onAccountPress={() => navigation.navigate('Login')}
      />

      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>‹ Danh sách phiếu nhập</Text>
        </TouchableOpacity>

        <Text style={styles.kicker}>QUẢN LÝ NHẬP KHO</Text>
        <Text style={styles.title}>Phiếu nhập #{id}</Text>

        {loading ? (
          <ActivityIndicator size="large" color="#0d9488" style={styles.loader} />
        ) : error ? (
          <Text style={styles.error}>{error}</Text>
        ) : (
          <>
            <View style={styles.card}>
              <View style={styles.badgeRow}>
                <Text style={styles.cardLabel}>Trạng thái kho:</Text>
                <View style={[styles.statusBadge, confirmed ? styles.badgeDone : styles.badgeWait]}>
                  <Text style={[styles.statusText, confirmed ? styles.textDone : styles.textWait]}>
                    {confirmed ? '✓ Đã nhập kho' : '⏳ Chờ nhập kho'}
                  </Text>
                </View>
              </View>

              <Text style={styles.infoLine}>
                <Text style={styles.infoLabel}>Nhà cung cấp:</Text>{' '}
                {supplier?.ten_nha_cung_cap || `Nhà cung cấp #${receipt?.id_nha_cung_cap}`}
              </Text>
              <Text style={styles.infoLine}>
                <Text style={styles.infoLabel}>Người liên hệ:</Text>{' '}
                {supplier?.nguoi_lien_he || '—'} · {supplier?.so_dien_thoai || '—'}
              </Text>
              <Text style={styles.infoLine}>
                <Text style={styles.infoLabel}>Nhân viên lập phiếu:</Text>{' '}
                {staff?.ho_ten || `Nhân viên #${receipt?.id_nhan_vien}`}
              </Text>
              <Text style={styles.infoLine}>
                <Text style={styles.infoLabel}>Ngày nhập:</Text> {formatDate(receipt?.ngay_nhap)}
              </Text>
              {receipt?.ghi_chu ? (
                <Text style={styles.infoLine}>
                  <Text style={styles.infoLabel}>Ghi chú:</Text> {receipt.ghi_chu}
                </Text>
              ) : null}

              <View style={styles.divider} />

              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Tổng tiền phiếu nhập:</Text>
                <Text style={styles.totalValue}>{formatPrice(receipt?.tong_tien)}</Text>
              </View>

              {!confirmed && (
                <TouchableOpacity
                  style={styles.confirmBtn}
                  onPress={confirmImport}
                  disabled={processing}
                >
                  <Text style={styles.confirmBtnText}>
                    {processing ? 'Đang cập nhật tồn kho...' : '✓ Xác nhận nhập kho thực tế'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Line Items */}
            <Text style={styles.sectionHeading}>Danh sách thuốc nhập ({items.length})</Text>
            {items.map((line, idx) => {
              const med = medicines.find((m) => String(m.id) === String(line.id_thuoc));
              return (
                <View key={line.id || idx} style={styles.itemCard}>
                  <View style={styles.itemHeader}>
                    <Text style={styles.itemName}>
                      {med?.ten_thuoc || `Thuốc #${line.id_thuoc}`}
                    </Text>
                    <Text style={styles.itemTotal}>
                      {formatPrice(Number(line.gia_nhap) * Number(line.so_luong))}
                    </Text>
                  </View>
                  <Text style={styles.itemMeta}>
                    Số lượng: <Text style={styles.bold}>{line.so_luong}</Text> {med?.don_vi_tinh || 'hộp'} x {formatPrice(line.gia_nhap)}
                  </Text>
                  <View style={styles.lotBox}>
                    <Text style={styles.lotText}>
                      Số lô: <Text style={styles.bold}>{line.so_lo || 'N/A'}</Text> · Hạn dùng: <Text style={styles.bold}>{formatDate(line.han_su_dung)}</Text>
                    </Text>
                  </View>
                </View>
              );
            })}

            {/* History */}
            <Text style={styles.sectionHeading}>Lịch sử trạng thái ({history.length})</Text>
            {history.map((event, index) => (
              <View style={styles.historyCard} key={`${event.id || index}`}>
                <Text style={styles.historyStatus}>
                  {event.trang_thai === 'da_nhap_kho' ? 'Đã nhập kho thành công' : event.trang_thai}
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
  badgeDone: { backgroundColor: '#dcfce7' },
  badgeWait: { backgroundColor: '#fef9c3' },
  textDone: { color: '#15803d', fontWeight: '800', fontSize: 12 },
  textWait: { color: '#b45309', fontWeight: '800', fontSize: 12 },
  infoLine: { color: '#334155', fontSize: 13, marginBottom: 5 },
  infoLabel: { color: '#64748b', fontWeight: '600' },
  divider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 12 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { color: '#0f172a', fontWeight: '800', fontSize: 14 },
  totalValue: { color: '#0d9488', fontWeight: '800', fontSize: 18 },
  confirmBtn: {
    backgroundColor: '#0d9488',
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 14,
  },
  confirmBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
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
  itemMeta: { color: '#64748b', fontSize: 12, marginTop: 4 },
  bold: { color: '#0d9488', fontWeight: '700' },
  lotBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 6,
    padding: 6,
    marginTop: 6,
  },
  lotText: { color: '#475569', fontSize: 11 },
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

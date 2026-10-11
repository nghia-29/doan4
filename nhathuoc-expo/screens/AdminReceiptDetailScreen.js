import React, { useEffect, useState } from 'react';
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
import AdminSidebar from '../components/AdminSidebar';
import WorkspaceHeader from '../components/WorkspaceHeader';
import { useAuth } from '../context/AuthContext';
import { createCrudService } from '../services/crudService';
import { formatPrice, formatDate } from '../data/mockData';
import { getWorkspaceRoute, isAdminRole, isStaffRole } from '../utils/workspaceAccess';

export default function AdminReceiptDetailScreen({ route, navigation }) {
  const { id } = route.params;
  const { user, ready } = useAuth();
  const receiptService = createCrudService('phieu_nhap_thuoc');
  const itemsService = createCrudService('chi_tiet_phieu_nhap');
  const historyService = createCrudService('lich_su_trang_thai_nhap');
  const supplierService = createCrudService('nha_cung_cap');
  const staffService = createCrudService('nhan_vien');

  const [receipt, setReceipt] = useState(null);
  const [items, setItems] = useState([]);
  const [history, setHistory] = useState([]);
  const [supplier, setSupplier] = useState(null);
  const [staff, setStaff] = useState(null);
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [lineModalVisible, setLineModalVisible] = useState(false);
  const [medicineSelectorOpen, setMedicineSelectorOpen] = useState(false);
  const [medicineQuery, setMedicineQuery] = useState('');
  const [lineDraft, setLineDraft] = useState({
    id_thuoc: '',
    so_luong: '',
    gia_nhap: '',
    so_lo: '',
    han_su_dung: '',
  });
  const [error, setError] = useState('');
  const isAdmin = isAdminRole(user?.vai_tro);
  const canAccessReceipt = isAdmin || isStaffRole(user?.vai_tro);

  const loadData = async () => {
    setLoading(true);
    try {
      const [rcpt, allItems, allHistory, allSuppliers, allStaff, allMedicines] =
        await Promise.all([
          receiptService.getById(id),
          itemsService.getAll().catch(() => []),
          historyService.getAll().catch(() => []),
          supplierService.getAll().catch(() => []),
          staffService.getAll().catch(() => []),
          createCrudService('thuoc').getAll(),
        ]);

      setReceipt(rcpt);
      setItems(allItems.filter((line) => String(line.id_phieu_nhap) === String(id)));
      setHistory(allHistory.filter((event) => String(event.id_phieu_nhap) === String(id)));
      setSupplier(allSuppliers.find((s) => String(s.id) === String(rcpt?.id_nha_cung_cap)));
      setStaff(allStaff.find((st) => String(st.id) === String(rcpt?.id_nhan_vien)));
      setMedicines(allMedicines);
    } catch (requestError) {
      setError(requestError.message || 'Không thể tải phiếu nhập.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!ready) return;
    if (!canAccessReceipt) {
      navigation.replace(getWorkspaceRoute(user?.vai_tro));
      return;
    }
    loadData();
  }, [canAccessReceipt, id, navigation, ready, user?.vai_tro]);

  const confirmed = history.some(
    (event) => (event.trang_thai || '').toLowerCase() === 'da_nhap_kho'
  );

  const confirmImport = async () => {
    if (!items.length) {
      Alert.alert('Phiếu nhập chưa có thuốc', 'Hãy thêm ít nhất một mặt hàng trước khi hoàn tất phiếu.');
      return;
    }

    setProcessing(true);
    try {
      await historyService.create({
        id_phieu_nhap: id,
        trang_thai: 'da_nhap_kho',
        nguoi_cap_nhat: staff?.id || 1,
        ghi_chu: 'Thủ kho xác nhận hàng đã kiểm tra thực tế và nhập kho thành công.',
        thoi_gian_cap_nhat: new Date().toISOString().replace('T', ' ').slice(0, 19),
      });

      await loadData();
      Alert.alert('Thành công', 'Đã hoàn tất phiếu nhập. Tồn kho được tổng hợp từ các lô thuốc.');
    } catch (requestError) {
      Alert.alert('Không thể xác nhận', requestError.message);
    } finally {
      setProcessing(false);
    }
  };

  const addReceiptLine = async () => {
    const medicineId = Number(lineDraft.id_thuoc);
    const quantity = Number(lineDraft.so_luong);
    const unitCost = Number(lineDraft.gia_nhap);
    const expiryDate = lineDraft.han_su_dung.trim();
    const selectedMedicine = medicines.find((medicine) => Number(medicine.id) === medicineId);

    if (!selectedMedicine || !Number.isInteger(medicineId)) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập đúng ID thuốc trong danh sách thuốc.');
      return;
    }
    if (!Number.isInteger(quantity) || quantity <= 0 || !Number.isFinite(unitCost) || unitCost < 0) {
      Alert.alert('Thông tin không hợp lệ', 'Số lượng phải là số nguyên dương, giá nhập không được âm.');
      return;
    }
    const parsedExpiry = Date.parse(`${expiryDate}T00:00:00Z`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(expiryDate) || !Number.isFinite(parsedExpiry) ||
      new Date(parsedExpiry).toISOString().slice(0, 10) !== expiryDate) {
      Alert.alert('Hạn dùng không hợp lệ', 'Nhập hạn dùng theo định dạng YYYY-MM-DD.');
      return;
    }
    if (!lineDraft.gia_nhap.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập giá nhập.');
      return;
    }
    if (items.some((line) => String(line.id_thuoc) === String(medicineId))) {
      Alert.alert('Thuốc đã có trong phiếu', 'Mỗi phiếu chỉ thêm một dòng cho mỗi loại thuốc.');
      return;
    }

    setProcessing(true);
    try {
      const newLine = {
        id_phieu_nhap: Number(id),
        id_thuoc: medicineId,
        so_luong: quantity,
        gia_nhap: unitCost,
        so_lo: lineDraft.so_lo.trim() || null,
        han_su_dung: expiryDate,
      };
      await itemsService.create(newLine);

      try {
        const currentTotal = items.reduce(
          (sum, line) => sum + Number(line.so_luong || 0) * Number(line.gia_nhap || 0),
          0
        );
        await receiptService.update(id, {
          ...receipt,
          tong_tien: currentTotal + quantity * unitCost,
        });
      } catch (totalError) {
        await loadData();
        setLineModalVisible(false);
        Alert.alert(
          'Đã thêm thuốc',
          `Đã lưu lô thuốc nhưng chưa cập nhật được tổng tiền phiếu: ${totalError.message}`
        );
        return;
      }

      setLineDraft({ id_thuoc: '', so_luong: '', gia_nhap: '', so_lo: '', han_su_dung: '' });
      setLineModalVisible(false);
      await loadData();
      Alert.alert('Thành công', 'Đã thêm thuốc vào phiếu. Cơ sở dữ liệu tự cập nhật tồn kho theo lô.');
    } catch (requestError) {
      Alert.alert('Không thể thêm thuốc', requestError.message || 'Lỗi lưu chi tiết phiếu nhập.');
    } finally {
      setProcessing(false);
    }
  };

  if (!ready || !canAccessReceipt) {
    return (
      <View style={styles.accessDenied}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.accessDeniedText}>
          {ready ? 'Đang chuyển đến khu vực được cấp quyền...' : 'Đang kiểm tra quyền truy cập...'}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AdminSidebar
        activeKey="phieu_nhap_thuoc"
        navigation={navigation}
        variant={isAdmin ? 'admin' : 'staff'}
      />
      <View style={styles.main}>
        <WorkspaceHeader
          label={isAdmin ? 'CỔNG QUẢN TRỊ' : 'KHU VỰC NHÂN VIÊN'}
          title="Quản lý nhập kho"
          actions={[
            ...(isAdmin
              ? [{ label: 'Bảng quản trị', onPress: () => navigation.navigate('AdminDashboard') }]
              : [{ label: 'Bàn nhân viên', onPress: () => navigation.navigate('Staff') }]),
          ]}
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
                <Text style={styles.totalLabel}>Tổng tiền hàng:</Text>
                <Text style={styles.totalValue}>
                  {formatPrice(items.reduce(
                    (sum, line) => sum + Number(line.so_luong || 0) * Number(line.gia_nhap || 0),
                    0
                  ))}
                </Text>
              </View>

              {!confirmed && (
                <TouchableOpacity
                  style={styles.addLineBtn}
                  onPress={() => setLineModalVisible(true)}
                  disabled={processing}
                >
                  <Text style={styles.addLineBtnText}>+ Thêm thuốc vào phiếu nhập</Text>
                </TouchableOpacity>
              )}

              {!confirmed && (
                <TouchableOpacity
                  style={styles.confirmBtn}
                  onPress={confirmImport}
                  disabled={processing || items.length === 0}
                >
                  <Text style={styles.confirmBtnText}>
                    {processing ? 'Đang cập nhật phiếu...' : '✓ Hoàn tất phiếu nhập'}
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

        <Modal
        visible={lineModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setLineModalVisible(false);
          setMedicineSelectorOpen(false);
        }}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Thêm mặt hàng nhập</Text>
            <Text style={styles.modalHint}>
              Chọn thuốc từ danh sách. Mỗi thuốc chỉ xuất hiện một lần trong phiếu.
            </Text>
            {[
              ['so_luong', 'Số lượng nhập', 'numeric'],
              ['gia_nhap', 'Giá nhập mỗi đơn vị', 'decimal-pad'],
              ['so_lo', 'Số lô (có thể bỏ trống)', 'default'],
              ['han_su_dung', 'Hạn dùng (YYYY-MM-DD)', 'default'],
            ].map(([field, label, keyboardType]) => (
              <View key={field} style={styles.modalField}>
                <Text style={styles.modalLabel}>{label}</Text>
                <TextInput
                  value={lineDraft[field]}
                  onChangeText={(value) => setLineDraft((current) => ({ ...current, [field]: value }))}
                  keyboardType={keyboardType}
                  placeholder={field === 'id_thuoc' ? medicines.map((medicine) => `${medicine.id}: ${medicine.ten_thuoc}`).slice(0, 4).join(' · ') : ''}
                  placeholderTextColor="#94a3b8"
                  style={styles.modalInput}
                />
              </View>
            ))}
            <View style={styles.modalField}>
              <Text style={styles.modalLabel}>Thuốc</Text>
              <TouchableOpacity
                style={styles.medicineSelect}
                onPress={() => {
                  setMedicineQuery('');
                  setMedicineSelectorOpen((current) => !current);
                }}
              >
                <Text style={lineDraft.id_thuoc ? styles.medicineSelectValue : styles.medicineSelectPlaceholder}>
                  {medicines.find((medicine) => String(medicine.id) === String(lineDraft.id_thuoc))?.ten_thuoc
                    || 'Chọn thuốc từ danh sách'}
                </Text>
                <Text style={styles.medicineSelectChevron}>
                  {medicineSelectorOpen ? '⌃' : '⌄'}
                </Text>
              </TouchableOpacity>
              {medicineSelectorOpen ? (
                <View style={styles.medicineOptions}>
                  <TextInput
                    value={medicineQuery}
                    onChangeText={setMedicineQuery}
                    placeholder="Tìm tên thuốc hoặc mã..."
                    placeholderTextColor="#94a3b8"
                    style={styles.medicineSearch}
                  />
                  <ScrollView keyboardShouldPersistTaps="handled" style={styles.medicineOptionList}>
                    {medicines
                      .filter((medicine) => !items.some(
                        (line) => String(line.id_thuoc) === String(medicine.id)
                      ))
                      .filter((medicine) =>
                        `${medicine.ten_thuoc || ''} ${medicine.id} ${medicine.ma_sku || ''}`
                          .toLowerCase().includes(medicineQuery.trim().toLowerCase())
                      )
                      .map((medicine) => (
                        <TouchableOpacity
                          key={medicine.id}
                          style={styles.medicineOption}
                          onPress={() => {
                            setLineDraft((current) => ({ ...current, id_thuoc: String(medicine.id) }));
                            setMedicineSelectorOpen(false);
                          }}
                        >
                          <Text style={styles.medicineOptionName}>{medicine.ten_thuoc}</Text>
                          <Text style={styles.medicineOptionMeta}>
                            #{medicine.id}{medicine.ma_sku ? ` · ${medicine.ma_sku}` : ''}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    {!medicines.some((medicine) =>
                      !items.some((line) => String(line.id_thuoc) === String(medicine.id)) &&
                      `${medicine.ten_thuoc || ''} ${medicine.id} ${medicine.ma_sku || ''}`
                        .toLowerCase().includes(medicineQuery.trim().toLowerCase())
                    ) ? (
                      <Text style={styles.medicineOptionEmpty}>Không còn thuốc phù hợp để thêm.</Text>
                    ) : null}
                  </ScrollView>
                </View>
              ) : null}
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => {
                  setLineModalVisible(false);
                  setMedicineSelectorOpen(false);
                }}
                disabled={processing}
              >
                <Text style={styles.cancelBtnText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveLineBtn}
                onPress={addReceiptLine}
                disabled={processing}
              >
                <Text style={styles.saveLineBtnText}>
                  {processing ? 'Đang lưu...' : 'Lưu mặt hàng'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        </Modal>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: 'row', backgroundColor: '#f3f7f6' },
  accessDenied: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10, backgroundColor: '#f3f7f6' },
  accessDeniedText: { color: '#475569', fontSize: 13, fontWeight: '700' },
  main: { flex: 1, minWidth: 0 },
  content: { paddingHorizontal: 28, paddingTop: 24, paddingBottom: 48 },
  back: { color: '#0f766e', fontWeight: '700', marginBottom: 12 },
  kicker: { color: '#0f766e', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  title: { color: '#102a2a', fontSize: 28, fontWeight: '900', marginTop: 6, marginBottom: 18 },
  loader: { marginTop: 40 },
  error: { color: '#b91c1c' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e1ebe8',
    marginBottom: 18,
    shadowColor: '#163a36',
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
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
  totalValue: { color: '#0f766e', fontWeight: '800', fontSize: 18 },
  confirmBtn: {
    backgroundColor: '#0f766e',
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 14,
  },
  confirmBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  addLineBtn: {
    borderWidth: 1,
    borderColor: '#0f766e',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 14,
  },
  addLineBtnText: { color: '#0f766e', fontWeight: '800', fontSize: 14 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    padding: 18,
  },
  modalCard: { backgroundColor: '#fff', borderRadius: 16, padding: 18, maxHeight: '90%' },
  modalTitle: { color: '#0f172a', fontSize: 20, fontWeight: '800' },
  modalHint: { color: '#64748b', fontSize: 12, lineHeight: 18, marginTop: 6, marginBottom: 10 },
  modalField: { marginTop: 8 },
  modalLabel: { color: '#334155', fontSize: 12, fontWeight: '700', marginBottom: 4 },
  modalInput: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 9,
    paddingHorizontal: 10,
    paddingVertical: 9,
    color: '#0f172a',
    fontSize: 13,
  },
  medicineSelect: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 9,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  medicineSelectValue: { flex: 1, color: '#0f172a', fontSize: 13 },
  medicineSelectPlaceholder: { flex: 1, color: '#94a3b8', fontSize: 13 },
  medicineSelectChevron: { color: '#64748b', fontSize: 17, fontWeight: '800' },
  medicineOptions: {
    marginTop: 5,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 9,
    overflow: 'hidden',
  },
  medicineSearch: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    color: '#0f172a',
    fontSize: 12,
  },
  medicineOptionList: { maxHeight: 160 },
  medicineOption: {
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  medicineOptionName: { color: '#334155', fontSize: 12, fontWeight: '700' },
  medicineOptionMeta: { color: '#64748b', fontSize: 10, marginTop: 2 },
  medicineOptionEmpty: { padding: 12, color: '#64748b', fontSize: 12, textAlign: 'center' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 18 },
  cancelBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 9, backgroundColor: '#f1f5f9' },
  cancelBtnText: { color: '#334155', fontWeight: '700' },
  saveLineBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 9, backgroundColor: '#2563eb' },
  saveLineBtnText: { color: '#fff', fontWeight: '800' },
  sectionHeading: {
    color: '#0f172a',
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
  itemTotal: { color: '#2563eb', fontWeight: '800', fontSize: 14 },
  itemMeta: { color: '#64748b', fontSize: 12, marginTop: 4 },
  bold: { color: '#2563eb', fontWeight: '700' },
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

import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import StoreHeader from '../components/StoreHeader';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { createCrudService } from '../services/crudService';
import { formatDate } from '../data/mockData';

export default function AdminPrescriptionDetailScreen({ route, navigation }) {
  const { id } = route.params;
  const { count } = useCart();
  const { user } = useAuth();
  const donThuocService = createCrudService('don_thuoc');
  const chiTietService = createCrudService('chi_tiet_don_thuoc');
  const bacSiService = createCrudService('bac_si');
  const khachHangService = createCrudService('khach_hang');
  const thuocService = createCrudService('thuoc');

  const [prescription, setPrescription] = useState(null);
  const [items, setItems] = useState([]);
  const [doctor, setDoctor] = useState(null);
  const [patient, setPatient] = useState(null);
  const [medicines, setMedicines] = useState([]);
  const [approvalNote, setApprovalNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [item, allItems, allDoctors, allPatients, allMeds] = await Promise.all([
        donThuocService.getById(id),
        chiTietService.getAll().catch(() => []),
        bacSiService.getAll().catch(() => []),
        khachHangService.getAll().catch(() => []),
        thuocService.getAll().catch(() => []),
      ]);

      setPrescription(item);
      setItems(allItems.filter((line) => String(line.id_don_thuoc) === String(id)));
      setDoctor(allDoctors.find((doc) => String(doc.id) === String(item?.id_bac_si)));
      setPatient(allPatients.find((p) => String(p.id) === String(item?.id_khach_hang)));
      setMedicines(allMeds);
      setApprovalNote(item?.ghi_chu_duyet || '');
    } catch (e) {
      setError(e.message || 'Không thể tải đơn thuốc.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const updateStatus = async (status) => {
    setSubmitting(true);
    try {
      await donThuocService.update(id, {
        ...prescription,
        trang_thai: status,
        id_nhan_vien_duyet: user?.id || 2,
        ngay_duyet: new Date().toISOString().replace('T', ' ').slice(0, 19),
        ghi_chu_duyet: approvalNote.trim() || (status === 'da_duyet' ? 'Toa hợp lệ' : 'Đơn thuốc bị từ chối'),
      });
      await loadData();
      Alert.alert(
        'Thành công',
        status === 'da_duyet' ? 'Đã duyệt đơn thuốc thành công.' : 'Đã từ chối duyệt đơn thuốc.'
      );
    } catch (e) {
      Alert.alert('Lỗi', e.message || 'Không thể cập nhật đơn thuốc');
    } finally {
      setSubmitting(false);
    }
  };

  const status = prescription?.trang_thai || 'cho_duyet';

  return (
    <View style={styles.container}>
      <StoreHeader
        cartCount={count}
        onCartPress={() => navigation.navigate('Cart')}
        onAccountPress={() => navigation.navigate('Login')}
      />

      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>‹ Danh sách toa thuốc</Text>
        </TouchableOpacity>

        <Text style={styles.kicker}>DUYỆT TOA THUỐC BÁC SĨ</Text>
        <Text style={styles.title}>Đơn thuốc #{id}</Text>

        {loading ? (
          <ActivityIndicator style={styles.loader} size="large" color="#0d9488" />
        ) : error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : (
          <>
            {/* Header info */}
            <View style={styles.card}>
              <View style={styles.badgeRow}>
                <Text style={styles.cardLabel}>Trạng thái xét duyệt:</Text>
                <View
                  style={[
                    styles.statusBadge,
                    status === 'da_duyet'
                      ? styles.badgeApproved
                      : status === 'tu_choi'
                      ? styles.badgeRejected
                      : styles.badgePending,
                  ]}
                >
                  <Text style={styles.statusText}>
                    {status === 'da_duyet'
                      ? '✓ Đã duyệt'
                      : status === 'tu_choi'
                      ? '✕ Đã từ chối'
                      : '⏳ Chờ duyệt'}
                  </Text>
                </View>
              </View>

              <Text style={styles.infoLine}>
                <Text style={styles.infoLabel}>Bệnh nhân:</Text> {patient?.ho_ten || `Khách hàng #${prescription?.id_khach_hang}`}
              </Text>
              <Text style={styles.infoLine}>
                <Text style={styles.infoLabel}>SĐT liên hệ:</Text> {patient?.so_dien_thoai || '—'}
              </Text>
              <Text style={styles.infoLine}>
                <Text style={styles.infoLabel}>Bác sĩ kê đơn:</Text> {doctor?.ho_ten || `Bác sĩ #${prescription?.id_bac_si}`} ({doctor?.chuyen_khoa || 'Chuyên khoa'})
              </Text>
              <Text style={styles.infoLine}>
                <Text style={styles.infoLabel}>Số chứng chỉ CCHN:</Text> {doctor?.so_chung_chi_hanh_nghe || '—'}
              </Text>
              <Text style={styles.infoLine}>
                <Text style={styles.infoLabel}>Ngày kê:</Text> {formatDate(prescription?.ngay_ke_don)}
              </Text>
              {prescription?.ngay_duyet ? (
                <Text style={styles.infoLine}>
                  <Text style={styles.infoLabel}>Ngày duyệt:</Text> {prescription.ngay_duyet}
                </Text>
              ) : null}
            </View>

            {/* Prescribed Drugs */}
            <Text style={styles.sectionTitle}>Danh mục thuốc kê trong toa ({items.length})</Text>
            {items.map((line, index) => {
              const med = medicines.find((m) => String(m.id) === String(line.id_thuoc));
              return (
                <View key={line.id || index} style={styles.medCard}>
                  <Text style={styles.medName}>
                    {med?.ten_thuoc || `Thuốc #${line.id_thuoc}`}
                  </Text>
                  <Text style={styles.medMeta}>
                    Số lượng kê: <Text style={styles.bold}>{line.so_luong_ke}</Text> {med?.don_vi_tinh || 'đơn vị'} · Dùng trong {line.so_ngay_dung || 7} ngày
                  </Text>
                  <View style={styles.dosageBox}>
                    <Text style={styles.dosageLabel}>Chỉ định liều dùng:</Text>
                    <Text style={styles.dosageText}>{line.lieu_dung || 'Chưa có hướng dẫn'}</Text>
                  </View>
                </View>
              );
            })}

            {/* Approval Action Form */}
            <View style={styles.actionCard}>
              <Text style={styles.actionCardTitle}>Ý kiến chuyên môn của dược sĩ</Text>
              <TextInput
                value={approvalNote}
                onChangeText={setApprovalNote}
                placeholder="Nhập ghi chú thẩm định đơn thuốc, đối chiếu toa, liều dùng..."
                placeholderTextColor="#94a3b8"
                multiline
                style={styles.noteInput}
              />
              <View style={styles.btnRow}>
                <TouchableOpacity
                  style={[styles.btn, styles.rejectBtn]}
                  onPress={() => updateStatus('tu_choi')}
                  disabled={submitting}
                >
                  <Text style={styles.rejectBtnText}>Từ chối toa</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.btn, styles.approveBtn]}
                  onPress={() => updateStatus('da_duyet')}
                  disabled={submitting}
                >
                  <Text style={styles.approveBtnText}>
                    {submitting ? 'Đang duyệt...' : '✓ Duyệt đơn thuốc'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
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
  errorText: { color: '#b91c1c', marginTop: 20 },
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
  cardLabel: { color: '#64748b', fontWeight: '600', fontSize: 13 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeApproved: { backgroundColor: '#dcfce7' },
  badgePending: { backgroundColor: '#fef9c3' },
  badgeRejected: { backgroundColor: '#fee2e2' },
  statusText: { fontWeight: '800', fontSize: 12, color: '#0f766e' },
  infoLine: { color: '#334155', fontSize: 14, marginBottom: 6 },
  infoLabel: { color: '#64748b', fontWeight: '600' },
  sectionTitle: { color: '#134e4a', fontSize: 18, fontWeight: '800', marginBottom: 12 },
  medCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 10,
  },
  medName: { color: '#0f172a', fontWeight: '800', fontSize: 16 },
  medMeta: { color: '#64748b', fontSize: 13, marginTop: 4 },
  bold: { color: '#0d9488', fontWeight: '700' },
  dosageBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 10,
    marginTop: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#0d9488',
  },
  dosageLabel: { color: '#64748b', fontSize: 11, fontWeight: '700' },
  dosageText: { color: '#1e293b', fontSize: 13, marginTop: 2 },
  actionCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginTop: 14,
  },
  actionCardTitle: { color: '#134e4a', fontWeight: '800', fontSize: 15, marginBottom: 10 },
  noteInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    padding: 12,
    minHeight: 80,
    textAlignVertical: 'top',
    color: '#0f172a',
    fontSize: 14,
    marginBottom: 14,
  },
  btnRow: { flexDirection: 'row', gap: 12 },
  btn: { flex: 1, borderRadius: 10, paddingVertical: 13, alignItems: 'center' },
  rejectBtn: { borderWidth: 1, borderColor: '#f43f5e', backgroundColor: '#fff' },
  rejectBtnText: { color: '#e11d48', fontWeight: '800' },
  approveBtn: { backgroundColor: '#0d9488' },
  approveBtnText: { color: '#fff', fontWeight: '800' },
});

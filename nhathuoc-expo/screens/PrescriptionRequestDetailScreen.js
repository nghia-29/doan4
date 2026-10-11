import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
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
import { formatDate } from '../data/mockData';
import { createCrudService } from '../services/crudService';
import prescriptionRequestApi from '../services/prescriptionRequestService';
import { getWorkspaceRoute, isPharmacistRole } from '../utils/workspaceAccess';

export default function PrescriptionRequestDetailScreen({ route, navigation }) {
  const { id } = route.params;
  const { user, ready } = useAuth();
  const [request, setRequest] = useState(null);
  const [diseases, setDiseases] = useState([]);
  const [regimens, setRegimens] = useState([]);
  const [selectedDiseaseId, setSelectedDiseaseId] = useState('');
  const [selectedRegimenId, setSelectedRegimenId] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [validityDays, setValidityDays] = useState('5');
  const [reason, setReason] = useState('');
  const [selectorVisible, setSelectorVisible] = useState(false);
  const [selectorType, setSelectorType] = useState('disease');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [item, diseaseList, regimenList] = await Promise.all([
        prescriptionRequestApi.getById(id, user?.id),
        createCrudService('benh').getAll(),
        createCrudService('phac_do').getAll(),
      ]);
      setRequest(item);
      setDiseases(diseaseList);
      setRegimens(regimenList.filter((regimen) => Number(regimen.trang_thai ?? 1) === 1));
      setSelectedDiseaseId(item?.id_benh ? String(item.id_benh) : '');
      setDiagnosis(item?.chan_doan || '');
    } catch (loadError) {
      setError(loadError.message || 'Không thể tải yêu cầu kê đơn.');
    } finally {
      setLoading(false);
    }
  }, [id, user?.id]);

  useEffect(() => {
    if (!ready) return;
    if (!isPharmacistRole(user?.vai_tro)) {
      navigation.replace(getWorkspaceRoute(user?.vai_tro));
      return;
    }
    loadData();
  }, [loadData, navigation, ready, user?.vai_tro]);

  const performAction = async (action) => {
    setSubmitting(true);
    setError('');
    try {
      if (action === 'accept') {
        await prescriptionRequestApi.accept(id, user?.id);
        await loadData();
      } else if (action === 'reject') {
        if (!reason.trim()) {
          setError('Vui lòng ghi lý do từ chối để khách hàng biết hướng xử lý.');
          return;
        }
        await prescriptionRequestApi.reject(id, { ly_do_tu_choi: reason.trim() }, user?.id);
        await loadData();
      } else {
        const validity = Number(validityDays);
        if (!Number.isInteger(validity) || validity < 1) {
          setError('Số ngày hiệu lực phải là số nguyên dương.');
          return;
        }
        const regimen = regimens.find((item) => String(item.id) === selectedRegimenId);
        const prescriptionId = await prescriptionRequestApi.prescribe(id, {
          id_benh: regimen?.id_benh || selectedDiseaseId || null,
          id_phac_do: selectedRegimenId || null,
          chan_doan: diagnosis.trim() || null,
          ngay_ke_don: new Date().toISOString().slice(0, 10),
          so_ngay_hieu_luc: validity,
        }, user?.id);
        navigation.replace('AdminPrescriptionDetail', { id: prescriptionId.id_don_thuoc });
      }
    } catch (actionError) {
      setError(actionError.message || 'Không thể xử lý yêu cầu kê đơn.');
    } finally {
      setSubmitting(false);
    }
  };

  const availableRegimens = regimens.filter(
    (regimen) => !selectedDiseaseId || String(regimen.id_benh) === selectedDiseaseId
  );
  const selectedDisease = diseases.find((disease) => String(disease.id) === selectedDiseaseId);
  const selectedRegimen = regimens.find((regimen) => String(regimen.id) === selectedRegimenId);

  if (!isPharmacistRole(user?.vai_tro) && ready) {
    return <View style={styles.loadingState}><ActivityIndicator size="large" color="#0d9488" /></View>;
  }

  return (
    <View style={styles.container}>
      <AdminSidebar activeKey="prescriptions" navigation={navigation} variant="staff" />
      <View style={styles.main}>
        <WorkspaceHeader
          label="KHU VỰC DƯỢC SĨ"
          title="Xử lý yêu cầu kê toa"
          actions={[{ label: 'Quay lại hàng đợi', onPress: () => navigation.goBack() }]}
        />
        <ScrollView contentContainerStyle={styles.content}>
          {loading ? <ActivityIndicator style={styles.loader} size="large" color="#0d9488" /> : null}
          {error ? (
            <TouchableOpacity style={styles.errorBox} onPress={loadData}>
              <Text style={styles.errorText}>{error}</Text>
              <Text style={styles.errorAction}>Chạm để thử lại</Text>
            </TouchableOpacity>
          ) : null}
          {!loading && request ? (
            <>
              <View style={styles.requestCard}>
                <View style={styles.headingRow}>
                  <View style={styles.headingCopy}>
                    <Text style={styles.kicker}>YÊU CẦU #{request.id}</Text>
                    <Text style={styles.title}>{request.ten_benh_khai}</Text>
                  </View>
                  <Text style={styles.status}>{request.trang_thai?.replace(/_/g, ' ')}</Text>
                </View>
                <Text style={styles.patient}>Khách hàng: {request.khach_hang || `#${request.id_khach_hang}`}</Text>
                <Text style={styles.bodyLabel}>Triệu chứng</Text>
                <Text style={styles.bodyText}>{request.trieu_chung}</Text>
                <Text style={styles.bodyLabel}>Thời gian bị bệnh</Text>
                <Text style={styles.bodyText}>{request.thoi_gian_bi_benh || 'Chưa cung cấp'}</Text>
                <Text style={styles.bodyLabel}>Dị ứng thuốc</Text>
                <Text style={styles.bodyText}>{request.di_ung_thuoc || 'Chưa ghi nhận'}</Text>
                <Text style={styles.bodyLabel}>Bệnh nền / thuốc đang dùng</Text>
                <Text style={styles.bodyText}>{request.benh_nen_thuoc_dang_dung || 'Chưa cung cấp'}</Text>
                <Text style={styles.requestDate}>Gửi lúc: {formatDate(request.ngay_tao)}</Text>
              </View>

              {request.trang_thai === 'cho_tiep_nhan' ? (
                <>
                  <View style={styles.notice}>
                    <Text style={styles.noticeText}>
                      Hãy tiếp nhận yêu cầu trước khi kê toa. Sau khi tiếp nhận, chỉ dược sĩ phụ trách mới có thể kê hoặc từ chối.
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.primaryButton, submitting && styles.disabled]}
                    onPress={() => performAction('accept')}
                    disabled={submitting}
                  >
                    <Text style={styles.primaryButtonText}>
                      {submitting ? 'Đang xử lý...' : 'Tiếp nhận yêu cầu'}
                    </Text>
                  </TouchableOpacity>
                  <Text style={styles.fieldLabel}>Lý do từ chối (nếu cần)</Text>
                  <TextInput
                    style={[styles.input, styles.multiline]}
                    value={reason}
                    onChangeText={setReason}
                    placeholder="Ví dụ: triệu chứng cần được bác sĩ thăm khám trực tiếp"
                    multiline
                    textAlignVertical="top"
                  />
                  <TouchableOpacity
                    style={[styles.rejectButton, submitting && styles.disabled]}
                    onPress={() => performAction('reject')}
                    disabled={submitting}
                  >
                    <Text style={styles.rejectButtonText}>Từ chối và gửi hướng dẫn</Text>
                  </TouchableOpacity>
                </>
              ) : null}

              {request.trang_thai === 'da_tiep_nhan' ? (
                <>
                  <View style={styles.composerCard}>
                    <Text style={styles.sectionTitle}>Lập toa thuốc</Text>
                    <Text style={styles.sectionDescription}>
                      Chọn bệnh hoặc phác đồ phù hợp. Toa được tạo ở trạng thái chờ duyệt chéo.
                    </Text>
                    <Text style={styles.fieldLabel}>Bệnh</Text>
                    <TouchableOpacity
                      style={styles.selectButton}
                      onPress={() => { setSelectorType('disease'); setSelectorVisible(true); }}
                    >
                      <Text style={selectedDisease ? styles.selectValue : styles.selectPlaceholder}>
                        {selectedDisease?.ten_benh || 'Chọn bệnh (có thể bỏ qua)'}
                      </Text>
                      <Text style={styles.selectChevron}>⌄</Text>
                    </TouchableOpacity>

                    <Text style={styles.fieldLabel}>Phác đồ điều trị</Text>
                    <TouchableOpacity
                      style={styles.selectButton}
                      onPress={() => { setSelectorType('regimen'); setSelectorVisible(true); }}
                    >
                      <Text style={selectedRegimen ? styles.selectValue : styles.selectPlaceholder}>
                        {selectedRegimen?.ten_phac_do || 'Chọn phác đồ (không bắt buộc)'}
                      </Text>
                      <Text style={styles.selectChevron}>⌄</Text>
                    </TouchableOpacity>
                    {selectedRegimen ? (
                      <Text style={styles.regimenNote}>
                        Phác đồ sẽ tự thêm thuốc gợi ý vào toa. Bệnh sẽ tự khớp theo phác đồ đã chọn.
                      </Text>
                    ) : null}

                    <Text style={styles.fieldLabel}>Chẩn đoán / ghi chú chuyên môn</Text>
                    <TextInput
                      style={[styles.input, styles.multiline]}
                      value={diagnosis}
                      onChangeText={setDiagnosis}
                      placeholder="Nhập chẩn đoán sau khi đánh giá thông tin"
                      multiline
                      textAlignVertical="top"
                    />
                    <Text style={styles.fieldLabel}>Hiệu lực toa (ngày)</Text>
                    <TextInput
                      style={styles.input}
                      value={validityDays}
                      onChangeText={setValidityDays}
                      keyboardType="number-pad"
                      maxLength={3}
                    />
                    <TouchableOpacity
                      style={[styles.primaryButton, submitting && styles.disabled]}
                      onPress={() => performAction('prescribe')}
                      disabled={submitting}
                    >
                      <Text style={styles.primaryButtonText}>
                        {submitting ? 'Đang lập toa...' : 'Lập toa và chuyển duyệt'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : null}

              {request.trang_thai === 'da_ke_don' ? (
                <View style={styles.notice}>
                  <Text style={styles.noticeText}>
                    Yêu cầu đã được lập toa {request.id_don_thuoc ? `#${request.id_don_thuoc}` : ''}. Toa đang chờ dược sĩ khác thẩm định.
                  </Text>
                </View>
              ) : null}
              {request.trang_thai === 'tu_choi' ? (
                <View style={styles.notice}>
                  <Text style={styles.noticeText}>Lý do: {request.ly_do_tu_choi || 'Không có ghi chú.'}</Text>
                </View>
              ) : null}
            </>
          ) : null}
        </ScrollView>
      </View>

      <Modal
        visible={selectorVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectorVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.sectionTitle}>
              {selectorType === 'disease' ? 'Chọn bệnh' : 'Chọn phác đồ'}
            </Text>
            <ScrollView>
              <TouchableOpacity
                style={styles.optionRow}
                onPress={() => {
                  if (selectorType === 'disease') {
                    setSelectedDiseaseId('');
                    setSelectedRegimenId('');
                  } else {
                    setSelectedRegimenId('');
                  }
                  setSelectorVisible(false);
                }}
              >
                <Text style={styles.optionName}>Không chọn</Text>
              </TouchableOpacity>
              {(selectorType === 'disease' ? diseases : availableRegimens).map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.optionRow}
                  onPress={() => {
                    if (selectorType === 'disease') {
                      setSelectedDiseaseId(String(item.id));
                      if (selectedRegimen && String(selectedRegimen.id_benh) !== String(item.id)) {
                        setSelectedRegimenId('');
                      }
                    } else {
                      setSelectedRegimenId(String(item.id));
                      setSelectedDiseaseId(String(item.id_benh));
                    }
                    setSelectorVisible(false);
                  }}
                >
                  <Text style={styles.optionName}>{item.ten_benh || item.ten_phac_do}</Text>
                  {item.ma_icd ? <Text style={styles.optionDescription}>{item.ma_icd}</Text> : null}
                  {selectorType === 'regimen' ? (
                    <Text style={styles.optionDescription}>
                      {diseases.find((disease) => String(disease.id) === String(item.id_benh))?.ten_benh}
                    </Text>
                  ) : null}
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.closeButton} onPress={() => setSelectorVisible(false)}>
              <Text style={styles.primaryButtonText}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: 'row', backgroundColor: '#f4f7fb' },
  main: { flex: 1, minWidth: 0 },
  content: { padding: 18, paddingBottom: 48, maxWidth: 900, width: '100%', alignSelf: 'center' },
  loadingState: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loader: { marginTop: 40 },
  kicker: { color: '#0d9488', fontSize: 10, fontWeight: '900', letterSpacing: 0.8 },
  title: { color: '#0f172a', fontSize: 22, fontWeight: '900', marginTop: 4 },
  headingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  headingCopy: { flex: 1, paddingRight: 8 },
  status: { color: '#0f766e', backgroundColor: '#ccfbf1', padding: 7, borderRadius: 8, fontSize: 11, fontWeight: '800', textTransform: 'capitalize' },
  requestCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 14 },
  patient: { color: '#334155', fontSize: 13, marginTop: 12, fontWeight: '700' },
  bodyLabel: { color: '#64748b', fontSize: 11, fontWeight: '800', marginTop: 12 },
  bodyText: { color: '#1e293b', fontSize: 13, lineHeight: 19, marginTop: 3 },
  requestDate: { color: '#94a3b8', fontSize: 11, marginTop: 12 },
  notice: { backgroundColor: '#eff6ff', borderColor: '#bfdbfe', borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 12 },
  noticeText: { color: '#1e40af', fontSize: 12, lineHeight: 18 },
  composerCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  sectionTitle: { color: '#0f172a', fontSize: 17, fontWeight: '900' },
  sectionDescription: { color: '#64748b', fontSize: 12, lineHeight: 18, marginTop: 5, marginBottom: 8 },
  fieldLabel: { color: '#334155', fontSize: 12, fontWeight: '800', marginTop: 13, marginBottom: 6 },
  input: { backgroundColor: '#f8fafc', borderColor: '#cbd5e1', borderWidth: 1, borderRadius: 9, padding: 11, color: '#0f172a', fontSize: 13 },
  multiline: { minHeight: 76 },
  selectButton: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', borderColor: '#cbd5e1', borderWidth: 1, borderRadius: 9, padding: 12 },
  selectValue: { color: '#0f172a', fontSize: 13, fontWeight: '700', flex: 1 },
  selectPlaceholder: { color: '#64748b', fontSize: 13, flex: 1 },
  selectChevron: { color: '#0d9488', fontSize: 18, fontWeight: '900' },
  regimenNote: { color: '#0f766e', fontSize: 11, lineHeight: 16, marginTop: 6 },
  primaryButton: { backgroundColor: '#0d9488', borderRadius: 10, alignItems: 'center', padding: 13, marginTop: 14 },
  primaryButtonText: { color: '#fff', fontWeight: '900', fontSize: 13 },
  rejectButton: { borderColor: '#fecaca', borderWidth: 1, borderRadius: 10, alignItems: 'center', padding: 12, marginTop: 8, marginBottom: 20 },
  rejectButtonText: { color: '#b91c1c', fontWeight: '800', fontSize: 12 },
  disabled: { opacity: 0.6 },
  errorBox: { backgroundColor: '#fff1f2', borderRadius: 12, padding: 12, marginBottom: 12 },
  errorText: { color: '#be123c', fontSize: 12 },
  errorAction: { color: '#0f766e', fontWeight: '800', fontSize: 12, marginTop: 5 },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(15,23,42,.5)' },
  modalCard: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 18, maxHeight: '75%' },
  optionRow: { borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingVertical: 13 },
  optionName: { color: '#0f172a', fontSize: 13, fontWeight: '700' },
  optionDescription: { color: '#64748b', fontSize: 11, marginTop: 3 },
  closeButton: { backgroundColor: '#0d9488', borderRadius: 10, alignItems: 'center', padding: 12, marginTop: 12 },
});

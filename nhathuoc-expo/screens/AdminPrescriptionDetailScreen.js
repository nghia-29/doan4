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
import { formatDate } from '../data/mockData';
import prescriptionApi from '../services/donThuocService';
import prescriptionLineApi from '../services/chiTietDonThuocService';
import {
  getWorkspaceRoute,
  isPharmacistRole,
  isStaffRole,
} from '../utils/workspaceAccess';

export default function AdminPrescriptionDetailScreen({ route, navigation }) {
  const { id } = route.params;
  const { user, ready } = useAuth();
  const khachHangService = createCrudService('khach_hang');
  const nhanVienService = createCrudService('nhan_vien');
  const thuocService = createCrudService('thuoc');

  const [prescription, setPrescription] = useState(null);
  const [items, setItems] = useState([]);
  const [doctor, setDoctor] = useState(null);
  const [patient, setPatient] = useState(null);
  const [reviewingStaff, setReviewingStaff] = useState(null);
  const [medicines, setMedicines] = useState([]);
  const [diseases, setDiseases] = useState([]);
  const [regimens, setRegimens] = useState([]);
  const [regimenLines, setRegimenLines] = useState([]);
  const [selectedDiseaseId, setSelectedDiseaseId] = useState('');
  const [selectedRegimenId, setSelectedRegimenId] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [selector, setSelector] = useState(null);
  const [selectedMedicineId, setSelectedMedicineId] = useState('');
  const [newQuantity, setNewQuantity] = useState('1');
  const [newDosage, setNewDosage] = useState('');
  const [newDuration, setNewDuration] = useState('');
  const [lineEdits, setLineEdits] = useState({});
  const [approvalNote, setApprovalNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [item, allItems, allPatients, allStaff, allMeds, allDiseases, allRegimens, allRegimenLines] = await Promise.all([
        prescriptionApi.getById(id),
        prescriptionLineApi.getAll(),
        khachHangService.getAll(),
        nhanVienService.getAll(),
        thuocService.getAll(),
        createCrudService('benh').getAll(),
        createCrudService('phac_do').getAll(),
        createCrudService('chi_tiet_phac_do').getAll(),
      ]);

      setPrescription(item);
      setItems(allItems.filter((line) => String(line.id_don_thuoc) === String(id)));
      setDoctor(allStaff.find((staff) => String(staff.id) === String(item?.id_nhan_vien_ke_don)));
      setPatient(allPatients.find((p) => String(p.id) === String(item?.id_khach_hang)));
      setReviewingStaff(allStaff.find((staff) => String(staff.id_tai_khoan) === String(user?.id)) || null);
      setMedicines(allMeds);
      setDiseases(allDiseases);
      setRegimens(allRegimens);
      setRegimenLines(allRegimenLines);
      setSelectedDiseaseId(item?.id_benh ? String(item.id_benh) : '');
      setSelectedRegimenId(item?.id_phac_do ? String(item.id_phac_do) : '');
      setDiagnosis(item?.chan_doan || '');
      setApprovalNote(item?.ghi_chu_duyet || '');
    } catch (e) {
      setError(e.message || 'Không thể tải đơn thuốc.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!ready) return;
    if (!isPharmacistRole(user?.vai_tro)) {
      const destination = isStaffRole(user?.vai_tro)
        ? 'Staff'
        : getWorkspaceRoute(user?.vai_tro);
      navigation.replace(destination, destination === 'Staff' ? { tab: 'inventory' } : undefined);
      return;
    }
    loadData();
  }, [id, navigation, ready, user?.vai_tro]);

  const updateStatus = async (status) => {
    if (status === 'da_duyet' && !reviewingStaff?.id) {
      Alert.alert('Không thể duyệt toa', 'Tài khoản hiện tại chưa được liên kết với hồ sơ nhân viên.');
      return;
    }
    if (status === 'da_duyet' && !diagnosis.trim() && !selectedDiseaseId) {
      Alert.alert('Chưa đủ thông tin', 'Chọn bệnh hoặc nhập chẩn đoán trước khi duyệt toa.');
      return;
    }
    if (status === 'da_duyet' && items.length < 2) {
      Alert.alert('Chưa đủ thuốc', 'Theo quy định dữ liệu hiện tại, toa phải có ít nhất 2 loại thuốc.');
      return;
    }
    setSubmitting(true);
    try {
      await prescriptionApi.update(id, {
        ...prescription,
        id_benh: selectedDiseaseId || null,
        id_phac_do: selectedRegimenId || null,
        chan_doan: diagnosis.trim() || null,
        trang_thai: status,
        id_nhan_vien_duyet: reviewingStaff?.id || null,
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

  const saveClinicalDetails = async () => {
    setSubmitting(true);
    try {
      await prescriptionApi.update(id, {
        id_benh: selectedDiseaseId || null,
        id_phac_do: selectedRegimenId || null,
        chan_doan: diagnosis.trim() || null,
      });
      await loadData();
      Alert.alert('Đã lưu', 'Thông tin bệnh và chẩn đoán đã được cập nhật.');
    } catch (requestError) {
      Alert.alert('Không thể lưu', requestError.message || 'Không thể cập nhật chẩn đoán.');
    } finally {
      setSubmitting(false);
    }
  };

  const applySelectedRegimen = async () => {
    if (!selectedRegimenId) {
      Alert.alert('Chưa chọn phác đồ', 'Vui lòng chọn một phác đồ đang áp dụng.');
      return;
    }
    if (!diagnosis.trim()) {
      Alert.alert('Chưa có chẩn đoán', 'Nhập chẩn đoán trước khi áp dụng phác đồ.');
      return;
    }
    setSubmitting(true);
    try {
      await prescriptionApi.applyRegimen(id, selectedRegimenId, diagnosis.trim());
      await loadData();
      Alert.alert('Đã áp dụng phác đồ', 'Danh sách thuốc gợi ý đã được đưa vào toa; hãy đối chiếu và chỉnh sửa theo toa gốc.');
    } catch (requestError) {
      Alert.alert('Không thể áp dụng phác đồ', requestError.message || 'Vui lòng kiểm tra toa và phác đồ.');
    } finally {
      setSubmitting(false);
    }
  };

  const addPrescriptionMedicine = async () => {
    const quantity = Number(newQuantity);
    if (!selectedMedicineId || !Number.isInteger(quantity) || quantity < 1) {
      Alert.alert('Thông tin thuốc chưa hợp lệ', 'Chọn thuốc và nhập số lượng nguyên dương.');
      return;
    }
    setSubmitting(true);
    try {
      await prescriptionLineApi.create({
        id_don_thuoc: Number(id),
        id_thuoc: Number(selectedMedicineId),
        so_luong_ke: quantity,
        lieu_dung: newDosage.trim() || null,
        so_ngay_dung: newDuration ? Number(newDuration) : null,
      });
      setSelector(null);
      setSelectedMedicineId('');
      setNewQuantity('1');
      setNewDosage('');
      setNewDuration('');
      await loadData();
    } catch (requestError) {
      Alert.alert('Không thể thêm thuốc', requestError.message || 'Vui lòng kiểm tra thông tin thuốc.');
    } finally {
      setSubmitting(false);
    }
  };

  const savePrescriptionMedicine = async (medicineId) => {
    const edit = lineEdits[String(medicineId)];
    if (!edit) return;
    const quantity = Number(edit.so_luong_ke);
    const duration = edit.so_ngay_dung === '' ? null : Number(edit.so_ngay_dung);
    if (!Number.isInteger(quantity) || quantity < 1 ||
        (duration !== null && (!Number.isInteger(duration) || duration < 1))) {
      Alert.alert('Thông tin chưa hợp lệ', 'Số lượng và số ngày dùng phải là số nguyên dương.');
      return;
    }
    setSubmitting(true);
    try {
      await prescriptionLineApi.updateItem(id, medicineId, {
        so_luong_ke: quantity,
        lieu_dung: edit.lieu_dung.trim() || null,
        so_ngay_dung: duration,
      });
      setLineEdits((current) => {
        const next = { ...current };
        delete next[String(medicineId)];
        return next;
      });
      await loadData();
    } catch (requestError) {
      Alert.alert('Không thể cập nhật thuốc', requestError.message || 'Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const removePrescriptionMedicine = (medicineId) => {
    Alert.alert('Xóa thuốc khỏi toa', 'Bạn có chắc chắn muốn xóa thuốc này?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          setSubmitting(true);
          try {
            await prescriptionLineApi.deleteItem(id, medicineId);
            await loadData();
          } catch (requestError) {
            Alert.alert('Không thể xóa thuốc', requestError.message || 'Vui lòng thử lại.');
          } finally {
            setSubmitting(false);
          }
        },
      },
    ]);
  };

  const status = prescription?.trang_thai || 'cho_duyet';
  const canEditPrescription = status === 'cho_duyet';
  const activeRegimens = regimens.filter((regimen) =>
    Number(regimen.trang_thai ?? 1) === 1
      && (!selectedDiseaseId || String(regimen.id_benh) === String(selectedDiseaseId))
  );
  const selectedDisease = diseases.find((disease) => String(disease.id) === String(selectedDiseaseId));
  const selectedRegimen = regimens.find((regimen) => String(regimen.id) === String(selectedRegimenId));
  const canApprove = (diagnosis.trim() || selectedDiseaseId) && items.length >= 2;
  if (!ready || !isPharmacistRole(user?.vai_tro)) {
    return (
      <View style={styles.container}>
        <ActivityIndicator style={styles.loader} size="large" color="#0d9488" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AdminSidebar
        activeKey="prescriptions"
        navigation={navigation}
        variant="staff"
      />
      <View style={styles.main}>
      <WorkspaceHeader
        label="KHU NGHIỆP VỤ"
        title="Thẩm định toa thuốc"
        actions={[
          { label: 'Bàn nghiệp vụ', onPress: () => navigation.navigate('Staff', { tab: 'prescriptions' }) },
          { label: 'Cửa hàng', onPress: () => navigation.navigate('Home') },
        ]}
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
                <Text style={styles.infoLabel}>Dược sĩ kê đơn:</Text> {doctor?.ho_ten || (prescription?.id_nhan_vien_ke_don ? `Dược sĩ #${prescription.id_nhan_vien_ke_don}` : 'Khách tải toa ngoài')} ({doctor?.chuyen_khoa || 'Chuyên khoa'})
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
              {prescription?.hinh_anh_don_thuoc ? (
                <Text style={styles.infoLine}>
                  <Text style={styles.infoLabel}>Ảnh toa đã tải lên:</Text> {prescription.hinh_anh_don_thuoc}
                </Text>
              ) : null}
            </View>

            <View style={styles.clinicalCard}>
              <Text style={styles.actionCardTitle}>Chẩn đoán và phác đồ</Text>
              <Text style={styles.fieldLabel}>Bệnh chính</Text>
              <TouchableOpacity
                style={styles.selectorButton}
                onPress={() => setSelector('disease')}
                disabled={!canEditPrescription || submitting}
              >
                <Text style={styles.selectorText}>
                  {selectedDisease
                    ? `${selectedDisease.ma_icd ? `${selectedDisease.ma_icd} · ` : ''}${selectedDisease.ten_benh}`
                    : 'Chọn bệnh theo danh mục'}
                </Text>
                {canEditPrescription ? <Text style={styles.selectorArrow}>⌄</Text> : null}
              </TouchableOpacity>

              <Text style={styles.fieldLabel}>Chẩn đoán chi tiết</Text>
              <TextInput
                value={diagnosis}
                onChangeText={setDiagnosis}
                editable={canEditPrescription}
                placeholder="Nhập chẩn đoán và bệnh kèm theo"
                placeholderTextColor="#94a3b8"
                multiline
                style={[styles.noteInput, styles.diagnosisInput]}
              />

              <Text style={styles.fieldLabel}>Phác đồ điều trị</Text>
              <TouchableOpacity
                style={styles.selectorButton}
                onPress={() => setSelector('regimen')}
                disabled={!canEditPrescription || submitting}
              >
                <Text style={styles.selectorText}>
                  {selectedRegimen?.ten_phac_do || 'Chọn phác đồ (không bắt buộc)'}
                </Text>
                {canEditPrescription ? <Text style={styles.selectorArrow}>⌄</Text> : null}
              </TouchableOpacity>
              {selectedRegimen?.mo_ta ? (
                <Text style={styles.regimenDescription}>{selectedRegimen.mo_ta}</Text>
              ) : null}
              {selectedRegimen && regimenLines
                .filter((line) => String(line.id_phac_do) === String(selectedRegimen.id))
                .map((line) => {
                  const medicine = medicines.find((item) => String(item.id) === String(line.id_thuoc));
                  return (
                    <Text key={line.id_thuoc} style={styles.regimenPreview}>
                      • {medicine?.ten_thuoc || line.ten_thuoc || `Thuốc #${line.id_thuoc}`} · SL gợi ý {line.so_luong_goi_y}
                    </Text>
                  );
                })}

              {canEditPrescription ? (
                <View style={styles.btnRow}>
                  <TouchableOpacity
                    style={[styles.btn, styles.saveClinicalBtn]}
                    onPress={saveClinicalDetails}
                    disabled={submitting}
                  >
                    <Text style={styles.saveClinicalText}>Lưu chẩn đoán</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.btn, styles.applyRegimenBtn]}
                    onPress={applySelectedRegimen}
                    disabled={submitting || !selectedRegimenId}
                  >
                    <Text style={styles.applyRegimenText}>
                      {submitting ? 'Đang xử lý...' : 'Áp dụng phác đồ'}
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : null}
              <Text style={styles.rulesText}>
                Muốn duyệt toa cần có chẩn đoán hoặc bệnh chính, và ít nhất 2 loại thuốc.
              </Text>
            </View>

            <View style={styles.medicationHeader}>
              <Text style={styles.sectionTitle}>Danh mục thuốc kê trong toa ({items.length})</Text>
              {canEditPrescription ? (
                <TouchableOpacity
                  style={styles.addMedicineButton}
                  onPress={() => setSelector('medicine')}
                  disabled={submitting}
                >
                  <Text style={styles.addMedicineText}>+ Thêm thuốc</Text>
                </TouchableOpacity>
              ) : null}
            </View>
            {items.map((line, index) => {
              const med = medicines.find((m) => String(m.id) === String(line.id_thuoc));
              const edit = lineEdits[String(line.id_thuoc)] || {
                so_luong_ke: String(line.so_luong_ke ?? ''),
                lieu_dung: line.lieu_dung || '',
                so_ngay_dung: line.so_ngay_dung ? String(line.so_ngay_dung) : '',
              };
              return (
                <View key={line.id || index} style={styles.medCard}>
                  <Text style={styles.medName}>
                    {med?.ten_thuoc || `Thuốc #${line.id_thuoc}`}
                  </Text>
                  {canEditPrescription ? (
                    <>
                      <Text style={styles.fieldLabel}>Số lượng kê ({med?.don_vi_tinh || 'đơn vị'})</Text>
                      <TextInput
                        value={edit.so_luong_ke}
                        onChangeText={(value) => setLineEdits((current) => ({
                          ...current,
                          [String(line.id_thuoc)]: { ...edit, so_luong_ke: value },
                        }))}
                        keyboardType="numeric"
                        style={styles.smallInput}
                      />
                      <Text style={styles.fieldLabel}>Liều dùng</Text>
                      <TextInput
                        value={edit.lieu_dung}
                        onChangeText={(value) => setLineEdits((current) => ({
                          ...current,
                          [String(line.id_thuoc)]: { ...edit, lieu_dung: value },
                        }))}
                        multiline
                        style={[styles.smallInput, styles.dosageInput]}
                      />
                      <Text style={styles.fieldLabel}>Số ngày dùng</Text>
                      <TextInput
                        value={edit.so_ngay_dung}
                        onChangeText={(value) => setLineEdits((current) => ({
                          ...current,
                          [String(line.id_thuoc)]: { ...edit, so_ngay_dung: value },
                        }))}
                        keyboardType="numeric"
                        style={styles.smallInput}
                      />
                      <View style={styles.medicationActions}>
                        <TouchableOpacity
                          style={styles.removeMedicineButton}
                          onPress={() => removePrescriptionMedicine(line.id_thuoc)}
                          disabled={submitting}
                        >
                          <Text style={styles.removeMedicineText}>Xóa thuốc</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.saveMedicineButton}
                          onPress={() => savePrescriptionMedicine(line.id_thuoc)}
                          disabled={submitting}
                        >
                          <Text style={styles.saveMedicineText}>Lưu thay đổi</Text>
                        </TouchableOpacity>
                      </View>
                    </>
                  ) : (
                    <>
                      <Text style={styles.medMeta}>
                        Số lượng kê: <Text style={styles.bold}>{line.so_luong_ke}</Text> {med?.don_vi_tinh || 'đơn vị'} · Dùng trong {line.so_ngay_dung || '—'} ngày
                      </Text>
                      <View style={styles.dosageBox}>
                        <Text style={styles.dosageLabel}>Chỉ định liều dùng:</Text>
                        <Text style={styles.dosageText}>{line.lieu_dung || 'Chưa có hướng dẫn'}</Text>
                      </View>
                    </>
                  )}
                </View>
              );
            })}

            {/* Approval Action Form */}
            {canEditPrescription ? <View style={styles.actionCard}>
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
                  disabled={submitting || !canApprove}
                >
                  <Text style={styles.approveBtnText}>
                    {submitting ? 'Đang duyệt...' : !canApprove ? 'Cần chẩn đoán và đủ 2 loại thuốc' : '✓ Duyệt đơn thuốc'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View> : null}
          </>
        )}
      </ScrollView>
      <Modal
        visible={Boolean(selector)}
        animationType="slide"
        transparent
        onRequestClose={() => setSelector(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {selector === 'disease'
                ? 'Chọn bệnh'
                : selector === 'regimen'
                ? 'Chọn phác đồ'
                : 'Thêm thuốc vào toa'}
            </Text>
            <ScrollView style={styles.modalOptions}>
              {selector === 'disease' ? diseases.map((disease) => (
                <TouchableOpacity
                  key={disease.id}
                  style={styles.modalOption}
                  onPress={() => {
                    setSelectedDiseaseId(String(disease.id));
                    if (selectedRegimen && String(selectedRegimen.id_benh) !== String(disease.id)) {
                      setSelectedRegimenId('');
                    }
                    setSelector(null);
                  }}
                >
                  <Text style={styles.modalOptionTitle}>
                    {disease.ma_icd ? `${disease.ma_icd} · ` : ''}{disease.ten_benh}
                  </Text>
                  {disease.mo_ta ? <Text style={styles.modalOptionDetail}>{disease.mo_ta}</Text> : null}
                </TouchableOpacity>
              )) : null}

              {selector === 'regimen' ? activeRegimens.map((regimen) => (
                <TouchableOpacity
                  key={regimen.id}
                  style={styles.modalOption}
                  onPress={() => {
                    setSelectedRegimenId(String(regimen.id));
                    setSelectedDiseaseId(String(regimen.id_benh));
                    setSelector(null);
                  }}
                >
                  <Text style={styles.modalOptionTitle}>{regimen.ten_phac_do}</Text>
                  <Text style={styles.modalOptionDetail}>
                    {diseases.find((disease) => String(disease.id) === String(regimen.id_benh))?.ten_benh || regimen.ten_benh || ''}
                    {regimen.mo_ta ? ` · ${regimen.mo_ta}` : ''}
                  </Text>
                </TouchableOpacity>
              )) : null}

              {selector === 'medicine' ? medicines
                .filter((medicine) => Number(medicine.trang_thai ?? 1) === 1)
                .map((medicine) => (
                  <TouchableOpacity
                    key={medicine.id}
                    style={[
                      styles.modalOption,
                      String(selectedMedicineId) === String(medicine.id) && styles.modalOptionActive,
                    ]}
                    onPress={() => setSelectedMedicineId(String(medicine.id))}
                  >
                    <Text style={styles.modalOptionTitle}>{medicine.ten_thuoc}</Text>
                    <Text style={styles.modalOptionDetail}>
                      {medicine.loai_ke_don === 'ke_don' ? 'Thuốc kê đơn' : 'Không kê đơn'} · {medicine.don_vi_tinh || 'đơn vị'}
                    </Text>
                  </TouchableOpacity>
                )) : null}
            </ScrollView>

            {selector === 'medicine' ? (
              <View style={styles.newMedicineForm}>
                <Text style={styles.fieldLabel}>Số lượng kê</Text>
                <TextInput
                  value={newQuantity}
                  onChangeText={setNewQuantity}
                  keyboardType="numeric"
                  style={styles.smallInput}
                />
                <Text style={styles.fieldLabel}>Liều dùng</Text>
                <TextInput
                  value={newDosage}
                  onChangeText={setNewDosage}
                  placeholder="Hướng dẫn sử dụng theo toa gốc"
                  placeholderTextColor="#94a3b8"
                  multiline
                  style={[styles.smallInput, styles.dosageInput]}
                />
                <Text style={styles.fieldLabel}>Số ngày dùng (không bắt buộc)</Text>
                <TextInput
                  value={newDuration}
                  onChangeText={setNewDuration}
                  keyboardType="numeric"
                  style={styles.smallInput}
                />
              </View>
            ) : null}
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setSelector(null)}>
                <Text style={styles.modalCancelText}>Đóng</Text>
              </TouchableOpacity>
              {selector === 'medicine' ? (
                <TouchableOpacity
                  style={[styles.saveMedicineButton, (!selectedMedicineId || submitting) && styles.disabledButton]}
                  onPress={addPrescriptionMedicine}
                  disabled={!selectedMedicineId || submitting}
                >
                  <Text style={styles.saveMedicineText}>Thêm thuốc</Text>
                </TouchableOpacity>
              ) : null}
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
  main: { flex: 1, minWidth: 0 },
  content: { paddingHorizontal: 28, paddingTop: 24, paddingBottom: 48 },
  back: { color: '#0f766e', fontWeight: '700', marginBottom: 12 },
  kicker: { color: '#0f766e', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  title: { color: '#102a2a', fontSize: 28, fontWeight: '900', marginTop: 6, marginBottom: 18 },
  loader: { marginTop: 40 },
  errorText: { color: '#b91c1c', marginTop: 20 },
  clinicalCard: {
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
  fieldLabel: { color: '#475569', fontSize: 12, fontWeight: '800', marginTop: 10, marginBottom: 6 },
  selectorButton: {
    minHeight: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#d4e1de',
    backgroundColor: '#f7faf9',
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectorText: { color: '#24413f', fontSize: 14, flex: 1 },
  selectorArrow: { color: '#64748b', fontSize: 19, fontWeight: '800', marginLeft: 8 },
  diagnosisInput: { minHeight: 64, marginBottom: 2 },
  regimenDescription: { color: '#64748b', fontSize: 12, marginTop: 8, lineHeight: 18 },
  regimenPreview: { color: '#334155', fontSize: 12, marginTop: 5 },
  saveClinicalBtn: { backgroundColor: '#e9f5f2', borderWidth: 1, borderColor: '#cce5df' },
  saveClinicalText: { color: '#0f766e', fontWeight: '800' },
  applyRegimenBtn: { backgroundColor: '#0f766e' },
  applyRegimenText: { color: '#fff', fontWeight: '800' },
  rulesText: { color: '#64748b', fontSize: 12, marginTop: 12, lineHeight: 18 },
  medicationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 12,
  },
  addMedicineButton: { backgroundColor: '#0f766e', paddingVertical: 9, paddingHorizontal: 12, borderRadius: 9 },
  addMedicineText: { color: '#fff', fontWeight: '800', fontSize: 12 },
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
  cardLabel: { color: '#64748b', fontWeight: '600', fontSize: 13 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeApproved: { backgroundColor: '#dcfce7' },
  badgePending: { backgroundColor: '#fef9c3' },
  badgeRejected: { backgroundColor: '#fee2e2' },
  statusText: { fontWeight: '800', fontSize: 12, color: '#0f766e' },
  infoLine: { color: '#334155', fontSize: 14, marginBottom: 6 },
  infoLabel: { color: '#64748b', fontWeight: '600' },
  sectionTitle: { color: '#0f172a', fontSize: 17, fontWeight: '800', marginBottom: 12 },
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
  smallInput: {
    minHeight: 42,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 11,
    paddingVertical: 8,
    color: '#0f172a',
    fontSize: 14,
  },
  dosageInput: { minHeight: 62, textAlignVertical: 'top' },
  medicationActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 9, marginTop: 12 },
  removeMedicineButton: {
    borderWidth: 1,
    borderColor: '#fecdd3',
    backgroundColor: '#fff1f2',
    borderRadius: 9,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  removeMedicineText: { color: '#be123c', fontWeight: '800', fontSize: 12 },
  saveMedicineButton: {
    backgroundColor: '#0f766e',
    borderRadius: 9,
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveMedicineText: { color: '#fff', fontWeight: '800', fontSize: 12 },
  disabledButton: { opacity: 0.5 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 620,
    maxHeight: '90%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
  },
  modalTitle: { color: '#0f172a', fontSize: 18, fontWeight: '900', marginBottom: 12 },
  modalOptions: { maxHeight: 300 },
  modalOption: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    padding: 11,
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  modalOptionActive: { borderColor: '#0f9488', backgroundColor: '#e9f5f2' },
  modalOptionTitle: { color: '#0f172a', fontWeight: '800', fontSize: 13 },
  modalOptionDetail: { color: '#64748b', fontSize: 12, marginTop: 4 },
  newMedicineForm: { marginTop: 8 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 10, marginTop: 14 },
  modalCancel: { paddingVertical: 10, paddingHorizontal: 12 },
  modalCancelText: { color: '#475569', fontWeight: '800' },
  bold: { color: '#2563eb', fontWeight: '700' },
  dosageBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 10,
    marginTop: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#0f9488',
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
  actionCardTitle: { color: '#0f172a', fontWeight: '800', fontSize: 15, marginBottom: 10 },
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
  approveBtn: { backgroundColor: '#0f766e' },
  approveBtnText: { color: '#fff', fontWeight: '800' },
});

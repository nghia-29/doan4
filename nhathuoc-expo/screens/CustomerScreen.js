import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import StoreHeader from '../components/StoreHeader';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { createCrudService } from '../services/crudService';
import prescriptionRequestApi from '../services/prescriptionRequestService';
import accountApi from '../services/accountService';
import { formatPrice, formatDate, getOrderStatusMeta } from '../data/mockData';
import { isAdminRole, isStaffRole } from '../utils/workspaceAccess';

export default function CustomerScreen({ navigation, route }) {
  const { user, ready, logout } = useAuth();
  const { count } = useCart();
  const [tab, setTab] = useState('orders'); // 'orders' | 'prescriptions' | 'profile'
  const [profileEditorVisible, setProfileEditorVisible] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileDraft, setProfileDraft] = useState({
    ho_ten: '',
    so_dien_thoai: '',
    email: '',
    dia_chi: '',
    ngay_sinh: '',
  });
  const [orders, setOrders] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [prescriptionRequests, setPrescriptionRequests] = useState([]);
  const [requestFormVisible, setRequestFormVisible] = useState(false);
  const [requestFormError, setRequestFormError] = useState('');
  const [requestSubmitting, setRequestSubmitting] = useState(false);
  const [requestForm, setRequestForm] = useState({
    ten_benh_khai: '',
    trieu_chung: '',
    thoi_gian_bi_benh: '',
    di_ung_thuoc: '',
    benh_nen_thuoc_dang_dung: '',
  });
  const [customerInfo, setCustomerInfo] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderLines, setOrderLines] = useState([]);
  const [allMedicines, setAllMedicines] = useState([]);
  const [prescriptionBalances, setPrescriptionBalances] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const foundCustomer = await accountApi.getMe(user?.id);
      setCustomerInfo(foundCustomer || null);

      const custId = foundCustomer?.id;
      if (!custId) {
        if (tab === 'orders') {
          setOrders([]);
          setOrderLines([]);
          setAllMedicines([]);
        } else if (tab === 'prescriptions') {
          setPrescriptions([]);
          setPrescriptionRequests([]);
          setPrescriptionBalances([]);
        }
        return;
      }

      if (tab === 'orders') {
        const [orderList, meds, allLines] = await Promise.all([
          createCrudService('don_dat_thuoc').getAll(),
          createCrudService('thuoc').getAll(),
          createCrudService('chi_tiet_don_dat').getAll(),
        ]);
        setOrders(orderList.filter((o) => String(o.id_khach_hang) === String(custId)));
        setAllMedicines(meds);
        setOrderLines(allLines);
      } else if (tab === 'prescriptions') {
        const [presList, balances, requests] = await Promise.all([
          createCrudService('don_thuoc').getAll(),
          createCrudService('v_toa_con_lai').getAll(),
          prescriptionRequestApi.getMine(user?.id),
        ]);
        setPrescriptions(presList.filter((p) => String(p.id_khach_hang) === String(custId)));
        setPrescriptionRequests(requests);
        setPrescriptionBalances(
          balances.filter((row) => String(row.id_khach_hang) === String(custId))
        );
      }
    } catch (e) {
      setError(e.message || 'Không thể tải thông tin tài khoản.');
    } finally {
      setLoading(false);
    }
  }, [tab, user]);

  useEffect(() => {
    if (!ready) return;
    if (isAdminRole(user?.vai_tro)) {
      navigation.replace('AdminDashboard');
      return;
    }
    if (isStaffRole(user?.vai_tro)) {
      navigation.replace('Staff');
      return;
    }
  }, [navigation, ready, user?.vai_tro]);

  useEffect(() => {
    if (route.params?.tab === 'profile') setTab('profile');
  }, [route.params?.tab]);

  useEffect(() => {
    if (ready && !isAdminRole(user?.vai_tro) && !isStaffRole(user?.vai_tro)) {
      loadData();
    }
  }, [loadData, ready, user?.vai_tro]);

  const viewOrderModal = (order) => {
    setSelectedOrder(order);
    setModalVisible(true);
  };

  const getItemsForOrder = (orderId) => {
    return orderLines.filter((line) => String(line.id_don_dat) === String(orderId));
  };

  const submitPrescriptionRequest = async () => {
    if (!requestForm.ten_benh_khai.trim() || !requestForm.trieu_chung.trim()) {
      setRequestFormError('Vui lòng mô tả bệnh/triệu chứng chính và tình trạng hiện tại.');
      return;
    }
    setRequestSubmitting(true);
    setRequestFormError('');
    setError('');
    try {
      await prescriptionRequestApi.create({
        ...requestForm,
        ten_benh_khai: requestForm.ten_benh_khai.trim(),
        trieu_chung: requestForm.trieu_chung.trim(),
      }, user?.id);
      setRequestFormVisible(false);
      setRequestFormError('');
      setRequestForm({
        ten_benh_khai: '',
        trieu_chung: '',
        thoi_gian_bi_benh: '',
        di_ung_thuoc: '',
        benh_nen_thuoc_dang_dung: '',
      });
      setPrescriptionRequests(await prescriptionRequestApi.getMine(user?.id));
    } catch (requestError) {
      setRequestFormError(requestError.message || 'Không thể gửi yêu cầu kê đơn.');
    } finally {
      setRequestSubmitting(false);
    }
  };

  const cancelPrescriptionRequest = async (requestId) => {
    try {
      await prescriptionRequestApi.cancel(requestId, user?.id);
      setPrescriptionRequests(await prescriptionRequestApi.getMine(user?.id));
    } catch (requestError) {
      setError(requestError.message || 'Không thể hủy yêu cầu kê đơn.');
    }
  };

  const openProfileEditor = () => {
    setProfileDraft({
      ho_ten: customerInfo?.ho_ten || '',
      so_dien_thoai: customerInfo?.so_dien_thoai || '',
      email: customerInfo?.email || '',
      dia_chi: customerInfo?.dia_chi || '',
      ngay_sinh: customerInfo?.ngay_sinh ? String(customerInfo.ngay_sinh).slice(0, 10) : '',
    });
    setProfileError('');
    setProfileEditorVisible(true);
  };

  const saveProfile = async () => {
    const fullName = profileDraft.ho_ten.trim();
    const email = profileDraft.email.trim();
    const phone = profileDraft.so_dien_thoai.trim();
    const birthDate = profileDraft.ngay_sinh.trim();
    if (!fullName) {
      setProfileError('Vui lòng nhập họ và tên.');
      return;
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setProfileError('Email chưa đúng định dạng.');
      return;
    }
    if (phone && !/^[0-9+().\-\s]{8,15}$/.test(phone)) {
      setProfileError('Số điện thoại cần có từ 8 đến 15 ký tự hợp lệ.');
      return;
    }
    if (birthDate && !/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) {
      setProfileError('Ngày sinh cần có định dạng YYYY-MM-DD.');
      return;
    }

    setProfileSaving(true);
    setProfileError('');
    try {
      const updatedProfile = await accountApi.updateMe({
        ho_ten: fullName,
        so_dien_thoai: phone,
        email,
        dia_chi: profileDraft.dia_chi.trim(),
        ngay_sinh: birthDate,
      }, user?.id);
      setCustomerInfo(updatedProfile);
      setProfileEditorVisible(false);
      setError('');
    } catch (saveError) {
      setProfileError(saveError.message || 'Không thể cập nhật hồ sơ.');
    } finally {
      setProfileSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <StoreHeader
        cartCount={count}
        onCartPress={() => navigation.navigate('Cart')}
        onAccountPress={() => setTab('profile')}
        preferAccountRoute={false}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadData} />}
      >
        <TouchableOpacity onPress={() => navigation.navigate('Home')}>
          <Text style={styles.back}>‹ Quay lại mua sắm</Text>
        </TouchableOpacity>

        {/* Customer Greeting Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarBox}>
            <Text style={styles.avatarText}>
              {(customerInfo?.ho_ten || user?.ten_dang_nhap || 'KH')[0].toUpperCase()}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.kicker}>TÀI KHOẢN KHÁCH HÀNG</Text>
            <Text style={styles.customerName}>
              {customerInfo?.ho_ten || user?.ten_dang_nhap || 'Quý khách'}
            </Text>
            <Text style={styles.customerMeta}>
              📞 {customerInfo?.so_dien_thoai || 'Chưa cập nhật'} · ✉️ {customerInfo?.email || 'Chưa cập nhật'}
            </Text>
          </View>
        </View>

        {error ? (
          <TouchableOpacity style={styles.errorBox} onPress={loadData}>
            <Text style={styles.errorText}>{error}</Text>
            <Text style={styles.errorAction}>Chạm để thử lại</Text>
          </TouchableOpacity>
        ) : null}

        {/* Tab switcher */}
        <View style={styles.tabsRow}>
          <TouchableOpacity
            style={[styles.tabBtn, tab === 'orders' && styles.tabBtnActive]}
            onPress={() => setTab('orders')}
          >
            <Text style={[styles.tabText, tab === 'orders' && styles.tabTextActive]}>
              📦 Đơn hàng ({orders.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, tab === 'prescriptions' && styles.tabBtnActive]}
            onPress={() => setTab('prescriptions')}
          >
            <Text style={[styles.tabText, tab === 'prescriptions' && styles.tabTextActive]}>
              🩺 Toa & yêu cầu ({prescriptions.length + prescriptionRequests.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, tab === 'profile' && styles.tabBtnActive]}
            onPress={() => setTab('profile')}
          >
            <Text style={[styles.tabText, tab === 'profile' && styles.tabTextActive]}>
              👤 Thông tin
            </Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator style={styles.loader} size="large" color="#0d9488" />
        ) : tab === 'orders' ? (
          /* ORDERS TAB */
          <View style={styles.tabContent}>
            {orders.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyIcon}>🛍️</Text>
                <Text style={styles.emptyTitle}>Bạn chưa có đơn đặt hàng nào</Text>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => navigation.navigate('Products')}
                >
                  <Text style={styles.actionBtnText}>Mua thuốc ngay</Text>
                </TouchableOpacity>
              </View>
            ) : (
              orders.map((ord) => {
                const meta = getOrderStatusMeta(ord.trang_thai);
                const items = getItemsForOrder(ord.id);
                return (
                  <TouchableOpacity
                    key={ord.id}
                    style={styles.orderCard}
                    onPress={() => viewOrderModal(ord)}
                  >
                    <View style={styles.orderHeader}>
                      <Text style={styles.orderId}>Đơn hàng #{ord.id}</Text>
                      <View style={[styles.statusBadge, { backgroundColor: meta.bg }]}>
                        <Text style={[styles.statusText, { color: meta.color }]}>
                          {meta.label}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.orderDate}>Ngày đặt: {ord.ngay_dat || 'Mới đặt'}</Text>
                    <Text style={styles.orderAddress} numberOfLines={1}>
                      📍 {ord.dia_chi_giao_hang || 'Tại quầy'}
                    </Text>
                    <View style={styles.orderDivider} />
                    <View style={styles.orderFooter}>
                      <Text style={styles.orderItemsCount}>
                        {items.length > 0 ? `${items.length} sản phẩm` : 'Xem chi tiết'}
                      </Text>
                      <Text style={styles.orderTotal}>
                        {formatPrice(ord.thanh_tien || ord.tong_tien)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        ) : tab === 'prescriptions' ? (
          /* PRESCRIPTIONS TAB */
          <View style={styles.tabContent}>
            <View style={styles.requestIntro}>
              <View style={styles.requestIntroCopy}>
                <Text style={styles.requestIntroTitle}>Cần dược sĩ tư vấn kê toa?</Text>
                <Text style={styles.requestIntroText}>
                  Gửi triệu chứng và thông tin sức khỏe để dược sĩ tiếp nhận, tư vấn và lập toa phù hợp.
                </Text>
              </View>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => setRequestFormVisible(true)}
              >
                <Text style={styles.actionBtnText}>Gửi yêu cầu</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.subsectionTitle}>Yêu cầu tư vấn của bạn</Text>
            {prescriptionRequests.length === 0 ? (
              <Text style={styles.requestEmpty}>Bạn chưa gửi yêu cầu kê đơn nào.</Text>
            ) : prescriptionRequests.map((request) => {
              const requestStatus = {
                cho_tiep_nhan: ['Chờ dược sĩ tiếp nhận', '#fef9c3', '#a16207'],
                da_tiep_nhan: ['Đang được tư vấn', '#dbeafe', '#1d4ed8'],
                da_ke_don: ['Đã lập toa', '#dcfce7', '#15803d'],
                tu_choi: ['Cần thăm khám trực tiếp', '#fee2e2', '#b91c1c'],
                da_huy: ['Đã hủy', '#f1f5f9', '#64748b'],
              }[request.trang_thai] || ['Đang xử lý', '#f1f5f9', '#475569'];
              return (
                <View key={request.id} style={styles.requestCard}>
                  <View style={styles.orderHeader}>
                    <Text style={styles.presTitle}>Yêu cầu #{request.id} · {request.ten_benh_khai}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: requestStatus[1] }]}>
                      <Text style={[styles.statusText, { color: requestStatus[2] }]}>
                        {requestStatus[0]}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.requestDetails}>{request.trieu_chung}</Text>
                  {request.di_ung_thuoc ? (
                    <Text style={styles.requestMeta}>Dị ứng: {request.di_ung_thuoc}</Text>
                  ) : null}
                  {request.ly_do_tu_choi ? (
                    <Text style={styles.requestReject}>Dược sĩ nhắn: {request.ly_do_tu_choi}</Text>
                  ) : null}
                  {request.id_don_thuoc ? (
                    <Text style={styles.requestMeta}>Toa liên quan: #{request.id_don_thuoc}</Text>
                  ) : null}
                  {request.trang_thai === 'cho_tiep_nhan' ? (
                    <TouchableOpacity
                      style={styles.cancelRequestBtn}
                      onPress={() => cancelPrescriptionRequest(request.id)}
                    >
                      <Text style={styles.cancelRequestText}>Hủy yêu cầu</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              );
            })}

            <Text style={styles.subsectionTitle}>Toa thuốc đã được kê</Text>
            {prescriptions.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyIcon}>📋</Text>
                <Text style={styles.emptyTitle}>Chưa có toa thuốc nào</Text>
                <Text style={styles.emptySub}>
                  Trạng thái toa và số lượng thuốc còn lại sẽ hiển thị tại đây.
                </Text>
              </View>
            ) : (
              prescriptions.map((pres) => (
                <View key={pres.id} style={styles.presCard}>
                  <View style={styles.orderHeader}>
                    <Text style={styles.presTitle}>Toa thuốc #{pres.id}</Text>
                    <View
                      style={[
                        styles.statusBadge,
                        pres.trang_thai === 'da_duyet'
                          ? { backgroundColor: '#dcfce7' }
                          : pres.trang_thai === 'tu_choi'
                          ? { backgroundColor: '#fee2e2' }
                          : { backgroundColor: '#fef9c3' },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          pres.trang_thai === 'da_duyet'
                            ? { color: '#15803d' }
                            : pres.trang_thai === 'tu_choi'
                            ? { color: '#b91c1c' }
                            : { color: '#b45309' },
                        ]}
                      >
                        {pres.trang_thai === 'da_duyet'
                          ? '✓ Đã duyệt'
                          : pres.trang_thai === 'tu_choi'
                          ? 'Đã từ chối'
                          : '⏳ Chờ duyệt'}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.presDate}>
                    Ngày kê: {formatDate(pres.ngay_ke_don)} · Hiệu lực {pres.so_ngay_hieu_luc || 5} ngày
                  </Text>
                  {pres.trang_thai === 'da_duyet' && prescriptionBalances
                    .filter((row) => String(row.id_don_thuoc) === String(pres.id))
                    .map((row) => (
                      <View key={row.id_thuoc} style={styles.balanceRow}>
                        <Text style={styles.balanceName}>{row.ten_thuoc}</Text>
                        <Text style={styles.balanceValue}>{row.con_lai} / {row.so_luong_ke} còn lại</Text>
                      </View>
                    ))}
                  {pres.ghi_chu_duyet ? (
                    <Text style={styles.presNote}>
                      Dược sĩ ghi chú: {pres.ghi_chu_duyet}
                    </Text>
                  ) : null}
                </View>
              ))
            )}
          </View>
        ) : (
          /* PROFILE TAB */
          <View style={styles.tabContent}>
            <View style={styles.accountHero}>
              <View style={styles.accountAvatar}>
                <Text style={styles.accountAvatarText}>
                  {(customerInfo?.ho_ten || user?.ten_dang_nhap || 'KH').trim().charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.accountHeroCopy}>
                <Text style={styles.accountEyebrow}>HỒ SƠ CỦA TÔI</Text>
                <Text style={styles.accountHeroName}>{customerInfo?.ho_ten || 'Khách hàng'}</Text>
                <Text style={styles.accountUsername}>@{customerInfo?.ten_dang_nhap || user?.ten_dang_nhap}</Text>
              </View>
              <View style={styles.accountActiveBadge}>
                <Text style={styles.accountActiveText}>Đang hoạt động</Text>
              </View>
            </View>

            <View style={styles.profileCard}>
              <View style={styles.profileCardHeader}>
                <View>
                  <Text style={styles.profileSectionTitle}>Thông tin cá nhân</Text>
                  <Text style={styles.profileSectionSub}>Cập nhật thông tin liên hệ và giao hàng</Text>
                </View>
                <TouchableOpacity style={styles.editProfileBtn} onPress={openProfileEditor}>
                  <Text style={styles.editProfileText}>Chỉnh sửa</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.profileGrid}>
                <View style={styles.profileDetail}>
                  <Text style={styles.pLabel}>HỌ VÀ TÊN</Text>
                  <Text style={styles.pVal}>{customerInfo?.ho_ten || 'Chưa cập nhật'}</Text>
                </View>
                <View style={styles.profileDetail}>
                  <Text style={styles.pLabel}>SỐ ĐIỆN THOẠI</Text>
                  <Text style={styles.pVal}>{customerInfo?.so_dien_thoai || 'Chưa cập nhật'}</Text>
                </View>
                <View style={styles.profileDetail}>
                  <Text style={styles.pLabel}>EMAIL</Text>
                  <Text style={styles.pVal}>{customerInfo?.email || 'Chưa cập nhật'}</Text>
                </View>
                <View style={styles.profileDetail}>
                  <Text style={styles.pLabel}>NGÀY SINH</Text>
                  <Text style={styles.pVal}>{formatDate(customerInfo?.ngay_sinh) || 'Chưa cập nhật'}</Text>
                </View>
                <View style={[styles.profileDetail, styles.profileAddress]}>
                  <Text style={styles.pLabel}>ĐỊA CHỈ GIAO HÀNG</Text>
                  <Text style={styles.pVal}>{customerInfo?.dia_chi || 'Chưa cập nhật'}</Text>
                </View>
              </View>
            </View>

            <View style={styles.accountAccessCard}>
              <Text style={styles.profileSectionTitle}>Tài khoản đăng nhập</Text>
              <View style={styles.loginAccountRow}>
                <Text style={styles.loginAccountLabel}>Tên đăng nhập</Text>
                <Text style={styles.loginAccountValue}>{customerInfo?.ten_dang_nhap || user?.ten_dang_nhap}</Text>
              </View>
              <View style={styles.loginAccountRow}>
                <Text style={styles.loginAccountLabel}>Loại tài khoản</Text>
                <Text style={styles.loginAccountValue}>Khách hàng</Text>
              </View>
              <Text style={styles.accountSecurityHint}>
                Để bảo vệ tài khoản, mật khẩu không hiển thị trong hồ sơ.
              </Text>
            </View>

            <View style={styles.accountShortcuts}>
              <TouchableOpacity style={styles.shortcutCard} onPress={() => setTab('orders')}>
                <Text style={styles.shortcutIcon}>📦</Text>
                <Text style={styles.shortcutTitle}>Đơn hàng</Text>
                <Text style={styles.shortcutCaption}>{orders.length} đơn đã đặt</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.shortcutCard} onPress={() => setTab('prescriptions')}>
                <Text style={styles.shortcutIcon}>🩺</Text>
                <Text style={styles.shortcutTitle}>Toa thuốc</Text>
                <Text style={styles.shortcutCaption}>{prescriptions.length} toa · {prescriptionRequests.length} yêu cầu</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.logoutBtn}
              onPress={async () => {
                await logout();
                navigation.navigate('Home');
              }}
            >
              <Text style={styles.logoutBtnText}>Đăng xuất tài khoản</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Order Detail Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Chi tiết đơn hàng #{selectedOrder?.id}</Text>
            <ScrollView style={styles.modalBody}>
              <Text style={styles.modalLabel}>Địa chỉ giao hàng:</Text>
              <Text style={styles.modalVal}>{selectedOrder?.dia_chi_giao_hang || '—'}</Text>

              <Text style={styles.modalLabel}>Số điện thoại nhận:</Text>
              <Text style={styles.modalVal}>{selectedOrder?.so_dien_thoai_nhan || '—'}</Text>

              <Text style={styles.modalLabel}>Danh sách thuốc:</Text>
              {getItemsForOrder(selectedOrder?.id).map((line, idx) => {
                const med = allMedicines.find((m) => String(m.id) === String(line.id_thuoc));
                return (
                  <View key={line.id || idx} style={styles.modalLine}>
                    <Text style={styles.modalLineName}>
                      {med?.ten_thuoc || `Thuốc #${line.id_thuoc}`}
                    </Text>
                    <Text style={styles.modalLinePrice}>
                      {line.so_luong} x {formatPrice(line.don_gia)} = {formatPrice(line.so_luong * line.don_gia)}
                    </Text>
                  </View>
                );
              })}

              <View style={styles.modalDivider} />
              <View style={styles.modalTotalRow}>
                <Text style={styles.modalTotalLabel}>Tổng thanh toán:</Text>
                <Text style={styles.modalTotalVal}>
                  {formatPrice(selectedOrder?.thanh_tien || selectedOrder?.tong_tien)}
                </Text>
              </View>
            </ScrollView>

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeBtnText}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={profileEditorVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setProfileEditorVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.profileEditor}>
            <Text style={styles.modalTitle}>Cập nhật hồ sơ</Text>
            <Text style={styles.profileEditorHint}>
              Thông tin này giúp nhà thuốc liên hệ và giao đơn chính xác.
            </Text>
            {profileError ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{profileError}</Text>
              </View>
            ) : null}
            <ScrollView keyboardShouldPersistTaps="handled">
              {[
                ['ho_ten', 'Họ và tên *', 'Nguyễn Văn An'],
                ['so_dien_thoai', 'Số điện thoại', '09xx xxx xxx'],
                ['email', 'Email', 'ban@email.com'],
                ['ngay_sinh', 'Ngày sinh (YYYY-MM-DD)', '2000-01-31'],
                ['dia_chi', 'Địa chỉ giao hàng', 'Số nhà, đường, phường/xã, tỉnh/thành'],
              ].map(([field, label, placeholder]) => (
                <View key={field}>
                  <Text style={styles.fieldLabel}>{label}</Text>
                  <TextInput
                    style={[styles.formInput, field === 'dia_chi' && styles.multilineInput]}
                    value={profileDraft[field]}
                    onChangeText={(value) => setProfileDraft((current) => ({ ...current, [field]: value }))}
                    placeholder={placeholder}
                    placeholderTextColor="#94a3b8"
                    keyboardType={field === 'so_dien_thoai' ? 'phone-pad' : field === 'email' ? 'email-address' : 'default'}
                    autoCapitalize={field === 'email' ? 'none' : 'sentences'}
                    multiline={field === 'dia_chi'}
                    textAlignVertical={field === 'dia_chi' ? 'top' : 'center'}
                    maxLength={field === 'ho_ten' ? 100 : field === 'so_dien_thoai' ? 15 : field === 'email' ? 100 : undefined}
                  />
                </View>
              ))}
            </ScrollView>
            <View style={styles.requestModalActions}>
              <TouchableOpacity
                style={styles.requestDismissBtn}
                onPress={() => { setProfileEditorVisible(false); setProfileError(''); }}
                disabled={profileSaving}
              >
                <Text style={styles.requestDismissText}>Để sau</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.requestSubmitBtn, profileSaving && styles.disabledButton]}
                onPress={saveProfile}
                disabled={profileSaving}
              >
                <Text style={styles.requestSubmitText}>
                  {profileSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={requestFormVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setRequestFormVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.requestModal}>
            <Text style={styles.modalTitle}>Gửi yêu cầu tư vấn kê toa</Text>
            {requestFormError ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{requestFormError}</Text>
              </View>
            ) : null}
            <Text style={styles.requestNotice}>
              Không dùng biểu mẫu này cho trường hợp cấp cứu. Dược sĩ có thể hướng dẫn bạn đến cơ sở y tế khi cần.
            </Text>
            <ScrollView keyboardShouldPersistTaps="handled">
              <Text style={styles.fieldLabel}>Bệnh hoặc triệu chứng chính *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Ví dụ: đau họng, sốt"
                value={requestForm.ten_benh_khai}
                onChangeText={(value) => setRequestForm((current) => ({ ...current, ten_benh_khai: value }))}
                maxLength={150}
              />
              <Text style={styles.fieldLabel}>Mô tả tình trạng hiện tại *</Text>
              <TextInput
                style={[styles.formInput, styles.multilineInput]}
                placeholder="Triệu chứng, mức độ, thời điểm bắt đầu..."
                value={requestForm.trieu_chung}
                onChangeText={(value) => setRequestForm((current) => ({ ...current, trieu_chung: value }))}
                multiline
                textAlignVertical="top"
              />
              <Text style={styles.fieldLabel}>Thời gian bị bệnh</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Ví dụ: 2 ngày"
                value={requestForm.thoi_gian_bi_benh}
                onChangeText={(value) => setRequestForm((current) => ({ ...current, thoi_gian_bi_benh: value }))}
                maxLength={100}
              />
              <Text style={styles.fieldLabel}>Dị ứng thuốc</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Ghi rõ tên thuốc/thành phần hoặc nhập Không"
                value={requestForm.di_ung_thuoc}
                onChangeText={(value) => setRequestForm((current) => ({ ...current, di_ung_thuoc: value }))}
              />
              <Text style={styles.fieldLabel}>Bệnh nền, thuốc đang dùng hoặc thông tin liên quan</Text>
              <TextInput
                style={[styles.formInput, styles.multilineInput]}
                placeholder="Ví dụ: đang mang thai, bệnh nền..."
                value={requestForm.benh_nen_thuoc_dang_dung}
                onChangeText={(value) => setRequestForm((current) => ({ ...current, benh_nen_thuoc_dang_dung: value }))}
                multiline
                textAlignVertical="top"
              />
            </ScrollView>
            <View style={styles.requestModalActions}>
              <TouchableOpacity
                style={styles.requestDismissBtn}
                onPress={() => { setRequestFormVisible(false); setRequestFormError(''); }}
                disabled={requestSubmitting}
              >
                <Text style={styles.requestDismissText}>Đóng</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.requestSubmitBtn, requestSubmitting && styles.disabledButton]}
                onPress={submitPrescriptionRequest}
                disabled={requestSubmitting}
              >
                <Text style={styles.requestSubmitText}>
                  {requestSubmitting ? 'Đang gửi...' : 'Gửi yêu cầu'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0fdfa' },
  content: { padding: 18, paddingBottom: 40 },
  back: { color: '#0d9488', fontWeight: '700', marginBottom: 12 },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
  },
  avatarBox: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#0d9488',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 22 },
  profileInfo: { flex: 1 },
  kicker: { color: '#0d9488', fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
  customerName: { color: '#134e4a', fontSize: 18, fontWeight: '800', marginTop: 2 },
  customerMeta: { color: '#64748b', fontSize: 12, marginTop: 3 },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: '#e6fffa',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabBtnActive: { backgroundColor: '#0d9488' },
  tabText: { color: '#0f766e', fontWeight: '700', fontSize: 12 },
  tabTextActive: { color: '#fff' },
  tabContent: { marginTop: 4 },
  loader: { marginTop: 40 },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 12,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  orderId: { color: '#0f172a', fontWeight: '800', fontSize: 15 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 11, fontWeight: '800' },
  orderDate: { color: '#64748b', fontSize: 12 },
  orderAddress: { color: '#475569', fontSize: 12, marginTop: 4 },
  orderDivider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 10 },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderItemsCount: { color: '#0d9488', fontWeight: '700', fontSize: 12 },
  orderTotal: { color: '#134e4a', fontWeight: '800', fontSize: 16 },
  emptyBox: { alignItems: 'center', paddingVertical: 50 },
  emptyIcon: { fontSize: 48, marginBottom: 10 },
  emptyTitle: { color: '#1e293b', fontSize: 16, fontWeight: '700' },
  emptySub: { color: '#64748b', fontSize: 13, marginTop: 4, textAlign: 'center' },
  actionBtn: {
    backgroundColor: '#0d9488',
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 11,
    marginTop: 14,
  },
  actionBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  presCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 10,
  },
  presTitle: { color: '#0f172a', fontWeight: '800', fontSize: 15 },
  presDate: { color: '#64748b', fontSize: 12, marginTop: 4 },
  presNote: { color: '#0f766e', fontSize: 12, marginTop: 6, fontStyle: 'italic' },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  balanceName: { color: '#334155', fontSize: 12, flex: 1, paddingRight: 8 },
  balanceValue: { color: '#0f766e', fontSize: 12, fontWeight: '800' },
  requestIntro: {
    backgroundColor: '#ecfeff',
    borderColor: '#a5f3fc',
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 18,
  },
  requestIntroCopy: { marginBottom: 12 },
  requestIntroTitle: { color: '#134e4a', fontWeight: '800', fontSize: 15 },
  requestIntroText: { color: '#475569', fontSize: 12, lineHeight: 18, marginTop: 5 },
  subsectionTitle: { color: '#134e4a', fontSize: 15, fontWeight: '800', marginBottom: 10 },
  requestEmpty: { color: '#64748b', fontSize: 13, marginBottom: 18 },
  requestCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 10,
  },
  requestDetails: { color: '#334155', fontSize: 13, lineHeight: 19 },
  requestMeta: { color: '#64748b', fontSize: 12, marginTop: 6 },
  requestReject: { color: '#b91c1c', fontSize: 12, marginTop: 6 },
  cancelRequestBtn: { alignSelf: 'flex-start', paddingVertical: 8, paddingHorizontal: 2, marginTop: 4 },
  cancelRequestText: { color: '#b91c1c', fontWeight: '800', fontSize: 12 },
  errorBox: { backgroundColor: '#fff1f2', borderRadius: 12, padding: 12, marginBottom: 14 },
  errorText: { color: '#be123c', fontSize: 13 },
  errorAction: { color: '#0f766e', fontSize: 12, fontWeight: '800', marginTop: 5 },
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
  },
  accountHero: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f766e',
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
  },
  accountAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#ccfbf1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  accountAvatarText: { color: '#115e59', fontSize: 24, fontWeight: '800' },
  accountHeroCopy: { flex: 1 },
  accountEyebrow: { color: '#99f6e4', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  accountHeroName: { color: '#fff', fontSize: 18, fontWeight: '800', marginTop: 3 },
  accountUsername: { color: '#ccfbf1', fontSize: 12, marginTop: 3 },
  accountActiveBadge: {
    backgroundColor: '#ccfbf1',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginLeft: 8,
  },
  accountActiveText: { color: '#115e59', fontSize: 10, fontWeight: '800' },
  profileCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 18,
  },
  profileSectionTitle: { color: '#134e4a', fontSize: 16, fontWeight: '800' },
  profileSectionSub: { color: '#64748b', fontSize: 12, marginTop: 4 },
  editProfileBtn: {
    backgroundColor: '#ccfbf1',
    borderRadius: 9,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  editProfileText: { color: '#0f766e', fontWeight: '800', fontSize: 12 },
  profileGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  profileDetail: {
    flexGrow: 1,
    flexBasis: '40%',
    minWidth: 180,
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 12,
  },
  profileAddress: { width: '100%' },
  accountAccessCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
  },
  loginAccountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  loginAccountLabel: { color: '#64748b', fontSize: 13 },
  loginAccountValue: { color: '#0f172a', fontSize: 13, fontWeight: '700', flexShrink: 1 },
  accountSecurityHint: { color: '#64748b', fontSize: 12, lineHeight: 18, marginTop: 12 },
  accountShortcuts: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  shortcutCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  shortcutIcon: { fontSize: 22, marginBottom: 8 },
  shortcutTitle: { color: '#134e4a', fontSize: 14, fontWeight: '800' },
  shortcutCaption: { color: '#64748b', fontSize: 11, lineHeight: 16, marginTop: 4 },
  profileEditor: {
    width: '100%',
    maxWidth: 520,
    maxHeight: '92%',
    alignSelf: 'center',
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  profileEditorHint: { color: '#64748b', fontSize: 13, lineHeight: 19, marginBottom: 8 },
  profileRow: { marginBottom: 12 },
  pLabel: { color: '#64748b', fontSize: 12 },
  pVal: { color: '#0f172a', fontSize: 14, fontWeight: '700', marginTop: 2 },
  logoutBtn: {
    borderWidth: 1,
    borderColor: '#f43f5e',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  logoutBtnText: { color: '#e11d48', fontWeight: '800' },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15,23,42,.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalTitle: { color: '#134e4a', fontSize: 18, fontWeight: '800', marginBottom: 12 },
  modalBody: { maxHeight: 340 },
  modalLabel: { color: '#64748b', fontSize: 12, fontWeight: '700', marginTop: 8 },
  modalVal: { color: '#0f172a', fontSize: 13, marginTop: 2 },
  modalLine: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 8,
    marginTop: 6,
  },
  modalLineName: { color: '#0f172a', fontWeight: '700', fontSize: 13 },
  modalLinePrice: { color: '#64748b', fontSize: 12, marginTop: 2 },
  modalDivider: { height: 1, backgroundColor: '#e2e8f0', marginVertical: 12 },
  modalTotalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTotalLabel: { color: '#0f172a', fontWeight: '800', fontSize: 14 },
  modalTotalVal: { color: '#0d9488', fontWeight: '800', fontSize: 18 },
  closeBtn: {
    backgroundColor: '#0d9488',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    marginTop: 14,
  },
  closeBtnText: { color: '#fff', fontWeight: '800' },
  requestModal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '92%',
  },
  requestNotice: {
    backgroundColor: '#fff7ed',
    color: '#9a3412',
    borderRadius: 10,
    padding: 10,
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 10,
  },
  fieldLabel: { color: '#334155', fontSize: 12, fontWeight: '700', marginTop: 10, marginBottom: 5 },
  formInput: {
    backgroundColor: '#f8fafc',
    borderColor: '#cbd5e1',
    borderWidth: 1,
    borderRadius: 9,
    paddingHorizontal: 11,
    paddingVertical: 10,
    color: '#0f172a',
    fontSize: 13,
  },
  multilineInput: { minHeight: 78 },
  requestModalActions: { flexDirection: 'row', gap: 10, marginTop: 14 },
  requestDismissBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  requestDismissText: { color: '#475569', fontWeight: '800' },
  requestSubmitBtn: {
    flex: 1,
    backgroundColor: '#0d9488',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  requestSubmitText: { color: '#fff', fontWeight: '800' },
  disabledButton: { opacity: 0.6 },
});

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  RefreshControl,
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
import { uploadMedicineImage } from '../services/imageUploadService';
import { resolveAssetUrl } from '../services/apiClient';
import { formatPrice, getOrderStatusMeta } from '../data/mockData';
import { ADMIN_ENTITIES } from './adminConfig';
import { canManageEntity, getWorkspaceRoute, isAdminRole } from '../utils/workspaceAccess';

const ORDER_DETAILS_RESOURCE = 'chi_tiet_don_dat';

function formatPaymentMethod(method) {
  const labels = {
    tien_mat: 'Tiền mặt khi nhận (COD)',
    COD: 'Tiền mặt khi nhận (COD)',
    chuyen_khoan: 'Chuyển khoản',
    vi_dien_tu: 'Ví điện tử',
  };
  return labels[method] || method || '—';
}

function formatPaymentStatus(status) {
  const labels = {
    cho_thanh_toan: 'Chờ thanh toán',
    da_thanh_toan: 'Đã thanh toán',
    that_bai: 'Thanh toán thất bại',
    da_hoan_tien: 'Đã hoàn tiền',
  };
  return labels[status] || status || 'Chưa có trạng thái';
}

export default function AdminCrudScreen({ route, navigation }) {
  const entityKey = route.params?.entity || 'thuoc';
  const config = ADMIN_ENTITIES[entityKey] || ADMIN_ENTITIES.thuoc;
  const fields = config.fields || [];
  const service = useMemo(() => createCrudService(config.resource), [config.resource]);
  const imageService = useMemo(() => createCrudService('anh_thuoc'), []);
  const recordIdField = config.idField || 'id';
  const hasDetailScreen = ['don_dat_thuoc', 'phieu_nhap_thuoc', 'don_thuoc'].includes(entityKey);
  const isOrderDetailsView = entityKey === ORDER_DETAILS_RESOURCE;
  const isDeliveryHistoryView = entityKey === 'lich_su_theo_doi_don';
  const isExpandedOrderView = isOrderDetailsView || isDeliveryHistoryView;
  const { user, ready } = useAuth();
  const isAdmin = isAdminRole(user?.vai_tro);
  const canAccessEntity = canManageEntity(user?.vai_tro, entityKey);
  const [rows, setRows] = useState([]);
  const [medicineImages, setMedicineImages] = useState([]);
  const [orderData, setOrderData] = useState(null);
  const [query, setQuery] = useState('');
  const [values, setValues] = useState({});
  const [fieldOptions, setFieldOptions] = useState({});
  const [activeSelectField, setActiveSelectField] = useState('');
  const [optionQuery, setOptionQuery] = useState('');
  const [pendingImage, setPendingImage] = useState(null);
  const [editing, setEditing] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      if (isExpandedOrderView) {
        const detailResource = isOrderDetailsView
          ? ORDER_DETAILS_RESOURCE
          : 'lich_su_theo_doi_don';
        const resources = [
          detailResource,
          'chi_tiet_don_dat',
          'don_dat_thuoc',
          'khach_hang',
          'thuoc',
          'khuyen_mai',
          'don_thuoc',
          'thanh_toan',
          'hoa_don',
          ...(isDeliveryHistoryView ? [] : ['lich_su_theo_doi_don']),
        ];
        const [details, orderLines, orders, customers, medicines, promotions, prescriptions, payments, invoices, history] =
          await Promise.all(resources.map((resource) => createCrudService(resource).getAll()));
        setRows(details);
        setOrderData({
          orderLines,
          orders,
          customers,
          medicines,
          promotions,
          prescriptions,
          payments,
          invoices,
          history: isDeliveryHistoryView ? details : history,
        });
      } else {
        const dataPromise = service.getAll();
        const imagesPromise = config.imageField ? imageService.getAll() : Promise.resolve([]);
        const relationResources = [...new Set(
          fields.filter((field) => field.type === 'relation').map((field) => field.source)
        )].filter((resource) => resource && resource !== config.resource);
        const [data, images, ...relatedRows] = await Promise.all([
          dataPromise,
          imagesPromise,
          ...relationResources.map((resource) => createCrudService(resource).getAll()),
        ]);
        setRows(Array.isArray(data) ? data : []);
        setMedicineImages(Array.isArray(images) ? images : []);
        const optionsByResource = Object.fromEntries(
          relationResources.map((resource, index) => [
            resource,
            Array.isArray(relatedRows[index]) ? relatedRows[index] : [],
          ])
        );
        if (fields.some((field) => field.type === 'relation' && field.source === config.resource)) {
          optionsByResource[config.resource] = Array.isArray(data) ? data : [];
        }
        setFieldOptions(optionsByResource);
        setOrderData(null);
      }
    } catch (requestError) {
      setError(requestError.message || 'Không thể tải dữ liệu.');
    } finally {
      setLoading(false);
    }
  }, [config.imageField, config.resource, entityKey, fields, imageService, isDeliveryHistoryView, isExpandedOrderView, isOrderDetailsView, service]);

  useEffect(() => {
    if (!ready) return;
    if (!canManageEntity(user?.vai_tro, entityKey)) {
      navigation.replace(getWorkspaceRoute(user?.vai_tro));
      return;
    }
    loadData();
  }, [entityKey, loadData, navigation, ready, user?.vai_tro]);

  const searchKeys = config.searchKeys || ['id'];
  const getMedicineImage = (medicineId) => medicineImages.find(
    (image) => String(image.id_thuoc) === String(medicineId) && Number(image.la_anh_chinh) === 1
  ) || medicineImages.find((image) => String(image.id_thuoc) === String(medicineId));
  const filtered = rows.filter((row) =>
    searchKeys.some((key) =>
      String(row[key] ?? '')
        .toLowerCase()
        .includes(query.toLowerCase())
    )
  );
  const searchText = query.trim().toLowerCase();
  const filteredOrders = (orderData?.orders || []).filter((order) => {
    const customer = orderData.customers.find(
      (item) => String(item.id) === String(order.id_khach_hang)
    );
    const orderItems = rows.filter((line) => String(line.id_don_dat) === String(order.id));
    const medicineNames = orderItems.map((line) =>
      orderData.medicines.find((item) => String(item.id) === String(line.id_thuoc))?.ten_thuoc || ''
    );
    return [
      order.id,
      order.trang_thai,
      order.ngay_dat,
      order.so_dien_thoai_nhan,
      order.dia_chi_giao_hang,
      customer?.ho_ten,
      customer?.so_dien_thoai,
      customer?.email,
      ...medicineNames,
    ].some((value) => String(value ?? '').toLowerCase().includes(searchText));
  });
  const filteredHistory = isDeliveryHistoryView ? rows.filter((event) => {
    const order = orderData?.orders.find(
      (item) => String(item.id) === String(event.id_don_dat)
    );
    const customer = orderData?.customers.find(
      (item) => String(item.id) === String(order?.id_khach_hang)
    );
    const orderItems = (orderData?.orderLines || []).filter(
      (line) => String(line.id_don_dat) === String(event.id_don_dat)
    );
    const medicineNames = orderItems.map((line) =>
      orderData?.medicines.find((item) => String(item.id) === String(line.id_thuoc))?.ten_thuoc || ''
    );
    return [
      event.id,
      event.id_don_dat,
      event.trang_thai_cap_nhat,
      event.thoi_gian_cap_nhat,
      event.ghi_chu,
      order?.trang_thai,
      order?.so_dien_thoai_nhan,
      order?.dia_chi_giao_hang,
      customer?.ho_ten,
      ...medicineNames,
    ].some((value) => String(value ?? '').toLowerCase().includes(searchText));
  }) : [];

  const openAdd = () => {
    setEditing(null);
    setPendingImage(null);
    setActiveSelectField('');
    setOptionQuery('');
    setValues(config.imageField ? { [config.imageField]: '' } : {});
    setModalVisible(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setPendingImage(null);
    setActiveSelectField('');
    setOptionQuery('');
    const medicineId = row.id_thuoc ?? row[recordIdField];
    const currentImage = getMedicineImage(medicineId);
    setValues({ ...row, ...(config.imageField ? { [config.imageField]: currentImage?.duong_dan_anh || '' } : {}) });
    setModalVisible(true);
  };

  const chooseImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.85,
      });
      if (result.canceled || !result.assets?.[0]) return;
      setPendingImage(result.assets[0]);
      setValues((current) => ({ ...current, [config.imageField]: '' }));
    } catch (pickerError) {
      Alert.alert('Không thể chọn ảnh', pickerError.message || 'Vui lòng thử lại.');
    }
  };

  const save = async () => {
    const missing = fields.find(
      (field) => field.required && !String(values[field.name] ?? '').trim()
    );
    if (missing) {
      Alert.alert('Thiếu thông tin', `Vui lòng nhập ${missing.label}.`);
      return;
    }

    setSaving(true);
    try {
      const payload = { ...values };
      fields.forEach((field) => {
        if (field.type === 'relation' && payload[field.name] !== '' && payload[field.name] != null) {
          const relationId = Number(payload[field.name]);
          if (!Number.isFinite(relationId)) {
            throw new Error(`${field.label} không hợp lệ. Vui lòng chọn lại.`);
          }
          payload[field.name] = relationId;
        } else if (field.type === 'select' && payload[field.name] != null) {
          const selectedOption = field.options?.find(
            (option) => String(option.value) === String(payload[field.name])
          );
          if (selectedOption) payload[field.name] = selectedOption.value;
        }
      });
      if (config.imageField) delete payload[config.imageField];
      let imageUrl = String(values[config.imageField] || '').trim();
      if (config.imageField && pendingImage) {
        const uploadedImage = await uploadMedicineImage(pendingImage);
        imageUrl = uploadedImage.url;
        setPendingImage(null);
        setValues((current) => ({ ...current, [config.imageField]: imageUrl }));
      }
      let savedRecord;
      if (editing) {
        await service.update(editing[recordIdField], payload);
        savedRecord = editing;
      } else {
        const createdRecord = await service.create(payload);
        savedRecord = {
          ...payload,
          ...createdRecord,
          [recordIdField]: createdRecord?.[recordIdField] ?? payload[recordIdField] ?? createdRecord?.id,
        };

        const getSelectOptions = (field) => {
          if (field.type === 'relation') {
            return (fieldOptions[field.source] || []).map((option) => ({
              value: option.id,
              label: field.optionLabel === 'id'
                ? `#${option.id}`
                : `#${option.id} · ${option[field.optionLabel] || 'Chưa có tên'}`,
            }));
          }
          return field.options || [];
        };

        const getSelectedOptionLabel = (field) => {
          const value = values[field.name];
          if (value == null || value === '') return '';
          const option = getSelectOptions(field).find(
            (item) => String(item.value) === String(value)
          );
          return option?.label || `Giá trị hiện tại: ${value}`;
        };
        setEditing(savedRecord);
      }
      if (config.imageField) {
        const medicineId = savedRecord?.id_thuoc ?? savedRecord?.id ?? payload.id_thuoc;
        if (imageUrl) {
          if (!medicineId) throw new Error('Không xác định được mã thuốc để lưu ảnh.');
          const existingImage = getMedicineImage(medicineId);
          const imagePayload = {
            id_thuoc: medicineId,
            duong_dan_anh: imageUrl,
            la_anh_chinh: 1,
            thu_tu: existingImage?.thu_tu ?? 1,
          };
          if (existingImage) {
            await imageService.update(existingImage.id, imagePayload);
          } else {
            await imageService.create(imagePayload);
          }
        } else if (editing) {
          const existingImage = getMedicineImage(medicineId);
          if (existingImage) await imageService.remove(existingImage.id);
        }
      }
      setModalVisible(false);
      setPendingImage(null);
      await loadData();
      Alert.alert(
        'Thành công',
        `${editing ? 'Cập nhật' : 'Thêm mới'} ${config.label} thành công.`
      );
    } catch (requestError) {
      Alert.alert('Không thể lưu', requestError.message || 'Lỗi lưu dữ liệu');
    } finally {
      setSaving(false);
    }
  };

  const openRow = (row) => {
    if (config.readOnly && !hasDetailScreen) return;
    if (entityKey === 'don_dat_thuoc') {
      return navigation.navigate('AdminOrderDetail', { id: row.id });
    }
    if (entityKey === 'phieu_nhap_thuoc') {
      return navigation.navigate('AdminReceiptDetail', { id: row.id });
    }
    if (entityKey === 'don_thuoc') {
      return navigation.navigate('AdminPrescriptionDetail', { id: row.id });
    }
    return openEdit(row);
  };

  const renderOrderOverview = ({ item: order }) => {
    const customer = orderData.customers.find(
      (item) => String(item.id) === String(order.id_khach_hang)
    );
    const orderItems = rows.filter((line) => String(line.id_don_dat) === String(order.id));
    const promotion = orderData.promotions.find(
      (item) => String(item.id) === String(order.id_khuyen_mai)
    );
    const prescription = orderData.prescriptions.find(
      (item) => String(item.id) === String(order.id_don_thuoc)
    );
    const payments = orderData.payments.filter(
      (item) => String(item.id_don_dat) === String(order.id)
    );
    const invoice = orderData.invoices.find(
      (item) => String(item.id_don_dat) === String(order.id)
    );
    const history = orderData.history
      .filter((item) => String(item.id_don_dat) === String(order.id))
      .sort((left, right) =>
        String(left.thoi_gian_cap_nhat || '').localeCompare(String(right.thoi_gian_cap_nhat || ''))
      );
    const statusMeta = getOrderStatusMeta(order.trang_thai);

    return (
      <View style={styles.orderCard}>
        <View style={styles.orderCardHeader}>
          <View>
            <Text style={styles.orderCardTitle}>Đơn hàng #{order.id}</Text>
            <Text style={styles.orderCardDate}>Ngày đặt: {order.ngay_dat || '—'}</Text>
          </View>
          <View style={[styles.orderStatusBadge, { backgroundColor: statusMeta.bg }]}>
            <Text style={[styles.orderStatusText, { color: statusMeta.color }]}>
              {statusMeta.label}
            </Text>
          </View>
        </View>

        <View style={styles.orderInfoGrid}>
          <View style={styles.orderInfoBlock}>
            <Text style={styles.orderSectionTitle}>Khách hàng</Text>
            <Text style={styles.orderInfoText}>{customer?.ho_ten || `Khách hàng #${order.id_khach_hang}`}</Text>
            <Text style={styles.orderInfoMuted}>SĐT: {customer?.so_dien_thoai || '—'}</Text>
            <Text style={styles.orderInfoMuted}>Email: {customer?.email || '—'}</Text>
          </View>
          <View style={styles.orderInfoBlock}>
            <Text style={styles.orderSectionTitle}>Giao hàng</Text>
            <Text style={styles.orderInfoText}>Người nhận: {customer?.ho_ten || '—'}</Text>
            <Text style={styles.orderInfoMuted}>SĐT nhận: {order.so_dien_thoai_nhan || '—'}</Text>
            <Text style={styles.orderInfoMuted}>Địa chỉ: {order.dia_chi_giao_hang || '—'}</Text>
          </View>
        </View>

        <Text style={styles.orderSectionTitle}>Sản phẩm ({orderItems.length})</Text>
        {orderItems.length ? orderItems.map((line, index) => {
          const medicine = orderData.medicines.find(
            (item) => String(item.id) === String(line.id_thuoc)
          );
          return (
            <View key={`${order.id}-${line.id_thuoc || index}`} style={styles.orderProductRow}>
              <View style={styles.orderProductCopy}>
                <Text style={styles.orderInfoText}>
                  {medicine?.ten_thuoc || `Thuốc #${line.id_thuoc}`}
                </Text>
                <Text style={styles.orderInfoMuted}>
                  {line.so_luong} {medicine?.don_vi_tinh || 'đơn vị'} × {formatPrice(line.don_gia)}
                </Text>
              </View>
              <Text style={styles.orderProductTotal}>
                {formatPrice(Number(line.so_luong || 0) * Number(line.don_gia || 0))}
              </Text>
            </View>
          );
        }) : (
          <Text style={styles.orderInfoMuted}>Đơn hàng chưa có chi tiết sản phẩm.</Text>
        )}

        <View style={styles.orderInfoGrid}>
          <View style={styles.orderInfoBlock}>
            <Text style={styles.orderSectionTitle}>Thanh toán</Text>
            {payments.length ? payments.map((payment, index) => (
              <View key={payment.id || index}>
                <Text style={styles.orderInfoText}>
                  {formatPaymentMethod(payment.phuong_thuc)} · {formatPaymentStatus(payment.trang_thai)}
                </Text>
                <Text style={styles.orderInfoMuted}>Số tiền: {formatPrice(payment.so_tien)}</Text>
                <Text style={styles.orderInfoMuted}>Mã giao dịch: {payment.ma_giao_dich || '—'}</Text>
                <Text style={styles.orderInfoMuted}>
                  Thời gian thanh toán: {payment.thoi_gian_thanh_toan || '—'}
                </Text>
              </View>
            )) : <Text style={styles.orderInfoMuted}>Chưa có giao dịch thanh toán.</Text>}
          </View>
          <View style={styles.orderInfoBlock}>
            <Text style={styles.orderSectionTitle}>Thông tin kèm theo</Text>
            <Text style={styles.orderInfoMuted}>
              Mã khuyến mãi: {promotion?.ma_code || (order.id_khuyen_mai ? `#${order.id_khuyen_mai}` : 'Không áp dụng')}
            </Text>
            <Text style={styles.orderInfoMuted}>
              Đơn thuốc: {order.id_don_thuoc
                ? (prescription ? `#${prescription.id} · ${prescription.trang_thai}` : `#${order.id_don_thuoc}`)
                : 'Không kèm đơn thuốc'}
            </Text>
            <Text style={styles.orderInfoMuted}>
              Xuất kho: {Number(order.da_xuat_kho) === 1 ? 'Đã xuất kho' : 'Chưa xuất kho'}
            </Text>
            <Text style={styles.orderInfoMuted}>
              Hóa đơn: {invoice?.so_hoa_don || 'Chưa lập'}
            </Text>
            {invoice ? (
              <>
                <Text style={styles.orderInfoMuted}>
                  Ngày lập hóa đơn: {invoice.ngay_xuat || invoice.ngay_lap || '—'}
                </Text>
                <Text style={styles.orderInfoMuted}>
                  Trước thuế: {formatPrice(invoice.tong_tien_truoc_thue)}
                </Text>
                <Text style={styles.orderInfoMuted}>VAT: {formatPrice(invoice.thue_vat || 0)}</Text>
                <Text style={styles.orderInfoMuted}>
                  Sau thuế: {formatPrice(invoice.tong_tien_sau_thue)}
                </Text>
              </>
            ) : null}
          </View>
        </View>

        <View style={styles.orderTotals}>
          <Text style={styles.orderTotalLine}>Tạm tính: {formatPrice(order.tong_tien)}</Text>
          <Text style={styles.orderDiscountLine}>
            Giảm giá{promotion?.ma_code ? ` (${promotion.ma_code})` : ''}: -{formatPrice(order.giam_gia || 0)}
          </Text>
          <Text style={styles.orderGrandTotal}>
            Thành tiền: {formatPrice(order.thanh_tien ?? order.tong_tien)}
          </Text>
        </View>

        <Text style={styles.orderSectionTitle}>Lịch sử trạng thái ({history.length})</Text>
        {history.length ? history.map((event, index) => (
          <Text key={event.id || index} style={styles.orderInfoMuted}>
            • {event.thoi_gian_cap_nhat || '—'} · {getOrderStatusMeta(event.trang_thai_cap_nhat).label}
            {event.ghi_chu ? ` — ${event.ghi_chu}` : ''}
          </Text>
        )) : <Text style={styles.orderInfoMuted}>Chưa có lịch sử cập nhật.</Text>}

        <TouchableOpacity
          style={styles.orderDetailButton}
          onPress={() => navigation.navigate('AdminOrderDetail', { id: order.id })}
        >
          <Text style={styles.orderDetailButtonText}>Mở trang xử lý đơn hàng ›</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderDeliveryHistory = ({ item: event }) => {
    const order = orderData.orders.find(
      (item) => String(item.id) === String(event.id_don_dat)
    );
    const customer = orderData.customers.find(
      (item) => String(item.id) === String(order?.id_khach_hang)
    );
    const orderItems = orderData.orderLines.filter(
      (line) => String(line.id_don_dat) === String(event.id_don_dat)
    );
    const payments = orderData.payments.filter(
      (item) => String(item.id_don_dat) === String(event.id_don_dat)
    );
    const promotion = orderData.promotions.find(
      (item) => String(item.id) === String(order?.id_khuyen_mai)
    );
    const statusMeta = getOrderStatusMeta(event.trang_thai_cap_nhat);
    const orderStatusMeta = getOrderStatusMeta(order?.trang_thai);

    return (
      <View style={styles.orderCard}>
        <View style={styles.orderCardHeader}>
          <View>
            <Text style={styles.orderCardTitle}>
              Đơn hàng #{event.id_don_dat} · Lần cập nhật #{event.id}
            </Text>
            <Text style={styles.orderCardDate}>
              Thời gian cập nhật: {event.thoi_gian_cap_nhat || '—'}
            </Text>
          </View>
          <View style={[styles.orderStatusBadge, { backgroundColor: statusMeta.bg }]}>
            <Text style={[styles.orderStatusText, { color: statusMeta.color }]}>
              {statusMeta.label}
            </Text>
          </View>
        </View>

        <View style={styles.orderInfoGrid}>
          <View style={styles.orderInfoBlock}>
            <Text style={styles.orderSectionTitle}>Khách hàng</Text>
            <Text style={styles.orderInfoText}>
              {customer?.ho_ten || `Khách hàng #${order?.id_khach_hang || '—'}`}
            </Text>
          </View>
        </View>

        <View style={styles.deliveryStatusRow}>
          <Text style={styles.orderSectionTitle}>Trạng thái đơn hiện tại</Text>
          <View style={[styles.orderStatusBadge, { backgroundColor: orderStatusMeta.bg }]}>
            <Text style={[styles.orderStatusText, { color: orderStatusMeta.color }]}>
              {orderStatusMeta.label}
            </Text>
          </View>
        </View>
        {event.ghi_chu ? (
          <View style={styles.deliveryNote}>
            <Text style={styles.orderSectionTitle}>Ghi chú cập nhật</Text>
            <Text style={styles.orderInfoText}>{event.ghi_chu}</Text>
          </View>
        ) : null}

        <Text style={styles.orderSectionTitle}>Sản phẩm trong đơn ({orderItems.length})</Text>
        {orderItems.length ? orderItems.map((line, index) => {
          const medicine = orderData.medicines.find(
            (item) => String(item.id) === String(line.id_thuoc)
          );
          return (
            <View key={`${event.id}-${line.id_thuoc || index}`} style={styles.orderProductRow}>
              <View style={styles.orderProductCopy}>
                <Text style={styles.orderInfoText}>
                  {medicine?.ten_thuoc || `Thuốc #${line.id_thuoc}`}
                </Text>
                <Text style={styles.orderInfoMuted}>
                  {line.so_luong} {medicine?.don_vi_tinh || 'đơn vị'} × {formatPrice(line.don_gia)}
                </Text>
              </View>
              <Text style={styles.orderProductTotal}>
                {formatPrice(Number(line.so_luong || 0) * Number(line.don_gia || 0))}
              </Text>
            </View>
          );
        }) : <Text style={styles.orderInfoMuted}>Không có dữ liệu sản phẩm cho đơn này.</Text>}

        <View style={styles.orderInfoGrid}>
          <View style={styles.orderInfoBlock}>
            <Text style={styles.orderSectionTitle}>Thanh toán</Text>
            {payments.length ? payments.map((payment, index) => (
              <View key={payment.id || index}>
                <Text style={styles.orderInfoText}>
                  {formatPaymentMethod(payment.phuong_thuc)} · {formatPaymentStatus(payment.trang_thai)}
                </Text>
                <Text style={styles.orderInfoMuted}>Số tiền: {formatPrice(payment.so_tien)}</Text>
                <Text style={styles.orderInfoMuted}>Mã giao dịch: {payment.ma_giao_dich || '—'}</Text>
              </View>
            )) : <Text style={styles.orderInfoMuted}>Chưa có thông tin thanh toán.</Text>}
          </View>
          <View style={styles.orderInfoBlock}>
            <Text style={styles.orderSectionTitle}>Tổng kết đơn</Text>
            <Text style={styles.orderInfoMuted}>Mã khuyến mãi: {promotion?.ma_code || 'Không áp dụng'}</Text>
            <Text style={styles.orderInfoMuted}>Tạm tính: {formatPrice(order?.tong_tien)}</Text>
            <Text style={styles.orderInfoMuted}>Giảm giá: -{formatPrice(order?.giam_gia || 0)}</Text>
            <Text style={styles.orderProductTotal}>
              Thành tiền: {formatPrice(order?.thanh_tien ?? order?.tong_tien)}
            </Text>
          </View>
        </View>

        {order ? (
          <TouchableOpacity
            style={styles.orderDetailButton}
            onPress={() => navigation.navigate('AdminOrderDetail', { id: order.id })}
          >
            <Text style={styles.orderDetailButtonText}>Mở chi tiết và xử lý đơn hàng ›</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    );
  };

  const removeRow = (row) => {
    Alert.alert(
      `Xóa ${config.label}`,
      `Bạn có chắc chắn muốn xóa bản ghi #${row.id || ''}?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              await service.remove(row.id);
              await loadData();
            } catch (err) {
              Alert.alert('Lỗi', err.message || 'Không thể xóa');
            }
          },
        },
      ]
    );
  };

  if (!ready || !canAccessEntity) {
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
        activeKey={entityKey}
        navigation={navigation}
        variant={isAdmin ? 'admin' : 'staff'}
      />
      <View style={styles.main}>
        <WorkspaceHeader
          label={isAdmin ? 'CỔNG QUẢN TRỊ' : 'KHU VỰC NHÂN VIÊN'}
          title={isAdmin ? 'Quản lý dữ liệu' : 'Quản lý kho & sản phẩm'}
          actions={[
            ...(isAdmin
              ? [{ label: 'Bảng quản trị', onPress: () => navigation.navigate('AdminDashboard') }]
              : [{ label: 'Bàn nhân viên', onPress: () => navigation.navigate('Staff') }]),
          ]}
        />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>‹ Danh mục quản trị</Text>
        </TouchableOpacity>
        <View style={styles.titleRow}>
          <View>
            <Text style={styles.title}>{config.title}</Text>
            <Text style={styles.subtitle}>
              {isOrderDetailsView
                ? `${orderData?.orders.length || 0} đơn hàng · ${rows.length} dòng sản phẩm`
                : isDeliveryHistoryView
                ? `${rows.length} lần cập nhật · ${new Set(rows.map((event) => event.id_don_dat)).size} đơn hàng`
                : `Bảng: ${config.resource} · ${rows.length} bản ghi`}
            </Text>
          </View>
          {config.readOnly ? null : (
            <TouchableOpacity style={styles.addButton} onPress={openAdd}>
              <Text style={styles.addText}>+ Thêm mới</Text>
            </TouchableOpacity>
          )}
        </View>
        {config.readOnly ? (
          <View style={styles.readOnlyNotice}>
            <Text style={styles.readOnlyText}>
              {isOrderDetailsView
                ? 'Thông tin tổng hợp gồm khách hàng, giao hàng, sản phẩm, thanh toán, khuyến mãi, hóa đơn và lịch sử trạng thái.'
                : isDeliveryHistoryView
                ? 'Mỗi lần cập nhật hiển thị cùng thông tin khách nhận, địa chỉ giao, sản phẩm, thanh toán và giá trị đơn hàng liên quan.'
                : 'Dữ liệu chỉ xem. Hãy cập nhật qua luồng nghiệp vụ tương ứng để giữ lịch sử và tính nhất quán.'}
            </Text>
          </View>
        ) : null}
      </View>

      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder={isExpandedOrderView
          ? isDeliveryHistoryView
            ? 'Tìm mã đơn, trạng thái, khách hàng, số điện thoại hoặc tên thuốc...'
            : 'Tìm mã đơn, khách hàng, số điện thoại hoặc tên thuốc...'
          : `Tìm kiếm ${config.label}...`}
        placeholderTextColor="#94a3b8"
        style={styles.search}
      />

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.error}>{error}</Text>
          <TouchableOpacity onPress={loadData}>
            <Text style={styles.retry}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      ) : loading ? (
        <ActivityIndicator style={styles.loader} size="large" color="#0d9488" />
      ) : (
        <FlatList
          data={isOrderDetailsView
            ? filteredOrders
            : isDeliveryHistoryView
            ? filteredHistory
            : filtered}
          keyExtractor={(item, index) => String(
            isExpandedOrderView
              ? item.id ?? `${item.id_don_dat}:${index}`
              : config.rowKey
              ? config.rowKey.map((key) => item[key] ?? '').join(':')
              : item[recordIdField] ?? index
          )}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={loadData} />}
          contentContainerStyle={styles.list}
          renderItem={isOrderDetailsView
            ? renderOrderOverview
            : isDeliveryHistoryView
            ? renderDeliveryHistory
            : ({ item }) => (
            <TouchableOpacity
              style={styles.row}
              onPress={() => openRow(item)}
              disabled={config.readOnly && !hasDetailScreen}
            >
              {config.imageField ? (
                getMedicineImage(item.id_thuoc ?? item[recordIdField])?.duong_dan_anh ? (
                  <Image
                    source={{ uri: resolveAssetUrl(getMedicineImage(item.id_thuoc ?? item[recordIdField]).duong_dan_anh) }}
                    style={styles.medicineThumbnail}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={[styles.medicineThumbnail, styles.imagePlaceholder]}>
                    <Text style={styles.imagePlaceholderText}>Chưa có ảnh</Text>
                  </View>
                )
              ) : null}
              <View style={styles.rowBody}>
                <Text style={styles.rowTitle}>
                  {item[config.columns[0]] || `#${item.id}`}
                </Text>
                {config.columns.slice(1).map((column) => (
                  <Text key={column} style={styles.rowMeta}>
                    <Text style={styles.metaLabel}>{column}:</Text>{' '}
                    {String(item[column] ?? '—')}
                  </Text>
                ))}
              </View>
              {config.readOnly && !hasDetailScreen ? null : (
                <View style={styles.rowActions}>
                  <TouchableOpacity style={styles.actionBtn} onPress={() => openRow(item)}>
                    <Text style={styles.edit}>
                      {hasDetailScreen ? 'Chi tiết' : 'Sửa'}
                    </Text>
                  </TouchableOpacity>
                  {config.readOnly ? null : (
                    <TouchableOpacity style={styles.actionBtn} onPress={() => removeRow(item)}>
                      <Text style={styles.delete}>Xóa</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Text style={styles.empty}>
              {isExpandedOrderView
                ? isDeliveryHistoryView
                  ? 'Không tìm thấy lịch sử giao hàng phù hợp.'
                  : 'Không tìm thấy đơn hàng phù hợp.'
                : `Chưa có dữ liệu ${config.label} nào.`}
            </Text>
          }
        />
      )}

      {/* Add / Edit Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => {
          setModalVisible(false);
          setActiveSelectField('');
        }}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>
              {editing ? `Sửa ${config.label} #${editing.id || ''}` : `Thêm ${config.label} mới`}
            </Text>
            <ScrollView style={styles.modalForm}>
              {fields.map((field) => (
                <View key={field.name} style={styles.fieldWrap}>
                  <Text style={styles.label}>
                    {field.label} {field.required ? <Text style={styles.required}>*</Text> : null}
                  </Text>
                  {field.type === 'select' || field.type === 'relation' ? (
                    <>
                      <TouchableOpacity
                        accessibilityRole="button"
                        style={[styles.input, styles.selectControl]}
                        onPress={() => {
                          setOptionQuery('');
                          setActiveSelectField((current) =>
                            current === field.name ? '' : field.name
                          );
                        }}
                      >
                        <Text style={getSelectedOptionLabel(field) ? styles.selectValue : styles.selectPlaceholder}>
                          {getSelectedOptionLabel(field) || `Chọn ${field.label.toLowerCase()}`}
                        </Text>
                        <Text style={styles.selectChevron}>
                          {activeSelectField === field.name ? '⌃' : '⌄'}
                        </Text>
                      </TouchableOpacity>
                      {activeSelectField === field.name ? (
                        <View style={styles.optionPanel}>
                          {getSelectOptions(field).length > 8 ? (
                            <TextInput
                              value={optionQuery}
                              onChangeText={setOptionQuery}
                              placeholder={`Tìm ${field.label.toLowerCase()}...`}
                              placeholderTextColor="#94a3b8"
                              style={styles.optionSearch}
                            />
                          ) : null}
                          <ScrollView
                            keyboardShouldPersistTaps="handled"
                            nestedScrollEnabled
                            style={styles.optionList}
                          >
                            {!field.required ? (
                              <TouchableOpacity
                                style={styles.optionRow}
                                onPress={() => {
                                  setValues((current) => ({ ...current, [field.name]: null }));
                                  setActiveSelectField('');
                                }}
                              >
                                <Text style={styles.optionText}>Không chọn</Text>
                                {values[field.name] == null || values[field.name] === '' ? (
                                  <Text style={styles.optionCheck}>✓</Text>
                                ) : null}
                              </TouchableOpacity>
                            ) : null}
                            {getSelectOptions(field)
                              .filter((option) =>
                                `${option.label} ${option.value}`.toLowerCase()
                                  .includes(optionQuery.trim().toLowerCase())
                              )
                              .map((option) => {
                                const selected = String(values[field.name] ?? '') === String(option.value);
                                return (
                                  <TouchableOpacity
                                    key={String(option.value)}
                                    style={[styles.optionRow, selected && styles.optionRowSelected]}
                                    onPress={() => {
                                      setValues((current) => ({
                                        ...current,
                                        [field.name]: option.value,
                                      }));
                                      setActiveSelectField('');
                                    }}
                                  >
                                    <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
                                      {option.label}
                                    </Text>
                                    {selected ? <Text style={styles.optionCheck}>✓</Text> : null}
                                  </TouchableOpacity>
                                );
                              })}
                            {getSelectOptions(field).filter((option) =>
                              `${option.label} ${option.value}`.toLowerCase()
                                .includes(optionQuery.trim().toLowerCase())
                            ).length === 0 ? (
                              <Text style={styles.optionEmpty}>Không tìm thấy lựa chọn phù hợp.</Text>
                            ) : null}
                          </ScrollView>
                        </View>
                      ) : null}
                    </>
                  ) : (
                    <TextInput
                      value={String(values[field.name] ?? '')}
                      onChangeText={(val) =>
                        {
                          if (field.type === 'imageUrl') setPendingImage(null);
                          setValues((current) => ({ ...current, [field.name]: val }));
                        }
                      }
                      placeholder={field.type === 'imageUrl' ? 'Hoặc nhập URL ảnh' : `Nhập ${field.label}`}
                      placeholderTextColor="#94a3b8"
                      keyboardType={field.keyboardType || 'default'}
                      multiline={field.multiline}
                      style={[styles.input, field.multiline && styles.multiline]}
                    />
                  )}
                  {field.type === 'imageUrl' ? (
                    <>
                      <View style={styles.imageFieldActions}>
                        <TouchableOpacity style={styles.imagePickerButton} onPress={chooseImage}>
                          <Text style={styles.imagePickerText}>Chọn ảnh từ máy</Text>
                        </TouchableOpacity>
                        {pendingImage || values[field.name] ? (
                          <TouchableOpacity
                            style={styles.clearImageButton}
                            onPress={() => {
                              setPendingImage(null);
                              setValues((current) => ({ ...current, [field.name]: '' }));
                            }}
                          >
                            <Text style={styles.clearImageText}>Xóa ảnh</Text>
                          </TouchableOpacity>
                        ) : null}
                      </View>
                      {pendingImage?.uri || values[field.name] ? (
                        <Image
                          source={{ uri: pendingImage?.uri || resolveAssetUrl(String(values[field.name])) }}
                          style={styles.imagePreview}
                          resizeMode="contain"
                        />
                      ) : null}
                    </>
                  ) : null}
                </View>
              ))}
            </ScrollView>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => {
                  setModalVisible(false);
                  setActiveSelectField('');
                }}
              >
                <Text style={styles.cancel}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.save} onPress={save} disabled={saving}>
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveText}>Lưu bản ghi</Text>
                )}
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
  header: { paddingHorizontal: 26, paddingTop: 22, paddingBottom: 14 },
  back: { color: '#0f766e', fontWeight: '700', marginBottom: 11 },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: { color: '#102a2a', fontSize: 26, fontWeight: '900' },
  subtitle: { color: '#718582', fontSize: 12, marginTop: 5 },
  readOnlyNotice: {
    backgroundColor: '#e9f5f2',
    borderRadius: 11,
    padding: 12,
    marginTop: 13,
    marginBottom: 2,
    borderWidth: 1,
    borderColor: '#d2eae4',
  },
  readOnlyText: { color: '#27645d', fontSize: 12, lineHeight: 18 },
  addButton: {
    backgroundColor: '#0f766e',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 11,
    shadowColor: '#0f766e',
    shadowOpacity: 0.15,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  addText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  search: {
    marginHorizontal: 26,
    marginBottom: 10,
    backgroundColor: '#fff',
    borderRadius: 11,
    borderWidth: 1,
    borderColor: '#dce8e5',
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#0f172a',
    fontSize: 14,
  },
  list: { paddingHorizontal: 26, paddingTop: 6, paddingBottom: 34 },
  row: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 9,
    borderWidth: 1,
    borderColor: '#e3ece9',
    shadowColor: '#163a36',
    shadowOpacity: 0.025,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
  rowBody: { flex: 1 },
  medicineThumbnail: { width: 56, height: 56, borderRadius: 6, marginRight: 12, flexShrink: 0 },
  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#edf4f2',
    padding: 4,
  },
  imagePlaceholderText: { color: '#64748b', fontSize: 9, fontWeight: '700', textAlign: 'center' },
  rowTitle: { color: '#183936', fontWeight: '800', fontSize: 15 },
  rowMeta: { color: '#536c69', fontSize: 12, marginTop: 4 },
  metaLabel: { color: '#829693', fontWeight: '700' },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e1ebe8',
    padding: 18,
    marginBottom: 14,
  },
  orderCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#edf2f0',
    marginBottom: 12,
  },
  orderCardTitle: { color: '#183936', fontSize: 16, fontWeight: '900' },
  orderCardDate: { color: '#718582', fontSize: 11, marginTop: 4 },
  orderStatusBadge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  orderStatusText: { fontSize: 11, fontWeight: '800' },
  deliveryStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  deliveryNote: {
    backgroundColor: '#fffbeb',
    borderLeftWidth: 3,
    borderLeftColor: '#f59e0b',
    padding: 10,
    marginBottom: 10,
  },
  orderInfoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  orderInfoBlock: {
    flex: 1,
    minWidth: 220,
    backgroundColor: '#f5f9f8',
    borderRadius: 10,
    padding: 11,
  },
  orderSectionTitle: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 6,
    marginTop: 4,
  },
  orderInfoText: { color: '#24413f', fontSize: 12, fontWeight: '700', marginBottom: 3 },
  orderInfoMuted: { color: '#6d827f', fontSize: 11, lineHeight: 17 },
  orderProductRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#edf2f0',
  },
  orderProductCopy: { flex: 1 },
  orderProductTotal: { color: '#0f172a', fontSize: 12, fontWeight: '800' },
  orderTotals: {
    alignItems: 'flex-end',
    paddingVertical: 10,
    marginTop: 8,
    marginBottom: 8,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  orderTotalLine: { color: '#475569', fontSize: 11, marginBottom: 3 },
  orderDiscountLine: { color: '#e11d48', fontSize: 11, marginBottom: 4 },
  orderGrandTotal: { color: '#0f172a', fontSize: 15, fontWeight: '900' },
  orderDetailButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#e9f5f2',
    borderRadius: 9,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 12,
  },
  orderDetailButtonText: { color: '#0f766e', fontSize: 12, fontWeight: '800' },
  rowActions: { justifyContent: 'center', gap: 6, paddingLeft: 10 },
  actionBtn: { paddingVertical: 4, paddingHorizontal: 8 },
  edit: { color: '#0f766e', fontWeight: '700', fontSize: 13 },
  delete: { color: '#e11d48', fontWeight: '700', fontSize: 13 },
  loader: { marginTop: 40 },
  empty: { textAlign: 'center', color: '#64748b', padding: 30 },
  errorBox: {
    margin: 18,
    backgroundColor: '#fee2e2',
    borderRadius: 12,
    padding: 14,
  },
  error: { color: '#b91c1c' },
  retry: { color: '#0f766e', fontWeight: '700', marginTop: 8 },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15,23,42,.5)',
  },
  modal: {
    maxHeight: '90%',
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 22,
  },
  modalTitle: { color: '#183936', fontSize: 21, fontWeight: '800', marginBottom: 14 },
  modalForm: { maxHeight: 420 },
  fieldWrap: { marginBottom: 12 },
  label: { color: '#385450', fontWeight: '700', fontSize: 13, marginBottom: 6 },
  required: { color: '#e11d48' },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#d4e1de',
    borderRadius: 11,
    padding: 12,
    color: '#0f172a',
    fontSize: 14,
  },
  selectControl: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  selectValue: { flex: 1, color: '#0f172a', fontSize: 14 },
  selectPlaceholder: { flex: 1, color: '#94a3b8', fontSize: 14 },
  selectChevron: { color: '#64748b', fontSize: 18, fontWeight: '800' },
  optionPanel: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  optionSearch: {
    paddingHorizontal: 11,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    color: '#0f172a',
    fontSize: 13,
  },
  optionList: { maxHeight: 190 },
  optionRow: {
    minHeight: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  optionRowSelected: { backgroundColor: '#ecfdf5' },
  optionText: { flex: 1, color: '#334155', fontSize: 13 },
  optionTextSelected: { color: '#047857', fontWeight: '800' },
  optionCheck: { color: '#059669', fontWeight: '900', marginLeft: 8 },
  optionEmpty: { padding: 12, color: '#64748b', fontSize: 12, textAlign: 'center' },
  imageFieldActions: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  imagePickerButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  imagePickerText: { color: '#1d4ed8', fontSize: 13, fontWeight: '700' },
  clearImageButton: { paddingHorizontal: 10, paddingVertical: 9 },
  clearImageText: { color: '#be123c', fontSize: 13, fontWeight: '700' },
  imagePreview: {
    width: '100%',
    height: 150,
    marginTop: 8,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
  },
  multiline: { minHeight: 70, textAlignVertical: 'top' },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 14,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  cancelBtn: { padding: 10 },
  cancel: { color: '#64748b', fontWeight: '700' },
  save: {
    backgroundColor: '#0f766e',
    borderRadius: 10,
    paddingHorizontal: 22,
    paddingVertical: 12,
  },
  saveText: { color: '#fff', fontWeight: '800', fontSize: 14 },
});

import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import AdminSidebar from '../components/AdminSidebar';
import WorkspaceHeader from '../components/WorkspaceHeader';
import { useAuth } from '../context/AuthContext';
import { createCrudService } from '../services/crudService';
import prescriptionRequestApi from '../services/prescriptionRequestService';
import { formatPrice, formatDate, getOrderStatusMeta } from '../data/mockData';
import {
  getWorkspaceRoute,
  isAdminRole,
  isPharmacistRole,
  isStaffRole,
} from '../utils/workspaceAccess';

export default function StaffScreen({ navigation, route }) {
  const { user, ready } = useAuth();
  const canAccessStaffWorkspace = ready
    && !isAdminRole(user?.vai_tro)
    && isStaffRole(user?.vai_tro);
  const [activeTab, setActiveTab] = useState(route.params?.tab || 'prescriptions');
  const [pendingPrescriptions, setPendingPrescriptions] = useState([]);
  const [prescriptionRequests, setPrescriptionRequests] = useState([]);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [lowStockMeds, setLowStockMeds] = useState([]);
  const [expiringLots, setExpiringLots] = useState([]);
  const [stockLots, setStockLots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      if (activeTab === 'prescriptions') {
        if (isPharmacistRole(user?.vai_tro)) {
          const [presList, requestQueue] = await Promise.all([
            createCrudService('don_thuoc').getAll(),
            prescriptionRequestApi.getQueue(user?.id),
          ]);
          setPendingPrescriptions(presList.filter((p) => p.trang_thai === 'cho_duyet'));
          setPrescriptionRequests(requestQueue);
        }
      } else if (activeTab === 'orders') {
        const orderList = await createCrudService('don_dat_thuoc').getAll();
        setPendingOrders(orderList.filter((o) => o.trang_thai === 'cho_xac_nhan'));
      } else {
        const [medList, expiringList, lotList] = await Promise.all([
          createCrudService('thuoc').getAll(),
          createCrudService('v_thuoc_sap_het_han').getAll(),
          createCrudService('v_ton_kho_theo_lo').getAll(),
        ]);
        setLowStockMeds(medList.filter((m) => Number(m.so_luong_ton || 0) < 30));
        setExpiringLots(expiringList);
        setStockLots(lotList);
      }
    } catch (e) {
      setLoadError(e.message || 'Không thể tải dữ liệu nghiệp vụ.');
    } finally {
      setLoading(false);
    }
  }, [activeTab, user?.id, user?.vai_tro]);

  useEffect(() => {
    if (!ready) return;
    if (
      isAdminRole(user?.vai_tro)
      || !isStaffRole(user?.vai_tro)
    ) {
      navigation.replace(getWorkspaceRoute(user?.vai_tro));
      return;
    }
  }, [navigation, ready, user?.vai_tro]);

  useEffect(() => {
    if (ready && isStaffRole(user?.vai_tro) && !isAdminRole(user?.vai_tro)) {
      loadData();
    }
  }, [activeTab, loadData, ready, user?.vai_tro]);

  useEffect(() => {
    const requestedTab = route.params?.tab;
    if (!requestedTab) return;
    if (requestedTab === 'prescriptions' && !isPharmacistRole(user?.vai_tro)) {
      setActiveTab('inventory');
      return;
    }
    setActiveTab(requestedTab);
  }, [route.params?.tab, user?.vai_tro]);

  useEffect(() => {
    if (activeTab === 'prescriptions' && !isPharmacistRole(user?.vai_tro)) {
      setActiveTab('inventory');
    }
  }, [activeTab, user?.vai_tro]);

  const quickApproveOrder = async (orderId) => {
    try {
      const orderService = createCrudService('don_dat_thuoc');
      await orderService.update(orderId, { trang_thai: 'da_xac_nhan' });
      await createCrudService('lich_su_theo_doi_don').create({
        id_don_dat: orderId,
        trang_thai_cap_nhat: 'da_xac_nhan',
        ghi_chu: 'Dược sĩ/Nhân viên đã xác nhận đơn hàng',
        thoi_gian_cap_nhat: new Date().toISOString().replace('T', ' ').slice(0, 19),
      });
      await loadData();
      Alert.alert('Thành công', 'Đã xác nhận đơn. Tồn kho được xuất theo lô FEFO.');
    } catch (e) {
      Alert.alert('Lỗi', e.message || 'Không thể cập nhật đơn hàng');
    }
  };

  if (!canAccessStaffWorkspace) {
    return (
      <View style={styles.container}>
        <ActivityIndicator style={styles.loader} size="large" color="#0d9488" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AdminSidebar activeKey={activeTab} navigation={navigation} variant="staff" />
      <View style={styles.main}>
      <WorkspaceHeader
        label="KHU VỰC NHÂN VIÊN & DƯỢC SĨ"
        title="Bàn làm việc nghiệp vụ"
        actions={[
          { label: 'Cửa hàng', onPress: () => navigation.navigate('Home') },
        ]}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadData} />}
      >
        <Text style={styles.kicker}>TỔNG QUAN CA LÀM</Text>
        <Text style={styles.title}>Công việc cần xử lý</Text>
        <Text style={styles.subtitle}>
          Xin chào, {user?.ten_dang_nhap || 'Dược sĩ'} ({user?.vai_tro || 'Dược sĩ phụ trách'})
        </Text>

        {loadError ? (
          <TouchableOpacity style={styles.errorBox} onPress={loadData}>
            <Text style={styles.errorText}>{loadError}</Text>
            <Text style={styles.errorAction}>Chạm để tải lại</Text>
          </TouchableOpacity>
        ) : null}

        {/* Quick KPI stats */}
        <View style={styles.kpiRow}>
          {activeTab === 'prescriptions' && isPharmacistRole(user?.vai_tro) ? (
            <View style={[styles.kpiCard, { borderLeftColor: '#0d9488' }]}>
              <Text style={styles.kpiVal}>{prescriptionRequests.length + pendingPrescriptions.length}</Text>
              <Text style={styles.kpiLabel}>Yêu cầu / toa cần xử lý</Text>
            </View>
          ) : activeTab === 'orders' ? (
            <View style={[styles.kpiCard, { borderLeftColor: '#0284c7' }]}>
              <Text style={styles.kpiVal}>{pendingOrders.length}</Text>
              <Text style={styles.kpiLabel}>Đơn chờ xác nhận</Text>
            </View>
          ) : (
            <>
              <View style={[styles.kpiCard, { borderLeftColor: '#f59e0b' }]}>
                <Text style={styles.kpiVal}>{lowStockMeds.length}</Text>
                <Text style={styles.kpiLabel}>Thuốc sắp hết hàng</Text>
              </View>
              <View style={[styles.kpiCard, { borderLeftColor: '#dc2626' }]}>
                <Text style={styles.kpiVal}>{expiringLots.length}</Text>
                <Text style={styles.kpiLabel}>Lô sắp hết hạn</Text>
              </View>
            </>
          )}
        </View>

        {loading ? (
          <ActivityIndicator style={styles.loader} size="large" color="#0d9488" />
        ) : activeTab === 'prescriptions' && isPharmacistRole(user?.vai_tro) ? (
          /* PRESCRIPTIONS TAB */
          <View style={styles.section}>
            <Text style={styles.subHeading}>Yêu cầu tư vấn kê toa mới</Text>
            {prescriptionRequests.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>Không có yêu cầu mới đang chờ tiếp nhận.</Text>
              </View>
            ) : (
              prescriptionRequests.map((item) => (
                <TouchableOpacity
                  key={item.id_yeu_cau}
                  style={styles.card}
                  onPress={() => navigation.navigate('PrescriptionRequestDetail', { id: item.id_yeu_cau })}
                >
                  <View style={styles.cardRow}>
                    <Text style={styles.cardTitle}>{item.ten_benh_khai} · #{item.id_yeu_cau}</Text>
                    <View style={styles.statusWait}>
                      <Text style={styles.statusWaitText}>Chờ tiếp nhận</Text>
                    </View>
                  </View>
                  <Text style={styles.cardText}>
                    Khách hàng: {item.khach_hang || 'Khách hàng'} · {item.so_dien_thoai || 'Chưa có SĐT'}
                  </Text>
                  <Text style={styles.cardText} numberOfLines={3}>{item.trieu_chung}</Text>
                  {item.di_ung_thuoc ? (
                    <Text style={styles.requestWarning}>Dị ứng: {item.di_ung_thuoc}</Text>
                  ) : null}
                  <Text style={styles.cardDate}>Gửi lúc: {formatDate(item.ngay_tao)}</Text>
                  <View style={styles.requestOpenButton}>
                    <Text style={styles.requestOpenText}>Xem hồ sơ & xử lý ›</Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
            <Text style={[styles.subHeading, styles.prescriptionQueueHeading]}>Toa thuốc chờ thẩm định</Text>
            {pendingPrescriptions.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>Không có toa thuốc nào chờ duyệt.</Text>
              </View>
            ) : (
              pendingPrescriptions.map((pres) => (
                <View key={pres.id} style={styles.card}>
                  <View style={styles.cardRow}>
                    <Text style={styles.cardTitle}>Toa thuốc #{pres.id}</Text>
                    <View style={styles.statusWait}>
                      <Text style={styles.statusWaitText}>Chờ duyệt</Text>
                    </View>
                  </View>
                  <Text style={styles.cardText}>
                    Bệnh nhân: Khách hàng #{pres.id_khach_hang} · Dược sĩ kê: #{pres.id_nhan_vien_ke_don || '—'}
                  </Text>
                  <Text style={styles.cardDate}>Ngày kê: {formatDate(pres.ngay_ke_don)}</Text>
                  <TouchableOpacity
                    style={styles.reviewBtn}
                    onPress={() =>
                      navigation.navigate('AdminPrescriptionDetail', { id: pres.id })
                    }
                  >
                    <Text style={styles.reviewBtnText}>Thẩm định & Duyệt toa này ›</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        ) : activeTab === 'orders' ? (
          /* ORDERS TAB */
          <View style={styles.section}>
            {pendingOrders.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>✅</Text>
                <Text style={styles.emptyText}>Tất cả đơn đặt hàng đều đã được xử lý.</Text>
              </View>
            ) : (
              pendingOrders.map((ord) => {
                const meta = getOrderStatusMeta(ord.trang_thai);
                return (
                  <View key={ord.id} style={styles.card}>
                    <View style={styles.cardRow}>
                      <Text style={styles.cardTitle}>Đơn hàng #{ord.id}</Text>
                      <View style={[styles.statusBadge, { backgroundColor: meta.bg }]}>
                        <Text style={[styles.statusBadgeText, { color: meta.color }]}>
                          {meta.label}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.cardText}>
                      Khách hàng: #{ord.id_khach_hang} · SĐT: {ord.so_dien_thoai_nhan || '—'}
                    </Text>
                    <Text style={styles.cardText}>Địa chỉ: {ord.dia_chi_giao_hang || '—'}</Text>
                    <Text style={styles.cardPrice}>
                      Tổng tiền: {formatPrice(ord.thanh_tien || ord.tong_tien)}
                    </Text>
                    <View style={styles.orderActions}>
                      <TouchableOpacity
                        style={styles.viewDetailBtn}
                        onPress={() => navigation.navigate('AdminOrderDetail', { id: ord.id })}
                      >
                        <Text style={styles.viewDetailText}>Xem chi tiết</Text>
                      </TouchableOpacity>
                      {ord.trang_thai === 'cho_xac_nhan' && (
                        <TouchableOpacity
                          style={styles.approveOrderBtn}
                          onPress={() => quickApproveOrder(ord.id)}
                        >
                          <Text style={styles.approveOrderText}>✓ Xác nhận giao hàng</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                );
              })
            )}
          </View>
        ) : (
          /* INVENTORY TAB */
          <View style={styles.section}>
            <Text style={styles.subHeading}>Thuốc tồn kho thấp cần nhập thêm</Text>
            {lowStockMeds.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>Không có thuốc nào dưới ngưỡng tồn kho.</Text>
              </View>
            ) : lowStockMeds.map((med) => (
              <View key={med.id} style={styles.medRow}>
                <View style={styles.medInfo}>
                  <Text style={styles.medName}>{med.ten_thuoc}</Text>
                  <Text style={styles.medMeta}>
                    Mã SKU: {med.ma_sku || 'N/A'} · Giá: {formatPrice(med.gia_ban)}
                  </Text>
                </View>
                <View style={styles.stockBadge}>
                  <Text style={styles.stockVal}>{med.so_luong_ton || 0}</Text>
                  <Text style={styles.stockUnit}>{med.don_vi_tinh || 'hộp'}</Text>
                </View>
              </View>
            ))}

            <View style={styles.inventorySectionHeader}>
              <Text style={styles.subHeading}>Lô đã hết hạn / sắp hết hạn</Text>
              <Text style={styles.inventoryCount}>{expiringLots.length} lô</Text>
            </View>
            {expiringLots.length === 0 ? (
              <Text style={styles.inventoryEmpty}>Chưa có lô thuốc trong diện cảnh báo.</Text>
            ) : expiringLots.slice(0, 5).map((lot) => (
              <View key={`${lot.id}-${lot.so_lo}-${lot.han_su_dung}`} style={styles.expiryRow}>
                <View style={styles.medInfo}>
                  <Text style={styles.medName}>{lot.ten_thuoc}</Text>
                  <Text style={styles.medMeta}>Lô {lot.so_lo || '—'} · HSD {formatDate(lot.han_su_dung)}</Text>
                </View>
                <View style={styles.stockBadge}>
                  <Text style={styles.stockVal}>{lot.so_luong_ton}</Text>
                  <Text style={styles.stockUnit}>còn</Text>
                </View>
              </View>
            ))}

            <View style={styles.inventorySectionHeader}>
              <Text style={styles.subHeading}>Tồn kho theo lô (FEFO)</Text>
              <Text style={styles.inventoryCount}>{stockLots.length} lô</Text>
            </View>
            {stockLots.slice(0, 4).map((lot, index) => (
              <View key={`${lot.id_thuoc}-${lot.so_lo}-${index}`} style={styles.lotRow}>
                <View style={styles.lotNumber}>
                  <Text style={styles.lotNumberText}>{index + 1}</Text>
                </View>
                <View style={styles.medInfo}>
                  <Text style={styles.medName}>{lot.ten_thuoc}</Text>
                  <Text style={styles.medMeta}>Lô {lot.so_lo || '—'} · HSD {formatDate(lot.han_su_dung)}</Text>
                </View>
                <Text style={styles.lotQuantity}>{lot.so_luong_ton}</Text>
              </View>
            ))}
            <View style={styles.inventoryNotice}>
              <Text style={styles.inventoryNoticeText}>
                Phiếu nhập, lô thuốc và tài khoản do Admin quản lý. Khi xác nhận đơn, hệ thống tự xuất kho theo FEFO.
              </Text>
            </View>
          </View>
        )}

      </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: 'row', backgroundColor: '#f4f7fb' },
  main: { flex: 1, minWidth: 0 },
  content: { padding: 18, paddingBottom: 40 },
  kicker: { color: '#2563eb', fontSize: 10, fontWeight: '900', letterSpacing: 0.8 },
  title: { color: '#0f172a', fontSize: 24, fontWeight: '900', marginTop: 4 },
  subtitle: { color: '#64748b', fontSize: 13, marginTop: 4, marginBottom: 16 },
  errorBox: { backgroundColor: '#fff1f2', borderRadius: 12, padding: 12, marginBottom: 12 },
  errorText: { color: '#be123c', fontSize: 12 },
  errorAction: { color: '#0f766e', fontWeight: '800', fontSize: 12, marginTop: 5 },
  kpiRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  kpiCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderLeftWidth: 3,
  },
  kpiVal: { color: '#0f172a', fontWeight: '800', fontSize: 18 },
  kpiLabel: { color: '#64748b', fontSize: 11, marginTop: 2 },
  section: { marginTop: 4 },
  loader: { marginTop: 40 },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyIcon: { fontSize: 40, marginBottom: 8 },
  emptyText: { color: '#64748b', fontSize: 14 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 10,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardTitle: { color: '#0f172a', fontWeight: '800', fontSize: 15 },
  statusWait: { backgroundColor: '#fef9c3', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusWaitText: { color: '#a16207', fontWeight: '800', fontSize: 11 },
  requestWarning: { color: '#b91c1c', fontSize: 12, fontWeight: '700', marginTop: 4 },
  requestOpenButton: { borderTopWidth: 1, borderTopColor: '#f1f5f9', marginTop: 10, paddingTop: 10 },
  requestOpenText: { color: '#0d9488', fontWeight: '800', fontSize: 12 },
  prescriptionQueueHeading: { marginTop: 22 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusBadgeText: { fontWeight: '800', fontSize: 11 },
  cardText: { color: '#475569', fontSize: 13, marginBottom: 3 },
  cardDate: { color: '#94a3b8', fontSize: 12, marginTop: 4 },
  cardPrice: { color: '#0d9488', fontWeight: '800', fontSize: 15, marginTop: 6 },
  reviewBtn: {
    backgroundColor: '#0d9488',
    borderRadius: 9,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  reviewBtnText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  orderActions: { flexDirection: 'row', gap: 10, marginTop: 10 },
  viewDetailBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingVertical: 9,
    alignItems: 'center',
  },
  viewDetailText: { color: '#475569', fontWeight: '700', fontSize: 12 },
  approveOrderBtn: {
    flex: 1,
    backgroundColor: '#0d9488',
    borderRadius: 8,
    paddingVertical: 9,
    alignItems: 'center',
  },
  approveOrderText: { color: '#fff', fontWeight: '800', fontSize: 12 },
  subHeading: { color: '#134e4a', fontWeight: '800', fontSize: 15, marginBottom: 10 },
  medRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 8,
  },
  medInfo: { flex: 1 },
  medName: { color: '#0f172a', fontWeight: '700', fontSize: 14 },
  medMeta: { color: '#64748b', fontSize: 12, marginTop: 2 },
  stockBadge: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
  },
  stockVal: { color: '#dc2626', fontWeight: '800', fontSize: 16 },
  stockUnit: { color: '#dc2626', fontSize: 10 },
  inventorySectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 18,
  },
  inventoryCount: { color: '#64748b', fontSize: 12, fontWeight: '700', marginBottom: 10 },
  inventoryEmpty: { color: '#64748b', fontSize: 12, marginBottom: 8 },
  expiryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fffbeb',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#fde68a',
    marginBottom: 8,
  },
  lotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 8,
  },
  lotNumber: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: '#ccfbf1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  lotNumberText: { color: '#0f766e', fontSize: 12, fontWeight: '800' },
  lotQuantity: { color: '#0f766e', fontSize: 14, fontWeight: '800', paddingLeft: 8 },
  inventoryNotice: {
    backgroundColor: '#eff6ff',
    borderColor: '#bfdbfe',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginTop: 14,
  },
  inventoryNoticeText: { color: '#1e40af', fontSize: 12, lineHeight: 18 },
});

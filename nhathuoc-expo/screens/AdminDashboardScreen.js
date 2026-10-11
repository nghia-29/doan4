import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import AdminSidebar from '../components/AdminSidebar';
import WorkspaceHeader from '../components/WorkspaceHeader';
import { useAuth } from '../context/AuthContext';
import { createCrudService } from '../services/crudService';
import { formatPrice } from '../data/mockData';
import { getWorkspaceRoute, isAdminRole } from '../utils/workspaceAccess';

const RANGE_OPTIONS = [7, 30, 90];
const ORDER_STATUSES = [
  { key: 'cho_xac_nhan', label: 'Chờ xác nhận', color: '#f59e0b' },
  { key: 'da_xac_nhan', label: 'Đã xác nhận', color: '#3b82f6' },
  { key: 'dang_chuan_bi', label: 'Đang chuẩn bị', color: '#8b5cf6' },
  { key: 'dang_giao', label: 'Đang giao', color: '#06b6d4' },
  { key: 'hoan_thanh', label: 'Hoàn thành', color: '#16a34a' },
  { key: 'da_huy', label: 'Đã hủy', color: '#ef4444' },
];

function buildOrderStatusSummary(orders) {
  const counts = new Map(ORDER_STATUSES.map((status) => [status.key, 0]));
  orders.forEach((order) => {
    const status = String(order.trang_thai || '');
    counts.set(status, (counts.get(status) || 0) + 1);
  });

  return ORDER_STATUSES.map((status) => ({
    ...status,
    value: counts.get(status.key) || 0,
  })).concat(
    [...counts.entries()]
      .filter(([key]) => !ORDER_STATUSES.some((status) => status.key === key))
      .map(([key, value]) => ({
        key,
        label: 'Trạng thái khác',
        color: '#94a3b8',
        value,
      }))
  );
}

function OrderStatusPieChart({ rows }) {
  const total = rows.reduce((sum, row) => sum + row.value, 0);
  let currentAngle = -90;
  const size = 132;
  const center = size / 2;
  const radius = 60;

  const slices = rows
    .filter((row) => row.value > 0)
    .map((row) => {
      const startAngle = currentAngle;
      const endAngle = startAngle + (row.value / total) * 360;
      currentAngle = endAngle;
      const startRadians = (startAngle * Math.PI) / 180;
      const endRadians = (endAngle * Math.PI) / 180;
      const startX = center + radius * Math.cos(startRadians);
      const startY = center + radius * Math.sin(startRadians);
      const endX = center + radius * Math.cos(endRadians);
      const endY = center + radius * Math.sin(endRadians);
      const largeArc = endAngle - startAngle > 180 ? 1 : 0;
      const isFullCircle = endAngle - startAngle >= 359.99;

      return {
        ...row,
        percentage: Math.round((row.value / total) * 100),
        path: isFullCircle
          ? `M ${center} ${center - radius} A ${radius} ${radius} 0 1 1 ${center} ${center + radius} A ${radius} ${radius} 0 1 1 ${center} ${center - radius} Z`
          : `M ${center} ${center} L ${startX} ${startY} A ${radius} ${radius} 0 ${largeArc} 1 ${endX} ${endY} Z`,
      };
    });

  return (
    <View style={styles.chartCard}>
      <View style={styles.chartHeader}>
        <Text style={styles.chartTitle}>Tỷ lệ đơn hàng theo trạng thái</Text>
        <Text style={styles.chartTotal}>{total.toLocaleString('vi-VN')} đơn</Text>
      </View>
      {total > 0 ? (
        <View style={styles.pieChartContent}>
          <Svg
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            accessibilityLabel={`Biểu đồ trạng thái của ${total} đơn hàng`}
          >
            {slices.map((slice) => (
              <Path key={slice.key} d={slice.path} fill={slice.color} />
            ))}
          </Svg>
          <View style={styles.pieLegend}>
            {slices.map((slice) => (
              <View key={slice.key} style={styles.pieLegendRow}>
                <View style={[styles.pieLegendSwatch, { backgroundColor: slice.color }]} />
                <Text style={styles.pieLegendLabel}>
                  {slice.label}: {slice.value} ({slice.percentage}%)
                </Text>
              </View>
            ))}
          </View>
        </View>
      ) : (
        <Text style={styles.emptyOverviewText}>Chưa có đơn hàng để thống kê.</Text>
      )}
    </View>
  );
}

function getDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatChartValue(value, isCurrency) {
  if (isCurrency) {
    if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)} tỷ`;
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)} tr`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(0)} k`;
  }
  return Math.round(value).toLocaleString('vi-VN');
}

function OverviewBarChart({ title, rows, valueKey, color, isCurrency = false }) {
  const maxValue = Math.max(1, ...rows.map((row) => Number(row[valueKey]) || 0));
  const total = rows.reduce((sum, row) => sum + (Number(row[valueKey]) || 0), 0);

  return (
    <View style={styles.chartCard}>
      <View style={styles.chartHeader}>
        <Text style={styles.chartTitle}>{title}</Text>
        <Text style={styles.chartTotal}>{formatChartValue(total, isCurrency)}</Text>
      </View>
      {rows.length ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.chartBars}>
            {rows.map((row) => {
              const value = Math.max(0, Number(row[valueKey]) || 0);
              const barHeight = value > 0 ? Math.max(3, (value / maxValue) * 46) : 2;
              return (
                <View
                  key={row.date}
                  style={styles.chartColumn}
                  accessibilityLabel={`${row.label}: ${formatChartValue(value, isCurrency)}`}
                >
                  <View style={styles.chartPlot}>
                    <View style={[styles.chartBar, { height: barHeight, backgroundColor: color }]} />
                  </View>
                  <Text style={styles.chartLabel}>{row.label}</Text>
                </View>
              );
            })}
          </View>
        </ScrollView>
      ) : (
        <Text style={styles.emptyOverviewText}>Chưa có dữ liệu trong khoảng thời gian này.</Text>
      )}
    </View>
  );
}

function buildOverviewRows(orders, orderLines, costByMedicine, rangeDays) {
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - (rangeDays - 1));
  start.setHours(0, 0, 0, 0);

  const buckets = {};
  const dayCursor = new Date(start);
  while (dayCursor <= now) {
    const key = getDateKey(dayCursor);
    buckets[key] = {
      date: key,
      sold: 0,
      revenue: 0,
      profit: 0,
      orders: 0,
    };
    dayCursor.setDate(dayCursor.getDate() + 1);
  }

  const lineMap = new Map();
  orderLines.forEach((line) => {
    const key = String(line.id_don_dat);
    if (!lineMap.has(key)) lineMap.set(key, []);
    lineMap.get(key).push(line);
  });

  orders.forEach((order) => {
    const orderDate = new Date(String(order.ngay_dat || order.ngay_dat_hang || '').replace(' ', 'T'));
    if (Number.isNaN(orderDate.getTime())) return;
    const dateKey = getDateKey(orderDate);
    if (!buckets[dateKey]) return;

    const orderLinesForOrder = lineMap.get(String(order.id)) || [];
    const sold = orderLinesForOrder.reduce((sum, line) => sum + Number(line.so_luong || 0), 0);
    const revenue = Number(order.thanh_tien || order.tong_tien || 0);
    const cost = orderLinesForOrder.reduce((sum, line) => {
      const unitCost = Number(costByMedicine.get(String(line.id_thuoc)) || 0);
      return sum + unitCost * Number(line.so_luong || 0);
    }, 0);

    buckets[dateKey].sold += sold;
    buckets[dateKey].revenue += revenue;
    buckets[dateKey].profit += revenue - cost;
    buckets[dateKey].orders += 1;
  });

  return Object.values(buckets)
    .map((item) => ({
      ...item,
      label: new Date(`${item.date}T00:00:00`).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
      }),
    }));
}

export default function AdminDashboardScreen({ navigation }) {
  const { user, ready } = useAuth();
  const [stats, setStats] = useState({
    thuocCount: 0,
    khachHangCount: 0,
    donDatCount: 0,
    tongDoanhThu: 0,
    phieuNhapCount: 0,
    bacSiCount: 0,
  });
  const [selectedRange, setSelectedRange] = useState(30);
  const [overviewRows, setOverviewRows] = useState([]);
  const [orderStatusSummary, setOrderStatusSummary] = useState([]);
  const [alerts, setAlerts] = useState({
    sapHetHan: [],
    lowStock: [],
    pendingOrders: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const canAccessDashboard = ready && isAdminRole(user?.vai_tro);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [thuocList, khachList, donList, phieuList, bacSiList, sapHetHanList, orderLines, stockEntries] =
        await Promise.all([
          createCrudService('thuoc').getAll(),
          createCrudService('khach_hang').getAll(),
          createCrudService('don_dat_thuoc').getAll(),
          createCrudService('phieu_nhap_thuoc').getAll(),
          createCrudService('bac_si').getAll(),
          createCrudService('v_thuoc_sap_het_han').getAll(),
          createCrudService('chi_tiet_don_dat').getAll(),
          createCrudService('chi_tiet_phieu_nhap').getAll(),
        ]);

      const revenue = donList.reduce(
        (sum, order) => sum + (
          order.trang_thai === 'hoan_thanh'
            ? Number(order.thanh_tien || order.tong_tien || 0)
            : 0
        ),
        0
      );
      const lowStock = thuocList.filter((item) => Number(item.so_luong_ton || 0) < 20);
      const pending = donList.filter((order) => order.trang_thai === 'cho_xac_nhan').length;
      const costByMedicine = new Map();
      stockEntries.forEach((entry) => {
        if (entry.id_thuoc && Number(entry.gia_nhap || 0) > 0) {
          costByMedicine.set(String(entry.id_thuoc), Number(entry.gia_nhap || 0));
        }
      });

      setStats({
        thuocCount: thuocList.length,
        khachHangCount: khachList.length,
        donDatCount: donList.length,
        tongDoanhThu: revenue,
        phieuNhapCount: phieuList.length,
        bacSiCount: bacSiList.length,
      });

      setAlerts({
        sapHetHan: sapHetHanList,
        lowStock,
        pendingOrders: pending,
      });
      setOrderStatusSummary(buildOrderStatusSummary(donList));
      setOverviewRows(buildOverviewRows(donList, orderLines, costByMedicine, selectedRange));
    } catch (e) {
      setError(e.message || 'Không thể tải số liệu quản trị.');
    } finally {
      setLoading(false);
    }
  }, [selectedRange]);

  useEffect(() => {
    if (!ready) return;
    if (!isAdminRole(user?.vai_tro)) {
      navigation.replace(getWorkspaceRoute(user?.vai_tro));
      return;
    }
    loadData();
  }, [loadData, navigation, ready, user?.vai_tro]);

  const overviewSummary = overviewRows.reduce(
    (sum, row) => ({
      sold: sum.sold + row.sold,
      revenue: sum.revenue + row.revenue,
      profit: sum.profit + row.profit,
      orders: sum.orders + row.orders,
    }),
    { sold: 0, revenue: 0, profit: 0, orders: 0 }
  );
  const activeOverviewRows = overviewRows.filter(
    (row) => row.orders > 0 || row.sold > 0 || row.revenue > 0 || row.profit > 0
  );

  if (!canAccessDashboard) {
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
      <AdminSidebar activeKey="dashboard" navigation={navigation} />
      <View style={styles.main}>
        <WorkspaceHeader
          label="CỔNG QUẢN TRỊ"
          title="Quản lý hệ thống"
          actions={[
            { label: 'Cửa hàng', onPress: () => navigation.navigate('Home') },
          ]}
        />

        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={loadData} />}
        >
        <View style={styles.topBar}>
          <View style={styles.userBadge}>
            <Text style={styles.userBadgeText}>
              {user?.ten_dang_nhap || 'Admin'} ({user?.vai_tro || 'quản trị'})
            </Text>
          </View>
        </View>

        <View style={styles.pageHeading}>
          <View style={styles.pageHeadingCopy}>
            <Text style={styles.kicker}>TRUNG TÂM QUẢN TRỊ</Text>
            <Text style={styles.title}>Bảng điều khiển</Text>
            <Text style={styles.subtitle}>
              Theo dõi doanh thu, sản phẩm bán ra và tình hình hoạt động của nhà thuốc.
            </Text>
          </View>
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveBadgeText}>Tổng quan</Text>
          </View>
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.overviewSection}>
          <View style={styles.overviewHeaderRow}>
            <Text style={styles.sectionTitle}>Bảng tổng quan bán hàng</Text>
            <View style={styles.rangeTabs}>
              {RANGE_OPTIONS.map((range) => (
                <TouchableOpacity
                  key={range}
                  style={[styles.rangeTab, selectedRange === range && styles.rangeTabActive]}
                  onPress={() => setSelectedRange(range)}
                >
                  <Text style={[styles.rangeTabText, selectedRange === range && styles.rangeTabTextActive]}>
                    {range} ngày
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.overviewSummaryRow}>
            <View style={styles.overviewMetric}>
              <Text style={styles.overviewMetricLabel}>Đã bán</Text>
              <Text style={styles.overviewMetricValue}>{overviewSummary.sold}</Text>
              <Text style={styles.overviewMetricHint}>sản phẩm</Text>
            </View>
            <View style={styles.overviewMetric}>
              <Text style={styles.overviewMetricLabel}>Doanh thu</Text>
              <Text style={[styles.overviewMetricValue, { color: '#16a34a' }]}>{formatPrice(overviewSummary.revenue)}</Text>
              <Text style={styles.overviewMetricHint}>tổng thu nhập</Text>
            </View>
            <View style={styles.overviewMetric}>
              <Text style={styles.overviewMetricLabel}>Lợi nhuận</Text>
              <Text style={[styles.overviewMetricValue, { color: '#f59e0b' }]}>{formatPrice(overviewSummary.profit)}</Text>
              <Text style={styles.overviewMetricHint}>sau chi phí</Text>
            </View>
          </View>

          <Text style={styles.chartSectionTitle}>Biểu đồ tổng quan</Text>
          <OverviewBarChart
            title="Doanh thu theo ngày"
            rows={overviewRows}
            valueKey="revenue"
            color="#2563eb"
            isCurrency
          />
          <OverviewBarChart
            title="Sản phẩm đã bán"
            rows={overviewRows}
            valueKey="sold"
            color="#0d9488"
          />
          <OverviewBarChart
            title="Đơn hàng theo ngày"
            rows={overviewRows}
            valueKey="orders"
            color="#f59e0b"
          />
          <OrderStatusPieChart rows={orderStatusSummary} />

          <View style={styles.overviewTable}>
            <View style={styles.overviewTableHead}>
              <Text style={[styles.overviewCell, styles.overviewCellHead, styles.overviewCellWide]}>Thời gian</Text>
              <Text style={[styles.overviewCell, styles.overviewCellHead]}>Bán</Text>
              <Text style={[styles.overviewCell, styles.overviewCellHead]}>Doanh thu</Text>
              <Text style={[styles.overviewCell, styles.overviewCellHead]}>Lợi nhuận</Text>
            </View>
            {activeOverviewRows.length ? activeOverviewRows.map((row) => (
              <View key={row.date} style={styles.overviewTableRow}>
                <Text style={[styles.overviewCell, styles.overviewCellWide]}>{row.label}</Text>
                <Text style={styles.overviewCell}>{row.sold}</Text>
                <Text style={styles.overviewCell}>{formatPrice(row.revenue)}</Text>
                <Text style={[styles.overviewCell, { color: row.profit >= 0 ? '#15803d' : '#b91c1c', fontWeight: '700' }]}>
                  {formatPrice(row.profit)}
                </Text>
              </View>
            )) : (
              <View style={styles.emptyOverviewRow}>
                <Text style={styles.emptyOverviewText}>Chưa có dữ liệu bán hàng trong khoảng thời gian này.</Text>
              </View>
            )}
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, styles.statTeal]}>
            <Text style={styles.statLabel}>Thuốc trong kho</Text>
            <Text style={[styles.statValue, { color: '#0f766e' }]}>{stats.thuocCount}</Text>
            <Text style={styles.statSub}>Sản phẩm niêm yết</Text>
          </View>
          <View style={[styles.statCard, styles.statBlue]}>
            <Text style={styles.statLabel}>Đơn đặt hàng</Text>
            <Text style={[styles.statValue, { color: '#256b8c' }]}>{stats.donDatCount}</Text>
            <Text style={styles.statSub}>{alerts.pendingOrders} đơn chờ duyệt</Text>
          </View>
          <View style={[styles.statCard, styles.statGreen]}>
            <Text style={styles.statLabel}>Doanh thu ghi nhận</Text>
            <Text style={[styles.statValue, { color: '#16a34a', fontSize: 18 }]}>
              {formatPrice(stats.tongDoanhThu)}
            </Text>
            <Text style={styles.statSub}>Từ đơn đã hoàn thành</Text>
          </View>
          <View style={[styles.statCard, styles.statAmber]}>
            <Text style={styles.statLabel}>Khách hàng & Dược sĩ</Text>
            <Text style={[styles.statValue, { color: '#ca8a04' }]}>
              {stats.khachHangCount + stats.bacSiCount}
            </Text>
            <Text style={styles.statSub}>{stats.khachHangCount} khách · {stats.bacSiCount} dược sĩ</Text>
          </View>
        </View>

        {/* Operational Alerts */}
        {(alerts.sapHetHan.length > 0 || alerts.lowStock.length > 0 || alerts.pendingOrders > 0) && (
          <View style={styles.alertBox}>
            <Text style={styles.alertHeader}>🔔 Cảnh báo vận hành cần chú ý</Text>
            {alerts.pendingOrders > 0 && (
              <TouchableOpacity
                style={styles.alertRow}
                onPress={() => navigation.navigate('AdminCrud', { entity: 'don_dat_thuoc' })}
              >
                <Text style={styles.alertItem}>
                  • Có <Text style={styles.bold}>{alerts.pendingOrders} đơn hàng mới</Text> đang chờ xác nhận.
                </Text>
                <Text style={styles.alertAction}>Xem ›</Text>
              </TouchableOpacity>
            )}
            {alerts.sapHetHan.length > 0 && (
              <TouchableOpacity
                style={styles.alertRow}
                onPress={() => navigation.navigate('AdminCrud', { entity: 'v_thuoc_sap_het_han' })}
              >
                <Text style={styles.alertItem}>
                  • Có <Text style={styles.bold}>{alerts.sapHetHan.length} thuốc sắp hết hạn</Text> trong vòng 60 ngày.
                </Text>
                <Text style={styles.alertAction}>Xem ›</Text>
              </TouchableOpacity>
            )}
            {alerts.lowStock.length > 0 && (
              <TouchableOpacity
                style={styles.alertRow}
                onPress={() => navigation.navigate('AdminCrud', { entity: 'thuoc' })}
              >
                <Text style={styles.alertItem}>
                  • Có <Text style={styles.bold}>{alerts.lowStock.length} mặt hàng sắp hết</Text> (tồn kho &lt; 20).
                </Text>
                <Text style={styles.alertAction}>Xem ›</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        </ScrollView>
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
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  backLink: { color: '#0f766e', fontWeight: '700', fontSize: 14 },
  pageHeading: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 14,
    marginBottom: 22,
  },
  pageHeadingCopy: { flex: 1 },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: '#e6f5f2',
    borderWidth: 1,
    borderColor: '#c3e8e1',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#0f9b80' },
  liveBadgeText: { color: '#0f766e', fontSize: 11, fontWeight: '800' },
  userBadge: {
    backgroundColor: '#e6f5f2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  userBadgeText: { color: '#0f766e', fontSize: 12, fontWeight: '700' },
  kicker: { color: '#0f766e', fontSize: 10, fontWeight: '900', letterSpacing: 1.1 },
  title: { color: '#102a2a', fontSize: 29, fontWeight: '900', marginTop: 6 },
  subtitle: { color: '#647b78', fontSize: 13, lineHeight: 20, marginTop: 5 },
  overviewSection: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e2ece9',
    marginBottom: 18,
    shadowColor: '#163a36',
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
  },
  overviewHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  rangeTabs: {
    flexDirection: 'row',
    gap: 4,
  },
  rangeTab: {
    backgroundColor: '#f6f9f8',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#e2ece9',
  },
  rangeTabActive: {
    backgroundColor: '#0f766e',
    borderColor: '#0f766e',
  },
  rangeTabText: {
    color: '#334155',
    fontSize: 10,
    fontWeight: '700',
  },
  rangeTabTextActive: {
    color: '#fff',
  },
  overviewSummaryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 9,
  },
  overviewMetric: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: '#f7faf9',
    borderRadius: 12,
    padding: 13,
    borderWidth: 1,
    borderColor: '#e6eeec',
  },
  overviewMetricLabel: {
    color: '#607875',
    fontSize: 10,
    fontWeight: '700',
  },
  overviewMetricValue: {
    color: '#0f172a',
    fontSize: 15,
    fontWeight: '800',
    marginTop: 3,
  },
  overviewMetricHint: {
    color: '#829693',
    fontSize: 9,
    marginTop: 1,
  },
  chartSectionTitle: {
    color: '#0f172a',
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 5,
  },
  chartCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e3ece9',
    backgroundColor: '#fff',
    padding: 10,
    marginBottom: 10,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  chartTitle: { color: '#294644', fontSize: 12, fontWeight: '800' },
  chartTotal: { color: '#64748b', fontSize: 10, fontWeight: '700' },
  chartBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    minHeight: 62,
    paddingTop: 2,
  },
  chartColumn: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  chartPlot: {
    height: 48,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
    borderBottomWidth: 1,
    borderBottomColor: '#dce8e5',
  },
  chartBar: {
    width: 12,
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
  },
  chartLabel: { color: '#64748b', fontSize: 7, marginTop: 2 },
  pieChartContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
    paddingVertical: 4,
  },
  pieLegend: {
    flex: 1,
    minWidth: 160,
    gap: 5,
  },
  pieLegendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pieLegendSwatch: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  pieLegendLabel: {
    color: '#475569',
    fontSize: 10,
    flexShrink: 1,
  },
  overviewTable: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e3ece9',
  },
  overviewTableHead: {
    flexDirection: 'row',
    backgroundColor: '#f1f6f4',
    borderBottomWidth: 1,
    borderBottomColor: '#e3ece9',
  },
  overviewTableRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#edf2f0',
  },
  overviewCell: {
    flex: 1,
    paddingHorizontal: 6,
    paddingVertical: 7,
    fontSize: 10,
    color: '#334155',
    textAlign: 'center',
  },
  overviewCellHead: {
    fontWeight: '800',
    color: '#24413f',
  },
  overviewCellWide: {
    flex: 1.4,
    textAlign: 'left',
  },
  emptyOverviewRow: {
    backgroundColor: '#fff',
    padding: 16,
  },
  emptyOverviewText: {
    color: '#64748b',
    fontSize: 12,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    flexGrow: 1,
    flexBasis: '22%',
    minWidth: 190,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 17,
    borderWidth: 1,
    borderColor: '#e3ece9',
    borderLeftWidth: 4,
    shadowColor: '#163a36',
    shadowOpacity: 0.035,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  statTeal: { borderLeftColor: '#0f9b80' },
  statBlue: { borderLeftColor: '#3b82a0' },
  statGreen: { borderLeftColor: '#55a879' },
  statAmber: { borderLeftColor: '#d3a63b' },
  statLabel: { color: '#607875', fontSize: 12, fontWeight: '700' },
  statValue: { fontSize: 22, fontWeight: '800', marginTop: 4 },
  statSub: { color: '#829693', fontSize: 11, marginTop: 5 },
  alertBox: {
    backgroundColor: '#fffbeb',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#fef08a',
    marginBottom: 18,
  },
  alertHeader: { color: '#92400e', fontWeight: '800', fontSize: 14, marginBottom: 8 },
  alertRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
  },
  alertItem: { color: '#78350f', fontSize: 13, flex: 1 },
  alertAction: { color: '#2563eb', fontWeight: '800', fontSize: 14, paddingLeft: 8 },
  bold: { fontWeight: '700' },
  sectionTitle: { color: '#193b38', fontSize: 17, fontWeight: '800', marginBottom: 10 },
  errorBox: {
    backgroundColor: '#fee2e2',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
  },
  errorText: { color: '#b91c1c', fontSize: 13 },
});

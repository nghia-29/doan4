import React, { useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../context/AuthContext';

const DEMO_ACCOUNTS = [
  { user: 'admin1', pass: '123456', role: 'admin', label: 'Quản trị viên' },
  { user: 'duocsi1', pass: '123456', role: 'duoc_si', label: 'Dược sĩ' },
  { user: 'nhanvien1', pass: '123456', role: 'nv_quan_ly', label: 'Quản lý kho' },
  { user: 'bacsi1', pass: '123456', role: 'bac_si', label: 'Bác sĩ' },
  { user: 'khachhang1', pass: '123456', role: 'khach_hang', label: 'Khách hàng' },
];

export default function LoginScreen({ navigation }) {
  const { user, login, logout } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const selectDemo = (demo) => {
    setUsername(demo.user);
    setPassword(demo.pass);
    setError('');
  };

  const submit = async () => {
    if (!username.trim()) {
      setError('Vui lòng nhập tên đăng nhập');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const loggedIn = await login(username.trim(), password);
      // Route by role
      const role = String(loggedIn.vai_tro || '').toLowerCase();
      if (['admin'].includes(role)) {
        navigation.navigate('AdminDashboard');
      } else if (['duoc_si', 'nv_quan_ly', 'nhan_vien'].includes(role)) {
        navigation.navigate('Staff');
      } else {
        navigation.navigate('Customer');
      }
    } catch (requestError) {
      setError(requestError.message || 'Đăng nhập không thành công');
    } finally {
      setLoading(false);
    }
  };

  if (user) {
    const role = String(user.vai_tro || '').toLowerCase();
    const isAdmin = role.includes('admin');
    const isStaff = ['duoc_si', 'nv_quan_ly', 'nhan_vien'].some((r) => role.includes(r));

    return (
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.kicker}>TÀI KHOẢN ĐANG ĐĂNG NHẬP</Text>
          <Text style={styles.title}>Xin chào, {user.ten_dang_nhap}</Text>
          <View style={styles.roleTag}>
            <Text style={styles.roleTagText}>Vai trò: {user.vai_tro || 'Khách hàng'}</Text>
          </View>

          {isAdmin && (
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => navigation.navigate('AdminDashboard')}
            >
              <Text style={styles.primaryBtnText}>Mở bảng Quản trị (Admin)</Text>
            </TouchableOpacity>
          )}

          {isStaff && (
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => navigation.navigate('Staff')}
            >
              <Text style={styles.primaryBtnText}>Mở khu vực Dược sĩ & Nhân viên</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: '#0d9488', marginTop: 10 }]}
            onPress={() => navigation.navigate('Customer')}
          >
            <Text style={styles.primaryBtnText}>Xem đơn hàng & Hồ sơ của tôi</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => navigation.navigate('Home')}
          >
            <Text style={styles.secondaryBtnText}>‹ Về trang chủ cửa hàng</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={async () => {
              await logout();
              navigation.navigate('Home');
            }}
          >
            <Text style={styles.logoutBtnText}>Đăng xuất</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.card}>
        <Text style={styles.kicker}>HỆ THỐNG NHÀ THUỐC TRỰC TUYẾN</Text>
        <Text style={styles.title}>Đăng nhập</Text>
        <Text style={styles.subtitle}>
          Đăng nhập để theo dõi đơn thuốc, lịch sử giao hàng và quản lý nhà thuốc.
        </Text>

        {/* Demo Fast Login Buttons */}
        <Text style={styles.demoTitle}>Tài khoản mẫu dùng thử (mật khẩu: 123456):</Text>
        <View style={styles.demoChipsRow}>
          {DEMO_ACCOUNTS.map((demo) => (
            <TouchableOpacity
              key={demo.user}
              style={[
                styles.demoChip,
                username === demo.user && styles.demoChipActive,
              ]}
              onPress={() => selectDemo(demo)}
            >
              <Text
                style={[
                  styles.demoChipText,
                  username === demo.user && styles.demoChipTextActive,
                ]}
              >
                {demo.user} ({demo.label})
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TextInput
          value={username}
          onChangeText={setUsername}
          placeholder="Tên đăng nhập"
          placeholderTextColor="#94a3b8"
          style={styles.input}
          autoCapitalize="none"
        />
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Mật khẩu"
          placeholderTextColor="#94a3b8"
          style={styles.input}
          secureTextEntry
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity style={styles.primaryBtn} onPress={submit} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryBtnText}>Đăng nhập ngay</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>‹ Quay lại cửa hàng</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0fdfa',
    padding: 20,
    justifyContent: 'center',
  },
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: '#f0fdfa',
    padding: 20,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 4,
  },
  kicker: { color: '#0d9488', fontSize: 11, fontWeight: '800', letterSpacing: 0.8 },
  title: { color: '#134e4a', fontSize: 28, fontWeight: '800', marginTop: 6 },
  subtitle: { color: '#64748b', fontSize: 13, lineHeight: 19, marginTop: 6, marginBottom: 18 },
  demoTitle: { color: '#475569', fontSize: 12, fontWeight: '700', marginBottom: 8 },
  demoChipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 16 },
  demoChip: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  demoChipActive: { backgroundColor: '#0d9488', borderColor: '#0d9488' },
  demoChipText: { color: '#475569', fontSize: 11, fontWeight: '600' },
  demoChipTextActive: { color: '#fff', fontWeight: '700' },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    padding: 13,
    marginBottom: 12,
    color: '#0f172a',
    fontSize: 14,
  },
  primaryBtn: {
    backgroundColor: '#0d9488',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginTop: 6,
  },
  primaryBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    padding: 13,
    alignItems: 'center',
    marginTop: 10,
  },
  secondaryBtnText: { color: '#475569', fontWeight: '700', fontSize: 14 },
  logoutBtn: {
    borderWidth: 1,
    borderColor: '#f43f5e',
    borderRadius: 12,
    padding: 13,
    alignItems: 'center',
    marginTop: 12,
  },
  logoutBtnText: { color: '#e11d48', fontWeight: '800', fontSize: 14 },
  roleTag: {
    backgroundColor: '#ccfbf1',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 6,
    marginBottom: 16,
  },
  roleTagText: { color: '#0f766e', fontWeight: '700', fontSize: 12 },
  error: { color: '#b91c1c', fontSize: 13, marginBottom: 10, textAlign: 'center' },
  backBtn: { marginTop: 18, alignItems: 'center' },
  backText: { color: '#0d9488', fontWeight: '700', fontSize: 14 },
});

import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { getWorkspaceRoute, isAdminRole, isStaffRole } from '../utils/workspaceAccess';

export default function LoginScreen({ navigation }) {
  const { user, login, logout } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!username.trim()) {
      setError('Vui lòng nhập tên đăng nhập');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const loggedIn = await login(username.trim(), password);
      navigation.reset({
        index: 0,
        routes: [{ name: getWorkspaceRoute(loggedIn.vai_tro) }],
      });
    } catch (requestError) {
      setError(requestError.message || 'Đăng nhập không thành công');
    } finally {
      setLoading(false);
    }
  };

  if (user) {
    const role = String(user.vai_tro || '').toLowerCase();
    const isAdmin = isAdminRole(role);
    const isStaff = isStaffRole(role);

    return (
      <View style={styles.container}>
        <View style={styles.card}>
          <View style={styles.brandBadge}>
            <Text style={styles.brandBadgeText}>AT</Text>
          </View>
          <Text style={styles.kicker}>TÀI KHOẢN ĐANG ĐĂNG NHẬP</Text>
          <Text style={styles.title}>Xin chào, {user.ten_dang_nhap}</Text>
          <View style={styles.roleTag}>
            <Text style={styles.roleTagText}>Vai trò: {user.vai_tro || 'Khách hàng'}</Text>
          </View>

          {isAdmin && (
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => navigation.navigate('AdminDashboard')}
              activeOpacity={0.9}
            >
              <Text style={styles.primaryBtnText}>Mở bảng Quản trị (Admin)</Text>
            </TouchableOpacity>
          )}

          {isStaff && (
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => navigation.navigate('Staff')}
              activeOpacity={0.9}
            >
              <Text style={styles.primaryBtnText}>Mở khu vực Dược sĩ & Nhân viên</Text>
            </TouchableOpacity>
          )}

          {!isAdmin && !isStaff && (
            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: '#0d9488', marginTop: 10 }]}
              onPress={() => navigation.navigate('Customer')}
              activeOpacity={0.9}
            >
              <Text style={styles.primaryBtnText}>Xem đơn hàng & Hồ sơ của tôi</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => navigation.navigate('Home')}
            activeOpacity={0.9}
          >
            <Text style={styles.secondaryBtnText}>‹ Về trang chủ cửa hàng</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={async () => {
              await logout();
              navigation.navigate('Home');
            }}
            activeOpacity={0.9}
          >
            <Text style={styles.logoutBtnText}>Đăng xuất</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.keyboardAvoiding}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 30 : 0}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.topGlow} />
        <View style={styles.heroBadge}>
          <Text style={styles.heroBadgeText}>💊 An Tâm Pharmacy</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.brandWrap}>
            <View style={styles.brandMark}>
              <Text style={styles.brandMarkText}>AT</Text>
            </View>
            <Text style={styles.brandTitle}>Chào mừng bạn trở lại</Text>
          </View>

          <Text style={styles.kicker}>HỆ THỐNG NHÀ THUỐC TRỰC TUYẾN</Text>
          <Text style={styles.title}>Đăng nhập</Text>
          <Text style={styles.subtitle}>
            Đăng nhập để theo dõi đơn thuốc, lịch sử giao hàng và quản lý nhà thuốc.
          </Text>

          <View style={styles.featureRow}>
            {['Tư vấn 24/7', 'Giao hàng nhanh', 'An tâm'].map((label) => (
              <View key={label} style={styles.featurePill}>
                <Text style={styles.featureText}>{label}</Text>
              </View>
            ))}
          </View>

          <TextInput
            value={username}
            onChangeText={setUsername}
            placeholder="Tên đăng nhập"
            placeholderTextColor="#94a3b8"
            style={styles.input}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <View style={styles.passwordWrap}>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Mật khẩu"
              placeholderTextColor="#94a3b8"
              style={styles.passwordInput}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="password"
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowPassword((prev) => !prev)}
              accessibilityLabel={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              activeOpacity={0.7}
            >
              <Text style={styles.eyeText}>{showPassword ? '🙈' : '👁️'}</Text>
            </TouchableOpacity>
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity style={styles.primaryBtn} onPress={submit} disabled={loading} activeOpacity={0.9}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryBtnText}>Đăng nhập ngay</Text>
            )}
          </TouchableOpacity>

          <View style={styles.registerPrompt}>
            <Text style={styles.registerPromptText}>Chưa có tài khoản?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')} activeOpacity={0.8}>
              <Text style={styles.registerLink}> Đăng ký ngay</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.8}>
            <Text style={styles.backText}>‹ Quay lại cửa hàng</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardAvoiding: {
    flex: 1,
    backgroundColor: '#ecfdf5',
  },
  container: {
    flex: 1,
    backgroundColor: '#ecfdf5',
    padding: 20,
    justifyContent: 'center',
  },
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 18,
    paddingTop: 26,
    paddingBottom: 32,
    justifyContent: 'center',
  },
  topGlow: {
    position: 'absolute',
    top: -60,
    left: 30,
    right: 30,
    height: 220,
    backgroundColor: '#d1fae5',
    borderRadius: 120,
    opacity: 0.7,
  },
  heroBadge: {
    alignSelf: 'center',
    backgroundColor: '#d1fae5',
    borderColor: '#a7f3d0',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 8,
    marginBottom: 16,
    zIndex: 1,
  },
  heroBadgeText: {
    color: '#065f46',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 28,
    padding: 22,
    borderWidth: 1,
    borderColor: '#d1fae5',
    shadowColor: '#14532d',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.1,
    shadowRadius: 18,
    elevation: 8,
    zIndex: 1,
  },
  brandWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  brandMark: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#0f766e',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    shadowColor: '#0f766e',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 5,
  },
  brandMarkText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
  },
  brandTitle: {
    color: '#0f172a',
    fontSize: 17,
    fontWeight: '800',
  },
  kicker: { color: '#0d9488', fontSize: 11, fontWeight: '800', letterSpacing: 0.8 },
  title: { color: '#134e4a', fontSize: 32, fontWeight: '800', marginTop: 8 },
  subtitle: { color: '#64748b', fontSize: 13, lineHeight: 20, marginTop: 6, marginBottom: 16 },
  featureRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
    gap: 8,
  },
  featurePill: {
    backgroundColor: '#f0fdf4',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  featureText: {
    color: '#166534',
    fontSize: 11,
    fontWeight: '700',
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#d9e6ef',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 12,
    color: '#0f172a',
    fontSize: 15,
  },
  passwordWrap: {
    position: 'relative',
    marginBottom: 12,
  },
  passwordInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#d9e6ef',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    paddingRight: 48,
    color: '#0f172a',
    fontSize: 15,
  },
  eyeButton: {
    position: 'absolute',
    right: 12,
    top: 12,
    padding: 4,
  },
  eyeText: {
    fontSize: 20,
  },
  primaryBtn: {
    backgroundColor: '#0f766e',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#0f766e',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 5,
  },
  primaryBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 12,
  },
  secondaryBtnText: { color: '#475569', fontWeight: '700', fontSize: 14 },
  logoutBtn: {
    borderWidth: 1,
    borderColor: '#f43f5e',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 14,
  },
  logoutBtnText: { color: '#e11d48', fontWeight: '800', fontSize: 14 },
  roleTag: {
    backgroundColor: '#ccfbf1',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    alignSelf: 'flex-start',
    marginTop: 8,
    marginBottom: 18,
  },
  roleTagText: { color: '#0f766e', fontWeight: '700', fontSize: 12 },
  error: { color: '#b91c1c', fontSize: 13, marginBottom: 10, textAlign: 'center' },
  registerPrompt: { flexDirection: 'row', justifyContent: 'center', marginTop: 16, alignItems: 'center' },
  registerPromptText: { color: '#64748b', fontSize: 13 },
  registerLink: { color: '#0d9488', fontSize: 13, fontWeight: '900' },
  backBtn: { marginTop: 20, alignItems: 'center' },
  backText: { color: '#0d9488', fontWeight: '700', fontSize: 14 },
});

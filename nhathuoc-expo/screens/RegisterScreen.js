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
import { register as registerAccount } from '../services/authService';
import { mockCreate, mockGetAll, mockRemove } from '../services/mockStorage';

export default function RegisterScreen({ navigation }) {
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    const normalizedUsername = username.trim();
    const normalizedEmail = email.trim();
    const normalizedPhone = phone.trim();
    const normalizedName = fullName.trim();

    if (!normalizedName || !normalizedUsername || !password) {
      setError('Vui lòng điền họ tên, tên đăng nhập và mật khẩu.');
      return;
    }
    if (!/^[a-zA-Z0-9_.-]{3,50}$/.test(normalizedUsername)) {
      setError('Tên đăng nhập cần từ 3–50 ký tự: chữ không dấu, số, dấu chấm, gạch ngang hoặc gạch dưới.');
      return;
    }
    if (password.length < 8) {
      setError('Mật khẩu cần có ít nhất 8 ký tự.');
      return;
    }
    if (password !== passwordConfirmation) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }
    if (normalizedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError('Địa chỉ email chưa đúng định dạng.');
      return;
    }
    if (normalizedPhone && !/^[0-9+().\-\s]{8,15}$/.test(normalizedPhone)) {
      setError('Số điện thoại chưa đúng định dạng.');
      return;
    }

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      try {
        await registerAccount({
          fullName: normalizedName,
          username: normalizedUsername,
          password,
          phone: normalizedPhone,
          email: normalizedEmail,
        });
      } catch (requestError) {
        if (!requestError.networkUnavailable || !__DEV__) throw requestError;
        const [accounts, roles] = await Promise.all([
          mockGetAll('tai_khoan'),
          mockGetAll('vai_tro'),
        ]);
        if (accounts.some(
          (account) => String(account.ten_dang_nhap || '').toLowerCase() === normalizedUsername.toLowerCase()
        )) {
          throw new Error('Tên đăng nhập đã được sử dụng.');
        }
        const customerRole = roles.find(
          (role) => String(role.ten_vai_tro || '').toLowerCase() === 'khach_hang'
        );
        if (!customerRole) throw new Error('Không tìm thấy vai trò khách hàng trong hệ thống.');

        const createdAccount = await mockCreate('tai_khoan', {
          ten_dang_nhap: normalizedUsername,
          mat_khau: password,
          id_vai_tro: customerRole.id,
          trang_thai: 1,
        });
        try {
          await mockCreate('khach_hang', {
            id_tai_khoan: createdAccount.id,
            ho_ten: normalizedName,
            so_dien_thoai: normalizedPhone || null,
            email: normalizedEmail || null,
          });
        } catch (profileError) {
          try {
            await mockRemove('tai_khoan', createdAccount.id);
          } catch (rollbackError) {
            throw new Error(
              `Không thể tạo hồ sơ khách hàng (${profileError.message}); đồng thời không thể thu hồi tài khoản vừa tạo (${rollbackError.message}).`
            );
          }
          throw new Error(`Không thể tạo hồ sơ khách hàng. Tài khoản đã được thu hồi. ${profileError.message}`);
        }
      }

      setSuccess('Tạo tài khoản thành công. Bạn có thể đăng nhập ngay.');
      setTimeout(() => navigation.replace('Login'), 1200);
    } catch (requestError) {
      setError(requestError.message || 'Không thể tạo tài khoản.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.brandBlock}>
          <View style={styles.logo}><Text style={styles.logoText}>NT</Text></View>
          <Text style={styles.brandName}>NHÀ THUỐC AN TÂM</Text>
          <Text style={styles.brandSubtitle}>Chăm sóc đúng cách, an tâm mỗi ngày</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.eyebrow}>TẠO HỒ SƠ KHÁCH HÀNG</Text>
          <Text style={styles.title}>Đăng ký tài khoản</Text>
          <Text style={styles.subtitle}>Đăng ký để đặt thuốc và theo dõi đơn hàng của bạn.</Text>

          <Text style={styles.label}>Họ và tên *</Text>
          <TextInput
            value={fullName}
            onChangeText={setFullName}
            placeholder="Nguyễn Văn An"
            placeholderTextColor="#94a3b8"
            style={styles.input}
            autoComplete="name"
          />
          <Text style={styles.label}>Tên đăng nhập *</Text>
          <TextInput
            value={username}
            onChangeText={setUsername}
            placeholder="ten.dang.nhap"
            placeholderTextColor="#94a3b8"
            style={styles.input}
            autoCapitalize="none"
            autoComplete="username"
          />
          <Text style={styles.label}>Số điện thoại</Text>
          <TextInput
            value={phone}
            onChangeText={setPhone}
            placeholder="09xx xxx xxx"
            placeholderTextColor="#94a3b8"
            style={styles.input}
            keyboardType="phone-pad"
          />
          <Text style={styles.label}>Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="ban@email.com"
            placeholderTextColor="#94a3b8"
            style={styles.input}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
          <Text style={styles.label}>Mật khẩu *</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Ít nhất 8 ký tự"
            placeholderTextColor="#94a3b8"
            style={styles.input}
            secureTextEntry
            autoComplete="new-password"
          />
          <Text style={styles.label}>Nhập lại mật khẩu *</Text>
          <TextInput
            value={passwordConfirmation}
            onChangeText={setPasswordConfirmation}
            placeholder="Nhập lại mật khẩu"
            placeholderTextColor="#94a3b8"
            style={styles.input}
            secureTextEntry
            autoComplete="new-password"
            onSubmitEditing={submit}
          />

          {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
          {success ? <Text accessibilityRole="status" style={styles.success}>{success}</Text> : null}

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.disabledButton]}
            onPress={submit}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.submitText}>Tạo tài khoản</Text>}
          </TouchableOpacity>

          <View style={styles.loginPrompt}>
            <Text style={styles.promptText}>Đã có tài khoản?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.link}> Đăng nhập</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate('Home')}>
          <Text style={styles.backText}>‹ Quay lại cửa hàng</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#ecfdf5' },
  scroll: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  brandBlock: { alignItems: 'center', marginBottom: 20 },
  logo: {
    width: 54, height: 54, borderRadius: 17, backgroundColor: '#0d9488',
    alignItems: 'center', justifyContent: 'center', marginBottom: 10,
  },
  logoText: { color: '#fff', fontSize: 20, fontWeight: '900' },
  brandName: { color: '#134e4a', fontSize: 13, fontWeight: '900', letterSpacing: 1.2 },
  brandSubtitle: { color: '#64748b', fontSize: 12, marginTop: 4 },
  card: {
    width: '100%', maxWidth: 520, backgroundColor: '#fff', padding: 24,
    borderRadius: 20, borderWidth: 1, borderColor: '#dbeafe',
    shadowColor: '#0f172a', shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.08, shadowRadius: 16, elevation: 3,
  },
  eyebrow: { color: '#0d9488', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  title: { color: '#134e4a', fontSize: 26, fontWeight: '900', marginTop: 6 },
  subtitle: { color: '#64748b', fontSize: 13, lineHeight: 19, marginTop: 5, marginBottom: 18 },
  label: { color: '#334155', fontSize: 12, fontWeight: '800', marginBottom: 5 },
  input: {
    backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#cbd5e1',
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 11,
    color: '#0f172a', fontSize: 14, marginBottom: 12,
  },
  submitButton: {
    backgroundColor: '#0d9488', borderRadius: 11, paddingVertical: 14,
    alignItems: 'center', marginTop: 4,
  },
  disabledButton: { opacity: 0.65 },
  submitText: { color: '#fff', fontSize: 15, fontWeight: '900' },
  error: { color: '#b91c1c', fontSize: 12, lineHeight: 18, marginBottom: 10 },
  success: { color: '#047857', fontSize: 12, lineHeight: 18, marginBottom: 10 },
  loginPrompt: { flexDirection: 'row', justifyContent: 'center', marginTop: 18 },
  promptText: { color: '#64748b', fontSize: 13 },
  link: { color: '#0d9488', fontWeight: '900', fontSize: 13 },
  backButton: { padding: 16 },
  backText: { color: '#0f766e', fontWeight: '800', fontSize: 13 },
});

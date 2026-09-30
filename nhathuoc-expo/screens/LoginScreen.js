import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen({ navigation }) {
  const { user, login, logout } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) {
    const canOpenAdmin = ['admin', 'nv_quan_ly', 'duoc_si', 'nhan_vien'].some((role) => user.vai_tro.includes(role));
    return <View style={styles.container}><Text style={styles.kicker}>TÀI KHOẢN</Text><Text style={styles.title}>Xin chào, {user.ten_dang_nhap}</Text><Text style={styles.role}>Vai trò: {user.vai_tro || 'khách hàng'}</Text>{canOpenAdmin && <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('AdminDashboard')}><Text style={styles.buttonText}>Mở trang quản trị</Text></TouchableOpacity>}<TouchableOpacity style={[styles.button, canOpenAdmin && styles.secondaryButton]} onPress={async () => { await logout(); navigation.navigate('Home'); }}><Text style={[styles.buttonText, canOpenAdmin && styles.secondaryButtonText]}>Đăng xuất</Text></TouchableOpacity></View>;
  }

  const submit = async () => {
    setError('');
    setLoading(true);
    try { await login(username.trim(), password); navigation.goBack(); } catch (requestError) { setError(requestError.message); } finally { setLoading(false); }
  };

  return <View style={styles.container}><Text style={styles.kicker}>TÀI KHOẢN AN TÂM</Text><Text style={styles.title}>Đăng nhập</Text><Text style={styles.subtitle}>Đăng nhập để lưu đơn hàng và theo dõi giao hàng.</Text><TextInput value={username} onChangeText={setUsername} placeholder="Tên đăng nhập" placeholderTextColor="#94a3b8" style={styles.input} autoCapitalize="none" /><TextInput value={password} onChangeText={setPassword} placeholder="Mật khẩu" placeholderTextColor="#94a3b8" style={styles.input} secureTextEntry /><TouchableOpacity style={styles.button} onPress={submit} disabled={loading}>{loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Đăng nhập</Text>}</TouchableOpacity>{error ? <Text style={styles.error}>{error}</Text> : null}<TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.back}>Quay lại cửa hàng</Text></TouchableOpacity></View>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f9ff', padding: 24, justifyContent: 'center' },
  kicker: { color: '#2cb67d', fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  title: { color: '#0f172a', fontSize: 32, fontWeight: '800', marginTop: 7 },
  subtitle: { color: '#64748b', lineHeight: 21, marginTop: 9, marginBottom: 24 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#dfeaf7', borderRadius: 13, padding: 14, marginBottom: 12, color: '#0f172a' },
  button: { backgroundColor: '#1d9bf0', borderRadius: 13, padding: 15, alignItems: 'center', marginTop: 6 },
  buttonText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  error: { color: '#be123c', marginTop: 14, textAlign: 'center' },
  role: { color: '#475569', marginTop: 12 },
  back: { color: '#1d9bf0', fontWeight: '700', textAlign: 'center', marginTop: 20 },
});

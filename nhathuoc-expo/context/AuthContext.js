import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import taiKhoanService from '../services/taiKhoanService';
import vaiTroService from '../services/vaiTroService';

const STORAGE_KEY = 'nhathuoc_session';
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => saved && setUser(JSON.parse(saved)))
      .catch(() => {});
  }, []);

  const login = async (username, password) => {
    const [accounts, roles] = await Promise.all([
      taiKhoanService.getAll(),
      vaiTroService.getAll().catch(() => []),
    ]);
    const account = accounts.find((item) => {
      const accountName = item.ten_dang_nhap || item.username || item.tai_khoan;
      const accountPassword = item.mat_khau || item.password;
      return String(accountName).toLowerCase() === String(username).toLowerCase()
        && String(accountPassword) === String(password);
    });

    if (!account) throw new Error('Sai tên đăng nhập hoặc mật khẩu.');
    if (Number(account.trang_thai) === 0 || String(account.trang_thai).toUpperCase() === 'KHOA') {
      throw new Error('Tài khoản của bạn đã bị khóa.');
    }

    const role = roles.find((item) => String(item.id) === String(account.id_vai_tro));
    const session = {
      id: account.id,
      ten_dang_nhap: account.ten_dang_nhap || username,
      vai_tro: String(role?.ten_vai_tro || account.vai_tro || '').toLowerCase(),
    };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    setUser(session);
    return session;
  };

  const logout = async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    setUser(null);
  };

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth phải được dùng bên trong AuthProvider');
  return context;
}

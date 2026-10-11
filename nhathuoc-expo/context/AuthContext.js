import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { login as authenticate } from '../services/authService';
import { getAccessToken, setAccessToken } from '../services/authToken';
import { mockGetAll } from '../services/mockStorage';

const STORAGE_KEY = 'nhathuoc_session';
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    Promise.all([AsyncStorage.getItem(STORAGE_KEY), getAccessToken()])
      .then(async ([saved, accessToken]) => {
        if (!saved) return;
        const session = JSON.parse(saved);
        if (
          (__DEV__ && session.authMode === 'offline')
          || (session.authMode === 'api' && accessToken && session.expiresAt > Date.now())
        ) {
          setUser(session);
          return;
        }
        await AsyncStorage.removeItem(STORAGE_KEY);
        await setAccessToken(null);
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  const login = async (username, password) => {
    let session;
    let accessToken = null;
    try {
      const result = await authenticate(username, password);
      session = { ...result.user, authMode: 'api', expiresAt: result.expiresAt };
      accessToken = result.token;
    } catch (error) {
      if (!error.networkUnavailable || !__DEV__) throw error;
      const [accounts, roles] = await Promise.all([
        mockGetAll('tai_khoan'),
        mockGetAll('vai_tro'),
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
      session = {
        id: account.id,
        ten_dang_nhap: account.ten_dang_nhap || username,
        vai_tro: String(role?.ten_vai_tro || account.vai_tro || '').toLowerCase(),
        authMode: 'offline',
      };
    }
    await setAccessToken(accessToken);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    setUser(session);
    return session;
  };

  const logout = async () => {
    await setAccessToken(null);
    await AsyncStorage.removeItem(STORAGE_KEY);
    setUser(null);
  };

  return <AuthContext.Provider value={{ user, ready, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth phải được dùng bên trong AuthProvider');
  return context;
}

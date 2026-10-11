import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { getWorkspaceRoute } from '../utils/workspaceAccess';

export default function StoreHeader({
  cartCount = 0,
  onCartPress,
  onAccountPress,
  preferAccountRoute = true,
}) {
  const navigation = useNavigation();
  const { user } = useAuth();
  const openAccount = () => {
    if (user && preferAccountRoute) {
      const route = getWorkspaceRoute(user.vai_tro);
      navigation.navigate(
        route,
        route === 'Customer' ? { tab: 'profile' } : undefined
      );
      return;
    }
    onAccountPress?.();
  };

  return (
    <View style={styles.header}>
      <View style={styles.brandWrap}>
        <View style={styles.logoBox}>
          <Text style={styles.logoText}>NT</Text>
        </View>
        <View>
          <Text style={styles.brandTitle}>Nhà Thuốc</Text>
          <Text style={styles.brandSub}>An Tâm</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={openAccount}
          aria-label={user ? 'Tài khoản của tôi' : 'Đăng nhập'}
        >
          <Text style={styles.cartText}>👤</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cartButton} onPress={onCartPress} aria-label="Giỏ hàng">
          <Text style={styles.cartText}>🛒</Text>
          {cartCount > 0 && <Text style={styles.cartCount}>{cartCount}</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 10,
    backgroundColor: '#f0fdf4',
    borderBottomWidth: 1,
    borderBottomColor: '#d1fae5',
  },
  brandWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoBox: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#0f766e',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    shadowColor: '#0f766e',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 2,
  },
  logoText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 17,
  },
  brandTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#134e4a',
  },
  brandSub: {
    fontSize: 12,
    color: '#0d9488',
    fontWeight: '700',
  },
  cartButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#d1fae5',
    shadowColor: '#14532d',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#d1fae5',
    shadowColor: '#14532d',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  cartText: {
    fontSize: 18,
  },
  cartCount: {
    position: 'absolute',
    top: -5,
    right: -5,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#e11d48',
    color: '#fff',
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '800',
    paddingTop: 1,
  },
});

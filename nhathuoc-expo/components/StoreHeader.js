import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function StoreHeader({ cartCount = 0, onCartPress, onAccountPress }) {
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
        <TouchableOpacity style={styles.iconButton} onPress={onAccountPress} aria-label="Tài khoản">
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
    paddingBottom: 8,
  },
  brandWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#0d9488',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
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
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#cbd5e1',
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

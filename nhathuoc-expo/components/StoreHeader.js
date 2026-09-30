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
        <TouchableOpacity style={styles.iconButton} onPress={onAccountPress}>
          <Text style={styles.cartText}>👤</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cartButton} onPress={onCartPress}>
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
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 8,
  },
  brandWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#1d9bf0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  logoText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 18,
  },
  brandTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  brandSub: {
    fontSize: 12,
    color: '#2cb67d',
    fontWeight: '600',
  },
  cartButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#dfeaf7',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#dfeaf7',
  },
  cartText: {
    fontSize: 20,
  },
  cartCount: {
    position: 'absolute',
    top: -5,
    right: -5,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#ef476f',
    color: '#fff',
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '800',
    paddingTop: 2,
  },
});

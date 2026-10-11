import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { formatPrice } from '../data/mockData';
import { resolveAssetUrl } from '../services/apiClient';

export default function ProductCard({ item, onAddToCart, onViewDetails }) {
  const isPrescription = item.badge === 'Kê đơn';
  const outOfStock = typeof item.stock === 'number' && item.stock <= 0;

  return (
    <View style={styles.productCard}>
      <TouchableOpacity style={styles.imageWrap} onPress={() => onViewDetails?.(item)}>
        {item.image ? (
          <Image source={{ uri: resolveAssetUrl(item.image) }} style={styles.productImage} resizeMode="cover" />
        ) : (
          <Text style={styles.imagePlaceholder}>💊</Text>
        )}
        <View style={[styles.badge, isPrescription ? styles.badgePrescription : styles.badgeOTC]}>
          <Text style={[styles.badgeText, isPrescription ? styles.badgeTextPrescription : styles.badgeTextOTC]}>
            {item.badge}
          </Text>
        </View>
      </TouchableOpacity>

      <Text style={styles.productCategory}>{item.category}</Text>
      <TouchableOpacity onPress={() => onViewDetails?.(item)}>
        <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
      </TouchableOpacity>

      <View style={styles.metaRow}>
        <Text style={styles.productPrice}>{formatPrice(item.price)}</Text>
        {typeof item.stock === 'number' && (
          <Text style={[styles.stockText, item.stock > 0 ? styles.stockAvailable : styles.stockEmpty]}>
            {item.stock > 0 ? `Còn ${item.stock}` : 'Hết hàng'}
          </Text>
        )}
      </View>

      <TouchableOpacity
        style={[styles.buyButton, outOfStock && styles.buyButtonDisabled]}
        onPress={() => onAddToCart?.(item)}
        disabled={outOfStock}
      >
        <Text style={styles.buyButtonText}>
          {outOfStock ? 'Tạm hết hàng' : '+ Thêm vào giỏ'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  productCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  imageWrap: {
    position: 'relative',
    height: 160,
    backgroundColor: '#f8fafc',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    flex: 1,
    textAlign: 'center',
    textAlignVertical: 'center',
    fontSize: 44,
  },
  badge: {
    position: 'absolute',
    left: 8,
    top: 8,
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  badgeOTC: { backgroundColor: '#dcfce7' },
  badgePrescription: { backgroundColor: '#fee2e2' },
  badgeText: { fontSize: 10, fontWeight: '800' },
  badgeTextOTC: { color: '#15803d' },
  badgeTextPrescription: { color: '#b91c1c' },
  productCategory: {
    paddingHorizontal: 12,
    marginTop: 10,
    color: '#0d9488',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  productName: {
    paddingHorizontal: 12,
    marginTop: 3,
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 18,
    minHeight: 36,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    marginTop: 6,
  },
  productPrice: {
    color: '#0d9488',
    fontSize: 16,
    fontWeight: '800',
  },
  stockText: {
    fontSize: 10,
    fontWeight: '700',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 999,
  },
  stockAvailable: {
    backgroundColor: '#ecfdf5',
    color: '#15803d',
  },
  stockEmpty: {
    backgroundColor: '#fef2f2',
    color: '#b91c1c',
  },
  buyButton: {
    marginHorizontal: 10,
    marginTop: 10,
    marginBottom: 10,
    borderRadius: 10,
    backgroundColor: '#0d9488',
    paddingVertical: 9,
    alignItems: 'center',
  },
  buyButtonDisabled: { backgroundColor: '#94a3b8' },
  buyButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
});

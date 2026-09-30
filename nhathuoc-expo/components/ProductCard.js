import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { formatPrice } from '../data/mockData';

export default function ProductCard({ item, onAddToCart, onViewDetails }) {
  const isPrescription = item.badge === 'Kê đơn';

  return (
    <View style={styles.productCard}>
      <TouchableOpacity style={styles.imageWrap} onPress={() => onViewDetails?.(item)}>
        {item.image ? (
          <Image source={{ uri: item.image }} style={styles.productImage} resizeMode="cover" />
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
      <Text style={styles.productPrice}>{formatPrice(item.price)}</Text>

      <TouchableOpacity style={styles.buyButton} onPress={() => onAddToCart?.(item)}>
        <Text style={styles.buyButtonText}>+ Thêm vào giỏ</Text>
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
  productPrice: {
    paddingHorizontal: 12,
    marginTop: 6,
    color: '#0d9488',
    fontSize: 16,
    fontWeight: '800',
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
  buyButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
});

import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { formatPrice } from '../data/mockData';

export default function ProductCard({ item, onAddToCart, onViewDetails }) {
  return (
    <View style={styles.productCard}>
      <View style={styles.imageWrap}>
        {item.image ? (
          <Image source={{ uri: item.image }} style={styles.productImage} resizeMode="cover" />
        ) : (
          <Text style={styles.imagePlaceholder}>💊</Text>
        )}
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{item.badge}</Text>
        </View>
      </View>

      <Text style={styles.productCategory}>{item.category}</Text>
      <TouchableOpacity onPress={() => onViewDetails?.(item)}>
        <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
      </TouchableOpacity>
      <Text style={styles.productPrice}>{formatPrice(item.price)}</Text>

      <TouchableOpacity style={styles.buyButton} onPress={() => onAddToCart?.(item)}>
        <Text style={styles.buyButtonText}>Mua ngay</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  productCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e8edf6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  imageWrap: {
    position: 'relative',
    height: 180,
    backgroundColor: '#ebf2ff',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    flex: 1,
    textAlign: 'center',
    textAlignVertical: 'center',
    fontSize: 48,
  },
  badge: {
    position: 'absolute',
    left: 10,
    top: 10,
    backgroundColor: '#e4f8f2',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeText: {
    color: '#0f766e',
    fontSize: 10,
    fontWeight: '700',
  },
  productCategory: {
    paddingHorizontal: 12,
    marginTop: 12,
    color: '#2cb67d',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  productName: {
    paddingHorizontal: 12,
    marginTop: 4,
    color: '#0f172a',
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
  },
  productPrice: {
    paddingHorizontal: 12,
    marginTop: 8,
    color: '#1d9bf0',
    fontSize: 18,
    fontWeight: '800',
  },
  buyButton: {
    marginHorizontal: 12,
    marginTop: 12,
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: '#1d9bf0',
    paddingVertical: 10,
    alignItems: 'center',
  },
  buyButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
});

import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native';

export default function CategoryChips({ categories, selectedCategory, onSelect }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll} contentContainerStyle={styles.categoryList}>
      {categories.map((item) => (
        <TouchableOpacity
          key={item}
          activeOpacity={0.8}
          onPress={() => onSelect(item)}
          style={[styles.categoryChip, selectedCategory === item && styles.categoryChipActive]}
        >
          <Text style={[styles.categoryText, selectedCategory === item && styles.categoryTextActive]}>{item}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  categoryScroll: {
    marginTop: 16,
    paddingLeft: 20,
  },
  categoryList: {
    paddingRight: 20,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#dfeaf7',
    marginRight: 10,
  },
  categoryChipActive: {
    backgroundColor: '#1d9bf0',
    borderColor: '#1d9bf0',
  },
  categoryText: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '600',
  },
  categoryTextActive: {
    color: '#fff',
  },
});

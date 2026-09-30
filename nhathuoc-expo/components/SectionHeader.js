import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function SectionHeader({ kicker, title, alignLeft = true }) {
  return (
    <View style={[styles.sectionHeader, !alignLeft && styles.centered]}>
      <Text style={styles.sectionKicker}>{kicker}</Text>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    paddingHorizontal: 20,
    marginTop: 30,
  },
  centered: {
    alignItems: 'center',
  },
  sectionKicker: {
    color: '#2cb67d',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  sectionTitle: {
    color: '#0f172a',
    fontSize: 26,
    fontWeight: '800',
    marginTop: 6,
  },
});

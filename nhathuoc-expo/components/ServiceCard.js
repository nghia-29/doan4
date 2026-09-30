import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function ServiceCard({ item }) {
  return (
    <View style={styles.serviceCard}>
      <Text style={styles.serviceIcon}>{item.icon}</Text>
      <View style={styles.serviceContent}>
        <Text style={styles.serviceTitle}>{item.title}</Text>
        <Text style={styles.serviceCaption}>{item.caption}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e8edf6',
    marginTop: 12,
  },
  serviceIcon: {
    fontSize: 26,
    marginRight: 12,
  },
  serviceContent: {
    flex: 1,
  },
  serviceTitle: {
    color: '#0f172a',
    fontWeight: '800',
    fontSize: 16,
  },
  serviceCaption: {
    marginTop: 4,
    color: '#475569',
    fontSize: 13,
    lineHeight: 18,
  },
});

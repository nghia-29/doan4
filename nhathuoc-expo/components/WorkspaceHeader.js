import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function WorkspaceHeader({ label, title, actions = [] }) {
  return (
    <View style={styles.header}>
      <View style={styles.heading}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.title}>{title}</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.actions}
      >
        {actions.map((action) => (
          <TouchableOpacity
            key={action.label}
            style={[styles.action, action.primary && styles.primaryAction]}
            onPress={action.onPress}
          >
            <Text style={[styles.actionText, action.primary && styles.primaryActionText]}>
              {action.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingVertical: 11,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#e5eceb',
  },
  heading: { flex: 1, minWidth: 0 },
  label: { color: '#0f766e', fontWeight: '800', fontSize: 10, letterSpacing: 0.9 },
  title: { color: '#102a2a', fontWeight: '800', fontSize: 16, marginTop: 3 },
  actions: { alignItems: 'center', gap: 8, paddingLeft: 12 },
  action: {
    backgroundColor: '#f7faf9',
    borderWidth: 1,
    borderColor: '#dce8e5',
    borderRadius: 9,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  primaryAction: { backgroundColor: '#0f766e', borderColor: '#0f766e' },
  actionText: { color: '#365452', fontSize: 11, fontWeight: '700' },
  primaryActionText: { color: '#fff' },
});

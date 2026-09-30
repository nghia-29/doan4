import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import StoreHeader from '../components/StoreHeader';
import { useCart } from '../context/CartContext';
import { createCrudService } from '../services/crudService';
import { ADMIN_ENTITIES } from './adminConfig';

export default function AdminCrudScreen({ route, navigation }) {
  const entityKey = route.params?.entity || 'thuoc';
  const config = ADMIN_ENTITIES[entityKey] || ADMIN_ENTITIES.thuoc;
  const service = useMemo(() => createCrudService(config.resource), [config.resource]);
  const { count } = useCart();
  const [rows, setRows] = useState([]);
  const [query, setQuery] = useState('');
  const [values, setValues] = useState({});
  const [editing, setEditing] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await service.getAll();
      setRows(Array.isArray(data) ? data : []);
    } catch (requestError) {
      setError(requestError.message || 'Không thể tải dữ liệu.');
    } finally {
      setLoading(false);
    }
  }, [service]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const searchKeys = config.searchKeys || ['id'];
  const filtered = rows.filter((row) =>
    searchKeys.some((key) =>
      String(row[key] ?? '')
        .toLowerCase()
        .includes(query.toLowerCase())
    )
  );

  const openAdd = () => {
    setEditing(null);
    setValues({});
    setModalVisible(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setValues({ ...row });
    setModalVisible(true);
  };

  const save = async () => {
    const missing = config.fields.find(
      (field) => field.required && !String(values[field.name] ?? '').trim()
    );
    if (missing) {
      Alert.alert('Thiếu thông tin', `Vui lòng nhập ${missing.label}.`);
      return;
    }

    setSaving(true);
    try {
      if (editing) {
        await service.update(editing.id, values);
      } else {
        await service.create(values);
      }
      setModalVisible(false);
      await loadData();
      Alert.alert(
        'Thành công',
        `${editing ? 'Cập nhật' : 'Thêm mới'} ${config.label} thành công.`
      );
    } catch (requestError) {
      Alert.alert('Không thể lưu', requestError.message || 'Lỗi lưu dữ liệu');
    } finally {
      setSaving(false);
    }
  };

  const openRow = (row) => {
    if (entityKey === 'don_dat_thuoc') {
      return navigation.navigate('AdminOrderDetail', { id: row.id });
    }
    if (entityKey === 'phieu_nhap_thuoc') {
      return navigation.navigate('AdminReceiptDetail', { id: row.id });
    }
    if (entityKey === 'don_thuoc') {
      return navigation.navigate('AdminPrescriptionDetail', { id: row.id });
    }
    return openEdit(row);
  };

  const removeRow = (row) => {
    Alert.alert(
      `Xóa ${config.label}`,
      `Bạn có chắc chắn muốn xóa bản ghi #${row.id || ''}?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              await service.remove(row.id);
              await loadData();
            } catch (err) {
              Alert.alert('Lỗi', err.message || 'Không thể xóa');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <StoreHeader
        cartCount={count}
        onCartPress={() => navigation.navigate('Cart')}
        onAccountPress={() => navigation.navigate('Login')}
      />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>‹ Quản trị</Text>
        </TouchableOpacity>
        <View style={styles.titleRow}>
          <View>
            <Text style={styles.title}>{config.title}</Text>
            <Text style={styles.subtitle}>
              Bảng: {config.resource} · {rows.length} bản ghi
            </Text>
          </View>
          <TouchableOpacity style={styles.addButton} onPress={openAdd}>
            <Text style={styles.addText}>+ Thêm mới</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder={`Tìm kiếm ${config.label}...`}
        placeholderTextColor="#94a3b8"
        style={styles.search}
      />

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.error}>{error}</Text>
          <TouchableOpacity onPress={loadData}>
            <Text style={styles.retry}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      ) : loading ? (
        <ActivityIndicator style={styles.loader} size="large" color="#0d9488" />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item, index) => String(item.id ?? index)}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={loadData} />}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.row} onPress={() => openRow(item)}>
              <View style={styles.rowBody}>
                <Text style={styles.rowTitle}>
                  {item[config.columns[0]] || `#${item.id}`}
                </Text>
                {config.columns.slice(1).map((column) => (
                  <Text key={column} style={styles.rowMeta}>
                    <Text style={styles.metaLabel}>{column}:</Text>{' '}
                    {String(item[column] ?? '—')}
                  </Text>
                ))}
              </View>
              <View style={styles.rowActions}>
                <TouchableOpacity style={styles.actionBtn} onPress={() => openRow(item)}>
                  <Text style={styles.edit}>
                    {['don_dat_thuoc', 'phieu_nhap_thuoc', 'don_thuoc'].includes(entityKey)
                      ? 'Chi tiết'
                      : 'Sửa'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn} onPress={() => removeRow(item)}>
                  <Text style={styles.delete}>Xóa</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Text style={styles.empty}>Chưa có dữ liệu {config.label} nào.</Text>
          }
        />
      )}

      {/* Add / Edit Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>
              {editing ? `Sửa ${config.label} #${editing.id || ''}` : `Thêm ${config.label} mới`}
            </Text>
            <ScrollView style={styles.modalForm}>
              {config.fields.map((field) => (
                <View key={field.name} style={styles.fieldWrap}>
                  <Text style={styles.label}>
                    {field.label} {field.required ? <Text style={styles.required}>*</Text> : null}
                  </Text>
                  <TextInput
                    value={String(values[field.name] ?? '')}
                    onChangeText={(val) =>
                      setValues((current) => ({ ...current, [field.name]: val }))
                    }
                    placeholder={`Nhập ${field.label}`}
                    placeholderTextColor="#94a3b8"
                    keyboardType={field.keyboardType || 'default'}
                    multiline={field.multiline}
                    style={[styles.input, field.multiline && styles.multiline]}
                  />
                </View>
              ))}
            </ScrollView>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancel}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.save} onPress={save} disabled={saving}>
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveText}>Lưu bản ghi</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0fdfa' },
  header: { paddingHorizontal: 18, paddingBottom: 10 },
  back: { color: '#0d9488', fontWeight: '700', marginBottom: 8 },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: { color: '#134e4a', fontSize: 24, fontWeight: '800' },
  subtitle: { color: '#64748b', fontSize: 12, marginTop: 2 },
  addButton: {
    backgroundColor: '#0d9488',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  addText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  search: {
    marginHorizontal: 18,
    marginBottom: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    padding: 12,
    color: '#0f172a',
    fontSize: 14,
  },
  list: { padding: 18, paddingTop: 6 },
  row: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  rowBody: { flex: 1 },
  rowTitle: { color: '#0f172a', fontWeight: '800', fontSize: 15 },
  rowMeta: { color: '#475569', fontSize: 12, marginTop: 3 },
  metaLabel: { color: '#94a3b8', fontWeight: '600' },
  rowActions: { justifyContent: 'center', gap: 6, paddingLeft: 10 },
  actionBtn: { paddingVertical: 4, paddingHorizontal: 8 },
  edit: { color: '#0d9488', fontWeight: '700', fontSize: 13 },
  delete: { color: '#e11d48', fontWeight: '700', fontSize: 13 },
  loader: { marginTop: 40 },
  empty: { textAlign: 'center', color: '#64748b', padding: 30 },
  errorBox: {
    margin: 18,
    backgroundColor: '#fee2e2',
    borderRadius: 12,
    padding: 14,
  },
  error: { color: '#b91c1c' },
  retry: { color: '#0d9488', fontWeight: '700', marginTop: 8 },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15,23,42,.5)',
  },
  modal: {
    maxHeight: '90%',
    backgroundColor: '#fff',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 20,
  },
  modalTitle: { color: '#134e4a', fontSize: 20, fontWeight: '800', marginBottom: 12 },
  modalForm: { maxHeight: 420 },
  fieldWrap: { marginBottom: 12 },
  label: { color: '#334155', fontWeight: '700', fontSize: 13, marginBottom: 5 },
  required: { color: '#e11d48' },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    padding: 11,
    color: '#0f172a',
    fontSize: 14,
  },
  multiline: { minHeight: 70, textAlignVertical: 'top' },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 14,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  cancelBtn: { padding: 10 },
  cancel: { color: '#64748b', fontWeight: '700' },
  save: {
    backgroundColor: '#0d9488',
    borderRadius: 10,
    paddingHorizontal: 22,
    paddingVertical: 12,
  },
  saveText: { color: '#fff', fontWeight: '800', fontSize: 14 },
});

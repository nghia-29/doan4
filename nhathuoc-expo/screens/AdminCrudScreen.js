import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Modal, RefreshControl, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import StoreHeader from '../components/StoreHeader';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { createCrudService } from '../services/crudService';
import { ADMIN_ENTITIES } from './adminConfig';

export default function AdminCrudScreen({ route, navigation }) {
  const config = ADMIN_ENTITIES[route.params.entity];
  const service = useMemo(() => createCrudService(config.resource), [config.resource]);
  const { count } = useCart();
  const { logout } = useAuth();
  const [rows, setRows] = useState([]);
  const [query, setQuery] = useState('');
  const [values, setValues] = useState({});
  const [editing, setEditing] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { setRows(await service.getAll()); } catch (requestError) { setError(requestError.message || 'Không thể tải dữ liệu.'); } finally { setLoading(false); }
  }, [service]);
  useEffect(() => { load(); }, [load]);

  const filtered = rows.filter((row) => config.searchKeys.some((key) => String(row[key] ?? '').toLowerCase().includes(query.toLowerCase())));
  const openAdd = () => { setEditing(null); setValues({}); setModalVisible(true); };
  const openEdit = (row) => { setEditing(row); setValues({ ...row }); setModalVisible(true); };
  const save = async () => {
    const missing = config.fields.find((field) => field.required && !String(values[field.name] ?? '').trim());
    if (missing) { Alert.alert('Thiếu thông tin', `Vui lòng nhập ${missing.label}.`); return; }
    setSaving(true);
    try { if (editing) await service.update(editing.id, values); else await service.create(values); setModalVisible(false); await load(); Alert.alert('Thành công', `${editing ? 'Cập nhật' : 'Thêm'} ${config.label} thành công.`); } catch (requestError) { Alert.alert('Không thể lưu', requestError.message); } finally { setSaving(false); }
  };
  const openRow = (row) => {
    if (route.params.entity === 'don_dat_thuoc') return navigation.navigate('AdminOrderDetail', { id: row.id });
    if (route.params.entity === 'phieu_nhap_thuoc') return navigation.navigate('AdminReceiptDetail', { id: row.id });
    return openEdit(row);
  };
  const remove = (row) => Alert.alert(`Xóa ${config.label}`, 'Bạn có chắc chắn muốn xóa bản ghi này?', [{ text: 'Hủy', style: 'cancel' }, { text: 'Xóa', style: 'destructive', onPress: async () => { try { await service.remove(row.id); await load(); } catch (requestError) { Alert.alert('Không thể xóa', requestError.message); } } }]);

  return <View style={styles.container}><StoreHeader cartCount={count} onCartPress={() => navigation.navigate('Cart')} onAccountPress={() => navigation.navigate('Login')} /><View style={styles.header}><TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.back}>‹ Quản trị</Text></TouchableOpacity><Text style={styles.title}>{config.title}</Text><TouchableOpacity style={styles.addButton} onPress={openAdd}><Text style={styles.addText}>+ Thêm</Text></TouchableOpacity></View><TextInput value={query} onChangeText={setQuery} placeholder="Tìm kiếm..." placeholderTextColor="#94a3b8" style={styles.search} />{error ? <View style={styles.errorBox}><Text style={styles.error}>{error}</Text><TouchableOpacity onPress={load}><Text style={styles.retry}>Thử lại</Text></TouchableOpacity></View> : loading ? <ActivityIndicator style={styles.loader} size="large" color="#1d9bf0" /> : <FlatList data={filtered} keyExtractor={(item, index) => String(item.id ?? index)} refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />} contentContainerStyle={styles.list} renderItem={({ item }) => <TouchableOpacity style={styles.row} onPress={() => openRow(item)}><View style={styles.rowBody}><Text style={styles.rowTitle}>{item[config.columns[0]] || `#${item.id}`}</Text>{config.columns.slice(1).map((column) => <Text key={column} style={styles.rowMeta}>{column}: {String(item[column] ?? '—')}</Text>)}</View><View style={styles.rowActions}><TouchableOpacity onPress={() => openEdit(item)}><Text style={styles.edit}>Sửa</Text></TouchableOpacity><TouchableOpacity onPress={() => remove(item)}><Text style={styles.delete}>Xóa</Text></TouchableOpacity></View></TouchableOpacity>} ListEmptyComponent={<Text style={styles.empty}>Chưa có {config.label} nào.</Text>} />}

    <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}><View style={styles.modalBackdrop}><View style={styles.modal}><Text style={styles.modalTitle}>{editing ? `Sửa ${config.label}` : `Thêm ${config.label}`}</Text><FlatList data={config.fields} keyExtractor={(field) => field.name} renderItem={({ item: field }) => <View><Text style={styles.label}>{field.label}</Text><TextInput value={String(values[field.name] ?? '')} onChangeText={(value) => setValues((current) => ({ ...current, [field.name]: value }))} keyboardType={field.keyboardType || 'default'} multiline={field.multiline} style={[styles.input, field.multiline && styles.multiline]} /></View>} /><View style={styles.modalActions}><TouchableOpacity onPress={() => setModalVisible(false)}><Text style={styles.cancel}>Hủy</Text></TouchableOpacity><TouchableOpacity style={styles.save} onPress={save} disabled={saving}>{saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>Lưu</Text>}</TouchableOpacity></View></View></View></Modal></View>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f9ff' }, header: { paddingHorizontal: 20, paddingBottom: 12 }, back: { color: '#1d9bf0', fontWeight: '700', marginBottom: 12 }, title: { color: '#0f172a', fontSize: 27, fontWeight: '800' }, addButton: { position: 'absolute', right: 20, bottom: 12, backgroundColor: '#1d9bf0', borderRadius: 11, paddingHorizontal: 13, paddingVertical: 9 }, addText: { color: '#fff', fontWeight: '800' }, search: { marginHorizontal: 20, marginBottom: 8, backgroundColor: '#fff', borderRadius: 13, borderWidth: 1, borderColor: '#dfeaf7', padding: 13, color: '#0f172a' }, list: { padding: 20, paddingTop: 8 }, row: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#e8edf6' }, rowBody: { flex: 1 }, rowTitle: { color: '#0f172a', fontWeight: '800', fontSize: 15 }, rowMeta: { color: '#64748b', fontSize: 12, marginTop: 4 }, rowActions: { justifyContent: 'center', gap: 10 }, edit: { color: '#1d9bf0', fontWeight: '700' }, delete: { color: '#e11d48', fontWeight: '700' }, loader: { marginTop: 40 }, empty: { textAlign: 'center', color: '#64748b', padding: 30 }, errorBox: { margin: 20, backgroundColor: '#fff1f2', borderRadius: 14, padding: 18 }, error: { color: '#be123c' }, retry: { color: '#1d9bf0', fontWeight: '700', marginTop: 10 }, modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(15,23,42,.4)' }, modal: { maxHeight: '88%', backgroundColor: '#f5f9ff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 }, modalTitle: { color: '#0f172a', fontSize: 22, fontWeight: '800', marginBottom: 12 }, label: { color: '#334155', fontWeight: '700', marginTop: 10, marginBottom: 5 }, input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#dfeaf7', borderRadius: 11, padding: 12, color: '#0f172a' }, multiline: { minHeight: 75, textAlignVertical: 'top' }, modalActions: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 18, paddingTop: 15 }, cancel: { color: '#64748b', fontWeight: '700' }, save: { backgroundColor: '#1d9bf0', borderRadius: 11, paddingHorizontal: 24, paddingVertical: 12 }, saveText: { color: '#fff', fontWeight: '800' },
});

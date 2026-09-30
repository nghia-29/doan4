import AsyncStorage from '@react-native-async-storage/async-storage';
import { initialData } from '../data/mockData';

const STORAGE_PREFIX = '@nhathuoc_db_';

function getIdKey(resource) {
  if (resource === 'chi_tiet_phieu_nhap') return 'id_phieu_nhap';
  if (resource === 'chi_tiet_don_thuoc') return 'id_don_thuoc';
  if (resource === 'chi_tiet_don_dat') return 'id_don_dat';
  if (resource === 'mo_ta_thuoc') return 'id_thuoc';
  return 'id';
}

// In-memory cache for speed
const memoryCache = {};

export async function getCollection(resource) {
  if (memoryCache[resource]) {
    return memoryCache[resource];
  }

  try {
    const raw = await AsyncStorage.getItem(`${STORAGE_PREFIX}${resource}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      memoryCache[resource] = parsed;
      return parsed;
    }
  } catch (e) {
    console.warn('AsyncStorage read error:', e);
  }

  // Fallback to initial seed data
  const seed = initialData[resource] ? JSON.parse(JSON.stringify(initialData[resource])) : [];
  memoryCache[resource] = seed;
  try {
    await AsyncStorage.setItem(`${STORAGE_PREFIX}${resource}`, JSON.stringify(seed));
  } catch (e) {}
  return seed;
}

export async function saveCollection(resource, data) {
  memoryCache[resource] = data;
  try {
    await AsyncStorage.setItem(`${STORAGE_PREFIX}${resource}`, JSON.stringify(data));
  } catch (e) {
    console.warn('AsyncStorage write error:', e);
  }
}

export async function mockGetAll(resource, params = {}) {
  let list = await getCollection(resource);
  if (params && typeof params === 'object') {
    Object.keys(params).forEach((key) => {
      const val = params[key];
      if (val !== undefined && val !== null && val !== '') {
        list = list.filter((item) => String(item[key] ?? '').toLowerCase() === String(val).toLowerCase());
      }
    });
  }
  return list;
}

export async function mockGetById(resource, id) {
  const list = await getCollection(resource);
  const idKey = getIdKey(resource);
  const found = list.find((item) => String(item[idKey] ?? item.id ?? '') === String(id));
  return found || null;
}

export async function mockCreate(resource, payload) {
  const list = await getCollection(resource);
  const idKey = getIdKey(resource);
  const maxId = list.reduce((max, item) => Math.max(max, Number(item[idKey] ?? item.id ?? 0)), 0);
  const newId = maxId + 1;

  const newItem = {
    ...payload,
    [idKey]: payload[idKey] !== undefined ? payload[idKey] : newId,
    id: payload.id !== undefined ? payload.id : newId,
  };

  list.push(newItem);
  await saveCollection(resource, list);
  return { id: newItem.id, ...newItem };
}

export async function mockUpdate(resource, id, payload) {
  const list = await getCollection(resource);
  const idKey = getIdKey(resource);
  const index = list.findIndex((item) => String(item[idKey] ?? item.id ?? '') === String(id));

  if (index === -1) {
    const newItem = { ...payload, [idKey]: id, id };
    list.push(newItem);
    await saveCollection(resource, list);
    return { message: 'Updated', ...newItem };
  }

  list[index] = { ...list[index], ...payload };
  await saveCollection(resource, list);
  return { message: 'Updated', ...list[index] };
}

export async function mockRemove(resource, id) {
  const list = await getCollection(resource);
  const idKey = getIdKey(resource);
  const filtered = list.filter((item) => String(item[idKey] ?? item.id ?? '') !== String(id));
  await saveCollection(resource, filtered);
  return { message: 'Deleted' };
}

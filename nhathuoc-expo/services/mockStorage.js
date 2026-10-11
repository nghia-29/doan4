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

async function getPrescriptionBalanceView() {
  const [prescriptions, prescriptionLines, medicines, orders, orderLines] =
    await Promise.all([
      getCollection('don_thuoc'),
      getCollection('chi_tiet_don_thuoc'),
      getCollection('thuoc'),
      getCollection('don_dat_thuoc'),
      getCollection('chi_tiet_don_dat'),
    ]);
  const prescriptionById = new Map(
    prescriptions.map((prescription) => [String(prescription.id), prescription])
  );
  const medicineById = new Map(
    medicines.map((medicine) => [String(medicine.id), medicine])
  );
  const orderById = new Map(orders.map((order) => [String(order.id), order]));
  const purchasedByPrescriptionAndMedicine = new Map();

  orderLines.forEach((line) => {
    const order = orderById.get(String(line.id_don_dat));
    if (!order?.id_don_thuoc || order.trang_thai === 'da_huy') return;

    const key = `${order.id_don_thuoc}:${line.id_thuoc}`;
    purchasedByPrescriptionAndMedicine.set(
      key,
      (purchasedByPrescriptionAndMedicine.get(key) || 0) + Number(line.so_luong || 0)
    );
  });

  return prescriptionLines.flatMap((line) => {
    const prescription = prescriptionById.get(String(line.id_don_thuoc));
    const medicine = medicineById.get(String(line.id_thuoc));
    if (!prescription || !medicine) return [];

    const validityDays = Number(prescription.so_ngay_hieu_luc ?? 5);
    const expiryDate = new Date(`${String(prescription.ngay_ke_don).slice(0, 10)}T00:00:00Z`);
    if (!Number.isFinite(validityDays) || !Number.isFinite(expiryDate.getTime())) {
      throw new Error(`Dữ liệu hiệu lực toa thuốc ${prescription.id} không hợp lệ.`);
    }
    expiryDate.setUTCDate(expiryDate.getUTCDate() + validityDays);

    const key = `${prescription.id}:${line.id_thuoc}`;
    const purchased = purchasedByPrescriptionAndMedicine.get(key) || 0;
    const prescribed = Number(line.so_luong_ke || 0);
    return [{
      id_don_thuoc: prescription.id,
      id_khach_hang: prescription.id_khach_hang,
      trang_thai_toa: prescription.trang_thai,
      han_dung_toa: expiryDate.toISOString().slice(0, 10),
      id_thuoc: line.id_thuoc,
      ten_thuoc: medicine.ten_thuoc,
      so_luong_ke: prescribed,
      da_mua: purchased,
      con_lai: prescribed - purchased,
    }];
  });
}

export async function mockGetAll(resource, params = {}) {
  let list = resource === 'v_toa_con_lai'
    ? await getPrescriptionBalanceView()
    : await getCollection(resource);
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

export async function mockApplyPrescriptionRegimen(prescriptionId, regimenId, diagnosis) {
  const prescriptions = await getCollection('don_thuoc');
  const prescription = prescriptions.find((item) => String(item.id) === String(prescriptionId));
  if (!prescription) throw new Error('Không tìm thấy toa thuốc.');
  if (prescription.trang_thai !== 'cho_duyet') {
    throw new Error('Chỉ có thể áp dụng phác đồ cho toa đang chờ duyệt.');
  }

  const regimens = await getCollection('phac_do');
  const regimen = regimens.find(
    (item) => String(item.id) === String(regimenId) && Number(item.trang_thai ?? 1) === 1
  );
  if (!regimen) throw new Error('Phác đồ không tồn tại hoặc đã ngừng dùng.');

  const regimenLines = (await getCollection('chi_tiet_phac_do')).filter(
    (item) => String(item.id_phac_do) === String(regimenId)
  );
  const prescriptionLines = await getCollection('chi_tiet_don_thuoc');
  regimenLines.forEach((line) => {
    const existing = prescriptionLines.find(
      (item) => String(item.id_don_thuoc) === String(prescriptionId)
        && String(item.id_thuoc) === String(line.id_thuoc)
    );
    const appliedLine = {
      id_don_thuoc: prescriptionId,
      id_thuoc: line.id_thuoc,
      so_luong_ke: line.so_luong_goi_y,
      lieu_dung: line.lieu_dung,
      so_ngay_dung: line.so_ngay_dung,
    };
    if (existing) Object.assign(existing, appliedLine);
    else prescriptionLines.push(appliedLine);
  });

  prescription.id_benh = regimen.id_benh;
  prescription.id_phac_do = regimenId;
  prescription.chan_doan = diagnosis;
  await Promise.all([
    saveCollection('don_thuoc', prescriptions),
    saveCollection('chi_tiet_don_thuoc', prescriptionLines),
  ]);
  return { message: 'Đã áp dụng phác đồ vào toa thuốc.' };
}

export async function mockUpdatePrescriptionLine(prescriptionId, medicineId, payload) {
  const prescriptions = await getCollection('don_thuoc');
  const prescription = prescriptions.find((item) => String(item.id) === String(prescriptionId));
  if (!prescription) throw new Error('Không tìm thấy toa thuốc.');
  if (prescription.trang_thai !== 'cho_duyet') {
    throw new Error('Chỉ có thể chỉnh sửa thuốc khi toa đang chờ duyệt.');
  }

  const lines = await getCollection('chi_tiet_don_thuoc');
  const line = lines.find((item) => String(item.id_don_thuoc) === String(prescriptionId)
    && String(item.id_thuoc) === String(medicineId));
  if (!line) throw new Error('Không tìm thấy thuốc trong toa.');
  Object.assign(line, payload);
  await saveCollection('chi_tiet_don_thuoc', lines);
  return { message: 'Đã cập nhật thuốc trong toa.' };
}

export async function mockDeletePrescriptionLine(prescriptionId, medicineId) {
  const prescriptions = await getCollection('don_thuoc');
  const prescription = prescriptions.find((item) => String(item.id) === String(prescriptionId));
  if (!prescription) throw new Error('Không tìm thấy toa thuốc.');
  if (prescription.trang_thai !== 'cho_duyet') {
    throw new Error('Chỉ có thể chỉnh sửa thuốc khi toa đang chờ duyệt.');
  }

  const lines = await getCollection('chi_tiet_don_thuoc');
  const filtered = lines.filter((item) => !(String(item.id_don_thuoc) === String(prescriptionId)
    && String(item.id_thuoc) === String(medicineId)));
  await saveCollection('chi_tiet_don_thuoc', filtered);
  return { message: 'Đã xóa thuốc khỏi toa.' };
}

export async function mockPrescriptionRequest({ method, id, action, accountId, body }) {
  const requests = await getCollection('yeu_cau_ke_don');
  const customers = await getCollection('khach_hang');
  const customer = customers.find((item) => String(item.id_tai_khoan) === String(accountId));
  const staff = await getCollection('nhan_vien');
  const prescriptions = await getCollection('don_thuoc');
  const prescriptionLines = await getCollection('chi_tiet_don_thuoc');
  const pharmacist = staff.find((item) => (
    String(item.id_tai_khoan) === String(accountId)
    && item.so_chung_chi_hanh_nghe
  ));
  const requestId = id ? Number(id) : null;
  const selectedRequest = requests.find((item) => Number(item.id) === requestId);
  const getDetails = (item) => {
    const assignedStaff = staff.find(
      (employee) => String(employee.id) === String(item.id_nhan_vien_tiep_nhan)
    );
    const prescription = prescriptions.find(
      (entry) => String(entry.id_yeu_cau) === String(item.id)
    );
    return {
      ...item,
      khach_hang: customers.find((entry) => String(entry.id) === String(item.id_khach_hang))?.ho_ten,
      so_dien_thoai: customers.find((entry) => String(entry.id) === String(item.id_khach_hang))?.so_dien_thoai,
      duoc_si_tiep_nhan: assignedStaff?.ho_ten,
      id_don_thuoc: prescription?.id || item.id_don_thuoc,
      trang_thai_toa: prescription?.trang_thai,
      so_loai_thuoc: prescription
        ? prescriptionLines.filter((line) => String(line.id_don_thuoc) === String(prescription.id)).length
        : 0,
    };
  };

  if (method === 'GET' && action === 'queue') {
    return requests
      .filter((item) => item.trang_thai === 'cho_tiep_nhan')
      .sort((left, right) => String(left.ngay_tao).localeCompare(String(right.ngay_tao)))
      .map((item) => ({
        ...getDetails(item),
        id_yeu_cau: item.id,
      }));
  }
  if (method === 'GET' && !id) {
    if (!customer) return [];
    return requests
      .filter((item) => String(item.id_khach_hang) === String(customer.id))
      .map(getDetails);
  }
  if (method === 'GET' && selectedRequest) {
    if (customer && String(selectedRequest.id_khach_hang) !== String(customer.id)) {
      throw new Error('Không tìm thấy yêu cầu kê đơn.');
    }
    return getDetails(selectedRequest);
  }
  if (method === 'POST' && !id) {
    if (!customer) throw new Error('Không tìm thấy hồ sơ khách hàng.');
    const created = await mockCreate('yeu_cau_ke_don', {
      ...body,
      id_khach_hang: customer.id,
      trang_thai: 'cho_tiep_nhan',
      ngay_tao: new Date().toISOString(),
    });
    return { id: created.id };
  }
  if (!selectedRequest) throw new Error('Không tìm thấy yêu cầu kê đơn.');
  if (method !== 'POST') throw new Error('Thao tác yêu cầu kê đơn không được hỗ trợ.');

  if (action === 'cancel') {
    if (
      !customer
      || String(selectedRequest.id_khach_hang) !== String(customer.id)
      || selectedRequest.trang_thai !== 'cho_tiep_nhan'
    ) {
      throw new Error('Chỉ có thể hủy yêu cầu đang chờ dược sĩ tiếp nhận.');
    }
    selectedRequest.trang_thai = 'da_huy';
  } else {
    if (!pharmacist) throw new Error('Tài khoản hiện tại chưa có hồ sơ dược sĩ hợp lệ.');
    if (action === 'accept') {
      if (selectedRequest.trang_thai !== 'cho_tiep_nhan') {
        throw new Error('Yêu cầu không còn ở trạng thái chờ tiếp nhận.');
      }
      selectedRequest.trang_thai = 'da_tiep_nhan';
      selectedRequest.id_nhan_vien_tiep_nhan = pharmacist.id;
      selectedRequest.ngay_tiep_nhan = new Date().toISOString();
    } else if (action === 'reject') {
      if (!body.ly_do_tu_choi?.trim()) throw new Error('Cần cung cấp lý do từ chối.');
      if (!['cho_tiep_nhan', 'da_tiep_nhan'].includes(selectedRequest.trang_thai)) {
        throw new Error('Yêu cầu đã được xử lý.');
      }
      selectedRequest.trang_thai = 'tu_choi';
      selectedRequest.id_nhan_vien_tiep_nhan = pharmacist.id;
      selectedRequest.ly_do_tu_choi = body.ly_do_tu_choi.trim();
    } else if (action === 'prescription') {
      if (
        selectedRequest.trang_thai !== 'da_tiep_nhan'
        || String(selectedRequest.id_nhan_vien_tiep_nhan) !== String(pharmacist.id)
      ) {
        throw new Error('Chỉ dược sĩ đã tiếp nhận yêu cầu mới được kê toa.');
      }
      const prescription = await mockCreate('don_thuoc', {
        id_khach_hang: selectedRequest.id_khach_hang,
        id_nhan_vien_ke_don: pharmacist.id,
        id_yeu_cau: selectedRequest.id,
        id_benh: body.id_benh || null,
        id_phac_do: body.id_phac_do || null,
        chan_doan: body.chan_doan || null,
        ngay_ke_don: body.ngay_ke_don,
        so_ngay_hieu_luc: body.so_ngay_hieu_luc || 5,
        trang_thai: 'cho_duyet',
      });
      if (body.id_phac_do) {
        const regimenLines = (await getCollection('chi_tiet_phac_do')).filter(
          (line) => String(line.id_phac_do) === String(body.id_phac_do)
        );
        const prescriptionLines = await getCollection('chi_tiet_don_thuoc');
        regimenLines.forEach((line) => {
          prescriptionLines.push({
            id_don_thuoc: prescription.id,
            id_thuoc: line.id_thuoc,
            so_luong_ke: line.so_luong_goi_y,
            lieu_dung: line.lieu_dung,
            so_ngay_dung: line.so_ngay_dung,
          });
        });
        await saveCollection('chi_tiet_don_thuoc', prescriptionLines);
      }
      selectedRequest.trang_thai = 'da_ke_don';
      selectedRequest.id_don_thuoc = prescription.id;
      await saveCollection('don_thuoc', prescriptions);
      await saveCollection('yeu_cau_ke_don', requests);
      return { id_don_thuoc: prescription.id };
    } else {
      throw new Error('Thao tác yêu cầu kê đơn không được hỗ trợ.');
    }
  }
  await saveCollection('yeu_cau_ke_don', requests);
  return { message: 'Đã cập nhật yêu cầu kê đơn.' };
}

export async function mockAccountProfile({ method, accountId, body }) {
  const accounts = await getCollection('tai_khoan');
  const account = accounts.find((item) => String(item.id) === String(accountId));
  if (!account) throw new Error('Không tìm thấy tài khoản.');

  const customers = await getCollection('khach_hang');
  const customer = customers.find(
    (item) => String(item.id_tai_khoan) === String(accountId)
  );
  if (!customer) throw new Error('Không tìm thấy hồ sơ khách hàng.');

  const roles = await getCollection('vai_tro');
  const role = roles.find((item) => String(item.id) === String(account.id_vai_tro));
  if (method === 'PATCH') {
    const editableFields = [
      'ho_ten',
      'so_dien_thoai',
      'email',
      'dia_chi',
      'ngay_sinh',
    ];
    const fields = Object.keys(body);
    if (!fields.length || fields.some((field) => !editableFields.includes(field))) {
      throw new Error('Thông tin hồ sơ không hợp lệ.');
    }
    if (fields.includes('ho_ten') && !String(body.ho_ten || '').trim()) {
      throw new Error('Họ tên không được để trống.');
    }
    Object.assign(customer, body);
    await saveCollection('khach_hang', customers);
  } else if (method !== 'GET') {
    throw new Error('Thao tác hồ sơ không được hỗ trợ.');
  }

  return {
    id_tai_khoan: account.id,
    ten_dang_nhap: account.ten_dang_nhap,
    vai_tro: role?.ten_vai_tro,
    ...customer,
  };
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

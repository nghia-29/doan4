const STAFF_ROLES = ['duoc_si', 'nv_quan_ly'];

export const STAFF_MANAGEMENT_ENTITY_KEYS = [
  'phieu_nhap_thuoc',
  'chi_tiet_phieu_nhap',
  'lich_su_trang_thai_nhap',
  'chi_tiet_xuat_lo',
  'v_ton_kho_theo_lo',
  'lo_thuoc',
  'thuoc',
  'danh_muc_thuoc',
  'mo_ta_thuoc',
  'nha_cung_cap',
  'v_thuoc_ke_don',
  'v_thuoc_sap_het_han',
];

export function isAdminRole(role) {
  return String(role || '').toLowerCase().includes('admin');
}

export function isStaffRole(role) {
  const normalizedRole = String(role || '').toLowerCase();
  return STAFF_ROLES.some((staffRole) => normalizedRole.includes(staffRole));
}

export function isPharmacistRole(role) {
  return String(role || '').toLowerCase() === 'duoc_si';
}

export function canManageEntity(role, entity) {
  return isAdminRole(role) || (
    isStaffRole(role) && STAFF_MANAGEMENT_ENTITY_KEYS.includes(entity)
  );
}

export function getWorkspaceRoute(role) {
  if (isAdminRole(role)) return 'AdminDashboard';
  if (isStaffRole(role)) return 'Staff';
  return 'Customer';
}

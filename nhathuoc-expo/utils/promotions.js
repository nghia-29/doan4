function parsePromotionDate(value, isEndDate = false) {
  const dateValue = String(value || '');
  const normalizedValue = /^\d{4}-\d{2}-\d{2}$/.test(dateValue)
    ? `${dateValue}T${isEndDate ? '23:59:59.999' : '00:00:00'}`
    : dateValue.replace(' ', 'T');
  const timestamp = new Date(normalizedValue).getTime();
  return Number.isFinite(timestamp) ? timestamp : null;
}

export function isPromotionActive(promotion, now = Date.now()) {
  const start = parsePromotionDate(promotion.ngay_bat_dau);
  const end = parsePromotionDate(promotion.ngay_ket_thuc, true);
  const hasUsesLeft = promotion.so_luong_toi_da == null
    || Number(promotion.so_luong_da_dung || 0) < Number(promotion.so_luong_toi_da);

  return Number(promotion.trang_thai ?? 1) === 1
    && start !== null
    && end !== null
    && now >= start
    && now <= end
    && hasUsesLeft;
}

import thuocService from "@/services/thuocService";
import moTaThuocService from "@/services/moTaThuocService";
import anhThuocService from "@/services/anhThuocService";

// Thuốc (bảng `thuoc`) chỉ chứa thông tin cốt lõi. Thông tin mô tả chi tiết
// (thành phần, công dụng, hướng dẫn sử dụng, bảo quản, cảnh báo) nằm ở bảng
// riêng `mo_ta_thuoc` (khóa `id_thuoc`), và hình ảnh nằm ở bảng `anh_thuoc`
// (khóa `id`, có cột `id_thuoc`) — đúng theo các controller backend đã có
// (mo_ta_thuocController, anh_thuocController), không tạo API mới.

export const MO_TA_FIELDS = ["thanh_phan", "cong_dung", "huong_dan_su_dung", "bao_quan", "canh_bao"];

export async function loadThuocDetail(id) {
  const [moTaRes, anhAllRes] = await Promise.allSettled([
    moTaThuocService.getById(id),
    anhThuocService.getAll(),
  ]);
  const moTa = moTaRes.status === "fulfilled" ? moTaRes.value : null;
  const anhAll = anhAllRes.status === "fulfilled" ? anhAllRes.value || [] : [];
  const anhList = anhAll.filter((a) => String(a.id_thuoc) === String(id));
  return { moTa: moTa && !Array.isArray(moTa) ? moTa : null, anhList };
}

export async function saveThuocFull({ id, thuocPayload, moTaPayload, hinhAnhUrl, existingMoTa, existingAnh }) {
  let thuocId = id;
  if (id) {
    await thuocService.update(id, thuocPayload);
  } else {
    const created = await thuocService.create(thuocPayload);
    thuocId = created?.id ?? created?.insertId ?? created?.insertid;
  }

  const hasMoTaContent = MO_TA_FIELDS.some((k) => moTaPayload?.[k]);
  if (hasMoTaContent) {
    if (existingMoTa) {
      await moTaThuocService.update(thuocId, moTaPayload);
    } else {
      await moTaThuocService.create({ ...moTaPayload, id_thuoc: thuocId });
    }
  }

  if (hinhAnhUrl) {
    if (existingAnh && existingAnh[0]) {
      await anhThuocService.update(existingAnh[0].id, { duong_dan_anh: hinhAnhUrl, id_thuoc: thuocId });
    } else {
      await anhThuocService.create({ id_thuoc: thuocId, duong_dan_anh: hinhAnhUrl });
    }
  }

  return thuocId;
}

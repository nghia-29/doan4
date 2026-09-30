import { NextResponse } from "next/server";
import { initialData } from "@/lib/initialData";

// In-memory data store for server-side Next.js API routes
// Initialized from schema seed data and updated in memory
const db = globalThis.__nhathuoc_db || (globalThis.__nhathuoc_db = JSON.parse(JSON.stringify(initialData)));

function getCollection(name) {
  if (!db[name]) {
    db[name] = [];
  }
  return db[name];
}

function getIdKey(resource) {
  if (resource === "chi_tiet_phieu_nhap") return "id_phieu_nhap";
  if (resource === "chi_tiet_don_thuoc") return "id_don_thuoc";
  if (resource === "chi_tiet_don_dat") return "id_don_dat";
  if (resource === "mo_ta_thuoc") return "id_thuoc";
  return "id";
}

export async function GET(request, { params }) {
  const path = params?.path || [];
  const resource = path[0];
  const id = path[1];

  if (!resource) {
    return NextResponse.json({ status: "ok", message: "API Nhà Thuốc đang hoạt động" });
  }

  const collection = getCollection(resource);
  const idKey = getIdKey(resource);

  if (id !== undefined && id !== "") {
    const item = collection.find(
      (entry) => String(entry[idKey] ?? entry.id ?? "") === String(id)
    );
    if (!item) {
      return NextResponse.json({ message: "Không tìm thấy dữ liệu" }, { status: 404 });
    }
    return NextResponse.json(item);
  }

  // Filter based on search params
  const { searchParams } = new URL(request.url);
  let result = [...collection];

  searchParams.forEach((value, key) => {
    if (value && key !== "_") {
      result = result.filter((item) => String(item[key] ?? "").toLowerCase() === value.toLowerCase());
    }
  });

  return NextResponse.json(result);
}

export async function POST(request, { params }) {
  const path = params?.path || [];
  const resource = path[0];

  if (!resource) {
    return NextResponse.json({ message: "Thiếu tên bảng dữ liệu" }, { status: 400 });
  }

  try {
    const body = await request.json();
    const collection = getCollection(resource);
    const idKey = getIdKey(resource);

    const maxId = collection.reduce((max, item) => Math.max(max, Number(item[idKey] ?? item.id ?? 0)), 0);
    const newId = maxId + 1;

    const newItem = {
      ...body,
      [idKey]: body[idKey] !== undefined ? body[idKey] : newId,
      id: body.id !== undefined ? body.id : newId,
    };

    collection.push(newItem);
    return NextResponse.json({ id: newItem.id, ...newItem }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: error.message || "Lỗi xử lý dữ liệu" }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  const path = params?.path || [];
  const resource = path[0];
  const id = path[1];

  if (!resource || !id) {
    return NextResponse.json({ message: "Thiếu thông tin cập nhật" }, { status: 400 });
  }

  try {
    const body = await request.json();
    const collection = getCollection(resource);
    const idKey = getIdKey(resource);

    const index = collection.findIndex(
      (entry) => String(entry[idKey] ?? entry.id ?? "") === String(id)
    );

    if (index === -1) {
      const newItem = { ...body, [idKey]: id, id };
      collection.push(newItem);
      return NextResponse.json({ message: "Updated", ...newItem });
    }

    collection[index] = { ...collection[index], ...body };
    return NextResponse.json({ message: "Updated", ...collection[index] });
  } catch (error) {
    return NextResponse.json({ message: error.message || "Lỗi cập nhật dữ liệu" }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const path = params?.path || [];
  const resource = path[0];
  const id = path[1];

  if (!resource || !id) {
    return NextResponse.json({ message: "Thiếu thông tin xóa" }, { status: 400 });
  }

  const collection = getCollection(resource);
  const idKey = getIdKey(resource);

  const initialLength = collection.length;
  db[resource] = collection.filter(
    (entry) => String(entry[idKey] ?? entry.id ?? "") !== String(id)
  );

  return NextResponse.json({
    message: "Deleted",
    deleted: initialLength - db[resource].length,
  });
}

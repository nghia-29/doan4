"use client";

import { useEffect, useMemo, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import DataTable from "@/components/admin/DataTable";
import { SearchBar, FilterSelect } from "@/components/admin/SearchBar";
import Pagination from "@/components/admin/Pagination";
import Modal from "@/components/admin/Modal";
import ConfirmModal from "@/components/admin/ConfirmModal";
import DynamicForm from "@/components/admin/DynamicForm";
import Loading from "@/components/admin/Loading";
import { EmptyState, ErrorState } from "@/components/admin/StateViews";
import StatusBadge from "@/components/admin/StatusBadge";
import { ToastStack, useToasts } from "@/components/admin/Toast";

import taiKhoanService from "@/services/taiKhoanService";
import vaiTroService from "@/services/vaiTroService";
import { useCrudList, usePagination } from "@/lib/useCrudList";
import { PAGE_SIZE, VAI_TRO_OPTIONS, getVaiTroLabel } from "@/lib/constants";
import { formatDate, pickFirst } from "@/lib/format";

export default function TaiKhoanPage() {
  const { data, loading, error, reload } = useCrudList(taiKhoanService);
  const { toasts, push, dismiss } = useToasts();

  const [search, setSearch] = useState("");
  const [filterVaiTro, setFilterVaiTro] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [values, setValues] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [lockTarget, setLockTarget] = useState(null);
  const [vaiTroList, setVaiTroList] = useState([]);

  useEffect(() => {
    vaiTroService.getAll().then(setVaiTroList).catch(() => setVaiTroList([]));
  }, []);

  const vaiTroOptions = vaiTroList.length
    ? vaiTroList.map((role) => ({ value: role.id, label: pickFirst(role, ["ten_vai_tro"], `#${role.id}`) }))
    : VAI_TRO_OPTIONS;

  const filtered = useMemo(() => {
    let rows = data;
    if (filterVaiTro) rows = rows.filter((r) => String(pickFirst(r, ["id_vai_tro"], "")) === String(filterVaiTro));
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      rows = rows.filter((r) =>
        [pickFirst(r, ["ten_dang_nhap"], ""), pickFirst(r, ["email"], "")].some((v) =>
          String(v).toLowerCase().includes(q)
        )
      );
    }
    return rows;
  }, [data, search, filterVaiTro]);

  const { page, setPage, totalPages, pageItems, totalItems } = usePagination(filtered, PAGE_SIZE);

  const openAdd = () => {
    setEditing(null);
    setValues({ id_vai_tro: vaiTroList[0]?.id || "", trang_thai: 1 });
    setShowForm(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setValues({ ...row });
    setShowForm(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editing) {
        await taiKhoanService.update(editing.id, values);
        push("Cập nhật tài khoản thành công.");
      } else {
        await taiKhoanService.create(values);
        push("Tạo tài khoản thành công.");
      }
      setShowForm(false);
      reload();
    } catch (err) {
      push(err?.message || "Không thể lưu tài khoản.", "danger");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await taiKhoanService.remove(deleteTarget.id);
      push("Đã xóa tài khoản.");
      setDeleteTarget(null);
      reload();
    } catch (err) {
      push(err?.message || "Không thể xóa tài khoản.", "danger");
    }
  };

  const handleToggleLock = async () => {
    const isLocked = Number(pickFirst(lockTarget, ["trang_thai"], 1)) === 0;
    try {
      await taiKhoanService.update(lockTarget.id, { ...lockTarget, trang_thai: isLocked ? 1 : 0 });
      push(isLocked ? "Đã mở khóa tài khoản." : "Đã khóa tài khoản.");
      setLockTarget(null);
      reload();
    } catch (err) {
      push(err?.message || "Không thể cập nhật trạng thái tài khoản.", "danger");
    }
  };

  const formFields = [
    { name: "ten_dang_nhap", label: "Tên đăng nhập", required: true },
    { name: "mat_khau", label: "Mật khẩu", type: "password" },
    { name: "id_vai_tro", label: "Vai trò", type: "select", options: vaiTroOptions },
    {
      name: "trang_thai",
      label: "Trạng thái",
      type: "select",
        options: [
          { value: 1, label: "Hoạt động" },
          { value: 0, label: "Đã khóa" },
      ],
    },
  ];

  return (
    <AdminLayout title="Tài khoản" subtitle="Quản lý tài khoản đăng nhập và phân quyền người dùng hệ thống">
      <ToastStack toasts={toasts} onDismiss={dismiss} />

      <div className="pm-card p-3">
        <div className="table-toolbar">
          <div className="d-flex flex-wrap gap-2 align-items-center">
            <SearchBar value={search} onChange={setSearch} placeholder="Tìm theo tên đăng nhập, email..." />
            <FilterSelect
              value={filterVaiTro}
              onChange={setFilterVaiTro}
              options={[{ value: "", label: "Tất cả vai trò" }, ...vaiTroOptions]}
            />
          </div>
          <button className="btn btn-brand" onClick={openAdd}>
            <i className="bi bi-plus-lg me-1" /> Thêm tài khoản
          </button>
        </div>

        {loading ? (
          <Loading />
        ) : error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : filtered.length === 0 ? (
          <EmptyState title="Chưa có tài khoản nào" />
        ) : (
          <>
            <DataTable
              columns={[
                { key: "ten_dang_nhap", label: "Tên đăng nhập", render: (r) => <span className="fw-semibold">{pickFirst(r, ["ten_dang_nhap"], "—")}</span> },
                { key: "id_vai_tro", label: "Vai trò", render: (r) => <StatusBadge label={vaiTroOptions.find((v) => String(v.value) === String(pickFirst(r, ["id_vai_tro"], "")))?.label || "—"} color="info" /> },
                {
                  key: "trang_thai",
                  label: "Trạng thái",
                  render: (r) => {
                    const locked = Number(pickFirst(r, ["trang_thai"], 1)) === 0;
                    return <StatusBadge label={locked ? "Đã khóa" : "Hoạt động"} color={locked ? "danger" : "success"} />;
                  },
                },
                { key: "ngay_tao", label: "Ngày tạo", render: (r) => formatDate(pickFirst(r, ["ngay_tao", "created_at"], null)) },
              ]}
              data={pageItems}
              rowKey={(r) => r.id}
              actions={(row) => {
                const locked = Number(pickFirst(row, ["trang_thai"], 1)) === 0;
                return (
                  <div className="d-flex gap-1 justify-content-end">
                    <button
                      className={`btn btn-sm ${locked ? "btn-outline-success" : "btn-outline-warning"}`}
                      title={locked ? "Mở khóa" : "Khóa tài khoản"}
                      onClick={() => setLockTarget(row)}
                    >
                      <i className={`bi ${locked ? "bi-unlock" : "bi-lock"}`} />
                    </button>
                    <button className="btn btn-sm btn-outline-secondary" onClick={() => openEdit(row)} title="Sửa">
                      <i className="bi bi-pencil" />
                    </button>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => setDeleteTarget(row)} title="Xóa">
                      <i className="bi bi-trash" />
                    </button>
                  </div>
                );
              }}
            />
            <Pagination page={page} totalPages={totalPages} totalItems={totalItems} pageSize={PAGE_SIZE} onChange={setPage} />
          </>
        )}
      </div>

      <Modal
        show={showForm}
        onClose={() => setShowForm(false)}
        title={editing ? `Sửa tài khoản #${editing.id}` : "Thêm tài khoản mới"}
        footer={
          <>
            <button className="btn btn-light" onClick={() => setShowForm(false)}>Hủy</button>
            <button className="btn btn-brand" onClick={handleSave} disabled={saving}>
              {saving && <span className="spinner-border spinner-border-sm me-2" />}
              Lưu
            </button>
          </>
        }
      >
        <DynamicForm fields={formFields} values={values} onChange={setValues} />
      </Modal>

      <ConfirmModal
        show={!!deleteTarget}
        title="Xóa tài khoản"
        message="Bạn có chắc chắn muốn xóa tài khoản này khỏi hệ thống?"
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />

      <ConfirmModal
        show={!!lockTarget}
        title={Number(pickFirst(lockTarget, ["trang_thai"], 1)) === 0 ? "Mở khóa tài khoản" : "Khóa tài khoản"}
        message={
          Number(pickFirst(lockTarget, ["trang_thai"], 1)) === 0
            ? "Tài khoản sẽ có thể đăng nhập và sử dụng hệ thống trở lại."
            : "Tài khoản sẽ không thể đăng nhập vào hệ thống cho đến khi được mở khóa."
        }
        confirmLabel="Xác nhận"
        confirmVariant="brand"
        onConfirm={handleToggleLock}
        onClose={() => setLockTarget(null)}
      />
    </AdminLayout>
  );
}

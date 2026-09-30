"use client";

import { useMemo, useState } from "react";
import DataTable from "./DataTable";
import { SearchBar } from "./SearchBar";
import Pagination from "./Pagination";
import Modal from "./Modal";
import ConfirmModal from "./ConfirmModal";
import DynamicForm from "./DynamicForm";
import Loading from "./Loading";
import { EmptyState, ErrorState } from "./StateViews";
import { ToastStack, useToasts } from "./Toast";
import { useCrudList, usePagination } from "@/lib/useCrudList";
import { PAGE_SIZE } from "@/lib/constants";

export default function GenericCrudPage({
  service,
  columns,
  formFields,
  searchKeys = [],
  idKey = "id",
  entityLabel = "bản ghi",
  searchPlaceholder = "Tìm kiếm...",
  extraToolbar,
  renderRowActionsExtra,
  onRowClick,
  filterPredicate,
}) {
  const { data, loading, error, reload } = useCrudList(service);
  const { toasts, push, dismiss } = useToasts();

  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [values, setValues] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const filtered = useMemo(() => {
    let rows = data;
    if (filterPredicate) rows = rows.filter(filterPredicate);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      rows = rows.filter((row) => searchKeys.some((k) => String(row[k] ?? "").toLowerCase().includes(q)));
    }
    return rows;
  }, [data, search, searchKeys, filterPredicate]);

  const { page, setPage, totalPages, pageItems, totalItems } = usePagination(filtered, PAGE_SIZE);

  const openAdd = () => {
    setEditing(null);
    setValues({});
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
        await service.update(editing[idKey], values);
        push(`Cập nhật ${entityLabel} thành công.`);
      } else {
        await service.create(values);
        push(`Thêm ${entityLabel} thành công.`);
      }
      setShowForm(false);
      reload();
    } catch (err) {
      push(err?.message || `Không thể lưu ${entityLabel}.`, "danger");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await service.remove(deleteTarget[idKey]);
      push(`Đã xóa ${entityLabel}.`);
      setDeleteTarget(null);
      reload();
    } catch (err) {
      push(err?.message || `Không thể xóa ${entityLabel}.`, "danger");
    }
  };

  return (
    <div>
      <ToastStack toasts={toasts} onDismiss={dismiss} />

      <div className="pm-card p-3">
        <div className="table-toolbar">
          <div className="d-flex flex-wrap gap-2 align-items-center">
            {searchKeys.length > 0 && (
              <SearchBar value={search} onChange={setSearch} placeholder={searchPlaceholder} />
            )}
            {extraToolbar}
          </div>
          {formFields && (
            <button className="btn btn-brand" onClick={openAdd}>
              <i className="bi bi-plus-lg me-1" /> Thêm {entityLabel}
            </button>
          )}
        </div>

        {loading ? (
          <Loading />
        ) : error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : filtered.length === 0 ? (
          <EmptyState title={`Chưa có ${entityLabel} nào`} desc="Thử thay đổi từ khóa tìm kiếm hoặc thêm mới." />
        ) : (
          <>
            <DataTable
              columns={columns}
              data={pageItems}
              rowKey={(r, i) => r[idKey] ?? i}
              onRowClick={onRowClick}
              actions={(row) => (
                <div className="d-flex gap-1 justify-content-end">
                  {renderRowActionsExtra && renderRowActionsExtra(row)}
                  {formFields && (
                    <button className="btn btn-sm btn-outline-secondary" onClick={() => openEdit(row)} title="Sửa">
                      <i className="bi bi-pencil" />
                    </button>
                  )}
                  {formFields && (
                    <button className="btn btn-sm btn-outline-danger" onClick={() => setDeleteTarget(row)} title="Xóa">
                      <i className="bi bi-trash" />
                    </button>
                  )}
                </div>
              )}
            />
            <Pagination page={page} totalPages={totalPages} totalItems={totalItems} pageSize={PAGE_SIZE} onChange={setPage} />
          </>
        )}
      </div>

      {formFields && (
        <Modal
          show={showForm}
          onClose={() => setShowForm(false)}
          title={editing ? `Sửa ${entityLabel}` : `Thêm ${entityLabel}`}
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
      )}

      <ConfirmModal
        show={!!deleteTarget}
        title={`Xóa ${entityLabel}`}
        message={`Bạn có chắc chắn muốn xóa ${entityLabel} này? Hành động không thể hoàn tác.`}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}

"use client";

import { useState } from "react";
import Modal from "./Modal";

export default function ConfirmModal({
  show,
  title = "Xác nhận",
  message = "Bạn có chắc chắn muốn thực hiện thao tác này?",
  confirmLabel = "Xác nhận",
  confirmVariant = "danger",
  onConfirm,
  onClose,
}) {
  const [busy, setBusy] = useState(false);

  const handleConfirm = async () => {
    setBusy(true);
    try {
      await onConfirm?.();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      show={show}
      onClose={onClose}
      title={title}
      footer={
        <>
          <button className="btn btn-light" onClick={onClose} disabled={busy}>
            Hủy
          </button>
          <button className={`btn btn-${confirmVariant}`} onClick={handleConfirm} disabled={busy}>
            {busy && <span className="spinner-border spinner-border-sm me-2" />}
            {confirmLabel}
          </button>
        </>
      }
    >
      <p className="mb-0">{message}</p>
    </Modal>
  );
}

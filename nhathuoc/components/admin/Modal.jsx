"use client";

import { useEffect } from "react";

export default function Modal({ show, title, onClose, children, footer, size }) {
  useEffect(() => {
    if (!show) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [show, onClose]);

  if (!show) return null;

  return (
    <div className="pm-modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className={`pm-modal ${size === "lg" ? "pm-modal-lg" : ""}`}>
        <div className="pm-modal-header">
          <h5 className="mb-0 fw-bold" style={{ color: "#123934" }}>{title}</h5>
          <button type="button" className="btn-close" onClick={onClose} aria-label="Đóng" />
        </div>
        <div className="pm-modal-body">{children}</div>
        {footer && <div className="pm-modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

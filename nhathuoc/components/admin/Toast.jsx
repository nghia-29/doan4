"use client";

import { useCallback, useRef, useState } from "react";

export function useToasts() {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const push = useCallback((message, variant = "success") => {
    const id = ++idRef.current;
    setToasts((t) => [...t, { id, message, variant }]);
    setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, 3500);
  }, []);

  const dismiss = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  return { toasts, push, dismiss };
}

export function ToastStack({ toasts, onDismiss }) {
  if (!toasts.length) return null;
  return (
    <div
      className="position-fixed d-flex flex-column gap-2"
      style={{ top: 16, right: 16, zIndex: 2000, maxWidth: 340 }}
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`toast show align-items-center text-white bg-${t.variant} border-0 shadow`}
          role="alert"
        >
          <div className="d-flex">
            <div className="toast-body">{t.message}</div>
            <button
              className="btn-close btn-close-white me-2 m-auto"
              onClick={() => onDismiss(t.id)}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

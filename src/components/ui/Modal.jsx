// Modal + ConfirmModal — overlay dialogs with escape + backdrop dismiss.
import { useEffect } from "react";
import { Button } from "./Button.jsx";
const cx = (...c) => c.filter(Boolean).join(" ");

export function Modal({ open, onClose, danger, labelledBy, className, children }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") onClose?.(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="pi-overlay" onClick={onClose}>
      <div
        role="dialog" aria-modal="true" aria-labelledby={labelledBy}
        className={cx("pi-modal", danger && "pi-modal--danger", className)}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

// Destructive-action confirmation. Cancel is the default focus (safe).
export function ConfirmModal({
  open, onCancel, onConfirm, title, body,
  confirmLabel = "Confirmer", cancelLabel = "Annuler", danger = true,
}) {
  return (
    <Modal open={open} onClose={onCancel} danger={danger} labelledBy="pi-confirm-title">
      <h2 id="pi-confirm-title"
        style={{ fontFamily: "var(--pi-font-display)", fontWeight: 900, fontStyle: "italic",
                 fontSize: "var(--pi-fs-section)", color: "var(--pi-text)", marginBottom: "var(--pi-s2)" }}>
        {title}
      </h2>
      {body && <p style={{ color: "var(--pi-text-2)", fontSize: "var(--pi-fs-body)", marginBottom: "var(--pi-s6)" }}>{body}</p>}
      <div style={{ display: "flex", gap: "var(--pi-s2)" }}>
        <Button variant="secondary" block onClick={onCancel} autoFocus>{cancelLabel}</Button>
        <Button variant={danger ? "danger" : "primary"} block onClick={onConfirm}>{confirmLabel}</Button>
      </div>
    </Modal>
  );
}

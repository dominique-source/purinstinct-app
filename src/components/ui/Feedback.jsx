// EmptyState / LoadingState / Skeleton / Spinner — non-content states.
const cx = (...c) => c.filter(Boolean).join(" ");

export function EmptyState({ icon, title, children, action, className }) {
  return (
    <div className={cx("pi-empty", className)}>
      {icon && <div className="pi-empty__icon" aria-hidden="true">{icon}</div>}
      {title && <div className="pi-empty__title">{title}</div>}
      {children && <div style={{ fontSize: "var(--pi-fs-body)", color: "var(--pi-text-3)", maxWidth: 280 }}>{children}</div>}
      {action}
    </div>
  );
}

export function LoadingState({ label = "Chargement…" }) {
  return (
    <div className="pi-empty" role="status" aria-live="polite">
      <span className="pi-spinner" aria-hidden="true" />
      <div style={{ fontSize: "var(--pi-fs-body)", color: "var(--pi-text-3)" }}>{label}</div>
    </div>
  );
}

export function Skeleton({ width = "100%", height = 16, radius, style }) {
  return <span className="pi-skeleton" style={{ display: "block", width, height, borderRadius: radius, ...style }} aria-hidden="true" />;
}

export function Spinner({ style }) {
  return <span className="pi-spinner" style={style} role="status" aria-label="Chargement" />;
}

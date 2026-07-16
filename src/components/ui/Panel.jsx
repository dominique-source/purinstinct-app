// Panel — the canonical surface container. Replaces ad-hoc card divs.
// variant: default | raised | hero   flush = no padding (media/lists)
const cx = (...c) => c.filter(Boolean).join(" ");

export function Panel({ variant = "default", flush, className, style, children, ...rest }) {
  return (
    <div
      className={cx("pi-panel", variant !== "default" && `pi-panel--${variant}`, flush && "pi-panel--flush", className)}
      style={style}
      {...rest}
    >
      {children}
    </div>
  );
}

// Eyebrow — the uppercase section label used across the app.
export function Eyebrow({ className, children, ...rest }) {
  return <div className={cx("pi-eyebrow", className)} {...rest}>{children}</div>;
}

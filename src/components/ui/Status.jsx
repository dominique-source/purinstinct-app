// Badge + LiveIndicator — status primitives.
// Status is never color-only: LiveIndicator always renders a "LIVE" label
// and a shape (pulsing dot); Badge renders text.
const cx = (...c) => c.filter(Boolean).join(" ");

export function Badge({ tone = "neutral", className, children, ...rest }) {
  return (
    <span className={cx("pi-badge", tone !== "neutral" && `pi-badge--${tone}`, className)} {...rest}>
      {children}
    </span>
  );
}

export function LiveIndicator({ label = "LIVE", className, ...rest }) {
  return (
    <span className={cx("pi-live", className)} {...rest}>
      <span className="pi-live__dot" aria-hidden="true" />
      {label}
    </span>
  );
}

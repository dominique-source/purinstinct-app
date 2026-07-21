// Button / IconButton — design-system primitives.
// Variants: primary | secondary | ghost | danger | outline
// Sizes: sm | md | lg | xl   Modifiers: block, cut, loading
const cx = (...c) => c.filter(Boolean).join(" ");

export function Button({
  variant = "secondary", size = "md", block, cut, loading, disabled,
  className, children, ...rest
}) {
  return (
    <button
      className={cx(
        "pi-btn",
        `pi-btn--${variant}`,
        size !== "md" && `pi-btn--${size}`,
        block && "pi-btn--block",
        cut && "pi-btn--cut",
        className
      )}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading && <span className="pi-spinner" aria-hidden="true" />}
      {children}
    </button>
  );
}

export function IconButton({ label, className, children, ...rest }) {
  return (
    <button className={cx("pi-iconbtn", className)} aria-label={label} title={label} {...rest}>
      {children}
    </button>
  );
}

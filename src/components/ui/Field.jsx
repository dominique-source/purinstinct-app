// Field / Input — labelled text input with error state.
import { useId } from "react";
const cx = (...c) => c.filter(Boolean).join(" ");

export function Field({ label, error, hint, className, inputProps = {}, ...rest }) {
  const id = useId();
  return (
    <div className={cx("pi-field", className)} {...rest}>
      {label && <label className="pi-field__label" htmlFor={id}>{label}</label>}
      <input
        id={id}
        className="pi-input"
        aria-invalid={error ? "true" : undefined}
        aria-describedby={error ? `${id}-err` : hint ? `${id}-hint` : undefined}
        {...inputProps}
      />
      {error && <span id={`${id}-err`} className="pi-field__error" role="alert">{error}</span>}
      {!error && hint && <span id={`${id}-hint`} style={{ fontSize: "var(--pi-fs-label)", color: "var(--pi-text-3)" }}>{hint}</span>}
    </div>
  );
}

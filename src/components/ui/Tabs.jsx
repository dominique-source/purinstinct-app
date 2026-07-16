// Tabs — segmented control. Roving-tabindex keyboard support (arrows).
import { useRef } from "react";
const cx = (...c) => c.filter(Boolean).join(" ");

// items: [{ id, label }]   value: active id   onChange(id)
export function Tabs({ items, value, onChange, className, ...rest }) {
  const ref = useRef(null);
  const onKey = (e) => {
    const i = items.findIndex((t) => t.id === value);
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      const next = e.key === "ArrowRight"
        ? items[(i + 1) % items.length]
        : items[(i - 1 + items.length) % items.length];
      onChange(next.id);
    }
  };
  return (
    <div ref={ref} className={cx("pi-tabs", className)} role="tablist" onKeyDown={onKey} {...rest}>
      {items.map((t) => {
        const active = t.id === value;
        return (
          <button
            key={t.id}
            role="tab"
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            className={cx("pi-tab", active && "is-active")}
            onClick={() => onChange(t.id)}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

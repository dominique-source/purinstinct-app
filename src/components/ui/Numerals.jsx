// Timer / ScoreDisplay — broadcast numeral primitives (tabular, italic display).
import { useCountUp } from "../../hooks/useCountUp.js";
const cx = (...c) => c.filter(Boolean).join(" ");

// Timer: pre-formatted string (e.g. "74:59"); tone drives color.
export function Timer({ value, tone, size, className, style }) {
  const color =
    tone === "live" ? "var(--pi-lime)" :
    tone === "paused" ? "var(--pi-warn)" :
    tone === "ended" ? "var(--pi-danger)" : "var(--pi-text-3)";
  return (
    <span className={cx("pi-timer", className)} style={{ color, fontSize: size, ...style }}>
      {value}
    </span>
  );
}

// ScoreDisplay: animated count-up numeral. `flash` triggers a bump on change.
export function ScoreDisplay({ value, animate = true, unit, size, color, className, style }) {
  const shown = useCountUp(animate ? (Number(value) || 0) : value);
  return (
    <span className={cx("pi-score", className)} style={{ fontSize: size, color, ...style }}>
      {animate ? shown : value}{unit && <span style={{ fontSize: "0.42em", marginLeft: 3 }}>{unit}</span>}
    </span>
  );
}

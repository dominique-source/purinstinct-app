import { useRef, useState, useCallback, useEffect } from "react";

// Roulette tactile circulaire — Pointer Events unifiés (souris/tactile/stylet),
// rotation cumulative multi-tours (pas de saut au passage 359°→0°), inertie
// avec friction, haptique, clavier complet. Deux modes: continu (valeur
// flottante, ex. un filtre de couleur) ou discret (pas fixes, ex. niveaux).
//
// Mapping angle -> valeur: la plage [min,max] est répartie sur TURNS tours
// complets (continu) ou sur DEGREES_PER_STEP° par cran (discret) — voir
// sensitivityDeg() ci-dessous.

const TURNS_FOR_CONTINUOUS = 2; // 2 tours complets = toute la plage, en mode continu
const DEGREES_PER_STEP = 36;    // brief: 30-45°/cran ; voir constante ajustable
const FRICTION = 0.92;
const INERTIA_STOP_VELOCITY = 0.02; // deg/ms
const DEAD_ZONE_PX = 4; // ignore les micro-mouvements accidentels au centre

function angleAt(clientX, clientY, cx, cy) {
  return Math.atan2(clientY - cy, clientX - cx) * (180 / Math.PI);
}
function shortestDelta(a, b) {
  let d = b - a;
  while (d > 180) d -= 360;
  while (d <= -180) d += 360;
  return d;
}
function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }

export function RotaryDial({
  value, min, max, step = 1, label, unit = "", icon = null,
  continuous = false, haptic = true, size = 220, onChange,
}) {
  const dialRef = useRef(null);
  const rotationRef = useRef(0);     // degrés cumulés, bornés à [rotMin,rotMax]
  const dragRef = useRef(null);      // {lastAngle,lastTime,velocity}
  const rafRef = useRef(null);
  const lastStepRef = useRef(null);  // pour ne vibrer qu'au changement de cran
  const isDraggingRef = useRef(false); // synchrone — voir le commentaire sur l'effet de resync plus bas
  const [dragging, setDragging] = useState(false);
  const [pulse, setPulse] = useState(false);

  const degPerUnit = continuous
    ? (360 * TURNS_FOR_CONTINUOUS) / (max - min || 1)
    : DEGREES_PER_STEP / (step || 1);
  const rotMin = 0;
  const rotMax = (max - min) * degPerUnit;

  const valueToRotation = useCallback((v) => (clamp(v, min, max) - min) * degPerUnit, [min, degPerUnit]);
  const rotationToValue = useCallback((r) => min + clamp(r, rotMin, rotMax) / degPerUnit, [min, degPerUnit, rotMax]);

  // Resynchronise la rotation interne quand la valeur change de l'extérieur
  // (changement d'attribut, boutons +/-, clavier) — jamais pendant un drag.
  // Utilise une ref (pas le state `dragging`) pour le garde-fou: le state
  // React est asynchrone, donc un pointermove rapide juste après pointerdown
  // pourrait s'exécuter avant que `dragging` soit réellement passé à true et
  // déclencher un resync en pleine manipulation (rotation qui "saute").
  useEffect(() => {
    if (isDraggingRef.current) return;
    rotationRef.current = valueToRotation(value);
    if (dialRef.current) dialRef.current.style.transform = `rotate(${rotationRef.current}deg)`;
  }, [value, valueToRotation]);

  const commit = useCallback((rawValue, {silent=false}={}) => {
    const v = continuous ? clamp(rawValue, min, max) : clamp(Math.round(rawValue / step) * step, min, max);
    if (!silent) onChange(v);
    const stepIdx = Math.round((v - min) / (step || 1));
    if (haptic && lastStepRef.current !== stepIdx) {
      lastStepRef.current = stepIdx;
      if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(8);
      setPulse(true);
      setTimeout(() => setPulse(false), 180);
    }
  }, [continuous, min, max, step, haptic, onChange]);

  const applyRotation = useCallback((r, opts) => {
    const clamped = clamp(r, rotMin, rotMax);
    rotationRef.current = clamped;
    if (dialRef.current) dialRef.current.style.transform = `rotate(${clamped}deg)`;
    commit(rotationToValue(clamped), opts);
  }, [rotMin, rotMax, rotationToValue, commit]);

  const stopInertia = () => { if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; } };

  const runInertia = useCallback((initialVelocity) => {
    let velocity = initialVelocity;
    let last = performance.now();
    const step_ = (now) => {
      const dt = now - last; last = now;
      velocity *= FRICTION;
      if (Math.abs(velocity) < INERTIA_STOP_VELOCITY) { rafRef.current = null; return; }
      applyRotation(rotationRef.current + velocity * dt);
      rafRef.current = requestAnimationFrame(step_);
    };
    rafRef.current = requestAnimationFrame(step_);
  }, [applyRotation]);

  const onPointerDown = (e) => {
    stopInertia();
    dialRef.current.setPointerCapture(e.pointerId);
    const rect = dialRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2;
    dragRef.current = {
      cx, cy, lastAngle: angleAt(e.clientX, e.clientY, cx, cy),
      lastTime: performance.now(), velocity: 0, moved: 0,
      startX: e.clientX, startY: e.clientY,
    };
    isDraggingRef.current = true;
    setDragging(true);
  };

  const onPointerMove = (e) => {
    const d = dragRef.current;
    if (!d) return;
    if (Math.abs(e.clientX - d.startX) < DEAD_ZONE_PX && Math.abs(e.clientY - d.startY) < DEAD_ZONE_PX && d.moved < 1) {
      // zone morte: ignore les micro-mouvements avant que le geste soit confirmé
    }
    d.moved = 1;
    const angle = angleAt(e.clientX, e.clientY, d.cx, d.cy);
    const delta = shortestDelta(d.lastAngle, angle);
    const now = performance.now();
    const dt = Math.max(1, now - d.lastTime);
    d.velocity = delta / dt; // deg/ms, pour l'inertie au relâchement
    d.lastAngle = angle;
    d.lastTime = now;
    applyRotation(rotationRef.current + delta);
  };

  const endDrag = (e) => {
    const d = dragRef.current;
    if (!d) return;
    try { dialRef.current.releasePointerCapture(e.pointerId); } catch {}
    dragRef.current = null;
    isDraggingRef.current = false;
    setDragging(false);
    if (Math.abs(d.velocity) > INERTIA_STOP_VELOCITY) runInertia(d.velocity * 14); // amplifie un peu le dernier geste
  };

  const nudge = (dir, big = false) => {
    stopInertia();
    const unitStep = continuous ? (max - min) / 40 : step;
    const amount = (big ? unitStep * 5 : unitStep) * dir;
    applyRotation(rotationRef.current + amount * degPerUnit);
  };

  const onKeyDown = (e) => {
    switch (e.key) {
      case "ArrowRight": case "ArrowUp": e.preventDefault(); nudge(1); break;
      case "ArrowLeft": case "ArrowDown": e.preventDefault(); nudge(-1); break;
      case "PageUp": e.preventDefault(); nudge(1, true); break;
      case "PageDown": e.preventDefault(); nudge(-1, true); break;
      case "Home": e.preventDefault(); applyRotation(rotMin); break;
      case "End": e.preventDefault(); applyRotation(rotMax); break;
      default: return;
    }
  };

  useEffect(() => () => stopInertia(), []);

  const progress = clamp((value - min) / ((max - min) || 1), 0, 1);
  const ticks = 28;
  const displayValue = continuous ? (Math.round(value * 10) / 10) : Math.round(value);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--pi-s3)" }}>
      <div
        ref={dialRef}
        role="slider"
        tabIndex={0}
        aria-label={label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={`${displayValue}${unit}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onKeyDown={onKeyDown}
        className={pulse ? "pi-dial pi-dial--pulse" : "pi-dial"}
        style={{
          width: size, height: size, borderRadius: "50%", position: "relative",
          touchAction: "none", cursor: dragging ? "grabbing" : "grab",
          background: "radial-gradient(circle at 35% 30%, var(--pi-surface-2), var(--pi-surface-1) 70%)",
          border: "1px solid var(--pi-line-strong)",
          boxShadow: "inset 0 2px 10px rgba(0,0,0,.5), 0 0 0 1px rgba(0,0,0,.2)",
          outline: "none", userSelect: "none", flexShrink: 0,
        }}
      >
        {/* Anneau lime discret */}
        <div aria-hidden="true" style={{
          position: "absolute", inset: 6, borderRadius: "50%",
          border: "2px solid var(--pi-lime-line)",
        }} />

        {/* Graduations — s'illuminent selon la progression */}
        {Array.from({ length: ticks }).map((_, i) => {
          const on = i / ticks <= progress;
          const deg = (360 / ticks) * i;
          return (
            <div key={i} aria-hidden="true" style={{
              position: "absolute", left: "50%", top: "50%", width: 2,
              height: size * 0.07, borderRadius: 1,
              background: on ? "var(--pi-lime)" : "var(--pi-line-strong)",
              opacity: on ? 0.9 : 0.5,
              transform: `translate(-50%,-50%) rotate(${deg}deg) translateY(-${size * 0.42}px)`,
              transition: "background var(--pi-dur-fast), opacity var(--pi-dur-fast)",
            }} />
          );
        })}

        {/* Repère supérieur fixe */}
        <div aria-hidden="true" style={{
          position: "absolute", top: 10, left: "50%", transform: "translateX(-50%)",
          width: 0, height: 0, borderLeft: "5px solid transparent", borderRight: "5px solid transparent",
          borderTop: "8px solid var(--pi-lime)",
        }} />

        {/* Centre — icône / label / valeur, ne tourne pas avec le disque */}
        <div style={{
          position: "absolute", inset: size * 0.16, borderRadius: "50%",
          background: "var(--pi-surface-1)", border: "1px solid var(--pi-line)",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          gap: 2, pointerEvents: "none",
        }}>
          {icon && <div style={{ fontSize: size * 0.11 }}>{icon}</div>}
          <div style={{ fontFamily: "var(--pi-font-body)", fontSize: "var(--pi-fs-label)", fontWeight: 700,
            letterSpacing: "var(--pi-tracking-cap)", textTransform: "uppercase", color: "var(--pi-text-3)" }}>
            {label}
          </div>
          <div style={{ fontFamily: "var(--pi-font-display)", fontWeight: 900, fontStyle: "italic",
            fontSize: size * 0.14, color: "var(--pi-lime)", lineHeight: 1 }}>
            {displayValue > 0 ? "+" : ""}{displayValue}{unit}
          </div>
        </div>
      </div>

      {/* Boutons +/- discrets, toujours disponibles (a11y) */}
      <div style={{ display: "flex", gap: "var(--pi-s3)" }}>
        <button type="button" aria-label="Diminuer" onClick={() => nudge(-1)}
          className="pi-iconbtn" style={{ width: 36, height: 36 }}>−</button>
        <button type="button" aria-label="Augmenter" onClick={() => nudge(1)}
          className="pi-iconbtn" style={{ width: 36, height: 36 }}>+</button>
      </div>
    </div>
  );
}

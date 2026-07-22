import { useState } from "react";

// Carte "portrait sélectionnable" réutilisée pour le sélecteur Étape d'âge
// et la galerie "Choisis ton look". Gère son propre fallback si l'image
// ne charge pas (silhouette générique) — voir onError.
export function PortraitOption({ imgSrc, label, sublabel, selected, onSelect, size = 72 }) {
  const [broken, setBroken] = useState(false);
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      aria-label={label}
      className="pi-portrait-option"
      style={{
        display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
        background: "none", border: "none", cursor: "pointer", padding: "var(--pi-s1)",
        borderRadius: "var(--pi-r-md)",
      }}
    >
      <span style={{
        position: "relative", width: size, height: size, borderRadius: "50%",
        overflow: "hidden", flexShrink: 0,
        background: "var(--pi-surface-2)",
        border: selected ? "2px solid var(--pi-lime)" : "2px solid var(--pi-line-strong)",
        boxShadow: selected ? "0 0 14px var(--pi-lime-glow)" : "none",
        transition: "border-color var(--pi-dur-fast), box-shadow var(--pi-dur-fast)",
      }}>
        {imgSrc && !broken ? (
          <img src={imgSrc} alt="" onError={() => setBroken(true)}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        ) : (
          <span aria-hidden="true" style={{
            width: "100%", height: "100%", display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: size * 0.4, color: "var(--pi-text-3)",
          }}>👤</span>
        )}
        {selected && (
          <span aria-hidden="true" style={{
            position: "absolute", bottom: -1, right: -1, width: 18, height: 18,
            borderRadius: "50%", background: "var(--pi-lime)", color: "var(--pi-lime-ink)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 11, fontWeight: 900, border: "2px solid var(--pi-surface-1)",
          }}>✓</span>
        )}
      </span>
      {label && (
        <span style={{
          fontFamily: "var(--pi-font-body)", fontSize: "var(--pi-fs-label)", fontWeight: 700,
          color: selected ? "var(--pi-lime)" : "var(--pi-text-2)", textTransform: "uppercase",
          letterSpacing: "var(--pi-tracking-cap)", textAlign: "center", lineHeight: 1.2,
        }}>
          {label}
        </span>
      )}
      {sublabel && (
        <span style={{ fontSize: "var(--pi-fs-meta)", color: "var(--pi-text-3)", textAlign: "center" }}>
          {sublabel}
        </span>
      )}
    </button>
  );
}

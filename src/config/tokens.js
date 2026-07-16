// JS bridge to the CSS design tokens (src/styles/tokens.css).
// Inline styles read literal hex here (the alpha-append pattern `color+"18"`
// needs real hex, not var()). Keep these in lock-step with tokens.css.
export const COLOR = {
  bg:            "#0A0A0A",   // arena base (matches --pi-bg)
  surface:       "#121316",   // cards      (--pi-surface-1)
  surfaceRaised: "#191A1F",   // inputs     (--pi-surface-2)
  border:        "#26272E",   // hairline   (--pi-line)
  borderStrong:  "#383A42",   // emphasized (--pi-line-strong)
  text:          "#FFFFFF",
  textSecondary: "#A6A8B0",
  textMuted:     "#6C6E78",
  lime:          "#B8E020",   // signature accent (--pi-lime)
  limeSurface:   "#12160A",   // lime-tinted well
  danger:        "#FF453A",
  dangerDeep:    "#E0362C",
  warning:       "#FFB020",
};

export const SPACE = { xs:4, sm:8, md:12, lg:16, xl:24, xxl:32, xxxl:48 };

export const RADIUS = { sm:6, md:10, lg:14, xl:14, xxl:20, round:"50%" };

export const FONT = {
  display: "'Barlow Condensed',sans-serif", // titres, scores, chyrons — 900 italique
  body:    "'DM Sans',sans-serif",
};

export const SHADOW = {
  card:  "0 8px 24px rgba(0,0,0,.55)",
  float: "0 16px 48px rgba(0,0,0,.65)",
  // Rim-light façon plateau TV: halo coloré doux autour d'un élément d'emphase
  glow:  (hex,strength=.35)=>`0 0 24px ${hex}${Math.round(strength*255).toString(16).padStart(2,"0")}`,
};

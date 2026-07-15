// Design tokens — source unique de l'identité visuelle "futur du sport".
// Toute couleur/espacement/rayon partagé vit ici; styles.js et fonts.js les consomment.
export const COLOR = {
  bg:            "#06070f",   // fond studio (cyclorama noir)
  surface:       "#0d0f1a",   // cartes
  surfaceRaised: "#111827",   // inputs, éléments surélevés
  border:        "#1f2937",
  borderStrong:  "#374151",
  text:          "#ffffff",
  textSecondary: "#9ca3af",
  textMuted:     "#4b5563",
  lime:          "#84cc16",   // accent de marque — actions primaires, live, scores
  limeSurface:   "#111a05",   // surface teintée lime (fonds de CTA/héros)
  danger:        "#ef4444",
  dangerDeep:    "#dc2626",
  warning:       "#f59e0b",
};

export const SPACE = { xs:4, sm:8, md:12, lg:16, xl:24, xxl:32, xxxl:48 };

export const RADIUS = { sm:6, md:10, lg:12, xl:16, xxl:20, round:"50%" };

export const FONT = {
  display: "'Barlow Condensed',sans-serif", // titres, scores, chyrons — 900 italique
  body:    "'DM Sans',sans-serif",
};

export const SHADOW = {
  card:  "0 8px 24px rgba(0,0,0,.5)",
  float: "0 10px 40px rgba(0,0,0,.6)",
  // Rim-light façon plateau TV: halo coloré doux autour d'un élément d'emphase
  glow:  (hex,strength=.35)=>`0 0 24px ${hex}${Math.round(strength*255).toString(16).padStart(2,"0")}`,
};

// Fonts now load via <link> in index.html; keyframes, reset, focus and
// reduced-motion rules live globally in src/styles/base.css.
// `FONTS` is kept as an empty export for backwards-compat with the many
// screens that still render <style>{FONTS}</style>; those call sites are
// being removed screen-by-screen during the redesign migration.
export const FONTS = "";

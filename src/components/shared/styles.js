import { COLOR, RADIUS, FONT, SHADOW } from "../../config/tokens.js";

// Coin coupé façon HUD/broadcast — remplace le radius uniforme sur les cartes d'emphase
const cut=(px)=>`polygon(${px}px 0, 100% 0, 100% calc(100% - ${px}px), calc(100% - ${px}px) 100%, 0 100%, 0 ${px}px)`;

export const S = {
  card:(extra)=>({ borderRadius:RADIUS.xl, padding:14, background:COLOR.surface, border:"1px solid "+COLOR.border, ...extra }),
  btn:(color,extra)=>({ padding:"8px 16px", borderRadius:RADIUS.md, border:"none", cursor:"pointer", fontWeight:700, fontSize:13,
    background:color||COLOR.border, color:color?"#000":COLOR.textSecondary,
    boxShadow:color?SHADOW.glow(color,.18):"none", ...extra }),
  tag:(color,extra)=>({ padding:"2px 8px", borderRadius:RADIUS.sm, fontSize:11, fontWeight:600, background:color+"18", color:color, ...extra }),
  label:(extra)=>({ fontSize:11, color:COLOR.textMuted, textTransform:"uppercase", letterSpacing:"3px", fontWeight:600, ...extra }),
  row:(extra)=>({ display:"flex", alignItems:"center", gap:10, ...extra }),
  backBtn:{ padding:"10px 20px", borderRadius:RADIUS.lg, border:"1px solid "+COLOR.borderStrong, background:COLOR.surfaceRaised,
    color:"#e5e7eb", cursor:"pointer", fontFamily:FONT.display,
    fontWeight:700, fontSize:16, letterSpacing:1, display:"inline-flex", alignItems:"center", gap:8 },

  // --- Langage broadcast/HUD ---
  // Titre/score façon lower-third TV: Barlow 900 italique
  display:(size,extra)=>({ fontFamily:FONT.display, fontWeight:900, fontStyle:"italic", fontSize:size||22,
    letterSpacing:.5, lineHeight:1, ...extra }),
  // Point "LIVE" pulsant standardisé — à combiner avec className="pulse-lime"
  liveDot:(color,size=9)=>({ width:size, height:size, borderRadius:"50%", flexShrink:0,
    background:color||COLOR.dangerDeep, boxShadow:SHADOW.glow(color||COLOR.dangerDeep,.55) }),
  // Étiquette LIVE standardisée (remplace les S.tag("#dc2626") + pulse-lime ad hoc)
  liveTag:(color,extra)=>({ padding:"2px 8px", borderRadius:RADIUS.sm, fontSize:11, fontWeight:700,
    display:"inline-flex", alignItems:"center", gap:6, letterSpacing:1,
    background:(color||COLOR.dangerDeep)+"18", color:color||COLOR.dangerDeep, ...extra }),
  // Carte héros: coin coupé + rim-light coloré + fine texture scanline, pour les moments broadcast
  heroCard:(color,extra)=>({ padding:18, background:COLOR.surface, border:"1px solid "+(color||COLOR.lime)+"50",
    // drop-shadow (pas box-shadow): un clip-path rognerait le halo
    clipPath:cut(14), filter:`drop-shadow(0 0 14px ${(color||COLOR.lime)}38)`,
    backgroundImage:`repeating-linear-gradient(0deg, transparent 0 3px, ${(color||COLOR.lime)}06 3px 4px)`, ...extra }),
  clip:cut,
};

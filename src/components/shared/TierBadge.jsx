import { TIERS, getSprintTier } from "../../config/zones.js";

// Sprint handicap tier. The slanted chyron clip is the broadcast signature;
// t.color is functional (tier identity), so it stays a literal hex.
export function TierBadge({score}){
  const tier=getSprintTier(score);
  const t=TIERS[tier];
  return(
    <div title={t.pos} style={{padding:"2px 7px",fontSize:"var(--pi-fs-label)",fontWeight:700,fontStyle:"italic",letterSpacing:.5,
      background:t.color+"22",color:t.color,fontFamily:"var(--pi-font-display)",flexShrink:0,
      clipPath:"polygon(4px 0, 100% 0, calc(100% - 4px) 100%, 0 100%)"}}>
      {t.label}
    </div>
  );
}

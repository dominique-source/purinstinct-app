import { TIERS, getSprintTier } from "../../config/zones.js";

export function TierBadge({score}){
  const tier=getSprintTier(score);
  const t=TIERS[tier];
  return(
    <div style={{padding:"2px 7px",fontSize:11,fontWeight:700,fontStyle:"italic",letterSpacing:.5,
      background:t.color+"22",color:t.color,fontFamily:"'Barlow Condensed',sans-serif",flexShrink:0,
      clipPath:"polygon(4px 0, 100% 0, calc(100% - 4px) 100%, 0 100%)"}}>
      {t.label}
    </div>
  );
}

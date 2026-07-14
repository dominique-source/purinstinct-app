import { TIERS, getSprintTier } from "../../config/zones.js";

export function TierBadge({score}){
  const tier=getSprintTier(score);
  const t=TIERS[tier];
  return(
    <div style={{padding:"2px 7px",borderRadius:6,fontSize:11,fontWeight:700,
      background:t.color+"22",color:t.color,fontFamily:"'Barlow Condensed',sans-serif",flexShrink:0}}>
      {t.label}
    </div>
  );
}

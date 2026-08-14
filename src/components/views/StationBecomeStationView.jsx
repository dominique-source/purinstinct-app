import { FONTS } from "../../config/fonts.js";
import { ZONES, ZK } from "../../config/zones.js";
import { useZn, useT } from "../../hooks/useLang.js";
import { S } from "../shared/styles.js";

// Sélecteur de zone atteint depuis le menu Admin ("Devenir responsable de
// plateau") — accès admin déjà validé (PIN 1111), donc saute tout droit dans
// la session de la zone choisie (StationView), sans repasser par le QR/PIN
// 2222 de cette zone.
export function StationBecomeStationView({disabledZones,onPickZone,onBack}){
  const t=useT();
  const zn=useZn();

  return(
    <div style={{minHeight:"100svh",background:"#0A0A0A",fontFamily:"'DM Sans',sans-serif",
      display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24}}>
      <style>{FONTS}</style>
      <div style={{width:"100%",maxWidth:380}}>
        {onBack&&<button onClick={onBack} style={{padding:"8px 14px",borderRadius:10,
          background:"#111827",border:"1px solid #B8E02040",color:"#B8E020",cursor:"pointer",
          fontSize:13,fontWeight:700,marginBottom:16}}>
          {t.back}
        </button>}
        <div style={{color:"#fff",fontWeight:700,fontSize:18,fontFamily:"'Barlow Condensed',sans-serif",
          textTransform:"uppercase",letterSpacing:.5,marginBottom:16,textAlign:"center"}}>
          {t.stationAdminPickZoneTitle}
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {ZK.map(zk=>{
            const z=ZONES[zk]; const zl=zn(zk);
            const isOff=(disabledZones||[]).includes(zk);
            return(
              <button key={zk} onClick={()=>onPickZone(zk)}
                style={{padding:"14px 16px",border:"1px solid "+(isOff?"#ef444440":z.border),clipPath:S.clip(10),
                  background:isOff?"#1a0a0a":z.bg,color:isOff?"#ef4444":z.color,cursor:"pointer",
                  display:"flex",alignItems:"center",gap:12,opacity:isOff?0.7:1}}>
                <span style={{fontSize:22}}>{z.icon}</span>
                <span style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontStyle:"italic",fontSize:16,letterSpacing:.5,flex:1,textAlign:"left"}}>{zl.name}</span>
                {isOff&&<span style={{fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:10,
                  background:"#ef444420",color:"#ef4444",border:"1px solid #ef444440"}}>{t.stationDisabled}</span>}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

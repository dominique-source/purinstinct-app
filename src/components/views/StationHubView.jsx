import { FONTS } from "../../config/fonts.js";
import { ZONES } from "../../config/zones.js";
import { useZn, useT } from "../../hooks/useLang.js";
import { LangFooter } from "../shared/LangFooter.jsx";
import { Wordmark } from "./LiveLoginView.jsx";

// Menu atteint via le code QR d'une station (?stationHub=ZONE) — le
// responsable de plateau scanne, tombe ici, et choisit son mode: gérer la
// partie en cours, corriger le profil d'un joueur, ou juste enchaîner les
// scans pour remplir la file. Trois écrans dédiés plutôt qu'un seul écran
// surchargé — chacun reste simple pour son usage précis. Onglet Admin
// (PIN séparé, ADMIN_PIN) pour les actions transverses (profil, bracelets,
// changer de plateau) — voir StationAdminHubView.
export function StationHubView({zone,onEnterSession,onLookupPlayer,onScanNext,onGoAdmin}){
  const t=useT();
  const zn=useZn();
  const z=ZONES[zone];
  const zl=zn(zone);

  const tiles=[
    {icon:"🎮",label:t.stationHubEnterSession,sub:t.stationHubEnterSessionSub,color:z.color,action:onEnterSession},
    {icon:"🔍",label:t.stationHubLookupPlayer,sub:t.stationHubLookupPlayerSub,color:"#3b82f6",action:onLookupPlayer},
    {icon:"📶",label:t.stationHubScanNext,sub:t.stationHubScanNextSub,color:"#B8E020",action:onScanNext},
    {icon:"🛡️",label:t.stationHubAdmin,sub:t.stationHubAdminSub,color:"#9ca3af",action:onGoAdmin},
  ];

  return(
    <div style={{minHeight:"100svh",background:"#0A0A0A",fontFamily:"'DM Sans',sans-serif",
      display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24}}>
      <style>{FONTS}</style>
      <Wordmark/>
      <div style={{textAlign:"center",marginBottom:32}}>
        <div style={{fontSize:36,marginBottom:8}}>{z.icon}</div>
        <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontStyle:"italic",fontSize:22,color:"#fff"}}>{zl.name}</div>
        <div style={{fontSize:12,color:"#4b5563",marginTop:4}}>{t.stationHubTitle}</div>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:12,width:"100%",maxWidth:360}}>
        {tiles.map(({icon,label,sub,color,action})=>(
          <button key={label} onClick={action}
            style={{padding:"20px 18px",border:"1px solid "+color+"30",borderRadius:16,
              background:"#0d0f1a",cursor:"pointer",textAlign:"left",
              display:"flex",alignItems:"center",gap:16,
              transition:"all .15s"}}
            onMouseEnter={e=>{e.currentTarget.style.background=color+"15";e.currentTarget.style.borderColor=color+"80";}}
            onMouseLeave={e=>{e.currentTarget.style.background="#0d0f1a";e.currentTarget.style.borderColor=color+"30";}}>
            <div style={{fontSize:30,flexShrink:0}}>{icon}</div>
            <div>
              <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontStyle:"italic",fontSize:17,color:"#fff",lineHeight:1.2}}>{label}</div>
              <div style={{fontSize:12,color:"#4b5563",marginTop:2}}>{sub}</div>
            </div>
          </button>
        ))}
      </div>
      <LangFooter/>
    </div>
  );
}

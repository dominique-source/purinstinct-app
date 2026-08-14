import { FONTS } from "../../config/fonts.js";
import { ZONES } from "../../config/zones.js";
import { useZn, useT } from "../../hooks/useLang.js";
import { LangFooter } from "../shared/LangFooter.jsx";
import { Wordmark } from "./LiveLoginView.jsx";

// Menu atteint via le code QR d'une station (?stationHub=ZONE) — le
// responsable de plateau scanne, tombe ici, et choisit son mode: gérer la
// partie en cours, ou accéder aux actions admin (profil, bracelets,
// changer de plateau — voir StationAdminHubView). "Lire le profil d'un
// joueur" et "Scanner les prochains joueurs" retirés d'ici: le premier vit
// maintenant sous Admin ("Modifier profil"), le second est redondant avec
// le scan bracelet déjà intégré à la session (StationView) — deux tuiles
// tiennent sur un écran sans scroller, quatre non.
export function StationHubView({zone,onEnterSession,onGoAdmin}){
  const t=useT();
  const zn=useZn();
  const z=ZONES[zone];
  const zl=zn(zone);

  const tiles=[
    {icon:"🎮",label:t.stationHubEnterSession,sub:t.stationHubEnterSessionSub,color:z.color,action:onEnterSession},
    {icon:"🛡️",label:t.stationHubAdmin,sub:t.stationHubAdminSub,color:"#9ca3af",action:onGoAdmin},
  ];

  return(
    <div style={{minHeight:"100svh",background:"#0A0A0A",fontFamily:"'DM Sans',sans-serif",
      display:"flex",flexDirection:"column",alignItems:"center",
      paddingTop:"calc(env(safe-area-inset-top) + 32px)",paddingLeft:24,paddingRight:24,paddingBottom:24}}>
      <style>{FONTS}</style>
      <Wordmark width={80}/>
      <div style={{textAlign:"center",marginBottom:32}}>
        <div style={{fontSize:108,marginBottom:8}}>{z.icon}</div>
        <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontStyle:"italic",fontSize:22,color:"#fff"}}>{zl.name}</div>
        <div style={{fontSize:12,color:"#4b5563",marginTop:4}}>{t.stationHubTitle}</div>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:12,width:"100%",maxWidth:360}}>
        {tiles.map(({icon,label,sub,color,action})=>(
          <button key={label} onClick={action}
            style={{padding:"20px 18px",border:"1px solid "+color+"60",borderRadius:16,
              background:`linear-gradient(135deg, ${color}40 0%, ${color}10 55%, #0d0f1a 100%)`,
              cursor:"pointer",textAlign:"left",
              display:"flex",alignItems:"center",gap:16,
              boxShadow:`0 6px 24px ${color}25`,
              transition:"all .15s"}}
            onMouseEnter={e=>{e.currentTarget.style.background=`linear-gradient(135deg, ${color}60 0%, ${color}20 55%, #0d0f1a 100%)`;e.currentTarget.style.borderColor=color+"a0";}}
            onMouseLeave={e=>{e.currentTarget.style.background=`linear-gradient(135deg, ${color}40 0%, ${color}10 55%, #0d0f1a 100%)`;e.currentTarget.style.borderColor=color+"60";}}>
            <div style={{fontSize:30,flexShrink:0}}>{icon}</div>
            <div>
              <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontStyle:"italic",fontSize:17,color:"#fff",lineHeight:1.2}}>{label}</div>
              <div style={{fontSize:12,color:"#d1d5db",marginTop:2}}>{sub}</div>
            </div>
          </button>
        ))}
      </div>
      <LangFooter/>
    </div>
  );
}

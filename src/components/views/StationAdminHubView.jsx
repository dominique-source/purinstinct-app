import { FONTS } from "../../config/fonts.js";
import { useT } from "../../hooks/useLang.js";
import { LangFooter } from "../shared/LangFooter.jsx";

// Menu atteint via le PIN admin (StationHubPinView, ADMIN_PIN "1111"),
// accessible depuis le bouton Admin de n'importe quelle zone. Même esprit
// que StationHubView: trois écrans dédiés plutôt qu'un seul surchargé.
export function StationAdminHubView({onEditProfile,onCancelBracelet,onBecomeStation,onBack}){
  const t=useT();

  const tiles=[
    {icon:"✏️",label:t.stationAdminEditProfile,sub:t.stationAdminEditProfileSub,color:"#3b82f6",action:onEditProfile},
    {icon:"🚫",label:t.stationAdminCancelBracelet,sub:t.stationAdminCancelBraceletSub,color:"#ef4444",action:onCancelBracelet},
    {icon:"📍",label:t.stationAdminBecomeStation,sub:t.stationAdminBecomeStationSub,color:"#B8E020",action:onBecomeStation},
  ];

  return(
    <div style={{minHeight:"100svh",background:"#0A0A0A",fontFamily:"'DM Sans',sans-serif",
      display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24}}>
      <style>{FONTS}</style>
      <div style={{textAlign:"center",marginBottom:32}}>
        <div style={{fontSize:36,marginBottom:8}}>🛡️</div>
        <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontStyle:"italic",fontSize:22,color:"#fff"}}>{t.stationAdminHubTitle}</div>
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
      {onBack&&<button onClick={onBack} style={{marginTop:24,padding:"10px",borderRadius:10,border:"none",
        background:"none",color:"#6b7280",cursor:"pointer",fontSize:13}}>
        {t.back}
      </button>}
      <LangFooter/>
    </div>
  );
}

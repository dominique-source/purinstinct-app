import { useState } from "react";
import { FONTS } from "../../config/fonts.js";
import { ZONES } from "../../config/zones.js";
import { useZn, useT } from "../../hooks/useLang.js";
import { LangFooter } from "../shared/LangFooter.jsx";
import { STATION_PIN, STATION_HUB_UNLOCKED_KEY } from "../../config/pins.js";
import { NumPad } from "./LiveLoginView.jsx";

// Porte d'entrée du code QR de station (?stationHub=ZONE): un QR imprimé et
// collé au poste peut être photographié/partagé par n'importe qui — ce code
// PIN (même STATION_PIN que le cadran classique) évite qu'un scan trouvé au
// hasard donne un accès direct au menu responsable de plateau.
export function StationHubPinView({zone,onUnlocked}){
  const t=useT();
  const zn=useZn();
  const z=ZONES[zone];
  const zl=zn(zone);
  const [pin,setPin]=useState("");
  const [pinError,setPinError]=useState(false);

  const handleComplete=(value)=>{
    if(value===STATION_PIN){
      setPinError(false);
      sessionStorage.setItem(STATION_HUB_UNLOCKED_KEY,"1");
      onUnlocked();
    } else {
      setPinError(true);
      setPin("");
    }
  };

  return(
    <div style={{minHeight:"100vh",background:"#0A0A0A",fontFamily:"'DM Sans',sans-serif",
      display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24}}>
      <style>{FONTS}</style>
      <div style={{textAlign:"center",marginBottom:32}}>
        <div style={{fontSize:36,marginBottom:8}}>{z.icon}</div>
        <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontStyle:"italic",fontSize:22,color:"#fff"}}>{zl.name}</div>
        <div style={{fontSize:12,color:"#4b5563",marginTop:4}}>{t.stationHubPinPrompt}</div>
      </div>
      {pinError&&<div style={{textAlign:"center",color:"#ef4444",fontSize:13,marginBottom:16}}>{t.stationHubPinError}</div>}
      <NumPad value={pin} onChange={v=>{setPin(v);setPinError(false);}} onComplete={handleComplete}/>
      <LangFooter/>
    </div>
  );
}

import { useState } from "react";
import { FONTS } from "../../config/fonts.js";
import { ZONES } from "../../config/zones.js";
import { useZn, useT } from "../../hooks/useLang.js";
import { LangFooter } from "../shared/LangFooter.jsx";
import { NumPad, Wordmark } from "./LiveLoginView.jsx";

// Porte d'entrée PIN générique — deux usages: (1) QR de station
// (?stationHub=ZONE, zone fourni, expectedPin=STATION_PIN "2222") — un QR
// imprimé peut être photographié/partagé par n'importe qui; (2) menu Admin
// (zone omis, expectedPin=ADMIN_PIN "1111") — accessible depuis n'importe
// quel écran responsable de plateau. persistKey optionnel: si fourni,
// mémorise le déverrouillage en sessionStorage (tient tant que l'onglet
// reste ouvert) — volontairement omis pour l'admin, plus sensible.
export function StationHubPinView({zone,expectedPin,persistKey,onUnlocked}){
  const t=useT();
  const zn=useZn();
  const z=zone?ZONES[zone]:null;
  const zl=zone?zn(zone):null;
  const [pin,setPin]=useState("");
  const [pinError,setPinError]=useState(false);

  const handleComplete=(value)=>{
    if(value===expectedPin){
      setPinError(false);
      if(persistKey) sessionStorage.setItem(persistKey,"1");
      onUnlocked();
    } else {
      setPinError(true);
      setPin("");
    }
  };

  return(
    <div style={{minHeight:"100svh",background:"#0A0A0A",fontFamily:"'DM Sans',sans-serif",
      display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24}}>
      <style>{FONTS}</style>
      <Wordmark/>
      <div style={{textAlign:"center",marginBottom:32}}>
        {z?(<div style={{fontSize:36,marginBottom:8}}>{z.icon}</div>):(<div style={{fontSize:36,marginBottom:8}}>🛡️</div>)}
        {zl&&<div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontStyle:"italic",fontSize:22,color:"#fff"}}>{zl.name}</div>}
        <div style={{fontSize:12,color:"#4b5563",marginTop:4}}>{zone?t.stationHubPinPrompt:t.stationAdminPinPrompt}</div>
      </div>
      {pinError&&<div style={{textAlign:"center",color:"#ef4444",fontSize:13,marginBottom:16}}>{t.stationHubPinError}</div>}
      <NumPad value={pin} onChange={v=>{setPin(v);setPinError(false);}} onComplete={handleComplete}/>
      <LangFooter/>
    </div>
  );
}

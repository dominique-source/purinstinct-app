import { useState, useEffect, useRef } from "react";
import { FONTS } from "../../config/fonts.js";
import { useT } from "../../hooks/useLang.js";
import { PlayerDossier } from "../admin/PlayerDossier.jsx";
import { Modal } from "../ui/index.js";
import { isWebNfcSupported, scanNfc } from "../../lib/webNfc.js";
import { parseNfcToken, resolvePlayerId } from "../../lib/nfc.js";
import { BASE_URL } from "../../config/constants.js";

const NFC_REREAD_DEBOUNCE_MS = 1500;

// Écran dédié "Lire le profil d'un joueur" (StationHubView, tuile 🔍) —
// recherche manuelle ou tap de bracelet pour ouvrir directement le dossier
// admin (éditable) d'un joueur, afin de corriger une erreur sur place sans
// repasser par tout le menu Admin. Bracelet inconnu -> même sélecteur de
// nom que StationView/StationScanView, pour rester cohérent.
export function StationPlayerLookupView({players,nfcTags,onAssignNfc,onUpdatePlayer,onBack}){
  const t=useT();
  const [selectedId,setSelectedId]=useState(null);
  const [search,setSearch]=useState("");
  const [nfcUnknownToken,setNfcUnknownToken]=useState(null);
  const [nfcPickerSearch,setNfcPickerSearch]=useState("");

  const filtered=search.trim().length>0
    ?players.filter(p=>p.name.toLowerCase().includes(search.toLowerCase())||String(p.number).includes(search))
    :players;

  const nfcLastRef=useRef({token:null,at:0});
  useEffect(()=>{
    if(selectedId!=null||!isWebNfcSupported()) return;
    const expectedOrigin=new URL(BASE_URL).origin;
    const stop=scanNfc({
      onRead:(url)=>{
        const token=parseNfcToken(url,expectedOrigin);
        if(!token) return;
        const now=Date.now();
        if(nfcLastRef.current.token===token&&now-nfcLastRef.current.at<NFC_REREAD_DEBOUNCE_MS) return;
        nfcLastRef.current={token,at:now};
        const playerId=resolvePlayerId(token,nfcTags);
        if(playerId!=null) setSelectedId(playerId);
        else if(onAssignNfc) setNfcUnknownToken(token);
      },
      onError:()=>{},
    });
    return stop;
  },[selectedId,nfcTags,onAssignNfc]);

  const handleNfcPickName=(playerId)=>{
    onAssignNfc(playerId,nfcUnknownToken);
    setNfcUnknownToken(null);
    setNfcPickerSearch("");
    setSelectedId(playerId);
  };

  const nfcPickerFiltered=nfcPickerSearch.trim().length>0
    ?players.filter(p=>p.name.toLowerCase().includes(nfcPickerSearch.toLowerCase())||String(p.number).includes(nfcPickerSearch))
    :players;

  const selectedPlayer=selectedId!=null?players.find(p=>p.id===selectedId):null;
  if(selectedPlayer){
    return(
      <PlayerDossier player={selectedPlayer}
        onSave={(updated)=>{onUpdatePlayer(updated);}}
        onBack={()=>setSelectedId(null)}/>
    );
  }

  return(
    <div style={{minHeight:"100vh",background:"#0A0A0A",fontFamily:"'DM Sans',sans-serif",
      display:"flex",flexDirection:"column",alignItems:"center",padding:24}}>
      <style>{FONTS}</style>
      {onBack&&<button onClick={onBack} style={{alignSelf:"flex-start",padding:"8px 14px",borderRadius:10,
        background:"#111827",border:"1px solid #B8E02040",color:"#B8E020",cursor:"pointer",
        fontSize:13,fontWeight:700,marginBottom:16}}>
        {t.back}
      </button>}

      <div style={{textAlign:"center",marginBottom:20}}>
        <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontStyle:"italic",fontSize:20,color:"#fff"}}>{t.stationLookupTitle}</div>
        <div style={{fontSize:12,color:"#4b5563",marginTop:4,maxWidth:320}}>{t.stationLookupDesc}</div>
      </div>

      <div style={{width:"100%",maxWidth:420}}>
        {isWebNfcSupported()&&(
          <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,
            padding:"14px",marginBottom:14,borderRadius:12,
            border:"1px dashed #B8E02060",background:"#0d1a05",
            color:"#B8E020",fontSize:14,fontWeight:600}}>
            {t.nfcKioskPrompt}
          </div>
        )}

        <input value={search} onChange={e=>setSearch(e.target.value)} autoFocus
          placeholder={t.stationLookupSearchPlaceholder}
          style={{width:"100%",padding:"12px 14px",borderRadius:10,border:"1px solid #1f2937",
            background:"#0d0f1a",color:"#fff",fontSize:15,outline:"none",marginBottom:14,boxSizing:"border-box"}}/>

        <div style={{display:"flex",flexDirection:"column",gap:6,maxHeight:"55vh",overflowY:"auto"}}>
          {filtered.length===0&&(
            <div style={{textAlign:"center",color:"#4b5563",fontSize:13,padding:"20px 0"}}>{t.stationLookupEmpty}</div>
          )}
          {filtered.map(p=>(
            <button key={p.id} onClick={()=>setSelectedId(p.id)} style={{
              display:"flex",alignItems:"center",gap:10,padding:"12px 14px",borderRadius:10,
              border:"1px solid #1f2937",background:"#0d0f1a",cursor:"pointer",textAlign:"left"}}>
              <span style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontStyle:"italic",fontSize:15,
                color:"#B8E020",width:28,flexShrink:0,textAlign:"center"}}>#{p.number}</span>
              <span style={{flex:1,color:"#fff",fontWeight:600,fontSize:14}}>{p.name}</span>
              <span style={{color:"#4b5563",fontSize:16}}>›</span>
            </button>
          ))}
        </div>
      </div>

      {/* ================= BRACELET NFC INCONNU: CHOISIR UN NOM ================= */}
      <Modal open={!!nfcUnknownToken} onClose={()=>{setNfcUnknownToken(null);setNfcPickerSearch("");}} labelledBy="station-lookup-nfc-title">
        <h2 id="station-lookup-nfc-title" style={{fontFamily:"var(--pi-font-display)",fontWeight:900,fontStyle:"italic",
          fontSize:"var(--pi-fs-section)",color:"var(--pi-text)",marginBottom:"var(--pi-s1)"}}>
          {t.nfcSelectNameTitle}
        </h2>
        <p style={{color:"var(--pi-text-2)",fontSize:"var(--pi-fs-body)",marginBottom:"var(--pi-s3)"}}>{t.nfcSelectNameDesc}</p>
        <input value={nfcPickerSearch} onChange={e=>setNfcPickerSearch(e.target.value)} autoFocus
          placeholder={t.nfcSelectNameSearchPlaceholder} className="pi-input"
          style={{width:"100%",marginBottom:"var(--pi-s3)",boxSizing:"border-box"}}/>
        <div style={{maxHeight:"50vh",overflowY:"auto",display:"flex",flexDirection:"column",gap:"var(--pi-s2)"}}>
          {nfcPickerFiltered.length===0&&(
            <div style={{textAlign:"center",color:"var(--pi-text-4)",fontSize:"var(--pi-fs-body)",padding:"var(--pi-s4) 0"}}>{t.nfcSelectNameEmpty}</div>
          )}
          {nfcPickerFiltered.map(p=>(
            <button key={p.id} onClick={()=>handleNfcPickName(p.id)} style={{
              display:"flex",alignItems:"center",gap:"var(--pi-s3)",padding:"12px 14px",borderRadius:"var(--pi-r-md)",
              border:"1px solid var(--pi-line)",background:"var(--pi-surface-1)",cursor:"pointer",textAlign:"left"}}>
              <span style={{fontFamily:"var(--pi-font-display)",fontWeight:900,fontStyle:"italic",fontSize:16,
                color:"var(--pi-lime)",width:30,flexShrink:0,textAlign:"center"}}>#{p.number}</span>
              <span style={{flex:1,color:"#fff",fontWeight:600,fontSize:"var(--pi-fs-body)"}}>{p.name}</span>
              <span style={{color:"var(--pi-text-4)",fontSize:16}}>›</span>
            </button>
          ))}
        </div>
      </Modal>
    </div>
  );
}

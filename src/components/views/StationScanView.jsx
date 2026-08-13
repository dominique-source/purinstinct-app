import { useState, useEffect, useRef } from "react";
import { FONTS } from "../../config/fonts.js";
import { ZONES } from "../../config/zones.js";
import { useZn, useT } from "../../hooks/useLang.js";
import { Modal } from "../ui/index.js";
import { isWebNfcSupported, scanNfc } from "../../lib/webNfc.js";
import { parseNfcToken, resolvePlayerId } from "../../lib/nfc.js";
import { BASE_URL } from "../../config/constants.js";

const NFC_REREAD_DEBOUNCE_MS = 1500;

// Écran dédié "Scanner les prochains joueurs" (StationHubView, tuile 📶) —
// version allégée du bloc NFC déjà présent dans StationView: seulement
// ajouter des joueurs à la file de cette zone, sans la gestion de partie en
// cours. Dupliqué à dessein plutôt que réutilisé/refactoré depuis
// StationView (même choix que ZoneMatchCard dans SmallGroupTab) — l'usage
// et le contexte diffèrent assez pour justifier un écran simple et séparé.
export function StationScanView({zone,players,queue,nfcTags,onAssignNfc,onAddQ,onBack}){
  const t=useT();
  const zn=useZn();
  const z=ZONES[zone];
  const zl=zn(zone);
  const [numInput,setNumInput]=useState("");
  const [flash,setFlash]=useState(null);
  const [highlightId,setHighlightId]=useState(null);
  const [nfcUnknownToken,setNfcUnknownToken]=useState(null);
  const [nfcPickerSearch,setNfcPickerSearch]=useState("");

  const pMap={}; players.forEach(p=>{pMap[p.id]=p;});
  const qPlayers=[...queue].reverse().map(id=>pMap[id]).filter(Boolean);

  const flashAdded=(name)=>{ setFlash(name); setTimeout(()=>setFlash(null),2000); };

  const addPlayerToQueue=(id)=>{
    if(queue.includes(id)){
      setHighlightId(id);
      setTimeout(()=>setHighlightId(null),2000);
      return;
    }
    onAddQ(id,zone,true);
    flashAdded(pMap[id]?.name||"");
  };
  const addPlayerToQueueRef=useRef(addPlayerToQueue);
  useEffect(()=>{addPlayerToQueueRef.current=addPlayerToQueue;});

  const handleAdd=()=>{
    const n=parseInt(numInput,10);
    const p=players.find(px=>px.number===n);
    if(p) addPlayerToQueue(p.id);
    setNumInput("");
  };

  const nfcLastRef=useRef({token:null,at:0});
  useEffect(()=>{
    if(!isWebNfcSupported()) return;
    const expectedOrigin=new URL(BASE_URL).origin;
    const stop=scanNfc({
      onRead:(url)=>{
        const token=parseNfcToken(url,expectedOrigin);
        if(!token) return;
        const now=Date.now();
        if(nfcLastRef.current.token===token&&now-nfcLastRef.current.at<NFC_REREAD_DEBOUNCE_MS) return;
        nfcLastRef.current={token,at:now};
        const playerId=resolvePlayerId(token,nfcTags);
        if(playerId!=null) addPlayerToQueueRef.current(playerId);
        else if(onAssignNfc) setNfcUnknownToken(token);
      },
      onError:()=>{},
    });
    return stop;
  },[nfcTags,onAssignNfc]);

  const handleNfcPickName=(playerId)=>{
    onAssignNfc(playerId,nfcUnknownToken);
    addPlayerToQueue(playerId);
    setNfcUnknownToken(null);
    setNfcPickerSearch("");
  };

  const nfcPickerFiltered=nfcPickerSearch.trim().length>0
    ?players.filter(p=>p.name.toLowerCase().includes(nfcPickerSearch.toLowerCase())||String(p.number).includes(nfcPickerSearch))
    :players;

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
        <div style={{fontSize:30,marginBottom:6}}>{z.icon}</div>
        <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontStyle:"italic",fontSize:20,color:"#fff"}}>{zl.name}</div>
        <div style={{fontSize:12,color:"#4b5563",marginTop:2}}>{t.stationScanTitle}</div>
      </div>

      <div style={{width:"100%",maxWidth:420}}>
        {isWebNfcSupported()&&(
          <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,
            padding:"14px",marginBottom:14,borderRadius:12,
            border:"1px dashed #B8E02060",background:"#0d1a05",
            color:"#B8E020",fontSize:14,fontWeight:600}}>
            {flash?`✓ ${flash} — ${t.stationScanAdded}`:t.nfcKioskPrompt}
          </div>
        )}

        <div style={{display:"flex",gap:8,marginBottom:16}}>
          <input type="number" min="1" max="999" placeholder="# Joueur"
            value={numInput} onChange={e=>setNumInput(e.target.value)}
            onKeyDown={e=>{if(e.key==="Enter")handleAdd();}}
            style={{flex:1,padding:"12px 14px",borderRadius:10,border:"1px solid #1f2937",
              background:"#0d0f1a",color:"#fff",fontSize:15,outline:"none"}}/>
          <button onClick={handleAdd} style={{padding:"12px 20px",borderRadius:10,border:"none",cursor:"pointer",
            fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:14,
            background:"#B8E020",color:"#000"}}>
            {t.addPlayer}
          </button>
        </div>

        <div style={{fontSize:11,color:"#4b5563",marginBottom:8,textTransform:"uppercase",letterSpacing:1}}>
          {t.queue} · {qPlayers.length}
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:6,maxHeight:"40vh",overflowY:"auto"}}>
          {qPlayers.map(p=>(
            <div key={p.id} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",borderRadius:10,
              background:highlightId===p.id?"#B8E02020":"#0d0f1a",border:"1px solid "+(highlightId===p.id?"#B8E02080":"#1f2937")}}>
              <span style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontStyle:"italic",fontSize:15,
                color:"#B8E020",width:28,flexShrink:0,textAlign:"center"}}>#{p.number}</span>
              <span style={{flex:1,color:"#fff",fontWeight:600,fontSize:14}}>{p.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ================= BRACELET NFC INCONNU: CHOISIR UN NOM ================= */}
      <Modal open={!!nfcUnknownToken} onClose={()=>{setNfcUnknownToken(null);setNfcPickerSearch("");}} labelledBy="station-scan-nfc-title">
        <h2 id="station-scan-nfc-title" style={{fontFamily:"var(--pi-font-display)",fontWeight:900,fontStyle:"italic",
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

import { useState, useEffect, useRef } from "react";
import { FONTS } from "../../config/fonts.js";
import { useT } from "../../hooks/useLang.js";
import { isWebNfcSupported, scanNfc } from "../../lib/webNfc.js";
import { parseNfcToken, resolvePlayerId } from "../../lib/nfc.js";

// Écran admin dédié: identifie un joueur (recherche par nom OU tap direct du
// bracelet physique) et retire son bracelet actif (unassignNfcTag) sans
// ouvrir tout le dossier profil — action ciblée pour un bracelet perdu, mal
// assigné, mal utilisé, ou qu'on veut simplement "reformater" pour le
// réassigner à quelqu'un d'autre. Le tap est indispensable quand on a le
// bracelet en main sans savoir à qui il appartient — chercher par nom ne
// marche pas dans ce cas. scanNfc() est démarré directement depuis l'onClick
// du bouton (jamais dans un useEffect déclenché par un changement d'état):
// Web NFC exige une activation utilisateur fraîche pour .scan().
export function StationCancelBraceletView({players,nfcTags,onUnassignNfc,onBack}){
  const t=useT();
  const [selectedId,setSelectedId]=useState(null);
  const [search,setSearch]=useState("");
  const [done,setDone]=useState(false);
  const [scanning,setScanning]=useState(false);
  const [scanError,setScanError]=useState(null); // null | "unknown" | "unsupported"
  const stopScanRef=useRef(null);

  useEffect(()=>()=>stopScanRef.current?.(),[]);

  const filtered=search.trim().length>0
    ?players.filter(p=>p.name.toLowerCase().includes(search.toLowerCase())||String(p.number).includes(search))
    :players;

  const selectedPlayer=selectedId!=null?players.find(p=>p.id===selectedId):null;

  const handleSelect=(id)=>{
    setSelectedId(id);
    setDone(false);
  };

  const handleStartScan=()=>{
    setScanError(null);
    setScanning(true);
    stopScanRef.current=scanNfc({
      onRead:(url)=>{
        stopScanRef.current?.();
        setScanning(false);
        const token=parseNfcToken(url,window.location.origin);
        const playerId=token?resolvePlayerId(token,nfcTags):null;
        const player=playerId!=null?players.find(p=>p.id===playerId):null;
        if(player) handleSelect(player.id);
        else setScanError("unknown");
      },
      onBlank:()=>{
        stopScanRef.current?.();
        setScanning(false);
        setScanError("unknown");
      },
      onError:()=>{
        stopScanRef.current?.();
        setScanning(false);
        setScanError("unsupported");
      },
    });
  };

  const handleConfirm=()=>{
    onUnassignNfc(selectedPlayer.id);
    setDone(true);
  };

  if(selectedPlayer){
    return(
      <div style={{minHeight:"100svh",background:"#0A0A0A",fontFamily:"'DM Sans',sans-serif",
        display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24}}>
        <style>{FONTS}</style>
        <div style={{textAlign:"center",marginBottom:28}}>
          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontStyle:"italic",fontSize:15,color:"#B8E020"}}>#{selectedPlayer.number}</div>
          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontStyle:"italic",fontSize:24,color:"#fff",marginTop:4}}>{selectedPlayer.name}</div>
        </div>

        {done?(
          <div style={{textAlign:"center",color:"#22c55e",fontSize:15,fontWeight:700,marginBottom:24}}>{t.stationCancelDone}</div>
        ):selectedPlayer.nfcToken?(
          <div style={{textAlign:"center",marginBottom:24}}>
            <div style={{color:"#B8E020",fontSize:14,fontWeight:600}}>
              {t.stationCancelHasTag} •••{selectedPlayer.nfcToken.slice(-4)}
            </div>
          </div>
        ):(
          <div style={{textAlign:"center",color:"#6b7280",fontSize:14,marginBottom:24}}>{t.stationCancelNoTag}</div>
        )}

        {!done&&selectedPlayer.nfcToken&&(
          <button onClick={handleConfirm} style={{width:"100%",maxWidth:340,padding:"16px",borderRadius:14,
            border:"none",cursor:"pointer",fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:16,
            background:"#dc2626",color:"#fff",marginBottom:14}}>
            {t.stationCancelConfirmBtn}
          </button>
        )}

        <button onClick={()=>{setSelectedId(null);setDone(false);}} style={{padding:"10px",borderRadius:10,border:"none",
          background:"none",color:"#6b7280",cursor:"pointer",fontSize:13}}>
          {t.stationCancelBackToSearch}
        </button>
      </div>
    );
  }

  return(
    <div style={{minHeight:"100svh",background:"#0A0A0A",fontFamily:"'DM Sans',sans-serif",
      display:"flex",flexDirection:"column",alignItems:"center",padding:24}}>
      <style>{FONTS}</style>
      {onBack&&<button onClick={onBack} style={{alignSelf:"flex-start",padding:"8px 14px",borderRadius:10,
        background:"#111827",border:"1px solid #B8E02040",color:"#B8E020",cursor:"pointer",
        fontSize:13,fontWeight:700,marginBottom:16}}>
        {t.back}
      </button>}

      <div style={{textAlign:"center",marginBottom:20}}>
        <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontStyle:"italic",fontSize:20,color:"#fff"}}>{t.stationCancelTitle}</div>
        <div style={{fontSize:12,color:"#4b5563",marginTop:4,maxWidth:320}}>{t.stationCancelDesc}</div>
      </div>

      {isWebNfcSupported()&&(
        <div style={{width:"100%",maxWidth:420,marginBottom:18}}>
          <button onClick={scanning?()=>{stopScanRef.current?.();setScanning(false);}:handleStartScan} style={{
            width:"100%",padding:"14px",borderRadius:12,cursor:"pointer",
            fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:15,
            background:scanning?"transparent":"#B8E02020",
            border:scanning?"1px solid #ef444460":"1px solid #B8E02060",
            color:scanning?"#ef4444":"#B8E020"}}>
            {scanning?t.stationCancelScanStop:t.stationCancelScanCta}
          </button>
          {scanError==="unknown"&&(
            <div style={{textAlign:"center",color:"#ef4444",fontSize:12,marginTop:8}}>{t.stationCancelScanUnknown}</div>
          )}
          {scanError==="unsupported"&&(
            <div style={{textAlign:"center",color:"#ef4444",fontSize:12,marginTop:8}}>{t.nfcAssignError}</div>
          )}
          <div style={{display:"flex",alignItems:"center",gap:10,margin:"14px 0",color:"#4b5563",fontSize:11}}>
            <div style={{flex:1,height:1,background:"#1f2937"}}/>
            {t.stationCancelScanOr}
            <div style={{flex:1,height:1,background:"#1f2937"}}/>
          </div>
        </div>
      )}

      <div style={{width:"100%",maxWidth:420}}>
        <input value={search} onChange={e=>setSearch(e.target.value)} autoFocus
          placeholder={t.stationCancelSearchPlaceholder}
          style={{width:"100%",padding:"12px 14px",borderRadius:10,border:"1px solid #1f2937",
            background:"#0d0f1a",color:"#fff",fontSize:15,outline:"none",marginBottom:14,boxSizing:"border-box"}}/>

        <div style={{display:"flex",flexDirection:"column",gap:6,maxHeight:"55vh",overflowY:"auto"}}>
          {filtered.length===0&&(
            <div style={{textAlign:"center",color:"#4b5563",fontSize:13,padding:"20px 0"}}>{t.stationCancelEmpty}</div>
          )}
          {filtered.map(p=>(
            <button key={p.id} onClick={()=>handleSelect(p.id)} style={{
              display:"flex",alignItems:"center",gap:10,padding:"12px 14px",borderRadius:10,
              border:"1px solid #1f2937",background:"#0d0f1a",cursor:"pointer",textAlign:"left"}}>
              <span style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontStyle:"italic",fontSize:15,
                color:"#B8E020",width:28,flexShrink:0,textAlign:"center"}}>#{p.number}</span>
              <span style={{flex:1,color:"#fff",fontWeight:600,fontSize:14}}>{p.name}</span>
              {p.nfcToken&&<span style={{fontSize:14,flexShrink:0}}>📶</span>}
              <span style={{color:"#4b5563",fontSize:16}}>›</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

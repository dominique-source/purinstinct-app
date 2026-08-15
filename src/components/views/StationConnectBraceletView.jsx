import { useState } from "react";
import { FONTS } from "../../config/fonts.js";
import { useT } from "../../hooks/useLang.js";
import { isWebNfcSupported, writeNfcUrl } from "../../lib/webNfc.js";
import { generateNfcToken, buildNfcUrl } from "../../lib/nfc.js";
import { BASE_URL } from "../../config/constants.js";

// Écran admin dédié: cherche un joueur, écrit un bracelet neuf (ou le
// remplace) sur son profil — même logique d'écriture que le flux "bracelet
// vierge" de StationScanView (handleBlankPickName), extraite ici en écran
// autonome puisque ce menu n'est plus rattaché à une file d'attente/zone
// précise. writeNfcUrl() appelé en direct depuis l'onClick (jamais via un
// useEffect déclenché par un changement d'état): Web NFC exige une
// activation utilisateur fraîche pour chaque écriture.
export function StationConnectBraceletView({players,onAssignNfc,onRegister,onBack}){
  const t=useT();
  const [selectedId,setSelectedId]=useState(null);
  const [search,setSearch]=useState("");
  const [step,setStep]=useState("idle"); // idle | writing | success | error
  const [registering,setRegistering]=useState(false);
  const [newName,setNewName]=useState("");
  const [newEmail,setNewEmail]=useState("");
  const [newPhone,setNewPhone]=useState("");
  const [saving,setSaving]=useState(false);
  const [emailStatus,setEmailStatus]=useState(null); // null | sending | sent | failed

  const filtered=search.trim().length>0
    ?players.filter(p=>p.name.toLowerCase().includes(search.toLowerCase())||String(p.number).includes(search))
    :players;

  const selectedPlayer=selectedId!=null?players.find(p=>p.id===selectedId):null;

  const handleSelect=(id)=>{
    setSelectedId(id);
    setStep("idle");
    setEmailStatus(null); // joueur existant choisi via recherche — pas d'envoi à signaler
  };

  const handleCreateAndSelect=()=>{
    if(!newName.trim()||saving) return;
    setSaving(true);
    const emailAddr=newEmail.trim();
    onRegister(newName.trim(),emailAddr,newPhone.trim(),(newId,emailPromise)=>{
      setSelectedId(newId);
      setStep("idle");
      setRegistering(false);
      setSaving(false);
      setNewName("");setNewEmail("");setNewPhone("");
      if(emailPromise){
        setEmailStatus("sending");
        emailPromise.then(ok=>setEmailStatus(ok?"sent":"failed"));
      } else {
        setEmailStatus(null);
      }
    });
  };

  const handleConnect=async()=>{
    setStep("writing");
    const token=generateNfcToken();
    const result=await writeNfcUrl(buildNfcUrl(token,BASE_URL));
    if(result.ok){
      onAssignNfc(selectedPlayer.id,token);
      setStep("success");
    } else {
      setStep("error");
    }
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

        {emailStatus&&(
          <div style={{fontSize:13,fontWeight:700,marginBottom:16,textAlign:"center",
            color:emailStatus==="sent"?"#22c55e":emailStatus==="failed"?"#f59e0b":"#9ca3af"}}>
            {emailStatus==="sending"&&t.nfcEmailSending}
            {emailStatus==="sent"&&t.nfcEmailSent.replace("{email}",selectedPlayer.email||"")}
            {emailStatus==="failed"&&t.nfcEmailFailed}
          </div>
        )}

        {!isWebNfcSupported()?(
          <div style={{textAlign:"center",color:"#ef4444",fontSize:14,marginBottom:24,maxWidth:300}}>{t.nfcUnsupportedBrowser}</div>
        ):step==="idle"?(
          <>
            {selectedPlayer.nfcToken&&(
              <div style={{textAlign:"center",color:"#6b7280",fontSize:13,marginBottom:16}}>
                {t.stationCancelHasTag} •••{selectedPlayer.nfcToken.slice(-4)} — {t.nfcReplaceBtn.toLowerCase()}
              </div>
            )}
            <button onClick={handleConnect} style={{width:"100%",maxWidth:340,padding:"16px",borderRadius:14,
              border:"none",cursor:"pointer",fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:16,
              background:"#B8E020",color:"#000",marginBottom:14}}>
              {t.stationConnectBtn}
            </button>
          </>
        ):step==="writing"?(
          <div style={{textAlign:"center",color:"#B8E020",fontSize:15,fontWeight:700,marginBottom:24}}>{t.nfcWriting}</div>
        ):step==="success"?(
          <div style={{textAlign:"center",color:"#22c55e",fontSize:15,fontWeight:700,marginBottom:24}}>{t.stationConnectDone}</div>
        ):(
          <>
            <div style={{textAlign:"center",color:"#ef4444",fontSize:14,marginBottom:16}}>{t.nfcAssignError}</div>
            <button onClick={handleConnect} style={{width:"100%",maxWidth:340,padding:"16px",borderRadius:14,
              border:"none",cursor:"pointer",fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:16,
              background:"#B8E020",color:"#000",marginBottom:14}}>
              {t.stationConnectBtn}
            </button>
          </>
        )}

        <button onClick={()=>{setSelectedId(null);setStep("idle");}} style={{padding:"10px",borderRadius:10,border:"none",
          background:"none",color:"#6b7280",cursor:"pointer",fontSize:13}}>
          {t.stationCancelBackToSearch}
        </button>
      </div>
    );
  }

  if(registering){
    return(
      <div style={{minHeight:"100svh",background:"#0A0A0A",fontFamily:"'DM Sans',sans-serif",
        display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24}}>
        <style>{FONTS}</style>
        <div style={{width:"100%",maxWidth:360}}>
          <button onClick={()=>setRegistering(false)} style={{marginBottom:20,padding:"8px 14px",borderRadius:10,
            background:"#111827",border:"1px solid #B8E02040",color:"#B8E020",cursor:"pointer",
            fontSize:13,fontWeight:700}}>
            {t.back}
          </button>
          <div style={{textAlign:"center",marginBottom:20}}>
            <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontStyle:"italic",fontSize:20,color:"#fff"}}>{t.stationConnectNewPlayerTitle}</div>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            <div>
              <div style={{fontSize:11,color:"#9ca3af",marginBottom:4,textTransform:"uppercase",letterSpacing:1}}>{t.fullName}</div>
              <input value={newName} onChange={e=>setNewName(e.target.value)} autoFocus placeholder={t.nfcNamePlaceholder}
                style={{width:"100%",padding:"12px 14px",borderRadius:10,border:"1px solid #1f2937",
                  background:"#0d0f1a",color:"#fff",fontSize:15,outline:"none",boxSizing:"border-box"}}/>
            </div>
            <div>
              <div style={{fontSize:11,color:"#9ca3af",marginBottom:4,textTransform:"uppercase",letterSpacing:1}}>{t.nfcEmailOptional}</div>
              <input value={newEmail} onChange={e=>setNewEmail(e.target.value)} type="email" placeholder="email@exemple.com"
                style={{width:"100%",padding:"12px 14px",borderRadius:10,border:"1px solid #1f2937",
                  background:"#0d0f1a",color:"#fff",fontSize:15,outline:"none",boxSizing:"border-box"}}/>
            </div>
            <div>
              <div style={{fontSize:11,color:"#9ca3af",marginBottom:4,textTransform:"uppercase",letterSpacing:1}}>{t.nfcPhoneOptional}</div>
              <input value={newPhone} onChange={e=>setNewPhone(e.target.value)} type="tel" placeholder="418 555-1234"
                style={{width:"100%",padding:"12px 14px",borderRadius:10,border:"1px solid #1f2937",
                  background:"#0d0f1a",color:"#fff",fontSize:15,outline:"none",boxSizing:"border-box"}}/>
            </div>
            <button onClick={handleCreateAndSelect} disabled={!newName.trim()||saving} style={{
              marginTop:8,padding:"16px",borderRadius:14,border:"none",cursor:newName.trim()?"pointer":"default",
              fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:16,
              background:newName.trim()?"#B8E020":"#1f2937",color:newName.trim()?"#000":"#4b5563"}}>
              {t.stationConnectNewPlayerBtn}
            </button>
          </div>
        </div>
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
        <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontStyle:"italic",fontSize:20,color:"#fff"}}>{t.stationConnectTitle}</div>
        <div style={{fontSize:12,color:"#4b5563",marginTop:4,maxWidth:320}}>{t.stationConnectDesc}</div>
      </div>

      <div style={{width:"100%",maxWidth:420}}>
        {onRegister&&(
          <button onClick={()=>setRegistering(true)} style={{width:"100%",padding:"12px 14px",borderRadius:10,
            border:"1px dashed #B8E02060",background:"transparent",color:"#B8E020",cursor:"pointer",
            fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:14,marginBottom:12}}>
            {t.stationConnectNewPlayerCta}
          </button>
        )}
        <input value={search} onChange={e=>setSearch(e.target.value)}
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

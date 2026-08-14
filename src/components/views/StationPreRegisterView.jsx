import { useState } from "react";
import { FONTS } from "../../config/fonts.js";
import { useT } from "../../hooks/useLang.js";

// Écran admin: pré-inscrit un joueur avant l'événement (nom + coordonnées
// facultatives) et affiche son code à 4 caractères — le responsable
// l'envoie lui-même par texto/courriel. La personne entre ensuite ce code
// au kiosque bracelet (NfcUnassignedView "J'ai un code") pour sauter la
// ressaisie de ses infos.
export function StationPreRegisterView({onRegister,onBack}){
  const t=useT();
  const [name,setName]=useState("");
  const [email,setEmail]=useState("");
  const [phone,setPhone]=useState("");
  const [saving,setSaving]=useState(false);
  const [result,setResult]=useState(null); // {name, code, email}
  const [emailStatus,setEmailStatus]=useState(null); // null | "sending" | "sent" | "failed"

  const handleSave=()=>{
    if(!name.trim()||saving) return;
    setSaving(true);
    const emailAddr=email.trim();
    onRegister(name.trim(),emailAddr,phone.trim(),(newId,code,emailPromise)=>{
      setResult({name:name.trim(),code,email:emailAddr});
      setSaving(false);
      if(emailPromise){
        setEmailStatus("sending");
        emailPromise.then(ok=>setEmailStatus(ok?"sent":"failed"));
      } else {
        setEmailStatus(null);
      }
    });
  };

  const handleAnother=()=>{
    setResult(null);
    setEmailStatus(null);
    setName("");setEmail("");setPhone("");
  };

  if(result){
    return(
      <div style={{minHeight:"100svh",background:"#0A0A0A",fontFamily:"'DM Sans',sans-serif",
        display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24,textAlign:"center"}}>
        <style>{FONTS}</style>
        <div style={{fontSize:32,marginBottom:8}}>✓</div>
        <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontStyle:"italic",fontSize:20,color:"#fff",marginBottom:4}}>{result.name}</div>
        <div style={{fontSize:12,color:"#9ca3af",marginBottom:24}}>{t.stationPreRegisterCodeLabel}</div>
        <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontStyle:"italic",
          fontSize:64,letterSpacing:10,color:"#B8E020",textShadow:"0 0 40px #B8E02060",marginBottom:28}}>
          {result.code}
        </div>
        {emailStatus&&(
          <div style={{fontSize:13,fontWeight:700,marginBottom:16,
            color:emailStatus==="sent"?"#22c55e":emailStatus==="failed"?"#f59e0b":"#9ca3af"}}>
            {emailStatus==="sending"&&t.stationPreRegisterEmailSending}
            {emailStatus==="sent"&&t.stationPreRegisterEmailSent.replace("{email}",result.email)}
            {emailStatus==="failed"&&t.stationPreRegisterEmailFailed}
          </div>
        )}
        <div style={{fontSize:12,color:"#6b7280",maxWidth:280,marginBottom:28}}>{t.stationPreRegisterCodeHint}</div>
        <button onClick={handleAnother} style={{width:"100%",maxWidth:320,padding:"16px",borderRadius:14,
          border:"none",cursor:"pointer",fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:16,
          background:"#B8E020",color:"#000",marginBottom:10}}>
          {t.stationPreRegisterAnotherBtn}
        </button>
        {onBack&&<button onClick={onBack} style={{padding:"10px",borderRadius:10,border:"none",
          background:"none",color:"#6b7280",cursor:"pointer",fontSize:13}}>
          {t.back}
        </button>}
      </div>
    );
  }

  return(
    <div style={{minHeight:"100svh",background:"#0A0A0A",fontFamily:"'DM Sans',sans-serif",
      display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24}}>
      <style>{FONTS}</style>
      <div style={{width:"100%",maxWidth:360}}>
        {onBack&&<button onClick={onBack} style={{marginBottom:20,padding:"8px 14px",borderRadius:10,
          background:"#111827",border:"1px solid #B8E02040",color:"#B8E020",cursor:"pointer",
          fontSize:13,fontWeight:700}}>
          {t.back}
        </button>}
        <div style={{textAlign:"center",marginBottom:24}}>
          <div style={{fontSize:32,marginBottom:8}}>📝</div>
          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontStyle:"italic",fontSize:20,color:"#fff"}}>{t.stationPreRegisterTitle}</div>
          <div style={{fontSize:12,color:"#9ca3af",marginTop:6}}>{t.stationPreRegisterDesc}</div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <div>
            <div style={{fontSize:11,color:"#9ca3af",marginBottom:4,textTransform:"uppercase",letterSpacing:1}}>{t.fullName}</div>
            <input value={name} onChange={e=>setName(e.target.value)} autoFocus
              placeholder={t.nfcNamePlaceholder}
              style={{width:"100%",padding:"14px 16px",borderRadius:12,border:"1px solid #1f2937",
                background:"#0d0f1a",color:"#fff",fontSize:15,outline:"none",boxSizing:"border-box"}}/>
          </div>
          <div>
            <div style={{fontSize:11,color:"#9ca3af",marginBottom:4,textTransform:"uppercase",letterSpacing:1}}>{t.nfcEmailOptional}</div>
            <input value={email} onChange={e=>setEmail(e.target.value)} type="email"
              placeholder="email@exemple.com"
              style={{width:"100%",padding:"14px 16px",borderRadius:12,border:"1px solid #1f2937",
                background:"#0d0f1a",color:"#fff",fontSize:15,outline:"none",boxSizing:"border-box"}}/>
          </div>
          <div>
            <div style={{fontSize:11,color:"#9ca3af",marginBottom:4,textTransform:"uppercase",letterSpacing:1}}>{t.nfcPhoneOptional}</div>
            <input value={phone} onChange={e=>setPhone(e.target.value)} type="tel"
              placeholder="418 555-1234"
              style={{width:"100%",padding:"14px 16px",borderRadius:12,border:"1px solid #1f2937",
                background:"#0d0f1a",color:"#fff",fontSize:15,outline:"none",boxSizing:"border-box"}}/>
          </div>
          <button onClick={handleSave} disabled={!name.trim()||saving} style={{
            marginTop:8,padding:"16px",borderRadius:14,border:"none",
            cursor:name.trim()?"pointer":"default",
            fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:16,
            background:name.trim()?"#B8E020":"#1f2937",color:name.trim()?"#000":"#4b5563"}}>
            {t.stationPreRegisterSaveBtn}
          </button>
        </div>
      </div>
    </div>
  );
}

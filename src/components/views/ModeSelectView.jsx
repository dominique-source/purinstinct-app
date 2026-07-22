import { useState } from "react";
import { FONTS } from "../../config/fonts.js";
import { useT } from "../../hooks/useLang.js";
import { LangFooter } from "../shared/LangFooter.jsx";
import { resolveMode } from "../../config/modes.js";
import { DEV_PIN } from "../../config/pins.js";

// Saisie d'un code d'entrée (4 chiffres) → resolveMode → onSelectMode(modeKey).
// Le code ADMIN_PIN est un raccourci caché qui débloque tous les modes.
// Le code DEV_PIN ouvre le Mode Développeur (onDevMode) — voir DevHub.jsx.
export function ModeSelectView({onSelectMode,onDevMode}){
  const t=useT();
  const [code,setCode]=useState("");
  const [error,setError]=useState(false);

  const handleDigit=(val)=>{
    setCode(val);
    if(val.length===4){
      if(val===DEV_PIN){
        setError(false);
        setTimeout(()=>{ onDevMode&&onDevMode(); },150);
        return;
      }
      const modeKey=resolveMode(val);
      if(modeKey){
        setError(false);
        setTimeout(()=>{ onSelectMode(modeKey); },150);
      } else {
        setError(true);
        setTimeout(()=>{setCode("");setError(false);},800);
      }
    }
  };

  return(
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",
      justifyContent:"center",padding:"32px 16px",background:"#0A0A0A",fontFamily:"'DM Sans',sans-serif"}}>
      <style>{FONTS}</style>
      <a href="/" className="anim-pop" style={{position:"fixed",top:20,left:20,zIndex:10,
        display:"flex",alignItems:"center",gap:10,padding:"12px 22px",borderRadius:14,
        background:"#111827",border:"2px solid #B8E02050",color:"#B8E020",textDecoration:"none",
        fontFamily:"'Barlow Condensed',sans-serif",fontWeight:800,fontSize:17,letterSpacing:.5,
        transition:"all .15s"}}
        onMouseEnter={e=>{e.currentTarget.style.background="#1a2233";e.currentTarget.style.borderColor="#B8E020";}}
        onMouseLeave={e=>{e.currentTarget.style.background="#111827";e.currentTarget.style.borderColor="#B8E02050";}}>
        <span style={{fontSize:20,lineHeight:1}}>←</span>{t.backToSite}
      </a>
      {/* Logo */}
      <div className="anim-pop" style={{textAlign:"center",marginBottom:32}}>
        <img src={import.meta.env.BASE_URL+"purinstinct-games-logo.png"} alt="PürInstinct Games"
          style={{width:180,height:"auto",filter:"drop-shadow(0 0 40px #B8E02030)"}}/>
      </div>

      {/* Code entry */}
      <div className="anim-up" style={{width:"100%",maxWidth:300,textAlign:"center"}}>
        <div style={{fontSize:13,color:"#4b5563",marginBottom:28}}>
          {error?t.invalidAccessCode:t.enterAccessCode}
        </div>

        {/* Code dots */}
        <div style={{display:"flex",justifyContent:"center",gap:14,marginBottom:24}}>
          {[0,1,2,3].map(i=>(
            <div key={i} style={{width:16,height:16,borderRadius:"50%",
              background:i<code.length?(error?"#ef4444":"#B8E020"):"#1f2937",
              border:"2px solid "+(i<code.length?(error?"#ef4444":"#B8E020"):"#374151"),
              transition:"all .15s"}}/>
          ))}
        </div>

        {/* Numpad */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,maxWidth:260,margin:"0 auto 24px"}}>
          {[1,2,3,4,5,6,7,8,9,"",0,"⌫"].map((k,i)=>(
            <button key={i} onClick={()=>{
              if(k==="") return;
              if(k==="⌫") handleDigit(code.slice(0,-1));
              else if(code.length<4) handleDigit(code+k);
            }} style={{padding:"16px",borderRadius:14,border:"1px solid #1f2937",
              background:k===""?"transparent":"#0d0f1a",color:"#fff",
              fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:22,
              cursor:k===""?"default":"pointer",opacity:k===""?0:1}}
              onMouseEnter={e=>{if(k!=="")e.currentTarget.style.background="#1f2937";}}
              onMouseLeave={e=>{if(k!=="")e.currentTarget.style.background="#0d0f1a";}}>
              {k}
            </button>
          ))}
        </div>
      </div>
      <LangFooter/>
    </div>
  );
}

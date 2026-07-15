import { useState } from "react";
import { FONTS } from "../../config/fonts.js";
import { useT } from "../../hooks/useLang.js";
import { LangFooter } from "../shared/LangFooter.jsx";
import { S } from "../shared/styles.js";
import { MODE_PIN } from "../../config/pins.js";

export function ModeSelectView({onLive,onTest}){
  const t=useT();
  const [mode,setMode]=useState(null); // null | "live" | "test"
  const [pin,setPin]=useState("");
  const [pinError,setPinError]=useState(false);

  const handlePin=(val)=>{
    setPin(val);
    if(val.length===4){
      if(val===MODE_PIN){
        setPinError(false);
        setTimeout(()=>{ mode==="live"?onLive():onTest(); },150);
      } else {
        setPinError(true);
        setTimeout(()=>{setPin("");setPinError(false);},800);
      }
    }
  };

  return(
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",
      justifyContent:"center",padding:"32px 16px",background:"#06070f",fontFamily:"'DM Sans',sans-serif"}}>
      <style>{FONTS}</style>
      {/* Logo */}
      <div className="anim-pop" style={{textAlign:"center",marginBottom:48}}>
        <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontStyle:"italic",fontSize:72,letterSpacing:-2,lineHeight:1,
          textShadow:"0 0 40px #84cc1630"}}>
          <span style={{color:"#84cc16"}}>PUR</span><span style={{color:"#fff"}}>INSTINCT</span>
        </div>
        <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginTop:8}}>
          <span style={{width:28,height:2,background:"#84cc16",transform:"skewX(-20deg)"}}/>
          <span style={{color:"#84cc16",fontSize:13,letterSpacing:3,textTransform:"uppercase",fontWeight:700}}>
            PurInstinct Games
          </span>
          <span style={{width:28,height:2,background:"#84cc16",transform:"skewX(-20deg)"}}/>
        </div>
      </div>

      {!mode?(
        /* Mode selection */
        <div className="anim-up" style={{width:"100%",maxWidth:340,display:"flex",flexDirection:"column",gap:14}}>
          <button onClick={()=>setMode("live")}
            style={{width:"100%",padding:"22px 20px",border:"2px solid #84cc1650",
              clipPath:S.clip(14),filter:"drop-shadow(0 0 14px #84cc1630)",
              background:"#111a05",color:"#84cc16",cursor:"pointer",fontFamily:"'Barlow Condensed',sans-serif",
              fontWeight:900,fontStyle:"italic",fontSize:22,letterSpacing:1,display:"flex",alignItems:"center",gap:14}}
            onMouseEnter={e=>{e.currentTarget.style.background="#84cc16";e.currentTarget.style.color="#000";}}
            onMouseLeave={e=>{e.currentTarget.style.background="#111a05";e.currentTarget.style.color="#84cc16";}}>
            <span style={{fontSize:28}}>⚡</span>
            <div style={{textAlign:"left"}}>
              <div>LIVE MODE</div>
              <div style={{fontSize:12,fontWeight:400,opacity:0.7,fontFamily:"'DM Sans',sans-serif",marginTop:2}}>
                Expérience joueur · Session en direct
              </div>
            </div>
          </button>
          <button onClick={()=>setMode("test")}
            style={{width:"100%",padding:"22px 20px",border:"2px solid #3b82f650",
              clipPath:S.clip(14),
              background:"#080f1f",color:"#3b82f6",cursor:"pointer",fontFamily:"'Barlow Condensed',sans-serif",
              fontWeight:900,fontStyle:"italic",fontSize:22,letterSpacing:1,display:"flex",alignItems:"center",gap:14}}
            onMouseEnter={e=>{e.currentTarget.style.background="#3b82f6";e.currentTarget.style.color="#000";}}
            onMouseLeave={e=>{e.currentTarget.style.background="#080f1f";e.currentTarget.style.color="#3b82f6";}}>
            <span style={{fontSize:28}}>🧪</span>
            <div style={{textAlign:"left"}}>
              <div>TEST MODE</div>
              <div style={{fontSize:12,fontWeight:400,opacity:0.7,fontFamily:"'DM Sans',sans-serif",marginTop:2}}>
                Admin complet · Accès toutes fonctions
              </div>
            </div>
          </button>
        </div>
      ):(
        /* PIN entry */
        <div className="anim-up" style={{width:"100%",maxWidth:300,textAlign:"center"}}>
          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontStyle:"italic",fontSize:20,
            color:mode==="live"?"#84cc16":"#3b82f6",letterSpacing:2,marginBottom:6}}>
            {mode==="live"?"⚡ LIVE MODE":"🧪 TEST MODE"}
          </div>
          <div style={{fontSize:13,color:"#4b5563",marginBottom:28}}>Entrez le code PIN</div>

          {/* PIN dots */}
          <div style={{display:"flex",justifyContent:"center",gap:14,marginBottom:24}}>
            {[0,1,2,3].map(i=>(
              <div key={i} style={{width:16,height:16,borderRadius:"50%",
                background:i<pin.length?(pinError?"#ef4444":mode==="live"?"#84cc16":"#3b82f6"):"#1f2937",
                border:"2px solid "+(i<pin.length?(pinError?"#ef4444":mode==="live"?"#84cc16":"#3b82f6"):"#374151"),
                transition:"all .15s"}}/>
            ))}
          </div>

          {/* Numpad */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,maxWidth:260,margin:"0 auto 24px"}}>
            {[1,2,3,4,5,6,7,8,9,"",0,"⌫"].map((k,i)=>(
              <button key={i} onClick={()=>{
                if(k==="") return;
                if(k==="⌫") handlePin(pin.slice(0,-1));
                else if(pin.length<4) handlePin(pin+k);
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

          <button onClick={()=>{setMode(null);setPin("");setPinError(false);}}
            style={{fontSize:12,color:"#4b5563",background:"none",border:"none",cursor:"pointer"}}>
            ← Retour
          </button>
        </div>
      )}
      <LangFooter/>
    </div>
  );
}

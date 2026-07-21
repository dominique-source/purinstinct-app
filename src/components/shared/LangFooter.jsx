import { useT, useLang } from "../../hooks/useLang.js";

export function LangBtn(){
  const t=useT();
  const {setLang,lang}=useLang();
  return(<button onClick={()=>setLang(l=>l==="fr"?"en":"fr")} style={{padding:"4px 10px",borderRadius:8,border:"1px solid #B8E02050",background:"#111a05",color:"#B8E020",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"'Barlow Condensed',sans-serif",letterSpacing:1}}>{t.langOther}</button>);
}

export function LangFooter(){
  const t=useT();
  const {setLang,lang}=useLang();
  const flag=lang==="fr"?"🇫🇷":"🇬🇧";
  return(
    <div style={{position:"fixed",bottom:0,left:0,right:0,zIndex:100,display:"flex",justifyContent:"center",
      padding:"8px 16px",background:"#0A0A0Add",backdropFilter:"blur(6px)",
      borderTop:"1px solid #1f293760"}}>
      <button onClick={()=>setLang(l=>l==="fr"?"en":"fr")} style={{
        display:"flex",alignItems:"center",gap:8,padding:"7px 18px",borderRadius:10,
        border:"1px solid #B8E02050",background:"#111a05",cursor:"pointer"}}>
        <span style={{fontSize:16}}>{flag}</span>
        <span style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:14,
          color:"#B8E020",letterSpacing:1}}>{t.langOther}</span>
      </button>
    </div>
  );
}

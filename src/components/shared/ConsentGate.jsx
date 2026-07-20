import { useT } from "../../hooks/useLang.js";

// Case à cocher explicite + texte Loi 25, bilingue. Rendu quand le mode a un
// consentement marketing (obligatoire ou facultatif) — jamais coché par défaut.
export function ConsentGate({checked,onChange,required=false}){
  const t=useT();
  return(
    <label style={{display:"flex",alignItems:"flex-start",gap:"var(--pi-s3)",cursor:"pointer",
      padding:"var(--pi-s3)",border:"1px solid var(--pi-line)",borderRadius:"var(--pi-r-md)",
      background:"var(--pi-surface-1)"}}>
      <input type="checkbox" checked={checked} onChange={e=>onChange(e.target.checked)}
        style={{width:20,height:20,flexShrink:0,marginTop:2,accentColor:"var(--pi-lime)",cursor:"pointer"}}/>
      <span style={{fontSize:"var(--pi-fs-label)",color:"var(--pi-text-2)",lineHeight:1.4}}>
        {t.consentMarketingLabel}{!required&&<span style={{color:"var(--pi-text-4)"}}> {t.consentOptionalTag}</span>}
        <div style={{marginTop:4,color:"var(--pi-text-4)",fontSize:"var(--pi-fs-meta)"}}>{t.consentMarketingSub}</div>
      </span>
    </label>
  );
}

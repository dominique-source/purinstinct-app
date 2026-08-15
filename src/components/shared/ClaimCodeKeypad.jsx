import { useT } from "../../hooks/useLang.js";

// Lettres autorisées dans le code de réclamation — 10 lettres choisies pour
// éviter toute ambiguïté visuelle sur un cadran (pas de I/O confondus avec 1/0).
const CODE_LETTERS = ["A","B","C","D","E","F","G","H","L","M"];

// Cadran à deux modes (chiffres / lettres) pour entrer un code de
// réclamation à 4 caractères — jamais un clavier texte natif. Contrôlé:
// le parent possède `code`/`mode` et décide quoi faire à la complétion
// (recherche, erreur, reset) — ce composant ne fait qu'afficher et
// accumuler les frappes. Partagé entre NfcUnassignedView (kiosque public)
// et StationView (bracelet vierge tapé côté responsable de plateau).
export function ClaimCodeKeypad({code,mode,onCodeChange,onModeChange,length=4,onComplete}){
  const t=useT();
  const digitKeys=[1,2,3,4,5,6,7,8,9,"",0,"⌫"];
  const letterKeys=[...CODE_LETTERS.slice(0,9),"",CODE_LETTERS[9],"⌫"];
  const keys=mode==="digits"?digitKeys:letterKeys;

  const press=(k)=>{
    if(k==="") return;
    if(k==="⌫"){ onCodeChange(code.slice(0,-1)); return; }
    if(code.length<length){
      const nv=code+k;
      onCodeChange(nv);
      if(nv.length===length) setTimeout(()=>onComplete(nv),150);
    }
  };

  return (
    <div style={{width:"100%",maxWidth:340}}>
      <div style={{display:"flex",justifyContent:"center",gap:12,marginBottom:24}}>
        {Array.from({length}).map((_,i)=>(
          <div key={i} style={{width:16,height:16,borderRadius:"50%",
            background:i<code.length?"#B8E020":"#1f2937",
            border:`2px solid ${i<code.length?"#B8E020":"#374151"}`}}/>
        ))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,maxWidth:260,margin:"0 auto"}}>
        {keys.map((k,i)=>(
          <button key={mode+i} onClick={()=>press(k)} style={{padding:18,borderRadius:14,border:"1px solid #1f2937",
            background:k===""?"transparent":"#0d0f1a",color:"#fff",
            fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:20,
            cursor:k===""?"default":"pointer",opacity:k===""?0:1}}>
            {k}
          </button>
        ))}
      </div>
      <button onClick={()=>onModeChange(mode==="digits"?"letters":"digits")} style={{
        marginTop:16,padding:"10px 20px",borderRadius:12,border:"1px solid #B8E02060",
        background:"transparent",color:"#B8E020",cursor:"pointer",
        fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:14}}>
        {mode==="digits"?t.nfcCodeSwitchToLetters:t.nfcCodeSwitchToDigits}
      </button>
    </div>
  );
}

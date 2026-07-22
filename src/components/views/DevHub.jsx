import { FONTS } from "../../config/fonts.js";

// Aperçu local (jamais synced à Firebase) de chaque mode/rôle — ouvert via le
// code DEV_PIN (config/pins.js) tapé sur ModeSelectView ou LiveLoginView.
const TILES=[
  {key:"games",icon:"🕹️",label:"Games (Arène)",sub:"Flux live actuel"},
  {key:"corporate",icon:"🏢",label:"Corporate",sub:"Pré-inscription + check-in"},
  {key:"ecole",icon:"🏫",label:"École",sub:"Inscription par équipe"},
  {key:"festival",icon:"🎪",label:"Festival",sub:"Kiosque libre-service"},
  {key:"parc",icon:"🌳",label:"Parc",sub:"Borne fixe"},
  {key:"admin",icon:"🛡️",label:"Admin",sub:"Données de test"},
  {key:"station",icon:"📍",label:"Responsable de plateau",sub:"Données de test"},
  {key:"zones",icon:"🏁",label:"Zones de jeu",sub:"Aperçu station par zone"},
];

export function DevHub({onPreview,onExit}){
  return(
    <div style={{minHeight:"100vh",background:"#0A0A0A",fontFamily:"'DM Sans',sans-serif",
      display:"flex",flexDirection:"column",alignItems:"center",padding:"32px 16px 60px"}}>
      <style>{FONTS}</style>

      <div style={{textAlign:"center",marginBottom:16}}>
        <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontStyle:"italic",
          fontSize:28,color:"#B8E020",letterSpacing:.5}}>
          🛠️ MODE DÉVELOPPEUR
        </div>
        <div style={{color:"#6b7280",fontSize:12,marginTop:8,maxWidth:340,lineHeight:1.5}}>
          Aperçu local de chaque mode et rôle — n'affecte pas la session live en cours ni les autres appareils.
        </div>
      </div>

      <button onClick={onExit} style={{marginBottom:28,padding:"10px 20px",borderRadius:12,
        background:"#111827",border:"1px solid #B8E02040",color:"#B8E020",cursor:"pointer",
        fontSize:13,fontWeight:700,fontFamily:"'Barlow Condensed',sans-serif"}}
        onMouseEnter={e=>{e.currentTarget.style.background="#1a2233";}}
        onMouseLeave={e=>{e.currentTarget.style.background="#111827";}}>
        ← Quitter le mode développeur
      </button>

      <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:12,width:"100%",maxWidth:420}}>
        {TILES.map(tile=>(
          <button key={tile.key} onClick={()=>onPreview(tile.key)} style={{
            padding:"20px 14px",borderRadius:16,border:"1px solid #1f2937",background:"#0d0f1a",
            color:"#fff",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",
            gap:6,textAlign:"center"}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor="#B8E020";e.currentTarget.style.background="#12140a";}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor="#1f2937";e.currentTarget.style.background="#0d0f1a";}}>
            <span style={{fontSize:28}}>{tile.icon}</span>
            <span style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:800,fontSize:15}}>{tile.label}</span>
            <span style={{fontSize:10,color:"#6b7280"}}>{tile.sub}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

import { FONTS } from "../../config/fonts.js";

// Aperçu local (jamais synced à Firebase) de chaque mode/rôle — ouvert via le
// code DEV_PIN (config/pins.js) tapé sur ModeSelectView ou LiveLoginView.
const TILES=[
  {key:"user",icon:"👤",label:"Joueur",sub:"Vue joueur, un clic"},
  {key:"games",icon:"🕹️",label:"Games (Arène)",sub:"Flux live actuel"},
  {key:"corporate",icon:"🏢",label:"Corporate",sub:"Pré-inscription + check-in"},
  {key:"ecole",icon:"🏫",label:"École",sub:"Inscription par équipe"},
  {key:"festival",icon:"🎪",label:"Festival",sub:"Kiosque libre-service"},
  {key:"parc",icon:"🌳",label:"Parc",sub:"Borne fixe"},
  {key:"petitGroupe",icon:"👥",label:"Petit Groupe",sub:"Orchestration (aperçu, joueurs de test)"},
  {key:"admin",icon:"🛡️",label:"Admin",sub:"Données de test"},
  {key:"station",icon:"📍",label:"Responsable de plateau",sub:"Données de test"},
  {key:"zones",icon:"🏁",label:"Zones de jeu",sub:"Aperçu station par zone"},
];

export function DevHub({onPreview,onExit,onDeactivateAllGames,activeGamesCount=0}){
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
          Aperçu local de chaque mode et rôle — n'affecte pas la session live en cours ni les
          autres appareils, à l'exception du bouton rouge ci-dessous.
        </div>
      </div>

      <button onClick={onExit} style={{marginBottom:28,padding:"10px 20px",borderRadius:12,
        background:"#111827",border:"1px solid #B8E02040",color:"#B8E020",cursor:"pointer",
        fontSize:13,fontWeight:700,fontFamily:"'Barlow Condensed',sans-serif"}}
        onMouseEnter={e=>{e.currentTarget.style.background="#1a2233";}}
        onMouseLeave={e=>{e.currentTarget.style.background="#111827";}}>
        ← Quitter le mode développeur
      </button>

      {onDeactivateAllGames&&(
        <div style={{width:"100%",maxWidth:420,marginBottom:28,padding:14,borderRadius:14,
          border:"1px solid #ef444440",background:"#1a0606",textAlign:"center"}}>
          <div style={{fontSize:11,color:"#f87171",marginBottom:8,lineHeight:1.5}}>
            ⚠️ Écrit pour de vrai sur la session live partagée — utile pour libérer les zones
            avant des tests, mais irréversible.
          </div>
          <button
            onClick={()=>{
              if(window.confirm(
                activeGamesCount>0
                  ?`Arrêter les ${activeGamesCount} partie${activeGamesCount>1?"s":""} actuellement en cours (toutes zones) ? Les joueurs concernés seront remis en tête de file. Cette action est irréversible.`
                  :"Aucune partie active en ce moment. Continuer quand même ?"
              )) onDeactivateAllGames();
            }}
            style={{padding:"10px 20px",borderRadius:12,background:"#7f1d1d",
              border:"1px solid #ef4444",color:"#fff",cursor:"pointer",
              fontSize:13,fontWeight:700,fontFamily:"'Barlow Condensed',sans-serif"}}
            onMouseEnter={e=>{e.currentTarget.style.background="#991b1b";}}
            onMouseLeave={e=>{e.currentTarget.style.background="#7f1d1d";}}>
            🛑 Désactiver toutes les parties en direct{activeGamesCount>0?` (${activeGamesCount})`:""}
          </button>
        </div>
      )}

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

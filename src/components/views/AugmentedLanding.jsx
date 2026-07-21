import { FONTS } from "../../config/fonts.js";
import { AUG_GAMES, AUG_COLOR, AUG_BG } from "../../config/zones.js";
import { useLang } from "../../hooks/useLang.js";
import { S } from "../shared/styles.js";
import { LangFooter } from "../shared/LangFooter.jsx";

export function AugmentedLanding({augState,onSelect,onBack}){
  const {lang}=useLang();
  return(
    <div style={{minHeight:"100vh",background:AUG_BG,fontFamily:"'DM Sans',sans-serif",
      display:"flex",flexDirection:"column",alignItems:"center",padding:"32px 16px 80px"}}>
      <style>{FONTS}</style>
      {/* Header */}
      <div className="anim-pop" style={{textAlign:"center",marginBottom:28}}>
        <button onClick={onBack} style={{...S.backBtn,marginBottom:16}}>🏠 Home</button>
        <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:13,
          color:AUG_COLOR,letterSpacing:4,textTransform:"uppercase",marginBottom:4}}>Moment Factory</div>
        <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontStyle:"italic",fontSize:36,
          color:"#fff",letterSpacing:-1,lineHeight:1,textShadow:"0 0 32px "+AUG_COLOR+"40"}}>AUGMENTED GAMES</div>
        <div style={{color:"#6b7280",fontSize:12,marginTop:6}}>Choisissez un jeu pour ouvrir sa file</div>
      </div>
      {/* 4×2 game grid */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,width:"100%",maxWidth:420}}>
        {AUG_GAMES.map(game=>{
          const gs=augState[game.id]||{queue:[],activeMatch:null};
          const qLen=gs.queue.length;
          const hasMatch=!!gs.activeMatch;
          return(
            <div key={game.id} onClick={()=>onSelect(game.id)}
              style={{borderRadius:14,overflow:"hidden",cursor:"pointer",position:"relative",
                border:"2px solid "+(hasMatch?"#B8E020":AUG_COLOR+"50"),
                boxShadow:"0 4px 16px "+AUG_COLOR+"20",transition:"transform .15s"}}
              onMouseEnter={e=>e.currentTarget.style.transform="scale(1.03)"}
              onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}>
              {/* Image */}
              <div style={{aspectRatio:"1/1",background:"#1a0a2e",position:"relative"}}>
                <img src={game.img} alt={game[lang]}
                  style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}}
                  onError={e=>{e.target.style.display="none";}}/>
                {/* Overlay badges */}
                {hasMatch&&(
                  <div style={{position:"absolute",top:8,right:8,background:"#B8E020",
                    borderRadius:20,padding:"3px 10px",fontSize:10,fontWeight:700,color:"#000"}}>
                    ⚡ LIVE
                  </div>
                )}
                {qLen>0&&!hasMatch&&(
                  <div style={{position:"absolute",top:8,right:8,background:AUG_COLOR,
                    borderRadius:20,padding:"3px 10px",fontSize:10,fontWeight:700,color:"#fff"}}>
                    {qLen} en file
                  </div>
                )}
              </div>
              {/* Label */}
              <div style={{padding:"8px 10px",background:"#0d0514"}}>
                <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,
                  fontSize:15,color:"#fff",letterSpacing:1}}>{game[lang].toUpperCase()}</div>
              </div>
            </div>
          );
        })}
      </div>
      <LangFooter/>
    </div>
  );
}

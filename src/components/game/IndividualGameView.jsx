import { ZONES } from "../../config/zones.js";
import { useT } from "../../hooks/useLang.js";
import { S } from "../shared/styles.js";
import { Bib } from "../shared/Bib.jsx";

export function IndividualGameView({game,players,zone,onWinner,onRemove,onReplace,locked}){
  const t=useT();
  const z=ZONES[zone];
  const pMap={}; players.forEach(p=>{pMap[p.id]=p;});
  const participants=game.participants||[];
  const pList=participants.map(id=>pMap[id]).filter(Boolean);

  let favoredId=null;
  if(zone==="footAgility"&&participants.length===2){
    const [a,b]=participants;
    const sa=(pMap[a]?.zoneScores||{})[zone]||50, sb=(pMap[b]?.zoneScores||{})[zone]||50;
    if(Math.abs(sa-sb)>=5) favoredId=sa>sb?a:b;
  }

  return(
    <div>
      <div style={{...S.row(),justifyContent:"space-between",marginBottom:12}}>
        <div style={{...S.label()}}>{zone==="iq"?t.iqInProgress:t.duelInProgress} - {pList.length} {t.totalPlayers}</div>
        <div style={S.liveTag()}><span className="pulse-lime" style={S.liveDot("#dc2626",6)}/>LIVE</div>
      </div>
      {favoredId&&(
        <div style={{marginBottom:12,padding:"8px 12px",borderRadius:10,fontSize:12,fontWeight:600,textAlign:"center",background:"#fbbf2412",color:"#fbbf24",border:"1px solid #fbbf2425"}}>
          ⚠ {pMap[favoredId]?.name.split(" ")[0]} {t.favoredPlayer}
        </div>
      )}
      <div style={{display:"flex",flexDirection:"column",gap:5,marginBottom:14}}>
        {pList.map(p=>{
          const zs=(p.zoneScores||{})[zone]||50;
          const streak=(p.zoneStreaks||{})[zone]||0;
          const isFav=favoredId===p.id;
          return(
            <div key={p.id} style={{...S.row(),padding:"8px 10px",borderRadius:10,background:"#0d0f1a",
              border:"1px solid "+(isFav?"#fbbf2440":z.border)}}>
              <Bib n={p.number} size="sm" color={z.color}/>
              <span style={{flex:1,color:"#fff",fontWeight:600,fontSize:13}}>{p.name}</span>
              {isFav&&<span style={{fontSize:11,color:"#fbbf24"}}>⚠ fav.</span>}
              {streak>=2&&<span style={{fontSize:11,color:"#f97316"}}>🔥x{streak}</span>}
              <div style={{...S.tag(z.color),fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700}}>{zs}</div>
              <button onClick={()=>onRemove(p.id)}
                style={{background:"none",border:"none",cursor:"pointer",color:"#374151",fontSize:16,lineHeight:1}}
                onMouseEnter={e=>e.target.style.color="#ef4444"}
                onMouseLeave={e=>e.target.style.color="#374151"}>×</button>
            </div>
          );
        })}
      </div>
      <button onClick={onReplace} style={{...S.btn(),width:"100%",padding:"8px",fontSize:12,marginBottom:14,border:"1px dashed #374151"}}>
        {t.substitute}
      </button>
      <div style={{...S.label(),textAlign:"center",marginBottom:10}}>{t.whichWonIQ}</div>
      <div style={{display:"flex",flexWrap:"wrap",gap:8,opacity:locked?0.4:1,pointerEvents:locked?"none":"auto"}}>
        {pList.map(p=>(
          <button key={p.id} onClick={()=>!locked&&onWinner(p.id)}
            style={{flex:"1 1 45%",minHeight:64,padding:"14px 10px",clipPath:S.clip(10),border:"2px solid "+z.color,cursor:"pointer",
              background:z.color,color:"#000",fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontStyle:"italic",fontSize:16}}>
            #{p.number} {p.name.split(" ")[0]}
          </button>
        ))}
      </div>
    </div>
  );
}

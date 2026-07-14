import { ZONES } from "../../config/zones.js";
import { useT } from "../../hooks/useLang.js";
import { teamAvg } from "../../lib/game-logic.js";
import { S } from "../shared/styles.js";
import { Bib } from "../shared/Bib.jsx";

export function TeamGameView({game,players,zone,onResult,onRemove,onReplace}){
  const t=useT();
  const z=ZONES[zone];
  const pMap={}; players.forEach(p=>{pMap[p.id]=p;});
  const teamA=(game.teamA||[]).map(id=>pMap[id]).filter(Boolean);
  const teamB=(game.teamB||[]).map(id=>pMap[id]).filter(Boolean);
  const avgA=Math.round(teamAvg(pMap,game.teamA||[],zone));
  const avgB=Math.round(teamAvg(pMap,game.teamB||[],zone));
  const diff=Math.abs(avgA-avgB);
  const favored=diff>=5?(avgA>avgB?"A":"B"):null;
  const pvPts=(myTeam)=>{
    const isFav=favored===myTeam, isUnd=favored!==null&&!isFav;
    return{win:isFav?Math.max(1,z.winPts-1):isUnd?z.winPts+1:z.winPts,loss:isFav?z.lossPts+1:isUnd?Math.max(0,z.lossPts-1):z.lossPts};
  };

  return(
    <div>
      <div style={{...S.row(),justifyContent:"space-between",marginBottom:10}}>
        <div style={{...S.label()}}>{t.matchInProgress}</div>
        <div className="pulse-lime" style={{...S.tag("#dc2626")}}>LIVE</div>
      </div>
      {favored&&(
        <div style={{marginBottom:10,padding:"7px 12px",borderRadius:10,fontSize:12,fontWeight:600,textAlign:"center",background:"#fbbf2412",color:"#fbbf24",border:"1px solid #fbbf2425"}}>
          ⚠ {t.favoredTeam}{diff.toFixed(0)}) {t.handicapNote}
        </div>
      )}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
        {[{team:"A",tp:teamA,avg:avgA},{team:"B",tp:teamB,avg:avgB}].map(({team,tp,avg})=>{
          const pv=pvPts(team);
          return(
            <div key={team} style={{borderRadius:14,padding:10,background:"#0d0f1a",border:"1px solid "+z.border}}>
              <div style={{...S.row(),justifyContent:"space-between",marginBottom:8}}>
                <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:13,color:z.color}}>EQUIPE {team}</div>
                <div style={{display:"flex",alignItems:"center",gap:4}}>
                  {favored===team&&<span style={{color:"#fbbf24",fontSize:11}}>⚠</span>}
                  <div style={{fontSize:10,padding:"2px 5px",borderRadius:5,background:"#1f2937",color:"#9ca3af"}}>moy.{avg}</div>
                </div>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:4,marginBottom:8}}>
                {tp.map(p=>(
                  <div key={p.id} style={{...S.row()}}>
                    <Bib n={p.number} size="sm" color={z.color}/>
                    <span style={{fontSize:12,color:"#fff",flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.name.split(" ")[0]}</span>
                    {((p.zoneStreaks||{})[zone]||0)>=2&&<span style={{fontSize:10,color:"#f97316"}}>🔥{(p.zoneStreaks||{})[zone]}</span>}
                    <button onClick={()=>onRemove(p.id)}
                      style={{background:"none",border:"none",cursor:"pointer",color:"#374151",fontSize:14,lineHeight:1,flexShrink:0}}
                      onMouseEnter={e=>e.target.style.color="#ef4444"}
                      onMouseLeave={e=>e.target.style.color="#374151"}>×</button>
                  </div>
                ))}
              </div>
              <div style={{fontSize:10,paddingTop:6,borderTop:"1px solid #1f2937"}}>
                <span style={{color:"#22c55e"}}>+{pv.win} vic.</span>
                <span style={{color:"#374151",margin:"0 5px"}}>|</span>
                <span style={{color:"#ef4444"}}>-{pv.loss} def.</span>
              </div>
            </div>
          );
        })}
      </div>
      <button onClick={onReplace} style={{...S.btn(),width:"100%",padding:"8px",fontSize:12,marginBottom:12,border:"1px dashed #374151"}}>
        {t.substitute}
      </button>
      <div style={{...S.label(),textAlign:"center",marginBottom:8}}>{t.declareWinner}</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        <button onClick={()=>onResult("A")} style={{padding:"18px 10px",borderRadius:14,border:"none",cursor:"pointer",fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:20,background:z.color,color:"#000",boxShadow:"0 4px 18px "+z.color+"40"}}>
          {t.teamA}
        </button>
        <button onClick={()=>onResult("B")} style={{padding:"18px 10px",borderRadius:14,cursor:"pointer",fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:20,background:"#0d0f1a",color:"#fff",border:"2px solid "+z.color}}>
          {t.teamB}
        </button>
      </div>
    </div>
  );
}

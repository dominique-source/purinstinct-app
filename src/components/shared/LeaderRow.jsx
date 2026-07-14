import { ZK } from "../../config/zones.js";
import { ZonePip } from "./ZonePip.jsx";

export function LeaderRow({player,rank,highlight,isMe,onOpen}){
  const elig=(player.zonesPlayed||[]).length===6;
  const medal=rank===1?"#ca8a04":rank===2?"#6b7280":rank===3?"#b45309":"#1f2937";
  return(
    <div onClick={onOpen||undefined} style={{display:"flex",alignItems:"center",gap:12,padding:"8px 12px",borderRadius:12,
      background:highlight?"#1a2e0555":"transparent",border:highlight?"1px solid #84cc1625":"1px solid transparent",
      cursor:onOpen?"pointer":"default"}}
      onMouseEnter={e=>{if(onOpen)e.currentTarget.style.background=highlight?"#1a2e0580":"#ffffff08";}}
      onMouseLeave={e=>{e.currentTarget.style.background=highlight?"#1a2e0555":"transparent";}}>
      <div style={{width:28,height:28,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",
        fontSize:12,fontWeight:900,flexShrink:0,fontFamily:"'Barlow Condensed',sans-serif",
        background:medal,color:rank<=3?"#000":"#9ca3af"}}>{rank}</div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:3}}>
          <span style={{color:"#fff",fontWeight:600,fontSize:14,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{player.name}</span>
          {isMe&&<span style={{color:"#84cc16",fontSize:11}}>(toi)</span>}
          {elig&&<span style={{background:"#84cc1620",color:"#84cc16",fontSize:10,padding:"1px 5px",borderRadius:4}}>✓</span>}
        </div>
        <div style={{display:"flex",gap:3}}>{ZK.map(zk=><ZonePip key={zk} zone={zk} played={(player.zonesPlayed||[]).includes(zk)}/>)}</div>
      </div>
      <div style={{textAlign:"right",flexShrink:0}}>
        <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:22,color:highlight?"#84cc16":"#e5e7eb"}}>{player.globalPoints}</div>
        {player.lastResult&&player.lastResult.bonus&&<div style={{fontSize:10,color:"#f97316"}}>🔥x1.5</div>}
      </div>
    </div>
  );
}

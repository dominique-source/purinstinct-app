import { useEffect, useRef, useState } from "react";
import { ZK } from "../../config/zones.js";
import { ZonePip } from "./ZonePip.jsx";
import { S } from "./styles.js";
import { useCountUp } from "../../hooks/useCountUp.js";

export function LeaderRow({player,rank,highlight,isMe,onOpen}){
  const elig=(player.zonesPlayed||[]).length===6;
  const medal=rank===1?"#ca8a04":rank===2?"#6b7280":rank===3?"#b45309":"#1f2937";
  const pts=useCountUp(player.globalPoints);
  // Détecte un changement de score/rang entre renders pour déclencher le flash
  const prevRef=useRef({rank,score:player.globalPoints});
  const [flash,setFlash]=useState(false);
  useEffect(()=>{
    const prev=prevRef.current;
    if(prev.rank!==rank||prev.score!==player.globalPoints){
      prevRef.current={rank,score:player.globalPoints};
      setFlash(false);
      const raf=requestAnimationFrame(()=>setFlash(true)); // re-arme l'animation CSS
      const to=setTimeout(()=>setFlash(false),600);
      return()=>{cancelAnimationFrame(raf);clearTimeout(to);};
    }
  },[rank,player.globalPoints]);
  return(
    <div onClick={onOpen||undefined} style={{display:"flex",alignItems:"center",gap:12,padding:"8px 12px",borderRadius:12,
      background:highlight?"#1a2e0555":"transparent",border:highlight?"1px solid #84cc1625":"1px solid transparent",
      cursor:onOpen?"pointer":"default"}}
      onMouseEnter={e=>{if(onOpen)e.currentTarget.style.background=highlight?"#1a2e0580":"#ffffff08";}}
      onMouseLeave={e=>{e.currentTarget.style.background=highlight?"#1a2e0555":"transparent";}}>
      <div style={{width:28,height:28,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,
        ...S.display(13),clipPath:S.clip(6),
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
        <div className={flash?"flash-change":""} style={{...S.display(22),color:highlight?"#84cc16":"#e5e7eb"}}>{pts}</div>
        {player.lastResult&&player.lastResult.bonus&&<div style={{fontSize:10,color:"#f97316"}}>🔥x1.5</div>}
      </div>
    </div>
  );
}

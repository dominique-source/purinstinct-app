import { useState, useRef } from "react";
import { ZONES } from "../../config/zones.js";
import { useT } from "../../hooks/useLang.js";
import { S } from "./styles.js";
import { Bib } from "./Bib.jsx";
import { TierBadge } from "./TierBadge.jsx";

export function QueueList({zone,qPlayers,onMoveTop,onMoveBottom,onRemove,onReorder,highlightId}){
  const t=useT();
  const z=ZONES[zone];
  const [dragIdx,setDragIdx]=useState(null);
  const [overIdx,setOverIdx]=useState(null);
  const touchRef=useRef({fromIdx:null});
  const listRef=useRef(null);

  const handleDrop=(toIdx)=>{
    if(dragIdx===null||dragIdx===toIdx){setDragIdx(null);setOverIdx(null);return;}
    const ids=qPlayers.map(p=>p.id);
    const [moved]=ids.splice(dragIdx,1);
    ids.splice(toIdx,0,moved);
    onReorder(zone,ids);
    setDragIdx(null);setOverIdx(null);
  };

  // Touch drag — démarre immédiatement sur le handle ⠿
  const handleHandleTouchStart=(e,idx)=>{
    e.preventDefault(); // empêche scroll et sélection texte
    touchRef.current.fromIdx=idx;
    setDragIdx(idx);
    navigator.vibrate&&navigator.vibrate(30);
  };

  const handleTouchMove=(e)=>{
    if(dragIdx===null) return;
    e.preventDefault();
    const touch=e.touches[0];
    const list=listRef.current;
    if(!list) return;
    const items=[...list.querySelectorAll("[data-queue-item]")];
    for(let i=0;i<items.length;i++){
      const rect=items[i].getBoundingClientRect();
      if(touch.clientY>=rect.top&&touch.clientY<=rect.bottom){
        setOverIdx(i); return;
      }
    }
  };

  const handleTouchEnd=()=>{
    if(dragIdx!==null){
      handleDrop(overIdx!==null?overIdx:dragIdx);
    }
    touchRef.current.fromIdx=null;
  };

  if(qPlayers.length===0) return(
    <div style={{textAlign:"center",padding:"28px 0",color:"#374151",fontSize:13}}>
      <div style={{fontSize:32,marginBottom:6,opacity:.25}}>⏳</div>
      {t.autoRefill}
    </div>
  );

  return(
    <div ref={listRef} style={{display:"flex",flexDirection:"column",gap:5,userSelect:"none"}}
      onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
      {qPlayers.map((p,idx)=>{
        const zs=(p.zoneScores||{})[zone]||50;
        const streak=(p.zoneStreaks||{})[zone]||0;
        const isOver=overIdx===idx;
        const isDragging=dragIdx===idx;
        return(
          <div key={p.id} data-queue-item="1"
            draggable
            onDragStart={()=>setDragIdx(idx)}
            onDragOver={e=>{e.preventDefault();setOverIdx(idx);}}
            onDrop={()=>handleDrop(idx)}
            onDragEnd={()=>{setDragIdx(null);setOverIdx(null);}}
            style={{...S.row(),padding:"8px 10px",borderRadius:10,
              background:p.id===highlightId?"#1a2e05":isDragging?"#1a2e05":isOver?"#1a1a2e":"#0d0f1a",
              border:p.id===highlightId?"2px solid "+z.color:isOver?"2px solid "+z.color+"80":isDragging?"2px solid #84cc1660":"1px solid transparent",
              cursor:"grab",transition:"all .15s",opacity:isDragging?0.5:1,
              animation:p.id===highlightId?"pulseLime 0.6s ease-in-out 4":"none"}}>
            {/* drag handle — toucher pour drag sur mobile */}
            <div
              onTouchStart={(e)=>handleHandleTouchStart(e,idx)}
              style={{color:isDragging?"#84cc16":"#4b5563",fontSize:20,flexShrink:0,
                cursor:"grab",touchAction:"none",padding:"0 4px 0 0",lineHeight:1}}>⠿</div>
            <div style={{fontSize:11,color:"#374151",fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,width:16,flexShrink:0}}>{idx+1}</div>
            <Bib n={p.number} size="sm" color={z.color}/>
            <span style={{fontSize:13,color:"#fff",flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.name}</span>
            {zone==="speed"&&<TierBadge score={zs}/>}
            {zone!=="speed"&&<div style={{...S.tag(z.color),fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700}}>{zs}</div>}
            {streak>=2&&<span style={{fontSize:11,color:"#f97316",flexShrink:0}}>🔥x{streak}</span>}
            <button onClick={(e)=>{e.stopPropagation();onMoveTop(p.id,zone);}}
              style={{background:"none",border:"none",cursor:"pointer",color:"#4b5563",fontSize:16,lineHeight:1,padding:"0 2px"}}
              onMouseEnter={e=>e.target.style.color="#84cc16"}
              onMouseLeave={e=>e.target.style.color="#4b5563"}>↑</button>
            <button onClick={(e)=>{e.stopPropagation();onMoveBottom(p.id,zone);}}
              style={{background:"none",border:"none",cursor:"pointer",color:"#4b5563",fontSize:16,lineHeight:1,padding:"0 2px"}}
              onMouseEnter={e=>e.target.style.color="#f97316"}
              onMouseLeave={e=>e.target.style.color="#4b5563"}>↓</button>
            <button onClick={(e)=>{e.stopPropagation();onRemove(p.id,zone);}}
              style={{background:"none",border:"none",cursor:"pointer",color:"#374151",fontSize:16,lineHeight:1,padding:"0 2px"}}
              onMouseEnter={e=>e.target.style.color="#ef4444"}
              onMouseLeave={e=>e.target.style.color="#374151"}>×</button>
          </div>
        );
      })}
    </div>
  );
}

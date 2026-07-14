import { useState } from "react";
import { ZONES, TIERS, getSprintTier } from "../../config/zones.js";
import { useT } from "../../hooks/useLang.js";
import { S } from "../shared/styles.js";
import { Bib } from "../shared/Bib.jsx";
import { TierBadge } from "../shared/TierBadge.jsx";

export function SprintGameView({game,players,zone,onWinner,onRemove,onReplace,locked}){
  const t=useT();
  const z=ZONES[zone];
  const pMap={}; players.forEach(p=>{pMap[p.id]=p;});
  const participants=game.participants||[];
  const pList=participants.map(id=>pMap[id]).filter(Boolean);
  const [selectedFirst,setSelectedFirst]=useState(null);
  const [selectedSecond,setSelectedSecond]=useState(null);

  const handleConfirm=()=>{
    if(!selectedFirst) return;
    onWinner(selectedFirst, selectedSecond||null);
    setSelectedFirst(null); setSelectedSecond(null);
  };

  return(
    <div>
      <div style={{...S.row(),justifyContent:"space-between",marginBottom:12}}>
        <div style={{...S.label()}}>{t.raceInProgress} - {pList.length} {t.coureurs}</div>
        <div className="pulse-lime" style={{...S.tag("#dc2626")}}>{t.live}</div>
      </div>

      {/* Sprint handicap legend */}
      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:12}}>
        {[1,2,3,4,5].map(t=>(
          <div key={t} style={{...S.tag(TIERS[t].color),fontSize:10}}>
            {TIERS[t].label} = {TIERS[t].pos}
          </div>
        ))}
      </div>

      {/* Participants */}
      <div style={{display:"flex",flexDirection:"column",gap:5,marginBottom:16}}>
        {pList.map((p,i)=>{
          const tier=getSprintTier((p.zoneScores||{}).speed||50);
          const t=TIERS[tier];
          const streak=(p.zoneStreaks||{})[zone]||0;
          const isFirst=selectedFirst===p.id;
          const isSecond=selectedSecond===p.id;
          return(
            <div key={p.id} style={{...S.row(),padding:"8px 10px",borderRadius:10,
              background:isFirst?"#1a2e05":isSecond?"#1a1400":"#0d0f1a",
              border:"2px solid "+(isFirst?"#84cc16":isSecond?"#ca8a04":t.color+"40")}}>
              <div style={{width:24,height:24,borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",
                fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:12,
                background:t.color+"22",color:t.color,flexShrink:0}}>{i+1}</div>
              <TierBadge score={(p.zoneScores||{}).speed||50}/>
              <Bib n={p.number} size="sm" color={t.color}/>
              <span style={{flex:1,color:"#fff",fontWeight:600,fontSize:13}}>{p.name}</span>
              {isFirst&&<span style={{fontSize:11,color:"#84cc16",fontWeight:700}}>🥇 1er</span>}
              {isSecond&&<span style={{fontSize:11,color:"#ca8a04",fontWeight:700}}>🥈 2e</span>}
              {streak>=2&&<span style={{fontSize:11,color:"#f97316"}}>🔥x{streak}</span>}
              <span style={{fontSize:11,color:t.color,fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700}}>{(p.zoneScores||{}).speed||50}</span>
              <button onClick={()=>onRemove(p.id)} title="Retirer de la course"
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

      {/* Sélection 1er place */}
      <div style={{...S.label(),textAlign:"center",marginBottom:8}}>
        {!selectedFirst?"🥇 Sélectionner le gagnant":"🥈 Sélectionner le 2e place (optionnel)"}
      </div>
      <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:10,opacity:locked?0.4:1,pointerEvents:locked?"none":"auto"}}>
        {pList.filter(p=>p.id!==selectedSecond).map(p=>{
          const tier=getSprintTier((p.zoneScores||{}).speed||50);
          const t=TIERS[tier];
          const isFirst=selectedFirst===p.id;
          return(
            <button key={p.id} onClick={()=>{
              if(locked) return;
              if(!selectedFirst){setSelectedFirst(p.id);}
              else if(p.id===selectedFirst){setSelectedFirst(null);setSelectedSecond(null);}
              else{setSelectedSecond(p.id===selectedSecond?null:p.id);}
            }}
              style={{flex:"1 1 45%",minHeight:64,padding:"12px 10px",borderRadius:12,border:"2px solid "+(isFirst?"#84cc16":selectedFirst?"#ca8a0460":"transparent"),cursor:"pointer",
                background:isFirst?"#84cc16":selectedFirst?t.color+"90":t.color,
                color:"#000",fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:16,
                boxShadow:"0 3px 12px "+t.color+"40"}}>
              {isFirst?"🥇 ":""}#{p.number} {p.name.split(" ")[0]}
            </button>
          );
        })}
      </div>

      {/* Confirmer */}
      {selectedFirst&&(
        <div style={{display:"flex",gap:8,opacity:locked?0.4:1,pointerEvents:locked?"none":"auto"}}>
          <button onClick={()=>!locked&&handleConfirm()}
            style={{flex:1,minHeight:64,padding:"14px",borderRadius:12,border:"none",cursor:"pointer",
              background:"#84cc16",color:"#000",fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:16}}>
            ✓ Confirmer{selectedSecond?" (1er + 2e)":" (1er seulement)"}
          </button>
          <button onClick={()=>{setSelectedFirst(null);setSelectedSecond(null);}}
            style={{minHeight:64,padding:"14px 16px",borderRadius:12,border:"1px solid #374151",cursor:"pointer",
              background:"#111827",color:"#6b7280",fontSize:13}}>
            ✕
          </button>
        </div>
      )}
    </div>
  );
}

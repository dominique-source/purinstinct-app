import { useState, useRef } from "react";
import { useT } from "../../../hooks/useLang.js";
import { S } from "../../shared/styles.js";
import { Bib } from "../../shared/Bib.jsx";
import { LeaderRow } from "../../shared/LeaderRow.jsx";

export function LeaderboardTab({sorted,onOpenDossier}){
  const t=useT();
  const [leaderSearch,setLeaderSearch]=useState("");
  const [leaderHighlight,setLeaderHighlight]=useState(null);
  const leaderHighlightRef=useRef(null);

  return(
    <div className="anim-up">
      <div style={{...S.row(),justifyContent:"space-between",marginBottom:12}}>
        <div style={{...S.label()}}>{t.realtimeRank}</div>
        <div style={{fontSize:11,color:"#4b5563"}}><span style={{color:"#B8E020"}}>✓</span> = 6/6 {t.eligible}</div>
      </div>
      {/* Barre de recherche */}
      <div style={{position:"relative",marginBottom:10}}>
        <input value={leaderSearch} onChange={e=>{setLeaderSearch(e.target.value);setLeaderHighlight(null);}}
          placeholder={t.searchPlayer}
          style={{width:"100%",padding:"8px 12px",borderRadius:10,border:"1px solid #374151",
            background:"#0d0f1a",color:"#fff",fontSize:16,outline:"none",boxSizing:"border-box"}}/>
        {leaderSearch.trim().length>0&&(()=>{
          const q=leaderSearch.trim().toLowerCase();
          const matches=sorted.filter(p=>p.name.toLowerCase().includes(q));
          if(matches.length===0) return null;
          return(
            <div style={{position:"absolute",top:"100%",left:0,right:0,zIndex:10,
              background:"#111827",border:"1px solid #374151",borderRadius:10,marginTop:4,
              maxHeight:180,overflowY:"auto",boxShadow:"0 8px 24px rgba(0,0,0,.5)"}}>
              {matches.map(p=>(
                <div key={p.id} onClick={()=>{
                  setLeaderHighlight(p.id);
                  setLeaderSearch("");
                  setTimeout(()=>{leaderHighlightRef.current&&leaderHighlightRef.current.scrollIntoView({behavior:"smooth",block:"center"});},100);
                }} style={{...S.row(),gap:10,padding:"8px 12px",cursor:"pointer",borderBottom:"1px solid #1f2937"}}
                  onMouseEnter={e=>e.currentTarget.style.background="#1f2937"}
                  onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  <Bib n={p.number} size="sm"/>
                  <span style={{color:"#fff",fontSize:13,flex:1}}>{p.name}</span>
                  <span style={{color:"#B8E020",fontSize:12,fontWeight:700}}>#{sorted.indexOf(p)+1}</span>
                </div>
              ))}
            </div>
          );
        })()}
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:2}}>
        {sorted.map((p,i)=>(
          <div key={p.id} ref={p.id===leaderHighlight?leaderHighlightRef:null}>
            <LeaderRow player={p} rank={i+1}
              highlight={p.id===leaderHighlight}
              onOpen={()=>onOpenDossier(p.id)}/>
          </div>
        ))}
      </div>
      {leaderHighlight&&<button onClick={()=>setLeaderHighlight(null)}
        style={{marginTop:8,fontSize:11,color:"#4b5563",background:"none",border:"none",cursor:"pointer"}}>
        Effacer la surbrillance
      </button>}
    </div>
  );
}

import { useState, useRef } from "react";
import { useT } from "../../../hooks/useLang.js";
import { Bib } from "../../shared/Bib.jsx";
import { LeaderRow } from "../../shared/LeaderRow.jsx";
import { Eyebrow } from "../../ui/Panel.jsx";

export function PlayerLeaderboardTab({sorted,playerId}){
  const t=useT();
  const [leaderSearch,setLeaderSearch]=useState("");
  const [leaderHighlight,setLeaderHighlight]=useState(null);
  const leaderHighlightRef=useRef(null);

  return(
    <div className="pi-anim-up">
      <Eyebrow style={{marginBottom:"var(--pi-s3)"}}>{t.tabLeader} - {sorted.filter(p=>(p.zonesPlayed||[]).length===6).length} {t.eligibles}</Eyebrow>
      <div style={{position:"relative",marginBottom:"var(--pi-s3)"}}>
        <input value={leaderSearch} onChange={e=>{setLeaderSearch(e.target.value);setLeaderHighlight(null);}}
          placeholder={t.searchPlayer} className="pi-input"/>
        {leaderSearch.trim().length>0&&(()=>{
          const q=leaderSearch.trim().toLowerCase();
          const matches=sorted.filter(p=>p.name.toLowerCase().includes(q));
          if(matches.length===0) return null;
          return(
            <div style={{position:"absolute",top:"100%",left:0,right:0,zIndex:10,
              background:"var(--pi-surface-2)",border:"1px solid var(--pi-line-strong)",borderRadius:"var(--pi-r-md)",marginTop:4,
              maxHeight:180,overflowY:"auto",boxShadow:"var(--pi-shadow-float)"}}>
              {matches.map(p=>(
                <div key={p.id} onClick={()=>{
                  setLeaderHighlight(p.id);
                  setLeaderSearch("");
                  setTimeout(()=>{leaderHighlightRef.current&&leaderHighlightRef.current.scrollIntoView({behavior:"smooth",block:"center"});},100);
                }} style={{display:"flex",alignItems:"center",gap:10,padding:"var(--pi-s2) var(--pi-s3)",cursor:"pointer",borderBottom:"1px solid var(--pi-line)"}}
                  onMouseEnter={e=>e.currentTarget.style.background="var(--pi-surface-3)"}
                  onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  <Bib n={p.number} size="sm"/>
                  <span style={{color:"var(--pi-text)",fontSize:"var(--pi-fs-body)",flex:1}}>{p.name}</span>
                  <span style={{color:"var(--pi-lime)",fontSize:"var(--pi-fs-label)",fontWeight:700}}>#{sorted.indexOf(p)+1}</span>
                </div>
              ))}
            </div>
          );
        })()}
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:2}}>
        {sorted.map((p,i)=>(
          <div key={p.id} ref={p.id===leaderHighlight?leaderHighlightRef:null}>
            <LeaderRow player={p} rank={i+1} highlight={p.id===playerId||p.id===leaderHighlight} isMe={p.id===playerId&&!leaderHighlight}/>
          </div>
        ))}
      </div>
      {leaderHighlight&&leaderHighlight!==playerId&&<button onClick={()=>setLeaderHighlight(null)}
        style={{marginTop:"var(--pi-s2)",fontSize:"var(--pi-fs-label)",color:"var(--pi-text-3)",background:"none",border:"none",cursor:"pointer"}}>
        Effacer la surbrillance
      </button>}
    </div>
  );
}

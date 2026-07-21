import { useState } from "react";
import { ZONES, ZK } from "../../../config/zones.js";
import { useZn, useT } from "../../../hooks/useLang.js";
import { Button, IconButton } from "../../ui/Button.jsx";
import { Panel } from "../../ui/Panel.jsx";

// "Join a queue" screen — one action card per active zone, showing this
// player's position, live-game state, and an expandable queue preview.
export function PlayerQueueView({playerId,players,queues,activeGames,disabledZones,inQueues,canJoin,player,onJoin,onLeave,onBack,onBecomeStation}){
  const t=useT();
  const zn=useZn();
  const [expandedQueues,setExpandedQueues]=useState({});

  return(
    <div style={{minHeight:"100svh"}}>
      <div style={{paddingTop:"calc(env(safe-area-inset-top) + var(--pi-s4))",padding:"calc(env(safe-area-inset-top) + var(--pi-s4)) var(--pi-gutter) var(--pi-gutter)",
        maxWidth:"var(--pi-w-content)",margin:"0 auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"var(--pi-s4)"}}>
          <IconButton label="Retour" onClick={onBack}>←</IconButton>
          {onBecomeStation&&<Button variant="outline" size="sm" onClick={onBecomeStation}>{t.stationManager}</Button>}
        </div>
        <div style={{fontFamily:"var(--pi-font-display)",fontWeight:900,fontStyle:"italic",fontSize:"var(--pi-fs-title)",color:"var(--pi-text)",marginBottom:"var(--pi-s4)"}}>{t.hubTitle}</div>

        {inQueues.length>=2&&(
          <Panel style={{background:"var(--pi-warn-wash)",borderColor:"var(--pi-warn)",display:"flex",alignItems:"center",gap:"var(--pi-s2)",marginBottom:"var(--pi-s4)"}}>
            <span style={{fontSize:16}}>⚠️</span>
            <span style={{fontSize:"var(--pi-fs-body)",color:"var(--pi-warn)",fontWeight:600}}>Maximum 2 files d'attente par joueur</span>
          </Panel>
        )}

        <div style={{display:"flex",flexDirection:"column",gap:"var(--pi-s3)"}}>
          {ZK.filter(zk=>!(disabledZones||[]).includes(zk)).map(zk=>{
            const z=ZONES[zk];const zl=zn(zk);
            const inQ=inQueues.includes(zk);
            const inG=activeGames[zk]&&(()=>{const g=activeGames[zk];const all=g.participants||[...(g.teamA||[]),...(g.teamB||[])];return all.includes(playerId);})();
            const played=(player.zonesPlayed||[]).includes(zk);
            const zoneQueue=(queues[zk]||[]).map(id=>players.find(p=>p.id===id)).filter(Boolean);
            const myPos=zoneQueue.findIndex(p=>p.id===playerId);
            return(
              <Panel key={zk} flush style={{background:inQ||inG?z.bg:"var(--pi-surface-1)",borderColor:inQ||inG?z.color:"var(--pi-line)"}}>
                <div style={{padding:"var(--pi-s4)",display:"flex",alignItems:"center",gap:"var(--pi-s3)"}}>
                  <span style={{fontSize:24}}>{z.icon}</span>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:700,color:"var(--pi-text)",fontSize:"var(--pi-fs-card)"}}>{zl.name}</div>
                    {inQ&&<div style={{fontSize:"var(--pi-fs-label)",color:z.color,fontWeight:600}}>#{myPos+1} en file</div>}
                    {inG&&<div style={{fontSize:"var(--pi-fs-label)",color:"var(--pi-warn)",fontWeight:600}}>⚡ En jeu !</div>}
                    {played&&!inQ&&!inG&&<div style={{fontSize:"var(--pi-fs-meta)",color:"var(--pi-text-3)"}}>✓ Déjà jouée</div>}
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:"var(--pi-s2)"}}>
                    {zoneQueue.length>0&&<span style={{fontSize:"var(--pi-fs-label)",color:z.color,fontWeight:700,fontFamily:"var(--pi-font-display)"}}>{zoneQueue.length} en file</span>}
                    {inQ?<Button variant="ghost" size="sm" onClick={()=>onLeave(playerId,zk)}>Quitter</Button>
                      :!inG&&canJoin&&<Button variant="primary" size="sm" onClick={()=>onJoin(playerId,zk)}>+ File</Button>}
                  </div>
                </div>
                {zoneQueue.length>0&&(
                  <>
                    <div style={{borderTop:`1px solid ${z.color}20`,padding:"var(--pi-s2) var(--pi-s4)"}}>
                      <button onClick={()=>setExpandedQueues(prev=>({...prev,[zk]:!prev[zk]}))}
                        style={{background:"none",border:"none",cursor:"pointer",color:z.color,
                          fontSize:"var(--pi-fs-label)",fontWeight:600,padding:0,display:"flex",alignItems:"center",gap:4}}>
                        {expandedQueues[zk]?t.hideQueue:t.showQueue} ({zoneQueue.length})
                      </button>
                    </div>
                    {expandedQueues[zk]&&(
                      <div style={{padding:"var(--pi-s2) var(--pi-s4) var(--pi-s3)",display:"flex",flexWrap:"wrap",gap:"var(--pi-s1)"}}>
                        {zoneQueue.map((p,i)=>(
                          <span key={p.id} style={{fontSize:"var(--pi-fs-label)",padding:"2px 8px",borderRadius:"var(--pi-r-pill)",fontWeight:p.id===playerId?700:400,
                            background:p.id===playerId?z.color+"30":"var(--pi-surface-3)",
                            color:p.id===playerId?z.color:"var(--pi-text-2)"}}>
                            {i+1}. {p.name.split(" ")[0]}
                          </span>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </Panel>
            );
          })}
        </div>
      </div>
    </div>
  );
}

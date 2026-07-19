import { useState, useEffect } from "react";
import { ZONES, ZK } from "../../../config/zones.js";
import { useZn, useT } from "../../../hooks/useLang.js";
import { S } from "../../shared/styles.js";

// Au-delà de ce délai sans résultat soumis (arène active), une zone est signalée comme stagnante dans le cockpit.
const STAGNATION_THRESHOLD_MS=4*60*1000;

export function CockpitTab({queues,activeGames,arenaState,lastResultAt,onToggleZone,onPause,onResume,onEnd,winnersPublished,onPublishWinners,onUnpublishWinners}){
  const t=useT();
  const zn=useZn();
  const [now,setNow]=useState(()=>Date.now()); // horloge cockpit: rafraîchit "il y a X" et les alertes de stagnation

  useEffect(()=>{const iv=setInterval(()=>setNow(Date.now()),10000);return()=>clearInterval(iv);},[]);

  // "il y a X" — "—" si aucun résultat encore soumis pour la zone
  const fmtAgo=(ts)=>{
    if(!ts) return "—";
    const s=Math.max(0,Math.floor((now-ts)/1000));
    if(s<60) return "il y a "+s+" s";
    return "il y a "+Math.floor(s/60)+" min";
  };
  return(
  <div className="anim-up" style={{display:"flex",flexDirection:"column",gap:12}}>
    {/* Contrôles globaux — regroupés ici pour piloter l'arène sans changer d'onglet */}
    <div style={{...S.heroCard(),display:"flex",flexWrap:"wrap",alignItems:"center",gap:8,padding:14}}>
      <div style={{...S.label(),marginRight:"auto"}}>Contrôle arène</div>
      {arenaState.active&&<button onClick={onPause} style={{...S.btn("#f97316"),padding:"6px 14px",fontSize:12,color:"#000"}}>⏸ Pause</button>}
      {arenaState.paused&&<button onClick={onResume} style={{...S.btn("#B8E020"),padding:"6px 14px",fontSize:12,color:"#000"}}>▶ Reprendre</button>}
      {(arenaState.active||arenaState.paused)&&<button onClick={onEnd} style={{...S.btn("#dc2626"),padding:"6px 14px",fontSize:12,color:"#fff"}}>■ Terminer</button>}
      <button onClick={winnersPublished?onUnpublishWinners:onPublishWinners}
        style={{...S.btn(winnersPublished?"#374151":"#B8E020"),padding:"6px 14px",fontSize:12,color:winnersPublished?"#9ca3af":"#000"}}>
        {winnersPublished?t.unpublish:t.publish}
      </button>
    </div>

    {/* Grille temps réel des 6 zones — vue d'ensemble sans drill-down */}
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:10}}>
      {ZK.map(zk=>{
        const z=ZONES[zk]; const zl=zn(zk);
        const q=queues[zk]||[]; const game=activeGames[zk];
        const allInGame=game?(game.participants||[...(game.teamA||[]),...(game.teamB||[])]).length:0;
        const isDisabled=(arenaState.disabledZones||[]).includes(zk);
        const last=lastResultAt&&lastResultAt[zk];
        const hasPlayers=q.length>0||!!game;
        // Aucun résultat encore soumis => on se réfère au départ de l'arène (jamais un timestamp null: évite NaN/Infinity)
        const ref=last||arenaState.startTime;
        const stagnant=arenaState.active&&!isDisabled&&hasPlayers&&!!ref&&(now-ref)>STAGNATION_THRESHOLD_MS;
        const borderCol=isDisabled?"#1f2937":stagnant?"#f59e0b":z.border;
        // Match en cours = carte héros (coins coupés + rim aux couleurs de la zone);
        // l'alerte de stagnation garde priorité visuelle (bordure ambre, carte standard)
        const base=game&&!isDisabled&&!stagnant
          ?{...S.heroCard(z.color),padding:14}
          :{...S.card(),border:"1px solid "+borderCol};
        return(
          <div key={zk} style={{...base,opacity:isDisabled?0.5:1,
            display:"flex",flexDirection:"column",gap:10}}>
            {/* En-tête zone + toggle activation */}
            <div style={{...S.row(),justifyContent:"space-between"}}>
              <div style={{...S.row(),gap:8,minWidth:0}}>
                <span style={{fontSize:20,flexShrink:0}}>{z.icon}</span>
                <div style={{color:"#fff",fontWeight:700,fontSize:14,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{zl.name}</div>
                {stagnant&&<span className="pulse-lime" style={S.liveDot("#f59e0b")}/>}
              </div>
              <button onClick={()=>onToggleZone(zk)}
                style={{padding:"4px 10px",borderRadius:20,cursor:"pointer",fontSize:10,fontWeight:700,flexShrink:0,
                  background:isDisabled?"#ef444420":"#B8E02020",color:isDisabled?"#ef4444":"#B8E020",
                  border:"1px solid "+(isDisabled?"#ef444440":"#B8E02040")}}>
                {isDisabled?"⏸ OFF":"● ON"}
              </button>
            </div>
            {/* Partie en cours + file */}
            <div style={{...S.row(),justifyContent:"space-between",gap:8}}>
              {game
                ?<div style={S.liveTag()}><span className="pulse-lime" style={S.liveDot("#dc2626",6)}/>⚡ {allInGame} en partie</div>
                :<div style={{fontSize:12,color:"#4b5563"}}>Aucune partie</div>}
              <div style={{...S.tag(z.color)}}>{q.length} en file</div>
            </div>
            {/* Dernier résultat */}
            <div style={{...S.row(),justifyContent:"space-between",fontSize:11}}>
              <span style={{color:"#4b5563",textTransform:"uppercase",letterSpacing:"1px"}}>Dernier résultat</span>
              <span style={{color:stagnant?"#f59e0b":"#6b7280",fontWeight:stagnant?700:600}}>{fmtAgo(last)}</span>
            </div>
          </div>
        );
      })}
    </div>
  </div>
  );
}

import { useState, useEffect } from "react";
import { ZONES, ZK } from "../../../config/zones.js";
import { useZn, useT } from "../../../hooks/useLang.js";
import { Button } from "../../ui/Button.jsx";
import { Panel, Eyebrow } from "../../ui/Panel.jsx";
import { Badge, LiveIndicator } from "../../ui/Status.jsx";

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
  <div className="pi-anim-up" style={{display:"flex",flexDirection:"column",gap:"var(--pi-s3)"}}>
    {/* Contrôles globaux — regroupés ici pour piloter l'arène sans changer d'onglet */}
    <Panel variant="hero" style={{display:"flex",flexWrap:"wrap",alignItems:"center",gap:"var(--pi-s2)"}}>
      <Eyebrow style={{marginRight:"auto"}}>Contrôle arène</Eyebrow>
      {arenaState.active&&<Button variant="secondary" size="sm" onClick={onPause} style={{background:"var(--pi-warn-wash)",color:"var(--pi-warn)"}}>⏸ Pause</Button>}
      {arenaState.paused&&<Button variant="primary" size="sm" onClick={onResume}>▶ Reprendre</Button>}
      {(arenaState.active||arenaState.paused)&&<Button variant="danger" size="sm" onClick={onEnd}>■ Terminer</Button>}
      <Button variant={winnersPublished?"secondary":"primary"} size="sm" onClick={winnersPublished?onUnpublishWinners:onPublishWinners}>
        {winnersPublished?t.unpublish:t.publish}
      </Button>
    </Panel>

    {/* Grille temps réel des 6 zones — vue d'ensemble sans drill-down */}
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:"var(--pi-s3)"}}>
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
        const borderCol=isDisabled?"var(--pi-line)":stagnant?"var(--pi-warn)":z.border;
        // Match en cours = carte héros (coins coupés + rim aux couleurs de la zone);
        // l'alerte de stagnation garde priorité visuelle (bordure ambre, carte standard)
        const isHero=game&&!isDisabled&&!stagnant;
        return(
          <Panel key={zk} variant={isHero?"hero":"default"}
            style={{borderColor:isHero?z.color+"50":borderCol,opacity:isDisabled?0.5:1,
              display:"flex",flexDirection:"column",gap:"var(--pi-s2)"}}>
            {/* En-tête zone + toggle activation */}
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div style={{display:"flex",alignItems:"center",gap:"var(--pi-s2)",minWidth:0}}>
                <span style={{fontSize:20,flexShrink:0}}>{z.icon}</span>
                <div style={{color:"var(--pi-text)",fontWeight:700,fontSize:"var(--pi-fs-body)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{zl.name}</div>
                {stagnant&&<span className="pi-pulse" style={{width:9,height:9,borderRadius:"50%",flexShrink:0,background:"var(--pi-warn)",boxShadow:"0 0 6px var(--pi-warn)"}}/>}
              </div>
              <button onClick={()=>onToggleZone(zk)}
                style={{padding:"4px 10px",borderRadius:"var(--pi-r-pill)",cursor:"pointer",fontSize:"var(--pi-fs-meta)",fontWeight:700,flexShrink:0,border:"1px solid",
                  background:isDisabled?"var(--pi-danger-wash)":"var(--pi-lime-wash)",color:isDisabled?"var(--pi-danger)":"var(--pi-lime)",
                  borderColor:isDisabled?"var(--pi-danger)":"var(--pi-lime-line)"}}>
                {isDisabled?"⏸ OFF":"● ON"}
              </button>
            </div>
            {/* Partie en cours + file */}
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:"var(--pi-s2)"}}>
              {game
                ?<LiveIndicator label={allInGame+" en partie"}/>
                :<div style={{fontSize:"var(--pi-fs-body)",color:"var(--pi-text-3)"}}>Aucune partie</div>}
              <Badge style={{background:z.color+"18",color:z.color}}>{q.length} en file</Badge>
            </div>
            {/* Dernier résultat */}
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",fontSize:"var(--pi-fs-label)"}}>
              <span style={{color:"var(--pi-text-3)",textTransform:"uppercase",letterSpacing:"1px"}}>Dernier résultat</span>
              <span style={{color:stagnant?"var(--pi-warn)":"var(--pi-text-2)",fontWeight:stagnant?700:600}}>{fmtAgo(last)}</span>
            </div>
          </Panel>
        );
      })}
    </div>
  </div>
  );
}

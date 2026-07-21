import { useState } from "react";
import { getStatus } from "../../lib/game-logic.js";
import { useZn, useT } from "../../hooks/useLang.js";
import { useArenaTimer } from "../../hooks/useArenaTimer.js";
import { useCountUp } from "../../hooks/useCountUp.js";
import { ZK } from "../../config/zones.js";
import { Bib } from "../shared/Bib.jsx";
import { LangFooter } from "../shared/LangFooter.jsx";
import { PlayerDossier } from "../admin/PlayerDossier.jsx";
import { PlayerRulesView } from "./PlayerRulesView.jsx";
import { Timer } from "../ui/Numerals.jsx";
import { IconButton, Button } from "../ui/Button.jsx";
import { PlayerHubView } from "./player/PlayerHubView.jsx";
import { PlayerQueueView } from "./player/PlayerQueueView.jsx";
import { PlayerStatsTab } from "./player/PlayerStatsTab.jsx";
import { PlayerLeaderboardTab } from "./player/PlayerLeaderboardTab.jsx";
import { PlayerWinnersTab } from "./player/PlayerWinnersTab.jsx";

export function PlayerView({playerId,players,queues,activeGames,disabledZones,arenaState,rosterCodes,sessionRosterId,winnersPublished,onJoin,onLeave,onLogout,onUpdatePlayer,onBecomeStation,onAddComment}){
  const t=useT();
  const zn=useZn();
  const player=players.find(p=>p.id===playerId);
  const {timer:arenaTimer,status:arenaStatus}=useArenaTimer(arenaState);
  const [tab,setTab]=useState("stats");
  const [showHub,setShowHub]=useState(true);
  const [skinIdx,setSkinIdx]=useState(2);
  const [hairIdx,setHairIdx]=useState(3);
  const [morphology,setMorphology]=useState(1);
  const hubPts=useCountUp(player?.globalPoints||0); // avant le early-return: règle des hooks
  if(!player) return null;

  // Full-screen dossier view
  if(tab==="profil") return(
    <PlayerDossier player={player}
      onSave={(updated)=>{if(onUpdatePlayer)onUpdatePlayer(updated);}}
      onBack={()=>setTab("stats")}
      onBecomeStation={onBecomeStation}
      onAddComment={onAddComment}
    />
  );

  const {inQueues,playingAt}=getStatus(playerId,queues,activeGames);
  const sorted=[...players].sort((a,b)=>b.globalPoints-a.globalPoints);
  const rank=sorted.findIndex(p=>p.id===playerId)+1;
  const activeZones=ZK.filter(zk=>!(disabledZones||[]).includes(zk));
  const elig=activeZones.every(zk=>(player.zonesPlayed||[]).includes(zk));
  const canJoin=inQueues.length<2&&!playingAt;

  if(showHub) return(
    <PlayerHubView player={player} rank={rank} hubPts={hubPts}
      arenaTimer={arenaTimer} arenaStatus={arenaStatus} arenaState={arenaState}
      rosterCodes={rosterCodes} sessionRosterId={sessionRosterId}
      onBecomeStation={onBecomeStation} onLogout={onLogout}
      onGoStats={()=>{setShowHub(false);setTab("stats");}}
      onGoRules={()=>{setShowHub(false);setTab("rules");}}
      onGoQueue={()=>{setShowHub(false);setTab("queue");}}
      onGoLeaderboard={()=>{setShowHub(false);setTab("leaderboard");}}/>
  );

  if(tab==="queue") return(
    <PlayerQueueView playerId={playerId} players={players} queues={queues} activeGames={activeGames}
      disabledZones={disabledZones} inQueues={inQueues} canJoin={canJoin} player={player}
      onJoin={onJoin} onLeave={onLeave} onBack={()=>setShowHub(true)} onBecomeStation={onBecomeStation}/>
  );

  return(<>
    <div style={{minHeight:"100svh",display:"flex",flexDirection:"column"}}>
      <header style={{position:"sticky",top:0,zIndex:"var(--pi-z-sticky)",background:"var(--pi-bg)",
        borderBottom:"1px solid var(--pi-line)",
        paddingTop:"calc(env(safe-area-inset-top) + 12px)",paddingBottom:12,paddingLeft:"var(--pi-gutter)",paddingRight:"var(--pi-gutter)"}}>
        <div style={{maxWidth:"var(--pi-w-content)",margin:"0 auto"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:"var(--pi-s3)",marginBottom:"var(--pi-s2)"}}>
          <div style={{display:"flex",alignItems:"center",gap:"var(--pi-s3)",minWidth:0}}>
            <Bib n={player.number} size="lg"/>
            <div style={{minWidth:0}}>
              <div style={{fontWeight:700,color:"var(--pi-text)",fontSize:"var(--pi-fs-card)",lineHeight:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{player.name}</div>
              <div style={{fontSize:"var(--pi-fs-label)",color:"var(--pi-text-3)",marginTop:2}}>{player.gender==="M"?"Homme":"Femme"}</div>
              {playingAt&&<span className="pi-pulse" style={{display:"inline-block",marginTop:3,padding:"2px 8px",borderRadius:"var(--pi-r-sm)",fontSize:"var(--pi-fs-meta)",fontWeight:700,background:"#fbbf2422",color:"#fbbf24"}}>⚡ En jeu : {zn(playingAt).sn}</span>}
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:"var(--pi-s3)",flexShrink:0}}>
            {arenaState&&arenaStatus!=="waiting"&&
              <Timer value={arenaTimer} tone={arenaStatus==="active"?"live":arenaStatus==="paused"?"paused":"ended"} size={20} className={arenaStatus==="active"?"pi-pulse":undefined}/>}
            <div style={{textAlign:"right"}}>
              <div style={{fontFamily:"var(--pi-font-display)",fontWeight:900,fontStyle:"italic",fontSize:32,color:"var(--pi-lime)",lineHeight:1}}>{player.globalPoints}</div>
              <div style={{fontSize:"var(--pi-fs-meta)",color:"var(--pi-text-3)"}}>#{rank}</div>
            </div>
            <IconButton label="Accueil" onClick={()=>setShowHub(true)}>⌂</IconButton>
            {onBecomeStation&&<Button variant="outline" size="sm" onClick={onBecomeStation}>📍</Button>}
          </div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:"var(--pi-s2)"}}>
          {/* 4 labels don't fit pi-tab's default nowrap at 390px — allow wrap + let flex items shrink below content width */}
          <div className="pi-tabs" role="tablist">
            {[["stats",t.myStats],["leaderboard",t.myRank],["rules",t.myRules],["profil",t.myProfile]].map(([id,label])=>(
              <button key={id} role="tab" aria-selected={tab===id} className={tab===id?"pi-tab is-active":"pi-tab"}
                style={{whiteSpace:"normal",lineHeight:1.15,minWidth:0}} onClick={()=>setTab(id)}>
                {label}
              </button>
            ))}
          </div>
          {winnersPublished&&(
            <button onClick={()=>setTab("winners")} className={tab==="winners"?"pi-tab is-active":"pi-tab"}
              style={{width:"100%",background:tab==="winners"?"#ca8a04":"#2d1a00",color:tab==="winners"?"#000":"#f59e0b",
                border:`1px solid ${tab==="winners"?"#ca8a04":"#ca8a0480"}`}}>
              {t.winnersTab}
            </button>
          )}
        </div>
        </div>
      </header>

      <main style={{flex:1,padding:"var(--pi-s4) var(--pi-gutter)"}}>
        <div style={{maxWidth:"var(--pi-w-content)",margin:"0 auto"}}>
        {tab==="stats"&&(
          <PlayerStatsTab player={player} playerId={playerId} players={players} hubPts={hubPts} rank={rank}
            activeZones={activeZones} elig={elig} disabledZones={disabledZones} activeGames={activeGames}
            inQueues={inQueues} playingAt={playingAt} canJoin={canJoin} onJoin={onJoin} onLeave={onLeave}
            rosterCodes={rosterCodes} sessionRosterId={sessionRosterId}
            skinIdx={skinIdx} hairIdx={hairIdx} morphology={morphology}
            onSetSkinIdx={setSkinIdx} onSetHairIdx={setHairIdx} onSetMorphology={setMorphology}/>
        )}
        {tab==="leaderboard"&&<PlayerLeaderboardTab sorted={sorted} playerId={playerId}/>}
        {tab==="rules"&&<PlayerRulesView/>}
        {tab==="winners"&&winnersPublished&&
          <PlayerWinnersTab player={player} playerId={playerId} players={players} disabledZones={disabledZones}/>}
        </div>
      </main>
    </div>
    <LangFooter/>
  </>);
}

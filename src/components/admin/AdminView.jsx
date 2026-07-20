import { useState, useEffect } from "react";
import { FONTS } from "../../config/fonts.js";
import { ZK } from "../../config/zones.js";
import { useT } from "../../hooks/useLang.js";
import { S } from "../shared/styles.js";
import { ZonePip } from "../shared/ZonePip.jsx";
import { PlayerDossier } from "./PlayerDossier.jsx";
import { LangFooter } from "../shared/LangFooter.jsx";
import { CockpitTab } from "./tabs/CockpitTab.jsx";
import { LeaderboardTab } from "./tabs/LeaderboardTab.jsx";
import { StationsTab } from "./tabs/StationsTab.jsx";
import { PlayersTab } from "./tabs/PlayersTab.jsx";
import { SessionTab } from "./tabs/SessionTab.jsx";
import { SurveyTab } from "./tabs/SurveyTab.jsx";
import { CommentsTab } from "./tabs/CommentsTab.jsx";
import { WinnersTab } from "./tabs/WinnersTab.jsx";
import { TeamsTab } from "./tabs/TeamsTab.jsx";

export function AdminView({players,allPlayers,queues,activeGames,arenaState,lastResultAt,rosters,activeRosterId,initialTab,teams,onToggleTeamMode,onAssignPlayer,onRemoveTeamMember,onRenameTeam,onStart,onEnd,onPause,onResume,onUpdateDuration,onGoStation,onToggleZone,onAddQ,onRemoveQ,onAddGroupToQueue,onLogout,onActivateRoster,onSetActiveRoster,onUpdateRoster,onDeleteRoster,onAddPlayer,onCreateRoster,onUpdatePlayer,onRemovePlayer,winnersPublished,onPublishWinners,onUnpublishWinners,rosterCodes,onUpdateCodes,pendingSessions,onDismissPending,onPromotePending,onResetAllPoints,onResetAllHistory,onResetAllSurveys,comments,onClearComments,augState,onUpdateAugState,onUpdatePlayer2}){
  const t=useT();
  const [tab,setTab]=useState(initialTab||"leaderboard");
  const [sessionMins,setSessionMins]=useState(arenaState.sessionMins||75);
  const [timer,setTimer]=useState("75:00");
  const [dossierPlayerId,setDossierPlayerId]=useState(null);
  const [dossierOrigin,setDossierOrigin]=useState(null);
  const [selectedStation,setSelectedStation]=useState(null);

  const openDossier=(id)=>{
    setDossierOrigin({tab,station:selectedStation});
    setDossierPlayerId(id);
  };

  const dossierPlayer = dossierPlayerId ? players.find(p=>p.id===dossierPlayerId) : null;


  useEffect(()=>{
    const totalSecs=(arenaState.sessionMins||75)*60;
    const fmt=(s)=>String(Math.floor(s/60)).padStart(2,"0")+":"+String(Math.floor(s%60)).padStart(2,"0");
    if(!arenaState.active&&!arenaState.paused){setTimer(fmt(totalSecs));return;}
    if(arenaState.paused){setTimer(fmt(arenaState.pausedRemaining||totalSecs));return;}
    const tick=()=>{
      const rem=Math.max(0,totalSecs-(Date.now()-arenaState.startTime)/1000);
      setTimer(fmt(rem));
    };
    tick(); const iv=setInterval(tick,1000); return()=>clearInterval(iv);
  },[arenaState]);

  const sorted=[...players].sort((a,b)=>b.globalPoints-a.globalPoints);
  const eligible=sorted.filter(p=>(p.zonesPlayed||[]).length===6);
  const winner=arenaState.ended&&eligible.length>0?eligible[0]:null;
  const timerColor=arenaState.active?"#B8E020":arenaState.paused?"#f97316":arenaState.ended?"#dc2626":"#374151";

  if(dossierPlayer) return(
    <PlayerDossier player={dossierPlayer}
      onSave={(updated)=>{onUpdatePlayer(updated);}}
      onBack={()=>{setDossierPlayerId(null);if(dossierOrigin){setTab(dossierOrigin.tab);setSelectedStation(dossierOrigin.station);}setDossierOrigin(null);}}/>
  );

  return(<>
    <div style={{minHeight:"100vh",background:"#0A0A0A",fontFamily:"'DM Sans',sans-serif"}}>
      <style>{FONTS}</style>

      {winner&&(
        <div style={{position:"fixed",inset:0,zIndex:50,display:"flex",alignItems:"center",justifyContent:"center",
          padding:16,background:"rgba(0,0,0,.85)",backdropFilter:"blur(10px)"}}>
          <div className="anim-pop" style={{borderRadius:24,padding:32,textAlign:"center",maxWidth:320,width:"100%",
            background:"#0d1508",border:"2px solid #B8E020",boxShadow:"0 0 80px #B8E02030"}}>
            <div style={{fontSize:56,marginBottom:12}}>🏆</div>
            <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:22,color:"#fff",marginBottom:4}}>{t.champion}</div>
            <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:52,color:"#B8E020"}}>#{winner.number}</div>
            <div style={{fontSize:18,fontWeight:700,color:"#fff",margin:"4px 0"}}>{winner.name}</div>
            <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:40,color:"#B8E020",marginBottom:16}}>{winner.globalPoints} pts</div>
            <div style={{display:"flex",justifyContent:"center",gap:4}}>{ZK.map(zk=><ZonePip key={zk} zone={zk} played={true}/>)}</div>
          </div>
        </div>
      )}

      <div style={{position:"sticky",top:0,zIndex:10,paddingTop:"calc(env(safe-area-inset-top) + 16px)",paddingBottom:"12px",paddingLeft:"16px",paddingRight:"16px",background:"#0A0A0A",borderBottom:"1px solid #111827"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
          <div>
            <div style={{...S.display(18),color:"#fff"}}>ADMIN</div>
            <div style={{fontSize:11,color:"#4b5563"}}>{eligible.length} eligible{eligible.length!==1?"s":""} / {sorted.length} joueurs</div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
              <select value={sessionMins} onChange={e=>{
                  const m=Number(e.target.value);
                  setSessionMins(m);
                  if(arenaState.active) onUpdateDuration(m);
                }}
                style={{background:"#111827",color:"#d1d5db",border:"1px solid #374151",borderRadius:8,padding:"3px 6px",fontSize:11,cursor:"pointer"}}>
                {[30,45,60,75,90,120].map(m=><option key={m} value={m}>{m} min</option>)}
              </select>
              <div className={arenaState.active?"pulse-lime":""} style={{...S.display(22),color:timerColor}}>{timer}</div>
              <div style={{fontSize:9,color:"#4b5563"}}>{arenaState.active?t.statusActive:arenaState.paused?t.statusPaused:arenaState.ended?t.statusEnded:t.statusWaiting}</div>
            </div>
            {!arenaState.active&&!arenaState.paused&&<button onClick={()=>onStart(sessionMins)} style={{...S.btn("#B8E020"),padding:"6px 12px",fontSize:12}}>{t.start}</button>}
            {arenaState.active&&<button onClick={onPause} style={{...S.btn("#f97316"),padding:"6px 12px",fontSize:12,color:"#000",fontWeight:700}}>⏸ Pause</button>}
            {arenaState.paused&&<button onClick={onResume} style={{...S.btn("#B8E020"),padding:"6px 12px",fontSize:12,color:"#000",fontWeight:700}}>▶ Reprendre</button>}
            {(arenaState.active||arenaState.paused)&&<button onClick={onEnd} style={{...S.btn("#dc2626"),padding:"6px 12px",fontSize:12,color:"#fff"}}>■ Terminer</button>}
            <button onClick={onGoStation} title="Mode responsable de plateau"
              style={{padding:8,borderRadius:10,background:"#111827",color:"#B8E020",border:"1px solid #B8E02040",cursor:"pointer",fontSize:15}}>📍</button>
            <button onClick={onLogout} style={{padding:8,borderRadius:10,background:"#111827",color:"#6b7280",border:"none",cursor:"pointer",fontSize:16}}>×</button>
          </div>
        </div>
        <div style={{display:"flex",gap:4}}>
          {[["cockpit","🎛 Cockpit"],["leaderboard",t.tabLeader],["stations",t.tabStations],["players",t.tabPlayers],["teams",t.tabTeams],["session",t.tabSession],["survey",t.tabSurvey],["comments",t.tabComments],["winners",t.tabWinners]].map(([tb,l])=>(
            <button key={tb} onClick={()=>{setTab(tb);setSelectedStation(null);}} style={{
              padding:"6px 10px",borderRadius:8,fontSize:11,fontWeight:600,border:"none",cursor:"pointer",
              background:tab===tb?"#B8E020":"#0d0f1a",color:tab===tb?"#000":"#6b7280"}}>
              {l}
            </button>
          ))}
        </div>
      </div>

      <div style={{padding:16,paddingBottom:80}}>
        {tab==="cockpit"&&(
          <CockpitTab
            queues={queues} activeGames={activeGames} arenaState={arenaState} lastResultAt={lastResultAt}
            onToggleZone={onToggleZone} onPause={onPause} onResume={onResume} onEnd={onEnd}
            winnersPublished={winnersPublished} onPublishWinners={onPublishWinners} onUnpublishWinners={onUnpublishWinners}
          />
        )}
        {tab==="leaderboard"&&(
          <LeaderboardTab sorted={sorted} onOpenDossier={openDossier}/>
        )}

        {tab==="stations"&&(
          <StationsTab
            players={players} allPlayers={allPlayers} queues={queues} activeGames={activeGames} arenaState={arenaState}
            onToggleZone={onToggleZone} onOpenDossier={openDossier}
            augState={augState} onUpdateAugState={onUpdateAugState} onUpdatePlayer2={onUpdatePlayer2}
            selectedStation={selectedStation} onSelectStation={setSelectedStation}
          />
        )}

        {tab==="players"&&(
          <PlayersTab players={players} queues={queues} activeGames={activeGames}
            onAddQ={onAddQ} onRemoveQ={onRemoveQ} onOpenDossier={openDossier} onRemovePlayer={onRemovePlayer}/>
        )}

        {tab==="teams"&&(
          <TeamsTab players={players} teams={teams} arenaState={arenaState}
            onToggleTeamMode={onToggleTeamMode} onAssignPlayer={onAssignPlayer}
            onRemoveTeamMember={onRemoveTeamMember} onRenameTeam={onRenameTeam}/>
        )}

        {tab==="session"&&(
          <SessionTab
            rosters={rosters} players={players} allPlayers={allPlayers} activeRosterId={activeRosterId}
            onActivateRoster={onActivateRoster} onSetActiveRoster={onSetActiveRoster} onUpdateRoster={onUpdateRoster}
            onDeleteRoster={onDeleteRoster}
            onAddPlayer={onAddPlayer} onCreateRoster={onCreateRoster} onRemovePlayer={onRemovePlayer} onOpenDossier={openDossier}
            rosterCodes={rosterCodes} onUpdateCodes={onUpdateCodes}
            pendingSessions={pendingSessions}
            onDismissPending={onDismissPending}
            onPromotePending={onPromotePending}
            onAddGroupToQueue={onAddGroupToQueue}
            onResetAllHistory={onResetAllHistory}
            onResetAllPoints={onResetAllPoints}
          />
        )}

        {tab==="comments"&&(
          <CommentsTab comments={comments} onClearComments={onClearComments}/>
        )}

        {tab==="survey"&&(
          <SurveyTab players={players} onResetAllSurveys={onResetAllSurveys}/>
        )}

        {tab==="winners"&&(
          <WinnersTab players={players} arenaState={arenaState}
            winnersPublished={winnersPublished} onPublishWinners={onPublishWinners} onUnpublishWinners={onUnpublishWinners}/>
        )}
      </div>
    </div>
    <LangFooter/>
  </>);
}

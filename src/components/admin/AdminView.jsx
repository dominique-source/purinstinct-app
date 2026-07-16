import { useState, useEffect, useRef } from "react";
import html2canvas from "html2canvas";
import { FONTS } from "../../config/fonts.js";
import { ZONES, ZK, AUG_GAMES, AUG_COLOR, ZONE_VIGNETTES } from "../../config/zones.js";
import { useZn, useT } from "../../hooks/useLang.js";
import { getStatus } from "../../lib/game-logic.js";
import { S } from "../shared/styles.js";
import { Bib } from "../shared/Bib.jsx";
import { ZonePip } from "../shared/ZonePip.jsx";
import { LeaderRow } from "../shared/LeaderRow.jsx";
import { RulesCard } from "../shared/RulesCard.jsx";
import { SessionPanel } from "./SessionPanel.jsx";
import { PlayerDossier } from "./PlayerDossier.jsx";
import { LangFooter } from "../shared/LangFooter.jsx";

// Au-delà de ce délai sans résultat soumis (arène active), une zone est signalée comme stagnante dans le cockpit.
const STAGNATION_THRESHOLD_MS=4*60*1000;

export function AdminView({players,allPlayers,queues,activeGames,arenaState,lastResultAt,rosters,activeRosterId,initialTab,onStart,onEnd,onPause,onResume,onUpdateDuration,onGoStation,onToggleZone,onAddQ,onRemoveQ,onAddGroupToQueue,onLogout,onActivateRoster,onSetActiveRoster,onUpdateRoster,onDeleteRoster,onAddPlayer,onCreateRoster,onUpdatePlayer,onRemovePlayer,winnersPublished,onPublishWinners,onUnpublishWinners,rosterCodes,onUpdateCodes,pendingSessions,onDismissPending,onPromotePending,onResetAllPoints,onResetAllHistory,onResetAllSurveys,comments,onClearComments,augState,onUpdateAugState,onUpdatePlayer2}){
  const t=useT();
  const zn=useZn();
  const [tab,setTab]=useState(initialTab||"leaderboard");
  const [sessionMins,setSessionMins]=useState(arenaState.sessionMins||75);
  const [timer,setTimer]=useState("75:00");
  const [dossierPlayerId,setDossierPlayerId]=useState(null);
  const [dossierOrigin,setDossierOrigin]=useState(null);
  const [selectedStation,setSelectedStation]=useState(null);
  const [selectedAugGame,setSelectedAugGame]=useState(null);
  const [stationTab,setStationTab]=useState("live");
  const [winnerCard,setWinnerCard]=useState(null); // {type:"overall"|"top5"|"zone", zk?}
  const [savingCard,setSavingCard]=useState(false);
  const cardRef=useRef(null);
  const [leaderSearch,setLeaderSearch]=useState("");
  const [leaderHighlight,setLeaderHighlight]=useState(null);
  const leaderHighlightRef=useRef(null);
  const [now,setNow]=useState(()=>Date.now()); // horloge cockpit: rafraîchit "il y a X" et les alertes de stagnation

  useEffect(()=>{const iv=setInterval(()=>setNow(Date.now()),10000);return()=>clearInterval(iv);},[]);

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
          {[["cockpit","🎛 Cockpit"],["leaderboard",t.tabLeader],["stations",t.tabStations],["players",t.tabPlayers],["session",t.tabSession],["survey",t.tabSurvey],["comments",t.tabComments],["winners",t.tabWinners]].map(([t,l])=>(
            <button key={t} onClick={()=>{setTab(t);setSelectedStation(null);}} style={{
              padding:"6px 10px",borderRadius:8,fontSize:11,fontWeight:600,border:"none",cursor:"pointer",
              background:tab===t?"#B8E020":"#0d0f1a",color:tab===t?"#000":"#6b7280"}}>
              {l}
            </button>
          ))}
        </div>
      </div>

      <div style={{padding:16,paddingBottom:80}}>
        {tab==="cockpit"&&(()=>{
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
        })()}
        {tab==="leaderboard"&&(
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
                    onOpen={()=>openDossier(p.id)}/>
                </div>
              ))}
            </div>
            {leaderHighlight&&<button onClick={()=>setLeaderHighlight(null)}
              style={{marginTop:8,fontSize:11,color:"#4b5563",background:"none",border:"none",cursor:"pointer"}}>
              Effacer la surbrillance
            </button>}
          </div>
        )}

        {tab==="stations"&&(
          <div className="anim-up" style={{display:"flex",flexDirection:"column",gap:10}}>
            {selectedStation?(()=>{
              const zk=selectedStation; const z=ZONES[zk]; const zl=zn(zk);
              const game=activeGames[zk]; const q=queues[zk]||[];
              const teamA=game?(game.teamA||[]).map(id=>players.find(p=>p.id===id)).filter(Boolean):[];
              const teamB=game?(game.teamB||[]).map(id=>players.find(p=>p.id===id)).filter(Boolean):[];
              const solo=game?(game.participants||[]).map(id=>players.find(p=>p.id===id)).filter(Boolean):[];
              const inQueue=q.map(id=>players.find(p=>p.id===id)).filter(Boolean);
              return(
                <div>
                  {/* Header */}
                  <div style={{...S.row(),gap:10,marginBottom:12}}>
                    <button onClick={()=>{setSelectedStation(null);setStationTab("live");}}
                      style={{background:"none",border:"none",cursor:"pointer",color:"#6b7280",fontSize:20,lineHeight:1,padding:0}}
                      onMouseEnter={e=>e.target.style.color="#fff"}
                      onMouseLeave={e=>e.target.style.color="#6b7280"}>←</button>
                    <span style={{fontSize:22}}>{z.icon}</span>
                    <div style={{flex:1}}>
                      <div style={{color:"#fff",fontWeight:700,fontSize:16}}>{zl.name}</div>
                    </div>
                  </div>

                  {/* Onglets */}
                  <div style={{display:"flex",gap:4,marginBottom:14}}>
                    {[["live","⚡ Live"],["rules","📋 Règlements"]].map(([t,l])=>(
                      <button key={t} onClick={()=>setStationTab(t)}
                        style={{padding:"6px 14px",borderRadius:8,fontSize:11,fontWeight:600,border:"none",cursor:"pointer",
                          background:stationTab===t?z.color:"#0d0f1a",
                          color:stationTab===t?"#000":"#6b7280"}}>
                        {l}
                      </button>
                    ))}
                  </div>

                  {stationTab==="rules"&&(
                    <RulesCard zone={zk}/>
                  )}

                  {stationTab==="live"&&<>

                  {/* Live game */}
                  {game?(
                    <div style={{...S.card(),border:"1px solid "+z.border,marginBottom:10}}>
                      <div style={{...S.row(),justifyContent:"space-between",marginBottom:12}}>
                        <div style={{fontWeight:700,fontSize:13,color:"#fff"}}>Partie en cours</div>
                        <div style={S.liveTag()}><span className="pulse-lime" style={S.liveDot("#dc2626",6)}/>LIVE</div>
                      </div>
                      {solo.length>0?(
                        <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                          {solo.map(p=>(
                            <div key={p.id} onClick={()=>openDossier(p.id)}
                              style={{...S.row(),gap:6,padding:"6px 10px",borderRadius:10,background:"#0d0f1a",
                                border:"1px solid "+z.color+"40",cursor:"pointer"}}
                              onMouseEnter={e=>e.currentTarget.style.borderColor=z.color}
                              onMouseLeave={e=>e.currentTarget.style.borderColor=z.color+"40"}>
                              <Bib n={p.number} size="sm"/>
                              <span style={{color:"#fff",fontSize:13,fontWeight:600,flex:1,minWidth:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.name.split(" ")[0]}</span>
                              <div style={{display:"flex",alignItems:"center",gap:4,flexShrink:0}}>
                                {((p.zoneStreaks||{})[zk]||0)>=2&&<span style={{fontSize:11,color:"#f97316"}}>🔥×{(p.zoneStreaks||{})[zk]}</span>}
                                <span style={{color:z.color,fontSize:13,fontWeight:700}}>{z.icon} {(p.zoneScores||{})[zk]||50}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ):(
                        <div style={{display:"flex",gap:10}}>
                          {[["A",teamA],["B",teamB]].map(([label,team])=>(
                            <div key={label} style={{flex:1,background:"#0d0f1a",borderRadius:10,padding:"10px 12px",border:"1px solid "+z.color+"30"}}>
                              <div style={{color:z.color,fontWeight:700,fontSize:12,marginBottom:8}}>ÉQUIPE {label}</div>
                              {team.map(p=>(
                                <div key={p.id} onClick={()=>openDossier(p.id)}
                                  style={{...S.row(),gap:6,padding:"4px 0",cursor:"pointer",borderRadius:6}}
                                  onMouseEnter={e=>e.currentTarget.style.background="#ffffff08"}
                                  onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                                  <Bib n={p.number} size="sm"/>
                                  <span style={{color:"#fff",fontSize:13,fontWeight:600,flex:1,minWidth:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.name.split(" ")[0]}</span>
                                  <div style={{display:"flex",alignItems:"center",gap:4,flexShrink:0}}>
                                    {((p.zoneStreaks||{})[zk]||0)>=2&&<span style={{fontSize:11,color:"#f97316"}}>🔥×{(p.zoneStreaks||{})[zk]}</span>}
                                    <span style={{color:z.color,fontSize:13,fontWeight:700}}>{z.icon} {(p.zoneScores||{})[zk]||50}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ):(
                    <div style={{...S.card(),border:"1px solid #1f2937",marginBottom:10,textAlign:"center",color:"#4b5563",fontSize:13,padding:"20px 12px"}}>
                      {t.noGameInZone}
                    </div>
                  )}

                  {/* Queue */}
                  <div style={{...S.card(),border:"1px solid #1f2937"}}>
                    <div style={{fontWeight:700,fontSize:13,color:"#fff",marginBottom:10}}>{t.queueLabel} ({inQueue.length})</div>
                    {inQueue.length===0?(
                      <div style={{color:"#4b5563",fontSize:12,textAlign:"center",padding:"8px 0"}}>{t.queueEmpty}</div>
                    ):(
                      <div style={{display:"flex",flexDirection:"column",gap:4}}>
                        {inQueue.map((p,i)=>(
                          <div key={p.id} onClick={()=>openDossier(p.id)}
                            style={{...S.row(),gap:8,padding:"5px 8px",borderRadius:8,cursor:"pointer"}}
                            onMouseEnter={e=>e.currentTarget.style.background="#ffffff08"}
                            onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                            <span style={{color:"#4b5563",fontSize:11,width:16,textAlign:"right"}}>{i+1}</span>
                            <Bib n={p.number} size="sm"/>
                            <span style={{color:"#fff",fontSize:13,fontWeight:600,flex:1,minWidth:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.name}</span>
                            <div style={{display:"flex",alignItems:"center",gap:4,flexShrink:0}}>
                              {((p.zoneStreaks||{})[zk]||0)>=2&&<span style={{fontSize:11,color:"#f97316"}}>🔥×{(p.zoneStreaks||{})[zk]}</span>}
                              <span style={{color:z.color,fontSize:13,fontWeight:700}}>{z.icon} {(p.zoneScores||{})[zk]||50}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  </>}
                </div>
              );
            })():(
              ZK.map(zk=>{
                const z=ZONES[zk]; const zl=zn(zk); const q=queues[zk]||[]; const game=activeGames[zk];
                const allInGame=game?(game.participants||[...(game.teamA||[]),...(game.teamB||[])]).length:0;
                const isDisabled=(arenaState.disabledZones||[]).includes(zk);
                const vignette=ZONE_VIGNETTES[zk];
                return(
                  <div key={zk} style={{position:"relative",marginBottom:0}}>
                    {/* Contenu de la carte — opaque si désactivée */}
                    <div style={{...S.card(),border:"1px solid "+(isDisabled?"#1f2937":z.border),
                      opacity:isDisabled?0.4:1,marginBottom:0,padding:0,overflow:"hidden"}}
                      onClick={()=>{if(!isDisabled){setSelectedStation(zk);setStationTab("live");}}}
                      onMouseEnter={e=>{if(!isDisabled)e.currentTarget.style.borderColor=z.color;}}
                      onMouseLeave={e=>{e.currentTarget.style.borderColor=isDisabled?"#1f2937":z.border;}}>
                      <div style={{...S.row(),justifyContent:"space-between",cursor:isDisabled?"default":"pointer",paddingRight:100}}>
                        <div style={{...S.row(),gap:0}}>
                          <div style={{width:64,height:64,flexShrink:0,overflow:"hidden",background:z.bg}}>
                            {vignette&&<img src={vignette} alt={zl.name} style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}} onError={e=>e.target.style.display="none"}/>}
                            {!vignette&&<div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>{z.icon}</div>}
                          </div>
                          <div style={{padding:"10px 12px"}}>
                            <div style={{color:"#fff",fontWeight:700,fontSize:14}}>{zl.name}</div>
                          </div>
                        </div>
                        <div style={{display:"flex",gap:6,alignItems:"center"}}>
                          {!isDisabled&&<div style={{...S.tag(z.color)}}>{q.length} en file</div>}
                          {!isDisabled&&game&&<div style={S.liveTag()}><span className="pulse-lime" style={S.liveDot("#dc2626",6)}/>{allInGame} LIVE</div>}
                          {!isDisabled&&<span style={{color:"#4b5563",fontSize:16}}>›</span>}
                        </div>
                      </div>
                    </div>
                    {/* Bouton toggle — toujours visible, hors de l'opacité */}
                    <button onClick={()=>onToggleZone(zk)}
                      style={{position:"absolute",top:"50%",right:12,transform:"translateY(-50%)",
                        padding:"5px 12px",borderRadius:20,border:"none",cursor:"pointer",
                        fontSize:10,fontWeight:700,zIndex:3,
                        background:isDisabled?"#ef444420":"#B8E02020",
                        color:isDisabled?"#ef4444":"#B8E020",
                        border:"1px solid "+(isDisabled?"#ef444440":"#B8E02040")}}
                      onMouseEnter={e=>{e.currentTarget.style.background=isDisabled?"#ef444430":"#B8E02030";}}
                      onMouseLeave={e=>{e.currentTarget.style.background=isDisabled?"#ef444420":"#B8E02020";}}>
                      {isDisabled?"⏸ OFF":"● ON"}
                    </button>
                  </div>
                );
              })
            )}

            {/* ── Moment Factory augmented games ── */}
            {!selectedStation&&!selectedAugGame&&(
              <div style={{marginTop:8}}>
                <div style={{fontSize:11,color:"#4b5563",textTransform:"uppercase",letterSpacing:"3px",fontWeight:600,marginBottom:8,paddingLeft:2}}>🏟 Moment Factory</div>
                {AUG_GAMES.map(game=>{
                  const gs=(augState||{})[game.id]||{queue:[],activeMatch:null};
                  const qLen=gs.queue.length;
                  const hasMatch=!!gs.activeMatch;
                  return(
                    <div key={game.id} style={{borderRadius:16,padding:14,background:"#0d0f1a",border:"1px solid "+(hasMatch?"#B8E02040":AUG_COLOR+"40"),
                      marginBottom:6,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between"}}
                      onClick={()=>setSelectedAugGame(game.id)}
                      onMouseEnter={e=>e.currentTarget.style.borderColor=AUG_COLOR}
                      onMouseLeave={e=>e.currentTarget.style.borderColor=hasMatch?"#B8E02040":AUG_COLOR+"40"}>
                      <div style={{display:"flex",alignItems:"center",gap:10}}>
                        <div style={{width:32,height:32,borderRadius:8,overflow:"hidden",flexShrink:0,border:"1px solid "+AUG_COLOR+"40"}}>
                          <img src={game.img} alt={game.fr} style={{width:"100%",height:"100%",objectFit:"cover"}}
                            onError={e=>e.target.style.display="none"}/>
                        </div>
                        <div style={{color:"#fff",fontWeight:700,fontSize:14}}>{game.fr}</div>
                      </div>
                      <div style={{display:"flex",gap:6,alignItems:"center"}}>
                        {qLen>0&&<div style={{padding:"2px 8px",borderRadius:6,fontSize:11,fontWeight:600,background:AUG_COLOR+"18",color:AUG_COLOR}}>{qLen} en file</div>}
                        {hasMatch&&<div style={S.liveTag()}><span className="pulse-lime" style={S.liveDot("#dc2626",6)}/>LIVE</div>}
                        <span style={{color:"#4b5563",fontSize:16}}>›</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── Selected augmented game detail ── */}
            {selectedAugGame&&(()=>{
              const game=AUG_GAMES.find(g=>g.id===selectedAugGame);
              const gs=(augState||{})[selectedAugGame]||{queue:[],activeMatch:null};
              const {queue:augQueue,activeMatch}=gs;
              const WIN_PTS=4; const LOSS_PTS=2;
              const allP=[...players,...(allPlayers||[])];

              const declareWinner=(winner)=>{
                if(onUpdatePlayer2){
                  const winTeam=winner==="A"?activeMatch.teamA:activeMatch.teamB;
                  const loseTeam=winner==="A"?activeMatch.teamB:activeMatch.teamA;
                  winTeam.forEach(name=>{const p=allP.find(px=>px.name===name);if(p)onUpdatePlayer2({...p,globalPoints:(p.globalPoints||0)+WIN_PTS});});
                  loseTeam.forEach(name=>{const p=allP.find(px=>px.name===name);if(p)onUpdatePlayer2({...p,globalPoints:Math.max(0,(p.globalPoints||0)-LOSS_PTS)});});
                }
                onUpdateAugState&&onUpdateAugState(selectedAugGame,{...gs,activeMatch:null});
              };

              const cancelMatch=()=>{
                const restored=[...(activeMatch?.teamA||[]),...(activeMatch?.teamB||[]),...augQueue];
                onUpdateAugState&&onUpdateAugState(selectedAugGame,{queue:restored,activeMatch:null});
              };

              const generateMatch=(fmt)=>{
                const teamSize=fmt==="1v1"?1:fmt==="2v2"?2:3;
                const needed=teamSize*2;
                if(augQueue.length<needed) return;
                const shuffled=[...augQueue].sort(()=>Math.random()-.5);
                onUpdateAugState&&onUpdateAugState(selectedAugGame,{queue:shuffled.slice(needed),activeMatch:{teamA:shuffled.slice(0,teamSize),teamB:shuffled.slice(teamSize,needed),format:fmt}});
              };

              return(
                <div>
                  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
                    <button onClick={()=>setSelectedAugGame(null)}
                      style={{background:"none",border:"none",cursor:"pointer",color:"#6b7280",fontSize:20,padding:0,lineHeight:1}}
                      onMouseEnter={e=>e.target.style.color="#fff"} onMouseLeave={e=>e.target.style.color="#6b7280"}>←</button>
                    <div style={{width:36,height:36,borderRadius:8,overflow:"hidden",flexShrink:0}}>
                      <img src={game.img} alt={game.fr} style={{width:"100%",height:"100%",objectFit:"cover"}} onError={e=>e.target.style.display="none"}/>
                    </div>
                    <div style={{flex:1}}>
                      <div style={{color:"#fff",fontWeight:700,fontSize:16}}>{game.fr}</div>
                      <div style={{fontSize:10,color:AUG_COLOR,letterSpacing:2,textTransform:"uppercase"}}>Moment Factory · +{WIN_PTS} victoire / -{LOSS_PTS} défaite</div>
                    </div>
                  </div>

                  {activeMatch?(
                    <div style={{borderRadius:16,padding:14,background:"#0d0f1a",border:"2px solid #B8E020",marginBottom:10}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                        <div style={{fontWeight:700,fontSize:13,color:"#B8E020"}}>⚡ {activeMatch.format.toUpperCase()} EN COURS</div>
                        <button onClick={cancelMatch} style={{fontSize:11,color:"#6b7280",background:"none",border:"none",cursor:"pointer"}}>↩ Annuler</button>
                      </div>
                      <div style={{display:"grid",gridTemplateColumns:"1fr auto 1fr",gap:8,alignItems:"center",marginBottom:12}}>
                        <div style={{borderRadius:10,padding:"8px 10px",background:"#3b82f620",border:"1px solid #3b82f640",textAlign:"center"}}>
                          <div style={{fontSize:10,color:"#3b82f6",fontWeight:700,marginBottom:4,letterSpacing:2}}>ÉQUIPE A</div>
                          {activeMatch.teamA.map((n,i)=><div key={i} style={{color:"#fff",fontWeight:600,fontSize:13}}>{n}</div>)}
                        </div>
                        <div style={{fontFamily:"Barlow Condensed,sans-serif",fontWeight:900,fontSize:18,color:"#4b5563"}}>VS</div>
                        <div style={{borderRadius:10,padding:"8px 10px",background:"#f9731620",border:"1px solid #f9731640",textAlign:"center"}}>
                          <div style={{fontSize:10,color:"#f97316",fontWeight:700,marginBottom:4,letterSpacing:2}}>ÉQUIPE B</div>
                          {activeMatch.teamB.map((n,i)=><div key={i} style={{color:"#fff",fontWeight:600,fontSize:13}}>{n}</div>)}
                        </div>
                      </div>
                      <div style={{fontSize:12,color:"#4b5563",textAlign:"center",marginBottom:8}}>Déclarer le vainqueur (+{WIN_PTS} pts)</div>
                      <div style={{display:"flex",gap:8}}>
                        <button onClick={()=>declareWinner("A")} style={{flex:1,padding:"10px",borderRadius:10,border:"none",cursor:"pointer",background:"#3b82f6",color:"#fff",fontFamily:"Barlow Condensed,sans-serif",fontWeight:900,fontSize:14}}>🏆 ÉQUIPE A</button>
                        <button onClick={()=>declareWinner("B")} style={{flex:1,padding:"10px",borderRadius:10,border:"none",cursor:"pointer",background:"#f97316",color:"#fff",fontFamily:"Barlow Condensed,sans-serif",fontWeight:900,fontSize:14}}>🏆 ÉQUIPE B</button>
                      </div>
                    </div>
                  ):(
                    <div>
                      <div style={{display:"flex",gap:8,marginBottom:10}}>
                        {["1v1","2v2","3v3"].map(fmt=>{
                          const need=fmt==="1v1"?2:fmt==="2v2"?4:6;
                          const canGen=augQueue.length>=need;
                          return(
                            <button key={fmt} onClick={()=>canGen&&generateMatch(fmt)}
                              style={{flex:1,padding:"10px",borderRadius:10,border:"1px solid "+(canGen?AUG_COLOR+"80":"#1f2937"),
                                background:canGen?AUG_COLOR+"20":"transparent",color:canGen?"#fff":"#374151",
                                cursor:canGen?"pointer":"default",fontFamily:"Barlow Condensed,sans-serif",fontWeight:900,fontSize:16}}>
                              {fmt}
                              <div style={{fontSize:9,color:canGen?AUG_COLOR:"#374151",marginTop:2}}>{augQueue.length}/{need}</div>
                            </button>
                          );
                        })}
                      </div>
                      <div style={{borderRadius:16,padding:14,background:"#0d0f1a",border:"1px solid #1f2937"}}>
                        <div style={{fontWeight:700,fontSize:13,color:"#fff",marginBottom:8}}>File d'attente ({augQueue.length})</div>
                        {augQueue.length===0?(
                          <div style={{color:"#4b5563",fontSize:12,textAlign:"center",padding:"6px 0"}}>File vide</div>
                        ):(
                          <div style={{display:"flex",flexDirection:"column",gap:3,maxHeight:200,overflowY:"auto"}}>
                            {augQueue.map((name,i)=>(
                              <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"5px 8px",borderRadius:8,background:"#0d0514"}}>
                                <span style={{color:"#4b5563",fontSize:11,width:16,textAlign:"right"}}>{i+1}</span>
                                <span style={{color:"#fff",fontSize:13,fontWeight:600,flex:1,marginLeft:4}}>{name}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {tab==="players"&&(
          <div className="anim-up">
            {/* Legend */}
            <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:12,padding:"10px 12px",borderRadius:10,background:"#0d0f1a",border:"1px solid #1f2937"}}>
              <div style={{...S.label(),width:"100%",marginBottom:4}}>Legende</div>
              <div style={{...S.row(),gap:5,fontSize:12,color:"#6b7280"}}><div style={{width:8,height:8,borderRadius:"50%",background:"#22c55e",flexShrink:0}}/>Libre</div>
              <div style={{...S.row(),gap:5,fontSize:12,color:"#6b7280"}}><div style={{width:8,height:8,borderRadius:"50%",background:"#B8E020",flexShrink:0}}/>En file (1 ou 2)</div>
              <div style={{...S.row(),gap:5,fontSize:12,color:"#6b7280"}}><div style={{width:8,height:8,borderRadius:"50%",background:"#fbbf24",flexShrink:0}}/>En partie</div>
              <div style={{fontSize:12,color:"#6b7280"}}>| Boutons <strong style={{color:"#fff"}}>+ Zone</strong> = ajouter a cette file</div>
              <div style={{fontSize:12,color:"#6b7280"}}>| Bouton <strong style={{color:"#ef4444"}}>Retirer</strong> = sortir de la file</div>
            </div>

            {/* Filter bar */}
            <div style={{...S.label(),marginBottom:10}}>{players.length} joueurs — cliquez sur une zone pour ajouter</div>
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              {players.map(p=>{
                const {inQueues,playingAt}=getStatus(p.id,queues,activeGames);
                const canAdd=!playingAt&&inQueues.length<2;
                const statusDot = playingAt?"#fbbf24":inQueues.length>0?"#B8E020":"#374151";
                const statusText = playingAt
                  ?("⚡ En partie · "+zn(playingAt).name)
                  :inQueues.length>0
                    ?("En file · "+inQueues.map(z=>zn(z).sn).join(" + "))
                    :"Libre";
                const statusColor = playingAt?"#fbbf24":inQueues.length>0?"#B8E020":"#4b5563";
                const zonesNotIn=ZK.filter(zk=>!inQueues.includes(zk));

                return(
                  <div key={p.id} style={{borderRadius:12,background:"#0d0f1a",overflow:"hidden",
                    border:"1px solid "+(playingAt?"#fbbf2430":inQueues.length>0?"#B8E02030":"#1f2937")}}>

                    {/* Top row: identity + status + points + dossier link — full row is clickable */}
                    <div style={{...S.row(),padding:"9px 12px",gap:10}}>
                      <div style={{width:8,height:8,borderRadius:"50%",background:statusDot,flexShrink:0,marginTop:1}}/>
                      <Bib n={p.number} size="sm"/>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{color:"#fff",fontWeight:600,fontSize:13,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.name}</div>
                        <div style={{fontSize:11,marginTop:1,fontWeight:600,color:statusColor}}>{statusText}</div>
                      </div>
                      <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:16,color:"#B8E020",flexShrink:0}}>{p.globalPoints} pts</div>
                      <button onClick={(e)=>{e.stopPropagation();openDossier(p.id);}}
                        style={{...S.btn("#1f2937"),padding:"4px 8px",fontSize:11,flexShrink:0}}>Profil</button>
                      <button onClick={(e)=>{e.stopPropagation();if(window.confirm("Supprimer "+p.name+" de la session ?"))onRemovePlayer&&onRemovePlayer(p.id);}}
                        style={{...S.btn("#ef444420"),padding:"4px 8px",fontSize:11,color:"#ef4444",border:"1px solid #ef444440",flexShrink:0}}
                        onMouseEnter={e=>e.currentTarget.style.background="#ef444435"}
                        onMouseLeave={e=>e.currentTarget.style.background="#ef444420"}>Supprimer</button>
                    </div>

                    {/* Action row - only if not playing */}
                    {!playingAt&&(
                      <div style={{padding:"0 12px 9px 12px",display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>

                        {/* Current queues with remove button */}
                        {inQueues.map(z=>(
                          <div key={z} style={{...S.row(),gap:4,padding:"3px 8px 3px 6px",borderRadius:20,
                            background:ZONES[z].color+"22",border:"1px solid "+ZONES[z].color+"50"}}>
                            <span style={{fontSize:13}}>{ZONES[z].icon}</span>
                            <span style={{fontSize:11,fontWeight:600,color:ZONES[z].color}}>{zn(z).sn}</span>
                            <button onClick={()=>onRemoveQ(p.id,z)} title={"Retirer de "+zn(z).name}
                              style={{background:"none",border:"none",cursor:"pointer",color:ZONES[z].color,
                                fontSize:14,lineHeight:1,padding:0,marginLeft:2,opacity:.7}}
                              onMouseEnter={e=>e.target.style.opacity="1"}
                              onMouseLeave={e=>e.target.style.opacity=".7"}>×</button>
                          </div>
                        ))}

                        {/* Divider if both queues and add buttons */}
                        {inQueues.length>0&&canAdd&&(
                          <div style={{width:1,height:16,background:"#1f2937",flexShrink:0}}/>
                        )}

                        {/* Add-to-queue buttons — labeled with zone name */}
                        {canAdd&&zonesNotIn.map(zk=>(
                          <button key={zk} onClick={()=>onAddQ(p.id,zk)}
                            title={"Ajouter a la file : "+zn(zk).name}
                            style={{...S.row(),gap:4,padding:"3px 8px",borderRadius:20,border:"1px dashed "+ZONES[zk].color+"50",
                              background:"transparent",cursor:"pointer",color:ZONES[zk].color+"99"}}
                            onMouseEnter={e=>{e.currentTarget.style.background=ZONES[zk].color+"15";e.currentTarget.style.color=ZONES[zk].color;e.currentTarget.style.borderColor=ZONES[zk].color;}}
                            onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color=ZONES[zk].color+"99";e.currentTarget.style.borderColor=ZONES[zk].color+"50";}}>
                            <span style={{fontSize:13}}>{ZONES[zk].icon}</span>
                            <span style={{fontSize:10,fontWeight:600}}>+ {zn(zk).sn}</span>
                          </button>
                        ))}
                        {!canAdd&&inQueues.length>=2&&(
                          <div style={{fontSize:11,color:"#4b5563"}}>Max 2 files atteint</div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {tab==="session"&&(
          <div>
          <SessionPanel
            rosters={rosters}
            players={players.filter(p=>(p.groupId||"main")===activeRosterId)}
            allPlayers={allPlayers||players}
            activeRosterId={activeRosterId}
            onActivate={onActivateRoster} onSetActiveRoster={onSetActiveRoster} onUpdateRoster={onUpdateRoster}
            onDeleteRoster={onDeleteRoster}
            onAddPlayer={onAddPlayer} onCreateRoster={onCreateRoster} onRemovePlayer={onRemovePlayer} onOpenDossier={openDossier}
            rosterCodes={rosterCodes} onUpdateCodes={onUpdateCodes}
            pendingSessions={pendingSessions}
            onDismissPending={onDismissPending}
            onPromotePending={onPromotePending}
            onAddGroupToQueue={onAddGroupToQueue}
          />
          {/* Actions destructives regroupées en fin d'onglet, sous la session active */}
          {onResetAllHistory&&(
            <div style={{margin:"16px 0 0",padding:"14px 16px",borderRadius:14,background:"#1a0505",border:"1px solid #ef444440",display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}>
              <div>
                <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:15,color:"#ef4444"}}>{t.resetHistoryTitle}</div>
                <div style={{fontSize:11,color:"#6b7280",marginTop:2}}>{t.resetHistoryDesc}</div>
              </div>
              <button onClick={()=>{if(window.confirm(t.resetHistoryConfirm)) onResetAllHistory();}}
                style={{padding:"8px 16px",borderRadius:10,border:"none",background:"#ef4444",color:"#fff",cursor:"pointer",fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:14,flexShrink:0}}>
                {t.resetHistoryBtn}
              </button>
            </div>
          )}
          {onResetAllPoints&&(
            <div style={{margin:"16px 0 0",padding:"14px 16px",borderRadius:14,background:"#1a0505",border:"1px solid #ef444440",display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}>
              <div>
                <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:15,color:"#ef4444"}}>{t.resetPointsTitle}</div>
                <div style={{fontSize:11,color:"#6b7280",marginTop:2}}>{t.resetPointsDesc}</div>
              </div>
              <button onClick={()=>{if(window.confirm(t.resetPointsConfirm)) onResetAllPoints();}}
                style={{padding:"8px 16px",borderRadius:10,border:"none",background:"#ef4444",color:"#fff",cursor:"pointer",fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:14,flexShrink:0}}>
                {t.resetPointsBtn}
              </button>
            </div>
          )}
          </div>
        )}

        {tab==="comments"&&(
          <div style={{padding:"0 0 16px"}}>
            <div style={{marginBottom:12,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:18,color:"#fff"}}>
                {(comments||[]).length} commentaire{(comments||[]).length!==1?"s":""}
              </div>
              {(comments||[]).length>0&&onClearComments&&(
                <button onClick={()=>{if(window.confirm("Supprimer tous les commentaires ?"))onClearComments();}}
                  style={{padding:"6px 12px",borderRadius:8,border:"none",background:"#ef4444",color:"#fff",cursor:"pointer",fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:12}}>
                  🗑️ Tout supprimer
                </button>
              )}
            </div>
            {(comments||[]).length===0?(
              <div style={{textAlign:"center",padding:32,color:"#374151",fontSize:13}}>Aucun commentaire pour l'instant.</div>
            ):(
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {(comments||[]).map(c=>(
                  <div key={c.id} style={{borderRadius:12,background:"#0d0f1a",border:"1px solid #1f2937",padding:"12px 14px"}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                      <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:15,
                        color:"#B8E020",background:"#111a05",border:"1px solid #B8E02040",
                        borderRadius:8,padding:"2px 8px",flexShrink:0}}>#{c.playerNumber}</div>
                      <div style={{fontWeight:700,color:"#fff",fontSize:13}}>{c.playerName}</div>
                      <div style={{marginLeft:"auto",fontSize:10,color:"#374151"}}>
                        {new Date(c.ts).toLocaleTimeString("fr-CA",{hour:"2-digit",minute:"2-digit"})}
                      </div>
                    </div>
                    <div style={{fontSize:13,color:"#d1d5db",lineHeight:1.5,whiteSpace:"pre-wrap"}}>{c.text}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab==="survey"&&(()=>{
          const respondents=players.filter(p=>p.surveyRanking&&p.surveyRanking.length===ZK.length);
          const total=respondents.length;
          // Calcul score par zone: position 1=6pts, 2=5pts, ..., 6=1pt
          const scores={};const firstVotes={};
          ZK.forEach(zk=>{scores[zk]=0;firstVotes[zk]=0;});
          respondents.forEach(p=>{
            p.surveyRanking.forEach((zk,i)=>{
              scores[zk]+=(ZK.length-i);
              if(i===0) firstVotes[zk]++;
            });
          });
          const ranked=[...ZK].sort((a,b)=>scores[b]-scores[a]);
          return(
            <div style={{padding:"0 0 16px"}}>
              <div style={{marginBottom:16,padding:"12px 16px",borderRadius:12,background:"#0d0f1a",border:"1px solid #1f2937",display:"flex",alignItems:"center",gap:12}}>
                <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:32,color:"#B8E020"}}>{total}</div>
                <div style={{fontSize:12,color:"#6b7280",flex:1}}>réponse{total!==1?"s":""} sur {players.length} joueur{players.length!==1?"s":""}</div>
                {total>0&&onResetAllSurveys&&<button onClick={()=>{if(window.confirm("Effacer tous les sondages ?")) onResetAllSurveys();}}
                  style={{padding:"6px 12px",borderRadius:8,border:"none",background:"#ef4444",color:"#fff",cursor:"pointer",fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:12,flexShrink:0}}>
                  🗑️ Remettre à 0
                </button>}
              </div>
              {total===0?(
                <div style={{textAlign:"center",padding:32,color:"#374151",fontSize:13}}>Aucune réponse pour l'instant.</div>
              ):(
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  {ranked.map((zk,rank)=>{
                    const z=ZONES[zk];const zl=zn(zk);
                    const pct=total>0?Math.round((scores[zk]/(total*ZK.length))*100):0;
                    const first=firstVotes[zk];
                    const medals=["🥇","🥈","🥉","4️⃣","5️⃣","6️⃣"];
                    return(
                      <div key={zk} style={{borderRadius:14,background:"#0d0f1a",border:"1px solid "+z.border,padding:"12px 16px"}}>
                        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
                          <span style={{fontSize:20}}>{medals[rank]}</span>
                          <span style={{fontSize:22}}>{z.icon}</span>
                          <span style={{flex:1,fontWeight:700,color:"#fff",fontSize:14}}>{zl.name}</span>
                          <span style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:20,color:z.color}}>{pct}%</span>
                        </div>
                        <div style={{height:6,borderRadius:3,background:"#1f2937",overflow:"hidden",marginBottom:6}}>
                          <div style={{height:"100%",width:pct+"%",background:z.color,borderRadius:3,transition:"width .5s"}}/>
                        </div>
                        <div style={{fontSize:11,color:"#4b5563"}}>
                          {first} choix #1 · Score {scores[zk]} pts
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })()}

        {tab==="winners"&&(()=>{
          const today=new Date().toLocaleDateString("fr-CA",{year:"numeric",month:"long",day:"numeric"});
          const ranked=[...players].sort((a,b)=>b.globalPoints-a.globalPoints);
          const top5=ranked.slice(0,5);
          const overall=ranked[0]||null;
          const activeZK=ZK.filter(zk=>!(arenaState.disabledZones||[]).includes(zk));
          const zoneChamps={};
          activeZK.forEach(zk=>{
            const played=players.filter(p=>(p.zonesPlayed||[]).includes(zk));
            if(played.length>0) zoneChamps[zk]=[...played].sort((a,b)=>((b.zoneScores||{})[zk]||50)-((a.zoneScores||{})[zk]||50))[0];
          });
          const zoneIcons={purinstinct:"🏟️",speed:"⚡",handAgility:"✋",footAgility:"👟",generalAgility:"🏃",iq:"🧠"};
          const zoneNames=Object.fromEntries(ZK.map(zk=>[zk,zn(zk).name]));
          const medals=["🥇","🥈","🥉","4️⃣","5️⃣"];

          const copyText=(text)=>{ navigator.clipboard&&navigator.clipboard.writeText(text); };

          // ── Plein écran visuel ──────────────────────────────────────
          if(winnerCard){
            const {type,zk}=winnerCard;

            const saveImage=async()=>{
              if(!cardRef.current||savingCard) return;
              setSavingCard(true);
              try{
                const canvas=await html2canvas(cardRef.current,{
                  backgroundColor:"#0a0c14",scale:3,useCORS:true,
                  logging:false,removeContainer:true
                });
                const url=canvas.toDataURL("image/png");
                const a=document.createElement("a");
                a.href=url; a.download="purinstinct-gagnant.png";
                a.click();
              }catch(e){console.error(e);}
              setSavingCard(false);
            };

            const FullCard=({accent,children})=>(
              <div style={{position:"fixed",inset:0,zIndex:60,background:"rgba(0,0,0,.95)",
                display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:20}}>
                {/* Carte visuelle — capturée par html2canvas */}
                <div ref={cardRef} onClick={saveImage} style={{width:"100%",maxWidth:380,borderRadius:24,
                  background:"#0a0c14",border:"2px solid "+(accent||"#B8E020"),padding:28,
                  position:"relative",overflow:"hidden",cursor:"pointer",
                  boxShadow:"0 0 60px "+(accent||"#B8E020")+"40"}}>
                  {/* Barre couleur top */}
                  <div style={{position:"absolute",top:0,left:0,right:0,height:4,
                    background:`linear-gradient(90deg, ${accent||"#B8E020"}, ${accent||"#B8E020"}88)`}}/>
                  {/* Logo texte */}
                  <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:10,
                    color:(accent||"#B8E020")+"80",letterSpacing:3,marginBottom:16,textAlign:"center",marginTop:8}}>
                    PURINSTINCT GAMES · {today}
                  </div>
                  {children}
                  {/* Hint tap — exclu de la capture */}
                  <div data-html2canvas-ignore="true" style={{textAlign:"center",marginTop:12,fontSize:10,color:"#374151"}}>
                    Appuyez pour enregistrer
                  </div>
                </div>
                {/* Bouton retour */}
                <div style={{marginTop:16}}>
                  <button onClick={()=>setWinnerCard(null)}
                    style={{padding:"10px 24px",borderRadius:10,background:"#111827",color:"#9ca3af",
                      border:"1px solid #374151",cursor:"pointer",fontWeight:700,fontSize:13}}>
                    ← Retour
                  </button>
                </div>
              </div>
            );

            // Carte Gagnant Overall
            if(type==="overall"&&overall){
              const streaks=ZK.filter(zk=>((overall.zoneStreaks||{})[zk]||0)>=2);
              return(
                <FullCard accent="#ca8a04"
>
                  <div style={{textAlign:"center",marginBottom:16}}>
                    <div style={{fontSize:52,lineHeight:1,marginBottom:8}}>🥇</div>
                    <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:12,
                      color:"#ca8a04",letterSpacing:3,marginBottom:6}}>GAGNANT</div>
                    <div style={{color:"#fff",fontWeight:700,fontSize:26,marginBottom:4}}>{overall.name}</div>
                    <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:48,
                      color:"#B8E020",lineHeight:1}}>{overall.globalPoints}</div>
                    <div style={{fontSize:12,color:"#4b5563",marginTop:2}}>points globaux</div>
                  </div>
                  {/* Zones */}
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6,marginBottom:12}}>
                    {ZK.map(zk=>{
                      const played=(overall.zonesPlayed||[]).includes(zk);
                      return(
                        <div key={zk} style={{borderRadius:10,padding:"8px 6px",textAlign:"center",
                          background:played?"#1a2e05":"#111827",
                          border:"1px solid "+(played?"#B8E02050":"#1f2937")}}>
                          <div style={{fontSize:18}}>{zoneIcons[zk]}</div>
                          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:16,
                            color:played?"#B8E020":"#374151"}}>{(overall.zoneScores||{})[zk]||50}</div>
                          <div style={{fontSize:9,color:played?"#6b7280":"#1f2937",marginTop:1}}>{zoneNames[zk].split(" ")[0]}</div>
                        </div>
                      );
                    })}
                  </div>
                  {streaks.length>0&&(
                    <div style={{display:"flex",flexWrap:"wrap",gap:6,justifyContent:"center"}}>
                      {streaks.map(zk=>(
                        <span key={zk} style={{padding:"3px 8px",borderRadius:6,background:"#f9731620",
                          color:"#f97316",fontSize:11,fontWeight:700}}>
                          🔥 {zoneNames[zk]} ×{(overall.zoneStreaks||{})[zk]}
                        </span>
                      ))}
                    </div>
                  )}
                </FullCard>
              );
            }

            // Carte Top 5
            if(type==="top5"&&top5.length>0){
              return(
                <FullCard accent="#6366f1"
>
                  <div style={{textAlign:"center",marginBottom:20}}>
                    <div style={{fontSize:42,lineHeight:1,marginBottom:6}}>🏆</div>
                    <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:12,
                      color:"#6366f1",letterSpacing:3}}>CLASSEMENT FINAL</div>
                  </div>
                  {top5.map((p,i)=>(
                    <div key={p.id} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 12px",
                      borderRadius:12,marginBottom:6,
                      background:i===0?"#1a1a2e":i===1?"#12121e":i===2?"#111118":"#0d0f1a",
                      border:"1px solid "+(i===0?"#6366f140":i===1?"#6b728040":i===2?"#b4530940":"#1f2937")}}>
                      <span style={{fontSize:20,width:28,textAlign:"center"}}>{medals[i]}</span>
                      <span style={{color:"#fff",fontWeight:700,fontSize:15,flex:1}}>{p.name}</span>
                      <div style={{textAlign:"right"}}>
                        <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:22,
                          color:i===0?"#ca8a04":i===1?"#9ca3af":i===2?"#b45309":"#6b7280"}}>{p.globalPoints}</div>
                        <div style={{fontSize:9,color:"#374151"}}>pts</div>
                      </div>
                    </div>
                  ))}
                </FullCard>
              );
            }

            // Carte Champion de zone
            if(type==="zone"&&zk&&zoneChamps[zk]){
              const champ=zoneChamps[zk];
              const z=ZONES[zk];
              const hasStreak=((champ.zoneStreaks||{})[zk]||0)>=2;
              return(
                <FullCard accent={z.color}
>
                  <div style={{textAlign:"center",marginBottom:20}}>
                    <div style={{fontSize:56,lineHeight:1,marginBottom:10}}>{zoneIcons[zk]}</div>
                    <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:11,
                      color:z.color,letterSpacing:3,marginBottom:4}}>CHAMPION</div>
                    <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:18,
                      color:z.color,marginBottom:16}}>{zoneNames[zk].toUpperCase()}</div>
                    <div style={{color:"#fff",fontWeight:700,fontSize:28,marginBottom:8}}>{champ.name}</div>
                    <div style={{display:"inline-block",padding:"12px 24px",borderRadius:16,
                      background:z.color+"20",border:"2px solid "+z.color+"60"}}>
                      <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:52,
                        color:z.color,lineHeight:1}}>{(champ.zoneScores||{})[zk]||50}</div>
                      <div style={{fontSize:11,color:z.color+"80",marginTop:2}}>score de zone</div>
                    </div>
                    {hasStreak&&(
                      <div style={{marginTop:14,padding:"6px 16px",borderRadius:20,
                        background:"#f9731620",display:"inline-block"}}>
                        <span style={{color:"#f97316",fontWeight:700,fontSize:14}}>
                          🔥 Série ×{(champ.zoneStreaks||{})[zk]}
                        </span>
                      </div>
                    )}
                    <div style={{marginTop:12,fontSize:13,color:"#4b5563",fontWeight:600}}>
                      {champ.globalPoints} pts globaux
                    </div>
                  </div>
                </FullCard>
              );
            }

            return null;
          }

          // ── Liste des cartes ────────────────────────────────────────
          const ClickCard=({accent,onClick,children})=>(
            <div onClick={onClick} style={{borderRadius:16,background:"#0d0f1a",border:"2px solid "+(accent||"#B8E020"),
              padding:20,marginBottom:12,position:"relative",overflow:"hidden",cursor:"pointer"}}
              onMouseEnter={e=>{e.currentTarget.style.background="#111827";e.currentTarget.style.boxShadow="0 0 20px "+(accent||"#B8E020")+"20";}}
              onMouseLeave={e=>{e.currentTarget.style.background="#0d0f1a";e.currentTarget.style.boxShadow="none";}}>
              <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:accent||"#B8E020"}}/>
              <div style={{position:"absolute",top:12,right:14,fontSize:16,color:(accent||"#B8E020")+"60"}}>↗</div>
              {children}
            </div>
          );

          return(
            <div className="anim-up">
              {/* Bouton publier */}
              <div style={{...S.card(),marginBottom:16,border:"1px solid "+(winnersPublished?"#B8E02040":"#374151"),
                display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}>
                <div>
                  <div style={{color:"#fff",fontWeight:700,fontSize:13}}>
                    {winnersPublished?t.winnersPublished:t.publishWinners}
                  </div>
                  <div style={{color:"#4b5563",fontSize:11,marginTop:2}}>
                    {winnersPublished?t.winnersVisible:t.winnersHidden}
                  </div>
                </div>
                <button onClick={winnersPublished?onUnpublishWinners:onPublishWinners}
                  style={{...S.btn(winnersPublished?"#374151":"#B8E020"),padding:"8px 16px",fontSize:12,
                    color:winnersPublished?"#9ca3af":"#000",flexShrink:0}}>
                  {winnersPublished?t.unpublish:t.publish}
                </button>
              </div>

              <div style={{...S.label(),marginBottom:4}}>Cartes de résultats</div>
              <div style={{fontSize:11,color:"#4b5563",marginBottom:16}}>Appuyez sur une carte pour l'agrandir et la partager</div>

              {/* Gagnant overall */}
              {overall&&(
                <ClickCard accent="#ca8a04" onClick={()=>setWinnerCard({type:"overall"})}>
                  <div style={{...S.row(),gap:10}}>
                    <span style={{fontSize:32}}>🥇</span>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:11,
                        color:"#ca8a04",letterSpacing:2,marginBottom:2}}>GAGNANT PURINSTINCT GAMES</div>
                      <div style={{color:"#fff",fontWeight:700,fontSize:17,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{overall.name}</div>
                      <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:22,color:"#B8E020"}}>{overall.globalPoints} pts</div>
                    </div>
                  </div>
                </ClickCard>
              )}

              {/* Top 5 */}
              {top5.length>0&&(
                <ClickCard accent="#6366f1" onClick={()=>setWinnerCard({type:"top5"})}>
                  <div style={{...S.row(),gap:10,marginBottom:10}}>
                    <span style={{fontSize:28}}>🏆</span>
                    <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:11,
                      color:"#6366f1",letterSpacing:2}}>TOP {top5.length} CLASSEMENT</div>
                  </div>
                  {top5.slice(0,3).map((p,i)=>(
                    <div key={p.id} style={{...S.row(),gap:8,padding:"3px 0"}}>
                      <span style={{fontSize:14,width:20}}>{medals[i]}</span>
                      <span style={{color:"#e5e7eb",fontSize:13,flex:1}}>{p.name}</span>
                      <span style={{color:"#B8E020",fontWeight:700,fontSize:13}}>{p.globalPoints}</span>
                    </div>
                  ))}
                  {top5.length>3&&<div style={{fontSize:11,color:"#4b5563",marginTop:4}}>+{top5.length-3} autres…</div>}
                </ClickCard>
              )}

              {/* Champions par zone — une carte par zone */}
              {ZK.filter(zk=>zoneChamps[zk]).map(zk=>{
                const champ=zoneChamps[zk];
                const z=ZONES[zk];
                return(
                  <ClickCard key={zk} accent={z.color} onClick={()=>setWinnerCard({type:"zone",zk})}>
                    <div style={{...S.row(),gap:10}}>
                      <span style={{fontSize:28,flexShrink:0}}>{zoneIcons[zk]}</span>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:10,
                          color:z.color,letterSpacing:2,marginBottom:2}}>CHAMPION {zoneNames[zk].toUpperCase()}</div>
                        <div style={{color:"#fff",fontWeight:700,fontSize:15,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{champ.name}</div>
                        <div style={{...S.row(),gap:6,marginTop:2}}>
                          <span style={{color:z.color,fontWeight:700,fontSize:13}}>{cham(p.zoneScores||{})[zk]||50} pts zone</span>
                          {((champ.zoneStreaks||{})[zk]||0)>=2&&<span style={{color:"#f97316",fontSize:11}}>🔥×{(champ.zoneStreaks||{})[zk]}</span>}
                        </div>
                      </div>
                    </div>
                  </ClickCard>
                );
              })}

              {ranked.length===0&&(
                <div style={{textAlign:"center",padding:"40px 0",color:"#4b5563",fontSize:13}}>
                  {t.noPlayersRegistered}
                </div>
              )}
            </div>
          );
        })()}
      </div>
    </div>
    <LangFooter/>
  </>);
}

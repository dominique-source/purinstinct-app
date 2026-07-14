import { useState, useEffect, useRef } from "react";
import { FONTS } from "../../config/fonts.js";
import { ZONES } from "../../config/zones.js";
import { useZn, useT } from "../../hooks/useLang.js";
import { S } from "../shared/styles.js";
import { TierBadge } from "../shared/TierBadge.jsx";
import { RulesCard } from "../shared/RulesCard.jsx";
import { LangFooter } from "../shared/LangFooter.jsx";
import { QueueList } from "../shared/QueueList.jsx";
import { SprintGameView } from "./SprintGameView.jsx";
import { IndividualGameView } from "./IndividualGameView.jsx";
import { TeamGameView } from "./TeamGameView.jsx";
import { useArenaTimer } from "../../hooks/useArenaTimer.js";

export function StationView({zone,players,queue,activeGame,disabled,arenaState,sessionName,sessionCode,onAddQ,onRemoveQ,onGenerate,onResult,onCancelGame,onRemoveFromGame,onReplaceInGame,onReorderQ,onBack,onGoAdmin,onLogout,fromPlayerId,onFillQueue}){
  const t=useT();
  const zn=useZn();
  const z=ZONES[zone];
  const zl=zn(zone);
  const {timer:arenaTimer,status:arenaStatus}=useArenaTimer(arenaState);
  const [tab,setTab]=useState("game");
  const [showRoster,setShowRoster]=useState(false);
  const [numInput,setNumInput]=useState("");
  const [sprintSize,setSprintSize]=useState(4); // nombre ou "tous"
  const [iqCount,setIqCount]=useState(2);
  const [flash,setFlash]=useState(null);
  const [confirmShortGame,setConfirmShortGame]=useState(false);
  const [highlightId,setHighlightId]=useState(null);
  // Résultat déclaré mais pas encore écrit: {args:[...], label}. Tant qu'il est
  // non-null, onResult n'a PAS été appelé — rien n'est écrit dans Firebase.
  const [pending,setPending]=useState(null);
  const [undoLeft,setUndoLeft]=useState(0);
  // onResult change d'identité à chaque render (arrow inline dans App.jsx). Le
  // garder dans une ref permet au timer de commit de toujours appeler la
  // dernière version SANS remettre l'effet (et donc le compte à rebours) à zéro.
  const onResultRef=useRef(onResult);
  useEffect(()=>{onResultRef.current=onResult;},[onResult]);
  // Armé au moment du commit, consommé une seule fois quand activeGame
  // redevient null: garantit une auto-génération par match, pas par render.
  const autoGenArmedRef=useRef(false);

  const pMap={}; players.forEach(p=>{pMap[p.id]=p;});
  const qPlayers=queue.map(id=>pMap[id]).filter(Boolean);
  const idealCount=z.teamSize?z.teamSize*2:z.minP;
  const minToShow=z.teamSize?2:z.minP;
  const canGen=!activeGame&&qPlayers.length>=minToShow;
  const hasIdeal=qPlayers.length>=idealCount;
  // Remettre à false à chaque changement du nombre de joueurs en file
  useEffect(()=>{setConfirmShortGame(false);},[qPlayers.length]);

  // Fenêtre d'annulation de 10s. On ne fait AUCUN setState synchrone dans le
  // corps de l'effet (undoLeft est initialisé dans startPending); le tick et le
  // commit passent par le callback de l'intervalle.
  useEffect(()=>{
    if(!pending) return;
    const deadline=Date.now()+10000;
    const iv=setInterval(()=>{
      const left=Math.max(0,Math.ceil((deadline-Date.now())/1000));
      setUndoLeft(left);
      if(left<=0){
        clearInterval(iv);
        autoGenArmedRef.current=true; // arme l'auto-génération pour ce commit
        onResultRef.current(...pending.args);
        setPending(null);
      }
    },200);
    return ()=>clearInterval(iv);
  },[pending]);

  // Auto-génération du prochain match une fois le résultat committé et
  // activeGame redevenu null via le round-trip Firebase. Le flag ref garantit
  // un seul déclenchement par commit même si l'effet re-tourne.
  useEffect(()=>{
    if(activeGame||!autoGenArmedRef.current) return;
    autoGenArmedRef.current=false;
    if(canGen&&(hasIdeal||zone==="speed"))
      onGenerate(zone==="speed"?(sprintSize==="tous"?qPlayers.length:sprintSize):null);
  },[activeGame,canGen,hasIdeal,zone,sprintSize,qPlayers.length,onGenerate]);
  const validSprintSizes=[4,10,15,20,25,30,40,50].filter(s=>s<=qPlayers.length);
  const sprintLine=[...qPlayers].sort((a,b)=>((a.zoneScores||{}).speed||50)-((b.zoneScores||{}).speed||50));

  const handleAdd=()=>{
    const n=parseInt(numInput,10);
    const p=players.find(px=>px.number===n);
    if(!p){setNumInput(""); return;}
    // Already in THIS queue: highlight and scroll to them
    if(queue.includes(p.id)){
      setHighlightId(p.id);
      setTimeout(()=>setHighlightId(null),2800);
      setNumInput("");
      return;
    }
    // Force-add regardless of how many queues the player is in
    onAddQ(p.id,zone,true);
    setNumInput("");
  };

  const handleFlashResult=(label)=>{
    setFlash(label);
    setTimeout(()=>setFlash(null),2200);
  };

  const handleMoveTop=(id,z2)=>{
    const q=[...queue];
    const i=q.indexOf(id); if(i<=0) return;
    q.splice(i,1); q.unshift(id);
    onReorderQ(z2,q);
  };
  const handleMoveBottom=(id,z2)=>{
    const q=[...queue];
    const i=q.indexOf(id); if(i<0||i===q.length-1) return;
    q.splice(i,1); q.push(id);
    onReorderQ(z2,q);
  };

  // Ne PAS appeler onResult ici: on diffère l'écriture jusqu'à expiration de la
  // fenêtre d'annulation. Feedback immédiat: vibration + flash + bannière.
  const startPending=(args,label)=>{
    if(navigator.vibrate) navigator.vibrate(40);
    handleFlashResult(label);
    setUndoLeft(10);
    setPending({args,label});
  };
  const handleWinner=(id,secondId=null)=>{
    if(pending) return;
    const p=pMap[id];
    startPending([id,secondId],(p?p.name.split(" ")[0]:"?")+" GAGNE!");
  };
  const handleTeamResult=(winner)=>{
    if(pending) return;
    startPending([winner],"EQUIPE "+winner+" GAGNE!");
  };
  const cancelPending=()=>{ setPending(null); }; // onResult jamais appelé → rien écrit



  if(disabled) return(
    <div style={{minHeight:"100vh",background:"#06070f",fontFamily:"'DM Sans',sans-serif",
      display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:16,padding:24}}>
      <style>{FONTS}</style>
      <div style={{fontSize:56,opacity:0.3}}>{z.icon}</div>
      <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:22,color:"#374151",textAlign:"center"}}>
        {t.stationDisabled}
      </div>
      <div style={{fontSize:13,color:"#4b5563",textAlign:"center",maxWidth:260}}>
        {t.stationDisabledDesc}
      </div>
      {sessionName&&<div style={{fontSize:11,color:"#374151",fontWeight:600}}>📋 {sessionName}</div>}
      <button onClick={onBack||onLogout} style={{marginTop:16,...S.btn(),padding:"8px 20px",fontSize:13}}>{t.backToStations}</button>
      {onGoAdmin&&<button onClick={onGoAdmin} style={{marginTop:8,...S.btn("#84cc16"),padding:"8px 20px",fontSize:13,color:"#000"}}>{fromPlayerId?t.goPlayer:t.goAdmin}</button>}
      <button onClick={onLogout} style={{marginTop:8,background:"none",border:"none",color:"#4b5563",fontSize:12,cursor:"pointer"}}>{t.disconnect}</button>
    </div>
  );

  return(<>
    <div style={{minHeight:"100vh",background:"#06070f",fontFamily:"'DM Sans',sans-serif"}}>
      <style>{FONTS}</style>

      {flash&&(
        <div style={{position:"fixed",inset:0,zIndex:50,display:"flex",alignItems:"center",justifyContent:"center",pointerEvents:"none"}}>
          <div className="anim-pop" style={{borderRadius:24,padding:"28px 44px",textAlign:"center",background:z.bg,border:"2px solid "+z.color,boxShadow:"0 0 60px "+z.color+"40"}}>
            <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:40,color:"#fff"}}>{flash}</div>
            <div style={{fontSize:18,marginTop:4,color:z.color}}>🎉</div>
          </div>
        </div>
      )}

      {/* Bannière d'annulation façon Gmail — résultat déclaré, en attente */}
      {pending&&(
        <div style={{position:"fixed",left:0,right:0,bottom:0,zIndex:60,
          padding:"12px 16px calc(env(safe-area-inset-bottom) + 12px)",
          display:"flex",justifyContent:"center",pointerEvents:"none"}}>
          <div style={{pointerEvents:"auto",display:"flex",alignItems:"center",gap:14,
            width:"100%",maxWidth:560,background:z.bg,border:"1px solid "+z.color,
            borderRadius:16,padding:"12px 14px 12px 16px",boxShadow:"0 10px 40px rgba(0,0,0,.6)"}}>
            <div style={{width:44,height:44,flexShrink:0,borderRadius:"50%",
              display:"flex",alignItems:"center",justifyContent:"center",
              background:z.color+"22",border:"2px solid "+z.color,
              fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:20,color:z.color}}>
              {undoLeft}
            </div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:18,
                color:"#fff",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{pending.label}</div>
              <div style={{fontSize:11,color:z.color}}>{t.resultIn} {undoLeft}s…</div>
            </div>
            <button onClick={cancelPending}
              style={{flexShrink:0,minHeight:44,padding:"10px 20px",borderRadius:12,cursor:"pointer",
                border:"2px solid "+z.color,background:"transparent",color:"#fff",
                fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:16,letterSpacing:1}}>
              ↺ {t.undoBtn}
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{position:"sticky",top:0,zIndex:10,paddingTop:"calc(env(safe-area-inset-top) + 16px)",paddingBottom:"12px",paddingLeft:"16px",paddingRight:"16px",background:"#06070f",borderBottom:"1px solid "+z.color+"25"}}>
        <div style={{...S.row(),justifyContent:"space-between",marginBottom:12}}>
          <div style={{...S.row()}}>
            <div style={{width:44,height:44,borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,background:z.bg,border:"1px solid "+z.border}}>{z.icon}</div>
            <div>
              <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:16,color:"#fff"}}>{zl.name.toUpperCase()}</div>
              <div style={{color:z.color,fontSize:12,fontWeight:600}}>{z.minP} joueurs minimum</div>
              {sessionName&&<div style={{fontSize:10,color:"#4b5563",marginTop:2,fontWeight:600,display:"flex",gap:6,alignItems:"center"}}>
                <span>📋 {sessionName}</span>
                {sessionCode&&<span style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:13,color:"#84cc16",letterSpacing:2}}>{sessionCode}</span>}
              </div>}
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <div style={{...S.tag(z.color)}}>{qPlayers.length} en file</div>
            {arenaState&&<div style={{textAlign:"center",minWidth:52}}>
              <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:18,
                color:arenaStatus==="active"?"#84cc16":arenaStatus==="paused"?"#f97316":arenaStatus==="ended"?"#dc2626":"#374151",
                lineHeight:1}}>{arenaTimer}</div>
              <div style={{fontSize:9,color:"#4b5563"}}>
                {arenaStatus==="active"?t.statusActive:arenaStatus==="paused"?t.statusPaused:arenaStatus==="ended"?t.statusEnded:t.statusWaiting}
              </div>
            </div>}
            <button onClick={onBack||onLogout} style={{padding:"8px 14px",borderRadius:10,background:"#111827",color:"#e5e7eb",border:"1px solid #374151",cursor:"pointer",fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:15,letterSpacing:1,display:"flex",alignItems:"center",gap:6}}>🏠 Home</button>
          </div>
        </div>
        <div style={{display:"flex",gap:4,alignItems:"center",justifyContent:"space-between"}}>
          {[["game",t.tabGame],["rules",t.tabRules]].map(([t,l])=>(
            <button key={t} onClick={()=>setTab(t)} style={{
              padding:"6px 12px",borderRadius:8,fontSize:12,fontWeight:600,border:"none",cursor:"pointer",
              background:tab===t?z.color:"#0d0f1a",color:tab===t?"#000":"#6b7280"}}>
              {l}
            </button>
          ))}
          <div style={{display:"flex",gap:4,marginLeft:"auto"}}>
            <button onClick={()=>setShowRoster(true)} style={{
              padding:"6px 12px",borderRadius:8,fontSize:12,fontWeight:600,border:"none",cursor:"pointer",
              background:"#1f2937",color:"#9ca3af"}}>
              👥 {t.participants} ({players.length})
            </button>
            {onGoAdmin&&<button onClick={onGoAdmin} title={fromPlayerId?t.returnAsPlayer:t.switchToAdmin}
              style={{padding:"6px 12px",borderRadius:8,fontSize:12,fontWeight:700,border:"1px solid #84cc1640",cursor:"pointer",
                background:"#111827",color:"#84cc16"}}>
              {fromPlayerId?t.goPlayer:t.goAdmin}
            </button>}
          </div>
        </div>
      </div>

      {/* Overlay liste des participants */}
      {showRoster&&(
        <div style={{position:"fixed",inset:0,zIndex:50,background:"rgba(0,0,0,.88)",
          display:"flex",flexDirection:"column"}} onClick={()=>setShowRoster(false)}>
          <div style={{background:"#06070f",paddingTop:"calc(env(safe-area-inset-top) + 16px)",
            paddingBottom:12,paddingLeft:16,paddingRight:16,
            borderBottom:"1px solid #1f2937",display:"flex",alignItems:"center",justifyContent:"space-between"}}
            onClick={e=>e.stopPropagation()}>
            <div>
              <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:18,color:"#fff"}}>
                👥 Participants
              </div>
              <div style={{fontSize:11,color:"#4b5563"}}>
                {sessionName}{sessionCode&&<span style={{color:"#84cc16",fontWeight:700,letterSpacing:2,marginLeft:8}}>{sessionCode}</span>} · {players.length} joueurs
              </div>
            </div>
            <button onClick={()=>setShowRoster(false)}
              style={{padding:8,borderRadius:10,background:"#111827",color:"#6b7280",border:"none",cursor:"pointer",fontSize:16}}>×</button>
          </div>
          <div style={{overflowY:"auto",flex:1,padding:16}} onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex",flexDirection:"column",gap:4}}>
              {[...players].sort((a,b)=>a.number-b.number).map(p=>(
                <div key={p.id} style={{display:"flex",alignItems:"center",gap:10,
                  padding:"8px 12px",borderRadius:10,background:"#0d0f1a",border:"1px solid #1f2937"}}>
                  <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:16,
                    color:"#84cc16",width:32,flexShrink:0}}>#{p.number}</div>
                  <span style={{flex:1,color:"#fff",fontWeight:600,fontSize:14}}>{p.name}</span>
                  <span style={{fontSize:11,color:"#4b5563"}}>{p.gender==="F"?"F":"H"}</span>
                  <span style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:13,color:"#6b7280"}}>{p.globalPoints} pts</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div style={{padding:16}}>
        {tab==="rules"&&<RulesCard zone={zone}/>}

        {tab==="game"&&(
          <div className="anim-up">
            {/* ACTIVE GAME */}
            {activeGame?(
              <div>
                {onCancelGame&&<button onClick={()=>{if(!pending&&window.confirm(t.returnToQueueConfirm))onCancelGame(zone);}}
                  style={{...S.btn(),width:"100%",padding:"8px",fontSize:12,marginBottom:10,
                    border:"1px solid #374151",color:"#9ca3af",display:"flex",alignItems:"center",justifyContent:"center",gap:6,
                    opacity:pending?0.4:1,pointerEvents:pending?"none":"auto"}}>
                  {t.returnToQueue}
                </button>}
                {z.gameStyle==="sprint"?(
                <SprintGameView game={activeGame} players={players} zone={zone} locked={!!pending}
                  onWinner={handleWinner}
                  onRemove={(id)=>onRemoveFromGame(zone,id)}
                  onReplace={()=>onReplaceInGame(zone)}/>
              ):z.gameStyle==="team"?(
                <TeamGameView game={activeGame} players={players} zone={zone} locked={!!pending}
                  onResult={handleTeamResult}
                  onRemove={(id)=>onRemoveFromGame(zone,id)}
                  onReplace={()=>onReplaceInGame(zone)}/>
              ):(
                <IndividualGameView game={activeGame} players={players} zone={zone} locked={!!pending}
                  onWinner={handleWinner}
                  onRemove={(id)=>onRemoveFromGame(zone,id)}
                  onReplace={()=>onReplaceInGame(zone)}/>
              )}
              </div>
            ):(
              <div>
                {/* Sprint size selector */}
                {zone==="speed"&&(
                  <div style={{borderRadius:14,padding:12,marginBottom:12,background:z.bg,border:"1px solid "+z.border}}>
                    <div style={{...S.label(),color:z.color,marginBottom:10}}>{t.raceGroupSize}</div>
                    {qPlayers.length<4
                      ?<div style={{fontSize:12,color:"#4b5563",textAlign:"center"}}>Minimum 4 joueurs requis</div>
                      :<div>
                        <div style={{display:"flex",gap:6,marginBottom:10}}>
                          {[4,10,15,"tous"].map(s=>{
                            const effectiveSize=s==="tous"?qPlayers.length:s;
                            const disabled=s!=="tous"&&qPlayers.length<s;
                            const isSelected=sprintSize===s;
                            return(
                              <button key={s} onClick={()=>!disabled&&setSprintSize(s)}
                                style={{flex:1,padding:"8px 4px",borderRadius:10,border:"none",
                                  cursor:disabled?"not-allowed":"pointer",
                                  fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:15,
                                  background:isSelected?z.color:disabled?"#111827":"#1f2937",
                                  color:isSelected?"#000":disabled?"#374151":"#9ca3af",
                                  opacity:disabled?0.4:1}}>
                                {s==="tous"?"Tous\n("+qPlayers.length+")":s}
                              </button>
                            );
                          })}
                        </div>
                        <div style={{fontSize:11,color:"#4b5563"}}>
                          {(()=>{
                            const eff=sprintSize==="tous"?qPlayers.length:sprintSize;
                            return"Course de "+eff+" · Groupe A (avant): "+Math.floor(eff/2)+" · Groupe B (arrière): "+(eff-Math.floor(eff/2));
                          })()}
                        </div>
                      </div>
                    }
                  </div>
                )}

                {/* Generate */}
                <div style={{...S.card(),marginBottom:12,textAlign:"center"}}>
                  {canGen?(
                    <div>
                      <div style={{fontSize:13,color:"#6b7280",marginBottom:12}}>
                        {zone==="speed"?(()=>{const eff=sprintSize==="tous"?qPlayers.length:sprintSize; return qPlayers.length+" "+t.playersInQueue+" — "+t.raceOf+" "+eff;})()
                          :qPlayers.length+" "+t.playersInQueue}
                      </div>
                      {!hasIdeal&&zone!=="speed"&&!confirmShortGame&&(
                        <div style={{background:"#f9731615",border:"1px solid #f9731650",borderRadius:12,
                          padding:"12px 14px",marginBottom:12}}>
                          <div style={{fontSize:13,color:"#f97316",fontWeight:700,marginBottom:10}}>
                            ⚠️ {t.missingPlayers} {idealCount-qPlayers.length} {t.playAnyway}
                          </div>
                          <div style={{display:"flex",gap:8}}>
                            <button onClick={()=>onGenerate(null,true)}
                              style={{flex:1,padding:"10px",borderRadius:10,border:"none",cursor:"pointer",
                                background:z.color,color:"#000",fontWeight:700,fontSize:14}}>
                              {t.yesPlay}
                            </button>
                            <button onClick={()=>setConfirmShortGame(true)}
                              style={{flex:1,padding:"10px",borderRadius:10,cursor:"pointer",
                                background:"#1f2937",color:"#9ca3af",border:"1px solid #374151",fontSize:14}}>
                              {t.noPlay}
                            </button>
                          </div>
                        </div>
                      )}
                      {(hasIdeal||zone==="speed")&&(
                        // Secondaire: en flux normal l'auto-génération prend le relais,
                        // ce bouton ne sert qu'aux cas limites (1er match, edge cases).
                        <button onClick={()=>onGenerate(zone==="speed"?(sprintSize==="tous"?qPlayers.length:sprintSize):null)}
                          style={{padding:"9px 22px",borderRadius:10,cursor:"pointer",fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:15,background:"transparent",border:"1.5px solid "+z.color,color:z.color}}>
                          {zone==="speed"?t.launchRace+" ("+(sprintSize==="tous"?qPlayers.length:sprintSize)+")":t.generateTeams}
                        </button>
                      )}
                    </div>
                  ):(
                    <div>
                      <div style={{color:"#4b5563",fontSize:13,marginBottom:8}}>{t.emptyQueue}</div>
                      <div style={{color:z.color,fontSize:12,marginBottom:8}}>
                        {qPlayers.length}/{minToShow} {t.minPlayers}
                      </div>
                      <div style={{height:6,borderRadius:4,maxWidth:160,margin:"0 auto",background:"#1f2937"}}>
                        <div style={{height:"100%",borderRadius:4,background:z.color,
                          width:Math.min(100,(qPlayers.length/z.minP)*100)+"%",transition:"width .5s"}}/>
                      </div>
                    </div>
                  )}
                </div>

                {/* Sprint lineup preview */}
                {zone==="speed"&&sprintLine.length>0&&(
                  <div style={{borderRadius:12,padding:10,marginBottom:10,background:z.bg,border:"1px solid "+z.border}}>
                    <div style={{...S.label(),color:z.color,marginBottom:8}}>{t.sprintOrder}</div>
                    <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                      {sprintLine.map((p,i)=>(
                        <div key={p.id} style={{...S.row(),padding:"3px 7px",borderRadius:7,background:"#1f2937",gap:4}}>
                          <span style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:11,color:z.color}}>{i+1}</span>
                          <TierBadge score={(p.zoneScores||{}).speed||50}/>
                          <span style={{fontSize:11,color:"#fff"}}>{p.name.split(" ")[0]}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Queue */}
                <div>
                  <div style={{...S.row(),justifyContent:"space-between",marginBottom:8}}>
                    <div style={{...S.label()}}>{t.queue} ({qPlayers.length})</div>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      {onFillQueue&&<button onClick={onFillQueue}
                        style={{padding:"4px 10px",borderRadius:8,border:"1px solid #84cc1640",
                          background:"#111827",color:"#84cc16",cursor:"pointer",fontSize:11,fontWeight:700}}>
                        🔀 Remplir tout
                      </button>}
                      <div style={{fontSize:11,color:"#374151"}}>Min.{z.minP} · Max.{z.maxP}</div>
                    </div>
                  </div>
                  <div style={{display:"flex",gap:8,marginBottom:10}}>
                    <input type="number" min="1" max="999" placeholder="# Joueur"
                      value={numInput} onChange={e=>setNumInput(e.target.value)}
                      onKeyDown={e=>{if(e.key==="Enter")handleAdd();}}
                      style={{flex:1,padding:"8px 12px",borderRadius:10,border:"1px solid #1f2937",background:"#0d0f1a",color:"#fff",fontSize:13,outline:"none"}}/>
                    <button onClick={handleAdd} style={{...S.btn(z.color),padding:"8px 14px"}}>{t.addPlayer}</button>
                  </div>
                  <QueueList zone={zone} qPlayers={qPlayers}
                    onMoveTop={handleMoveTop} onMoveBottom={handleMoveBottom}
                    onRemove={onRemoveQ} onReorder={onReorderQ} highlightId={highlightId}/>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
    <LangFooter/>
  </>);
}

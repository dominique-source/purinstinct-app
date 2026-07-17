import { useState, useEffect, useRef } from "react";
import { ZONES } from "../../config/zones.js";
import { useZn, useT } from "../../hooks/useLang.js";
import { TierBadge } from "../shared/TierBadge.jsx";
import { RulesCard } from "../shared/RulesCard.jsx";
import { LangFooter } from "../shared/LangFooter.jsx";
import { QueueList } from "../shared/QueueList.jsx";
import { SprintGameView } from "./SprintGameView.jsx";
import { IndividualGameView } from "./IndividualGameView.jsx";
import { TeamGameView } from "./TeamGameView.jsx";
import { useArenaTimer } from "../../hooks/useArenaTimer.js";
import { Button, IconButton, Panel, Eyebrow, Badge, LiveIndicator, Tabs, Timer, Modal } from "../ui/index.js";

// Flagship live-station console. Presentation is design-system-driven; the
// pending/undo state machine, auto-generation and queue logic are preserved
// verbatim from the previous implementation.
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
  const sprintLine=[...qPlayers].sort((a,b)=>((a.zoneScores||{}).speed||50)-((b.zoneScores||{}).speed||50));

  const handleAdd=()=>{
    const n=parseInt(numInput,10);
    const p=players.find(px=>px.number===n);
    if(!p){setNumInput(""); return;}
    if(queue.includes(p.id)){
      setHighlightId(p.id);
      setTimeout(()=>setHighlightId(null),2800);
      setNumInput("");
      return;
    }
    onAddQ(p.id,zone,true);
    setNumInput("");
  };

  const handleFlashResult=(label)=>{ setFlash(label); setTimeout(()=>setFlash(null),2200); };

  const handleMoveTop=(id,z2)=>{
    const q=[...queue]; const i=q.indexOf(id); if(i<=0) return;
    q.splice(i,1); q.unshift(id); onReorderQ(z2,q);
  };
  const handleMoveBottom=(id,z2)=>{
    const q=[...queue]; const i=q.indexOf(id); if(i<0||i===q.length-1) return;
    q.splice(i,1); q.push(id); onReorderQ(z2,q);
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
  const cancelPending=()=>{ setPending(null); };

  const arenaTone = arenaStatus==="active"?"live":arenaStatus==="paused"?"paused":arenaStatus==="ended"?"ended":undefined;
  const arenaLabel = arenaStatus==="active"?t.statusActive:arenaStatus==="paused"?t.statusPaused:arenaStatus==="ended"?t.statusEnded:t.statusWaiting;

  // ---- Disabled zone ---------------------------------------------------------
  if(disabled) return(
    <div style={{minHeight:"100svh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:"var(--pi-s4)",padding:"var(--pi-s6)"}}>
      <div style={{fontSize:56,opacity:0.25}}>{z.icon}</div>
      <div style={{fontFamily:"var(--pi-font-display)",fontWeight:900,fontStyle:"italic",fontSize:"var(--pi-fs-title)",color:"var(--pi-text-3)",textAlign:"center"}}>{t.stationDisabled}</div>
      <div style={{fontSize:"var(--pi-fs-body)",color:"var(--pi-text-3)",textAlign:"center",maxWidth:260}}>{t.stationDisabledDesc}</div>
      {sessionName&&<Badge>📋 {sessionName}</Badge>}
      <div style={{display:"flex",flexDirection:"column",gap:"var(--pi-s2)",marginTop:"var(--pi-s4)",width:"100%",maxWidth:280}}>
        <Button variant="secondary" block onClick={onBack||onLogout}>{t.backToStations}</Button>
        {onGoAdmin&&<Button variant="primary" block onClick={onGoAdmin}>{fromPlayerId?t.goPlayer:t.goAdmin}</Button>}
        <Button variant="ghost" size="sm" block onClick={onLogout}>{t.disconnect}</Button>
      </div>
    </div>
  );

  return(<>
    <div style={{minHeight:"100svh",display:"flex",flexDirection:"column"}}>

      {/* ================= BROADCAST HEADER ================= */}
      <header style={{position:"sticky",top:0,zIndex:"var(--pi-z-sticky)",background:"var(--pi-bg)",
        borderBottom:`1px solid ${z.color}33`,
        paddingTop:"calc(env(safe-area-inset-top) + 12px)",paddingBottom:12,paddingLeft:"var(--pi-gutter)",paddingRight:"var(--pi-gutter)"}}>
        <div style={{maxWidth:"var(--pi-w-wide)",margin:"0 auto",display:"flex",alignItems:"center",gap:"var(--pi-s3)"}}>

          {/* Zone identity */}
          <div style={{display:"flex",alignItems:"center",gap:"var(--pi-s3)",minWidth:0,flex:1}}>
            <div style={{width:48,height:48,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,
              background:z.bg,border:`1px solid ${z.color}55`,
              clipPath:"polygon(9px 0,100% 0,100% calc(100% - 9px),calc(100% - 9px) 100%,0 100%,0 9px)"}}>{z.icon}</div>
            <div style={{minWidth:0}}>
              <div style={{fontFamily:"var(--pi-font-display)",fontWeight:900,fontStyle:"italic",fontSize:20,lineHeight:1,color:"#fff",
                letterSpacing:".01em",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{zl.name.toUpperCase()}</div>
              <div style={{display:"flex",alignItems:"center",gap:"var(--pi-s2)",marginTop:3}}>
                {activeGame ? <LiveIndicator/> : <span style={{fontSize:"var(--pi-fs-meta)",fontWeight:700,letterSpacing:".12em",textTransform:"uppercase",color:"var(--pi-text-3)"}}>Prêt</span>}
                {sessionCode&&<span style={{fontSize:"var(--pi-fs-meta)",color:"var(--pi-text-4)"}}>·</span>}
                {sessionCode&&<span style={{fontFamily:"var(--pi-font-display)",fontWeight:700,fontSize:12,color:"var(--pi-lime)",letterSpacing:".12em"}}>{sessionCode}</span>}
              </div>
            </div>
          </div>

          {/* Arena clock — the scoreboard telemetry */}
          {arenaState&&<div style={{textAlign:"center",flexShrink:0,paddingLeft:"var(--pi-s3)",paddingRight:"var(--pi-s3)",
            borderLeft:"1px solid var(--pi-line)",borderRight:"1px solid var(--pi-line)"}}>
            <Timer value={arenaTimer} tone={arenaTone} size={26} className={arenaStatus==="active"?"pi-pulse":undefined}/>
            <div style={{fontSize:"var(--pi-fs-meta)",fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",color:"var(--pi-text-3)",marginTop:2}}>{arenaLabel}</div>
          </div>}

          {/* Queue count — hidden on mobile (the queue section below already owns it) */}
          <div className="pi-hide-mobile" style={{textAlign:"center",flexShrink:0}}>
            <div style={{fontFamily:"var(--pi-font-display)",fontWeight:900,fontStyle:"italic",fontSize:26,lineHeight:1,color:qPlayers.length>=minToShow?"var(--pi-lime)":"var(--pi-text-3)"}}>{qPlayers.length}</div>
            <div style={{fontSize:"var(--pi-fs-meta)",fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",color:"var(--pi-text-3)",marginTop:2}}>en file</div>
          </div>

          <IconButton label="Accueil" onClick={onBack||onLogout}>🏠</IconButton>
        </div>

        {/* Tab + quick actions row */}
        <div style={{maxWidth:"var(--pi-w-wide)",margin:"10px auto 0",display:"flex",alignItems:"center",gap:"var(--pi-s2)"}}>
          <div style={{flex:"0 0 auto",width:220,maxWidth:"55%"}}>
            <Tabs items={[{id:"game",label:t.tabGame},{id:"rules",label:t.tabRules}]} value={tab} onChange={setTab}/>
          </div>
          <div style={{marginLeft:"auto",display:"flex",gap:"var(--pi-s2)"}}>
            <Button variant="ghost" size="sm" onClick={()=>setShowRoster(true)}>👥 {players.length}</Button>
            {onGoAdmin&&<Button variant="outline" size="sm" onClick={onGoAdmin}>{fromPlayerId?t.goPlayer:t.goAdmin}</Button>}
          </div>
        </div>
      </header>

      {/* ================= CONTENT ================= */}
      <main style={{flex:1,width:"100%",maxWidth:"var(--pi-w-wide)",margin:"0 auto",padding:"var(--pi-s4) var(--pi-gutter)"}}>
        {tab==="rules"&&<div style={{maxWidth:"var(--pi-w-content)"}}><RulesCard zone={zone}/></div>}

        {tab==="game"&&(
          <div className="pi-anim-up pi-station-grid">
            {/* ===== PRIMARY COLUMN — the action ===== */}
            <div>
            {activeGame?(
              /* ---------- LIVE MATCH ---------- */
              <div>
                {/* No title/LIVE badge here: the header already shows zone-level LIVE
                    and each game sub-view renders its own titled live header. */}
                {onCancelGame&&<div style={{display:"flex",justifyContent:"flex-end",marginBottom:"var(--pi-s2)"}}>
                  <Button variant="ghost" size="sm" disabled={!!pending}
                    onClick={()=>{if(!pending&&window.confirm(t.returnToQueueConfirm))onCancelGame(zone);}}>
                    {t.returnToQueue}
                  </Button>
                </div>}
                {z.gameStyle==="sprint"?(
                  <SprintGameView game={activeGame} players={players} zone={zone} locked={!!pending}
                    onWinner={handleWinner} onRemove={(id)=>onRemoveFromGame(zone,id)} onReplace={()=>onReplaceInGame(zone)}/>
                ):z.gameStyle==="team"?(
                  <TeamGameView game={activeGame} players={players} zone={zone} locked={!!pending}
                    onResult={handleTeamResult} onRemove={(id)=>onRemoveFromGame(zone,id)} onReplace={()=>onReplaceInGame(zone)}/>
                ):(
                  <IndividualGameView game={activeGame} players={players} zone={zone} locked={!!pending}
                    onWinner={handleWinner} onRemove={(id)=>onRemoveFromGame(zone,id)} onReplace={()=>onReplaceInGame(zone)}/>
                )}
              </div>
            ):(
              /* ---------- SETUP / GENERATE ---------- */
              <div style={{display:"flex",flexDirection:"column",gap:"var(--pi-s3)"}}>

                {/* Sprint size selector */}
                {zone==="speed"&&qPlayers.length>=4&&(
                  <Panel variant="raised">
                    <Eyebrow style={{marginBottom:"var(--pi-s3)"}}>{t.raceGroupSize}</Eyebrow>
                    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"var(--pi-s2)",marginBottom:"var(--pi-s3)"}}>
                      {[4,10,15,"tous"].map(s=>{
                        const dis=s!=="tous"&&qPlayers.length<s;
                        const sel=sprintSize===s;
                        return(
                          <button key={s} onClick={()=>!dis&&setSprintSize(s)} disabled={dis}
                            className={sel?"pi-tab is-active":"pi-tab"}
                            style={{minHeight:44,fontFamily:"var(--pi-font-display)",fontStyle:"italic",fontSize:16,opacity:dis?0.35:1}}>
                            {s==="tous"?`TOUS ${qPlayers.length}`:s}
                          </button>
                        );
                      })}
                    </div>
                    <div style={{fontSize:"var(--pi-fs-label)",color:"var(--pi-text-3)"}}>
                      {(()=>{const eff=sprintSize==="tous"?qPlayers.length:sprintSize;return`Course de ${eff} · Avant ${Math.floor(eff/2)} · Arrière ${eff-Math.floor(eff/2)}`;})()}
                    </div>
                  </Panel>
                )}

                {/* Primary generate action */}
                {canGen?(
                  <Panel variant="hero" style={{textAlign:"center",padding:"var(--pi-s5)"}}>
                    {/* Lead with the match about to be generated, not a restatement
                        of the queue count already shown in the header. */}
                    <Eyebrow>Prochain match</Eyebrow>
                    <div style={{fontFamily:"var(--pi-font-display)",fontWeight:900,fontStyle:"italic",fontSize:"var(--pi-fs-score)",lineHeight:1,color:"#fff",margin:"var(--pi-s1) 0 var(--pi-s1)"}}>
                      {zone==="speed"?(sprintSize==="tous"?qPlayers.length:sprintSize):idealCount}
                      <span style={{fontSize:"0.36em",color:"var(--pi-text-3)",marginLeft:8}}>{zone==="speed"?"COUREURS":"JOUEURS"}</span>
                    </div>
                    <div style={{fontSize:"var(--pi-fs-label)",color:"var(--pi-text-3)",marginBottom:"var(--pi-s4)"}}>
                      sur {qPlayers.length} en file
                    </div>

                    {!hasIdeal&&zone!=="speed"&&!confirmShortGame?(
                      <div>
                        <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:6,color:"var(--pi-warn)",fontSize:"var(--pi-fs-body)",fontWeight:700,marginBottom:"var(--pi-s3)"}}>
                          ⚠ {t.missingPlayers} {idealCount-qPlayers.length} {t.playAnyway}
                        </div>
                        <div style={{display:"flex",gap:"var(--pi-s2)"}}>
                          <Button variant="primary" size="lg" block onClick={()=>onGenerate(null,true)}>{t.yesPlay}</Button>
                          <Button variant="secondary" size="lg" onClick={()=>setConfirmShortGame(true)}>{t.noPlay}</Button>
                        </div>
                      </div>
                    ):(hasIdeal||zone==="speed")&&(
                      <Button variant="primary" size="xl" cut block
                        onClick={()=>onGenerate(zone==="speed"?(sprintSize==="tous"?qPlayers.length:sprintSize):null)}>
                        {zone==="speed"?`${t.launchRace} (${sprintSize==="tous"?qPlayers.length:sprintSize})`:t.generateTeams}
                      </Button>
                    )}
                  </Panel>
                ):(
                  <Panel style={{textAlign:"center",padding:"var(--pi-s6) var(--pi-s4)"}}>
                    <div style={{fontFamily:"var(--pi-font-display)",fontWeight:900,fontStyle:"italic",fontSize:"var(--pi-fs-score)",lineHeight:1,color:"var(--pi-text-3)"}}>
                      {qPlayers.length}<span style={{fontSize:"0.42em",margin:"0 4px"}}>/</span>{minToShow}
                    </div>
                    <div style={{fontSize:"var(--pi-fs-body)",color:"var(--pi-text-3)",margin:"var(--pi-s2) 0 var(--pi-s3)"}}>{t.emptyQueue}</div>
                    <div style={{height:6,borderRadius:"var(--pi-r-pill)",maxWidth:200,margin:"0 auto",background:"var(--pi-surface-2)",overflow:"hidden"}}>
                      <div style={{height:"100%",background:"var(--pi-lime)",width:Math.min(100,(qPlayers.length/minToShow)*100)+"%",transition:"width .4s var(--pi-ease-out)"}}/>
                    </div>
                  </Panel>
                )}
              </div>
            )}
            </div>

            {/* ===== RAIL — queue stays visible during live play ===== */}
            <aside className="pi-station-rail" style={{display:"flex",flexDirection:"column",gap:"var(--pi-s3)"}}>
              {/* Sprint lineup preview — desktop context, not worth the mobile fold */}
              {zone==="speed"&&!activeGame&&sprintLine.length>0&&(
                <Panel variant="raised" className="pi-hide-mobile">
                  <Eyebrow style={{marginBottom:"var(--pi-s2)"}}>{t.sprintOrder}</Eyebrow>
                  <div style={{display:"flex",flexWrap:"wrap",gap:"var(--pi-s1)"}}>
                    {sprintLine.map((p,i)=>(
                      <div key={p.id} style={{display:"flex",alignItems:"center",gap:5,padding:"3px 7px",borderRadius:"var(--pi-r-sm)",background:"var(--pi-surface-3)"}}>
                        <span style={{fontFamily:"var(--pi-font-display)",fontWeight:900,fontStyle:"italic",fontSize:12,color:"var(--pi-lime)"}}>{i+1}</span>
                        <TierBadge score={(p.zoneScores||{}).speed||50}/>
                        <span style={{fontSize:12,color:"#fff"}}>{p.name.split(" ")[0]}</span>
                      </div>
                    ))}
                  </div>
                </Panel>
              )}

              {/* Queue management */}
              <div>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"var(--pi-s2)",gap:"var(--pi-s2)"}}>
                  <Eyebrow>{t.queue} · {qPlayers.length}</Eyebrow>
                  {onFillQueue&&<Button variant="outline" size="sm" onClick={onFillQueue}>Remplir</Button>}
                </div>
                <div style={{display:"flex",gap:"var(--pi-s2)",marginBottom:"var(--pi-s3)"}}>
                  <input type="number" min="1" max="999" placeholder="# Joueur" className="pi-input"
                    value={numInput} onChange={e=>setNumInput(e.target.value)}
                    onKeyDown={e=>{if(e.key==="Enter")handleAdd();}} style={{flex:1}}/>
                  <Button variant="primary" onClick={handleAdd}>{t.addPlayer}</Button>
                </div>
                <QueueList zone={zone} qPlayers={qPlayers}
                  onMoveTop={handleMoveTop} onMoveBottom={handleMoveBottom}
                  onRemove={onRemoveQ} onReorder={onReorderQ} highlightId={highlightId}/>
                <div style={{fontSize:"var(--pi-fs-meta)",color:"var(--pi-text-4)",marginTop:"var(--pi-s2)",textAlign:"right"}}>Min {z.minP} · Max {z.maxP}</div>
              </div>
            </aside>
          </div>
        )}
      </main>
    </div>

    {/* ================= WINNER FLASH ================= */}
    {flash&&(
      <div style={{position:"fixed",inset:0,zIndex:"var(--pi-z-overlay)",display:"flex",alignItems:"center",justifyContent:"center",pointerEvents:"none",padding:"var(--pi-s4)"}}>
        <div className="pi-anim-pop" style={{padding:"28px 44px",textAlign:"center",background:z.bg,border:`2px solid ${z.color}`,
          clipPath:"polygon(18px 0,100% 0,100% calc(100% - 18px),calc(100% - 18px) 100%,0 100%,0 18px)",
          filter:`drop-shadow(0 0 40px ${z.color}66)`,
          backgroundImage:`repeating-linear-gradient(0deg,transparent 0 3px,${z.color}0f 3px 4px)`}}>
          <div style={{fontFamily:"var(--pi-font-display)",fontWeight:900,fontStyle:"italic",fontSize:42,letterSpacing:".01em",color:"#fff"}}>{flash}</div>
          <div style={{fontSize:18,marginTop:4,color:z.color}}>🎉</div>
        </div>
      </div>
    )}

    {/* ================= PENDING / UNDO CHYRON ================= */}
    {pending&&(
      <div style={{position:"fixed",left:0,right:0,bottom:0,zIndex:"var(--pi-z-toast)",
        padding:"12px var(--pi-gutter) calc(env(safe-area-inset-bottom) + 12px)",display:"flex",justifyContent:"center",pointerEvents:"none"}}>
        <div style={{pointerEvents:"auto",display:"flex",alignItems:"center",gap:14,width:"100%",maxWidth:560,
          background:z.bg,border:`1px solid ${z.color}`,padding:"12px 14px 12px 16px",
          clipPath:"polygon(12px 0,100% 0,100% calc(100% - 12px),calc(100% - 12px) 100%,0 100%,0 12px)",
          filter:`drop-shadow(0 12px 28px rgba(0,0,0,.6)) drop-shadow(0 0 14px ${z.color}40)`}}>
          <div style={{width:46,height:46,flexShrink:0,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",
            background:z.color+"22",border:`2px solid ${z.color}`,
            fontFamily:"var(--pi-font-display)",fontWeight:900,fontStyle:"italic",fontSize:21,color:z.color}}>{undoLeft}</div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontFamily:"var(--pi-font-display)",fontWeight:900,fontStyle:"italic",fontSize:18,color:"#fff",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{pending.label}</div>
            <div style={{fontSize:"var(--pi-fs-label)",color:z.color}}>{t.resultIn} {undoLeft}s…</div>
          </div>
          <button onClick={cancelPending} style={{flexShrink:0,minHeight:44,padding:"10px 20px",cursor:"pointer",
            border:`2px solid ${z.color}`,background:"transparent",color:"#fff",borderRadius:"var(--pi-r-md)",
            fontFamily:"var(--pi-font-display)",fontWeight:900,fontStyle:"italic",fontSize:16,letterSpacing:".04em"}}>
            ↺ {t.undoBtn}
          </button>
        </div>
      </div>
    )}

    {/* ================= PARTICIPANTS DRAWER ================= */}
    <Modal open={showRoster} onClose={()=>setShowRoster(false)} labelledBy="roster-title" className="pi-modal--roster">
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:"var(--pi-s4)"}}>
        <div>
          <h2 id="roster-title" style={{fontFamily:"var(--pi-font-display)",fontWeight:900,fontStyle:"italic",fontSize:"var(--pi-fs-section)",color:"#fff"}}>PARTICIPANTS</h2>
          <div style={{fontSize:"var(--pi-fs-label)",color:"var(--pi-text-3)",marginTop:2}}>
            {sessionName}{sessionCode&&<span style={{color:"var(--pi-lime)",fontWeight:700,letterSpacing:".1em",marginLeft:8}}>{sessionCode}</span>} · {players.length} joueurs
          </div>
        </div>
        <IconButton label="Fermer" onClick={()=>setShowRoster(false)}>×</IconButton>
      </div>
      <div style={{maxHeight:"60vh",overflowY:"auto",display:"flex",flexDirection:"column",gap:"var(--pi-s1)"}}>
        {[...players].sort((a,b)=>a.number-b.number).map(p=>(
          <div key={p.id} style={{display:"flex",alignItems:"center",gap:"var(--pi-s3)",padding:"8px 12px",borderRadius:"var(--pi-r-sm)",background:"var(--pi-surface-2)"}}>
            <span style={{fontFamily:"var(--pi-font-display)",fontWeight:900,fontStyle:"italic",fontSize:16,color:"var(--pi-lime)",width:34,flexShrink:0}}>#{p.number}</span>
            <span style={{flex:1,color:"#fff",fontWeight:600,fontSize:"var(--pi-fs-body)"}}>{p.name}</span>
            <span style={{fontSize:"var(--pi-fs-label)",color:"var(--pi-text-4)"}}>{p.gender==="F"?"F":"H"}</span>
            <span style={{fontFamily:"var(--pi-font-display)",fontWeight:700,fontStyle:"italic",fontSize:14,color:"var(--pi-text-2)"}}>{p.globalPoints} pts</span>
          </div>
        ))}
      </div>
    </Modal>

    {!pending&&<LangFooter/>}
  </>);
}

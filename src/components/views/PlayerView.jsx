import { useState, useRef } from "react";
import html2canvas from "html2canvas";
import confetti from "canvas-confetti";
import QRCode from "qrcode";
import { FONTS } from "../../config/fonts.js";
import { ZONES, ZK } from "../../config/zones.js";
import { useZn, useT } from "../../hooks/useLang.js";
import { getStatus } from "../../lib/game-logic.js";
import { S } from "../shared/styles.js";
import { Bib } from "../shared/Bib.jsx";
import { TierBadge } from "../shared/TierBadge.jsx";
import { LeaderRow } from "../shared/LeaderRow.jsx";
import { PlayerAvatar } from "../shared/PlayerAvatar.jsx";
import { SKIN_TONES, HAIR_COLORS, MORPHO_LABELS } from "../../config/avatarOptions.js";
import { BASE_URL } from "../../config/constants.js";
import { PlayerDossier } from "../admin/PlayerDossier.jsx";
import { LangFooter } from "../shared/LangFooter.jsx";
import { useArenaTimer } from "../../hooks/useArenaTimer.js";
import { useCountUp } from "../../hooks/useCountUp.js";
import { PlayerRulesView } from "./PlayerRulesView.jsx";

export function PlayerView({playerId,players,queues,activeGames,disabledZones,arenaState,rosterCodes,sessionRosterId,winnersPublished,onJoin,onLeave,onLogout,onUpdatePlayer,onBecomeStation,onAddComment}){
  const t=useT();
  const zn=useZn();
  const player=players.find(p=>p.id===playerId);
  const {timer:arenaTimer,status:arenaStatus}=useArenaTimer(arenaState);
  const [tab,setTab]=useState("stats");
  const [showHub,setShowHub]=useState(true);
  const [sessionQR,setSessionQR]=useState(null);
  const [showQR,setShowQR]=useState(false);
  const [skinIdx,setSkinIdx]=useState(2);
  const [hairIdx,setHairIdx]=useState(3);
  const [morphology,setMorphology]=useState(1);
  const [playerWinnerCard,setPlayerWinnerCard]=useState(null);
  const [savingPlayerCard,setSavingPlayerCard]=useState(false);
  const [showCongrats,setShowCongrats]=useState(false);
  const [leaderSearch,setLeaderSearch]=useState("");
  const [leaderHighlight,setLeaderHighlight]=useState(null);
  const [expandedQueues,setExpandedQueues]=useState({});
  const playerCardRef=useRef(null);
  const confettiFiredRef=useRef(false);
  const leaderHighlightRef=useRef(null);
  const hubPts=useCountUp(player?.globalPoints||0); // avant le early-return: règle des hooks
  if(!player) return null;

  const savePlayerCard=async()=>{
    if(!playerCardRef.current||savingPlayerCard) return;
    setSavingPlayerCard(true);
    try{
      const canvas=await html2canvas(playerCardRef.current,{
        backgroundColor:"#0a0c14",scale:3,useCORS:true,logging:false,removeContainer:true
      });
      const url=canvas.toDataURL("image/png");
      const a=document.createElement("a");
      a.href=url; a.download="purinstinct-gagnant.png"; a.click();
    }catch(e){console.error(e);}
    setSavingPlayerCard(false);
  };

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

  // ── HUB PAGE ──
  if(showHub) return(
    <div style={{minHeight:"100vh",background:"#06070f",fontFamily:"'DM Sans',sans-serif",
      display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
      paddingTop:"calc(env(safe-area-inset-top) + 24px)",paddingBottom:24,paddingLeft:24,paddingRight:24}}>
      <style>{FONTS}</style>
      {/* Header joueur */}
      <div style={{textAlign:"center",marginBottom:28}}>
        <Bib n={player.number} size="lg"/>
        <div style={{fontWeight:700,color:"#fff",fontSize:18,marginTop:8}}>{player.name}</div>
        <div style={{...S.row(),gap:8,justifyContent:"center",marginTop:4}}>
          <span style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontStyle:"italic",fontSize:28,color:"#84cc16",textShadow:"0 0 24px #84cc1640"}}>{hubPts} pts</span>
          <span style={{fontSize:12,color:"#4b5563"}}>Rang #{rank}</span>
        </div>
        {arenaState&&<div style={{marginTop:6}}>
          <span className={arenaStatus==="active"?"pulse-lime":""} style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:16,
            color:arenaStatus==="active"?"#84cc16":arenaStatus==="paused"?"#f97316":"#374151"}}>
            {arenaTimer} {arenaStatus==="active"?t.statusActive:arenaStatus==="paused"?t.statusPaused:""}
          </span>
        </div>}
      </div>
      {/* Grille 2x3 */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,width:"100%",maxWidth:360}}>
        {[
          {icon:null,label:"Mes stats",sub:"Score · Zones · Historique",color:"#84cc16",isStats:true,
            action:()=>{setShowHub(false);setTab("stats");}},
          {icon:"📖",label:"Règlements",sub:"Comment jouer",color:"#3b82f6",
            action:()=>{setShowHub(false);setTab("rules");}},
          {icon:null,label:"Inviter un ami",sub:"Code + QR de la partie",color:"#a855f7",isInvite:true,
            action:async()=>{
              const code=rosterCodes&&sessionRosterId?rosterCodes[sessionRosterId]:null;
              if(code){
                if(!sessionQR){
                  const url=BASE_URL+"?code="+code;
                  const dataUrl=await QRCode.toDataURL(url,{width:240,margin:2,color:{dark:"#ffffff",light:"#06070f"}});
                  setSessionQR(dataUrl);
                }
                setShowQR(true);
              }
            }},
          {icon:"⚡",label:t.hubQueue,sub:t.hubQueueSub,color:"#f97316",
            action:()=>{setShowHub(false);setTab("queue");}},
          {icon:"🏆",label:t.hubLeaderboard,sub:t.hubLeaderboardSub,color:"#eab308",
            action:()=>{setShowHub(false);setTab("leaderboard");}},
          ...(onBecomeStation?[{icon:"📍",label:t.hubStation,sub:t.hubStationSub,color:"#f97316",
            action:onBecomeStation}]:[]),
          {icon:null,label:t.hubDisconnect,sub:t.hubDisconnectSub,color:"#ef4444",isLogout:true,
            action:onLogout},
        ].map(({icon,label,sub,color,action,isStats,isInvite,isLogout})=>(
          <button key={label} onClick={action}
            style={{padding:"20px 12px",border:"1px solid "+color+"30",clipPath:S.clip(12),
              background:"#0d0f1a",cursor:"pointer",textAlign:"center",
              display:"flex",flexDirection:"column",alignItems:"center",gap:6}}
            onMouseEnter={e=>{e.currentTarget.style.background=color+"15";e.currentTarget.style.borderColor=color+"80";}}
            onMouseLeave={e=>{e.currentTarget.style.background="#0d0f1a";e.currentTarget.style.borderColor=color+"30";}}>
            {isStats&&(
              <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontStyle:"italic",fontSize:32,color:"#84cc16",lineHeight:1}}>
                {hubPts}
              </div>
            )}
            {isInvite&&(
              <div style={{width:36,height:36,borderRadius:"50%",background:"#a855f7",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:900,color:"#fff"}}>+</div>
            )}
            {isLogout&&(
              <div style={{width:36,height:36,borderRadius:"50%",border:"3px solid #ef4444",display:"flex",alignItems:"center",justifyContent:"center",position:"relative"}}>
                <div style={{position:"absolute",width:"70%",height:3,background:"#ef4444",borderRadius:2,transform:"rotate(45deg)"}}/>
              </div>
            )}
            {!isStats&&!isInvite&&!isLogout&&<div style={{fontSize:30}}>{icon}</div>}
            <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontStyle:"italic",fontSize:15,color:"#fff",lineHeight:1.2}}>{label}</div>
            <div style={{fontSize:10,color:"#4b5563"}}>{sub}</div>
          </button>
        ))}
      </div>
      {/* QR invite overlay */}
      {showQR&&sessionQR&&(
        <div onClick={()=>setShowQR(false)} style={{position:"fixed",inset:0,zIndex:100,background:"rgba(0,0,0,.88)",
          display:"flex",alignItems:"center",justifyContent:"center"}}>
          <div style={{background:"#06070f",borderRadius:20,padding:24,border:"2px solid #a855f7",textAlign:"center"}}
            onClick={e=>e.stopPropagation()}>
            <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:18,color:"#fff",marginBottom:4}}>Inviter un ami</div>
            <div style={{fontSize:13,color:"#4b5563",marginBottom:16}}>
              Code : <span style={{color:"#84cc16",fontWeight:700,letterSpacing:4}}>{rosterCodes&&sessionRosterId?rosterCodes[sessionRosterId]:""}</span>
            </div>
            <img src={sessionQR} alt="QR" style={{width:200,height:200,borderRadius:12,display:"block",margin:"0 auto"}}/>
            <button onClick={()=>setShowQR(false)} style={{marginTop:16,...S.btn(),padding:"8px 24px",fontSize:13}}>Fermer</button>
          </div>
        </div>
      )}
    </div>
  );

  // ── Vue "Se mettre en file" ──
  if(tab==="queue") return(
    <div style={{minHeight:"100vh",background:"#06070f",fontFamily:"'DM Sans',sans-serif"}}>
      <style>{FONTS}</style>
      <div style={{paddingTop:"calc(env(safe-area-inset-top) + 16px)",padding:"calc(env(safe-area-inset-top) + 16px) 16px 16px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <button onClick={()=>setShowHub(true)} style={{...S.backBtn}}>{t.backHome}</button>
          {onBecomeStation&&<button onClick={onBecomeStation}
            style={{padding:"6px 12px",borderRadius:10,border:"1px solid #f9731650",background:"#1a0d00",
              color:"#f97316",cursor:"pointer",fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:12}}>
            {t.stationManager}
          </button>}
        </div>
        <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:20,color:"#fff",marginBottom:12}}>{t.hubTitle}</div>
        {inQueues.length>=2&&(
          <div style={{background:"#f9731620",border:"1px solid #f9731650",borderRadius:10,padding:"8px 12px",
            marginBottom:12,display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:16}}>⚠️</span>
            <span style={{fontSize:12,color:"#f97316",fontWeight:600}}>Maximum 2 files d'attente par joueur</span>
          </div>
        )}
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {ZK.filter(zk=>!(disabledZones||[]).includes(zk)).map(zk=>{
            const z=ZONES[zk];const zl=zn(zk);
            const inQ=inQueues.includes(zk);
            const inG=activeGames[zk]&&(()=>{const g=activeGames[zk];const all=g.participants||[...(g.teamA||[]),...(g.teamB||[])];return all.includes(playerId);})();
            const played=(player.zonesPlayed||[]).includes(zk);
            const zoneQueue=(queues[zk]||[]).map(id=>players.find(p=>p.id===id)).filter(Boolean);
            const myPos=zoneQueue.findIndex(p=>p.id===playerId);
            return(
              <div key={zk} style={{borderRadius:14,background:inQ||inG?z.bg:"#0d0f1a",border:"1px solid "+(inQ||inG?z.color:z.border)}}>
                <div style={{padding:"14px 16px",display:"flex",alignItems:"center",gap:12}}>
                  <span style={{fontSize:24}}>{z.icon}</span>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:700,color:"#fff",fontSize:14}}>{zl.name}</div>
                    {inQ&&<div style={{fontSize:11,color:z.color,fontWeight:600}}>#{myPos+1} en file</div>}
                    {inG&&<div style={{fontSize:11,color:"#fbbf24",fontWeight:600}}>⚡ En jeu !</div>}
                    {played&&!inQ&&!inG&&<div style={{fontSize:10,color:"#4b5563"}}>✓ Déjà jouée</div>}
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    {zoneQueue.length>0&&<span style={{fontSize:11,color:z.color,fontWeight:700,fontFamily:"'Barlow Condensed',sans-serif"}}>{zoneQueue.length} en file</span>}
                    {inQ?<button onClick={()=>onLeave(playerId,zk)} style={{fontSize:11,padding:"4px 10px",borderRadius:8,background:"none",border:"1px solid #374151",cursor:"pointer",color:"#6b7280"}}>Quitter</button>
                      :!inG&&canJoin&&<button onClick={()=>onJoin(playerId,zk)} style={{fontSize:12,padding:"6px 14px",borderRadius:8,border:"none",cursor:"pointer",background:z.color,color:"#000",fontWeight:700}}>+ File</button>}
                  </div>
                </div>
                {zoneQueue.length>0&&(
                  <>
                    <div style={{borderTop:"1px solid "+z.color+"20",padding:"6px 16px"}}>
                      <button onClick={()=>setExpandedQueues(prev=>({...prev,[zk]:!prev[zk]}))}
                        style={{background:"none",border:"none",cursor:"pointer",color:z.color,
                          fontSize:11,fontWeight:600,padding:0,display:"flex",alignItems:"center",gap:4}}>
                        {expandedQueues[zk]?t.hideQueue:t.showQueue} ({zoneQueue.length})
                      </button>
                    </div>
                    {expandedQueues[zk]&&(
                      <div style={{padding:"6px 16px 10px",display:"flex",flexWrap:"wrap",gap:4}}>
                        {zoneQueue.map((p,i)=>(
                          <span key={p.id} style={{fontSize:11,padding:"2px 8px",borderRadius:10,fontWeight:p.id===playerId?700:400,
                            background:p.id===playerId?z.color+"30":"#ffffff10",
                            color:p.id===playerId?z.color:"#9ca3af"}}>
                            {i+1}. {p.name.split(" ")[0]}
                          </span>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  return(<>
    <div style={{minHeight:"100vh",background:"#06070f",fontFamily:"'DM Sans',sans-serif"}}>
      <style>{FONTS}</style>
      <div style={{position:"sticky",top:0,zIndex:10,paddingTop:"calc(env(safe-area-inset-top) + 16px)",paddingBottom:"12px",paddingLeft:"16px",paddingRight:"16px",background:"#06070f",borderBottom:"1px solid #111827"}}>
        <div style={{...S.row(),justifyContent:"space-between",marginBottom:8}}>
          <div style={{...S.row(),gap:10}}>
            <Bib n={player.number} size="lg"/>
            <div>
              <div style={{fontWeight:700,color:"#fff",fontSize:15,lineHeight:1}}>{player.name}</div>
              <div style={{fontSize:11,color:"#6b7280",marginTop:2}}>{player.gender==="M"?"Homme":"Femme"}</div>
              {playingAt&&<span className="pulse-lime" style={{...S.tag("#fbbf24"),fontSize:10,marginTop:3,display:"inline-block"}}>⚡ En jeu : {zn(playingAt).sn}</span>}
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            {arenaState&&arenaStatus!=="waiting"&&<div style={{textAlign:"center"}}>
              <div className={arenaStatus==="active"?"pulse-lime":""} style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:18,
                color:arenaStatus==="active"?"#84cc16":arenaStatus==="paused"?"#f97316":"#dc2626",lineHeight:1}}>{arenaTimer}</div>
            </div>}
            <div style={{textAlign:"right"}}>
              <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:36,color:"#84cc16",lineHeight:1}}>{player.globalPoints}</div>
              <div style={{fontSize:10,color:"#6b7280"}}>#{rank}</div>
            </div>
            <button onClick={()=>setShowHub(true)} style={{padding:8,borderRadius:10,background:"#111827",color:"#6b7280",border:"none",cursor:"pointer",fontSize:16}}>⌂</button>
            {onBecomeStation&&<button onClick={onBecomeStation}
              style={{padding:"6px 10px",borderRadius:10,border:"1px solid #f9731650",background:"#1a0d00",
                color:"#f97316",cursor:"pointer",fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:12}}>
              📍
            </button>}
          </div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:6}}>
          {/* Onglets principaux */}
          <div style={{display:"flex",gap:4}}>
            {[["stats",t.myStats],["leaderboard",t.myRank],["rules",t.myRules],["profil",t.myProfile]].map(([t,l])=>(
              <button key={t} onClick={()=>setTab(t)} style={{
                flex:1,padding:"6px 4px",borderRadius:8,fontSize:12,fontWeight:600,border:"none",cursor:"pointer",
                background:tab===t?"#84cc16":"#0d0f1a",color:tab===t?"#000":"#6b7280"}}>
                {l}
              </button>
            ))}
          </div>
          {/* Onglet Gagnants — deuxième ligne quand publié */}
          {winnersPublished&&(
            <button onClick={()=>setTab("winners")} style={{
              width:"100%",padding:"7px",borderRadius:8,fontSize:12,fontWeight:700,border:"none",cursor:"pointer",
              background:tab==="winners"?"#ca8a04":"#2d1a00",
              color:tab==="winners"?"#000":"#f59e0b",
              border:"1px solid "+(tab==="winners"?"#ca8a04":"#ca8a0480")}}>
              {t.winnersTab}
            </button>
          )}
        </div>
      </div>

      <div style={{padding:16}}>
        {tab==="stats"&&(
          <div className="anim-up">

            {/* ── AVATAR + SCORE CARD ── */}
            <div style={{borderRadius:18,background:"#0d0f1a",border:"1px solid #1f2937",
              marginBottom:14,overflow:"hidden"}}>
              {/* Top row: avatar + score */}
              <div style={{display:"flex",alignItems:"stretch",gap:0}}>
                {/* Avatar */}
                <div style={{width:130,flexShrink:0,padding:"12px 6px 0 12px"}}>
                  <PlayerAvatar
                    gender={player.gender}
                    skinColor={SKIN_TONES[skinIdx]}
                    hairColor={HAIR_COLORS[hairIdx]}
                    morphology={morphology}
                  />
                </div>
                {/* Score + Rank */}
                <div style={{flex:1,display:"flex",flexDirection:"column",
                  justifyContent:"center",padding:"16px 16px 16px 8px"}}>
                  <div style={{fontSize:10,color:"#4b5563",letterSpacing:3,
                    textTransform:"uppercase",fontWeight:700,marginBottom:2}}>Score</div>
                  <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontStyle:"italic",
                    fontSize:62,color:"#84cc16",lineHeight:1,letterSpacing:-2,textShadow:"0 0 32px #84cc1640"}}>
                    {hubPts}
                  </div>
                  <div style={{fontSize:10,color:"#4b5563",letterSpacing:3,
                    textTransform:"uppercase",fontWeight:700,marginTop:10,marginBottom:2}}>Rang</div>
                  <div style={{display:"flex",alignItems:"baseline",gap:4}}>
                    <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontStyle:"italic",
                      fontSize:38,color:"#fff",lineHeight:1}}>#{rank}</div>
                    <div style={{fontSize:10,color:"#4b5563"}}>/ {players.length}</div>
                  </div>
                </div>
              </div>
              {/* Sliders */}
              <div style={{padding:"10px 14px 14px 14px",borderTop:"1px solid #1a1f2e",
                display:"flex",flexDirection:"column",gap:10}}>
                {/* Skin */}
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <div style={{fontSize:10,color:"#4b5563",letterSpacing:2,
                    textTransform:"uppercase",fontWeight:700,width:58,flexShrink:0}}>Peau</div>
                  <div style={{flex:1,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    {SKIN_TONES.map((c,i)=>(
                      <button key={i} onClick={()=>setSkinIdx(i)} style={{
                        width:skinIdx===i?30:22,height:skinIdx===i?30:22,
                        borderRadius:"50%",background:c,border:"none",cursor:"pointer",
                        border:skinIdx===i?"3px solid #84cc16":"2px solid #374151",
                        transition:"all .2s",outline:"none"
                      }}/>
                    ))}
                  </div>
                </div>
                {/* Hair */}
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <div style={{fontSize:10,color:"#4b5563",letterSpacing:2,
                    textTransform:"uppercase",fontWeight:700,width:58,flexShrink:0}}>Cheveux</div>
                  <div style={{flex:1,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    {HAIR_COLORS.map((c,i)=>(
                      <button key={i} onClick={()=>setHairIdx(i)} style={{
                        width:hairIdx===i?28:20,height:hairIdx===i?28:20,
                        borderRadius:"50%",background:c,border:"none",cursor:"pointer",
                        border:hairIdx===i?"3px solid #84cc16":"2px solid #374151",
                        transition:"all .2s",outline:"none"
                      }}/>
                    ))}
                  </div>
                </div>
                {/* Morphology */}
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <div style={{fontSize:10,color:"#4b5563",letterSpacing:2,
                    textTransform:"uppercase",fontWeight:700,width:58,flexShrink:0}}>Corps</div>
                  <div style={{flex:1,display:"flex",gap:6}}>
                    {MORPHO_LABELS.map((label,i)=>(
                      <button key={i} onClick={()=>setMorphology(i)} style={{
                        flex:1,padding:"5px 2px",borderRadius:8,cursor:"pointer",
                        background:morphology===i?"#84cc16":"#1a1f2e",
                        color:morphology===i?"#06070f":"#6b7280",
                        fontSize:10,fontWeight:700,border:"none",
                        fontFamily:"'Barlow Condensed',sans-serif",letterSpacing:0.5
                      }}>{label}</button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* LAST ACTIVITY */}
            {player.lastResult&&ZONES[player.lastResult.zone]&&(
              <div className="anim-pop" style={{borderRadius:14,padding:12,marginBottom:14,
                display:"flex",alignItems:"center",gap:12,
                background:player.lastResult.isWin?"#0d1508":"#1a0606",
                border:"1px solid "+(player.lastResult.isWin?"#84cc1630":"#dc262630")}}>
                <div style={{fontSize:22}}>{player.lastResult.isWin?"🎉":"😤"}</div>
                <div style={{flex:1}}>
                  <div style={{fontSize:10,color:"#4b5563",textTransform:"uppercase",letterSpacing:2,fontWeight:600,marginBottom:2}}>{t.lastActivity}</div>
                  <div style={{fontWeight:700,color:"#fff",fontSize:13}}>
                    {ZONES[player.lastResult.zone].icon} {zn(player.lastResult.zone).name}
                    {player.lastResult.bonus?" 🔥":""}
                  </div>
                  <div style={{fontSize:12,marginTop:1,color:player.lastResult.isWin?"#84cc16":"#dc2626",fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700}}>
                    {player.lastResult.isWin?t.victory:t.defeat}{" "}
                    <span style={{fontSize:18}}>{player.lastResult.delta>0?"+"+player.lastResult.delta:player.lastResult.delta} pts</span>
                    {player.lastResult.newStreak>=2&&<span style={{fontSize:11,color:"#f97316",marginLeft:6}}>Serie {player.lastResult.newStreak} 🔥</span>}
                  </div>
                </div>
              </div>
            )}

            {/* STATS GLOBALES */}
            <div style={{...S.card(),marginBottom:14}}>
              <div style={{...S.label(),marginBottom:10}}>Statistiques</div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:12}}>
                {[
                  [player.globalPoints,"Pts globaux","#84cc16"],
                  [(player.zonesPlayed||[]).length+"/"+activeZones.length,"Zones","#84cc16"],
                  [(player.history||[]).filter(h=>h.isWin).length,"Victoires","#22c55e"],
                  [(player.history||[]).filter(h=>!h.isWin&&!h.isSecond).length,"Défaites","#ef4444"]
                ].map(([v,lbl,c],i)=>(
                  <div key={i} style={{flex:1,textAlign:"center",padding:"8px 4px",borderRadius:10,background:"#111827",minWidth:60}}>
                    <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:24,color:c}}>{v}</div>
                    <div style={{fontSize:10,color:"#4b5563",marginTop:2,lineHeight:1.2}}>{lbl}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* FILES INDICATOR */}
            <div style={{...S.card(),...S.row(),justifyContent:"space-between",marginBottom:14}}>
              <div style={{fontSize:12,color:"#6b7280"}}>Files d'attente actives</div>
              <div style={{...S.row(),gap:6}}>
                <div style={{display:"flex",gap:3}}>
                  {[0,1].map(i=><div key={i} style={{width:14,height:14,borderRadius:3,background:i<inQueues.length?"#84cc16":"#1f2937"}}/>)}
                </div>
                <div style={{fontSize:13,fontWeight:700,color:inQueues.length>=2?"#f97316":"#84cc16"}}>{inQueues.length}/2</div>
              </div>
            </div>

            {/* ZONE CHECKLIST - explicit done/todo */}
            <div style={{...S.label(),marginBottom:10}}>Stations — rejoignez la file pour accumuler des points</div>
            <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:16}}>
              {ZK.map(zk=>{
                const zc=ZONES[zk];
                const played=(player.zonesPlayed||[]).includes(zk);
                const score=(player.zoneScores||{})[zk]||50;
                const streak=(player.zoneStreaks||{})[zk]||0;
                const inQ=inQueues.includes(zk);
                const inG=activeGames[zk]&&(()=>{const g=activeGames[zk];const all=g.participants||[...(g.teamA||[]),...(g.teamB||[])];return all.includes(playerId);})();
                const isZoneDisabled=(disabledZones||[]).includes(zk);
                // Count wins/losses in history for this zone
                const zoneHistory=(player.history||[]).filter(h=>h.zone===zk);
                const wins=zoneHistory.filter(h=>h.isWin).length;
                const losses=zoneHistory.filter(h=>!h.isWin).length;
                return(
                  <div key={zk} style={{borderRadius:14,padding:12,background:"#0d0f1a",
                    border:"2px solid "+(isZoneDisabled?"#1f2937":played?zc.color:inG?"#fbbf2460":"#1f2937"),
                    opacity:isZoneDisabled?0.6:1,pointerEvents:isZoneDisabled?"none":"auto",
                    position:"relative"}}>
                    {isZoneDisabled&&<div style={{position:"absolute",top:8,right:8,
                      padding:"2px 8px",borderRadius:6,background:"#ef444420",
                      color:"#ef4444",border:"1px solid #ef444440",fontSize:10,fontWeight:700}}>DÉSACTIVÉE</div>}
                    <div style={{...S.row(),marginBottom:played||inG?8:0}}>
                      {/* Done/todo indicator */}
                      <div style={{width:26,height:26,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",
                        flexShrink:0,fontSize:14,fontWeight:900,
                        background:played?zc.color:inG?"#fbbf2430":"#111827",
                        color:played?"#000":inG?"#fbbf24":"#374151",
                        border:played?"none":inG?"1px solid #fbbf2460":"1px solid #374151"}}>
                        {played?"✓":inG?"⚡":"○"}
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{...S.row(),justifyContent:"space-between"}}>
                          <div style={{...S.row(),gap:6}}>
                            <span style={{fontSize:16}}>{zc.icon}</span>
                            <span style={{fontSize:14,fontWeight:700,color:played?"#fff":"#6b7280"}}>{zn(zk).name}</span>
                            {inG&&<span className="pulse-lime" style={{fontSize:11,color:"#fbbf24"}}>en cours</span>}
                            {inQ&&!inG&&<span style={{fontSize:11,color:zc.color}}>en file</span>}
                          </div>
                          {/* Score badge */}
                          <div style={{...S.row(),gap:6,flexShrink:0}}>
                            {zk==="speed"&&played&&<TierBadge score={score}/>}
                            {streak>=2&&<span style={{fontSize:11,color:"#f97316"}}>🔥x{streak}</span>}
                            {played&&<span style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:15,color:zc.color}}>{score}</span>}
                          </div>
                        </div>
                        {/* Progress bar - only if played */}
                        {played&&(
                          <div style={{marginTop:5,height:4,borderRadius:4,background:"#1f2937"}}>
                            <div style={{height:"100%",borderRadius:4,background:zc.color,width:score+"%",transition:"width .7s"}}/>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Stats row if played */}
                    {played&&zoneHistory.length>0&&(
                      <div style={{...S.row(),justifyContent:"space-between",marginTop:6,paddingTop:6,borderTop:"1px solid #1f2937"}}>
                        <div style={{...S.row(),gap:12}}>
                          <span style={{fontSize:12,color:"#22c55e"}}>V: {wins}</span>
                          <span style={{fontSize:12,color:"#ef4444"}}>D: {losses}</span>
                          <span style={{fontSize:12,color:"#6b7280"}}>{zoneHistory.length} partie{zoneHistory.length>1?"s":""}</span>
                        </div>
                        <div style={{fontSize:12,fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,
                          color:zoneHistory.reduce((s,h)=>s+h.delta,0)>=0?"#84cc16":"#ef4444"}}>
                          Total: {zoneHistory.reduce((s,h)=>s+h.delta,0)>0?"+":""}{zoneHistory.reduce((s,h)=>s+h.delta,0)} pts
                        </div>
                      </div>
                    )}

                    {/* Action button — toujours visible sauf si en partie */}
                    {!inG&&(
                      inQ
                        ?<div style={{...S.row(),justifyContent:"space-between",marginTop:8}}>
                          <div style={{fontSize:12,fontWeight:600,color:zc.color}}>En file d'attente...</div>
                          <button onClick={()=>onLeave(playerId,zk)} style={{fontSize:11,background:"none",border:"none",cursor:"pointer",color:"#6b7280"}}>Quitter</button>
                        </div>
                        :canJoin
                          ?<button onClick={()=>onJoin(playerId,zk)} style={{marginTop:8,width:"100%",padding:"6px 12px",borderRadius:8,
                            border:"1px solid "+zc.color+"35",background:zc.color+"15",color:zc.color,cursor:"pointer",fontSize:12,fontWeight:700}}>
                            {played?"Rejouer — "+t.joinQueue:t.joinQueue}
                          </button>
                          :<div style={{fontSize:11,color:"#4b5563",marginTop:6}}>{playingAt?t.inGameElsewhere:t.max2queues}</div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* ELIGIBILITY BANNER */}
            <div style={{padding:12,borderRadius:12,marginBottom:16,textAlign:"center",fontSize:12,
              background:elig?"#0d1508":"#0d0f1a",border:"1px solid "+(elig?"#84cc1630":"#374151")}}>
              {elig
                ?<span style={{color:"#84cc16",fontWeight:700}}>{t.allZonesDone}</span>
                :<div>
                  <div style={{color:"#6b7280",marginBottom:6}}>Zones manquantes pour etre eligible:</div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:5,justifyContent:"center"}}>
                    {ZK.filter(zk=>!(player.zonesPlayed||[]).includes(zk)&&!(disabledZones||[]).includes(zk)).map(zk=>(
                      <div key={zk} style={{...S.tag(ZONES[zk].color),padding:"3px 8px",fontSize:12}}>
                        {ZONES[zk].icon} {zn(zk).sn}
                      </div>
                    ))}
                  </div>
                </div>}
            </div>

            {/* CODE DE SESSION */}
            {(()=>{
              const code=rosterCodes&&sessionRosterId?rosterCodes[sessionRosterId]:null;
              if(!code) return null;
              return(
                <div style={{...S.card(),marginBottom:14,textAlign:"center"}}>
                  <div style={{...S.label(),marginBottom:8}}>Code de la partie</div>
                  <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:48,
                    color:"#84cc16",letterSpacing:12,lineHeight:1,marginBottom:12}}>{code}</div>
                  <button onClick={async()=>{
                    if(!sessionQR){
                      const url=BASE_URL+"?code="+code;
                      const dataUrl=await QRCode.toDataURL(url,{width:240,margin:2,color:{dark:"#ffffff",light:"#06070f"}});
                      setSessionQR(dataUrl);
                    }
                    setShowQR(true);
                  }} style={{...S.btn("#84cc16"),padding:"10px 24px",fontSize:14,fontWeight:700}}>
                    📲 Voir le QR code
                  </button>
                  {showQR&&sessionQR&&(
                    <div onClick={()=>setShowQR(false)} style={{
                      position:"fixed",inset:0,zIndex:100,background:"rgba(0,0,0,.85)",
                      display:"flex",alignItems:"center",justifyContent:"center"}}>
                      <div style={{background:"#06070f",borderRadius:20,padding:24,border:"2px solid #84cc16",textAlign:"center"}}
                        onClick={e=>e.stopPropagation()}>
                        <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:20,color:"#fff",marginBottom:4}}>
                          Scannez pour rejoindre
                        </div>
                        <div style={{fontSize:13,color:"#4b5563",marginBottom:16}}>Code : <span style={{color:"#84cc16",fontWeight:700,letterSpacing:4}}>{code}</span></div>
                        <img src={sessionQR} alt="QR" style={{width:220,height:220,borderRadius:12,display:"block",margin:"0 auto"}}/>
                        <button onClick={()=>setShowQR(false)}
                          style={{marginTop:16,...S.btn(),padding:"8px 24px",fontSize:13}}>Fermer</button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

          </div>
        )}
        {tab==="leaderboard"&&(
          <div className="anim-up">
            <div style={{...S.label(),marginBottom:10}}>{t.tabLeader} - {sorted.filter(p=>(p.zonesPlayed||[]).length===6).length} {t.eligibles}</div>
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
                        <span style={{color:"#84cc16",fontSize:12,fontWeight:700}}>#{sorted.indexOf(p)+1}</span>
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
              style={{marginTop:8,fontSize:11,color:"#4b5563",background:"none",border:"none",cursor:"pointer"}}>
              Effacer la surbrillance
            </button>}
          </div>
        )}
        {tab==="rules"&&(
          <PlayerRulesView/>
        )}

        {tab==="winners"&&winnersPublished&&(()=>{
          const today=new Date().toLocaleDateString("fr-CA",{year:"numeric",month:"long",day:"numeric"});
          const ranked=[...players].sort((a,b)=>b.globalPoints-a.globalPoints);
          const top5=ranked.slice(0,5);
          const overall=ranked[0]||null;
          const activeZK=ZK.filter(zk=>!(disabledZones||[]).includes(zk));
          const zoneChamps={};
          activeZK.forEach(zk=>{
            const played=players.filter(p=>(p.zonesPlayed||[]).includes(zk));
            if(played.length>0) zoneChamps[zk]=[...played].sort((a,b)=>((b.zoneScores||{})[zk]||50)-((a.zoneScores||{})[zk]||50))[0];
          });
          const zoneIcons={purinstinct:"🏟️",speed:"⚡",handAgility:"✋",footAgility:"👟",generalAgility:"🏃",iq:"🧠"};
          const zoneNames=Object.fromEntries(ZK.map(zk=>[zk,zn(zk).name]));
          const medals=["🥇","🥈","🥉","4️⃣","5️⃣"];

          // Vérifier si le joueur figure dans les résultats
          const isWinner=overall&&overall.id===playerId;
          const isTop5=top5.some(p=>p.id===playerId);
          const isZoneChamp=activeZK.some(zk=>zoneChamps[zk]&&zoneChamps[zk].id===playerId);
          const isFeatured=isWinner||isTop5||isZoneChamp;

          // Déclencher confetti + félicitations une seule fois
          if(isFeatured&&!confettiFiredRef.current){
            confettiFiredRef.current=true;
            setShowCongrats(true);
            const fire=(opts)=>confetti({particleCount:80,spread:70,origin:{y:0.6},...opts});
            setTimeout(()=>fire({colors:["#84cc16","#ca8a04","#fff","#6366f1"]}),100);
            setTimeout(()=>fire({angle:60,origin:{x:0,y:0.7}}),350);
            setTimeout(()=>fire({angle:120,origin:{x:1,y:0.7}}),550);
            setTimeout(()=>setShowCongrats(false),3200);
          }

          // Overlay félicitations
          if(showCongrats) return(
            <div className="anim-pop" style={{position:"fixed",inset:0,zIndex:70,
              display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
              background:"rgba(0,0,0,.85)",gap:16,pointerEvents:"none"}}>
              <div style={{fontSize:72,lineHeight:1}}>🎉</div>
              <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:42,
                color:"#84cc16",textAlign:"center",letterSpacing:2}}>FÉLICITATIONS !</div>
              <div style={{color:"#fff",fontWeight:700,fontSize:22,textAlign:"center"}}>{player.name}</div>
              <div style={{color:"#ca8a04",fontSize:14,fontWeight:600,textAlign:"center",lineHeight:2,padding:"0 20px"}}>
                {(()=>{
                  const f=player.gender==="F";
                  const parts=[];
                  if(isWinner) parts.push("🥇 Grand"+(f?"e":"")+" gagnant"+(f?"e":"")+" !");
                  if(!isWinner&&isTop5) parts.push("🏆 Dans le Top 5 !");
                  const champZones=activeZK.filter(zk=>zoneChamps[zk]&&zoneChamps[zk].id===playerId);
                  if(champZones.length>0) parts.push("⚡ Champion"+(f?"ne":"")+" — "+champZones.map(zk=>zoneNames[zk]).join(", ")+" !");
                  return parts.map((p,i)=><div key={i}>{p}</div>);
                })()}
              </div>
            </div>
          );

          // Plein écran
          if(playerWinnerCard){
            const {type,zk}=playerWinnerCard;
            const FullCard=({accent,children})=>(
              <div style={{position:"fixed",inset:0,zIndex:60,background:"rgba(0,0,0,.95)",
                display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:20}}>
                <div ref={playerCardRef} onClick={savePlayerCard} style={{width:"100%",maxWidth:380,borderRadius:24,
                  background:"#0a0c14",border:"2px solid "+(accent||"#84cc16"),padding:28,
                  position:"relative",overflow:"hidden",cursor:"pointer",
                  boxShadow:"0 0 60px "+(accent||"#84cc16")+"40"}}>
                  <div style={{position:"absolute",top:0,left:0,right:0,height:4,
                    background:`linear-gradient(90deg,${accent||"#84cc16"},${accent||"#84cc16"}88)`}}/>
                  <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:10,
                    color:(accent||"#84cc16")+"80",letterSpacing:3,marginBottom:16,textAlign:"center",marginTop:8}}>
                    PURINSTINCT GAMES · {today}
                  </div>
                  {children}
                  <div data-html2canvas-ignore="true" style={{textAlign:"center",marginTop:12,fontSize:10,color:"#374151"}}>
                    Appuyez pour enregistrer
                  </div>
                </div>
                <div style={{marginTop:16}}>
                  <button onClick={()=>setPlayerWinnerCard(null)}
                    style={{padding:"10px 24px",borderRadius:10,background:"#111827",color:"#9ca3af",
                      border:"1px solid #374151",cursor:"pointer",fontWeight:700,fontSize:13}}>
                    ← Retour
                  </button>
                </div>
              </div>
            );

            if(type==="overall"&&overall){
              const streaks=activeZK.filter(zk=>((overall.zoneStreaks||{})[zk]||0)>=2);
              return(<FullCard accent="#ca8a04">
                <div style={{textAlign:"center",marginBottom:16}}>
                  <div style={{fontSize:52,lineHeight:1,marginBottom:8}}>🥇</div>
                  <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:12,color:"#ca8a04",letterSpacing:3,marginBottom:6}}>GAGNANT</div>
                  <div style={{color:"#fff",fontWeight:700,fontSize:26,marginBottom:4}}>{overall.name}</div>
                  <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:48,color:"#84cc16",lineHeight:1}}>{overall.globalPoints}</div>
                  <div style={{fontSize:12,color:"#4b5563",marginTop:2}}>points globaux</div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6,marginBottom:12}}>
                  {activeZK.map(zk=>{
                    const played=(overall.zonesPlayed||[]).includes(zk);
                    return(<div key={zk} style={{borderRadius:10,padding:"8px 6px",textAlign:"center",
                      background:played?"#1a2e05":"#111827",border:"1px solid "+(played?"#84cc1650":"#1f2937")}}>
                      <div style={{fontSize:18}}>{zoneIcons[zk]}</div>
                      <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:16,color:played?"#84cc16":"#374151"}}>{(overall.zoneScores||{})[zk]||50}</div>
                      <div style={{fontSize:9,color:played?"#6b7280":"#1f2937",marginTop:1}}>{zoneNames[zk].split(" ")[0]}</div>
                    </div>);
                  })}
                </div>
                {streaks.length>0&&<div style={{display:"flex",flexWrap:"wrap",gap:6,justifyContent:"center"}}>
                  {streaks.map(zk=>(<span key={zk} style={{padding:"3px 8px",borderRadius:6,background:"#f9731620",color:"#f97316",fontSize:11,fontWeight:700}}>🔥 {zoneNames[zk]} ×{(overall.zoneStreaks||{})[zk]}</span>))}
                </div>}
              </FullCard>);
            }
            if(type==="top5"&&top5.length>0){
              return(<FullCard accent="#6366f1">
                <div style={{textAlign:"center",marginBottom:20}}>
                  <div style={{fontSize:42,lineHeight:1,marginBottom:6}}>🏆</div>
                  <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:12,color:"#6366f1",letterSpacing:3}}>CLASSEMENT FINAL</div>
                </div>
                {top5.map((p,i)=>(
                  <div key={p.id} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 12px",borderRadius:12,marginBottom:6,
                    background:i===0?"#1a1a2e":i===1?"#12121e":i===2?"#111118":"#0d0f1a",
                    border:"1px solid "+(p.id===playerId?"#84cc1650":i===0?"#6366f140":"#1f2937")}}>
                    <span style={{fontSize:20,width:28,textAlign:"center"}}>{medals[i]}</span>
                    <span style={{color:p.id===playerId?"#84cc16":"#fff",fontWeight:700,fontSize:15,flex:1}}>{p.name}{p.id===playerId?" 👈":""}</span>
                    <div style={{textAlign:"right"}}>
                      <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:22,
                        color:i===0?"#ca8a04":i===1?"#9ca3af":i===2?"#b45309":"#6b7280"}}>{p.globalPoints}</div>
                    </div>
                  </div>
                ))}
              </FullCard>);
            }
            if(type==="zone"&&zk&&zoneChamps[zk]){
              const champ=zoneChamps[zk]; const z=ZONES[zk];
              const hasStreak=((champ.zoneStreaks||{})[zk]||0)>=2;
              return(<FullCard accent={z.color}>
                <div style={{textAlign:"center",marginBottom:20}}>
                  <div style={{fontSize:56,lineHeight:1,marginBottom:10}}>{zoneIcons[zk]}</div>
                  <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:11,color:z.color,letterSpacing:3,marginBottom:4}}>CHAMPION</div>
                  <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:18,color:z.color,marginBottom:16}}>{zoneNames[zk].toUpperCase()}</div>
                  <div style={{color:champ.id===playerId?"#84cc16":"#fff",fontWeight:700,fontSize:28,marginBottom:8}}>{champ.name}{champ.id===playerId?" 👈":""}</div>
                  <div style={{display:"inline-block",padding:"12px 24px",borderRadius:16,background:z.color+"20",border:"2px solid "+z.color+"60"}}>
                    <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:52,color:z.color,lineHeight:1}}>{cham(p.zoneScores||{})[zk]||50}</div>
                    <div style={{fontSize:11,color:z.color+"80",marginTop:2}}>score de zone</div>
                  </div>
                  {hasStreak&&<div style={{marginTop:14,padding:"6px 16px",borderRadius:20,background:"#f9731620",display:"inline-block"}}>
                    <span style={{color:"#f97316",fontWeight:700,fontSize:14}}>🔥 Série ×{(champ.zoneStreaks||{})[zk]}</span>
                  </div>}
                </div>
              </FullCard>);
            }
            return null;
          }

          // Liste cliquable
          const ClickCard=({accent,onClick,children})=>(
            <div onClick={onClick} style={{borderRadius:16,background:"#0d0f1a",border:"2px solid "+(accent||"#84cc16"),
              padding:20,marginBottom:12,position:"relative",overflow:"hidden",cursor:"pointer"}}
              onMouseEnter={e=>{e.currentTarget.style.background="#111827";}}
              onMouseLeave={e=>{e.currentTarget.style.background="#0d0f1a";}}>
              <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:accent||"#84cc16"}}/>
              <div style={{position:"absolute",top:12,right:14,fontSize:16,color:(accent||"#84cc16")+"60"}}>↗</div>
              {children}
            </div>
          );

          return(
            <div className="anim-up">
              <div style={{...S.label(),marginBottom:4}}>🏆 Résultats finals</div>
              <div style={{fontSize:11,color:"#4b5563",marginBottom:16}}>Appuyez sur une carte pour l'agrandir et enregistrer</div>

              {overall&&(
                <ClickCard accent="#ca8a04" onClick={()=>setPlayerWinnerCard({type:"overall"})}>
                  <div style={{...S.row(),gap:10}}>
                    <span style={{fontSize:32}}>🥇</span>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:10,color:"#ca8a04",fontWeight:700,letterSpacing:2,marginBottom:2}}>GAGNANT</div>
                      <div style={{color:"#fff",fontWeight:700,fontSize:18,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{overall.name}{overall.id===playerId?" 👈":""}</div>
                      <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:24,color:"#84cc16"}}>{overall.globalPoints} pts</div>
                    </div>
                  </div>
                </ClickCard>
              )}

              {top5.length>0&&(
                <ClickCard accent="#6366f1" onClick={()=>setPlayerWinnerCard({type:"top5"})}>
                  <div style={{...S.row(),gap:10,marginBottom:10}}>
                    <span style={{fontSize:28}}>🏆</span>
                    <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:11,color:"#6366f1",letterSpacing:2}}>TOP {top5.length}</div>
                  </div>
                  {top5.slice(0,3).map((p,i)=>(
                    <div key={p.id} style={{...S.row(),gap:8,padding:"3px 0"}}>
                      <span style={{fontSize:14,width:20}}>{medals[i]}</span>
                      <span style={{color:p.id===playerId?"#84cc16":"#e5e7eb",fontSize:13,flex:1}}>{p.name}{p.id===playerId?" 👈":""}</span>
                      <span style={{color:"#84cc16",fontWeight:700,fontSize:13}}>{p.globalPoints}</span>
                    </div>
                  ))}
                </ClickCard>
              )}

              {activeZK.filter(zk=>zoneChamps[zk]).map(zk=>{
                const champ=zoneChamps[zk]; const z=ZONES[zk];
                return(
                  <ClickCard key={zk} accent={z.color} onClick={()=>setPlayerWinnerCard({type:"zone",zk})}>
                    <div style={{...S.row(),gap:10}}>
                      <span style={{fontSize:28,flexShrink:0}}>{zoneIcons[zk]}</span>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:10,color:z.color,fontWeight:700,letterSpacing:2,marginBottom:2}}>CHAMPION {zoneNames[zk].toUpperCase()}</div>
                        <div style={{color:champ.id===playerId?"#84cc16":"#fff",fontWeight:700,fontSize:15,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                          {champ.name}{champ.id===playerId?" 👈":""}
                        </div>
                        <div style={{...S.row(),gap:6,marginTop:2}}>
                          <span style={{color:z.color,fontWeight:700,fontSize:13}}>{cham(p.zoneScores||{})[zk]||50} pts</span>
                          {((champ.zoneStreaks||{})[zk]||0)>=2&&<span style={{color:"#f97316",fontSize:11}}>🔥×{(champ.zoneStreaks||{})[zk]}</span>}
                        </div>
                      </div>
                    </div>
                  </ClickCard>
                );
              })}
            </div>
          );
        })()}
      </div>
    </div>
    <LangFooter/>
  </>);
}

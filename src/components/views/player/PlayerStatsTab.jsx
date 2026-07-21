import { useState } from "react";
import QRCode from "qrcode";
import { ZONES, ZK } from "../../../config/zones.js";
import { useZn, useT } from "../../../hooks/useLang.js";
import { BASE_URL } from "../../../config/constants.js";
import { SKIN_TONES, HAIR_COLORS, MORPHO_LABELS } from "../../../config/avatarOptions.js";
import { PlayerAvatar } from "../../shared/PlayerAvatar.jsx";
import { TierBadge } from "../../shared/TierBadge.jsx";
import { Panel, Eyebrow } from "../../ui/Panel.jsx";
import { Button } from "../../ui/Button.jsx";
import { Modal } from "../../ui/Modal.jsx";
import { ScoreDisplay } from "../../ui/Numerals.jsx";

export function PlayerStatsTab({player,playerId,players,hubPts,rank,activeZones,elig,disabledZones,activeGames,inQueues,playingAt,canJoin,onJoin,onLeave,rosterCodes,sessionRosterId,skinIdx,hairIdx,morphology,onSetSkinIdx,onSetHairIdx,onSetMorphology}){
  const t=useT();
  const zn=useZn();
  const [sessionQR,setSessionQR]=useState(null);
  const [showQR,setShowQR]=useState(false);
  const code=rosterCodes&&sessionRosterId?rosterCodes[sessionRosterId]:null;

  const openQR=async()=>{
    if(!sessionQR&&code){
      const url=BASE_URL+"?code="+code;
      const dataUrl=await QRCode.toDataURL(url,{width:240,margin:2,color:{dark:"#ffffff",light:"#0A0A0A"}});
      setSessionQR(dataUrl);
    }
    setShowQR(true);
  };

  return(
    <div className="pi-anim-up">

      {/* ── AVATAR + SCORE CARD ── */}
      <Panel flush style={{marginBottom:"var(--pi-s4)"}}>
        <div style={{display:"flex",alignItems:"stretch"}}>
          <div style={{width:130,flexShrink:0,padding:"var(--pi-s3) var(--pi-s1) 0 var(--pi-s3)"}}>
            <PlayerAvatar gender={player.gender} skinColor={SKIN_TONES[skinIdx]} hairColor={HAIR_COLORS[hairIdx]} morphology={morphology}/>
          </div>
          <div style={{flex:1,display:"flex",flexDirection:"column",justifyContent:"center",padding:"var(--pi-s4) var(--pi-s4) var(--pi-s4) var(--pi-s2)"}}>
            <Eyebrow>Score</Eyebrow>
            <ScoreDisplay value={hubPts} size={54} style={{letterSpacing:-2,textShadow:"0 0 32px var(--pi-lime-glow)"}}/>
            <Eyebrow style={{marginTop:"var(--pi-s3)"}}>Rang</Eyebrow>
            <div style={{display:"flex",alignItems:"baseline",gap:4}}>
              <div style={{fontFamily:"var(--pi-font-display)",fontWeight:900,fontStyle:"italic",fontSize:32,color:"var(--pi-text)",lineHeight:1}}>#{rank}</div>
              <div style={{fontSize:"var(--pi-fs-meta)",color:"var(--pi-text-3)"}}>/ {players.length}</div>
            </div>
          </div>
        </div>
        {/* Sliders */}
        <div style={{padding:"var(--pi-s3) var(--pi-s3) var(--pi-s3)",borderTop:"1px solid var(--pi-line)",display:"flex",flexDirection:"column",gap:"var(--pi-s3)"}}>
          <div style={{display:"flex",alignItems:"center",gap:"var(--pi-s3)"}}>
            <Eyebrow style={{width:58,flexShrink:0}}>Peau</Eyebrow>
            <div style={{flex:1,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              {SKIN_TONES.map((c,i)=>(
                <button key={i} onClick={()=>onSetSkinIdx(i)} aria-label={"Teint "+(i+1)} style={{
                  width:skinIdx===i?30:22,height:skinIdx===i?30:22,borderRadius:"50%",background:c,cursor:"pointer",
                  border:skinIdx===i?"3px solid var(--pi-lime)":"2px solid var(--pi-line-strong)",
                  transition:"all var(--pi-dur-fast)",outline:"none"}}/>
              ))}
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:"var(--pi-s3)"}}>
            <Eyebrow style={{width:58,flexShrink:0}}>Cheveux</Eyebrow>
            <div style={{flex:1,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              {HAIR_COLORS.map((c,i)=>(
                <button key={i} onClick={()=>onSetHairIdx(i)} aria-label={"Couleur de cheveux "+(i+1)} style={{
                  width:hairIdx===i?28:20,height:hairIdx===i?28:20,borderRadius:"50%",background:c,cursor:"pointer",
                  border:hairIdx===i?"3px solid var(--pi-lime)":"2px solid var(--pi-line-strong)",
                  transition:"all var(--pi-dur-fast)",outline:"none"}}/>
              ))}
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:"var(--pi-s3)"}}>
            <Eyebrow style={{width:58,flexShrink:0}}>Corps</Eyebrow>
            <div style={{flex:1,display:"flex",gap:"var(--pi-s2)"}}>
              {MORPHO_LABELS.map((label,i)=>(
                <button key={i} onClick={()=>onSetMorphology(i)} className={morphology===i?"pi-tab is-active":"pi-tab"} style={{flex:1}}>{label}</button>
              ))}
            </div>
          </div>
        </div>
      </Panel>

      {/* LAST ACTIVITY */}
      {player.lastResult&&ZONES[player.lastResult.zone]&&(
        <Panel className="pi-anim-pop" style={{marginBottom:"var(--pi-s4)",display:"flex",alignItems:"center",gap:"var(--pi-s3)",
          background:player.lastResult.isWin?"var(--pi-lime-wash)":"var(--pi-danger-wash)",
          borderColor:player.lastResult.isWin?"var(--pi-lime-line)":"var(--pi-danger)"}}>
          <div style={{fontSize:22}}>{player.lastResult.isWin?"🎉":"😤"}</div>
          <div style={{flex:1}}>
            <Eyebrow style={{marginBottom:2}}>{t.lastActivity}</Eyebrow>
            <div style={{fontWeight:700,color:"var(--pi-text)",fontSize:"var(--pi-fs-body)"}}>
              {ZONES[player.lastResult.zone].icon} {zn(player.lastResult.zone).name}
              {player.lastResult.bonus?" 🔥":""}
            </div>
            <div style={{fontSize:"var(--pi-fs-body)",marginTop:1,color:player.lastResult.isWin?"var(--pi-lime)":"var(--pi-danger)",fontFamily:"var(--pi-font-display)",fontWeight:700}}>
              {player.lastResult.isWin?t.victory:t.defeat}{" "}
              <span style={{fontSize:18}}>{player.lastResult.delta>0?"+"+player.lastResult.delta:player.lastResult.delta} pts</span>
              {player.lastResult.newStreak>=2&&<span style={{fontSize:"var(--pi-fs-label)",color:"var(--pi-warn)",marginLeft:6}}>Serie {player.lastResult.newStreak} 🔥</span>}
            </div>
          </div>
        </Panel>
      )}

      {/* STATS GLOBALES */}
      <Panel style={{marginBottom:"var(--pi-s4)"}}>
        <Eyebrow style={{marginBottom:"var(--pi-s3)"}}>Statistiques</Eyebrow>
        <div style={{display:"flex",gap:"var(--pi-s2)",flexWrap:"wrap"}}>
          {[
            [player.globalPoints,"Pts globaux","var(--pi-lime)"],
            [(player.zonesPlayed||[]).length+"/"+activeZones.length,"Zones","var(--pi-lime)"],
            [(player.history||[]).filter(h=>h.isWin).length,"Victoires","var(--pi-ok)"],
            [(player.history||[]).filter(h=>!h.isWin&&!h.isSecond).length,"Défaites","var(--pi-danger)"]
          ].map(([v,lbl,c],i)=>(
            <div key={i} style={{flex:1,textAlign:"center",padding:"var(--pi-s2) var(--pi-s1)",borderRadius:"var(--pi-r-md)",background:"var(--pi-surface-2)",minWidth:60}}>
              <div style={{fontFamily:"var(--pi-font-display)",fontWeight:900,fontStyle:"italic",fontSize:24,color:c}}>{v}</div>
              <div style={{fontSize:"var(--pi-fs-meta)",color:"var(--pi-text-3)",marginTop:2,lineHeight:1.2}}>{lbl}</div>
            </div>
          ))}
        </div>
      </Panel>

      {/* FILES INDICATOR */}
      <Panel style={{marginBottom:"var(--pi-s4)",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{fontSize:"var(--pi-fs-body)",color:"var(--pi-text-2)"}}>Files d'attente actives</div>
        <div style={{display:"flex",alignItems:"center",gap:"var(--pi-s2)"}}>
          <div style={{display:"flex",gap:3}}>
            {[0,1].map(i=><div key={i} style={{width:14,height:14,borderRadius:"var(--pi-r-xs)",background:i<inQueues.length?"var(--pi-lime)":"var(--pi-surface-3)"}}/>)}
          </div>
          <div style={{fontSize:"var(--pi-fs-card)",fontWeight:700,color:inQueues.length>=2?"var(--pi-warn)":"var(--pi-lime)"}}>{inQueues.length}/2</div>
        </div>
      </Panel>

      {/* ZONE CHECKLIST */}
      <Eyebrow style={{marginBottom:"var(--pi-s3)"}}>Stations — rejoignez la file pour accumuler des points</Eyebrow>
      <div style={{display:"flex",flexDirection:"column",gap:"var(--pi-s2)",marginBottom:"var(--pi-s4)"}}>
        {ZK.map(zk=>{
          const zc=ZONES[zk];
          const played=(player.zonesPlayed||[]).includes(zk);
          const score=(player.zoneScores||{})[zk]||50;
          const streak=(player.zoneStreaks||{})[zk]||0;
          const inQ=inQueues.includes(zk);
          const inG=activeGames[zk]&&(()=>{const g=activeGames[zk];const all=g.participants||[...(g.teamA||[]),...(g.teamB||[])];return all.includes(playerId);})();
          const isZoneDisabled=(disabledZones||[]).includes(zk);
          const zoneHistory=(player.history||[]).filter(h=>h.zone===zk);
          const wins=zoneHistory.filter(h=>h.isWin).length;
          const losses=zoneHistory.filter(h=>!h.isWin).length;
          return(
            <Panel key={zk} style={{border:`2px solid ${isZoneDisabled?"var(--pi-line)":played?zc.color:inG?"#fbbf2460":"var(--pi-line)"}`,
              opacity:isZoneDisabled?0.6:1,pointerEvents:isZoneDisabled?"none":"auto",position:"relative"}}>
              {isZoneDisabled&&<div style={{position:"absolute",top:8,right:8,padding:"2px 8px",borderRadius:"var(--pi-r-sm)",
                background:"var(--pi-danger-wash)",color:"var(--pi-danger)",border:"1px solid var(--pi-danger)",fontSize:"var(--pi-fs-meta)",fontWeight:700}}>DÉSACTIVÉE</div>}
              <div style={{display:"flex",alignItems:"center",gap:"var(--pi-s3)",marginBottom:played||inG?"var(--pi-s2)":0}}>
                <div style={{width:26,height:26,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",
                  flexShrink:0,fontSize:14,fontWeight:900,
                  background:played?zc.color:inG?"#fbbf2430":"var(--pi-surface-2)",
                  color:played?"#000":inG?"#fbbf24":"var(--pi-text-4)",
                  border:played?"none":inG?"1px solid #fbbf2460":"1px solid var(--pi-line-strong)"}}>
                  {played?"✓":inG?"⚡":"○"}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                    <div style={{display:"flex",alignItems:"center",gap:6}}>
                      <span style={{fontSize:16}}>{zc.icon}</span>
                      <span style={{fontSize:"var(--pi-fs-body)",fontWeight:700,color:played?"var(--pi-text)":"var(--pi-text-2)"}}>{zn(zk).name}</span>
                      {inG&&<span className="pi-pulse" style={{fontSize:"var(--pi-fs-label)",color:"#fbbf24"}}>en cours</span>}
                      {inQ&&!inG&&<span style={{fontSize:"var(--pi-fs-label)",color:zc.color}}>en file</span>}
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:6,flexShrink:0}}>
                      {zk==="speed"&&played&&<TierBadge score={score}/>}
                      {streak>=2&&<span style={{fontSize:"var(--pi-fs-label)",color:"var(--pi-warn)"}}>🔥x{streak}</span>}
                      {played&&<span style={{fontFamily:"var(--pi-font-display)",fontWeight:900,fontSize:15,color:zc.color}}>{score}</span>}
                    </div>
                  </div>
                  {played&&(
                    <div style={{marginTop:5,height:4,borderRadius:"var(--pi-r-xs)",background:"var(--pi-surface-3)"}}>
                      <div style={{height:"100%",borderRadius:"var(--pi-r-xs)",background:zc.color,width:score+"%",transition:"width .7s"}}/>
                    </div>
                  )}
                </div>
              </div>

              {played&&zoneHistory.length>0&&(
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:6,paddingTop:6,borderTop:"1px solid var(--pi-line)"}}>
                  <div style={{display:"flex",gap:"var(--pi-s3)"}}>
                    <span style={{fontSize:"var(--pi-fs-body)",color:"var(--pi-ok)"}}>V: {wins}</span>
                    <span style={{fontSize:"var(--pi-fs-body)",color:"var(--pi-danger)"}}>D: {losses}</span>
                    <span style={{fontSize:"var(--pi-fs-body)",color:"var(--pi-text-3)"}}>{zoneHistory.length} partie{zoneHistory.length>1?"s":""}</span>
                  </div>
                  <div style={{fontSize:"var(--pi-fs-body)",fontFamily:"var(--pi-font-display)",fontWeight:700,
                    color:zoneHistory.reduce((s,h)=>s+h.delta,0)>=0?"var(--pi-lime)":"var(--pi-danger)"}}>
                    Total: {zoneHistory.reduce((s,h)=>s+h.delta,0)>0?"+":""}{zoneHistory.reduce((s,h)=>s+h.delta,0)} pts
                  </div>
                </div>
              )}

              {!inG&&(
                inQ
                  ?<div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:"var(--pi-s2)"}}>
                    <div style={{fontSize:"var(--pi-fs-body)",fontWeight:600,color:zc.color}}>En file d'attente...</div>
                    <Button variant="ghost" size="sm" onClick={()=>onLeave(playerId,zk)}>Quitter</Button>
                  </div>
                  :canJoin
                    ?<Button variant="outline" block size="sm" style={{marginTop:"var(--pi-s2)",borderColor:zc.color+"35",background:zc.color+"15",color:zc.color}} onClick={()=>onJoin(playerId,zk)}>
                      {played?"Rejouer — "+t.joinQueue:t.joinQueue}
                    </Button>
                    :<div style={{fontSize:"var(--pi-fs-label)",color:"var(--pi-text-3)",marginTop:6}}>{playingAt?t.inGameElsewhere:t.max2queues}</div>
              )}
            </Panel>
          );
        })}
      </div>

      {/* ELIGIBILITY BANNER */}
      <Panel style={{marginBottom:"var(--pi-s4)",textAlign:"center",
        background:elig?"var(--pi-lime-wash)":"var(--pi-surface-1)",borderColor:elig?"var(--pi-lime-line)":"var(--pi-line-strong)"}}>
        {elig
          ?<span style={{color:"var(--pi-lime)",fontWeight:700,fontSize:"var(--pi-fs-body)"}}>{t.allZonesDone}</span>
          :<div>
            <div style={{color:"var(--pi-text-2)",fontSize:"var(--pi-fs-body)",marginBottom:6}}>Zones manquantes pour etre eligible:</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:5,justifyContent:"center"}}>
              {ZK.filter(zk=>!(player.zonesPlayed||[]).includes(zk)&&!(disabledZones||[]).includes(zk)).map(zk=>(
                <span key={zk} style={{padding:"3px 8px",fontSize:"var(--pi-fs-body)",borderRadius:"var(--pi-r-sm)",background:ZONES[zk].color+"18",color:ZONES[zk].color}}>
                  {ZONES[zk].icon} {zn(zk).sn}
                </span>
              ))}
            </div>
          </div>}
      </Panel>

      {/* CODE DE SESSION */}
      {code&&(
        <Panel style={{marginBottom:"var(--pi-s4)",textAlign:"center"}}>
          <Eyebrow style={{marginBottom:"var(--pi-s2)"}}>Code de la partie</Eyebrow>
          <div style={{fontFamily:"var(--pi-font-display)",fontWeight:900,fontSize:48,color:"var(--pi-lime)",letterSpacing:12,lineHeight:1,marginBottom:"var(--pi-s3)"}}>{code}</div>
          <Button variant="primary" onClick={openQR}>📲 Voir le QR code</Button>
          <Modal open={showQR} onClose={()=>setShowQR(false)} labelledBy="qr-title">
            <div style={{textAlign:"center"}}>
              <h2 id="qr-title" style={{fontFamily:"var(--pi-font-display)",fontWeight:900,fontStyle:"italic",fontSize:"var(--pi-fs-section)",color:"var(--pi-text)",marginBottom:4}}>
                Scannez pour rejoindre
              </h2>
              <div style={{fontSize:"var(--pi-fs-body)",color:"var(--pi-text-3)",marginBottom:"var(--pi-s4)"}}>
                Code : <span style={{color:"var(--pi-lime)",fontWeight:700,letterSpacing:4}}>{code}</span>
              </div>
              {sessionQR&&<img src={sessionQR} alt="QR" style={{width:220,height:220,borderRadius:"var(--pi-r-md)",display:"block",margin:"0 auto"}}/>}
              <Button variant="secondary" style={{marginTop:"var(--pi-s4)"}} onClick={()=>setShowQR(false)}>Fermer</Button>
            </div>
          </Modal>
        </Panel>
      )}
    </div>
  );
}

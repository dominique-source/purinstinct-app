import { useState } from "react";
import { ZONES, ZK, AUG_GAMES, AUG_COLOR, ZONE_VIGNETTES } from "../../../config/zones.js";
import { useZn, useT } from "../../../hooks/useLang.js";
import { Bib } from "../../shared/Bib.jsx";
import { RulesCard } from "../../shared/RulesCard.jsx";
import { IconButton, Button } from "../../ui/Button.jsx";
import { Panel } from "../../ui/Panel.jsx";
import { Badge, LiveIndicator } from "../../ui/Status.jsx";
import { Tabs } from "../../ui/Tabs.jsx";

export function StationsTab({players,allPlayers,queues,activeGames,arenaState,onToggleZone,onOpenDossier,augState,onUpdateAugState,onUpdatePlayer2,selectedStation,onSelectStation}){
  const t=useT();
  const zn=useZn();
  const [selectedAugGame,setSelectedAugGame]=useState(null);
  const [stationTab,setStationTab]=useState("live");

  return(
    <div className="pi-anim-up" style={{display:"flex",flexDirection:"column",gap:"var(--pi-s3)"}}>
      {selectedStation?(()=>{
        const zk=selectedStation; const z=ZONES[zk]; const zl=zn(zk);
        const game=activeGames[zk]; const q=queues[zk]||[];
        const teamA=game?(game.teamA||[]).map(id=>players.find(p=>p.id===id)).filter(Boolean):[];
        const teamB=game?(game.teamB||[]).map(id=>players.find(p=>p.id===id)).filter(Boolean):[];
        const solo=game?(game.participants||[]).map(id=>players.find(p=>p.id===id)).filter(Boolean):[];
        const inQueue=q.map(id=>players.find(p=>p.id===id)).filter(Boolean);
        return(
          <div style={{maxWidth:"var(--pi-w-content)",margin:"0 auto",width:"100%"}}>
            {/* Header */}
            <div style={{display:"flex",alignItems:"center",gap:"var(--pi-s3)",marginBottom:"var(--pi-s4)"}}>
              <IconButton label="Retour" onClick={()=>{onSelectStation(null);setStationTab("live");}}>←</IconButton>
              <span style={{fontSize:22}}>{z.icon}</span>
              <div style={{flex:1}}>
                <div style={{color:"var(--pi-text)",fontWeight:700,fontSize:"var(--pi-fs-card)"}}>{zl.name}</div>
              </div>
            </div>

            {/* Onglets */}
            <div style={{maxWidth:280,marginBottom:"var(--pi-s4)"}}>
              <Tabs items={[{id:"live",label:"⚡ Live"},{id:"rules",label:"📋 Règlements"}]} value={stationTab} onChange={setStationTab}/>
            </div>

            {stationTab==="rules"&&(
              <RulesCard zone={zk}/>
            )}

            {stationTab==="live"&&<>

            {/* Live game */}
            {game?(
              <Panel style={{borderColor:z.border,marginBottom:"var(--pi-s3)"}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"var(--pi-s3)"}}>
                  <div style={{fontWeight:700,fontSize:"var(--pi-fs-body)",color:"var(--pi-text)"}}>Partie en cours</div>
                  <LiveIndicator/>
                </div>
                {solo.length>0?(
                  <div style={{display:"flex",flexWrap:"wrap",gap:"var(--pi-s2)"}}>
                    {solo.map(p=>(
                      <div key={p.id} onClick={()=>onOpenDossier(p.id)}
                        style={{display:"flex",alignItems:"center",gap:6,padding:"6px 10px",borderRadius:"var(--pi-r-md)",background:"var(--pi-surface-2)",
                          border:"1px solid "+z.color+"40",cursor:"pointer"}}
                        onMouseEnter={e=>e.currentTarget.style.borderColor=z.color}
                        onMouseLeave={e=>e.currentTarget.style.borderColor=z.color+"40"}>
                        <Bib n={p.number} size="sm"/>
                        <span style={{color:"var(--pi-text)",fontSize:"var(--pi-fs-body)",fontWeight:600,flex:1,minWidth:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.name.split(" ")[0]}</span>
                        <div style={{display:"flex",alignItems:"center",gap:4,flexShrink:0}}>
                          {((p.zoneStreaks||{})[zk]||0)>=2&&<span style={{fontSize:"var(--pi-fs-label)",color:"var(--pi-warn)"}}>🔥×{(p.zoneStreaks||{})[zk]}</span>}
                          <span style={{color:z.color,fontSize:"var(--pi-fs-body)",fontWeight:700}}>{z.icon} {(p.zoneScores||{})[zk]||50}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ):(
                  <div style={{display:"flex",gap:"var(--pi-s3)"}}>
                    {[["A",teamA],["B",teamB]].map(([label,team])=>(
                      <div key={label} style={{flex:1,background:"var(--pi-surface-2)",borderRadius:"var(--pi-r-md)",padding:"var(--pi-s3)",border:"1px solid "+z.color+"30"}}>
                        <div style={{color:z.color,fontWeight:700,fontSize:"var(--pi-fs-label)",marginBottom:"var(--pi-s2)"}}>ÉQUIPE {label}</div>
                        {team.map(p=>(
                          <div key={p.id} onClick={()=>onOpenDossier(p.id)}
                            style={{display:"flex",alignItems:"center",gap:6,padding:"4px 0",cursor:"pointer",borderRadius:"var(--pi-r-sm)"}}
                            onMouseEnter={e=>e.currentTarget.style.background="var(--pi-surface-3)"}
                            onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                            <Bib n={p.number} size="sm"/>
                            <span style={{color:"var(--pi-text)",fontSize:"var(--pi-fs-body)",fontWeight:600,flex:1,minWidth:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.name.split(" ")[0]}</span>
                            <div style={{display:"flex",alignItems:"center",gap:4,flexShrink:0}}>
                              {((p.zoneStreaks||{})[zk]||0)>=2&&<span style={{fontSize:"var(--pi-fs-label)",color:"var(--pi-warn)"}}>🔥×{(p.zoneStreaks||{})[zk]}</span>}
                              <span style={{color:z.color,fontSize:"var(--pi-fs-body)",fontWeight:700}}>{z.icon} {(p.zoneScores||{})[zk]||50}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </Panel>
            ):(
              <Panel style={{marginBottom:"var(--pi-s3)",textAlign:"center",color:"var(--pi-text-3)",fontSize:"var(--pi-fs-body)",padding:"var(--pi-s6) var(--pi-s3)"}}>
                {t.noGameInZone}
              </Panel>
            )}

            {/* Queue */}
            <Panel>
              <div style={{fontWeight:700,fontSize:"var(--pi-fs-body)",color:"var(--pi-text)",marginBottom:"var(--pi-s3)"}}>{t.queueLabel} ({inQueue.length})</div>
              {inQueue.length===0?(
                <div style={{color:"var(--pi-text-3)",fontSize:"var(--pi-fs-label)",textAlign:"center",padding:"var(--pi-s2) 0"}}>{t.queueEmpty}</div>
              ):(
                <div style={{display:"flex",flexDirection:"column",gap:4}}>
                  {inQueue.map((p,i)=>(
                    <div key={p.id} onClick={()=>onOpenDossier(p.id)}
                      style={{display:"flex",alignItems:"center",gap:8,padding:"5px 8px",borderRadius:"var(--pi-r-sm)",cursor:"pointer"}}
                      onMouseEnter={e=>e.currentTarget.style.background="var(--pi-surface-3)"}
                      onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                      <span style={{color:"var(--pi-text-3)",fontSize:"var(--pi-fs-label)",width:16,textAlign:"right"}}>{i+1}</span>
                      <Bib n={p.number} size="sm"/>
                      <span style={{color:"var(--pi-text)",fontSize:"var(--pi-fs-body)",fontWeight:600,flex:1,minWidth:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.name}</span>
                      <div style={{display:"flex",alignItems:"center",gap:4,flexShrink:0}}>
                        {((p.zoneStreaks||{})[zk]||0)>=2&&<span style={{fontSize:"var(--pi-fs-label)",color:"var(--pi-warn)"}}>🔥×{(p.zoneStreaks||{})[zk]}</span>}
                        <span style={{color:z.color,fontSize:"var(--pi-fs-body)",fontWeight:700}}>{z.icon} {(p.zoneScores||{})[zk]||50}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Panel>

            </>}
          </div>
        );
      })():(
        <div style={{display:"flex",flexDirection:"column",gap:"var(--pi-s3)"}}>
        {ZK.map(zk=>{
          const z=ZONES[zk]; const zl=zn(zk); const q=queues[zk]||[]; const game=activeGames[zk];
          const allInGame=game?(game.participants||[...(game.teamA||[]),...(game.teamB||[])]).length:0;
          const isDisabled=(arenaState.disabledZones||[]).includes(zk);
          const vignette=ZONE_VIGNETTES[zk];
          return(
            <div key={zk} style={{position:"relative"}}>
              {/* Contenu de la carte — opaque si désactivée */}
              <Panel flush style={{borderColor:isDisabled?"var(--pi-line)":z.border,
                opacity:isDisabled?0.4:1}}
                onClick={()=>{if(!isDisabled){onSelectStation(zk);setStationTab("live");}}}
                onMouseEnter={e=>{if(!isDisabled)e.currentTarget.style.borderColor=z.color;}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor=isDisabled?"var(--pi-line)":z.border;}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",cursor:isDisabled?"default":"pointer",paddingRight:100}}>
                  <div style={{display:"flex",alignItems:"center",gap:0}}>
                    <div style={{width:64,height:64,flexShrink:0,overflow:"hidden",background:z.bg}}>
                      {vignette&&<img src={vignette} alt={zl.name} style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}} onError={e=>e.target.style.display="none"}/>}
                      {!vignette&&<div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>{z.icon}</div>}
                    </div>
                    <div style={{padding:"var(--pi-s3)"}}>
                      <div style={{color:"var(--pi-text)",fontWeight:700,fontSize:"var(--pi-fs-body)"}}>{zl.name}</div>
                    </div>
                  </div>
                  <div style={{display:"flex",gap:6,alignItems:"center"}}>
                    {!isDisabled&&<Badge style={{background:z.color+"18",color:z.color}}>{q.length} en file</Badge>}
                    {!isDisabled&&game&&<LiveIndicator label={allInGame+" LIVE"}/>}
                    {!isDisabled&&<span style={{color:"var(--pi-text-3)",fontSize:16}}>›</span>}
                  </div>
                </div>
              </Panel>
              {/* Bouton toggle — toujours visible, hors de l'opacité */}
              <button onClick={()=>onToggleZone(zk)}
                style={{position:"absolute",top:"50%",right:12,transform:"translateY(-50%)",
                  padding:"5px 12px",borderRadius:"var(--pi-r-pill)",border:"1px solid",cursor:"pointer",
                  fontSize:"var(--pi-fs-meta)",fontWeight:700,zIndex:3,
                  background:isDisabled?"var(--pi-danger-wash)":"var(--pi-lime-wash)",
                  color:isDisabled?"var(--pi-danger)":"var(--pi-lime)",
                  borderColor:isDisabled?"var(--pi-danger)":"var(--pi-lime-line)"}}>
                {isDisabled?"⏸ OFF":"● ON"}
              </button>
            </div>
          );
        })}
        </div>
      )}

      {/* ── Moment Factory augmented games ── */}
      {!selectedStation&&!selectedAugGame&&(
        <div style={{marginTop:8}}>
          <div style={{fontSize:"var(--pi-fs-label)",color:"var(--pi-text-3)",textTransform:"uppercase",letterSpacing:"3px",fontWeight:600,marginBottom:"var(--pi-s2)",paddingLeft:2}}>🏟 Moment Factory</div>
          {AUG_GAMES.map(game=>{
            const gs=(augState||{})[game.id]||{queue:[],activeMatch:null};
            const qLen=gs.queue.length;
            const hasMatch=!!gs.activeMatch;
            return(
              <div key={game.id} style={{borderRadius:"var(--pi-r-lg)",padding:"var(--pi-s3)",background:"var(--pi-surface-1)",border:"1px solid "+(hasMatch?"var(--pi-lime-line)":AUG_COLOR+"40"),
                marginBottom:6,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between"}}
                onClick={()=>setSelectedAugGame(game.id)}
                onMouseEnter={e=>e.currentTarget.style.borderColor=AUG_COLOR}
                onMouseLeave={e=>e.currentTarget.style.borderColor=hasMatch?"var(--pi-lime-line)":AUG_COLOR+"40"}>
                <div style={{display:"flex",alignItems:"center",gap:"var(--pi-s3)"}}>
                  <div style={{width:32,height:32,borderRadius:"var(--pi-r-sm)",overflow:"hidden",flexShrink:0,border:"1px solid "+AUG_COLOR+"40"}}>
                    <img src={game.img} alt={game.fr} style={{width:"100%",height:"100%",objectFit:"cover"}}
                      onError={e=>e.target.style.display="none"}/>
                  </div>
                  <div style={{color:"var(--pi-text)",fontWeight:700,fontSize:"var(--pi-fs-body)"}}>{game.fr}</div>
                </div>
                <div style={{display:"flex",gap:6,alignItems:"center"}}>
                  {qLen>0&&<Badge style={{background:AUG_COLOR+"18",color:AUG_COLOR}}>{qLen} en file</Badge>}
                  {hasMatch&&<LiveIndicator/>}
                  <span style={{color:"var(--pi-text-3)",fontSize:16}}>›</span>
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
            <div style={{display:"flex",alignItems:"center",gap:"var(--pi-s3)",marginBottom:"var(--pi-s3)"}}>
              <IconButton label="Retour" onClick={()=>setSelectedAugGame(null)}>←</IconButton>
              <div style={{width:36,height:36,borderRadius:"var(--pi-r-sm)",overflow:"hidden",flexShrink:0}}>
                <img src={game.img} alt={game.fr} style={{width:"100%",height:"100%",objectFit:"cover"}} onError={e=>e.target.style.display="none"}/>
              </div>
              <div style={{flex:1}}>
                <div style={{color:"var(--pi-text)",fontWeight:700,fontSize:"var(--pi-fs-card)"}}>{game.fr}</div>
                <div style={{fontSize:"var(--pi-fs-meta)",color:AUG_COLOR,letterSpacing:2,textTransform:"uppercase"}}>Moment Factory · +{WIN_PTS} victoire / -{LOSS_PTS} défaite</div>
              </div>
            </div>

            {activeMatch?(
              <Panel style={{borderColor:"var(--pi-lime)",borderWidth:2,marginBottom:"var(--pi-s3)"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"var(--pi-s3)"}}>
                  <div style={{fontWeight:700,fontSize:"var(--pi-fs-body)",color:"var(--pi-lime)"}}>⚡ {activeMatch.format.toUpperCase()} EN COURS</div>
                  <Button variant="ghost" size="sm" onClick={cancelMatch}>↩ Annuler</Button>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr auto 1fr",gap:8,alignItems:"center",marginBottom:"var(--pi-s3)"}}>
                  <div style={{borderRadius:"var(--pi-r-md)",padding:"8px 10px",background:"#3b82f620",border:"1px solid #3b82f640",textAlign:"center"}}>
                    <div style={{fontSize:"var(--pi-fs-meta)",color:"#3b82f6",fontWeight:700,marginBottom:4,letterSpacing:2}}>ÉQUIPE A</div>
                    {activeMatch.teamA.map((n,i)=><div key={i} style={{color:"var(--pi-text)",fontWeight:600,fontSize:"var(--pi-fs-body)"}}>{n}</div>)}
                  </div>
                  <div style={{fontFamily:"var(--pi-font-display)",fontWeight:900,fontSize:18,color:"var(--pi-text-3)"}}>VS</div>
                  <div style={{borderRadius:"var(--pi-r-md)",padding:"8px 10px",background:"var(--pi-warn-wash)",border:"1px solid #f9731640",textAlign:"center"}}>
                    <div style={{fontSize:"var(--pi-fs-meta)",color:"#f97316",fontWeight:700,marginBottom:4,letterSpacing:2}}>ÉQUIPE B</div>
                    {activeMatch.teamB.map((n,i)=><div key={i} style={{color:"var(--pi-text)",fontWeight:600,fontSize:"var(--pi-fs-body)"}}>{n}</div>)}
                  </div>
                </div>
                <div style={{fontSize:"var(--pi-fs-body)",color:"var(--pi-text-3)",textAlign:"center",marginBottom:"var(--pi-s2)"}}>Déclarer le vainqueur (+{WIN_PTS} pts)</div>
                <div style={{display:"flex",gap:"var(--pi-s2)"}}>
                  <button onClick={()=>declareWinner("A")} style={{flex:1,padding:10,borderRadius:"var(--pi-r-md)",border:"none",cursor:"pointer",background:"#3b82f6",color:"#fff",fontFamily:"var(--pi-font-display)",fontWeight:900,fontSize:14}}>🏆 ÉQUIPE A</button>
                  <button onClick={()=>declareWinner("B")} style={{flex:1,padding:10,borderRadius:"var(--pi-r-md)",border:"none",cursor:"pointer",background:"#f97316",color:"#fff",fontFamily:"var(--pi-font-display)",fontWeight:900,fontSize:14}}>🏆 ÉQUIPE B</button>
                </div>
              </Panel>
            ):(
              <div>
                <div style={{display:"flex",gap:"var(--pi-s2)",marginBottom:"var(--pi-s3)"}}>
                  {["1v1","2v2","3v3"].map(fmt=>{
                    const need=fmt==="1v1"?2:fmt==="2v2"?4:6;
                    const canGen=augQueue.length>=need;
                    return(
                      <button key={fmt} onClick={()=>canGen&&generateMatch(fmt)}
                        style={{flex:1,padding:10,borderRadius:"var(--pi-r-md)",border:"1px solid "+(canGen?AUG_COLOR+"80":"var(--pi-line)"),
                          background:canGen?AUG_COLOR+"20":"transparent",color:canGen?"var(--pi-text)":"var(--pi-text-4)",
                          cursor:canGen?"pointer":"default",fontFamily:"var(--pi-font-display)",fontWeight:900,fontSize:16}}>
                        {fmt}
                        <div style={{fontSize:9,color:canGen?AUG_COLOR:"var(--pi-text-4)",marginTop:2}}>{augQueue.length}/{need}</div>
                      </button>
                    );
                  })}
                </div>
                <Panel>
                  <div style={{fontWeight:700,fontSize:"var(--pi-fs-body)",color:"var(--pi-text)",marginBottom:"var(--pi-s2)"}}>File d'attente ({augQueue.length})</div>
                  {augQueue.length===0?(
                    <div style={{color:"var(--pi-text-3)",fontSize:"var(--pi-fs-label)",textAlign:"center",padding:"6px 0"}}>File vide</div>
                  ):(
                    <div style={{display:"flex",flexDirection:"column",gap:3,maxHeight:200,overflowY:"auto"}}>
                      {augQueue.map((name,i)=>(
                        <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"5px 8px",borderRadius:"var(--pi-r-sm)",background:"var(--pi-surface-2)"}}>
                          <span style={{color:"var(--pi-text-3)",fontSize:"var(--pi-fs-label)",width:16,textAlign:"right"}}>{i+1}</span>
                          <span style={{color:"var(--pi-text)",fontSize:"var(--pi-fs-body)",fontWeight:600,flex:1,marginLeft:4}}>{name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </Panel>
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
}

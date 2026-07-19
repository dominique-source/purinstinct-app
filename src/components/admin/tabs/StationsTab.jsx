import { useState } from "react";
import { ZONES, ZK, AUG_GAMES, AUG_COLOR, ZONE_VIGNETTES } from "../../../config/zones.js";
import { useZn, useT } from "../../../hooks/useLang.js";
import { S } from "../../shared/styles.js";
import { Bib } from "../../shared/Bib.jsx";
import { RulesCard } from "../../shared/RulesCard.jsx";

export function StationsTab({players,allPlayers,queues,activeGames,arenaState,onToggleZone,onOpenDossier,augState,onUpdateAugState,onUpdatePlayer2,selectedStation,onSelectStation}){
  const t=useT();
  const zn=useZn();
  const [selectedAugGame,setSelectedAugGame]=useState(null);
  const [stationTab,setStationTab]=useState("live");

  return(
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
              <button onClick={()=>{onSelectStation(null);setStationTab("live");}}
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
              {[["live","⚡ Live"],["rules","📋 Règlements"]].map(([tb,l])=>(
                <button key={tb} onClick={()=>setStationTab(tb)}
                  style={{padding:"6px 14px",borderRadius:8,fontSize:11,fontWeight:600,border:"none",cursor:"pointer",
                    background:stationTab===tb?z.color:"#0d0f1a",
                    color:stationTab===tb?"#000":"#6b7280"}}>
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
                      <div key={p.id} onClick={()=>onOpenDossier(p.id)}
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
                          <div key={p.id} onClick={()=>onOpenDossier(p.id)}
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
                    <div key={p.id} onClick={()=>onOpenDossier(p.id)}
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
                onClick={()=>{if(!isDisabled){onSelectStation(zk);setStationTab("live");}}}
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
  );
}

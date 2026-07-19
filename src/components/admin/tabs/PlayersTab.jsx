import { ZONES, ZK } from "../../../config/zones.js";
import { useZn } from "../../../hooks/useLang.js";
import { getStatus } from "../../../lib/game-logic.js";
import { S } from "../../shared/styles.js";
import { Bib } from "../../shared/Bib.jsx";

export function PlayersTab({players,queues,activeGames,onAddQ,onRemoveQ,onOpenDossier,onRemovePlayer}){
  const zn=useZn();

  return(
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
                <button onClick={(e)=>{e.stopPropagation();onOpenDossier(p.id);}}
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
  );
}

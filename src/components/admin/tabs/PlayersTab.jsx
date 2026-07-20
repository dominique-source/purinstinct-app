import { ZONES, ZK } from "../../../config/zones.js";
import { useZn } from "../../../hooks/useLang.js";
import { getStatus } from "../../../lib/game-logic.js";
import { Bib } from "../../shared/Bib.jsx";
import { Panel, Eyebrow } from "../../ui/Panel.jsx";
import { Button } from "../../ui/Button.jsx";

export function PlayersTab({players,queues,activeGames,onAddQ,onRemoveQ,onOpenDossier,onRemovePlayer}){
  const zn=useZn();

  return(
    <div className="pi-anim-up" style={{maxWidth:"var(--pi-w-content)",margin:"0 auto"}}>
      {/* Legend */}
      <Panel style={{display:"flex",gap:"var(--pi-s3)",flexWrap:"wrap",marginBottom:"var(--pi-s3)"}}>
        <Eyebrow style={{width:"100%",marginBottom:4}}>Legende</Eyebrow>
        <div style={{display:"flex",alignItems:"center",gap:5,fontSize:"var(--pi-fs-body)",color:"var(--pi-text-2)"}}><div style={{width:8,height:8,borderRadius:"50%",background:"var(--pi-ok)",flexShrink:0}}/>Libre</div>
        <div style={{display:"flex",alignItems:"center",gap:5,fontSize:"var(--pi-fs-body)",color:"var(--pi-text-2)"}}><div style={{width:8,height:8,borderRadius:"50%",background:"var(--pi-lime)",flexShrink:0}}/>En file (1 ou 2)</div>
        <div style={{display:"flex",alignItems:"center",gap:5,fontSize:"var(--pi-fs-body)",color:"var(--pi-text-2)"}}><div style={{width:8,height:8,borderRadius:"50%",background:"#fbbf24",flexShrink:0}}/>En partie</div>
        <div style={{fontSize:"var(--pi-fs-body)",color:"var(--pi-text-2)"}}>| Boutons <strong style={{color:"var(--pi-text)"}}>+ Zone</strong> = ajouter a cette file</div>
        <div style={{fontSize:"var(--pi-fs-body)",color:"var(--pi-text-2)"}}>| Bouton <strong style={{color:"var(--pi-danger)"}}>Retirer</strong> = sortir de la file</div>
      </Panel>

      {/* Filter bar */}
      <Eyebrow style={{marginBottom:"var(--pi-s3)"}}>{players.length} joueurs — cliquez sur une zone pour ajouter</Eyebrow>
      <div style={{display:"flex",flexDirection:"column",gap:6}}>
        {players.map(p=>{
          const {inQueues,playingAt}=getStatus(p.id,queues,activeGames);
          const canAdd=!playingAt&&inQueues.length<2;
          const statusDot = playingAt?"#fbbf24":inQueues.length>0?"var(--pi-lime)":"var(--pi-text-4)";
          const statusText = playingAt
            ?("⚡ En partie · "+zn(playingAt).name)
            :inQueues.length>0
              ?("En file · "+inQueues.map(z=>zn(z).sn).join(" + "))
              :"Libre";
          const statusColor = playingAt?"#fbbf24":inQueues.length>0?"var(--pi-lime)":"var(--pi-text-3)";
          const zonesNotIn=ZK.filter(zk=>!inQueues.includes(zk));

          return(
            <Panel key={p.id} flush style={{borderColor:playingAt?"#fbbf2430":inQueues.length>0?"var(--pi-lime-line)":"var(--pi-line)"}}>

              {/* Top row: identity + status + points + dossier link — full row is clickable */}
              <div style={{display:"flex",alignItems:"center",padding:"9px 12px",gap:"var(--pi-s3)"}}>
                <div style={{width:8,height:8,borderRadius:"50%",background:statusDot,flexShrink:0,marginTop:1}}/>
                <Bib n={p.number} size="sm"/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{color:"var(--pi-text)",fontWeight:600,fontSize:"var(--pi-fs-body)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.name}</div>
                  <div style={{fontSize:"var(--pi-fs-label)",marginTop:1,fontWeight:600,color:statusColor}}>{statusText}</div>
                </div>
                <div style={{fontFamily:"var(--pi-font-display)",fontWeight:900,fontSize:16,color:"var(--pi-lime)",flexShrink:0}}>{p.globalPoints} pts</div>
                <Button variant="secondary" size="sm" style={{padding:"4px 8px",fontSize:"var(--pi-fs-label)",flexShrink:0}}
                  onClick={(e)=>{e.stopPropagation();onOpenDossier(p.id);}}>Profil</Button>
                <Button variant="danger" size="sm" style={{padding:"4px 8px",fontSize:"var(--pi-fs-label)",flexShrink:0}}
                  onClick={(e)=>{e.stopPropagation();if(window.confirm("Supprimer "+p.name+" de la session ?"))onRemovePlayer&&onRemovePlayer(p.id);}}>Supprimer</Button>
              </div>

              {/* Action row - only if not playing */}
              {!playingAt&&(
                <div style={{padding:"0 12px 9px 12px",display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>

                  {/* Current queues with remove button */}
                  {inQueues.map(z=>(
                    <div key={z} style={{display:"flex",alignItems:"center",gap:4,padding:"3px 8px 3px 6px",borderRadius:"var(--pi-r-pill)",
                      background:ZONES[z].color+"22",border:"1px solid "+ZONES[z].color+"50"}}>
                      <span style={{fontSize:13}}>{ZONES[z].icon}</span>
                      <span style={{fontSize:"var(--pi-fs-label)",fontWeight:600,color:ZONES[z].color}}>{zn(z).sn}</span>
                      <button onClick={()=>onRemoveQ(p.id,z)} title={"Retirer de "+zn(z).name}
                        style={{background:"none",border:"none",cursor:"pointer",color:ZONES[z].color,
                          fontSize:14,lineHeight:1,padding:0,marginLeft:2,opacity:.7}}
                        onMouseEnter={e=>e.target.style.opacity="1"}
                        onMouseLeave={e=>e.target.style.opacity=".7"}>×</button>
                    </div>
                  ))}

                  {/* Divider if both queues and add buttons */}
                  {inQueues.length>0&&canAdd&&(
                    <div style={{width:1,height:16,background:"var(--pi-line)",flexShrink:0}}/>
                  )}

                  {/* Add-to-queue buttons — labeled with zone name */}
                  {canAdd&&zonesNotIn.map(zk=>(
                    <button key={zk} onClick={()=>onAddQ(p.id,zk)}
                      title={"Ajouter a la file : "+zn(zk).name}
                      style={{display:"flex",alignItems:"center",gap:4,padding:"3px 8px",borderRadius:"var(--pi-r-pill)",border:"1px dashed "+ZONES[zk].color+"50",
                        background:"transparent",cursor:"pointer",color:ZONES[zk].color+"99"}}
                      onMouseEnter={e=>{e.currentTarget.style.background=ZONES[zk].color+"15";e.currentTarget.style.color=ZONES[zk].color;e.currentTarget.style.borderColor=ZONES[zk].color;}}
                      onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color=ZONES[zk].color+"99";e.currentTarget.style.borderColor=ZONES[zk].color+"50";}}>
                      <span style={{fontSize:13}}>{ZONES[zk].icon}</span>
                      <span style={{fontSize:10,fontWeight:600}}>+ {zn(zk).sn}</span>
                    </button>
                  ))}
                  {!canAdd&&inQueues.length>=2&&(
                    <div style={{fontSize:"var(--pi-fs-label)",color:"var(--pi-text-3)"}}>Max 2 files atteint</div>
                  )}
                </div>
              )}
            </Panel>
          );
        })}
      </div>
    </div>
  );
}

import { useState } from "react";
import { ZONES, ZK } from "../../../config/zones.js";
import { useZn } from "../../../hooks/useLang.js";
import { Bib } from "../../shared/Bib.jsx";
import { Button, IconButton } from "../../ui/Button.jsx";
import { Panel, Eyebrow } from "../../ui/Panel.jsx";
import { EmptyState } from "../../ui/Feedback.jsx";

// gameStyle==="team" précisément — footAgility a teamSize:1 (truthy) mais
// gameStyle:"duel" (1v1 individuel), pas une vraie zone équipe.
const TEAM_ZONES = ZK.filter((zk) => ZONES[zk].gameStyle==="team");

// Onglet admin "Équipes": interrupteur du mode équipes manuel + gestion des
// équipes par zone (assigner un joueur, retirer, renommer) — couvre le cas
// où un responsable/professeur inscrit les équipes lui-même plutôt que de
// dépendre du self-service au kiosque (même mécanisme, joinOrCreateTeam côté
// App.jsx via onAssignPlayer).
export function TeamsTab({players,teams,arenaState,onToggleTeamMode,onAssignPlayer,onRemoveTeamMember,onRenameTeam}){
  const zn=useZn();
  const teamMode=!!arenaState.teamMode;
  const [selectedZone,setSelectedZone]=useState(TEAM_ZONES[0]);
  const [numInput,setNumInput]=useState("");
  const [teamNameInput,setTeamNameInput]=useState("");
  const [renaming,setRenaming]=useState(null); // teamId en cours de renommage
  const [renameValue,setRenameValue]=useState("");

  const z=ZONES[selectedZone];
  const zl=zn(selectedZone);
  const teamsForZone=(teams||{})[selectedZone]||{};
  const teamsList=Object.entries(teamsForZone).map(([id,tm])=>({id,...tm}));

  const handleAssign=()=>{
    const n=parseInt(numInput,10);
    const p=players.find((px)=>px.number===n);
    if(!p||!teamNameInput.trim()) return;
    onAssignPlayer(selectedZone,p.id,teamNameInput.trim());
    setNumInput("");setTeamNameInput("");
  };

  return(
    <div className="pi-anim-up" style={{display:"flex",flexDirection:"column",gap:"var(--pi-s3)"}}>
      <Panel>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:"var(--pi-s3)"}}>
          <div>
            <div style={{fontWeight:700,fontSize:"var(--pi-fs-body)",color:"var(--pi-text)"}}>Mode équipes manuel</div>
            <div style={{fontSize:"var(--pi-fs-label)",color:"var(--pi-text-3)",marginTop:2}}>
              Les joueurs rejoignent une équipe nommée au lieu d'une file individuelle (zones équipe seulement).
            </div>
          </div>
          <button onClick={onToggleTeamMode}
            style={{flexShrink:0,padding:"7px 16px",borderRadius:"var(--pi-r-pill)",border:"1px solid",cursor:"pointer",
              fontSize:"var(--pi-fs-label)",fontWeight:700,
              background:teamMode?"var(--pi-lime-wash)":"var(--pi-surface-2)",
              color:teamMode?"var(--pi-lime)":"var(--pi-text-3)",
              borderColor:teamMode?"var(--pi-lime-line)":"var(--pi-line)"}}>
            {teamMode?"● ACTIF":"○ INACTIF"}
          </button>
        </div>
      </Panel>

      <div style={{display:"flex",gap:"var(--pi-s2)",flexWrap:"wrap"}}>
        {TEAM_ZONES.map((zk)=>{
          const zzl=zn(zk);
          const sel=selectedZone===zk;
          return(
            <button key={zk} onClick={()=>setSelectedZone(zk)}
              className={sel?"pi-tab is-active":"pi-tab"}
              style={{minHeight:"var(--pi-ctrl-md)",fontSize:"var(--pi-fs-label)",padding:"0 var(--pi-s3)"}}>
              {ZONES[zk].icon} {zzl.name}
            </button>
          );
        })}
      </div>

      <Panel>
        <Eyebrow style={{marginBottom:"var(--pi-s3)"}}>{zl.name} · {z.teamSize} par équipe</Eyebrow>
        {teamsList.length===0?(
          <EmptyState icon="👥" title="AUCUNE ÉQUIPE">Aucune équipe inscrite pour cette zone pour l'instant.</EmptyState>
        ):(
          <div style={{display:"flex",flexDirection:"column",gap:"var(--pi-s3)"}}>
            {teamsList.map((tm)=>(
              <div key={tm.id} style={{border:"1px solid var(--pi-line)",borderRadius:"var(--pi-r-md)",
                padding:"var(--pi-s3)",background:"var(--pi-surface-2)"}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"var(--pi-s2)",gap:"var(--pi-s2)"}}>
                  {renaming===tm.id?(
                    <div style={{display:"flex",gap:"var(--pi-s2)",flex:1}}>
                      <input value={renameValue} onChange={(e)=>setRenameValue(e.target.value)} autoFocus
                        className="pi-input" style={{flex:1,minHeight:36}}/>
                      <Button size="sm" variant="primary" onClick={()=>{onRenameTeam(selectedZone,tm.id,renameValue);setRenaming(null);}}>✓</Button>
                      <Button size="sm" variant="ghost" onClick={()=>setRenaming(null)}>×</Button>
                    </div>
                  ):(
                    <>
                      <span style={{color:"var(--pi-text)",fontWeight:700,fontSize:"var(--pi-fs-body)"}}>{tm.name}</span>
                      <div style={{display:"flex",alignItems:"center",gap:"var(--pi-s2)"}}>
                        <span style={{fontSize:"var(--pi-fs-label)",
                          color:(tm.memberIds||[]).length>=z.teamSize?"var(--pi-lime)":"var(--pi-text-3)"}}>
                          {(tm.memberIds||[]).length}/{z.teamSize}
                        </span>
                        <IconButton label="Renommer" onClick={()=>{setRenaming(tm.id);setRenameValue(tm.name);}}>✎</IconButton>
                      </div>
                    </>
                  )}
                </div>
                <div style={{display:"flex",flexWrap:"wrap",gap:"var(--pi-s2)"}}>
                  {(tm.memberIds||[]).length===0&&(
                    <span style={{fontSize:"var(--pi-fs-label)",color:"var(--pi-text-4)"}}>Aucun membre</span>
                  )}
                  {(tm.memberIds||[]).map((id)=>{
                    const p=players.find((px)=>px.id===id);
                    return(
                      <div key={id} style={{display:"flex",alignItems:"center",gap:6,padding:"4px 6px 4px 10px",
                        borderRadius:"var(--pi-r-pill)",background:"var(--pi-surface-3)"}}>
                        {p&&<Bib n={p.number} size="sm"/>}
                        <span style={{color:"var(--pi-text)",fontSize:"var(--pi-fs-label)"}}>{p?p.name:"#"+id}</span>
                        <button onClick={()=>onRemoveTeamMember(selectedZone,tm.id,id)}
                          style={{border:"none",background:"none",color:"var(--pi-text-3)",cursor:"pointer",fontSize:14,padding:"0 2px"}}>×</button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{marginTop:"var(--pi-s4)",paddingTop:"var(--pi-s4)",borderTop:"1px solid var(--pi-line)"}}>
          <Eyebrow style={{marginBottom:"var(--pi-s2)"}}>Assigner un joueur</Eyebrow>
          <div style={{display:"flex",gap:"var(--pi-s2)"}}>
            <input type="number" placeholder="# Joueur" value={numInput} onChange={(e)=>setNumInput(e.target.value)}
              className="pi-input" style={{width:100}}/>
            <input placeholder="Nom d'équipe (existante ou nouvelle)" value={teamNameInput} onChange={(e)=>setTeamNameInput(e.target.value)}
              className="pi-input" style={{flex:1}}/>
            <Button variant="primary" onClick={handleAssign}>Assigner</Button>
          </div>
        </div>
      </Panel>
    </div>
  );
}

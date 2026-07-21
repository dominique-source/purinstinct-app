import { useT } from "../../../hooks/useLang.js";
import { SessionPanel } from "../SessionPanel.jsx";
import { Button } from "../../ui/Button.jsx";

export function SessionTab({rosters,players,allPlayers,activeRosterId,onActivateRoster,onSetActiveRoster,onUpdateRoster,onDeleteRoster,onAddPlayer,onCreateRoster,onRemovePlayer,onOpenDossier,rosterCodes,onUpdateCodes,pendingSessions,onDismissPending,onPromotePending,onAddGroupToQueue,onResetAllHistory,onResetAllPoints}){
  const t=useT();

  return(
    <div>
    <SessionPanel
      rosters={rosters}
      players={players.filter(p=>(p.groupId||"main")===activeRosterId)}
      allPlayers={allPlayers||players}
      activeRosterId={activeRosterId}
      onActivate={onActivateRoster} onSetActiveRoster={onSetActiveRoster} onUpdateRoster={onUpdateRoster}
      onDeleteRoster={onDeleteRoster}
      onAddPlayer={onAddPlayer} onCreateRoster={onCreateRoster} onRemovePlayer={onRemovePlayer} onOpenDossier={onOpenDossier}
      rosterCodes={rosterCodes} onUpdateCodes={onUpdateCodes}
      pendingSessions={pendingSessions}
      onDismissPending={onDismissPending}
      onPromotePending={onPromotePending}
      onAddGroupToQueue={onAddGroupToQueue}
    />
    {/* Actions destructives regroupées en fin d'onglet, sous la session active */}
    {onResetAllHistory&&(
      <div style={{margin:"var(--pi-s4) 0 0",padding:"var(--pi-s3) var(--pi-s4)",borderRadius:"var(--pi-r-lg)",background:"var(--pi-danger-wash)",border:"1px solid var(--pi-danger)",display:"flex",alignItems:"center",justifyContent:"space-between",gap:"var(--pi-s3)"}}>
        <div>
          <div style={{fontFamily:"var(--pi-font-display)",fontWeight:900,fontSize:15,color:"var(--pi-danger)"}}>{t.resetHistoryTitle}</div>
          <div style={{fontSize:"var(--pi-fs-label)",color:"var(--pi-text-3)",marginTop:2}}>{t.resetHistoryDesc}</div>
        </div>
        <Button variant="danger" style={{background:"var(--pi-danger)",color:"#fff",flexShrink:0}}
          onClick={()=>{if(window.confirm(t.resetHistoryConfirm)) onResetAllHistory();}}>
          {t.resetHistoryBtn}
        </Button>
      </div>
    )}
    {onResetAllPoints&&(
      <div style={{margin:"var(--pi-s4) 0 0",padding:"var(--pi-s3) var(--pi-s4)",borderRadius:"var(--pi-r-lg)",background:"var(--pi-danger-wash)",border:"1px solid var(--pi-danger)",display:"flex",alignItems:"center",justifyContent:"space-between",gap:"var(--pi-s3)"}}>
        <div>
          <div style={{fontFamily:"var(--pi-font-display)",fontWeight:900,fontSize:15,color:"var(--pi-danger)"}}>{t.resetPointsTitle}</div>
          <div style={{fontSize:"var(--pi-fs-label)",color:"var(--pi-text-3)",marginTop:2}}>{t.resetPointsDesc}</div>
        </div>
        <Button variant="danger" style={{background:"var(--pi-danger)",color:"#fff",flexShrink:0}}
          onClick={()=>{if(window.confirm(t.resetPointsConfirm)) onResetAllPoints();}}>
          {t.resetPointsBtn}
        </Button>
      </div>
    )}
    </div>
  );
}

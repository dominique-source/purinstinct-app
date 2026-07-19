import { useT } from "../../../hooks/useLang.js";
import { SessionPanel } from "../SessionPanel.jsx";

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
      <div style={{margin:"16px 0 0",padding:"14px 16px",borderRadius:14,background:"#1a0505",border:"1px solid #ef444440",display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}>
        <div>
          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:15,color:"#ef4444"}}>{t.resetHistoryTitle}</div>
          <div style={{fontSize:11,color:"#6b7280",marginTop:2}}>{t.resetHistoryDesc}</div>
        </div>
        <button onClick={()=>{if(window.confirm(t.resetHistoryConfirm)) onResetAllHistory();}}
          style={{padding:"8px 16px",borderRadius:10,border:"none",background:"#ef4444",color:"#fff",cursor:"pointer",fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:14,flexShrink:0}}>
          {t.resetHistoryBtn}
        </button>
      </div>
    )}
    {onResetAllPoints&&(
      <div style={{margin:"16px 0 0",padding:"14px 16px",borderRadius:14,background:"#1a0505",border:"1px solid #ef444440",display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}>
        <div>
          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:15,color:"#ef4444"}}>{t.resetPointsTitle}</div>
          <div style={{fontSize:11,color:"#6b7280",marginTop:2}}>{t.resetPointsDesc}</div>
        </div>
        <button onClick={()=>{if(window.confirm(t.resetPointsConfirm)) onResetAllPoints();}}
          style={{padding:"8px 16px",borderRadius:10,border:"none",background:"#ef4444",color:"#fff",cursor:"pointer",fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:14,flexShrink:0}}>
          {t.resetPointsBtn}
        </button>
      </div>
    )}
    </div>
  );
}

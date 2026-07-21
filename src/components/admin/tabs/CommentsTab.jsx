import { Panel } from "../../ui/Panel.jsx";
import { Button } from "../../ui/Button.jsx";
import { EmptyState } from "../../ui/Feedback.jsx";

export function CommentsTab({comments,onClearComments}){
  return(
    <div style={{maxWidth:"var(--pi-w-content)",margin:"0 auto",padding:"0 0 var(--pi-s4)"}}>
      <div style={{marginBottom:"var(--pi-s3)",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{fontFamily:"var(--pi-font-display)",fontWeight:900,fontSize:18,color:"var(--pi-text)"}}>
          {(comments||[]).length} commentaire{(comments||[]).length!==1?"s":""}
        </div>
        {(comments||[]).length>0&&onClearComments&&(
          <Button variant="danger" size="sm" style={{background:"var(--pi-danger)",color:"#fff"}}
            onClick={()=>{if(window.confirm("Supprimer tous les commentaires ?"))onClearComments();}}>
            🗑️ Tout supprimer
          </Button>
        )}
      </div>
      {(comments||[]).length===0?(
        <EmptyState>Aucun commentaire pour l'instant.</EmptyState>
      ):(
        <div style={{display:"flex",flexDirection:"column",gap:"var(--pi-s2)"}}>
          {(comments||[]).map(c=>(
            <Panel key={c.id}>
              <div style={{display:"flex",alignItems:"center",gap:"var(--pi-s2)",marginBottom:6}}>
                <div style={{fontFamily:"var(--pi-font-display)",fontWeight:900,fontSize:15,
                  color:"var(--pi-lime)",background:"#111a05",border:"1px solid var(--pi-lime-line)",
                  borderRadius:"var(--pi-r-sm)",padding:"2px 8px",flexShrink:0}}>#{c.playerNumber}</div>
                <div style={{fontWeight:700,color:"var(--pi-text)",fontSize:"var(--pi-fs-body)"}}>{c.playerName}</div>
                <div style={{marginLeft:"auto",fontSize:"var(--pi-fs-meta)",color:"var(--pi-text-4)"}}>
                  {new Date(c.ts).toLocaleTimeString("fr-CA",{hour:"2-digit",minute:"2-digit"})}
                </div>
              </div>
              <div style={{fontSize:"var(--pi-fs-body)",color:"var(--pi-text-2)",lineHeight:1.5,whiteSpace:"pre-wrap"}}>{c.text}</div>
            </Panel>
          ))}
        </div>
      )}
    </div>
  );
}

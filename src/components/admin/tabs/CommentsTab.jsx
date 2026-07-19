export function CommentsTab({comments,onClearComments}){
  return(
    <div style={{padding:"0 0 16px"}}>
      <div style={{marginBottom:12,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:18,color:"#fff"}}>
          {(comments||[]).length} commentaire{(comments||[]).length!==1?"s":""}
        </div>
        {(comments||[]).length>0&&onClearComments&&(
          <button onClick={()=>{if(window.confirm("Supprimer tous les commentaires ?"))onClearComments();}}
            style={{padding:"6px 12px",borderRadius:8,border:"none",background:"#ef4444",color:"#fff",cursor:"pointer",fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:12}}>
            🗑️ Tout supprimer
          </button>
        )}
      </div>
      {(comments||[]).length===0?(
        <div style={{textAlign:"center",padding:32,color:"#374151",fontSize:13}}>Aucun commentaire pour l'instant.</div>
      ):(
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {(comments||[]).map(c=>(
            <div key={c.id} style={{borderRadius:12,background:"#0d0f1a",border:"1px solid #1f2937",padding:"12px 14px"}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:15,
                  color:"#B8E020",background:"#111a05",border:"1px solid #B8E02040",
                  borderRadius:8,padding:"2px 8px",flexShrink:0}}>#{c.playerNumber}</div>
                <div style={{fontWeight:700,color:"#fff",fontSize:13}}>{c.playerName}</div>
                <div style={{marginLeft:"auto",fontSize:10,color:"#374151"}}>
                  {new Date(c.ts).toLocaleTimeString("fr-CA",{hour:"2-digit",minute:"2-digit"})}
                </div>
              </div>
              <div style={{fontSize:13,color:"#d1d5db",lineHeight:1.5,whiteSpace:"pre-wrap"}}>{c.text}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

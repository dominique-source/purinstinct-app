import { ZONES, ZK } from "../../../config/zones.js";
import { useZn } from "../../../hooks/useLang.js";

export function SurveyTab({players,onResetAllSurveys}){
  const zn=useZn();
  const respondents=players.filter(p=>p.surveyRanking&&p.surveyRanking.length===ZK.length);
  const total=respondents.length;
  // Calcul score par zone: position 1=6pts, 2=5pts, ..., 6=1pt
  const scores={};const firstVotes={};
  ZK.forEach(zk=>{scores[zk]=0;firstVotes[zk]=0;});
  respondents.forEach(p=>{
    p.surveyRanking.forEach((zk,i)=>{
      scores[zk]+=(ZK.length-i);
      if(i===0) firstVotes[zk]++;
    });
  });
  const ranked=[...ZK].sort((a,b)=>scores[b]-scores[a]);
  return(
    <div style={{padding:"0 0 16px"}}>
      <div style={{marginBottom:16,padding:"12px 16px",borderRadius:12,background:"#0d0f1a",border:"1px solid #1f2937",display:"flex",alignItems:"center",gap:12}}>
        <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:32,color:"#B8E020"}}>{total}</div>
        <div style={{fontSize:12,color:"#6b7280",flex:1}}>réponse{total!==1?"s":""} sur {players.length} joueur{players.length!==1?"s":""}</div>
        {total>0&&onResetAllSurveys&&<button onClick={()=>{if(window.confirm("Effacer tous les sondages ?")) onResetAllSurveys();}}
          style={{padding:"6px 12px",borderRadius:8,border:"none",background:"#ef4444",color:"#fff",cursor:"pointer",fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:12,flexShrink:0}}>
          🗑️ Remettre à 0
        </button>}
      </div>
      {total===0?(
        <div style={{textAlign:"center",padding:32,color:"#374151",fontSize:13}}>Aucune réponse pour l'instant.</div>
      ):(
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {ranked.map((zk,rank)=>{
            const z=ZONES[zk];const zl=zn(zk);
            const pct=total>0?Math.round((scores[zk]/(total*ZK.length))*100):0;
            const first=firstVotes[zk];
            const medals=["🥇","🥈","🥉","4️⃣","5️⃣","6️⃣"];
            return(
              <div key={zk} style={{borderRadius:14,background:"#0d0f1a",border:"1px solid "+z.border,padding:"12px 16px"}}>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
                  <span style={{fontSize:20}}>{medals[rank]}</span>
                  <span style={{fontSize:22}}>{z.icon}</span>
                  <span style={{flex:1,fontWeight:700,color:"#fff",fontSize:14}}>{zl.name}</span>
                  <span style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:20,color:z.color}}>{pct}%</span>
                </div>
                <div style={{height:6,borderRadius:3,background:"#1f2937",overflow:"hidden",marginBottom:6}}>
                  <div style={{height:"100%",width:pct+"%",background:z.color,borderRadius:3,transition:"width .5s"}}/>
                </div>
                <div style={{fontSize:11,color:"#4b5563"}}>
                  {first} choix #1 · Score {scores[zk]} pts
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

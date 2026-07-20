import { ZONES, ZK } from "../../../config/zones.js";
import { useZn } from "../../../hooks/useLang.js";
import { Panel } from "../../ui/Panel.jsx";
import { Button } from "../../ui/Button.jsx";
import { EmptyState } from "../../ui/Feedback.jsx";

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
    <div style={{maxWidth:"var(--pi-w-content)",margin:"0 auto",padding:"0 0 var(--pi-s4)"}}>
      <Panel style={{marginBottom:"var(--pi-s4)",display:"flex",alignItems:"center",gap:"var(--pi-s3)"}}>
        <div style={{fontFamily:"var(--pi-font-display)",fontWeight:900,fontSize:32,color:"var(--pi-lime)"}}>{total}</div>
        <div style={{fontSize:"var(--pi-fs-body)",color:"var(--pi-text-3)",flex:1}}>réponse{total!==1?"s":""} sur {players.length} joueur{players.length!==1?"s":""}</div>
        {total>0&&onResetAllSurveys&&<Button variant="danger" size="sm" style={{background:"var(--pi-danger)",color:"#fff",flexShrink:0}}
          onClick={()=>{if(window.confirm("Effacer tous les sondages ?")) onResetAllSurveys();}}>
          🗑️ Remettre à 0
        </Button>}
      </Panel>
      {total===0?(
        <EmptyState>Aucune réponse pour l'instant.</EmptyState>
      ):(
        <div style={{display:"flex",flexDirection:"column",gap:"var(--pi-s2)"}}>
          {ranked.map((zk,rank)=>{
            const z=ZONES[zk];const zl=zn(zk);
            const pct=total>0?Math.round((scores[zk]/(total*ZK.length))*100):0;
            const first=firstVotes[zk];
            const medals=["🥇","🥈","🥉","4️⃣","5️⃣","6️⃣"];
            return(
              <Panel key={zk} style={{borderColor:z.border}}>
                <div style={{display:"flex",alignItems:"center",gap:"var(--pi-s3)",marginBottom:"var(--pi-s2)"}}>
                  <span style={{fontSize:20}}>{medals[rank]}</span>
                  <span style={{fontSize:22}}>{z.icon}</span>
                  <span style={{flex:1,fontWeight:700,color:"var(--pi-text)",fontSize:"var(--pi-fs-body)"}}>{zl.name}</span>
                  <span style={{fontFamily:"var(--pi-font-display)",fontWeight:900,fontSize:20,color:z.color}}>{pct}%</span>
                </div>
                <div style={{height:6,borderRadius:3,background:"var(--pi-surface-3)",overflow:"hidden",marginBottom:6}}>
                  <div style={{height:"100%",width:pct+"%",background:z.color,borderRadius:3,transition:"width .5s"}}/>
                </div>
                <div style={{fontSize:"var(--pi-fs-label)",color:"var(--pi-text-3)"}}>
                  {first} choix #1 · Score {scores[zk]} pts
                </div>
              </Panel>
            );
          })}
        </div>
      )}
    </div>
  );
}

import { useState, useRef } from "react";
import html2canvas from "html2canvas";
import { ZONES, ZK } from "../../../config/zones.js";
import { useZn, useT } from "../../../hooks/useLang.js";
import { S } from "../../shared/styles.js";

const FullCard=({accent,today,cardRef,onSave,onBack,children})=>(
  <div style={{position:"fixed",inset:0,zIndex:60,background:"rgba(0,0,0,.95)",
    display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:20}}>
    {/* Carte visuelle — capturée par html2canvas */}
    <div ref={cardRef} onClick={onSave} style={{width:"100%",maxWidth:380,borderRadius:24,
      background:"#0a0c14",border:"2px solid "+(accent||"#B8E020"),padding:28,
      position:"relative",overflow:"hidden",cursor:"pointer",
      boxShadow:"0 0 60px "+(accent||"#B8E020")+"40"}}>
      {/* Barre couleur top */}
      <div style={{position:"absolute",top:0,left:0,right:0,height:4,
        background:`linear-gradient(90deg, ${accent||"#B8E020"}, ${accent||"#B8E020"}88)`}}/>
      {/* Logo texte */}
      <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:10,
        color:(accent||"#B8E020")+"80",letterSpacing:3,marginBottom:16,textAlign:"center",marginTop:8}}>
        PURINSTINCT GAMES · {today}
      </div>
      {children}
      {/* Hint tap — exclu de la capture */}
      <div data-html2canvas-ignore="true" style={{textAlign:"center",marginTop:12,fontSize:10,color:"#374151"}}>
        Appuyez pour enregistrer
      </div>
    </div>
    {/* Bouton retour */}
    <div style={{marginTop:16}}>
      <button onClick={onBack}
        style={{padding:"10px 24px",borderRadius:10,background:"#111827",color:"#9ca3af",
          border:"1px solid #374151",cursor:"pointer",fontWeight:700,fontSize:13}}>
        ← Retour
      </button>
    </div>
  </div>
);

const ClickCard=({accent,onClick,children})=>(
  <div onClick={onClick} style={{borderRadius:16,background:"#0d0f1a",border:"2px solid "+(accent||"#B8E020"),
    padding:20,marginBottom:12,position:"relative",overflow:"hidden",cursor:"pointer"}}
    onMouseEnter={e=>{e.currentTarget.style.background="#111827";e.currentTarget.style.boxShadow="0 0 20px "+(accent||"#B8E020")+"20";}}
    onMouseLeave={e=>{e.currentTarget.style.background="#0d0f1a";e.currentTarget.style.boxShadow="none";}}>
    <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:accent||"#B8E020"}}/>
    <div style={{position:"absolute",top:12,right:14,fontSize:16,color:(accent||"#B8E020")+"60"}}>↗</div>
    {children}
  </div>
);

export function WinnersTab({players,arenaState,winnersPublished,onPublishWinners,onUnpublishWinners}){
  const t=useT();
  const zn=useZn();
  const [winnerCard,setWinnerCard]=useState(null); // {type:"overall"|"top5"|"zone", zk?}
  const [savingCard,setSavingCard]=useState(false);
  const cardRef=useRef(null);

  const today=new Date().toLocaleDateString("fr-CA",{year:"numeric",month:"long",day:"numeric"});
  const ranked=[...players].sort((a,b)=>b.globalPoints-a.globalPoints);
  const top5=ranked.slice(0,5);
  const overall=ranked[0]||null;
  const activeZK=ZK.filter(zk=>!(arenaState.disabledZones||[]).includes(zk));
  const zoneChamps={};
  activeZK.forEach(zk=>{
    const played=players.filter(p=>(p.zonesPlayed||[]).includes(zk));
    if(played.length>0) zoneChamps[zk]=[...played].sort((a,b)=>((b.zoneScores||{})[zk]||50)-((a.zoneScores||{})[zk]||50))[0];
  });
  const zoneIcons={purinstinct:"🏟️",speed:"⚡",handAgility:"✋",footAgility:"👟",generalAgility:"🏃",iq:"🧠"};
  const zoneNames=Object.fromEntries(ZK.map(zk=>[zk,zn(zk).name]));
  const medals=["🥇","🥈","🥉","4️⃣","5️⃣"];

  // ── Plein écran visuel ──────────────────────────────────────
  if(winnerCard){
    const {type,zk}=winnerCard;

    const saveImage=async()=>{
      if(!cardRef.current||savingCard) return;
      setSavingCard(true);
      try{
        const canvas=await html2canvas(cardRef.current,{
          backgroundColor:"#0a0c14",scale:3,useCORS:true,
          logging:false,removeContainer:true
        });
        const url=canvas.toDataURL("image/png");
        const a=document.createElement("a");
        a.href=url; a.download="purinstinct-gagnant.png";
        a.click();
      }catch(e){console.error(e);}
      setSavingCard(false);
    };

    const onBack=()=>setWinnerCard(null);

    // Carte Gagnant Overall
    if(type==="overall"&&overall){
      const streaks=ZK.filter(zk=>((overall.zoneStreaks||{})[zk]||0)>=2);
      return(
        <FullCard accent="#ca8a04" today={today} cardRef={cardRef} onSave={saveImage} onBack={onBack}>
          <div style={{textAlign:"center",marginBottom:16}}>
            <div style={{fontSize:52,lineHeight:1,marginBottom:8}}>🥇</div>
            <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:12,
              color:"#ca8a04",letterSpacing:3,marginBottom:6}}>GAGNANT</div>
            <div style={{color:"#fff",fontWeight:700,fontSize:26,marginBottom:4}}>{overall.name}</div>
            <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:48,
              color:"#B8E020",lineHeight:1}}>{overall.globalPoints}</div>
            <div style={{fontSize:12,color:"#4b5563",marginTop:2}}>points globaux</div>
          </div>
          {/* Zones */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6,marginBottom:12}}>
            {ZK.map(zk=>{
              const played=(overall.zonesPlayed||[]).includes(zk);
              return(
                <div key={zk} style={{borderRadius:10,padding:"8px 6px",textAlign:"center",
                  background:played?"#1a2e05":"#111827",
                  border:"1px solid "+(played?"#B8E02050":"#1f2937")}}>
                  <div style={{fontSize:18}}>{zoneIcons[zk]}</div>
                  <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:16,
                    color:played?"#B8E020":"#374151"}}>{(overall.zoneScores||{})[zk]||50}</div>
                  <div style={{fontSize:9,color:played?"#6b7280":"#1f2937",marginTop:1}}>{zoneNames[zk].split(" ")[0]}</div>
                </div>
              );
            })}
          </div>
          {streaks.length>0&&(
            <div style={{display:"flex",flexWrap:"wrap",gap:6,justifyContent:"center"}}>
              {streaks.map(zk=>(
                <span key={zk} style={{padding:"3px 8px",borderRadius:6,background:"#f9731620",
                  color:"#f97316",fontSize:11,fontWeight:700}}>
                  🔥 {zoneNames[zk]} ×{(overall.zoneStreaks||{})[zk]}
                </span>
              ))}
            </div>
          )}
        </FullCard>
      );
    }

    // Carte Top 5
    if(type==="top5"&&top5.length>0){
      return(
        <FullCard accent="#6366f1" today={today} cardRef={cardRef} onSave={saveImage} onBack={onBack}>
          <div style={{textAlign:"center",marginBottom:20}}>
            <div style={{fontSize:42,lineHeight:1,marginBottom:6}}>🏆</div>
            <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:12,
              color:"#6366f1",letterSpacing:3}}>CLASSEMENT FINAL</div>
          </div>
          {top5.map((p,i)=>(
            <div key={p.id} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 12px",
              borderRadius:12,marginBottom:6,
              background:i===0?"#1a1a2e":i===1?"#12121e":i===2?"#111118":"#0d0f1a",
              border:"1px solid "+(i===0?"#6366f140":i===1?"#6b728040":i===2?"#b4530940":"#1f2937")}}>
              <span style={{fontSize:20,width:28,textAlign:"center"}}>{medals[i]}</span>
              <span style={{color:"#fff",fontWeight:700,fontSize:15,flex:1}}>{p.name}</span>
              <div style={{textAlign:"right"}}>
                <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:22,
                  color:i===0?"#ca8a04":i===1?"#9ca3af":i===2?"#b45309":"#6b7280"}}>{p.globalPoints}</div>
                <div style={{fontSize:9,color:"#374151"}}>pts</div>
              </div>
            </div>
          ))}
        </FullCard>
      );
    }

    // Carte Champion de zone
    if(type==="zone"&&zk&&zoneChamps[zk]){
      const champ=zoneChamps[zk];
      const z=ZONES[zk];
      const hasStreak=((champ.zoneStreaks||{})[zk]||0)>=2;
      return(
        <FullCard accent={z.color} today={today} cardRef={cardRef} onSave={saveImage} onBack={onBack}>
          <div style={{textAlign:"center",marginBottom:20}}>
            <div style={{fontSize:56,lineHeight:1,marginBottom:10}}>{zoneIcons[zk]}</div>
            <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:11,
              color:z.color,letterSpacing:3,marginBottom:4}}>CHAMPION</div>
            <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:18,
              color:z.color,marginBottom:16}}>{zoneNames[zk].toUpperCase()}</div>
            <div style={{color:"#fff",fontWeight:700,fontSize:28,marginBottom:8}}>{champ.name}</div>
            <div style={{display:"inline-block",padding:"12px 24px",borderRadius:16,
              background:z.color+"20",border:"2px solid "+z.color+"60"}}>
              <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:52,
                color:z.color,lineHeight:1}}>{(champ.zoneScores||{})[zk]||50}</div>
              <div style={{fontSize:11,color:z.color+"80",marginTop:2}}>score de zone</div>
            </div>
            {hasStreak&&(
              <div style={{marginTop:14,padding:"6px 16px",borderRadius:20,
                background:"#f9731620",display:"inline-block"}}>
                <span style={{color:"#f97316",fontWeight:700,fontSize:14}}>
                  🔥 Série ×{(champ.zoneStreaks||{})[zk]}
                </span>
              </div>
            )}
            <div style={{marginTop:12,fontSize:13,color:"#4b5563",fontWeight:600}}>
              {champ.globalPoints} pts globaux
            </div>
          </div>
        </FullCard>
      );
    }

    return null;
  }

  // ── Liste des cartes ────────────────────────────────────────
  return(
    <div className="anim-up">
      {/* Bouton publier */}
      <div style={{...S.card(),marginBottom:16,border:"1px solid "+(winnersPublished?"#B8E02040":"#374151"),
        display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}>
        <div>
          <div style={{color:"#fff",fontWeight:700,fontSize:13}}>
            {winnersPublished?t.winnersPublished:t.publishWinners}
          </div>
          <div style={{color:"#4b5563",fontSize:11,marginTop:2}}>
            {winnersPublished?t.winnersVisible:t.winnersHidden}
          </div>
        </div>
        <button onClick={winnersPublished?onUnpublishWinners:onPublishWinners}
          style={{...S.btn(winnersPublished?"#374151":"#B8E020"),padding:"8px 16px",fontSize:12,
            color:winnersPublished?"#9ca3af":"#000",flexShrink:0}}>
          {winnersPublished?t.unpublish:t.publish}
        </button>
      </div>

      <div style={{...S.label(),marginBottom:4}}>Cartes de résultats</div>
      <div style={{fontSize:11,color:"#4b5563",marginBottom:16}}>Appuyez sur une carte pour l'agrandir et la partager</div>

      {/* Gagnant overall */}
      {overall&&(
        <ClickCard accent="#ca8a04" onClick={()=>setWinnerCard({type:"overall"})}>
          <div style={{...S.row(),gap:10}}>
            <span style={{fontSize:32}}>🥇</span>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:11,
                color:"#ca8a04",letterSpacing:2,marginBottom:2}}>GAGNANT PURINSTINCT GAMES</div>
              <div style={{color:"#fff",fontWeight:700,fontSize:17,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{overall.name}</div>
              <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:22,color:"#B8E020"}}>{overall.globalPoints} pts</div>
            </div>
          </div>
        </ClickCard>
      )}

      {/* Top 5 */}
      {top5.length>0&&(
        <ClickCard accent="#6366f1" onClick={()=>setWinnerCard({type:"top5"})}>
          <div style={{...S.row(),gap:10,marginBottom:10}}>
            <span style={{fontSize:28}}>🏆</span>
            <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:11,
              color:"#6366f1",letterSpacing:2}}>TOP {top5.length} CLASSEMENT</div>
          </div>
          {top5.slice(0,3).map((p,i)=>(
            <div key={p.id} style={{...S.row(),gap:8,padding:"3px 0"}}>
              <span style={{fontSize:14,width:20}}>{medals[i]}</span>
              <span style={{color:"#e5e7eb",fontSize:13,flex:1}}>{p.name}</span>
              <span style={{color:"#B8E020",fontWeight:700,fontSize:13}}>{p.globalPoints}</span>
            </div>
          ))}
          {top5.length>3&&<div style={{fontSize:11,color:"#4b5563",marginTop:4}}>+{top5.length-3} autres…</div>}
        </ClickCard>
      )}

      {/* Champions par zone — une carte par zone */}
      {ZK.filter(zk=>zoneChamps[zk]).map(zk=>{
        const champ=zoneChamps[zk];
        const z=ZONES[zk];
        return(
          <ClickCard key={zk} accent={z.color} onClick={()=>setWinnerCard({type:"zone",zk})}>
            <div style={{...S.row(),gap:10}}>
              <span style={{fontSize:28,flexShrink:0}}>{zoneIcons[zk]}</span>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:10,
                  color:z.color,letterSpacing:2,marginBottom:2}}>CHAMPION {zoneNames[zk].toUpperCase()}</div>
                <div style={{color:"#fff",fontWeight:700,fontSize:15,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{champ.name}</div>
                <div style={{...S.row(),gap:6,marginTop:2}}>
                  <span style={{color:z.color,fontWeight:700,fontSize:13}}>{cham(p.zoneScores||{})[zk]||50} pts zone</span>
                  {((champ.zoneStreaks||{})[zk]||0)>=2&&<span style={{color:"#f97316",fontSize:11}}>🔥×{(champ.zoneStreaks||{})[zk]}</span>}
                </div>
              </div>
            </div>
          </ClickCard>
        );
      })}

      {ranked.length===0&&(
        <div style={{textAlign:"center",padding:"40px 0",color:"#4b5563",fontSize:13}}>
          {t.noPlayersRegistered}
        </div>
      )}
    </div>
  );
}

import { useState, useRef, useEffect } from "react";
import html2canvas from "html2canvas";
import confetti from "canvas-confetti";
import { ZONES, ZK } from "../../../config/zones.js";
import { useZn } from "../../../hooks/useLang.js";
import { Button } from "../../ui/Button.jsx";
import { Eyebrow } from "../../ui/Panel.jsx";

const FullCard=({accent,today,cardRef,onSave,onBack,children})=>(
  <div style={{position:"fixed",inset:0,zIndex:"var(--pi-z-modal)",background:"rgba(0,0,0,.95)",
    display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"var(--pi-s5)"}}>
    <div ref={cardRef} onClick={onSave} style={{width:"100%",maxWidth:380,borderRadius:"var(--pi-r-lg)",
      background:"#0a0c14",border:`2px solid ${accent||"var(--pi-lime)"}`,padding:"var(--pi-s8) var(--pi-s6)",
      position:"relative",overflow:"hidden",cursor:"pointer",
      boxShadow:`0 0 60px ${accent||"var(--pi-lime)"}40`}}>
      <div style={{position:"absolute",top:0,left:0,right:0,height:4,
        background:`linear-gradient(90deg,${accent||"var(--pi-lime)"},${accent||"var(--pi-lime)"}88)`}}/>
      <div style={{fontFamily:"var(--pi-font-display)",fontWeight:900,fontSize:10,
        color:`${accent||"var(--pi-lime)"}80`,letterSpacing:3,marginBottom:"var(--pi-s4)",textAlign:"center",marginTop:8}}>
        PURINSTINCT GAMES · {today}
      </div>
      {children}
      <div data-html2canvas-ignore="true" style={{textAlign:"center",marginTop:"var(--pi-s3)",fontSize:"var(--pi-fs-meta)",color:"var(--pi-text-4)"}}>
        Appuyez pour enregistrer
      </div>
    </div>
    <div style={{marginTop:"var(--pi-s4)"}}>
      <Button variant="secondary" onClick={onBack}>← Retour</Button>
    </div>
  </div>
);

const ClickCard=({accent,onClick,children})=>(
  <div onClick={onClick} style={{borderRadius:"var(--pi-r-lg)",background:"var(--pi-surface-1)",border:`2px solid ${accent||"var(--pi-lime)"}`,
    padding:"var(--pi-s5)",marginBottom:"var(--pi-s3)",position:"relative",overflow:"hidden",cursor:"pointer"}}
    onMouseEnter={e=>{e.currentTarget.style.background="var(--pi-surface-2)";}}
    onMouseLeave={e=>{e.currentTarget.style.background="var(--pi-surface-1)";}}>
    <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:accent||"var(--pi-lime)"}}/>
    <div style={{position:"absolute",top:12,right:14,fontSize:16,color:`${accent||"var(--pi-lime)"}60`}}>↗</div>
    {children}
  </div>
);

export function PlayerWinnersTab({player,playerId,players,disabledZones}){
  const zn=useZn();
  const [playerWinnerCard,setPlayerWinnerCard]=useState(null);
  const [savingPlayerCard,setSavingPlayerCard]=useState(false);
  const [showCongrats,setShowCongrats]=useState(false);
  const playerCardRef=useRef(null);

  const savePlayerCard=async()=>{
    if(!playerCardRef.current||savingPlayerCard) return;
    setSavingPlayerCard(true);
    try{
      const canvas=await html2canvas(playerCardRef.current,{backgroundColor:"#0a0c14",scale:3,useCORS:true,logging:false,removeContainer:true});
      const url=canvas.toDataURL("image/png");
      const a=document.createElement("a");
      a.href=url; a.download="purinstinct-gagnant.png"; a.click();
    }catch(e){console.error(e);}
    setSavingPlayerCard(false);
  };

  const today=new Date().toLocaleDateString("fr-CA",{year:"numeric",month:"long",day:"numeric"});
  const ranked=[...players].sort((a,b)=>b.globalPoints-a.globalPoints);
  const top5=ranked.slice(0,5);
  const overall=ranked[0]||null;
  const activeZK=ZK.filter(zk=>!(disabledZones||[]).includes(zk));
  const zoneChamps={};
  activeZK.forEach(zk=>{
    const played=players.filter(p=>(p.zonesPlayed||[]).includes(zk));
    if(played.length>0) zoneChamps[zk]=[...played].sort((a,b)=>((b.zoneScores||{})[zk]||50)-((a.zoneScores||{})[zk]||50))[0];
  });
  const zoneIcons={purinstinct:"🏟️",speed:"⚡",handAgility:"✋",footAgility:"👟",generalAgility:"🏃",iq:"🧠"};
  const zoneNames=Object.fromEntries(ZK.map(zk=>[zk,zn(zk).name]));
  const medals=["🥇","🥈","🥉","4️⃣","5️⃣"];

  const isWinner=overall&&overall.id===playerId;
  const isTop5=top5.some(p=>p.id===playerId);
  const isZoneChamp=activeZK.some(zk=>zoneChamps[zk]&&zoneChamps[zk].id===playerId);
  const isFeatured=isWinner||isTop5||isZoneChamp;

  // Déclencher confetti + félicitations quand isFeatured passe à true (effet, pas pendant le render).
  // Pas de ref-guard ici: le cleanup annule proprement les timers si l'effet est ré-invoqué
  // (StrictMode dev double-invoke) — un ref persistant bloquerait le re-scheduling du timer de fermeture.
  useEffect(()=>{
    if(!isFeatured) return;
    setShowCongrats(true);
    const fire=(opts)=>confetti({particleCount:80,spread:70,origin:{y:0.6},...opts});
    const timers=[
      setTimeout(()=>fire({colors:["#B8E020","#ca8a04","#fff","#6366f1"]}),100),
      setTimeout(()=>fire({angle:60,origin:{x:0,y:0.7}}),350),
      setTimeout(()=>fire({angle:120,origin:{x:1,y:0.7}}),550),
      setTimeout(()=>setShowCongrats(false),3200),
    ];
    return()=>timers.forEach(clearTimeout);
  },[isFeatured]);

  if(showCongrats) return(
    <div className="pi-anim-pop" style={{position:"fixed",inset:0,zIndex:"var(--pi-z-toast)",
      display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
      background:"rgba(0,0,0,.85)",gap:"var(--pi-s4)",pointerEvents:"none"}}>
      <div style={{fontSize:72,lineHeight:1}}>🎉</div>
      <div style={{fontFamily:"var(--pi-font-display)",fontWeight:900,fontSize:42,
        color:"var(--pi-lime)",textAlign:"center",letterSpacing:2}}>FÉLICITATIONS !</div>
      <div style={{color:"var(--pi-text)",fontWeight:700,fontSize:22,textAlign:"center"}}>{player.name}</div>
      <div style={{color:"#ca8a04",fontSize:"var(--pi-fs-body)",fontWeight:600,textAlign:"center",lineHeight:2,padding:"0 var(--pi-s5)"}}>
        {(()=>{
          const f=player.gender==="F";
          const parts=[];
          if(isWinner) parts.push("🥇 Grand"+(f?"e":"")+" gagnant"+(f?"e":"")+" !");
          if(!isWinner&&isTop5) parts.push("🏆 Dans le Top 5 !");
          const champZones=activeZK.filter(zk=>zoneChamps[zk]&&zoneChamps[zk].id===playerId);
          if(champZones.length>0) parts.push("⚡ Champion"+(f?"ne":"")+" — "+champZones.map(zk=>zoneNames[zk]).join(", ")+" !");
          return parts.map((p,i)=><div key={i}>{p}</div>);
        })()}
      </div>
    </div>
  );

  if(playerWinnerCard){
    const {type,zk}=playerWinnerCard;
    const onBack=()=>setPlayerWinnerCard(null);

    if(type==="overall"&&overall){
      const streaks=activeZK.filter(zk2=>((overall.zoneStreaks||{})[zk2]||0)>=2);
      return(<FullCard accent="#ca8a04" today={today} cardRef={playerCardRef} onSave={savePlayerCard} onBack={onBack}>
        <div style={{textAlign:"center",marginBottom:"var(--pi-s4)"}}>
          <div style={{fontSize:52,lineHeight:1,marginBottom:8}}>🥇</div>
          <div style={{fontFamily:"var(--pi-font-display)",fontWeight:900,fontSize:12,color:"#ca8a04",letterSpacing:3,marginBottom:6}}>GAGNANT</div>
          <div style={{color:"var(--pi-text)",fontWeight:700,fontSize:26,marginBottom:4}}>{overall.name}</div>
          <div style={{fontFamily:"var(--pi-font-display)",fontWeight:900,fontSize:48,color:"var(--pi-lime)",lineHeight:1}}>{overall.globalPoints}</div>
          <div style={{fontSize:"var(--pi-fs-body)",color:"var(--pi-text-3)",marginTop:2}}>points globaux</div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6,marginBottom:"var(--pi-s3)"}}>
          {activeZK.map(zk2=>{
            const played=(overall.zonesPlayed||[]).includes(zk2);
            return(<div key={zk2} style={{borderRadius:"var(--pi-r-md)",padding:"8px 6px",textAlign:"center",
              background:played?"#1a2e05":"var(--pi-surface-2)",border:`1px solid ${played?"#B8E02050":"var(--pi-line)"}`}}>
              <div style={{fontSize:18}}>{zoneIcons[zk2]}</div>
              <div style={{fontFamily:"var(--pi-font-display)",fontWeight:900,fontSize:16,color:played?"var(--pi-lime)":"var(--pi-text-4)"}}>{(overall.zoneScores||{})[zk2]||50}</div>
              <div style={{fontSize:9,color:played?"var(--pi-text-3)":"var(--pi-text-4)",marginTop:1}}>{zoneNames[zk2].split(" ")[0]}</div>
            </div>);
          })}
        </div>
        {streaks.length>0&&<div style={{display:"flex",flexWrap:"wrap",gap:6,justifyContent:"center"}}>
          {streaks.map(zk2=>(<span key={zk2} style={{padding:"3px 8px",borderRadius:"var(--pi-r-sm)",background:"var(--pi-warn-wash)",color:"var(--pi-warn)",fontSize:11,fontWeight:700}}>🔥 {zoneNames[zk2]} ×{(overall.zoneStreaks||{})[zk2]}</span>))}
        </div>}
      </FullCard>);
    }
    if(type==="top5"&&top5.length>0){
      return(<FullCard accent="#6366f1" today={today} cardRef={playerCardRef} onSave={savePlayerCard} onBack={onBack}>
        <div style={{textAlign:"center",marginBottom:"var(--pi-s5)"}}>
          <div style={{fontSize:42,lineHeight:1,marginBottom:6}}>🏆</div>
          <div style={{fontFamily:"var(--pi-font-display)",fontWeight:900,fontSize:12,color:"#6366f1",letterSpacing:3}}>CLASSEMENT FINAL</div>
        </div>
        {top5.map((p,i)=>(
          <div key={p.id} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 12px",borderRadius:"var(--pi-r-md)",marginBottom:6,
            background:i===0?"#1a1a2e":i===1?"#12121e":i===2?"#111118":"var(--pi-surface-1)",
            border:`1px solid ${p.id===playerId?"#B8E02050":i===0?"#6366f140":"var(--pi-line)"}`}}>
            <span style={{fontSize:20,width:28,textAlign:"center"}}>{medals[i]}</span>
            <span style={{color:p.id===playerId?"var(--pi-lime)":"var(--pi-text)",fontWeight:700,fontSize:15,flex:1}}>{p.name}{p.id===playerId?" 👈":""}</span>
            <div style={{textAlign:"right"}}>
              <div style={{fontFamily:"var(--pi-font-display)",fontWeight:900,fontSize:22,
                color:i===0?"#ca8a04":i===1?"#9ca3af":i===2?"#b45309":"var(--pi-text-3)"}}>{p.globalPoints}</div>
            </div>
          </div>
        ))}
      </FullCard>);
    }
    if(type==="zone"&&zk&&zoneChamps[zk]){
      const champ=zoneChamps[zk]; const z=ZONES[zk];
      const hasStreak=((champ.zoneStreaks||{})[zk]||0)>=2;
      return(<FullCard accent={z.color} today={today} cardRef={playerCardRef} onSave={savePlayerCard} onBack={onBack}>
        <div style={{textAlign:"center",marginBottom:"var(--pi-s5)"}}>
          <div style={{fontSize:56,lineHeight:1,marginBottom:10}}>{zoneIcons[zk]}</div>
          <div style={{fontFamily:"var(--pi-font-display)",fontWeight:900,fontSize:11,color:z.color,letterSpacing:3,marginBottom:4}}>CHAMPION</div>
          <div style={{fontFamily:"var(--pi-font-display)",fontWeight:900,fontSize:18,color:z.color,marginBottom:"var(--pi-s4)"}}>{zoneNames[zk].toUpperCase()}</div>
          <div style={{color:champ.id===playerId?"var(--pi-lime)":"var(--pi-text)",fontWeight:700,fontSize:28,marginBottom:8}}>{champ.name}{champ.id===playerId?" 👈":""}</div>
          <div style={{display:"inline-block",padding:"12px 24px",borderRadius:"var(--pi-r-lg)",background:z.color+"20",border:`2px solid ${z.color}60`}}>
            <div style={{fontFamily:"var(--pi-font-display)",fontWeight:900,fontSize:52,color:z.color,lineHeight:1}}>{(champ.zoneScores||{})[zk]||50}</div>
            <div style={{fontSize:11,color:z.color+"80",marginTop:2}}>score de zone</div>
          </div>
          {hasStreak&&<div style={{marginTop:14,padding:"6px 16px",borderRadius:"var(--pi-r-pill)",background:"var(--pi-warn-wash)",display:"inline-block"}}>
            <span style={{color:"var(--pi-warn)",fontWeight:700,fontSize:14}}>🔥 Série ×{(champ.zoneStreaks||{})[zk]}</span>
          </div>}
        </div>
      </FullCard>);
    }
    return null;
  }

  return(
    <div className="pi-anim-up">
      <Eyebrow style={{marginBottom:4}}>🏆 Résultats finals</Eyebrow>
      <div style={{fontSize:"var(--pi-fs-label)",color:"var(--pi-text-3)",marginBottom:"var(--pi-s4)"}}>Appuyez sur une carte pour l'agrandir et enregistrer</div>

      {overall&&(
        <ClickCard accent="#ca8a04" onClick={()=>setPlayerWinnerCard({type:"overall"})}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:32}}>🥇</span>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:10,color:"#ca8a04",fontWeight:700,letterSpacing:2,marginBottom:2}}>GAGNANT</div>
              <div style={{color:"var(--pi-text)",fontWeight:700,fontSize:18,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{overall.name}{overall.id===playerId?" 👈":""}</div>
              <div style={{fontFamily:"var(--pi-font-display)",fontWeight:900,fontSize:24,color:"var(--pi-lime)"}}>{overall.globalPoints} pts</div>
            </div>
          </div>
        </ClickCard>
      )}

      {top5.length>0&&(
        <ClickCard accent="#6366f1" onClick={()=>setPlayerWinnerCard({type:"top5"})}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
            <span style={{fontSize:28}}>🏆</span>
            <div style={{fontFamily:"var(--pi-font-display)",fontWeight:900,fontSize:11,color:"#6366f1",letterSpacing:2}}>TOP {top5.length}</div>
          </div>
          {top5.slice(0,3).map((p,i)=>(
            <div key={p.id} style={{display:"flex",alignItems:"center",gap:8,padding:"3px 0"}}>
              <span style={{fontSize:14,width:20}}>{medals[i]}</span>
              <span style={{color:p.id===playerId?"var(--pi-lime)":"var(--pi-text-2)",fontSize:13,flex:1}}>{p.name}{p.id===playerId?" 👈":""}</span>
              <span style={{color:"var(--pi-lime)",fontWeight:700,fontSize:13}}>{p.globalPoints}</span>
            </div>
          ))}
        </ClickCard>
      )}

      {activeZK.filter(zk=>zoneChamps[zk]).map(zk=>{
        const champ=zoneChamps[zk]; const z=ZONES[zk];
        return(
          <ClickCard key={zk} accent={z.color} onClick={()=>setPlayerWinnerCard({type:"zone",zk})}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <span style={{fontSize:28,flexShrink:0}}>{zoneIcons[zk]}</span>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:10,color:z.color,fontWeight:700,letterSpacing:2,marginBottom:2}}>CHAMPION {zoneNames[zk].toUpperCase()}</div>
                <div style={{color:champ.id===playerId?"var(--pi-lime)":"var(--pi-text)",fontWeight:700,fontSize:15,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                  {champ.name}{champ.id===playerId?" 👈":""}
                </div>
                <div style={{display:"flex",alignItems:"center",gap:6,marginTop:2}}>
                  <span style={{color:z.color,fontWeight:700,fontSize:13}}>{(champ.zoneScores||{})[zk]||50} pts</span>
                  {((champ.zoneStreaks||{})[zk]||0)>=2&&<span style={{color:"var(--pi-warn)",fontSize:11}}>🔥×{(champ.zoneStreaks||{})[zk]}</span>}
                </div>
              </div>
            </div>
          </ClickCard>
        );
      })}
    </div>
  );
}

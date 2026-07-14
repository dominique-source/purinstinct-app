import { useState } from "react";
import { FONTS } from "../../config/fonts.js";
import { AUG_GAMES, AUG_COLOR, AUG_BG } from "../../config/zones.js";
import { useLang } from "../../hooks/useLang.js";
import { S } from "../shared/styles.js";
import { LangFooter } from "../shared/LangFooter.jsx";

export function AugmentedStation({gameId,gameState,onUpdate,onBack}){
  const {lang}=useLang();
  const game=AUG_GAMES.find(g=>g.id===gameId)||{id:gameId,img:"",fr:gameId,en:gameId};
  const [format,setFormat]=useState("1v1"); // "1v1"|"2v2"|"3v3"
  const [nameInput,setNameInput]=useState("");
  const {queue,activeMatch}=gameState;

  const teamSize=format==="1v1"?1:format==="2v2"?2:3;
  const needed=teamSize*2;

  const addToQueue=(name)=>{
    const n=name.trim();
    if(!n) return;
    onUpdate(gameId,{...gameState,queue:[...queue,n]});
    setNameInput("");
  };

  const removeFromQueue=(i)=>{
    const nq=[...queue]; nq.splice(i,1);
    onUpdate(gameId,{...gameState,queue:nq});
  };

  const generateMatch=()=>{
    if(queue.length<needed) return;
    const shuffled=[...queue].sort(()=>Math.random()-.5);
    const teamA=shuffled.slice(0,teamSize);
    const teamB=shuffled.slice(teamSize,needed);
    const remaining=shuffled.slice(needed);
    onUpdate(gameId,{queue:remaining,activeMatch:{teamA,teamB,format}});
  };

  const declareWinner=(winner)=>{
    onUpdate(gameId,{...gameState,activeMatch:null});
  };

  const cancelMatch=()=>{
    const restored=[...(activeMatch?.teamA||[]),...(activeMatch?.teamB||[]),...queue];
    onUpdate(gameId,{queue:restored,activeMatch:null});
  };

  return(
    <div style={{minHeight:"100vh",background:AUG_BG,fontFamily:"'DM Sans',sans-serif",
      display:"flex",flexDirection:"column",alignItems:"center",padding:"24px 16px 80px"}}>
      <style>{FONTS}</style>
      {/* Header */}
      <div style={{width:"100%",maxWidth:420,marginBottom:20}}>
        <button onClick={onBack} style={{...S.backBtn,marginBottom:14}}>🏠 Home</button>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <div style={{width:56,height:56,borderRadius:12,overflow:"hidden",flexShrink:0,
            border:"2px solid "+AUG_COLOR+"50"}}>
            <img src={game.img} alt={game[lang]}
              style={{width:"100%",height:"100%",objectFit:"cover"}}
              onError={e=>{e.target.style.display="none";}}/>
          </div>
          <div>
            <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,
              fontSize:10,color:AUG_COLOR,letterSpacing:3}}>MOMENT FACTORY</div>
            <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,
              fontSize:26,color:"#fff",lineHeight:1}}>{game[lang].toUpperCase()}</div>
          </div>
        </div>
      </div>

      <div style={{width:"100%",maxWidth:420,display:"flex",flexDirection:"column",gap:14}}>
        {/* Format selector */}
        {!activeMatch&&(
          <div style={{borderRadius:14,padding:14,background:"#1a0a2e",border:"1px solid "+AUG_COLOR+"40"}}>
            <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:12,
              color:AUG_COLOR,letterSpacing:2,marginBottom:10}}>FORMAT</div>
            <div style={{display:"flex",gap:8}}>
              {["1v1","2v2","3v3"].map(f=>(
                <button key={f} onClick={()=>setFormat(f)}
                  style={{flex:1,padding:"10px",borderRadius:10,border:"2px solid "+(format===f?AUG_COLOR:"#2a1040"),
                    background:format===f?AUG_COLOR+"30":"transparent",
                    color:format===f?"#fff":"#6b7280",
                    fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:18,cursor:"pointer"}}>
                  {f}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Active match */}
        {activeMatch&&(
          <div style={{borderRadius:14,padding:16,background:"#1a0a2e",border:"2px solid #84cc16"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
              <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:14,
                color:"#84cc16",letterSpacing:2}}>⚡ {activeMatch.format.toUpperCase()} EN COURS</div>
              <button onClick={cancelMatch}
                style={{fontSize:11,color:"#6b7280",background:"none",border:"none",cursor:"pointer"}}>
                ↩ Annuler
              </button>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr auto 1fr",gap:10,alignItems:"center",marginBottom:16}}>
              {/* Team A */}
              <div style={{borderRadius:10,padding:10,background:"#3b82f620",border:"1px solid #3b82f640",textAlign:"center"}}>
                <div style={{fontSize:10,color:"#3b82f6",fontWeight:700,marginBottom:6,letterSpacing:2}}>ÉQUIPE A</div>
                {activeMatch.teamA.map((n,i)=>(
                  <div key={i} style={{color:"#fff",fontWeight:600,fontSize:13,padding:"2px 0"}}>{n}</div>
                ))}
              </div>
              <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:22,color:"#4b5563"}}>VS</div>
              {/* Team B */}
              <div style={{borderRadius:10,padding:10,background:"#f9731620",border:"1px solid #f9731640",textAlign:"center"}}>
                <div style={{fontSize:10,color:"#f97316",fontWeight:700,marginBottom:6,letterSpacing:2}}>ÉQUIPE B</div>
                {activeMatch.teamB.map((n,i)=>(
                  <div key={i} style={{color:"#fff",fontWeight:600,fontSize:13,padding:"2px 0"}}>{n}</div>
                ))}
              </div>
            </div>
            <div style={{fontSize:12,color:"#4b5563",textAlign:"center",marginBottom:10}}>Qui a gagné ?</div>
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>declareWinner("A")}
                style={{flex:1,padding:"10px",borderRadius:10,border:"none",cursor:"pointer",
                  background:"#3b82f6",color:"#fff",fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:14}}>
                🏆 ÉQUIPE A
              </button>
              <button onClick={()=>declareWinner("B")}
                style={{flex:1,padding:"10px",borderRadius:10,border:"none",cursor:"pointer",
                  background:"#f97316",color:"#fff",fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:14}}>
                🏆 ÉQUIPE B
              </button>
            </div>
          </div>
        )}

        {/* Add to queue */}
        {!activeMatch&&(
          <div style={{borderRadius:14,padding:14,background:"#1a0a2e",border:"1px solid "+AUG_COLOR+"40"}}>
            <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:12,
              color:AUG_COLOR,letterSpacing:2,marginBottom:10}}>FILE D'ATTENTE ({queue.length})</div>
            <div style={{display:"flex",gap:8,marginBottom:12}}>
              <input value={nameInput} onChange={e=>setNameInput(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&addToQueue(nameInput)}
                placeholder="Nom du joueur..."
                style={{flex:1,padding:"10px 12px",borderRadius:10,border:"1px solid #2a1040",
                  background:"#0d0514",color:"#fff",fontSize:14,outline:"none"}}/>
              <button onClick={()=>addToQueue(nameInput)}
                style={{padding:"10px 16px",borderRadius:10,border:"none",cursor:"pointer",
                  background:AUG_COLOR,color:"#fff",fontWeight:700,fontSize:13}}>
                + Ajouter
              </button>
            </div>
            {queue.length>0&&(
              <div style={{display:"flex",flexDirection:"column",gap:4,maxHeight:200,overflowY:"auto"}}>
                {queue.map((name,i)=>(
                  <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 10px",
                    borderRadius:8,background:"#0d0514"}}>
                    <span style={{color:"#6b7280",fontSize:12,width:20}}>{i+1}.</span>
                    <span style={{color:"#fff",fontSize:13,flex:1}}>{name}</span>
                    <button onClick={()=>removeFromQueue(i)}
                      style={{background:"none",border:"none",color:"#4b5563",cursor:"pointer",fontSize:16}}>×</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Generate button */}
        {!activeMatch&&(
          <div style={{textAlign:"center"}}>
            {queue.length>=needed?(
              <button onClick={generateMatch}
                style={{width:"100%",padding:"14px",borderRadius:14,border:"none",cursor:"pointer",
                  background:AUG_COLOR,color:"#fff",fontFamily:"'Barlow Condensed',sans-serif",
                  fontWeight:900,fontSize:20,letterSpacing:1}}>
                ⚡ GÉNÉRER {format.toUpperCase()}
              </button>
            ):(
              <div style={{borderRadius:14,padding:14,background:"#1a0a2e",border:"1px solid #2a1040",
                textAlign:"center",color:"#4b5563",fontSize:13}}>
                {queue.length}/{needed} joueurs pour générer un {format}
                <div style={{height:6,borderRadius:3,background:"#0d0514",marginTop:10}}>
                  <div style={{height:"100%",borderRadius:3,background:AUG_COLOR,
                    width:Math.min(100,(queue.length/needed)*100)+"%",transition:"width .5s"}}/>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      <LangFooter/>
    </div>
  );
}

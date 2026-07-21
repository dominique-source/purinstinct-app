import { useState, useEffect, useRef } from "react";
import { FONTS } from "../../config/fonts.js";
import { ZONES, ZK, zn } from "../../config/zones.js";
import { useT } from "../../hooks/useLang.js";
import { S } from "../shared/styles.js";
import { ProgressChart } from "./ProgressChart.jsx";

export function PlayerDossier({player,onSave,onBack,embedded,onBecomeStation,onAddComment}){
  const t=useT();
  const [form,setForm]=useState({
    name:player.name||"",gender:player.gender||"M",age:player.age||"",
    email:player.email||"",instagram:player.instagram||"",
    tiktok:player.tiktok||"",snapchat:player.snapchat||"",
    photoConsent:player.photoConsent||false,videoConsent:player.videoConsent||false,
    profilePhoto:player.profilePhoto||null,highlights:player.highlights||[],
  });
  const [newUrl,setNewUrl]=useState("");
  const [newCap,setNewCap]=useState("");
  const [commentText,setCommentText]=useState("");
  const [commentSent,setCommentSent]=useState(false);
  const [surveyRanking,setSurveyRanking]=useState(()=>player.surveyRanking&&player.surveyRanking.length===ZK.length?[...player.surveyRanking]:[...ZK]);
  const [surveySubmitted,setSurveySubmitted]=useState(!!player.surveyRanking);
  useEffect(()=>{
    if(!player.surveyRanking){setSurveySubmitted(false);setSurveyRanking([...ZK]);}
  },[player.surveyRanking]);
  const [surveyDragIdx,setSurveyDragIdx]=useState(null);
  const [surveyOverIdx,setSurveyOverIdx]=useState(null);
  const surveyTouchRef=useRef({fromIdx:null});
  const surveyListRef=useRef(null);
  const [saved,setSaved]=useState(false);
  const fileRef=useRef(null);
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));

  const handlePhoto=(e)=>{
    const file=e.target.files[0]; if(!file) return;
    const reader=new FileReader();
    reader.onload=(ev)=>set("profilePhoto",ev.target.result);
    reader.readAsDataURL(file);
  };
  const addHl=()=>{
    if(!newUrl.trim()) return;
    set("highlights",[...form.highlights,{url:newUrl.trim(),cap:newCap.trim()}]);
    setNewUrl(""); setNewCap("");
  };
  const removeHl=(i)=>set("highlights",form.highlights.filter((_,j)=>j!==i));
  const surveyMoveUp=(i)=>{if(i===0)return;const r=[...surveyRanking];[r[i-1],r[i]]=[r[i],r[i-1]];setSurveyRanking(r);setSurveySubmitted(false);};
  const surveyMoveDown=(i)=>{if(i===surveyRanking.length-1)return;const r=[...surveyRanking];[r[i],r[i+1]]=[r[i+1],r[i]];setSurveyRanking(r);setSurveySubmitted(false);};
  const surveyDrop=(toIdx)=>{
    if(surveyDragIdx===null||surveyDragIdx===toIdx){setSurveyDragIdx(null);setSurveyOverIdx(null);return;}
    const r=[...surveyRanking];const[moved]=r.splice(surveyDragIdx,1);r.splice(toIdx,0,moved);
    setSurveyRanking(r);setSurveyDragIdx(null);setSurveyOverIdx(null);setSurveySubmitted(false);
  };
  const surveyTouchStart=(e,i)=>{e.preventDefault();surveyTouchRef.current.fromIdx=i;setSurveyDragIdx(i);navigator.vibrate&&navigator.vibrate(20);};
  const surveyTouchMove=(e)=>{
    if(surveyDragIdx===null)return;e.preventDefault();
    const touch=e.touches[0];const list=surveyListRef.current;if(!list)return;
    const items=[...list.querySelectorAll("[data-survey-item]")];
    for(let i=0;i<items.length;i++){const rect=items[i].getBoundingClientRect();if(touch.clientY>=rect.top&&touch.clientY<=rect.bottom){setSurveyOverIdx(i);return;}}
  };
  const surveyTouchEnd=()=>{if(surveyDragIdx!==null)surveyDrop(surveyOverIdx!==null?surveyOverIdx:surveyDragIdx);surveyTouchRef.current.fromIdx=null;};
  const handleSurveySubmit=()=>{onSave({...player,...form,surveyRanking});setSurveySubmitted(true);};

  const handleSave=()=>{
    onSave({...player,...form});
    setSaved(true); setTimeout(()=>setSaved(false),2200);
  };

  const inp={width:"100%",padding:"8px 12px",borderRadius:10,border:"1px solid #1f2937",
    background:"#0A0A0A",color:"#fff",fontSize:13,outline:"none"};

  const body=(
    <div style={{padding:embedded?0:16,display:"flex",flexDirection:"column",gap:12}}>

      {/* Photo + identity */}
      <div style={{...S.card(),display:"flex",gap:14,alignItems:"flex-start"}}>
        <div style={{flexShrink:0,display:"flex",flexDirection:"column",alignItems:"center",gap:6}}>
          <div onClick={()=>fileRef.current&&fileRef.current.click()} style={{
            width:80,height:80,borderRadius:16,overflow:"hidden",cursor:"pointer",
            background:"#111827",border:"2px solid #374151",
            display:"flex",alignItems:"center",justifyContent:"center"}}>
            {form.profilePhoto
              ?<img src={form.profilePhoto} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
              :<div style={{textAlign:"center"}}>
                <div style={{fontSize:28}}>👤</div>
                <div style={{fontSize:9,color:"#4b5563",marginTop:2}}>Ajouter photo</div>
              </div>}
          </div>
          <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} style={{display:"none"}}/>
          {form.profilePhoto&&(
            <button onClick={()=>set("profilePhoto",null)}
              style={{fontSize:10,color:"#6b7280",background:"none",border:"none",cursor:"pointer"}}>Retirer</button>
          )}
          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontStyle:"italic",fontSize:26,
            color:"#B8E020",lineHeight:1}}>#{player.number}</div>
        </div>
        <div style={{flex:1,display:"flex",flexDirection:"column",gap:8}}>
          <div>
            <div style={{...S.label(),marginBottom:4}}>{t.fullName}</div>
            <input value={form.name} onChange={e=>set("name",e.target.value)} style={inp}/>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6}}>
            <div style={{gridColumn:"1/3"}}>
              <div style={{...S.label(),marginBottom:3}}>Sexe</div>
              <select value={form.gender} onChange={e=>set("gender",e.target.value)}
                style={{...inp,appearance:"none"}}>
                <option value="M">Masculin</option>
                <option value="F">Feminin</option>
                <option value="X">Autre / N/A</option>
              </select>
            </div>
            <div>
              <div style={{...S.label(),marginBottom:3}}>Age</div>
              <input type="number" min="5" max="99" value={form.age}
                onChange={e=>set("age",e.target.value)} placeholder="--" style={inp}/>
            </div>
          </div>
        </div>
      </div>

      {/* Contact + social */}
      <div style={{...S.card()}}>
        <div style={{...S.label(),marginBottom:10}}>Contact et reseaux sociaux</div>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {[["email","📧 Email","email@exemple.com"],
            ["instagram","📸 Instagram","@username"],
            ["tiktok","🎵 TikTok","@username"],
            ["snapchat","👻 Snapchat","username"]
          ].map(([k,lbl,ph])=>(
            <div key={k}>
              <div style={{...S.label(),marginBottom:3}}>{lbl}</div>
              <input value={form[k]||""} onChange={e=>set(k,e.target.value)}
                placeholder={ph} style={inp}/>
            </div>
          ))}
        </div>
      </div>

      {/* Graphique historique */}
      {(player.history||[]).length>0&&(
        <div style={{...S.card()}}>
          <div style={{...S.label(),marginBottom:12}}>📈 Progression en séance</div>
          <ProgressChart player={player}/>
        </div>
      )}

      {/* Historique des activités */}
      {(player.history||[]).length>0&&(
        <div style={{...S.card()}}>
          <div style={{...S.label(),marginBottom:10}}>Historique ({(player.history||[]).length})</div>
          <div style={{display:"flex",flexDirection:"column",gap:4}}>
            {[...(player.history||[])].reverse().map((h,i)=>{
              const zc=ZONES[h.zone];
              return(
                <div key={i} style={{...S.row(),padding:"8px 12px",borderRadius:10,
                  background:h.isWin?"#0d150899":"#1a060699",
                  border:"1px solid "+(h.isWin?zc.color+"30":"#dc262630")}}>
                  <span style={{fontSize:16,flexShrink:0}}>{zc.icon}</span>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,color:"#fff",fontWeight:600}}>{zc.name}</div>
                    <div style={{fontSize:11,color:"#4b5563",marginTop:1}}>
                      {h.isWin?"Victoire":h.isSecond?"2e place":"Défaite"}
                      {h.bonus?" · Bonus x1.5":""}
                      {h.newStreak>=2?" · Série "+h.newStreak+" 🔥":""}
                    </div>
                  </div>
                  <div style={{textAlign:"right",flexShrink:0}}>
                    <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:18,
                      color:h.delta>=0?"#B8E020":"#ef4444"}}>
                      {h.delta>0?"+":""}{h.delta} pts
                    </div>
                    {h.gp!==undefined&&<div style={{fontSize:10,color:"#4b5563"}}>{h.gp} total</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Sondage */}
      <div style={{...S.card()}}>
        <div style={{...S.label(),marginBottom:4}}>📊 Sondage — Zone préférée</div>
        <div style={{fontSize:11,color:"#4b5563",marginBottom:12}}>Glisse ou utilise les flèches pour classer les zones de ta préférée à ta moins préférée.</div>
        <div ref={surveyListRef} style={{display:"flex",flexDirection:"column",gap:6,userSelect:"none"}}
          onTouchMove={surveyTouchMove} onTouchEnd={surveyTouchEnd}>
          {surveyRanking.map((zk,i)=>{
            const z=ZONES[zk];const zl=zn(zk);
            const isDragging=surveyDragIdx===i;const isOver=surveyOverIdx===i;
            return(
              <div key={zk} data-survey-item="1"
                draggable
                onDragStart={()=>setSurveyDragIdx(i)}
                onDragOver={e=>{e.preventDefault();setSurveyOverIdx(i);}}
                onDrop={()=>surveyDrop(i)}
                onDragEnd={()=>{setSurveyDragIdx(null);setSurveyOverIdx(null);}}
                style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:12,
                  background:isDragging?"#1a2e05":isOver?"#0d1a30":"#0d0f1a",
                  border:"1px solid "+(isOver?z.color+"80":isDragging?"#B8E02060":z.border),
                  opacity:isDragging?0.5:1,transition:"all .15s",cursor:"grab"}}>
                <div onTouchStart={(e)=>surveyTouchStart(e,i)}
                  style={{color:"#4b5563",fontSize:20,cursor:"grab",touchAction:"none",padding:"0 2px",lineHeight:1}}>⠿</div>
                <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:18,
                  color:i===0?"#f97316":i===1?"#eab308":"#4b5563",width:20,flexShrink:0}}>{i+1}</div>
                <span style={{fontSize:22}}>{z.icon}</span>
                <span style={{flex:1,fontSize:13,fontWeight:700,color:"#fff"}}>{zl.name}</span>
                <button onClick={()=>surveyMoveUp(i)}
                  style={{background:"none",border:"none",cursor:"pointer",color:i===0?"#1f2937":"#6b7280",fontSize:18,lineHeight:1,padding:"0 3px"}}
                  disabled={i===0}>↑</button>
                <button onClick={()=>surveyMoveDown(i)}
                  style={{background:"none",border:"none",cursor:"pointer",color:i===surveyRanking.length-1?"#1f2937":"#6b7280",fontSize:18,lineHeight:1,padding:"0 3px"}}
                  disabled={i===surveyRanking.length-1}>↓</button>
              </div>
            );
          })}
        </div>
        <button onClick={handleSurveySubmit}
          style={{width:"100%",marginTop:14,padding:"12px",borderRadius:12,border:"none",cursor:"pointer",
            fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:16,
            background:surveySubmitted?"#22c55e":"#3b82f6",color:"#fff",transition:"background .3s"}}>
          {surveySubmitted?"✓ Réponse envoyée":"📤 Envoyer ma réponse"}
        </button>
      </div>

      {/* Commentaires */}
      {onAddComment&&(
        <div style={{...S.card()}}>
          <div style={{...S.label(),marginBottom:4}}>💬 Commentaires</div>
          <div style={{fontSize:11,color:"#4b5563",marginBottom:10}}>Écris un commentaire ou une suggestion pour l'organisateur.</div>
          <textarea
            value={commentText}
            onChange={e=>{setCommentText(e.target.value);setCommentSent(false);}}
            placeholder="Ton commentaire ici..."
            rows={3}
            style={{width:"100%",padding:"10px 12px",borderRadius:10,border:"1px solid #1f2937",
              background:"#0d0f1a",color:"#fff",fontSize:13,outline:"none",resize:"vertical",
              fontFamily:"'DM Sans',sans-serif",boxSizing:"border-box"}}
          />
          <button
            onClick={()=>{if(!commentText.trim())return;onAddComment(commentText.trim());setCommentText("");setCommentSent(true);}}
            disabled={!commentText.trim()}
            style={{width:"100%",marginTop:10,padding:"11px",borderRadius:10,border:"none",cursor:"pointer",
              fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:15,
              background:commentSent?"#22c55e":commentText.trim()?"#3b82f6":"#1f2937",
              color:commentText.trim()||commentSent?"#fff":"#4b5563",transition:"background .3s"}}>
            {commentSent?"✓ Commentaire envoyé !":"📤 Envoyer"}
          </button>
        </div>
      )}

      <button onClick={handleSave} style={{
        padding:"14px",borderRadius:14,border:"none",cursor:"pointer",width:"100%",
        fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:18,
        background:saved?"#22c55e":"#B8E020",color:"#000",transition:"background .3s"}}>
        {saved?t.savedMsg:t.saveBtn}
      </button>
    </div>
  );

  if(embedded) return body;

  return(
    <div style={{minHeight:"100vh",background:"#0A0A0A",fontFamily:"'DM Sans',sans-serif"}}>
      <style>{FONTS}</style>
      <div style={{position:"sticky",top:0,zIndex:10,
        paddingTop:"calc(env(safe-area-inset-top) + 12px)",paddingBottom:"12px",paddingLeft:"16px",paddingRight:"16px",
        background:"#0A0A0A",borderBottom:"1px solid #111827",
        display:"flex",alignItems:"center",gap:12}}>
        {onBack&&<button onClick={onBack} style={{...S.backBtn}}>{t.back}</button>}
        <div style={{flex:1}}>
          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:16,color:"#B8E020"}}>
            #{player.number}
          </div>
          <div style={{fontSize:11,color:"#4b5563"}}>{form.name}</div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:6}}>
          {onBecomeStation&&<button onClick={onBecomeStation}
            style={{padding:"6px 10px",borderRadius:10,border:"1px solid #f9731650",background:"#1a0d00",
              color:"#f97316",cursor:"pointer",fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:12}}>
            📍
          </button>}
          <button onClick={handleSave} style={{...S.btn(saved?"#22c55e":"#B8E020"),padding:"8px 16px"}}>
            {saved?t.saveOK:t.save}
          </button>
        </div>
      </div>
      <div style={{overflowY:"auto"}}>{body}</div>
    </div>
  );
}

import { useState } from "react";
import QRCode from "qrcode";
import { useZn, useT } from "../../hooks/useLang.js";
import { S } from "../shared/styles.js";
import { RosterEditor } from "./RosterEditor.jsx";
import { BASE_URL } from "../../config/constants.js";

export function SessionPanel({rosters,players,allPlayers,activeRosterId,onActivate,onSetActiveRoster,onUpdateRoster,onAddPlayer,onCreateRoster,onDeleteRoster,onRemovePlayer,onOpenDossier,rosterCodes,onUpdateCodes,pendingSessions,onDismissPending,onPromotePending,onAddGroupToQueue}){
  const t=useT();
  const zn=useZn();
  const [editIdx,setEditIdx]=useState(null);
  const [addName,setAddName]=useState("");
  const [addGender,setAddGender]=useState("M");
  const [qrMap,setQrMap]=useState({});       // {rosterId: dataURL}
  const [activeQR,setActiveQR]=useState(null); // rosterId en vue QR
  const [expandedRosters,setExpandedRosters]=useState({}); // {rosterId: bool}
  const [acceptedIds,setAcceptedIds]=useState(new Set());

  const getCode=(id)=>(rosterCodes&&rosterCodes[id])||null;

  const generateCode=(id)=>{
    const code=String(Math.floor(1000+Math.random()*9000));
    onUpdateCodes&&onUpdateCodes({...(rosterCodes||{}),[id]:code});
    return code;
  };

  const generateQR=async(r,isPending=false)=>{
    let code=getCode(r.id)||generateCode(r.id);
    const url=`${BASE_URL}?session=${code}`;
    try{
      const dataUrl=await QRCode.toDataURL(url,{
        width:280,margin:2,
        color:{dark:"#000000",light:"#ffffff"},
        errorCorrectionLevel:"H"
      });
      setQrMap(prev=>({...prev,[r.id]:dataUrl}));
      setActiveQR(r.id);
      // Pointer l'admin vers ce roster sans réinitialiser les joueurs
      if(!isPending&&r.id!==activeRosterId&&onSetActiveRoster){
        onSetActiveRoster(r.id);
      }
      // Si session pending → la promouvoir dans les sessions régulières
      if(isPending&&onPromotePending){
        onPromotePending(r,code);
      }
    }catch(e){console.error(e);}
  };

  const downloadQR=(r)=>{
    const data=qrMap[r.id]; if(!data) return;
    const a=document.createElement("a");
    a.href=data; a.download=`QR-${r.name.replace(/\s+/g,"-")}.png`; a.click();
  };

  const handleAdd=()=>{
    const n=addName.trim();
    if(!n) return;
    onAddPlayer(n,addGender,null,activeRosterId||"main");
    setAddName("");
  };

  if(editIdx!==null){
    return(
      <RosterEditor
        roster={rosters[editIdx]}
        onSave={(updated)=>{onUpdateRoster(editIdx,updated);setEditIdx(null);}}
        onCancel={()=>setEditIdx(null)}
      />
    );
  }

  return(
    <div className="anim-up">
      {/* Current session */}
      <div style={{...S.card(),marginBottom:16,border:"1px solid #B8E02040"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
          <div>
            <div style={{color:"#B8E020",fontWeight:700,fontSize:14}}>{t.activeSession}</div>
            <div style={{color:"#6b7280",fontSize:12,marginTop:2}}>{players.length} {t.playerCount}</div>
          </div>
          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:28,color:"#B8E020"}}>{players.length}</div>
        </div>
        {/* Code + QR de la session active */}
        {(()=>{
          const activeCode=getCode(activeRosterId);
          const activeRoster=rosters.find(r=>r.id===activeRosterId);
          if(!activeCode&&!activeRoster) return null;
          return(
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",
              background:"#0d1508",clipPath:S.clip(10),padding:"10px 14px",marginBottom:12,
              border:"1px solid #B8E02040"}}>
              <div>
                <div style={{fontSize:10,color:"#4b5563",letterSpacing:2,textTransform:"uppercase",marginBottom:2}}>Code de la partie</div>
                {activeCode
                  ?<div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontStyle:"italic",fontSize:36,
                      color:"#B8E020",letterSpacing:8,lineHeight:1,textShadow:"0 0 24px #B8E02040"}}>{activeCode}</div>
                  :<div style={{fontSize:12,color:"#4b5563"}}>Aucun code — générer dans les listes</div>}
              </div>
              {activeCode&&activeRoster&&(
                <button onClick={()=>generateQR(activeRoster)}
                  style={{...S.btn("#B8E020"),padding:"8px 14px",fontSize:13,fontWeight:700}}>
                  📲 QR
                </button>
              )}
            </div>
          );
        })()}
        {/* Joueurs de la session active seulement */}
        {players.length>0&&(
          <div style={{display:"flex",flexDirection:"column",gap:3,marginBottom:12,maxHeight:200,overflowY:"auto"}}>
            {[...players].sort((a,b)=>b.id-a.id).map(p=>(
              <div key={p.id} style={{...S.row(),gap:8,padding:"5px 10px",borderRadius:8,background:"#111827"}}>
                <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:13,
                  color:"#B8E020",width:22,flexShrink:0}}>#{p.number}</div>
                <span style={{color:"#fff",fontSize:12,flex:1}}>{p.name}</span>
                <span style={{fontSize:10,color:"#4b5563"}}>{p.gender==="F"?"F":"H"}</span>
                {onOpenDossier&&<button onClick={()=>onOpenDossier(p.id)}
                  style={{fontSize:10,padding:"2px 6px",borderRadius:6,border:"1px solid #374151",
                    background:"#1f2937",color:"#9ca3af",cursor:"pointer"}}>Profil</button>}
                {onRemovePlayer&&<button onClick={()=>{if(window.confirm("Supprimer "+p.name+" ?"))onRemovePlayer(p.id);}}
                  style={{fontSize:10,padding:"2px 6px",borderRadius:6,border:"1px solid #ef444440",
                    background:"#ef444415",color:"#ef4444",cursor:"pointer"}}
                  onMouseEnter={e=>e.currentTarget.style.background="#ef444430"}
                  onMouseLeave={e=>e.currentTarget.style.background="#ef444415"}>Supprimer</button>}
              </div>
            ))}
          </div>
        )}
        <div style={{...S.label(),marginBottom:8}}>{t.addNow}</div>
        <div style={{display:"flex",gap:8}}>
          <input value={addName} onChange={e=>setAddName(e.target.value)}
            onKeyDown={e=>{if(e.key==="Enter")handleAdd();}}
            placeholder={t.playerName}
            style={{flex:1,padding:"8px 12px",borderRadius:10,border:"1px solid #1f2937",background:"#0A0A0A",color:"#fff",fontSize:13,outline:"none"}}/>
          <select value={addGender} onChange={e=>setAddGender(e.target.value)}
            style={{padding:"8px 10px",borderRadius:10,border:"1px solid #1f2937",background:"#0A0A0A",color:"#9ca3af",fontSize:13,outline:"none"}}>
            <option value="M">H</option><option value="F">F</option>
          </select>
          <button onClick={handleAdd} style={{...S.btn("#B8E020"),padding:"8px 14px"}}>{t.addBtn}</button>
        </div>
      </div>

      {/* Vue QR plein écran */}
      {activeQR&&qrMap[activeQR]&&(()=>{
        const r=rosters.find(x=>x.id===activeQR);
        const code=getCode(activeQR);
        const url=`${BASE_URL}?session=${code}`;
        return(
          <div style={{position:"fixed",inset:0,zIndex:60,background:"rgba(0,0,0,.92)",
            display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:20}}>
            <div style={{...S.card(),border:"2px solid #B8E02040",maxWidth:340,width:"100%",textAlign:"center"}}>
              <div style={{color:"#fff",fontWeight:700,fontSize:16,marginBottom:4}}>{r?.name}</div>
              <div style={{fontSize:12,color:"#4b5563",marginBottom:16}}>
                Code de partie : <span style={{color:"#B8E020",fontWeight:900,fontSize:22,
                  fontFamily:"'Barlow Condensed',sans-serif"}}>{code}</span>
              </div>
              <div style={{display:"inline-block",padding:12,background:"#fff",borderRadius:12,marginBottom:12}}>
                <img src={qrMap[activeQR]} alt="QR" style={{width:200,height:200,display:"block"}}/>
              </div>
              <div style={{fontSize:10,color:"#374151",marginBottom:14,wordBreak:"break-all",
                padding:"6px 10px",borderRadius:8,background:"#111827"}}>{url}</div>
              <div style={{display:"flex",gap:8,justifyContent:"center"}}>
                <button onClick={()=>downloadQR(r)}
                  style={{...S.btn("#B8E020"),padding:"10px 18px",fontSize:13}}>⬇ Télécharger</button>
                <button onClick={()=>{navigator.clipboard&&navigator.clipboard.writeText(url);}}
                  style={{...S.btn(),padding:"10px 14px",fontSize:13}}>📋 Lien</button>
                <button onClick={()=>setActiveQR(null)}
                  style={{...S.btn(),padding:"10px 14px",fontSize:13}}>✕</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Sessions solo en attente */}
      {(()=>{
        const rosterIds=new Set(rosters.map(r=>r.id));
        const pending=(pendingSessions||[]).filter(s=>!rosterIds.has(s.id));
        if(pending.length===0) return null;
        return(
        <div style={{marginBottom:16}}>
          <div style={{...S.label(),marginBottom:10,color:"#f97316"}}>⏳ Sessions en attente de code ({pending.length})</div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {pending.map(s=>{
              const code=getCode(s.id);
              return(
                <div key={s.id} style={{...S.card(),border:"2px solid #f9731640"}}>
                  <div style={{...S.row(),gap:10,marginBottom:10}}>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{color:"#fff",fontWeight:700,fontSize:14}}>{s.name}</div>
                      <div style={{...S.row(),gap:8,marginTop:3}}>
                        <span style={{fontSize:11,color:"#4b5563"}}>{s.gender==="F"?"Femme":"Homme"}</span>
                        <span style={{fontSize:11,color:"#f97316"}}>Arrivé à {s.createdAt}</span>
                        {code&&<span style={{fontSize:16,color:"#B8E020",fontWeight:700,fontFamily:"'Barlow Condensed',sans-serif",letterSpacing:3}}>🔑 {code}</span>}
                      </div>
                    </div>
                    <button onClick={()=>onDismissPending&&onDismissPending(s.id)}
                      style={{background:"none",border:"none",cursor:"pointer",color:"#374151",fontSize:16}}
                      onMouseEnter={e=>e.target.style.color="#ef4444"}
                      onMouseLeave={e=>e.target.style.color="#374151"}>×</button>
                  </div>
                  {(()=>{
                    const groupPlayers=(allPlayers||[]).filter(p=>p.groupId===s.id);
                    return groupPlayers.length>0&&(
                      <div style={{fontSize:11,color:"#B8E020",marginBottom:8,fontWeight:600}}>
                        👥 {groupPlayers.length} joueur{groupPlayers.length>1?"s":""} dans cette session :&nbsp;
                        {groupPlayers.map(p=>p.name.split(" ")[0]).join(", ")}
                      </div>
                    );
                  })()}
                  <div style={{display:"flex",gap:6,marginBottom:6}}>
                    {onAddGroupToQueue&&<button onClick={(e)=>{
                        onAddGroupToQueue(s.id,s);
                        setAcceptedIds(prev=>new Set([...prev,s.id]));
                        e.currentTarget.textContent="✓ Accepté!";
                        e.currentTarget.style.background="#22c55e";
                        e.currentTarget.disabled=true;
                      }}
                      style={{...S.btn("#B8E020"),flex:1,padding:"8px",fontSize:12,color:"#000",fontWeight:700}}>
                      ✓ Accepter
                    </button>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        );
      })()}

      {/* Saved rosters */}
      <div style={{...S.label(),marginBottom:10}}>{t.savedLists}</div>
      <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:12}}>
        {rosters.map((r,i)=>{
          const code=getCode(r.id);
          const livePlayers=(allPlayers||[]).filter(p=>p.groupId===r.id);
          const liveCount=livePlayers.length;
          // Membres complets = joueurs live + entrées template non encore activées
          const liveNames=new Set(livePlayers.map(p=>p.name.toLowerCase()));
          const templateOnly=(r.entries||[]).filter(e=>!liveNames.has(e.name.toLowerCase()));
          const totalCount=liveCount+templateOnly.length;
          const isActive=r.id===activeRosterId;
          const isAccepted=acceptedIds.has(r.id);
          return(
            <div key={r.id} className={isAccepted?"pulse-accepted":""} style={{...S.card(),border:"1px solid "+(isActive?"#B8E020":code?"#B8E02030":"#1f2937")}}>
              <div style={{...S.row(),gap:8,marginBottom:8,flexWrap:"wrap"}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{...S.row(),gap:6}}>
                    <div style={{color:"#fff",fontWeight:600,fontSize:14}}>{r.name}</div>
                    {isActive&&<span style={{fontSize:10,color:"#B8E020",fontWeight:700,padding:"1px 6px",borderRadius:6,background:"#B8E02020"}}>ACTIVE</span>}
                  </div>
                  <div style={{...S.row(),gap:8,marginTop:3}}>
                    <span style={{fontSize:11,color:"#4b5563"}}>{(r.entries||[]).length} dans template</span>
                    {liveCount>0&&<span style={{fontSize:11,color:"#B8E020",fontWeight:700}}>👥 {liveCount} inscrits</span>}
                    {code&&<span style={{fontSize:16,color:"#B8E020",fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,letterSpacing:3}}>🔑 {code}</span>}
                  </div>
                </div>
              </div>
              {totalCount>0&&(
                <div style={{marginBottom:8}}>
                  <button onClick={()=>setExpandedRosters(prev=>({...prev,[r.id]:!prev[r.id]}))}
                    style={{width:"100%",padding:"6px 10px",borderRadius:10,border:"1px solid #B8E02040",
                      background:"#0d1508",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                    <span style={{fontSize:12,color:"#B8E020",fontWeight:700}}>
                      👥 {totalCount} membre{totalCount>1?"s":""}
                      {liveCount>0&&<span style={{fontSize:10,color:"#22c55e",marginLeft:6}}>({liveCount} inscrit{liveCount>1?"s":""})</span>}
                    </span>
                    <span style={{fontSize:11,color:"#4b5563"}}>{expandedRosters[r.id]?"▲ Masquer":"▼ Voir la liste"}</span>
                  </button>
                  {expandedRosters[r.id]&&(
                    <div style={{marginTop:4,background:"#111827",borderRadius:10,padding:"8px 10px",
                      display:"flex",flexDirection:"column",gap:3,maxHeight:200,overflowY:"auto"}}>
                      {livePlayers.sort((a,b)=>a.number-b.number).map(p=>(
                        <div key={p.id} style={{display:"flex",alignItems:"center",gap:8,padding:"3px 0",
                          borderBottom:"1px solid #1f2937"}}>
                          <span style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:13,
                            color:"#B8E020",width:24,flexShrink:0}}>#{p.number}</span>
                          <span style={{fontSize:12,color:"#fff",flex:1}}>{p.name}</span>
                          <span style={{fontSize:10,color:"#4b5563"}}>{p.gender==="F"?"F":"H"}</span>
                          {onOpenDossier&&<button onClick={()=>onOpenDossier(p.id)}
                            style={{fontSize:10,padding:"2px 6px",borderRadius:6,border:"1px solid #374151",
                              background:"#1f2937",color:"#9ca3af",cursor:"pointer"}}>Profil</button>}
                          {onRemovePlayer&&<button onClick={()=>{if(window.confirm("Supprimer "+p.name+" ?"))onRemovePlayer(p.id);}}
                            style={{fontSize:10,padding:"2px 6px",borderRadius:6,border:"1px solid #ef444440",
                              background:"#ef444415",color:"#ef4444",cursor:"pointer"}}
                            onMouseEnter={e=>e.currentTarget.style.background="#ef444430"}
                            onMouseLeave={e=>e.currentTarget.style.background="#ef444415"}>Supprimer</button>}
                        </div>
                      ))}
                      {templateOnly.map((e,i)=>(
                        <div key={"t"+i} style={{display:"flex",alignItems:"center",gap:8,padding:"3px 0",
                          borderBottom:"1px solid #1f2937",opacity:0.5}}>
                          <span style={{width:24,flexShrink:0,fontSize:11,color:"#4b5563"}}>—</span>
                          <span style={{fontSize:12,color:"#9ca3af",flex:1}}>{e.name}</span>
                          <span style={{fontSize:10,color:"#4b5563"}}>{e.gender==="F"?"F":"H"}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <div style={{display:"flex",gap:6,marginBottom:8}}>
                <button onClick={()=>setEditIdx(i)} style={{...S.btn(),flex:1,padding:"7px",fontSize:11}}>✏️ Modifier</button>
                <button onClick={()=>onActivate(i)} style={{...S.btn(isActive?"#374151":"#B8E020"),flex:1,padding:"7px",fontSize:11,opacity:isActive?0.5:1}}>{isActive?"✓ Active":"▶ Activer"}</button>
                <button onClick={()=>onDeleteRoster&&onDeleteRoster(i)}
                  style={{...S.btn("#ef444420"),flex:1,padding:"7px",fontSize:11,color:"#ef4444",border:"1px solid #ef444440"}}
                  onMouseEnter={e=>{e.currentTarget.style.background="#ef444430";}}
                  onMouseLeave={e=>{e.currentTarget.style.background="#ef444420";}}>
                  🗑 Supprimer
                </button>
              </div>
              <button onClick={()=>generateQR(r)}
                style={{...S.btn(code?"#111827":"#0d1508"),width:"100%",padding:"8px",fontSize:12,
                  border:"1px solid "+(code?"#374151":"#B8E02040"),color:code?"#6b7280":"#B8E020"}}>
                📲 {code?"Voir / Régénérer le QR":"Générer le QR code"}
              </button>
            </div>
          );
        })}
      </div>
      <button onClick={onCreateRoster}
        style={{...S.btn(),width:"100%",padding:"12px",fontSize:13,border:"1px dashed #374151"}}>
        {t.newList}
      </button>
    </div>
  );
}

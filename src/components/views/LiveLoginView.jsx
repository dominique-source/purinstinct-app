import { useState, useEffect } from "react";
import { FONTS } from "../../config/fonts.js";
import { ZONES, ZK, zn } from "../../config/zones.js";
import { S } from "../shared/styles.js";
import { LangFooter } from "../shared/LangFooter.jsx";
import { ADMIN_PIN, STATION_PIN } from "../../config/pins.js";

export function LiveLoginView({players,queues,onLogin,disabledZones,onGoTest,rosterCodes,onAddPlayer,onRequestSolo}){
  // Détecter le code de session dans l'URL (?session= ou ?code=)
  const _params=new URLSearchParams(window.location.search);
  const urlCode=_params.get("session")||_params.get("code")||null;

  // screen: "sessionCode" | "player" | "newPlayer" | "admin" | "station" | "stationPick"
  const [screen,setScreen]=useState(urlCode?"player":"sessionCode");
  const [sessionCode,setSessionCode]=useState(urlCode||"");
  const [sessionCodeError,setSessionCodeError]=useState(false);
  const [search,setSearch]=useState("");
  const [pin,setPin]=useState("");
  const [pinError,setPinError]=useState(false);
  const [newName,setNewName]=useState("");
  const [newGender,setNewGender]=useState("M");
  const [soloSubmitted,setSoloSubmitted]=useState(false);
  const [soloUnavailable,setSoloUnavailable]=useState(false);
  const [testUnavailable,setTestUnavailable]=useState(false);
  const [activeGroupId,setActiveGroupId]=useState("main");

  // Résoudre le groupId associé au code URL dès que rosterCodes est disponible
  useEffect(()=>{
    if(!urlCode||!rosterCodes) return;
    const entry=Object.entries(rosterCodes).find(([,v])=>v===urlCode);
    if(entry) setActiveGroupId(entry[0]);
  },[rosterCodes]);

  // Chercher dans TOUS les joueurs du code ET du groupe actif
  // (le code peut pointer vers un groupId différent des joueurs déjà inscrits)
  const groupPlayers=players.filter(p=>(p.groupId||"main")===activeGroupId);
  // Recherche dans tous les joueurs si le groupe est vide (fallback)
  const searchPool=groupPlayers.length>0?groupPlayers:players;
  const filtered=search.trim().length>0
    ?searchPool.filter(p=>p.name.toLowerCase().includes(search.toLowerCase())||String(p.number).includes(search))
    :[];

  const handleCreateSolo=()=>{
    if(!newName.trim()) return;
    onRequestSolo&&onRequestSolo(newName.trim(),newGender,(newId)=>{
      onLogin("player",newId);
    });
  };

  const handleAddToGroup=()=>{
    if(!newName.trim()) return;
    onAddPlayer&&onAddPlayer(newName.trim(),newGender,(newId)=>{
      onLogin("player",newId);
    },activeGroupId);
  };

  const handleAddToGroupWithName=(name)=>{
    if(!name.trim()) return;
    onAddPlayer&&onAddPlayer(name.trim(),newGender,(newId)=>{
      onLogin("player",newId);
    },activeGroupId);
  };

  // Valider le code de session
  const handleSessionCode=(code)=>{
    const c=code||sessionCode;
    if(c==="0000"){
      setSoloUnavailable(true); setSessionCodeError(false); setSessionCode(""); return;
    }
    // Trouver le groupId associé au code
    if(rosterCodes){
      const entry=Object.entries(rosterCodes).find(([,v])=>v===c);
      if(entry){
        const rosterId=entry[0];
        setActiveGroupId(rosterId); // chaque code = son groupe isolé
        setScreen("player"); setSessionCodeError(false); return;
      }
    }
    setSessionCodeError(true);
    setSessionCode("");
  };

  // PIN Admin / Station
  const handlePinSubmit=(role,value)=>{
    const entered=value!==undefined?value:pin;
    const expected=role==="admin"?ADMIN_PIN:STATION_PIN;
    if(entered===expected){
      setPinError(false);
      if(role==="admin") onLogin("adminHome",null);
      else setScreen("stationPick");
    } else {
      setPinError(true); setPin("");
    }
  };

  // Clavier numérique réutilisable
  const NumPad=({value,onChange,onComplete,maxLen=4})=>(
    <div>
      <div style={{display:"flex",justifyContent:"center",gap:12,marginBottom:20}}>
        {Array.from({length:maxLen}).map((_,i)=>(
          <div key={i} style={{width:18,height:18,borderRadius:"50%",
            background:i<value.length?"#84cc16":"#1f2937",
            border:"2px solid "+(i<value.length?"#84cc16":"#374151")}}/>
        ))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,maxWidth:260,margin:"0 auto"}}>
        {[1,2,3,4,5,6,7,8,9,"",0,"⌫"].map((k,i)=>(
          <button key={i} onClick={()=>{
            if(k==="") return;
            if(k==="⌫"){onChange(value.slice(0,-1));}
            else if(value.length<maxLen){
              const nv=value+k; onChange(nv);
              if(nv.length===maxLen) setTimeout(()=>onComplete(nv),150);
            }
          }} style={{padding:"16px",borderRadius:14,border:"1px solid #1f2937",
            background:k===""?"transparent":"#0d0f1a",color:"#fff",
            fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:22,
            cursor:k===""?"default":"pointer",opacity:k===""?0:1,
            boxShadow:k!==""?"0 2px 8px rgba(0,0,0,.3)":"none"}}
            onMouseEnter={e=>{if(k!=="")e.currentTarget.style.background="#1f2937";}}
            onMouseLeave={e=>{if(k!=="")e.currentTarget.style.background="#0d0f1a";}}>
            {k}
          </button>
        ))}
      </div>
    </div>
  );

  const Header=()=>(
    <div style={{textAlign:"center",marginBottom:28}}>
      <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontStyle:"italic",fontSize:64,letterSpacing:-2,lineHeight:1,
        textShadow:"0 0 40px #84cc1630"}}>
        <span style={{color:"#84cc16"}}>PUR</span><span style={{color:"#fff"}}>INSTINCT</span>
      </div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginTop:6}}>
        <span style={{width:24,height:2,background:"#84cc16",transform:"skewX(-20deg)"}}/>
        <span style={{color:"#84cc16",fontSize:12,letterSpacing:3,textTransform:"uppercase",fontWeight:700}}>
          PurInstinct Games
        </span>
        <span style={{width:24,height:2,background:"#84cc16",transform:"skewX(-20deg)"}}/>
      </div>
    </div>
  );

  return(<>
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",
      justifyContent:"center",padding:"32px 16px",background:"#06070f",fontFamily:"'DM Sans',sans-serif"}}>
      <style>{FONTS}</style>
      {onGoTest&&<button onClick={()=>setTestUnavailable(true)}
        style={{position:"fixed",bottom:16,right:16,fontSize:10,color:"#374151",
          background:"none",border:"1px solid #1f2937",borderRadius:8,padding:"4px 8px",cursor:"pointer"}}>
        Mode test
      </button>}
      {testUnavailable&&(
        <div onClick={()=>setTestUnavailable(false)} style={{position:"fixed",inset:0,zIndex:200,background:"rgba(0,0,0,.7)",
          display:"flex",alignItems:"center",justifyContent:"center"}}>
          <div style={{background:"#0d0f1a",borderRadius:16,padding:"24px 32px",border:"1px solid #f9731650",textAlign:"center",maxWidth:280}}
            onClick={e=>e.stopPropagation()}>
            <div style={{fontSize:32,marginBottom:12}}>🚫</div>
            <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:18,color:"#fff",marginBottom:8}}>Mode test non disponible</div>
            <div style={{fontSize:13,color:"#6b7280",marginBottom:16}}>Cette option n'est pas accessible aujourd'hui.</div>
            <button onClick={()=>setTestUnavailable(false)} style={{padding:"8px 24px",borderRadius:10,border:"none",background:"#f97316",color:"#000",fontWeight:700,fontSize:13,cursor:"pointer"}}>OK</button>
          </div>
        </div>
      )}

      <Header/>

      {/* ÉTAPE 1 — Code de session (si pas de QR) */}
      {screen==="sessionCode"&&(
        <div className="anim-up" style={{width:"100%",maxWidth:320}}>
          <div style={{textAlign:"center",marginBottom:20}}>
            <div style={{fontSize:32,marginBottom:8}}>🔑</div>
            <div style={{color:"#fff",fontWeight:700,fontSize:18,marginBottom:4}}>Code de session</div>
            <div style={{color:"#4b5563",fontSize:12}}>Entrez le code à 4 chiffres de votre session</div>
          </div>
          {sessionCodeError&&<div style={{textAlign:"center",color:"#ef4444",fontSize:12,marginBottom:12}}>
            Code invalide. Réessayez.
          </div>}
          {soloUnavailable&&<div style={{textAlign:"center",color:"#f97316",fontSize:12,marginBottom:12,padding:"8px 12px",borderRadius:10,background:"#1a0d00",border:"1px solid #f9731640"}}>
            Game solo non disponible aujourd'hui.
          </div>}
          <NumPad value={sessionCode} onChange={v=>{setSessionCode(v);setSessionCodeError(false);setSoloUnavailable(false);}}
            onComplete={handleSessionCode}/>
          {/* Boutons Admin + Station discrets en bas */}
          <div style={{display:"flex",gap:8,marginTop:24,justifyContent:"center"}}>
            <button onClick={()=>{setScreen("admin");setPin("");setPinError(false);}}
              style={{padding:"8px 16px",borderRadius:10,border:"1px solid #374151",background:"#111827",
                color:"#6b7280",cursor:"pointer",fontSize:12,display:"flex",alignItems:"center",gap:6}}
              onMouseEnter={e=>e.currentTarget.style.borderColor="#84cc16"}
              onMouseLeave={e=>e.currentTarget.style.borderColor="#374151"}>
              🛡️ Admin
            </button>
            <button onClick={()=>setScreen("stationPick")}
              style={{padding:"8px 16px",borderRadius:10,border:"1px solid #374151",background:"#111827",
                color:"#6b7280",cursor:"pointer",fontSize:12,display:"flex",alignItems:"center",gap:6}}
              onMouseEnter={e=>e.currentTarget.style.borderColor="#f97316"}
              onMouseLeave={e=>e.currentTarget.style.borderColor="#374151"}>
              📍 Responsable de plateau
            </button>
          </div>
        </div>
      )}

      {/* ÉTAPE 2b — Nouveau joueur solo (code 0000) */}
      {screen==="newPlayer"&&(
        <div className="anim-up" style={{width:"100%",maxWidth:360}}>
          {!soloSubmitted&&<button onClick={()=>{setScreen("sessionCode");setNewName("");setSoloSubmitted(false);}}
            style={{background:"none",border:"none",color:"#6b7280",fontSize:13,cursor:"pointer",marginBottom:20,padding:0}}>
            ← Retour
          </button>}

          {soloSubmitted?(
            /* Confirmation en attente */
            <div style={{textAlign:"center"}}>
              <div style={{fontSize:56,marginBottom:16}}>⏳</div>
              <div style={{color:"#fff",fontWeight:700,fontSize:20,marginBottom:8}}>
                Demande envoyée !
              </div>
              <div style={{color:"#84cc16",fontWeight:700,fontSize:16,marginBottom:12}}>{newName}</div>
              <div style={{color:"#6b7280",fontSize:13,lineHeight:1.6,marginBottom:24}}>
                Votre session est en attente.<br/>
                L'administrateur va créer votre session<br/>
                et vous fournir un code ou un QR code.
              </div>
              <div style={{...S.card(),border:"1px solid #84cc1630",textAlign:"left"}}>
                <div style={{fontSize:11,color:"#4b5563",marginBottom:6}}>EN ATTENTE DE VALIDATION</div>
                <div style={{color:"#fff",fontWeight:600}}>{newName}</div>
                <div style={{color:"#6b7280",fontSize:12}}>{newGender==="F"?"Femme":"Homme"}</div>
              </div>
            </div>
          ):(
            /* Formulaire */
            <div>
              <div style={{textAlign:"center",marginBottom:24}}>
                <div style={{fontSize:40,marginBottom:8}}>👤</div>
                <div style={{color:"#fff",fontWeight:700,fontSize:20,marginBottom:4}}>Nouvelle session</div>
                <div style={{color:"#4b5563",fontSize:13}}>Entrez votre nom complet</div>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:12}}>
                <input value={newName} onChange={e=>setNewName(e.target.value)}
                  onKeyDown={e=>{if(e.key==="Enter"&&newName.trim())handleCreateSolo();}}
                  placeholder="Prénom et nom"
                  autoFocus
                  style={{width:"100%",padding:"14px 16px",borderRadius:14,border:"2px solid #374151",
                    background:"#111827",color:"#fff",fontSize:16,outline:"none",boxSizing:"border-box"}}
                  onFocus={e=>e.target.style.borderColor="#84cc16"}
                  onBlur={e=>e.target.style.borderColor="#374151"}/>
                <div style={{display:"flex",gap:8}}>
                  {[["M","👨 Homme"],["F","👩 Femme"]].map(([v,l])=>(
                    <button key={v} onClick={()=>setNewGender(v)}
                      style={{flex:1,padding:"12px",borderRadius:12,
                        border:"2px solid "+(newGender===v?"#84cc16":"#374151"),
                        background:newGender===v?"#1a2e05":"#111827",
                        color:newGender===v?"#84cc16":"#6b7280",
                        cursor:"pointer",fontWeight:600,fontSize:14}}>
                      {l}
                    </button>
                  ))}
                </div>
                <button onClick={handleCreateSolo} disabled={!newName.trim()}
                  style={{padding:"14px",borderRadius:14,border:"none",cursor:newName.trim()?"pointer":"not-allowed",
                    background:newName.trim()?"#84cc16":"#1f2937",
                    color:newName.trim()?"#000":"#4b5563",
                    fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:18,
                    opacity:newName.trim()?1:0.5}}>
                  Envoyer ma demande
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ÉTAPE 2 — Recherche joueur */}
      {screen==="player"&&(
        <div className="anim-up" style={{width:"100%",maxWidth:380}}>
          {!urlCode&&<button onClick={()=>{setScreen("sessionCode");setSearch("");}}
            style={{background:"none",border:"none",color:"#6b7280",fontSize:13,cursor:"pointer",marginBottom:16,padding:0}}>
            ← Retour
          </button>}
          {sessionCode&&<div style={{textAlign:"center",marginBottom:20}}>
            <div style={{fontSize:11,color:"#4b5563",letterSpacing:2,textTransform:"uppercase",marginBottom:4}}>Code de session</div>
            <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontStyle:"italic",fontSize:52,color:"#84cc16",letterSpacing:6,lineHeight:1,textShadow:"0 0 30px #84cc1640"}}>{sessionCode}</div>
          </div>}
          <div style={{...S.card(),border:"1px solid #84cc1640",marginBottom:16}}>
            <div style={{fontSize:13,color:"#84cc16",fontWeight:700,marginBottom:12,textAlign:"center"}}>👤 Qui êtes-vous ?</div>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Entrez votre nom ou numéro..." autoFocus
              style={{width:"100%",padding:"12px 14px",borderRadius:12,border:"1px solid #374151",
                background:"#111827",color:"#fff",fontSize:16,outline:"none",boxSizing:"border-box",marginBottom:search.trim()?10:0}}/>
            {filtered.length>0&&(
              <div style={{display:"flex",flexDirection:"column",gap:4,maxHeight:240,overflowY:"auto"}}>
                {filtered.map(p=>(
                  <button key={p.id} onClick={()=>onLogin("player",p.id)}
                    style={{...S.row(),gap:12,padding:"10px 12px",borderRadius:10,border:"1px solid #1f2937",
                      background:"#0d0f1a",cursor:"pointer",textAlign:"left"}}
                    onMouseEnter={e=>e.currentTarget.style.background="#1f2937"}
                    onMouseLeave={e=>e.currentTarget.style.background="#0d0f1a"}>
                    <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:22,
                      color:"#84cc16",width:32,textAlign:"center",flexShrink:0}}>#{p.number}</div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{color:"#fff",fontWeight:600,fontSize:14}}>{p.name}</div>
                      <div style={{color:"#4b5563",fontSize:11,marginTop:1}}>{p.globalPoints} pts · {(p.zonesPlayed||[]).length}/6 zones</div>
                    </div>
                    <div style={{color:"#374151",fontSize:16}}>›</div>
                  </button>
                ))}
              </div>
            )}
            {search.trim().length>0&&filtered.length===0&&(
              <div style={{marginTop:10}}>
                <div style={{textAlign:"center",color:"#4b5563",fontSize:12,marginBottom:12}}>
                  Aucun joueur trouvé pour <strong style={{color:"#fff"}}>"{search}"</strong>
                </div>
                <div style={{borderTop:"1px solid #1f2937",paddingTop:12}}>
                  <div style={{fontSize:12,color:"#6b7280",marginBottom:10,textAlign:"center"}}>
                    Vous n'êtes pas encore dans ce groupe ?
                  </div>
                  <div style={{display:"flex",gap:8,marginBottom:8}}>
                    {[["M","👨 Homme"],["F","👩 Femme"]].map(([v,l])=>(
                      <button key={v} onClick={()=>setNewGender(v)}
                        style={{flex:1,padding:"8px",borderRadius:10,
                          border:"2px solid "+(newGender===v?"#84cc16":"#374151"),
                          background:newGender===v?"#1a2e05":"#111827",
                          color:newGender===v?"#84cc16":"#6b7280",
                          cursor:"pointer",fontWeight:600,fontSize:12}}>
                        {l}
                      </button>
                    ))}
                  </div>
                  <button onClick={()=>{setNewName(search);handleAddToGroupWithName(search);}}
                    style={{width:"100%",padding:"10px",borderRadius:10,border:"none",cursor:"pointer",
                      background:"#84cc16",color:"#000",fontFamily:"'Barlow Condensed',sans-serif",
                      fontWeight:900,fontSize:15}}>
                    + Rejoindre comme "{search}"
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* PIN Admin */}
      {screen==="admin"&&(
        <div style={{width:"100%",maxWidth:320}}>
          <button onClick={()=>{setScreen("sessionCode");setPin("");setPinError(false);}}
            style={{...S.backBtn,marginBottom:16}}>← Retour</button>
          <div style={{textAlign:"center",marginBottom:24}}>
            <div style={{fontSize:32,marginBottom:8}}>🛡️</div>
            <div style={{color:"#fff",fontWeight:700,fontSize:18}}>Accès Administrateur</div>
            <div style={{color:"#4b5563",fontSize:12,marginTop:4}}>Entrez votre code PIN</div>
          </div>
          {pinError&&<div style={{textAlign:"center",color:"#ef4444",fontSize:12,marginBottom:12}}>Code incorrect.</div>}
          <NumPad value={pin} onChange={v=>{setPin(v);setPinError(false);}} onComplete={v=>handlePinSubmit("admin",v)}/>
        </div>
      )}

      {/* PIN Station */}
      {screen==="station"&&(
        <div style={{width:"100%",maxWidth:320}}>
          <button onClick={()=>{setScreen("sessionCode");setPin("");setPinError(false);}}
            style={{...S.backBtn,marginBottom:16}}>← Retour</button>
          <div style={{textAlign:"center",marginBottom:24}}>
            <div style={{fontSize:32,marginBottom:8}}>📍</div>
            <div style={{color:"#fff",fontWeight:700,fontSize:18}}>Accès Responsable de station</div>
            <div style={{color:"#4b5563",fontSize:12,marginTop:4}}>Entrez votre code PIN</div>
          </div>
          {pinError&&<div style={{textAlign:"center",color:"#ef4444",fontSize:12,marginBottom:12}}>Code incorrect.</div>}
          <NumPad value={pin} onChange={v=>{setPin(v);setPinError(false);}} onComplete={v=>handlePinSubmit("station",v)}/>
        </div>
      )}

      {/* Choix station */}
      {screen==="stationPick"&&(
        <div className="anim-up" style={{width:"100%",maxWidth:380}}>
          <button onClick={()=>setScreen("station")}
            style={{...S.backBtn,marginBottom:16}}>← Retour</button>
          <div style={{color:"#fff",fontWeight:700,fontSize:16,marginBottom:16,textAlign:"center"}}>📍 Choisissez votre station</div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {ZK.map(zk=>{
              const z=ZONES[zk]; const zl=zn(zk);
              const isOff=(disabledZones||[]).includes(zk);
              return(
                <button key={zk} onClick={()=>onLogin("station",zk)}
                  style={{padding:"14px 16px",borderRadius:14,border:"1px solid "+(isOff?"#ef444440":z.border),
                    background:isOff?"#1a0a0a":z.bg,color:isOff?"#ef4444":z.color,cursor:"pointer",
                    display:"flex",alignItems:"center",gap:12,opacity:isOff?0.7:1}}
                  onMouseEnter={e=>{if(!isOff)e.currentTarget.style.borderColor=z.color;}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor=isOff?"#ef444440":z.border;}}>
                  <span style={{fontSize:22}}>{z.icon}</span>
                  <span style={{fontWeight:700,fontSize:14,flex:1,textAlign:"left"}}>{zl.name}</span>
                  {isOff&&<span style={{fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:10,
                    background:"#ef444420",color:"#ef4444",border:"1px solid #ef444440"}}>DÉSACTIVÉE</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
    <LangFooter/>
  </>);
}

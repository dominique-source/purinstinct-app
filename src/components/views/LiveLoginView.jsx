import { useState, useEffect } from "react";
import { ZONES, ZK, zn } from "../../config/zones.js";
import { LangFooter } from "../shared/LangFooter.jsx";
import { ADMIN_PIN, STATION_PIN, DEV_PIN } from "../../config/pins.js";
import { Button } from "../ui/Button.jsx";
import { Panel, Eyebrow } from "../ui/Panel.jsx";
import { Modal } from "../ui/Modal.jsx";

// Numeric keypad — dot progress indicator + 3x4 grid. Module-scope (not
// defined inside LiveLoginView) so it isn't recreated on every render.
function NumPad({value,onChange,onComplete,maxLen=4}){
  return(
    <div>
      <div style={{display:"flex",justifyContent:"center",gap:"var(--pi-s3)",marginBottom:"var(--pi-s5)"}}>
        {Array.from({length:maxLen}).map((_,i)=>(
          <div key={i} style={{width:18,height:18,borderRadius:"50%",
            background:i<value.length?"var(--pi-lime)":"var(--pi-surface-2)",
            border:`2px solid ${i<value.length?"var(--pi-lime)":"var(--pi-line-strong)"}`}}/>
        ))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"var(--pi-s2)",maxWidth:260,margin:"0 auto"}}>
        {[1,2,3,4,5,6,7,8,9,"",0,"⌫"].map((k,i)=>(
          <button key={i} onClick={()=>{
            if(k==="") return;
            if(k==="⌫"){onChange(value.slice(0,-1));}
            else if(value.length<maxLen){
              const nv=value+k; onChange(nv);
              if(nv.length===maxLen) setTimeout(()=>onComplete(nv),150);
            }
          }} style={{padding:"var(--pi-s4)",borderRadius:"var(--pi-r-lg)",border:"1px solid var(--pi-line)",
            background:k===""?"transparent":"var(--pi-surface-1)",color:"var(--pi-text)",
            fontFamily:"var(--pi-font-display)",fontWeight:700,fontSize:22,
            cursor:k===""?"default":"pointer",opacity:k===""?0:1,
            boxShadow:k!==""?"var(--pi-shadow-pop)":"none"}}
            onMouseEnter={e=>{if(k!=="")e.currentTarget.style.background="var(--pi-surface-2)";}}
            onMouseLeave={e=>{if(k!=="")e.currentTarget.style.background="var(--pi-surface-1)";}}>
            {k}
          </button>
        ))}
      </div>
    </div>
  );
}

// Wordmark — module-scope, no props/state.
function Wordmark(){
  return(
    <div style={{textAlign:"center",marginBottom:"var(--pi-s6)"}}>
      <img src={import.meta.env.BASE_URL+"purinstinct-games-logo.png"} alt="PürInstinct Games"
        style={{width:160,height:"auto",filter:"drop-shadow(0 0 40px var(--pi-lime-glow))"}}/>
    </div>
  );
}

export function LiveLoginView({players,queues,onLogin,disabledZones,onGoTest,rosterCodes,onAddPlayer,onRequestSolo,onDevMode}){
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
    if(c===DEV_PIN){
      onDevMode&&onDevMode();
      return;
    }
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

  return(<>
    <div style={{minHeight:"100svh",display:"flex",flexDirection:"column",alignItems:"center",
      justifyContent:"center",padding:"var(--pi-s8) var(--pi-gutter)"}}>
      <a href="/" style={{position:"fixed",top:16,left:16,zIndex:10,
        display:"flex",alignItems:"center",gap:10,padding:"12px 22px",borderRadius:"var(--pi-r-lg)",
        background:"var(--pi-surface-1)",border:"2px solid var(--pi-lime-line)",color:"var(--pi-lime)",textDecoration:"none",
        fontFamily:"var(--pi-font-display)",fontWeight:800,fontSize:17,letterSpacing:.5}}
        onMouseEnter={e=>{e.currentTarget.style.background="var(--pi-surface-2)";}}
        onMouseLeave={e=>{e.currentTarget.style.background="var(--pi-surface-1)";}}>
        <span style={{fontSize:20,lineHeight:1}}>←</span>Retour au site
      </a>
      {onGoTest&&<button onClick={()=>setTestUnavailable(true)}
        style={{position:"fixed",bottom:16,right:16,fontSize:10,color:"var(--pi-text-3)",
          background:"none",border:"1px solid var(--pi-line)",borderRadius:"var(--pi-r-sm)",padding:"4px 8px",cursor:"pointer"}}>
        Mode test
      </button>}
      <Modal open={testUnavailable} onClose={()=>setTestUnavailable(false)} labelledBy="test-unavail-title">
        <div style={{textAlign:"center"}}>
          <div style={{fontSize:32,marginBottom:"var(--pi-s3)"}}>🚫</div>
          <h2 id="test-unavail-title" style={{fontFamily:"var(--pi-font-display)",fontWeight:900,fontStyle:"italic",fontSize:"var(--pi-fs-section)",color:"var(--pi-text)",marginBottom:"var(--pi-s2)"}}>
            Mode test non disponible
          </h2>
          <div style={{fontSize:"var(--pi-fs-body)",color:"var(--pi-text-3)",marginBottom:"var(--pi-s4)"}}>Cette option n'est pas accessible aujourd'hui.</div>
          <Button variant="primary" onClick={()=>setTestUnavailable(false)}>OK</Button>
        </div>
      </Modal>

      <Wordmark/>

      {/* ÉTAPE 1 — Code de session (si pas de QR) */}
      {screen==="sessionCode"&&(
        <div className="pi-anim-up" style={{width:"100%",maxWidth:"var(--pi-w-narrow)"}}>
          <div style={{textAlign:"center",marginBottom:"var(--pi-s5)"}}>
            <div style={{fontSize:32,marginBottom:"var(--pi-s2)"}}>🔑</div>
            <div style={{color:"var(--pi-text)",fontWeight:700,fontSize:"var(--pi-fs-card)",marginBottom:4}}>Code de session</div>
            <div style={{color:"var(--pi-text-3)",fontSize:"var(--pi-fs-label)"}}>Entrez le code à 4 chiffres de votre session</div>
          </div>
          {sessionCodeError&&<div style={{textAlign:"center",color:"var(--pi-danger)",fontSize:"var(--pi-fs-label)",marginBottom:"var(--pi-s3)"}}>
            Code invalide. Réessayez.
          </div>}
          {soloUnavailable&&<div style={{textAlign:"center",color:"var(--pi-warn)",fontSize:"var(--pi-fs-label)",marginBottom:"var(--pi-s3)",
            padding:"var(--pi-s2) var(--pi-s3)",borderRadius:"var(--pi-r-md)",background:"var(--pi-warn-wash)",border:"1px solid var(--pi-warn)"}}>
            Game solo non disponible aujourd'hui.
          </div>}
          <NumPad value={sessionCode} onChange={v=>{setSessionCode(v);setSessionCodeError(false);setSoloUnavailable(false);}}
            onComplete={handleSessionCode}/>
          {/* Boutons Admin + Station discrets en bas */}
          <div style={{display:"flex",gap:"var(--pi-s2)",marginTop:"var(--pi-s6)",justifyContent:"center"}}>
            <Button variant="ghost" size="sm" onClick={()=>{setScreen("admin");setPin("");setPinError(false);}}>
              🛡️ Admin
            </Button>
            <Button variant="ghost" size="sm" onClick={()=>setScreen("stationPick")}>
              📍 Responsable de plateau
            </Button>
          </div>
        </div>
      )}

      {/* ÉTAPE 2b — Nouveau joueur solo (code 0000) */}
      {screen==="newPlayer"&&(
        <div className="pi-anim-up" style={{width:"100%",maxWidth:360}}>
          {!soloSubmitted&&<Button variant="ghost" size="sm" style={{marginBottom:"var(--pi-s5)"}}
            onClick={()=>{setScreen("sessionCode");setNewName("");setSoloSubmitted(false);}}>
            ← Retour
          </Button>}

          {soloSubmitted?(
            /* Confirmation en attente */
            <div style={{textAlign:"center"}}>
              <div style={{fontSize:56,marginBottom:"var(--pi-s4)"}}>⏳</div>
              <div style={{color:"var(--pi-text)",fontWeight:700,fontSize:20,marginBottom:"var(--pi-s2)"}}>
                Demande envoyée !
              </div>
              <div style={{color:"var(--pi-lime)",fontWeight:700,fontSize:16,marginBottom:"var(--pi-s3)"}}>{newName}</div>
              <div style={{color:"var(--pi-text-3)",fontSize:"var(--pi-fs-body)",lineHeight:1.6,marginBottom:"var(--pi-s6)"}}>
                Votre session est en attente.<br/>
                L'administrateur va créer votre session<br/>
                et vous fournir un code ou un QR code.
              </div>
              <Panel style={{borderColor:"var(--pi-lime-line)",textAlign:"left"}}>
                <Eyebrow style={{marginBottom:6}}>EN ATTENTE DE VALIDATION</Eyebrow>
                <div style={{color:"var(--pi-text)",fontWeight:600}}>{newName}</div>
                <div style={{color:"var(--pi-text-3)",fontSize:"var(--pi-fs-label)"}}>{newGender==="F"?"Femme":"Homme"}</div>
              </Panel>
            </div>
          ):(
            /* Formulaire */
            <div>
              <div style={{textAlign:"center",marginBottom:"var(--pi-s6)"}}>
                <div style={{fontSize:40,marginBottom:"var(--pi-s2)"}}>👤</div>
                <div style={{color:"var(--pi-text)",fontWeight:700,fontSize:20,marginBottom:4}}>Nouvelle session</div>
                <div style={{color:"var(--pi-text-3)",fontSize:"var(--pi-fs-body)"}}>Entrez votre nom complet</div>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:"var(--pi-s3)"}}>
                <input value={newName} onChange={e=>setNewName(e.target.value)}
                  onKeyDown={e=>{if(e.key==="Enter"&&newName.trim())handleCreateSolo();}}
                  placeholder="Prénom et nom" autoFocus className="pi-input"/>
                <div style={{display:"flex",gap:"var(--pi-s2)"}}>
                  {[["M","👨 Homme"],["F","👩 Femme"]].map(([v,l])=>(
                    <button key={v} onClick={()=>setNewGender(v)} className={newGender===v?"pi-tab is-active":"pi-tab"} style={{flex:1,minHeight:"var(--pi-ctrl-lg)"}}>
                      {l}
                    </button>
                  ))}
                </div>
                <Button variant="primary" size="lg" block disabled={!newName.trim()} onClick={handleCreateSolo}>
                  Envoyer ma demande
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ÉTAPE 2 — Recherche joueur */}
      {screen==="player"&&(
        <div className="pi-anim-up" style={{width:"100%",maxWidth:380}}>
          {!urlCode&&<Button variant="ghost" size="sm" style={{marginBottom:"var(--pi-s4)"}}
            onClick={()=>{setScreen("sessionCode");setSearch("");}}>
            ← Retour
          </Button>}
          {sessionCode&&<div style={{textAlign:"center",marginBottom:"var(--pi-s5)"}}>
            <Eyebrow style={{marginBottom:4}}>Code de session</Eyebrow>
            <div style={{fontFamily:"var(--pi-font-display)",fontWeight:900,fontStyle:"italic",fontSize:52,color:"var(--pi-lime)",letterSpacing:6,lineHeight:1,textShadow:"0 0 30px var(--pi-lime-glow)"}}>{sessionCode}</div>
          </div>}
          <Panel style={{borderColor:"var(--pi-lime-line)",marginBottom:"var(--pi-s4)"}}>
            <div style={{fontSize:"var(--pi-fs-body)",color:"var(--pi-lime)",fontWeight:700,marginBottom:"var(--pi-s3)",textAlign:"center"}}>👤 Qui êtes-vous ?</div>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Entrez votre nom ou numéro..." autoFocus
              className="pi-input" style={{marginBottom:search.trim()?10:0}}/>
            {filtered.length>0&&(
              <div style={{display:"flex",flexDirection:"column",gap:"var(--pi-s1)",maxHeight:240,overflowY:"auto"}}>
                {filtered.map(p=>(
                  <button key={p.id} onClick={()=>onLogin("player",p.id)}
                    style={{display:"flex",alignItems:"center",gap:"var(--pi-s3)",padding:"var(--pi-s3)",borderRadius:"var(--pi-r-md)",border:"1px solid var(--pi-line)",
                      background:"var(--pi-surface-1)",cursor:"pointer",textAlign:"left"}}
                    onMouseEnter={e=>e.currentTarget.style.background="var(--pi-surface-3)"}
                    onMouseLeave={e=>e.currentTarget.style.background="var(--pi-surface-1)"}>
                    <div style={{fontFamily:"var(--pi-font-display)",fontWeight:900,fontSize:22,
                      color:"var(--pi-lime)",width:32,textAlign:"center",flexShrink:0}}>#{p.number}</div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{color:"var(--pi-text)",fontWeight:600,fontSize:"var(--pi-fs-body)"}}>{p.name}</div>
                      <div style={{color:"var(--pi-text-3)",fontSize:"var(--pi-fs-label)",marginTop:1}}>{p.globalPoints} pts · {(p.zonesPlayed||[]).length}/6 zones</div>
                    </div>
                    <div style={{color:"var(--pi-text-4)",fontSize:16}}>›</div>
                  </button>
                ))}
              </div>
            )}
            {search.trim().length>0&&filtered.length===0&&(
              <div style={{marginTop:"var(--pi-s3)"}}>
                <div style={{textAlign:"center",color:"var(--pi-text-3)",fontSize:"var(--pi-fs-label)",marginBottom:"var(--pi-s3)"}}>
                  Aucun joueur trouvé pour <strong style={{color:"var(--pi-text)"}}>"{search}"</strong>
                </div>
                <div style={{borderTop:"1px solid var(--pi-line)",paddingTop:"var(--pi-s3)"}}>
                  <div style={{fontSize:"var(--pi-fs-label)",color:"var(--pi-text-2)",marginBottom:"var(--pi-s2)",textAlign:"center"}}>
                    Vous n'êtes pas encore dans ce groupe ?
                  </div>
                  <div style={{display:"flex",gap:"var(--pi-s2)",marginBottom:"var(--pi-s2)"}}>
                    {[["M","👨 Homme"],["F","👩 Femme"]].map(([v,l])=>(
                      <button key={v} onClick={()=>setNewGender(v)} className={newGender===v?"pi-tab is-active":"pi-tab"} style={{flex:1}}>
                        {l}
                      </button>
                    ))}
                  </div>
                  <Button variant="primary" block onClick={()=>{setNewName(search);handleAddToGroupWithName(search);}}>
                    + Rejoindre comme "{search}"
                  </Button>
                </div>
              </div>
            )}
          </Panel>
        </div>
      )}

      {/* PIN Admin */}
      {screen==="admin"&&(
        <div style={{width:"100%",maxWidth:"var(--pi-w-narrow)"}}>
          <Button variant="ghost" size="sm" style={{marginBottom:"var(--pi-s4)"}}
            onClick={()=>{setScreen("sessionCode");setPin("");setPinError(false);}}>← Retour</Button>
          <div style={{textAlign:"center",marginBottom:"var(--pi-s6)"}}>
            <div style={{fontSize:32,marginBottom:"var(--pi-s2)"}}>🛡️</div>
            <div style={{color:"var(--pi-text)",fontWeight:700,fontSize:"var(--pi-fs-card)"}}>Accès Administrateur</div>
            <div style={{color:"var(--pi-text-3)",fontSize:"var(--pi-fs-label)",marginTop:4}}>Entrez votre code PIN</div>
          </div>
          {pinError&&<div style={{textAlign:"center",color:"var(--pi-danger)",fontSize:"var(--pi-fs-label)",marginBottom:"var(--pi-s3)"}}>Code incorrect.</div>}
          <NumPad value={pin} onChange={v=>{setPin(v);setPinError(false);}} onComplete={v=>handlePinSubmit("admin",v)}/>
        </div>
      )}

      {/* PIN Station */}
      {screen==="station"&&(
        <div style={{width:"100%",maxWidth:"var(--pi-w-narrow)"}}>
          <Button variant="ghost" size="sm" style={{marginBottom:"var(--pi-s4)"}}
            onClick={()=>{setScreen("sessionCode");setPin("");setPinError(false);}}>← Retour</Button>
          <div style={{textAlign:"center",marginBottom:"var(--pi-s6)"}}>
            <div style={{fontSize:32,marginBottom:"var(--pi-s2)"}}>📍</div>
            <div style={{color:"var(--pi-text)",fontWeight:700,fontSize:"var(--pi-fs-card)"}}>Accès Responsable de station</div>
            <div style={{color:"var(--pi-text-3)",fontSize:"var(--pi-fs-label)",marginTop:4}}>Entrez votre code PIN</div>
          </div>
          {pinError&&<div style={{textAlign:"center",color:"var(--pi-danger)",fontSize:"var(--pi-fs-label)",marginBottom:"var(--pi-s3)"}}>Code incorrect.</div>}
          <NumPad value={pin} onChange={v=>{setPin(v);setPinError(false);}} onComplete={v=>handlePinSubmit("station",v)}/>
        </div>
      )}

      {/* Choix station */}
      {screen==="stationPick"&&(
        <div className="pi-anim-up" style={{width:"100%",maxWidth:380}}>
          <Button variant="ghost" size="sm" style={{marginBottom:"var(--pi-s4)"}} onClick={()=>setScreen("station")}>← Retour</Button>
          <div style={{color:"var(--pi-text)",fontWeight:700,fontSize:"var(--pi-fs-card)",marginBottom:"var(--pi-s4)",textAlign:"center"}}>📍 Choisissez votre station</div>
          <div style={{display:"flex",flexDirection:"column",gap:"var(--pi-s2)"}}>
            {ZK.map(zk=>{
              const z=ZONES[zk]; const zl=zn(zk);
              const isOff=(disabledZones||[]).includes(zk);
              return(
                <button key={zk} onClick={()=>onLogin("station",zk)}
                  style={{padding:"var(--pi-s4)",borderRadius:"var(--pi-r-lg)",border:`1px solid ${isOff?"var(--pi-danger)40":z.border}`,
                    background:isOff?"var(--pi-danger-wash)":z.bg,color:isOff?"var(--pi-danger)":z.color,cursor:"pointer",
                    display:"flex",alignItems:"center",gap:"var(--pi-s3)",opacity:isOff?0.7:1}}
                  onMouseEnter={e=>{if(!isOff)e.currentTarget.style.borderColor=z.color;}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor=isOff?"var(--pi-danger)40":z.border;}}>
                  <span style={{fontSize:22}}>{z.icon}</span>
                  <span style={{fontWeight:700,fontSize:"var(--pi-fs-body)",flex:1,textAlign:"left"}}>{zl.name}</span>
                  {isOff&&<span style={{fontSize:"var(--pi-fs-meta)",fontWeight:700,padding:"2px 8px",borderRadius:"var(--pi-r-pill)",
                    background:"var(--pi-danger-wash)",color:"var(--pi-danger)",border:"1px solid var(--pi-danger)"}}>DÉSACTIVÉE</span>}
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

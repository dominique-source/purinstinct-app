import { useState, useEffect, useRef, useCallback } from "react";
import { FONTS } from "../../config/fonts.js";
import { ZONES, ZK } from "../../config/zones.js";
import { useZn } from "../../hooks/useLang.js";

const IDLE_RESET_MS = 25000; // retour auto à l'écran d'accueil après inactivité
const CONFIRM_MS = 3000;     // durée d'affichage de l'écran de confirmation

// Borne fixe et publique: écran d'accueil = classement en boucle, jamais de
// session affichée trop longtemps. Inscription en 3 taps: zone → nom → confirmer.
export function KioskView({players,disabledZones,lockedZone,onRegister}){
  const zn=useZn();
  const [mode,setMode]=useState("idle"); // idle | zone | identify | confirm
  const [zone,setZone]=useState(lockedZone||null);
  const [search,setSearch]=useState("");
  const [gender,setGender]=useState("M");
  const [confirmed,setConfirmed]=useState(null); // {name,zone}
  const lastActivityRef=useRef(null);
  const rootRef=useRef(null);

  // Date.now()/setState doivent rester dans un callback (pas évalués pendant
  // le render) — useCallback plutôt qu'une fonction inline recréée à chaque passe.
  const bump=useCallback(()=>{ lastActivityRef.current=Date.now(); },[]);
  const reset=useCallback(()=>{
    setMode("idle"); setZone(lockedZone||null); setSearch(""); setGender("M"); setConfirmed(null);
  },[lockedZone]);

  // Désactive le pinch-zoom pour cette borne publique uniquement — on restaure
  // le viewport d'origine au démontage pour ne pas affecter les autres rôles
  // (admin/plateau/joueur gardent le zoom, utile pour l'accessibilité).
  useEffect(()=>{
    lastActivityRef.current=Date.now();
    const meta=document.querySelector('meta[name="viewport"]');
    const prev=meta?.getAttribute("content");
    if(meta) meta.setAttribute("content","width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover");
    return()=>{ if(meta&&prev) meta.setAttribute("content",prev); };
  },[]);

  // Auto-reset: toute vue autre que idle/confirm revient à l'accueil après
  // IDLE_RESET_MS sans interaction — jamais de session qui traîne à l'écran.
  useEffect(()=>{
    if(mode==="idle"||mode==="confirm") return;
    const iv=setInterval(()=>{
      if(Date.now()-lastActivityRef.current>IDLE_RESET_MS) reset();
    },1000);
    return()=>clearInterval(iv);
  },[mode,reset]);

  // Écran de confirmation: auto-dismiss vers l'accueil, jamais d'action requise.
  useEffect(()=>{
    if(mode!=="confirm") return;
    const to=setTimeout(reset,CONFIRM_MS);
    return()=>clearTimeout(to);
  },[mode,reset]);

  // La Fullscreen API n'accepte d'être appelée que dans un geste utilisateur direct
  // (ce tap l'est) — best-effort, on ignore un refus (contexte sans permission, etc).
  const wake=()=>{
    bump();
    if(document.documentElement.requestFullscreen&&!document.fullscreenElement){
      document.documentElement.requestFullscreen().catch(()=>{});
    }
    setMode(lockedZone?"identify":"zone");
  };

  const pickZone=(zk)=>{ bump(); setZone(zk); setMode("identify"); };

  const groupPlayers=players; // borne = session active courante, pas de code à saisir
  const filtered=search.trim().length>0
    ?groupPlayers.filter(p=>p.name.toLowerCase().includes(search.toLowerCase())||String(p.number).includes(search))
    :[];

  const finish=(name,existingId=null)=>{
    onRegister(zone,name,gender,existingId,()=>{
      setConfirmed({name,zone});
      setMode("confirm");
    });
  };

  const sorted=[...players].sort((a,b)=>b.globalPoints-a.globalPoints).slice(0,10);

  return(
    <div ref={rootRef} onClick={bump} onKeyDown={bump} onContextMenu={e=>e.preventDefault()}
      style={{minHeight:"100vh",background:"#06070f",fontFamily:"'DM Sans',sans-serif",
        touchAction:"manipulation",overscrollBehavior:"none",userSelect:"none"}}>
      <style>{FONTS}</style>

      {mode==="idle"&&(
        <div onClick={wake} style={{minHeight:"100vh",display:"flex",flexDirection:"column",
          alignItems:"center",justifyContent:"center",padding:32,cursor:"pointer"}}>
          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:44,letterSpacing:-1,marginBottom:4}}>
            <span style={{color:"#84cc16"}}>PUR</span><span style={{color:"#fff"}}>INSTINCT</span>
          </div>
          <div style={{color:"#84cc16",fontSize:11,letterSpacing:3,textTransform:"uppercase",fontWeight:700,marginBottom:32}}>
            Classement en direct
          </div>
          <div style={{width:"100%",maxWidth:480,display:"flex",flexDirection:"column",gap:6}}>
            {sorted.length===0&&(
              <div style={{textAlign:"center",color:"#4b5563",fontSize:14,padding:20}}>En attente des premiers joueurs…</div>
            )}
            {sorted.map((p,i)=>(
              <div key={p.id} className="anim-up" style={{display:"flex",alignItems:"center",gap:14,
                padding:"10px 16px",borderRadius:12,background:i===0?"#1a2e05":"#0d0f1a",
                border:"1px solid "+(i===0?"#84cc16":"#1f2937")}}>
                <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:22,
                  color:i===0?"#84cc16":"#4b5563",width:32,textAlign:"center",flexShrink:0}}>{i+1}</div>
                <div style={{flex:1,minWidth:0,color:"#fff",fontWeight:700,fontSize:16,overflow:"hidden",
                  textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.name}</div>
                <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:20,
                  color:i===0?"#84cc16":"#9ca3af"}}>{p.globalPoints} pts</div>
              </div>
            ))}
          </div>
          <div className="pulse-lime" style={{marginTop:40,color:"#84cc16",fontSize:13,fontWeight:700,
            letterSpacing:1,textTransform:"uppercase"}}>
            👆 Touchez l'écran pour vous inscrire
          </div>
        </div>
      )}

      {mode==="zone"&&(
        <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",padding:24}}>
          <div style={{textAlign:"center",margin:"24px 0 32px"}}>
            <div style={{color:"#fff",fontWeight:700,fontSize:22}}>Choisissez votre zone</div>
            <div style={{color:"#4b5563",fontSize:13,marginTop:4}}>Étape 1 sur 2</div>
          </div>
          <div style={{flex:1,display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:14,maxWidth:640,margin:"0 auto",width:"100%"}}>
            {ZK.map(zk=>{
              const z=ZONES[zk]; const zl=zn(zk);
              const isOff=(disabledZones||[]).includes(zk);
              return(
                <button key={zk} disabled={isOff} onClick={()=>pickZone(zk)}
                  style={{minHeight:96,borderRadius:18,border:"2px solid "+(isOff?"#1f2937":z.border),
                    background:isOff?"#0d0f1a":z.bg,color:isOff?"#374151":z.color,
                    display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:8,
                    cursor:isOff?"not-allowed":"pointer",opacity:isOff?0.5:1}}>
                  <span style={{fontSize:32}}>{z.icon}</span>
                  <span style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:16}}>{zl.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {mode==="identify"&&(
        <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",
          justifyContent:"center",padding:24}}>
          <div style={{width:"100%",maxWidth:380}}>
            {!lockedZone&&<button onClick={()=>{bump();setMode("zone");}}
              style={{background:"none",border:"none",color:"#6b7280",fontSize:14,cursor:"pointer",marginBottom:16,padding:0}}>
              ← Retour
            </button>}
            <div style={{textAlign:"center",marginBottom:20}}>
              <div style={{fontSize:32,marginBottom:8}}>{zone?ZONES[zone].icon:"👤"}</div>
              <div style={{color:"#fff",fontWeight:700,fontSize:20}}>Quel est votre nom ?</div>
              <div style={{color:"#4b5563",fontSize:13,marginTop:4}}>Étape 2 sur 2</div>
            </div>
            <input value={search} onChange={e=>{bump();setSearch(e.target.value);}} autoFocus
              placeholder="Tapez votre nom…"
              style={{width:"100%",padding:"16px 18px",borderRadius:16,border:"2px solid #374151",
                background:"#111827",color:"#fff",fontSize:18,outline:"none",boxSizing:"border-box",marginBottom:12}}
              onFocus={e=>e.target.style.borderColor="#84cc16"}
              onBlur={e=>e.target.style.borderColor="#374151"}/>

            {filtered.length>0&&(
              <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:12,maxHeight:220,overflowY:"auto"}}>
                {filtered.slice(0,6).map(p=>(
                  <button key={p.id} onClick={()=>{bump();finish(p.name,p.id);}}
                    style={{minHeight:56,display:"flex",alignItems:"center",gap:12,padding:"10px 14px",
                      borderRadius:12,border:"1px solid #1f2937",background:"#0d0f1a",cursor:"pointer",textAlign:"left"}}>
                    <span style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:18,
                      color:"#84cc16",width:28,flexShrink:0,textAlign:"center"}}>#{p.number}</span>
                    <span style={{color:"#fff",fontWeight:600,fontSize:15,flex:1}}>{p.name}</span>
                    <span style={{color:"#374151",fontSize:16}}>›</span>
                  </button>
                ))}
              </div>
            )}

            {search.trim().length>0&&filtered.length===0&&(
              <div>
                <div style={{display:"flex",gap:8,marginBottom:12}}>
                  {[["M","👨 Homme"],["F","👩 Femme"]].map(([v,l])=>(
                    <button key={v} onClick={()=>{bump();setGender(v);}}
                      style={{flex:1,minHeight:48,padding:"10px",borderRadius:12,
                        border:"2px solid "+(gender===v?"#84cc16":"#374151"),
                        background:gender===v?"#1a2e05":"#111827",
                        color:gender===v?"#84cc16":"#6b7280",cursor:"pointer",fontWeight:600,fontSize:13}}>
                      {l}
                    </button>
                  ))}
                </div>
                <button onClick={()=>{bump();finish(search.trim());}}
                  style={{width:"100%",minHeight:56,padding:"14px",borderRadius:14,border:"none",cursor:"pointer",
                    background:"#84cc16",color:"#000",fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:18}}>
                  ✓ Confirmer — {search.trim()}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {mode==="confirm"&&confirmed&&(
        <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",
          justifyContent:"center",padding:24,textAlign:"center"}}>
          <div className="anim-pop" style={{fontSize:64,marginBottom:16}}>✅</div>
          <div style={{color:"#fff",fontWeight:700,fontSize:24,marginBottom:8}}>Bienvenue {confirmed.name} !</div>
          <div style={{color:"#84cc16",fontSize:15,fontWeight:600}}>
            Vous êtes dans la file — {zn(confirmed.zone).name}
          </div>
        </div>
      )}
    </div>
  );
}

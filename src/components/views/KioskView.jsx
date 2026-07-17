import { useState, useEffect, useRef, useCallback } from "react";
import { ZONES, ZK } from "../../config/zones.js";
import { useZn } from "../../hooks/useLang.js";
import { useCountUp } from "../../hooks/useCountUp.js";
import { Button, Eyebrow, EmptyState } from "../ui/index.js";

// Ligne du classement kiosque — composant séparé pour que useCountUp anime chaque score.
// Podium (1-3) vs peloton: la hiérarchie passe par l'échelle et le rim-light, pas par
// une couleur de plus. Rang 1 = traitement héros broadcast.
function KioskRow({p,i}){
  const pts=useCountUp(p.globalPoints);
  const top=i===0;
  const podium=i<3;
  return(
    <div className="pi-anim-up" style={{
      display:"flex",alignItems:"center",gap:"var(--pi-s4)",
      padding:top?"16px 20px":"11px 20px",
      background:top?"var(--pi-lime-wash)":"var(--pi-surface-1)",
      border:`1px solid ${top?"var(--pi-lime-line)":"var(--pi-line)"}`,
      borderRadius:top?0:"var(--pi-r-md)",
      clipPath:top?"polygon(14px 0,100% 0,100% calc(100% - 14px),calc(100% - 14px) 100%,0 100%,0 14px)":undefined,
      filter:top?"drop-shadow(0 0 16px var(--pi-lime-glow))":"none",
      backgroundImage:top?"repeating-linear-gradient(0deg,transparent 0 3px,var(--pi-lime-wash) 3px 4px)":"none",
      animationDelay:`${Math.min(i,9)*40}ms`}}>
      <div style={{fontFamily:"var(--pi-font-display)",fontWeight:900,fontStyle:"italic",
        fontSize:top?34:24,lineHeight:1,width:44,textAlign:"center",flexShrink:0,
        color:top?"var(--pi-lime)":podium?"var(--pi-text-2)":"var(--pi-text-4)"}}>{i+1}</div>
      <div style={{flex:1,minWidth:0,color:"#fff",fontWeight:podium?700:600,
        fontSize:top?22:17,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.name}</div>
      <div style={{fontFamily:"var(--pi-font-display)",fontWeight:900,fontStyle:"italic",
        fontSize:top?30:21,lineHeight:1,fontVariantNumeric:"tabular-nums",
        color:top?"var(--pi-lime)":"var(--pi-text-2)"}}>
        {pts}<span style={{fontSize:"0.5em",marginLeft:4,color:"var(--pi-text-3)"}}>PTS</span>
      </div>
    </div>
  );
}

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
      style={{minHeight:"100svh",background:"var(--pi-bg)",
        touchAction:"manipulation",overscrollBehavior:"none",userSelect:"none"}}>

      {/* ================= IDLE — spectator broadcast board ================= */}
      {mode==="idle"&&(
        <div onClick={wake} style={{minHeight:"100svh",display:"flex",flexDirection:"column",
          alignItems:"center",justifyContent:"center",padding:"var(--pi-s8) var(--pi-s6)",cursor:"pointer"}}>

          <div style={{fontFamily:"var(--pi-font-display)",fontWeight:900,fontStyle:"italic",
            fontSize:"clamp(40px,7vw,68px)",letterSpacing:"-0.02em",lineHeight:1,marginBottom:"var(--pi-s3)",
            textShadow:"0 0 40px var(--pi-lime-glow)"}}>
            <span style={{color:"var(--pi-lime)"}}>PUR</span><span style={{color:"#fff"}}>INSTINCT</span>
          </div>

          <div style={{display:"flex",alignItems:"center",gap:"var(--pi-s2)",marginBottom:"var(--pi-s8)"}}>
            <span className="pi-pulse" style={{width:8,height:8,borderRadius:"50%",background:"var(--pi-lime)",
              boxShadow:"0 0 12px var(--pi-lime-glow)"}}/>
            <Eyebrow style={{color:"var(--pi-lime)",letterSpacing:"0.24em"}}>Classement en direct</Eyebrow>
          </div>

          {/* Wider on big displays: the idle board doubles as a spectator screen */}
          <div style={{width:"100%",maxWidth:"min(92vw, 720px)",display:"flex",flexDirection:"column",gap:"var(--pi-s2)"}}>
            {sorted.length===0
              ? <EmptyState icon="🏟️" title="EN ATTENTE">Les premiers scores apparaîtront ici dès le début de la session.</EmptyState>
              : sorted.map((p,i)=><KioskRow key={p.id} p={p} i={i}/>)}
          </div>

          <div className="pi-pulse" style={{marginTop:"var(--pi-s10)",display:"flex",alignItems:"center",gap:"var(--pi-s2)",
            color:"var(--pi-lime)",fontSize:"var(--pi-fs-body)",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase"}}>
            👆 Touchez l'écran pour vous inscrire
          </div>
        </div>
      )}

      {/* ================= STEP 1 — zone ================= */}
      {mode==="zone"&&(
        <div className="pi-anim-up" style={{minHeight:"100svh",display:"flex",flexDirection:"column",padding:"var(--pi-s6)"}}>
          <div style={{textAlign:"center",margin:"var(--pi-s6) 0 var(--pi-s8)"}}>
            <Eyebrow style={{marginBottom:"var(--pi-s2)"}}>Étape 1 sur 2</Eyebrow>
            <div style={{fontFamily:"var(--pi-font-display)",fontWeight:900,fontStyle:"italic",
              fontSize:"var(--pi-fs-title)",color:"#fff"}}>CHOISISSEZ VOTRE ZONE</div>
          </div>
          <div style={{flex:1,display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))",
            gap:"var(--pi-s4)",maxWidth:"var(--pi-w-content)",margin:"0 auto",width:"100%",alignContent:"start"}}>
            {ZK.map(zk=>{
              const z=ZONES[zk]; const zl=zn(zk);
              const isOff=(disabledZones||[]).includes(zk);
              return(
                <button key={zk} disabled={isOff} onClick={()=>pickZone(zk)}
                  style={{minHeight:120,border:`2px solid ${isOff?"var(--pi-line)":z.color+"66"}`,
                    background:isOff?"var(--pi-surface-1)":z.bg,color:isOff?"var(--pi-text-4)":z.color,
                    clipPath:"polygon(14px 0,100% 0,100% calc(100% - 14px),calc(100% - 14px) 100%,0 100%,0 14px)",
                    display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:"var(--pi-s2)",
                    cursor:isOff?"not-allowed":"pointer",opacity:isOff?0.4:1}}>
                  <span style={{fontSize:36}}>{z.icon}</span>
                  <span style={{fontFamily:"var(--pi-font-display)",fontWeight:900,fontStyle:"italic",fontSize:18}}>{zl.name.toUpperCase()}</span>
                  {isOff&&<span style={{fontSize:"var(--pi-fs-meta)",letterSpacing:"0.1em"}}>INDISPONIBLE</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ================= STEP 2 — identify ================= */}
      {mode==="identify"&&(
        <div className="pi-anim-up" style={{minHeight:"100svh",display:"flex",flexDirection:"column",alignItems:"center",
          justifyContent:"center",padding:"var(--pi-s6)"}}>
          <div style={{width:"100%",maxWidth:"var(--pi-w-narrow)"}}>
            {!lockedZone&&<Button variant="ghost" size="sm" onClick={()=>{bump();setMode("zone");}} style={{marginBottom:"var(--pi-s4)"}}>← Retour</Button>}
            <div style={{textAlign:"center",marginBottom:"var(--pi-s5)"}}>
              <div style={{fontSize:36,marginBottom:"var(--pi-s2)"}}>{zone?ZONES[zone].icon:"👤"}</div>
              <Eyebrow style={{marginBottom:"var(--pi-s2)"}}>Étape 2 sur 2</Eyebrow>
              <div style={{fontFamily:"var(--pi-font-display)",fontWeight:900,fontStyle:"italic",
                fontSize:"var(--pi-fs-title)",color:"#fff"}}>QUEL EST VOTRE NOM ?</div>
            </div>

            <input value={search} onChange={e=>{bump();setSearch(e.target.value);}} autoFocus
              placeholder="Tapez votre nom…" className="pi-input"
              style={{minHeight:"var(--pi-ctrl-lg)",fontSize:18,marginBottom:"var(--pi-s3)"}}/>

            {filtered.length>0&&(
              <div style={{display:"flex",flexDirection:"column",gap:"var(--pi-s2)",marginBottom:"var(--pi-s3)",maxHeight:240,overflowY:"auto"}}>
                {filtered.slice(0,6).map(p=>(
                  <button key={p.id} onClick={()=>{bump();finish(p.name,p.id);}}
                    style={{minHeight:"var(--pi-ctrl-lg)",display:"flex",alignItems:"center",gap:"var(--pi-s3)",
                      padding:"0 var(--pi-s4)",borderRadius:"var(--pi-r-md)",border:"1px solid var(--pi-line)",
                      background:"var(--pi-surface-1)",cursor:"pointer",textAlign:"left"}}>
                    <span style={{fontFamily:"var(--pi-font-display)",fontWeight:900,fontStyle:"italic",fontSize:18,
                      color:"var(--pi-lime)",width:32,flexShrink:0,textAlign:"center"}}>#{p.number}</span>
                    <span style={{color:"#fff",fontWeight:600,fontSize:16,flex:1}}>{p.name}</span>
                    <span style={{color:"var(--pi-text-4)",fontSize:18}}>›</span>
                  </button>
                ))}
              </div>
            )}

            {search.trim().length>0&&filtered.length===0&&(
              <div>
                <Eyebrow style={{marginBottom:"var(--pi-s2)"}}>Nouveau joueur</Eyebrow>
                <div style={{display:"flex",gap:"var(--pi-s2)",marginBottom:"var(--pi-s3)"}}>
                  {[["M","👨 Homme"],["F","👩 Femme"]].map(([v,l])=>(
                    <button key={v} onClick={()=>{bump();setGender(v);}}
                      className={gender===v?"pi-tab is-active":"pi-tab"}
                      style={{minHeight:"var(--pi-ctrl-md)",fontSize:14}}>
                      {l}
                    </button>
                  ))}
                </div>
                <Button variant="primary" size="xl" cut block onClick={()=>{bump();finish(search.trim());}}>
                  ✓ Confirmer — {search.trim()}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= CONFIRM ================= */}
      {mode==="confirm"&&confirmed&&(
        <div style={{minHeight:"100svh",display:"flex",flexDirection:"column",alignItems:"center",
          justifyContent:"center",padding:"var(--pi-s6)",textAlign:"center"}}>
          <div className="pi-anim-pop" style={{fontSize:72,marginBottom:"var(--pi-s4)"}}>✅</div>
          <div style={{fontFamily:"var(--pi-font-display)",fontWeight:900,fontStyle:"italic",
            fontSize:"var(--pi-fs-score)",lineHeight:1,color:"#fff",marginBottom:"var(--pi-s3)"}}>
            BIENVENUE {confirmed.name.split(" ")[0].toUpperCase()}
          </div>
          <div style={{display:"flex",alignItems:"center",gap:"var(--pi-s2)",color:"var(--pi-lime)",
            fontSize:"var(--pi-fs-section)",fontWeight:700}}>
            <span>{ZONES[confirmed.zone]?.icon}</span>
            Vous êtes dans la file — {zn(confirmed.zone).name}
          </div>
        </div>
      )}
    </div>
  );
}

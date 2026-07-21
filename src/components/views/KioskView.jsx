import { useState, useEffect, useRef, useCallback } from "react";
import { ZONES, ZK } from "../../config/zones.js";
import { useZn, useT } from "../../hooks/useLang.js";
import { useMode } from "../../hooks/useMode.js";
import { useCountUp } from "../../hooks/useCountUp.js";
import { Button, Eyebrow, EmptyState, Field } from "../ui/index.js";
import { ConsentGate } from "../shared/ConsentGate.jsx";

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

// Champs texte génériques additionnels (au-delà de nom/courriel) que captureFields
// peut demander — un seul est actif à la fois selon le mode (company: corporate,
// class: ecole), mais l'ensemble reste ouvert à d'autres champs futurs.
const EXTRA_TEXT_FIELDS=["company","class"];

// Bouton retour de la borne: cible tactile large (~3x la taille "sm" du design
// system), en variant outline pour rester visible sur fond sombre.
const BACK_BTN_STYLE={minHeight:108,padding:"0 32px",fontSize:24,fontWeight:700};

// Borne fixe et publique: écran d'accueil = classement en boucle, jamais de
// session affichée trop longtemps. Inscription en 3 taps (2 en mode équipes): zone →
// [équipe] → nom → confirmer.
export function KioskView({players,disabledZones,lockedZone,teamMode,teams,onRegister}){
  const zn=useZn();
  const t=useT();
  const {modeConfig}=useMode();
  const [mode,setMode]=useState("idle"); // idle | leaderboard | zone | team | identify | confirm
  const [zone,setZone]=useState(lockedZone||null);
  const [search,setSearch]=useState("");
  const [gender,setGender]=useState("M");
  const [email,setEmail]=useState("");
  const [marketingConsent,setMarketingConsent]=useState(false);
  const [extraFieldValue,setExtraFieldValue]=useState("");
  const [teamSearch,setTeamSearch]=useState("");
  const [selectedTeam,setSelectedTeam]=useState(null); // {teamId,name}|null
  const [confirmed,setConfirmed]=useState(null); // {name,zone,teamName}
  const lastActivityRef=useRef(null);
  const rootRef=useRef(null);

  // Capture paramétrée par mode (MODES[mode].captureFields/consent) — sans
  // mode résolu (ex. borne fixe ?kiosk=1 legacy), aucun champ additionnel:
  // comportement identique à avant l'étape 4.
  const captureFields=modeConfig?.captureFields||[];
  const showEmail=captureFields.includes("email")||captureFields.includes("emailOptional");
  const consentKind=modeConfig?.consent||"none";
  const showConsent=consentKind==="marketing"||consentKind==="marketingOptional";
  const consentRequired=consentKind==="marketing";
  const extraFieldKey=captureFields.find(f=>EXTRA_TEXT_FIELDS.includes(f))||null;

  // Mode équipes manuel: uniquement pour les zones gameStyle "team" — les
  // zones individuelles (vitesse: sprint, habileté pied: duel 1v1, malgré un
  // teamSize:1 techniquement truthy) ne sont jamais concernées.
  const zoneNeedsTeam=(zk)=>!!(teamMode&&zk&&ZONES[zk]?.gameStyle==="team");
  const teamStepApplies=zoneNeedsTeam(zone);
  const teamsForZone=(zone&&teams?.[zone])||{};
  const teamsList=Object.entries(teamsForZone).map(([id,tm])=>({id,...tm}));

  // Date.now()/setState doivent rester dans un callback (pas évalués pendant
  // le render) — useCallback plutôt qu'une fonction inline recréée à chaque passe.
  const bump=useCallback(()=>{ lastActivityRef.current=Date.now(); },[]);
  const reset=useCallback(()=>{
    setMode("idle"); setZone(lockedZone||null); setSearch(""); setGender("M"); setConfirmed(null);
    setEmail(""); setMarketingConsent(false); setExtraFieldValue(""); setTeamSearch(""); setSelectedTeam(null);
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
    if(lockedZone) setMode(zoneNeedsTeam(lockedZone)?"team":"identify");
    else setMode("zone");
  };

  const pickZone=(zk)=>{ bump(); setZone(zk); setMode(zoneNeedsTeam(zk)?"team":"identify"); };

  const pickTeam=(teamId,name)=>{ bump(); setSelectedTeam({teamId,name}); setMode("identify"); };

  const groupPlayers=players; // borne = session active courante, pas de code à saisir
  const filtered=search.trim().length>0
    ?groupPlayers.filter(p=>p.name.toLowerCase().includes(search.toLowerCase())||String(p.number).includes(search))
    :[];

  const teamSearchNorm=teamSearch.trim().toLowerCase();
  const filteredTeams=teamSearchNorm.length>0
    ?teamsList.filter(tm=>tm.name.toLowerCase().includes(teamSearchNorm))
    :teamsList;
  const teamExactMatch=teamsList.some(tm=>tm.name.toLowerCase()===teamSearchNorm);

  const finish=(name,existingId=null)=>{
    const extra={};
    // Un joueur déjà connu (existingId) rejoint simplement la file — pas de nouvelle
    // capture de données, seul un nouveau joueur fournit email/consent/champ additionnel.
    if(!existingId){
      if(showEmail&&email.trim()) extra.email=email.trim();
      if(showConsent) extra.marketingConsent=marketingConsent;
      if(extraFieldKey&&extraFieldValue.trim()) extra[extraFieldKey]=extraFieldValue.trim();
    }
    // L'équipe, elle, s'applique à tout le monde (nouveau ou déjà connu) puisqu'elle
    // est propre à la zone, pas au joueur — un joueur connu peut rejoindre une zone
    // où il n'a pas encore d'équipe.
    if(teamStepApplies&&selectedTeam) extra.team={teamId:selectedTeam.teamId,name:selectedTeam.name};
    onRegister(zone,name,gender,existingId,()=>{
      setConfirmed({name,zone,teamName:selectedTeam?.name||null});
      setMode("confirm");
    },Object.keys(extra).length>0?extra:undefined);
  };

  const sorted=[...players].sort((a,b)=>b.globalPoints-a.globalPoints).slice(0,10);

  return(
    <div ref={rootRef} onClick={bump} onKeyDown={bump} onContextMenu={e=>e.preventDefault()}
      style={{minHeight:"100svh",background:"var(--pi-bg)",
        touchAction:"manipulation",overscrollBehavior:"none",userSelect:"none"}}>

      {/* ================= IDLE — écran divisé: s'inscrire / classement ================= */}
      {mode==="idle"&&(
        <div style={{minHeight:"100svh",display:"flex",flexDirection:"column"}}>

          {/* Moitié haute — inscription (comportement inchangé: wake() -> zone/team/identify) */}
          <div style={{flex:1,display:"flex",flexDirection:"column",
            alignItems:"center",justifyContent:"center",padding:"var(--pi-s5) var(--pi-s5) var(--pi-s6)",gap:"var(--pi-s4)",
            borderBottom:"1px dashed var(--pi-line)"}}>

            <div style={{fontFamily:"var(--pi-font-display)",fontWeight:900,fontStyle:"italic",
              fontSize:"clamp(22px,4vw,30px)",letterSpacing:"-0.02em",lineHeight:1,
              textShadow:"0 0 30px var(--pi-lime-glow)"}}>
              <span style={{color:"var(--pi-lime)"}}>PUR</span><span style={{color:"#fff"}}>INSTINCT</span>
            </div>

            <button onClick={wake} style={{flex:1,width:"100%",maxWidth:460,minHeight:150,
              display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:"var(--pi-s2)",
              background:"var(--pi-lime)",color:"#0a0a0a",border:"none",borderRadius:28,cursor:"pointer",
              boxShadow:"0 10px 0 var(--pi-lime-press), 0 18px 0 rgba(0,0,0,0.35), 0 30px 50px rgba(184,224,32,0.35)",
              transform:"translateY(0)",transition:"transform 80ms ease, box-shadow 80ms ease"}}
              onPointerDown={e=>{e.currentTarget.style.transform="translateY(8px)";e.currentTarget.style.boxShadow="0 2px 0 var(--pi-lime-press), 0 6px 0 rgba(0,0,0,0.35), 0 12px 30px rgba(184,224,32,0.3)";}}
              onPointerUp={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="0 10px 0 var(--pi-lime-press), 0 18px 0 rgba(0,0,0,0.35), 0 30px 50px rgba(184,224,32,0.35)";}}
              onPointerLeave={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="0 10px 0 var(--pi-lime-press), 0 18px 0 rgba(0,0,0,0.35), 0 30px 50px rgba(184,224,32,0.35)";}}>
              <span style={{fontSize:"clamp(36px,9vw,56px)"}}>🖐️</span>
              <span style={{fontFamily:"var(--pi-font-display)",fontWeight:900,fontStyle:"italic",
                fontSize:"clamp(24px,6vw,38px)",letterSpacing:"0.01em"}}>S'INSCRIRE</span>
            </button>
          </div>

          {/* Moitié basse — aperçu du classement, tap pour la vue complète */}
          <div onClick={()=>{bump();setMode("leaderboard");}} style={{flex:1,display:"flex",flexDirection:"column",
            alignItems:"center",justifyContent:"center",padding:"var(--pi-s5) var(--pi-s6)",cursor:"pointer",
            background:"var(--pi-surface-1)"}}>

            <div style={{display:"flex",alignItems:"center",gap:"var(--pi-s2)",marginBottom:"var(--pi-s4)"}}>
              <span className="pi-pulse" style={{width:8,height:8,borderRadius:"50%",background:"var(--pi-lime)",
                boxShadow:"0 0 12px var(--pi-lime-glow)"}}/>
              <Eyebrow style={{color:"var(--pi-lime)",letterSpacing:"0.24em"}}>Classement en direct</Eyebrow>
            </div>

            <div style={{width:"100%",maxWidth:"min(92vw, 640px)",display:"flex",flexDirection:"column",gap:"var(--pi-s2)"}}>
              {sorted.length===0
                ? <EmptyState icon="🏟️" title="EN ATTENTE">Les premiers scores apparaîtront ici dès le début de la session.</EmptyState>
                : sorted.slice(0,5).map((p,i)=><KioskRow key={p.id} p={p} i={i}/>)}
            </div>

            {sorted.length>0&&(
              <div style={{marginTop:"var(--pi-s4)",fontSize:"var(--pi-fs-label)",color:"var(--pi-text-3)",fontWeight:600}}>
                Voir le classement complet ↓
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= LEADERBOARD — vue complète (depuis la moitié basse de idle) ================= */}
      {mode==="leaderboard"&&(
        <div className="pi-anim-up" style={{minHeight:"100svh",display:"flex",flexDirection:"column",
          alignItems:"center",padding:"var(--pi-s6) var(--pi-s6) var(--pi-s8)"}}>
          <div style={{width:"100%",maxWidth:"min(92vw, 720px)"}}>
            <Button variant="outline" onClick={()=>{bump();reset();}} style={{...BACK_BTN_STYLE,marginBottom:"var(--pi-s5)"}}>← Retour</Button>

            <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:"var(--pi-s2)",marginBottom:"var(--pi-s6)"}}>
              <span className="pi-pulse" style={{width:8,height:8,borderRadius:"50%",background:"var(--pi-lime)",
                boxShadow:"0 0 12px var(--pi-lime-glow)"}}/>
              <Eyebrow style={{color:"var(--pi-lime)",letterSpacing:"0.24em"}}>Classement en direct</Eyebrow>
            </div>

            <div style={{display:"flex",flexDirection:"column",gap:"var(--pi-s2)"}}>
              {sorted.length===0
                ? <EmptyState icon="🏟️" title="EN ATTENTE">Les premiers scores apparaîtront ici dès le début de la session.</EmptyState>
                : sorted.map((p,i)=><KioskRow key={p.id} p={p} i={i}/>)}
            </div>
          </div>
        </div>
      )}

      {/* ================= STEP 1 — zone ================= */}
      {mode==="zone"&&(
        <div className="pi-anim-up" style={{minHeight:"100svh",display:"flex",flexDirection:"column",padding:"var(--pi-s6)"}}>
          <Button variant="outline" onClick={()=>{bump();reset();}} style={BACK_BTN_STYLE}>← Retour</Button>
          <div style={{textAlign:"center",margin:"var(--pi-s6) 0 var(--pi-s8)"}}>
            <Eyebrow style={{marginBottom:"var(--pi-s2)"}}>Étape 1 sur {teamMode?3:2}</Eyebrow>
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

      {/* ================= STEP 2 (mode équipes) — team ================= */}
      {mode==="team"&&(
        <div className="pi-anim-up" style={{minHeight:"100svh",display:"flex",flexDirection:"column",alignItems:"center",
          justifyContent:"center",padding:"var(--pi-s6)"}}>
          <div style={{width:"100%",maxWidth:"var(--pi-w-narrow)"}}>
            {!lockedZone&&<Button variant="outline" onClick={()=>{bump();setMode("zone");}} style={{...BACK_BTN_STYLE,marginBottom:"var(--pi-s4)"}}>← Retour</Button>}
            <div style={{textAlign:"center",marginBottom:"var(--pi-s5)"}}>
              <div style={{fontSize:36,marginBottom:"var(--pi-s2)"}}>{zone?ZONES[zone].icon:"🤝"}</div>
              <Eyebrow style={{marginBottom:"var(--pi-s2)"}}>Étape 2 sur 3</Eyebrow>
              <div style={{fontFamily:"var(--pi-font-display)",fontWeight:900,fontStyle:"italic",
                fontSize:"var(--pi-fs-title)",color:"#fff"}}>{t.chooseYourTeam}</div>
            </div>

            {teamsList.length>0&&(
              <div style={{display:"flex",flexDirection:"column",gap:"var(--pi-s2)",marginBottom:"var(--pi-s3)",maxHeight:280,overflowY:"auto"}}>
                {filteredTeams.map(tm=>(
                  <button key={tm.id} onClick={()=>pickTeam(tm.id,tm.name)}
                    style={{minHeight:"var(--pi-ctrl-lg)",display:"flex",alignItems:"center",gap:"var(--pi-s3)",
                      padding:"0 var(--pi-s4)",borderRadius:"var(--pi-r-md)",border:"1px solid var(--pi-line)",
                      background:"var(--pi-surface-1)",cursor:"pointer",textAlign:"left"}}>
                    <span style={{color:"#fff",fontWeight:600,fontSize:16,flex:1}}>{tm.name}</span>
                    <span style={{color:"var(--pi-text-4)",fontSize:13}}>
                      {(tm.memberIds||[]).length} {(tm.memberIds||[]).length>1?t.memberCountLabelPlural:t.memberCountLabel}
                    </span>
                  </button>
                ))}
              </div>
            )}

            <input value={teamSearch} onChange={e=>{bump();setTeamSearch(e.target.value);}}
              placeholder={t.newTeamPlaceholder} className="pi-input"
              style={{minHeight:"var(--pi-ctrl-lg)",fontSize:16,marginBottom:"var(--pi-s3)"}}/>

            {teamSearch.trim().length>0&&!teamExactMatch&&(
              <Button variant="primary" size="lg" cut block onClick={()=>pickTeam(null,teamSearch.trim())}>
                {t.createTeamPrefix} « {teamSearch.trim()} »
              </Button>
            )}
          </div>
        </div>
      )}

      {/* ================= STEP 2/3 — identify ================= */}
      {mode==="identify"&&(
        <div className="pi-anim-up" style={{minHeight:"100svh",display:"flex",flexDirection:"column",alignItems:"center",
          justifyContent:"center",padding:"var(--pi-s6)"}}>
          <div style={{width:"100%",maxWidth:"var(--pi-w-narrow)"}}>
            {!lockedZone&&<Button variant="outline"
              onClick={()=>{bump();setMode(teamStepApplies?"team":"zone");}}
              style={{...BACK_BTN_STYLE,marginBottom:"var(--pi-s4)"}}>← Retour</Button>}
            <div style={{textAlign:"center",marginBottom:"var(--pi-s5)"}}>
              <div style={{fontSize:36,marginBottom:"var(--pi-s2)"}}>{zone?ZONES[zone].icon:"👤"}</div>
              <Eyebrow style={{marginBottom:"var(--pi-s2)"}}>Étape {teamStepApplies?3:2} sur {teamStepApplies?3:2}</Eyebrow>
              <div style={{fontFamily:"var(--pi-font-display)",fontWeight:900,fontStyle:"italic",
                fontSize:"var(--pi-fs-title)",color:"#fff"}}>QUEL EST VOTRE NOM ?</div>
              {selectedTeam&&<div style={{marginTop:"var(--pi-s2)",color:"var(--pi-lime)",fontSize:"var(--pi-fs-label)",fontWeight:700}}>
                {t.teamLabel} : {selectedTeam.name}
              </div>}
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
                {extraFieldKey&&(
                  <Field inputProps={{type:"text",value:extraFieldValue,
                    placeholder:extraFieldKey==="company"?t.companyPlaceholder:t.classPlaceholder,
                    onChange:e=>{bump();setExtraFieldValue(e.target.value);}}}
                    style={{marginBottom:"var(--pi-s3)"}}/>
                )}
                {showEmail&&(
                  <Field inputProps={{type:"email",value:email,autoComplete:"email",
                    placeholder:t.emailOptionalPlaceholder,
                    onChange:e=>{bump();setEmail(e.target.value);}}}
                    style={{marginBottom:"var(--pi-s3)"}}/>
                )}
                {showConsent&&(
                  <div style={{marginBottom:"var(--pi-s3)"}}>
                    <ConsentGate checked={marketingConsent} required={consentRequired}
                      onChange={v=>{bump();setMarketingConsent(v);}}/>
                  </div>
                )}
                <Button variant="primary" size="xl" cut block
                  disabled={consentRequired&&!marketingConsent}
                  onClick={()=>{bump();finish(search.trim());}}>
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
            {confirmed.teamName
              ?`${t.teamLabel} ${confirmed.teamName} — ${zn(confirmed.zone).name}`
              :`Vous êtes dans la file — ${zn(confirmed.zone).name}`}
          </div>
        </div>
      )}
    </div>
  );
}

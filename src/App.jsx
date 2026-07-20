import { useState, useEffect, useRef } from "react";
import { fbRef, set, onValue, off, toFb, fromFb, queuesToFb, queuesFromFb, fbUpdate, ensureAuth, allocPlayerId } from "./firebase.js";
import { ZONES, ZK, AUG_GAMES, zn } from "./config/zones.js";
import { FONTS } from "./config/fonts.js";
import { S } from "./components/shared/styles.js";
import { INITIAL_ROSTERS } from "./config/rosters.js";
import { T } from "./config/translations.js";
import { LangContext } from "./hooks/useLang.js";
import { shuffle, getStatus, createPlayersFromRoster, makeEmptyGames, makeEmptyQueues, computeTeamResult, computeIndividualResult, refillQueues, buildInitialQueues } from "./lib/game-logic.js";
import { LangFooter } from "./components/shared/LangFooter.jsx";
import { AdminView } from "./components/admin/AdminView.jsx";
import { StationView } from "./components/game/StationView.jsx";
import { ModeSelectView } from "./components/views/ModeSelectView.jsx";
import { TestLanding } from "./components/views/TestLanding.jsx";
import { AugmentedLanding } from "./components/views/AugmentedLanding.jsx";
import { AugmentedStation } from "./components/views/AugmentedStation.jsx";
import { LoginView } from "./components/views/LoginView.jsx";
import { LiveLoginView } from "./components/views/LiveLoginView.jsx";
import { PlayerView } from "./components/views/PlayerView.jsx";
import { KioskView } from "./components/views/KioskView.jsx";

// ================================================================
// PURINSTINCT ARENA v3  –  75 min  |  Dynamic rosters  |  5 tiers
// Sprint: individual winner  |  Presence mgmt  |  Mid-game swap
// Routing + état global + synchronisation Firebase.
// Le reste (config, hooks, logique de jeu, composants) vit dans
// config/, hooks/, lib/ et components/ — voir ROADMAP-CLAUDE-CODE.md
// ================================================================
export default function PurInstinctApp(){
  const [rosters,setRosters]=useState(INITIAL_ROSTERS);
  const [activeRosterId,setActiveRosterId]=useState(INITIAL_ROSTERS[0]?.id||"main");
  const [players,setPlayers]=useState([]);
  const [comments,setComments]=useState([]);
  const [queues,setQueues]=useState(makeEmptyQueues());
  const [activeGames,setActiveGames]=useState(makeEmptyGames());
  const [arenaState,setArenaState]=useState({active:false,ended:false,startTime:null,disabledZones:[]});
  // horodatage du dernier résultat soumis par zone: { [zone]: ms } — alimente les alertes de stagnation du cockpit
  const [lastResultAt,setLastResultAt]=useState({});
  // augmented games: { [gameId]: { queue:[playerNames], activeMatch:null } }
  const [augState,setAugState]=useState(()=>Object.fromEntries(AUG_GAMES.map(g=>[g.id,{queue:[],activeMatch:null}])));
  const [winnersPublished,setWinnersPublished]=useState(false);
  const [rosterCodes,setRosterCodes]=useState({});
  const [pendingSessions,setPendingSessions]=useState([]);
  // Borne fixe: ?kiosk=1 (option &zone=X pour verrouiller une borne à une seule
  // zone) bascule directement en mode kiosque, sans passer par l'écran PIN.
  const [view,setView]=useState(()=>{
    const p=new URLSearchParams(window.location.search);
    if(p.get("kiosk")) return {type:"kiosk",zone:p.get("zone")||null};
    return {type:"login"};
  });
  const [liveMode,setLiveMode]=useState(false);
  const [fbReady,setFbReady]=useState(false);
  const [lang,setLang]=useState("fr");
  const [isTestMode,setIsTestMode]=useState(false);

  // 30 hardcoded test players — never synced to Firebase
  const TEST_PLAYERS=useState(()=>
    ["Alex Martin","Sam Tremblay","Jordan Côté","Charlie Gagnon","Riley Fortin",
     "Morgan Bouchard","Taylor Lavoie","Casey Girard","Dana Morin","Quinn Pelletier",
     "Avery Gagne","Blake Roy","Cameron Lapointe","Drew Lefebvre","Emery Bergeron",
     "Finley Gauthier","Harley Dubois","Indigo Rousseau","Jamie Leblanc","Kendall Ouellet",
     "Lane Mercier","Marley Pouliot","Noel Beaulieu","Parker Nadeau","Reese Côté",
     "Sage Simard","Skyler Bélanger","Storm Fournier","Trace Lachance","Winter Vaillancourt"]
    .map((name,i)=>({
      id:1000+i, number:i+1, name,
      gender:i%3===0?"F":"M",
      globalPoints:Math.floor(Math.random()*120),
      zoneScores:{}, zoneStreaks:{}, zonesPlayed:[],
      history:[], groupId:"test"
    }))
  )[0];

  const playersRef=useRef(players);
  const gamesRef=useRef(activeGames);
  const writingRef=useRef(false); // évite les boucles d'écriture
  useEffect(()=>{playersRef.current=players;});
  useEffect(()=>{gamesRef.current=activeGames;});

  const liveModeRef=useRef(liveMode);
  useEffect(()=>{liveModeRef.current=liveMode;},[liveMode]);

  // ── Firebase sync ──────────────────────────────────────────────
  useEffect(()=>{
    let stateRef=null;
    let cancelled=false;
    ensureAuth().then(()=>{
    if(cancelled) return;
    stateRef=fbRef("state");
    onValue(stateRef,(snap)=>{
      const data=snap.val();
      if(!data){
        // Première connexion — initialiser Firebase avec les données par défaut
        const initPlayers=createPlayersFromRoster(INITIAL_ROSTERS[0]).map(p=>({...p,groupId:INITIAL_ROSTERS[0]?.id||"main"}));
        const initQueues=buildInitialQueues(initPlayers);
        set(fbRef("state"),{
          players:toFb(initPlayers),
          queues:queuesToFb(initQueues),
          activeGames:makeEmptyGames(),
          arenaState:{active:false,ended:false,startTime:null,disabledZones:[]},
          winnersPublished:false,
          rosterCodes:{},
          pendingSessions:{},
          liveMode:false,
          activeRosterId:INITIAL_ROSTERS[0]?.id||"main"
        });
        return;
      }
      // Mettre à jour l'état local depuis Firebase
      if(data.players) setPlayers(fromFb(data.players));
      if(data.comments) setComments(Object.values(data.comments).sort((a,b)=>b.ts-a.ts)); else setComments([]);
      if(data.queues) setQueues(queuesFromFb(data.queues));
      if(data.activeGames) setActiveGames(data.activeGames);
      if(data.arenaState) setArenaState(data.arenaState);
      if(data.lastResultAt) setLastResultAt(data.lastResultAt);
      if(typeof data.winnersPublished==="boolean") setWinnersPublished(data.winnersPublished);
      const loadedCodes=data.rosterCodes||{};
      // S'assurer que la session principale a toujours un code
      const mainId=data.activeRosterId||INITIAL_ROSTERS[0]?.id||"main";
      if(!loadedCodes[mainId]){
        const code=String(Math.floor(1000+Math.random()*9000));
        loadedCodes[mainId]=code;
        set(fbRef("state/rosterCodes"),loadedCodes);
      }
      setRosterCodes(loadedCodes);
      setPendingSessions(data.pendingSessions?Object.values(data.pendingSessions):[]);
      if(typeof data.liveMode==="boolean"){
        setLiveMode(data.liveMode);
        if(data.liveMode) setView(v=>v.type==="login"?{type:"liveLogin"}:v);
      }
      if(data.activeRosterId) setActiveRosterId(data.activeRosterId);
      if(data.extraRosters) setRosters([...INITIAL_ROSTERS,...Object.values(data.extraRosters).map(r=>({...r,entries:r.entries||[]}))]);

      setFbReady(true);
    });
    });

    return()=>{cancelled=true;if(stateRef)off(stateRef);};
  },[]);

  // ── Helpers écriture Firebase ───────────────────────────────────
  const fbSet=(path,value)=>set(fbRef("state/"+path),value);

  // ⚠️ RÉSERVÉS aux opérations globales volontaires (reset, activation de
  // session). Ne jamais les utiliser dans le flux de jeu: ils réécrivent
  // des blocs entiers et écrasent les écritures concurrentes des plateaux.
  const syncPlayers=(newPlayers)=>{setPlayers(newPlayers);fbSet("players",toFb(newPlayers));};
  const syncQueues=(newQueues)=>{setQueues(newQueues);fbSet("queues",queuesToFb(newQueues));};
  const syncGames=(newGames)=>{setActiveGames(newGames);fbSet("activeGames",newGames);};
  const syncArena=(newArena)=>{setArenaState(newArena);fbSet("arenaState",newArena);};

  // ── Écritures granulaires (anti-collision multi-plateaux) ──────
  // Une seule file, un seul joueur: chaque action n'écrit que son chemin.
  const syncZoneQueue=(zone,arr)=>{
    setQueues(q=>({...q,[zone]:arr}));
    fbUpdate({["state/queues/"+zone]:(arr&&arr.length>0)?arr:null});
  };
  const syncOnePlayer=(p)=>{
    setPlayers(ps=>ps.map(px=>px.id===p.id?p:px));
    fbUpdate({["state/players/"+p.id]:p});
  };


  // --- Roster management ---
  const activateRoster=(idx)=>{
    const r=rosters[idx];
    // Joueurs déjà inscrits dans ce groupe (via code)
    const existingGroupPlayers=players.filter(p=>p.groupId===r.id);
    const existingNames=new Set(existingGroupPlayers.map(p=>p.name.toLowerCase()));
    // Joueurs du template qui ne sont pas encore inscrits
    const templatePlayers=createPlayersFromRoster(r).map(p=>({...p,groupId:r.id}));
    const templateNotYetJoined=templatePlayers.filter(p=>!existingNames.has(p.name.toLowerCase()));
    // Fusionner : inscrits live + membres template manquants
    // Les inscrits gardent leurs données, les nouveaux arrivent frais
    const maxId=players.length>0?Math.max(...players.map(p=>p.id)):0;
    const templateWithIds=templateNotYetJoined.map((p,i)=>({...p,id:maxId+i+1,number:maxId+i+1}));
    const groupPlayers=[...existingGroupPlayers,...templateWithIds];
    const others=players.filter(p=>p.groupId!==r.id);
    const merged=[...others,...groupPlayers];
    setActiveRosterId(r.id);
    fbSet("activeRosterId",r.id);
    syncPlayers(merged);
    syncQueues(buildInitialQueues(groupPlayers));
    syncGames(makeEmptyGames());
    syncArena({active:false,ended:false,startTime:null,disabledZones:[]});
  };
  const syncExtraRosters=(newRosters)=>{
    const initialIds=new Set(INITIAL_ROSTERS.map(r=>r.id));
    const extra=newRosters.filter(r=>!initialIds.has(r.id));
    const obj={};extra.forEach(r=>{obj[r.id]=r;});
    fbSet("extraRosters",Object.keys(obj).length>0?obj:null);
  };
  const updateRoster=(idx,updated)=>{
    const a=[...rosters];a[idx]=updated;setRosters(a);syncExtraRosters(a);
  };
  const deleteRoster=(idx)=>{
    const a=rosters.filter((_,i)=>i!==idx);setRosters(a);syncExtraRosters(a);
  };
  const createRoster=()=>{
    const newR={id:"r"+Date.now(),name:"Nouvelle liste",entries:[]};
    const a=[...rosters,newR];setRosters(a);syncExtraRosters(a);
  };
  const addPlayerToSession=async(name,gender,callback,groupId="main")=>{
    // ID alloué par transaction Firebase: deux inscriptions simultanées
    // (deux bornes, deux mobiles) ne peuvent plus obtenir le même numéro.
    const localMax=players.length>0?Math.max(...players.map(p=>Number(p.id)||0)):0;
    const newId=await allocPlayerId(localMax);
    const newPlayer={id:newId,number:newId,name,gender:gender||"M",globalPoints:0,
      zoneScores:{purinstinct:50,speed:50,handAgility:50,footAgility:50,generalAgility:50,iq:50},
      zoneStreaks:{purinstinct:0,speed:0,handAgility:0,footAgility:0,generalAgility:0,iq:0},
      zonesPlayed:[],lastResult:null,history:[],
      groupId,
      age:"",email:"",instagram:"",tiktok:"",snapchat:"",
      photoConsent:false,videoConsent:false,profilePhoto:null,highlights:[]};
    setPlayers(ps=>[...ps,newPlayer]);
    fbUpdate({["state/players/"+newId]:newPlayer});
    if(callback) callback(newId);
  };


  // --- Queue management ---
  const fillQueue=(zone)=>{
    const isPlaying=(id)=>ZK.some(zk=>{const g=activeGames[zk];if(!g)return false;const all=g.participants||[...(g.teamA||[]),...(g.teamB||[])];return all.includes(id);});
    const shuffled=[...players].sort(()=>Math.random()-0.5);
    const existing=queues[zone]||[];
    const toAdd=shuffled.filter(p=>!existing.includes(p.id)&&!isPlaying(p.id));
    const newQ=[...existing,...toAdd.map(p=>p.id)];
    syncZoneQueue(zone,newQ);
  };

  const addToQueue=(id,zone,force=false)=>{
    if((arenaState.disabledZones||[]).includes(zone)) return;
    const {inQueues,playingAt}=getStatus(id,queues,activeGames);
    if(playingAt) return;
    if(queues[zone]&&queues[zone].includes(id)) return;
    if(!force&&inQueues.length>=2) return;
    syncZoneQueue(zone,[...queues[zone],id]);
  };

  // Borne kiosque: inscription (ou joueur déjà connu) + entrée directe dans la
  // file de la zone choisie, en un seul geste. force=true comme pour l'ajout
  // manuel côté StationView — la borne agit comme un responsable de plateau.
  const kioskRegister=(zone,name,gender,existingId,onDone)=>{
    if(existingId){ addToQueue(existingId,zone,true); onDone(); return; }
    addPlayerToSession(name,gender,(newId)=>{ addToQueue(newId,zone,true); onDone(); },activeRosterId);
  };

  const updatePlayer=(updated)=>syncOnePlayer(updated);
  const resetAllPoints=()=>{
    syncPlayers(players.map(p=>({...p,globalPoints:0,zonesPlayed:[],zoneScores:{}})));
  };
  const resetAllHistory=()=>{
    syncPlayers(players.map(p=>({...p,history:[]})));
  };
  const resetAllSurveys=()=>{
    syncPlayers(players.map(p=>({...p,surveyRanking:null})));
  };
  const addComment=(playerId,playerName,playerNumber,text)=>{
    const id="c"+Date.now()+"_"+Math.floor(Math.random()*1000);
    const newComment={id,playerId,playerName,playerNumber,text,ts:Date.now()};
    fbUpdate({["state/comments/"+id]:newComment});
  };
  const clearComments=()=>{fbSet("comments",null);setComments([]);};
  const removePlayer=(id)=>{
    const newQ={};ZK.forEach(zk=>{newQ[zk]=(queues[zk]||[]).filter(x=>x!==id&&x!==String(id));});
    setPlayers(ps=>ps.filter(p=>p.id!==id));
    setQueues(newQ);
    const writes={["state/players/"+id]:null};
    ZK.forEach(zk=>{
      if((queues[zk]||[]).length!==newQ[zk].length)
        writes["state/queues/"+zk]=newQ[zk].length>0?newQ[zk]:null;
    });
    fbUpdate(writes);
  };
  const removeFromQueue=(id,zone)=>syncZoneQueue(zone,queues[zone].filter(x=>x!==id));
  const reorderQueue=(zone,newQ)=>syncZoneQueue(zone,newQ);

  // --- Team generation ---
  const generateTeams=(zone,param,force=false)=>{
    const z=ZONES[zone];
    const currentQ=[...queues[zone]];
    const pMap={}; players.forEach(p=>{pMap[p.id]=p;});

    const selected=[];const requeued=[];
    const isPlaying=(id)=>ZK.some(zz=>{const g=activeGames[zz];if(!g)return false;const all=g.participants||[...(g.teamA||[]),...(g.teamB||[])];return all.includes(id);});

    let need;
    if(z.gameStyle==="sprint") need=param||z.minP;
    else if(z.gameStyle==="individual") need=param||z.minP;
    else if(z.teamSize) need=z.teamSize*2;
    else need=Math.min(currentQ.length,z.maxP);
    need=Math.max(need,z.minP);

    for(const id of currentQ){
      if(selected.length>=need) break;
      if(isPlaying(id)) requeued.push(id);
      else selected.push(id);
    }
    if(selected.length<2) return; // besoin d'au moins 2 joueurs
    if(!force&&selected.length<z.minP) return;

    const remaining=currentQ.filter(id=>!selected.includes(id)&&!requeued.includes(id));
    const newQ=[...remaining,...requeued];

    let gameData;
    if(z.gameStyle==="sprint"){
      const sorted=[...selected].sort((a,b)=>((pMap[a]?.zoneScores||{}).speed||50)-((pMap[b]?.zoneScores||{}).speed||50));
      gameData={type:"sprint",participants:sorted};
    } else if(z.gameStyle==="individual"||z.gameStyle==="duel"){
      const s=shuffle(selected.slice(0,need));
      gameData={type:"individual",participants:s};
    } else if(z.teamSize){
      // Forcer exactement teamSize*2 joueurs, distribués en snake draft équilibré
      const exact=z.teamSize*2;
      const pool=selected.slice(0,exact);
      // Si on n'a pas le bon nombre exact, on prend le multiple pair le plus proche
      const even=pool.length%2===0?pool.length:pool.length-1;
      const half=even/2;
      const getScore=(id)=>zone==="purinstinct"
        ?(pMap[id]?.globalPoints||0)
        :(pMap[id]?.zoneScores?.[zone]||50);
      const sorted=[...pool.slice(0,even)].sort((a,b)=>getScore(b)-getScore(a));
      const teamA=[],teamB=[];
      sorted.forEach((id,i)=>{
        const round=Math.floor(i/2);
        if(round%2===0)(i%2===0?teamA:teamB).push(id);
        else(i%2===0?teamB:teamA).push(id);
      });
      gameData={type:"team",teamA,teamB};
    } else {
      const getScore=(id)=>(pMap[id]?.zoneScores?.[zone]||50);
      const even=selected.length%2===0?selected.length:selected.length-1;
      const sorted=[...selected.slice(0,even)].sort((a,b)=>getScore(b)-getScore(a));
      const teamA=[],teamB=[];
      sorted.forEach((id,i)=>{
        const round=Math.floor(i/2);
        if(round%2===0)(i%2===0?teamA:teamB).push(id);
        else(i%2===0?teamB:teamA).push(id);
      });
      gameData={type:"team",teamA,teamB};
    }

    setQueues(q=>({...q,[zone]:newQ}));
    setActiveGames(g=>({...g,[zone]:gameData}));
    fbUpdate({
      ["state/queues/"+zone]:newQ.length>0?newQ:null,
      ["state/activeGames/"+zone]:gameData
    });
  };

  // --- Cancel game: remettre les joueurs en tête de file dans le même ordre ---
  const cancelGame=(zone)=>{
    const game=activeGames[zone];
    if(!game) return;
    const inGame=game.type==="team"
      ?[...(game.teamA||[]),...(game.teamB||[])]
      :(game.participants||[]);
    // Remettre en tête de file dans le même ordre
    const existing=(queues[zone]||[]).filter(id=>!inGame.includes(id));
    const newQ=[...inGame,...existing];
    setQueues(q=>({...q,[zone]:newQ}));
    setActiveGames(g=>({...g,[zone]:null}));
    fbUpdate({
      ["state/queues/"+zone]:newQ.length>0?newQ:null,
      ["state/activeGames/"+zone]:null
    });
  };

  // --- Submit result ---
  const submitResult=(zone,winner,secondId=null)=>{
    const game=activeGames[zone];
    if(!game) return;
    const inGame=game.type==="team"
      ?[...(game.teamA||[]),...(game.teamB||[])]
      :(game.participants||[]);
    let updated;
    if(game.type==="team"){
      updated=computeTeamResult(players,game.teamA||[],game.teamB||[],winner,zone);
    } else {
      updated=computeIndividualResult(players,game.participants||[],winner,zone,secondId);
    }
    const newGames={...activeGames,[zone]:null};
    const refilled=refillQueues(updated,queues,newGames);
    // Mise à jour locale immédiate
    const stamp=Date.now();
    setPlayers(updated);
    setActiveGames(newGames);
    setQueues(refilled);
    setLastResultAt(la=>({...la,[zone]:stamp}));
    // Écriture granulaire atomique: SEULS les joueurs du match, le match
    // de cette zone, et les files réellement modifiées sont écrits.
    // Deux plateaux peuvent soumettre en même temps sans s'écraser.
    const writes={["state/activeGames/"+zone]:null};
    const inSet=new Set(inGame.map(Number));
    updated.forEach(p=>{
      if(inSet.has(Number(p.id))) writes["state/players/"+p.id]=p;
    });
    ZK.forEach(zk=>{
      const before=queues[zk]||[],after=refilled[zk]||[];
      if(before.length!==after.length||before.some((v,i)=>v!==after[i]))
        writes["state/queues/"+zk]=after.length>0?after:null;
    });
    // Chevauche l'écriture atomique existante (jamais un fbUpdate séparé)
    writes["state/lastResultAt/"+zone]=stamp;
    fbUpdate(writes);
  };

  // --- Remove player from active game ---
  const removeFromGame=(zone,playerId)=>{
    const game=activeGames[zone];
    if(!game) return;
    const applyZone=(newQ,newGame)=>{
      setQueues(q=>({...q,[zone]:newQ}));
      setActiveGames(g=>({...g,[zone]:newGame}));
      fbUpdate({
        ["state/queues/"+zone]:newQ.length>0?newQ:null,
        ["state/activeGames/"+zone]:newGame
      });
    };
    if(game.type==="team"){
      const newA=(game.teamA||[]).filter(id=>id!==playerId);
      const newB=(game.teamB||[]).filter(id=>id!==playerId);
      if(newA.length+newB.length<ZONES[zone].minP){
        applyZone([...queues[zone],...(game.teamA||[]),...(game.teamB||[])],null);
      } else {
        applyZone([...queues[zone],playerId],{...game,teamA:newA,teamB:newB});
      }
    } else {
      const newP=(game.participants||[]).filter(id=>id!==playerId);
      if(newP.length<ZONES[zone].minP){
        applyZone([...queues[zone],...(game.participants||[])],null);
      } else {
        applyZone([...queues[zone],playerId],{...game,participants:newP});
      }
    }
  };

  // --- Replace 1 player from queue ---
  const replaceInGame=(zone)=>{
    const game=activeGames[zone];
    if(!game) return;
    const inGame=game.participants||[...(game.teamA||[]),...(game.teamB||[])];
    const nextId=queues[zone].find(id=>!inGame.includes(id)&&!ZK.some(zz=>{const g=activeGames[zz];if(!g)return false;const all=g.participants||[...(g.teamA||[]),...(g.teamB||[])];return all.includes(id);}));
    if(!nextId) return;
    const pMap={}; players.forEach(p=>{pMap[p.id]=p;});
    const newQ=queues[zone].filter(id=>id!==nextId);
    const applyZone=(newGame)=>{
      setQueues(q=>({...q,[zone]:newQ}));
      setActiveGames(g=>({...g,[zone]:newGame}));
      fbUpdate({
        ["state/queues/"+zone]:newQ.length>0?newQ:null,
        ["state/activeGames/"+zone]:newGame
      });
    };
    if(game.type==="team"){
      let newA=[...(game.teamA||[])],newB=[...(game.teamB||[])];
      if(newA.length<=newB.length) newA.push(nextId); else newB.push(nextId);
      applyZone({...game,teamA:newA,teamB:newB});
    } else {
      let newP=[...(game.participants||[]),nextId];
      if(game.type==="sprint") newP=newP.sort((a,b)=>((pMap[a]?.zoneScores||{}).speed||50)-((pMap[b]?.zoneScores||{}).speed||50));
      applyZone({...game,participants:newP});
    }
  };

  const onLangToggle=()=>setLang(l=>l==="fr"?"en":"fr");

  // Always returns to test landing when in test mode
  const testHome=()=>setView({type:"testLogin"});

  // --- Routing ---
  let content=null;
  if(!fbReady){
    content=(
      <div style={{minHeight:"100vh",background:"#0A0A0A",display:"flex",alignItems:"center",justifyContent:"center"}}>
        <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:28,color:"#B8E020",letterSpacing:4}}>PURINSTINCT</div>
      </div>
    );
  } else if(view.type==="login") content=(
    <ModeSelectView
      onSelectMode={(modeKey)=>{
        // "games" = comportement Live actuel, référence — ne jamais régresser.
        if(modeKey==="games"){
          fbSet("liveMode",true);setIsTestMode(false);setWinnersPublished(false);
          fbSet("winnersPublished",false);syncQueues(makeEmptyQueues());
          setView({type:"liveLogin"});
          return;
        }
        // "admin" = raccourci caché, tout débloqué — reprend l'ancien TEST MODE.
        if(modeKey==="admin"){
          fbSet("liveMode",false);
          setIsTestMode(true);
          const testQ={};
          ZK.forEach(zk=>{testQ[zk]=TEST_PLAYERS.map(p=>p.id);});
          setQueues(testQ);
          const testAug={};
          AUG_GAMES.forEach(g=>{testAug[g.id]={queue:TEST_PLAYERS.map(p=>p.name),activeMatch:null};});
          setAugState(testAug);
          setView({type:"testLogin"});
          return;
        }
        // corporate / ecole / festival / parc: routing + vues dédiées arrivent
        // à l'étape 3 (activationMode + montage conditionnel par enabledViews).
        setView({type:"modeStub",mode:modeKey});
      }}/>
  );

  else if(view.type==="modeStub") content=(
    <div style={{minHeight:"100vh",background:"#0A0A0A",fontFamily:"'DM Sans',sans-serif",
      display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24,gap:16}}>
      <style>{FONTS}</style>
      <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontStyle:"italic",fontSize:24,color:"#B8E020"}}>
        ✅ CODE RECONNU
      </div>
      <div style={{fontSize:14,color:"#9ca3af",textTransform:"uppercase",letterSpacing:2}}>mode: {view.mode}</div>
      <div style={{fontSize:12,color:"#4b5563",maxWidth:280,textAlign:"center"}}>
        Vues dédiées à ce mode — arrivent à l'étape 3.
      </div>
      <button onClick={()=>setView({type:"login"})}
        style={{marginTop:12,padding:"10px 20px",borderRadius:12,background:"#111827",
          border:"1px solid #B8E02040",color:"#B8E020",cursor:"pointer",fontSize:13,fontWeight:700}}>
        ← Retour
      </button>
    </div>
  );

  else if(view.type==="kiosk") content=(
    <KioskView players={players.filter(p=>(p.groupId||"main")===activeRosterId)}
      disabledZones={arenaState.disabledZones||[]}
      lockedZone={view.zone}
      onRegister={kioskRegister}/>
  );

  else if(view.type==="liveLogin") content=(
    <LiveLoginView players={players} queues={queues} disabledZones={arenaState.disabledZones||[]}
        rosterCodes={rosterCodes}
        onAddPlayer={addPlayerToSession}
        onRequestSolo={(name,gender,callback)=>{
          const soloGroupId="solo_"+Date.now();
          let soloCode;
          const usedCodes=Object.values(rosterCodes||{});
          do { soloCode=String(Math.floor(1000+Math.random()*9000)); }
          while(usedCodes.includes(soloCode));
          const newCodes={...(rosterCodes||{}),[soloGroupId]:soloCode};
          setRosterCodes(newCodes);
          fbSet("rosterCodes",newCodes);
          addPlayerToSession(name,gender,(newId)=>{
            if(callback) callback(newId);
            const newSession={id:soloGroupId,name,gender,playerId:newId,groupId:soloGroupId,
              createdAt:new Date().toLocaleTimeString("fr-CA",{hour:"2-digit",minute:"2-digit"}),status:"pending"};
            setPendingSessions(prev=>[...prev,newSession]);
            fbUpdate({["state/pendingSessions/"+newSession.id]:newSession});
          },soloGroupId);
        }}
        onLogin={(t,id)=>setView({type:t,id})}
        onGoTest={()=>{fbSet("liveMode",false);setWinnersPublished(false);fbSet("winnersPublished",false);syncQueues(buildInitialQueues(players));setView({type:"login"});}}/>
  );

  else if(view.type==="testLogin") content=(
    <TestLanding onEnter={(zk)=>{
      if(zk==="augmented") setView({type:"augmentedLanding"});
      else if(zk) setView({type:"station",id:zk});
      else setView({type:"adminHome"});
    }}/>
  );

  else if(view.type==="augmentedLanding") content=(
    <AugmentedLanding
      augState={augState}
      onSelect={(gameId)=>setView({type:"augmentedStation",id:gameId})}
      onBack={()=>setView({type:"testLogin"})}/>
  );

  else if(view.type==="augmentedStation") content=(
    <AugmentedStation
      gameId={view.id}
      gameState={augState[view.id]||{queue:[],activeMatch:null}}
      onUpdate={(gameId,newState)=>setAugState(prev=>({...prev,[gameId]:newState}))}
      onBack={()=>setView({type:"augmentedLanding"})}/>
  );

  else if(view.type==="testLoginFull") content=(
    <LoginView players={players} queues={queues} disabledZones={arenaState.disabledZones||[]}
        onLogin={(t,id)=>setView({type:t,id})}
        onGoLive={()=>{fbSet("liveMode",true);setWinnersPublished(false);fbSet("winnersPublished",false);syncQueues(makeEmptyQueues());setView({type:"liveLogin"});}}/>
  );

  else if(view.type==="adminHome") content=(
    <div style={{minHeight:"100vh",background:"#0A0A0A",fontFamily:"'DM Sans',sans-serif",
      display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24}}>
      <style>{FONTS}</style>
      <div style={{textAlign:"center",marginBottom:32}}>
        <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontStyle:"italic",fontSize:28,color:"#fff",letterSpacing:2}}>🛡️ ADMIN</div>
        <div style={{fontSize:12,color:"#4b5563",marginTop:4}}>{T[lang].adminCentre}</div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,width:"100%",maxWidth:360}}>
        {[
          {icon:"⚡",label:T[lang].sessionInProgress,sub:T[lang].sessionSub,color:"#B8E020",action:()=>setView({type:"admin"})},
          {icon:"📍",label:T[lang].stationManagerShort,sub:T[lang].stationManagerSub,color:"#f97316",action:()=>setView({type:"stationPick"})},
          {icon:"📋",label:T[lang].sessionsTab,sub:T[lang].sessionsSub,color:"#3b82f6",action:()=>setView({type:"admin",tab:"session"})},
          {icon:null,label:T[lang].disconnectShort,sub:T[lang].disconnectSub,color:"#ef4444",isLogout:true,action:()=>isTestMode?testHome():setView({type:"liveLogin"})},
        ].map(({icon,label,sub,color,action,isLogout})=>(
          <button key={label} onClick={action}
            style={{padding:"24px 16px",border:"1px solid "+color+"30",clipPath:S.clip(14),
              background:"#0d0f1a",cursor:"pointer",textAlign:"center",
              display:"flex",flexDirection:"column",alignItems:"center",gap:8,
              transition:"all .15s"}}
            onMouseEnter={e=>{e.currentTarget.style.background=color+"15";e.currentTarget.style.borderColor=color+"80";}}
            onMouseLeave={e=>{e.currentTarget.style.background="#0d0f1a";e.currentTarget.style.borderColor=color+"30";}}>
            {isLogout
              ?<div style={{width:40,height:40,borderRadius:"50%",border:"3px solid #ef4444",display:"flex",alignItems:"center",justifyContent:"center",position:"relative"}}>
                  <div style={{position:"absolute",width:"70%",height:3,background:"#ef4444",borderRadius:2,transform:"rotate(45deg)"}}/>
                </div>
              :<div style={{fontSize:36}}>{icon}</div>}
            <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontStyle:"italic",fontSize:16,color:"#fff",lineHeight:1.2}}>{label}</div>
            <div style={{fontSize:11,color:"#4b5563"}}>{sub}</div>
          </button>
        ))}
      </div>
      {arenaState.active&&(
        <div style={{marginTop:20,fontSize:12,color:"#B8E020",fontWeight:600}}>
          {T[lang].sessionActiveNote}
        </div>
      )}
      <LangFooter/>
    </div>
  );

  else if(view.type==="admin") content=(
    <AdminView players={isTestMode?TEST_PLAYERS:players.filter(p=>{
      if((p.groupId||"main")===activeRosterId) return true;
      if(ZK.some(zk=>queues[zk]&&queues[zk].includes(p.id))) return true;
      if(ZK.some(zk=>{const g=activeGames[zk];if(!g)return false;const all=g.participants||[...(g.teamA||[]),...(g.teamB||[])];return all.includes(p.id);})) return true;
      return false;
    })} allPlayers={isTestMode?TEST_PLAYERS:players} queues={queues} activeGames={activeGames} arenaState={arenaState} lastResultAt={lastResultAt} rosters={rosters} activeRosterId={activeRosterId} initialTab={view.tab}
      onStart={(mins)=>syncArena({...arenaState,active:true,ended:false,paused:false,startTime:Date.now(),sessionMins:mins||75})}
      onEnd={()=>syncArena({active:false,ended:false,paused:false,startTime:null,pausedRemaining:null,disabledZones:arenaState.disabledZones||[],sessionMins:arenaState.sessionMins||75})}
      onPause={()=>{
        const rem=Math.max(0,(arenaState.sessionMins||75)*60-(Date.now()-arenaState.startTime)/1000);
        syncArena({...arenaState,active:false,paused:true,pausedRemaining:rem});
      }}
      onResume={()=>syncArena({...arenaState,active:true,paused:false,startTime:Date.now()-((arenaState.sessionMins||75)*60-arenaState.pausedRemaining)*1000,pausedRemaining:null})}
      onUpdateDuration={(mins)=>syncArena({...arenaState,sessionMins:mins})}
      onGoStation={()=>isTestMode?testHome():setView({type:"stationPick"})}
      onToggleZone={(zk)=>{
        const dz=arenaState.disabledZones||[];
        syncArena({...arenaState,disabledZones:dz.includes(zk)?dz.filter(z=>z!==zk):[...dz,zk]});
      }}
      onAddQ={addToQueue} onRemoveQ={removeFromQueue}
      onAddGroupToQueue={(groupId,pendingSession)=>{
        // 1. Préparer le nouveau roster
        const initialIds=new Set(INITIAL_ROSTERS.map(r=>r.id));
        const newRoster=(pendingSession&&!rosters.find(r=>r.id===groupId))
          ?{id:groupId,name:(pendingSession.name||groupId)+" (solo)",entries:[]}
          :null;
        const nextRosters=newRoster?[...rosters,newRoster]:rosters;
        const extraObj={};
        nextRosters.filter(r=>!initialIds.has(r.id)).forEach(r=>{extraObj[r.id]=r;});
        // 2. Préparer les sessions en attente
        const updatedPending=pendingSession
          ?pendingSessions.filter(x=>x.id!==pendingSession.id)
          :pendingSessions;
        // 3. Ajouter aux files si des joueurs sont trouvés
        const byGroup=players.filter(p=>p.groupId===groupId);
        const byPlayerId=pendingSession?.playerId?players.filter(p=>Number(p.id)===Number(pendingSession.playerId)):[];
        const allIds=new Set([...byGroup.map(p=>p.id),...byPlayerId.map(p=>p.id)]);
        const groupP=players.filter(p=>allIds.has(p.id));
        const newQ={};
        ZK.forEach(zk=>{
          const existing=[...(queues[zk]||[])];
          groupP.forEach(p=>{if(!existing.includes(p.id)&&!existing.includes(String(p.id)))existing.push(p.id);});
          newQ[zk]=existing;
        });
        // 4. Mise à jour locale immédiate
        if(newRoster) setRosters(nextRosters);
        setPendingSessions(updatedPending);
        if(groupP.length>0) setQueues(newQ);
        // 5. Écriture granulaire atomique: seules les files modifiées,
        // la session retirée et les rosters extra sont écrits.
        const writes={};
        writes["state/extraRosters"]=Object.keys(extraObj).length>0?extraObj:null;
        if(pendingSession) writes["state/pendingSessions/"+pendingSession.id]=null;
        if(groupP.length>0){
          ZK.forEach(zk=>{
            if((queues[zk]||[]).length!==newQ[zk].length)
              writes["state/queues/"+zk]=newQ[zk].length>0?newQ[zk]:null;
          });
        }
        fbUpdate(writes);
      }}
      onLogout={()=>{setWinnersPublished(false);fbSet("winnersPublished",false);isTestMode?testHome():setView({type:"adminHome"});}}
      onActivateRoster={activateRoster}
      onSetActiveRoster={(id)=>{setActiveRosterId(id);fbSet("activeRosterId",id);}}
      onUpdateRoster={updateRoster} onDeleteRoster={deleteRoster}
      activeRosterId={activeRosterId}
      onAddPlayer={addPlayerToSession} onCreateRoster={createRoster}
      onUpdatePlayer={updatePlayer} onRemovePlayer={removePlayer}
      onResetAllPoints={resetAllPoints}
      onResetAllHistory={resetAllHistory}
      onResetAllSurveys={resetAllSurveys}
      comments={comments}
      onClearComments={clearComments}
      rosterCodes={rosterCodes} onUpdateCodes={(codes)=>{setRosterCodes(codes);fbSet("rosterCodes",codes);}}
      pendingSessions={pendingSessions}
      onDismissPending={(id)=>{
        setPendingSessions(pendingSessions.filter(x=>x.id!==id));
        fbUpdate({["state/pendingSessions/"+id]:null});
      }}
      onPromotePending={(s,code)=>{
        const newRoster={id:s.id,name:s.name+" (solo)",entries:[{name:s.name,gender:s.gender}]};
        setRosters(r=>[...r,newRoster]);
        const newCodes={...rosterCodes,[s.id]:code};
        setRosterCodes(newCodes);fbSet("rosterCodes",newCodes);
        setPendingSessions(pendingSessions.filter(x=>x.id!==s.id));
        fbUpdate({["state/pendingSessions/"+s.id]:null});
      }}
      winnersPublished={winnersPublished}
      onPublishWinners={()=>{setWinnersPublished(true);fbSet("winnersPublished",true);}}
      onUnpublishWinners={()=>{setWinnersPublished(false);fbSet("winnersPublished",false);}}
      augState={augState}
      onUpdateAugState={(gameId,newState)=>setAugState(prev=>({...prev,[gameId]:newState}))}
      onUpdatePlayer2={updatePlayer}/>
  );

  else if(view.type==="station") content=(
    <StationView zone={view.id} players={isTestMode?TEST_PLAYERS:players.filter(p=>{
      if((p.groupId||"main")===activeRosterId) return true;
      if(ZK.some(zk=>queues[zk]&&queues[zk].includes(p.id))) return true;
      if(ZK.some(zk=>{const g=activeGames[zk];if(!g)return false;const all=g.participants||[...(g.teamA||[]),...(g.teamB||[])];return all.includes(p.id);})) return true;
      return false;
    })}
      queue={queues[view.id]||[]}
      activeGame={activeGames[view.id]}
      disabled={(arenaState.disabledZones||[]).includes(view.id)}
      arenaState={arenaState}
      sessionName={(rosters.find(r=>r.id===activeRosterId)||{name:"Session Standard"}).name}
      sessionCode={(rosterCodes||{})[activeRosterId]||null}
      onAddQ={addToQueue} onRemoveQ={removeFromQueue}
      onGenerate={(p,force)=>generateTeams(view.id,p,force)}
      onResult={(w,second)=>submitResult(view.id,w,second)}
      onCancelGame={cancelGame}
      onRemoveFromGame={removeFromGame}
      onReplaceInGame={replaceInGame}
      onReorderQ={reorderQueue}
      onBack={()=>isTestMode?testHome():setView({type:"stationPick",fromPlayerId:view.fromPlayerId})}
      onGoAdmin={()=>isTestMode?testHome():view.fromPlayerId?setView({type:"player",id:view.fromPlayerId}):setView({type:"adminHome"})}
      onLogout={()=>isTestMode?testHome():setView({type:"liveLogin"})}
      fromPlayerId={view.fromPlayerId}
      onFillQueue={()=>fillQueue(view.id)}/>
  );

  else if(view.type==="stationPick") content=(
    <div style={{minHeight:"100vh",background:"#0A0A0A",fontFamily:"'DM Sans',sans-serif",
      display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24}}>
      <style>{FONTS}</style>
      <div style={{width:"100%",maxWidth:380}}>
        <div style={{textAlign:"center",marginBottom:24}}>
          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontStyle:"italic",fontSize:22,color:"#fff"}}>{T[lang].chooseStation}</div>
          {(rosterCodes||{})[activeRosterId]&&<div style={{fontSize:12,color:"#4b5563",marginTop:4}}>
            {(rosters.find(r=>r.id===activeRosterId)||{name:"Session Standard"}).name}
            <span style={{color:"#B8E020",fontWeight:700,letterSpacing:3,marginLeft:8}}>{(rosterCodes||{})[activeRosterId]}</span>
          </div>}
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:24}}>
          {ZK.map(zk=>{
            const z=ZONES[zk];const zl=zn(zk,lang);
            const isOff=(arenaState.disabledZones||[]).includes(zk);
            return(
              <button key={zk} onClick={()=>setView({type:"station",id:zk,fromPlayerId:view.fromPlayerId})}
                style={{padding:"14px 16px",border:"1px solid "+(isOff?"#ef444440":z.border),clipPath:S.clip(10),
                  background:isOff?"#1a0a0a":z.bg,color:isOff?"#ef4444":z.color,cursor:"pointer",
                  display:"flex",alignItems:"center",gap:12,opacity:isOff?0.7:1}}>
                <span style={{fontSize:22}}>{z.icon}</span>
                <span style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontStyle:"italic",fontSize:16,letterSpacing:.5,flex:1,textAlign:"left"}}>{zl.name}</span>
                {isOff&&<span style={{fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:10,
                  background:"#ef444420",color:"#ef4444",border:"1px solid #ef444440"}}>{T[lang].stationDisabled}</span>}
              </button>
            );
          })}
        </div>
        {view.fromPlayerId?(
          <button onClick={()=>setView({type:"player",id:view.fromPlayerId})}
            style={{width:"100%",padding:"12px",borderRadius:12,background:"#111827",
              border:"1px solid #B8E02040",color:"#B8E020",cursor:"pointer",fontSize:13,fontWeight:700,marginBottom:8}}>
            {T[lang].returnAsPlayer}
          </button>
        ):(
          <button onClick={()=>isTestMode?testHome():setView({type:"admin"})}
            style={{width:"100%",padding:"12px",borderRadius:12,background:"#111827",
              border:"1px solid #B8E02040",color:"#B8E020",cursor:"pointer",fontSize:13,fontWeight:700,marginBottom:8}}>
            {isTestMode?"← Retour":T[lang].switchToAdmin}
          </button>
        )}
        <button onClick={()=>isTestMode?testHome():setView({type:"liveLogin"})}
          style={{width:"100%",padding:"12px",borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",gap:10,
            border:"1px solid #ef444440",color:"#ef4444",cursor:"pointer",fontSize:13,fontWeight:600,background:"none"}}>
          <div style={{width:20,height:20,borderRadius:"50%",border:"2px solid #ef4444",display:"flex",alignItems:"center",justifyContent:"center",position:"relative",flexShrink:0}}>
            <div style={{position:"absolute",width:"70%",height:2,background:"#ef4444",borderRadius:1,transform:"rotate(45deg)"}}/>
          </div>
          {T[lang].disconnectSession}
        </button>
      </div>
      <LangFooter/>
    </div>
  );

  else if(view.type==="player"){
    const p=players.find(px=>px.id===view.id);
    if(p){
      const groupPlayers=players.filter(px=>px.groupId===(p.groupId||"main"));
      content=(
        <PlayerView playerId={view.id} players={groupPlayers} queues={queues} activeGames={activeGames}
          disabledZones={arenaState.disabledZones||[]}
          arenaState={arenaState}
          rosterCodes={rosterCodes}
          sessionRosterId={p.groupId||"main"}
          winnersPublished={winnersPublished}
          onJoin={addToQueue} onLeave={removeFromQueue}
          onLogout={()=>isTestMode?testHome():setView({type:"liveLogin"})}
          onBecomeStation={()=>isTestMode?testHome():setView({type:"stationPick",fromPlayerId:view.id})}
          onUpdatePlayer={updatePlayer}
          onAddComment={(text)=>{const p=players.find(px=>px.id===view.id);if(p)addComment(p.id,p.name,p.number,text);}}/>
      );
    }
  }

  return <LangContext.Provider value={{lang,setLang}}>{content}</LangContext.Provider>;
}

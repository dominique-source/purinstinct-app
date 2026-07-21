import { useState } from "react";
import QRCode from "qrcode";
import { useT } from "../../../hooks/useLang.js";
import { BASE_URL } from "../../../config/constants.js";
import { Bib } from "../../shared/Bib.jsx";
import { Timer, ScoreDisplay } from "../../ui/Numerals.jsx";
import { Eyebrow } from "../../ui/Panel.jsx";
import { Modal } from "../../ui/Modal.jsx";
import { Button } from "../../ui/Button.jsx";

// Grid-launcher hub — the first thing a player sees after login. Broadcast
// identity block up top (bib/name/score/rank/arena clock), then one cut-corner
// destination tile per action. Tile accents are functional wayfinding (one
// color per destination), not decoration — each tile is a single flat surface.
export function PlayerHubView({player,rank,hubPts,arenaTimer,arenaStatus,arenaState,rosterCodes,sessionRosterId,onBecomeStation,onLogout,onGoStats,onGoRules,onGoQueue,onGoLeaderboard}){
  const t=useT();
  const [sessionQR,setSessionQR]=useState(null);
  const [showQR,setShowQR]=useState(false);

  const openInvite=async()=>{
    const code=rosterCodes&&sessionRosterId?rosterCodes[sessionRosterId]:null;
    if(!code) return;
    if(!sessionQR){
      const url=BASE_URL+"?code="+code;
      const dataUrl=await QRCode.toDataURL(url,{width:240,margin:2,color:{dark:"#ffffff",light:"#0A0A0A"}});
      setSessionQR(dataUrl);
    }
    setShowQR(true);
  };

  const tiles=[
    {key:"stats",label:"Mes stats",sub:"Score · Zones · Historique",accent:"var(--pi-lime)",content:
      <div style={{fontFamily:"var(--pi-font-display)",fontWeight:900,fontStyle:"italic",fontSize:32,color:"var(--pi-lime)",lineHeight:1}}>{hubPts}</div>,
      action:onGoStats},
    {key:"rules",label:"Règlements",sub:"Comment jouer",accent:"var(--pi-info)",icon:"📖",action:onGoRules},
    {key:"invite",label:"Inviter un ami",sub:"Code + QR de la partie",accent:"#a855f7",content:
      <div style={{width:36,height:36,borderRadius:"50%",background:"#a855f7",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:900,color:"#fff"}}>+</div>,
      action:openInvite},
    {key:"queue",label:t.hubQueue,sub:t.hubQueueSub,accent:"var(--pi-warn)",icon:"⚡",action:onGoQueue},
    {key:"leaderboard",label:t.hubLeaderboard,sub:t.hubLeaderboardSub,accent:"#eab308",icon:"🏆",action:onGoLeaderboard},
    ...(onBecomeStation?[{key:"station",label:t.hubStation,sub:t.hubStationSub,accent:"var(--pi-warn)",icon:"📍",action:onBecomeStation}]:[]),
    {key:"logout",label:t.hubDisconnect,sub:t.hubDisconnectSub,accent:"var(--pi-danger)",content:
      <div style={{width:36,height:36,borderRadius:"50%",border:"3px solid var(--pi-danger)",display:"flex",alignItems:"center",justifyContent:"center",position:"relative"}}>
        <div style={{position:"absolute",width:"70%",height:3,background:"var(--pi-danger)",borderRadius:2,transform:"rotate(45deg)"}}/>
      </div>,
      action:onLogout},
  ];

  return(
    <div style={{minHeight:"100svh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
      paddingTop:"calc(env(safe-area-inset-top) + var(--pi-s6))",paddingBottom:"var(--pi-s6)",paddingLeft:"var(--pi-gutter)",paddingRight:"var(--pi-gutter)"}}>

      {/* Identity block */}
      <div style={{textAlign:"center",marginBottom:"var(--pi-s8)"}}>
        <Bib n={player.number} size="lg"/>
        <div style={{fontWeight:700,color:"var(--pi-text)",fontSize:"var(--pi-fs-card)",marginTop:"var(--pi-s2)"}}>{player.name}</div>
        <div style={{display:"flex",alignItems:"baseline",gap:"var(--pi-s2)",justifyContent:"center",marginTop:"var(--pi-s1)"}}>
          <ScoreDisplay value={hubPts} unit="pts" size={28} style={{textShadow:"0 0 24px var(--pi-lime-glow)"}}/>
          <span style={{fontSize:"var(--pi-fs-label)",color:"var(--pi-text-3)"}}>Rang #{rank}</span>
        </div>
        {arenaState&&(
          <div style={{marginTop:"var(--pi-s2)"}}>
            <Timer value={arenaTimer} tone={arenaStatus==="active"?"live":arenaStatus==="paused"?"paused":undefined}
              size={16} className={arenaStatus==="active"?"pi-pulse":undefined}/>
            {arenaStatus!=="waiting"&&<span style={{fontSize:"var(--pi-fs-label)",color:"var(--pi-text-3)",marginLeft:6}}>
              {arenaStatus==="active"?t.statusActive:arenaStatus==="paused"?t.statusPaused:""}
            </span>}
          </div>
        )}
      </div>

      {/* Destination grid */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"var(--pi-s3)",width:"100%",maxWidth:380}}>
        {tiles.map(({key,label,sub,accent,icon,content,action})=>(
          <button key={key} onClick={action}
            style={{padding:"var(--pi-s5) var(--pi-s3)",border:`1px solid ${accent}30`,
              clipPath:"polygon(var(--pi-cut) 0,100% 0,100% calc(100% - var(--pi-cut)),calc(100% - var(--pi-cut)) 100%,0 100%,0 var(--pi-cut))",
              background:"var(--pi-surface-1)",cursor:"pointer",textAlign:"center",
              display:"flex",flexDirection:"column",alignItems:"center",gap:"var(--pi-s1)",
              transition:`background var(--pi-dur-fast) var(--pi-ease-out), border-color var(--pi-dur-fast) var(--pi-ease-out)`}}
            onMouseEnter={e=>{e.currentTarget.style.background=accent+"15";e.currentTarget.style.borderColor=accent+"80";}}
            onMouseLeave={e=>{e.currentTarget.style.background="var(--pi-surface-1)";e.currentTarget.style.borderColor=accent+"30";}}>
            {content||<div style={{fontSize:30}}>{icon}</div>}
            <div style={{fontFamily:"var(--pi-font-display)",fontWeight:900,fontStyle:"italic",fontSize:"var(--pi-fs-card)",color:"var(--pi-text)",lineHeight:1.2}}>{label}</div>
            <div style={{fontSize:"var(--pi-fs-meta)",color:"var(--pi-text-3)"}}>{sub}</div>
          </button>
        ))}
      </div>

      {/* Invite QR modal */}
      <Modal open={showQR} onClose={()=>setShowQR(false)} labelledBy="invite-title">
        <div style={{textAlign:"center"}}>
          <h2 id="invite-title" style={{fontFamily:"var(--pi-font-display)",fontWeight:900,fontStyle:"italic",fontSize:"var(--pi-fs-section)",color:"var(--pi-text)",marginBottom:"var(--pi-s1)"}}>
            Inviter un ami
          </h2>
          <Eyebrow style={{marginBottom:"var(--pi-s4)"}}>
            Code : <span style={{color:"var(--pi-lime)",fontWeight:700,letterSpacing:4}}>{rosterCodes&&sessionRosterId?rosterCodes[sessionRosterId]:""}</span>
          </Eyebrow>
          {sessionQR&&<img src={sessionQR} alt="QR" style={{width:200,height:200,borderRadius:"var(--pi-r-md)",display:"block",margin:"0 auto"}}/>}
          <Button variant="secondary" style={{marginTop:"var(--pi-s4)"}} onClick={()=>setShowQR(false)}>Fermer</Button>
        </div>
      </Modal>
    </div>
  );
}

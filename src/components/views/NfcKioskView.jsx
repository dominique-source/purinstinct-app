import { useState, useEffect, useRef } from "react";
import { FONTS } from "../../config/fonts.js";
import { useT } from "../../hooks/useLang.js";
import braceletLime from "../../assets/bracelet-lime.png";
import { isWebNfcSupported, scanNfc } from "../../lib/webNfc.js";
import { parseNfcToken, resolvePlayerId } from "../../lib/nfc.js";
import { BASE_URL } from "../../config/constants.js";
import { PlayerView } from "./PlayerView.jsx";

const NFC_REREAD_DEBOUNCE_MS = 1500; // évite les doubles lectures d'un même bracelet posé sur le lecteur
const AUTO_HIDE_MS = 60000; // revient à l'accroche après ce délai, même sans action du joueur

// Poste fixe public ("main desk"), accessible via ?nfcKiosk=1: écran d'accroche
// "tape ton bracelet" en boucle, et à chaque lecture le profil complet du
// joueur associé s'affiche (même PlayerView que sur son propre téléphone),
// avant de revenir automatiquement à l'accroche. Lecture seule côté scan —
// jamais de verrouillage/écriture du tag.
export function NfcKioskView({players,nfcTags,queues,activeGames,disabledZones,arenaState,rosterCodes,winnersPublished,onJoin,onLeave,onUpdatePlayer,onAddComment}){
  const t=useT();
  const [activePlayerId,setActivePlayerId]=useState(null);
  const nfcLastRef=useRef({token:null,at:0});

  useEffect(()=>{
    if(!isWebNfcSupported()) return;
    const expectedOrigin=new URL(BASE_URL).origin;
    const stop=scanNfc({
      onRead:(url)=>{
        const token=parseNfcToken(url,expectedOrigin);
        if(!token) return;
        const now=Date.now();
        if(nfcLastRef.current.token===token&&now-nfcLastRef.current.at<NFC_REREAD_DEBOUNCE_MS) return;
        nfcLastRef.current={token,at:now};
        const playerId=resolvePlayerId(token,nfcTags);
        if(playerId!=null) setActivePlayerId(playerId);
      },
      onError:()=>{},
    });
    return stop;
  },[nfcTags]);

  useEffect(()=>{
    if(activePlayerId==null) return;
    const to=setTimeout(()=>setActivePlayerId(null),AUTO_HIDE_MS);
    return()=>clearTimeout(to);
  },[activePlayerId]);

  const player=activePlayerId!=null?players.find(p=>p.id===activePlayerId):null;

  if(player){
    const groupPlayers=players.filter(p=>p.groupId===(player.groupId||"main"));
    return(
      <PlayerView playerId={player.id} players={groupPlayers} queues={queues} activeGames={activeGames}
        disabledZones={disabledZones} arenaState={arenaState} rosterCodes={rosterCodes}
        sessionRosterId={player.groupId||"main"} winnersPublished={winnersPublished}
        onJoin={onJoin} onLeave={onLeave}
        onLogout={()=>setActivePlayerId(null)}
        onUpdatePlayer={onUpdatePlayer}
        onAddComment={onAddComment?(text)=>onAddComment(player.id,player.name,player.number,text):undefined}/>
    );
  }

  return(
    <div style={{minHeight:"100vh",background:"#0A0A0A",fontFamily:"'DM Sans',sans-serif",
      display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
      padding:24,textAlign:"center"}}>
      <style>{FONTS}</style>
      <img src={braceletLime} alt="" style={{width:"100%",maxWidth:340,borderRadius:20,
        marginBottom:24,border:"2px solid #B8E02050",boxShadow:"0 4px 24px #B8E02020"}}/>
      <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontStyle:"italic",
        fontSize:22,color:"#fff",maxWidth:340}}>{t.nfcProfileKioskPrompt}</div>
    </div>
  );
}

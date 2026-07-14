import { useState, useEffect } from "react";

export function useArenaTimer(arenaState){
  const [timer,setTimer]=useState("--:--");
  const [status,setStatus]=useState("waiting");
  useEffect(()=>{
    const totalSecs=(arenaState?.sessionMins||75)*60;
    const fmt=(s)=>String(Math.floor(s/60)).padStart(2,"0")+":"+String(Math.floor(s%60)).padStart(2,"0");
    if(arenaState?.paused){setTimer(fmt(arenaState.pausedRemaining||totalSecs));setStatus("paused");return;}
    if(!arenaState?.active){setTimer(fmt(totalSecs));setStatus("waiting");return;}
    const tick=()=>{
      const rem=Math.max(0,totalSecs-(Date.now()-arenaState.startTime)/1000);
      setTimer(fmt(rem));
      setStatus(rem===0?"ended":"active");
    };
    tick(); const iv=setInterval(tick,1000); return()=>clearInterval(iv);
  },[arenaState]);
  return{timer,status};
}

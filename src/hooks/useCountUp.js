import { useEffect, useRef, useState } from "react";

// Anime un nombre de sa valeur précédente vers la cible (ease-out, rAF).
// prefers-reduced-motion => saut direct à la cible dès la première frame.
export function useCountUp(target,duration=500){
  const [val,setVal]=useState(target);
  const fromRef=useRef(target);
  useEffect(()=>{
    const from=fromRef.current;
    if(from===target) return;
    fromRef.current=target;
    const reduce=window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const t0=performance.now();
    let raf;
    const step=(now)=>{
      const p=Math.min(1,(now-t0)/duration);
      const e=1-Math.pow(1-p,3); // ease-out cubic
      setVal(reduce?target:Math.round(from+(target-from)*e));
      if(p<1&&!reduce) raf=requestAnimationFrame(step);
    };
    raf=requestAnimationFrame(step);
    return()=>cancelAnimationFrame(raf);
  },[target,duration]);
  return val;
}

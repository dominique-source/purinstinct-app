// Player bib number. `color` is the zone/tier accent (functional identity),
// so it stays a literal hex — the alpha-append pattern needs it.
export function Bib({n,size,color}){
  const c=color||"#B8E020";
  const dim=size==="sm"?24:size==="lg"?44:32;
  return(
    <div style={{width:dim,height:dim,borderRadius:"var(--pi-r-sm)",display:"flex",alignItems:"center",justifyContent:"center",
      fontFamily:"var(--pi-font-display)",fontWeight:900,fontStyle:"italic",fontSize:dim*0.42,flexShrink:0,
      fontVariantNumeric:"tabular-nums",
      background:c+"18",color:c,border:"1px solid "+c+"40"}}>
      {n}
    </div>
  );
}

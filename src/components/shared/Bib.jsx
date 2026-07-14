export function Bib({n,size,color}){
  const c=color||"#84cc16";
  const dim=size==="sm"?24:size==="lg"?44:32;
  return(
    <div style={{width:dim,height:dim,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",
      fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:dim*0.42,flexShrink:0,
      background:c+"18",color:c,border:"1px solid "+c+"40"}}>
      {n}
    </div>
  );
}

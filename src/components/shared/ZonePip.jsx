import { ZONES } from "../../config/zones.js";
import { useZn } from "../../hooks/useLang.js";

export function ZonePip({zone,played}){
  const zn=useZn();
  const z=ZONES[zone];
  const zl=zn(zone);
  return(
    <div title={zl.name} style={{width:20,height:20,borderRadius:"50%",display:"flex",alignItems:"center",
      justifyContent:"center",fontSize:11,flexShrink:0,background:played?z.color:"#1f2937",color:played?"#000":"#374151"}}>
      {z.icon}
    </div>
  );
}

import { useState, useEffect } from "react";
import QRCode from "qrcode";
import { ZONES, ZK } from "../../config/zones.js";
import { useZn, useT } from "../../hooks/useLang.js";
import { BASE_URL } from "../../config/constants.js";
import { Panel, Eyebrow } from "../ui/Panel.jsx";

// Un code QR par zone (?station=ZONE) — à imprimer et coller sur chaque
// poste. Un scan ouvre StationView directement sur cette zone, sans code
// PIN ni sélection manuelle — même esprit que le QR d'invitation de session
// (PlayerHubView), généré ici pour les 6 zones d'un coup.
export function StationQrCodes(){
  const zn=useZn();
  const t=useT();
  const [codes,setCodes]=useState({});

  useEffect(()=>{
    let cancelled=false;
    (async()=>{
      const entries=await Promise.all(ZK.map(async(zk)=>{
        const url=`${BASE_URL}/?station=${zk}`;
        const dataUrl=await QRCode.toDataURL(url,{width:220,margin:2,color:{dark:"#ffffff",light:"#0A0A0A"}});
        return [zk,{dataUrl,url}];
      }));
      if(!cancelled) setCodes(Object.fromEntries(entries));
    })();
    return()=>{cancelled=true;};
  },[]);

  return(
    <Panel style={{marginTop:"var(--pi-s4)"}}>
      <Eyebrow style={{marginBottom:"var(--pi-s2)"}}>📶 {t.stationQrTitle}</Eyebrow>
      <div style={{fontSize:"var(--pi-fs-label)",color:"var(--pi-text-3)",marginBottom:"var(--pi-s3)"}}>
        {t.stationQrDesc}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:"var(--pi-s3)"}}>
        {ZK.map((zk)=>{
          const z=ZONES[zk];
          const zl=zn(zk);
          const entry=codes[zk];
          return(
            <div key={zk} style={{textAlign:"center",padding:"var(--pi-s3)",borderRadius:"var(--pi-r-md)",
              border:"1px solid "+z.border,background:z.bg}}>
              <div style={{fontSize:20,marginBottom:6}}>{z.icon}</div>
              <div style={{fontSize:"var(--pi-fs-label)",fontWeight:700,color:z.color,marginBottom:8}}>{zl.name}</div>
              {entry
                ?<img src={entry.dataUrl} alt="" style={{width:"100%",maxWidth:160,borderRadius:8}}/>
                :<div style={{height:160,display:"flex",alignItems:"center",justifyContent:"center",color:"var(--pi-text-4)",fontSize:12}}>…</div>}
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

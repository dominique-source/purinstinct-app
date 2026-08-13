import { useState, useEffect } from "react";
import QRCode from "qrcode";
import { ZONES, ZK } from "../../config/zones.js";
import { useZn, useT } from "../../hooks/useLang.js";
import { BASE_URL } from "../../config/constants.js";
import { Panel, Eyebrow } from "../ui/Panel.jsx";
import { Button } from "../ui/Button.jsx";

// Un code QR par zone (?stationHub=ZONE) — à imprimer et coller sur chaque
// poste. Un scan ouvre le menu à 3 options du responsable de plateau
// (StationHubView) pour cette zone, sans code PIN ni sélection manuelle —
// même esprit que le QR d'invitation de session (PlayerHubView), généré
// ici pour les 6 zones d'un coup. Noir sur blanc (jamais lime-sur-noir):
// lisible par un lecteur QR et prêt à imprimer sans inversion de couleurs.
export function StationQrCodes(){
  const zn=useZn();
  const t=useT();
  const [codes,setCodes]=useState({});

  useEffect(()=>{
    let cancelled=false;
    (async()=>{
      const entries=await Promise.all(ZK.map(async(zk)=>{
        const url=`${BASE_URL}/?stationHub=${zk}`;
        const dataUrl=await QRCode.toDataURL(url,{width:220,margin:2,color:{dark:"#000000",light:"#ffffff"}});
        return [zk,{dataUrl,url}];
      }));
      if(!cancelled) setCodes(Object.fromEntries(entries));
    })();
    return()=>{cancelled=true;};
  },[]);

  return(
    <Panel style={{marginTop:"var(--pi-s4)"}}>
      {/* Isolation d'impression: masque tout le reste de la page (onglets,
          en-têtes admin) et n'affiche que la grille de codes — technique
          CSS classique, fonctionne quel que soit l'imbrication du DOM. */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #station-qr-print, #station-qr-print * { visibility: visible; }
          #station-qr-print { position: absolute; left: 0; top: 0; width: 100%; padding: 24px; background: #fff; }
          .station-qr-no-print { display: none !important; }
        }
      `}</style>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:"var(--pi-s3)",marginBottom:"var(--pi-s2)"}}>
        <Eyebrow>📶 {t.stationQrTitle}</Eyebrow>
        <Button variant="outline" size="sm" className="station-qr-no-print" onClick={()=>window.print()}>
          {t.stationQrPrintBtn}
        </Button>
      </div>
      <div style={{fontSize:"var(--pi-fs-label)",color:"var(--pi-text-3)",marginBottom:"var(--pi-s3)"}}>
        {t.stationQrDesc}
      </div>
      <div id="station-qr-print" style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:"var(--pi-s3)"}}>
        {ZK.map((zk)=>{
          const z=ZONES[zk];
          const zl=zn(zk);
          const entry=codes[zk];
          return(
            <div key={zk} style={{textAlign:"center",padding:"var(--pi-s3)",borderRadius:"var(--pi-r-md)",
              border:"1px solid "+z.border,background:"#fff"}}>
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

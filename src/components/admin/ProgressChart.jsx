import { ZK } from "../../config/zones.js";

export function ProgressChart({player}){
  const history=player.history||[];
  if(history.length===0) return null;

  const zoneColors={purinstinct:"#84cc16",speed:"#f97316",handAgility:"#3b82f6",
    footAgility:"#56A0D3",generalAgility:"#eab308",iq:"#a855f7"};
  const zoneShort={purinstinct:"PurI.",speed:"Vitesse",handAgility:"Main",
    footAgility:"Pied",generalAgility:"Agilité",iq:"IQ"};

  const gpPoints=[0,...history.map(h=>h.gp||0)];
  const zsPoints={};
  ZK.forEach(zk=>{zsPoints[zk]=[50,...history.map(h=>h.zs?h.zs[zk]||50:50)];});

  const W=320, H=195, PAD_L=8, PAD_R=56, PAD_V=24, PAD_BOTTOM=20;
  const INNER_W=W-PAD_L-PAD_R, INNER_H=H-PAD_V-PAD_BOTTOM;
  const n=gpPoints.length;
  const xScale=(i)=>PAD_L+i*(INNER_W/(n-1||1));
  const lastX=xScale(n-1);

  // Grouper les entrées par date de séance (jour)
  const sessions=[];
  history.forEach((h,i)=>{
    const day=new Date(h.ts).toLocaleDateString("fr-CA",{day:"numeric",month:"short"});
    const idx=i+1; // +1 car gpPoints[0] est le point de départ
    if(sessions.length===0||sessions[sessions.length-1].label!==day){
      sessions.push({label:day,startIdx:idx,x:xScale(idx)});
    }
  });
  // Ajouter "Aujourd'hui" si la session actuelle a des entrées après le dernier historique passé
  const todayStr=new Date().toLocaleDateString("fr-CA",{day:"numeric",month:"short"});
  if(sessions.length===0||sessions[sessions.length-1].label!==todayStr){
    // Chercher si une entrée du jour existe
    const todayEntries=history.filter(h=>new Date(h.ts).toLocaleDateString("fr-CA",{day:"numeric",month:"short"})===todayStr);
    if(todayEntries.length>0){
      const firstIdx=history.indexOf(todayEntries[0])+1;
      sessions.push({label:"Auj.", startIdx:firstIdx,x:xScale(firstIdx),today:true});
    }
  }

  const maxGP=Math.max(...gpPoints,20);
  const gpY=(v)=>PAD_V+INNER_H-(v/maxGP)*INNER_H;
  const zsY=(v)=>PAD_V+INNER_H-(v/100)*INNER_H;

  const makePath=(pts,yFn)=>pts.map((v,i)=>(i===0?"M":"L")+xScale(i).toFixed(1)+","+yFn(v).toFixed(1)).join(" ");

  // Calcul des positions Y brutes des labels de zones
  const LABEL_H=10; // hauteur approximative d'une ligne de texte
  const MIN_GAP=LABEL_H+1;
  const rawLabels=ZK.map(zk=>({
    zk, color:zoneColors[zk], text:zoneShort[zk],
    rawY:zsY(zsPoints[zk][n-1])
  })).sort((a,b)=>a.rawY-b.rawY);

  // Algorithme anti-overlap : passe descendante puis remontante
  const adjustedY=[...rawLabels.map(l=>l.rawY)];
  // Passe vers le bas
  for(let i=1;i<adjustedY.length;i++){
    if(adjustedY[i]<adjustedY[i-1]+MIN_GAP) adjustedY[i]=adjustedY[i-1]+MIN_GAP;
  }
  // Passe vers le haut (clamp au bas du graphique)
  const maxLabelY=PAD_V+INNER_H;
  for(let i=adjustedY.length-1;i>=0;i--){
    if(adjustedY[i]>maxLabelY) adjustedY[i]=maxLabelY;
    if(i<adjustedY.length-1&&adjustedY[i]>adjustedY[i+1]-MIN_GAP)
      adjustedY[i]=adjustedY[i+1]-MIN_GAP;
  }
  // Clamp au haut
  const minLabelY=PAD_V;
  for(let i=0;i<adjustedY.length;i++){
    if(adjustedY[i]<minLabelY) adjustedY[i]=minLabelY;
    if(i>0&&adjustedY[i]<adjustedY[i-1]+MIN_GAP) adjustedY[i]=adjustedY[i-1]+MIN_GAP;
  }

  const gpLabelY=Math.max(PAD_V+4, gpY(gpPoints[n-1])-6);

  return(
    <div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{overflow:"visible"}}>
        {/* Grille horizontale */}
        {[0,0.5,1].map(t=>(
          <line key={t} x1={PAD_L} y1={PAD_V+INNER_H*(1-t)} x2={W-PAD_R} y2={PAD_V+INNER_H*(1-t)}
            stroke="#1f2937" strokeWidth="1"/>
        ))}
        {/* Lignes verticales + dates des séances */}
        {sessions.map((s,i)=>(
          <g key={i}>
            <line x1={s.x} y1={PAD_V} x2={s.x} y2={PAD_V+INNER_H}
              stroke={s.today?"#84cc16":"#374151"} strokeWidth="1" strokeDasharray={s.today?"none":"3 2"}
              strokeOpacity={s.today?0.6:0.5}/>
            <text x={s.x} y={PAD_V+INNER_H+12} textAnchor="middle"
              fill={s.today?"#84cc16":"#6b7280"} fontSize="8" fontWeight={s.today?"bold":"normal"}>
              {s.label}
            </text>
          </g>
        ))}
        {/* Lignes zones */}
        {ZK.map(zk=>(
          <path key={zk} d={makePath(zsPoints[zk],zsY)}
            fill="none" stroke={zoneColors[zk]} strokeWidth="1" strokeOpacity="0.5"
            strokeDasharray="3 2"/>
        ))}
        {/* Ligne GP */}
        <path d={makePath(gpPoints,gpY)}
          fill="none" stroke="#84cc16" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        {/* Point GP */}
        <circle cx={lastX} cy={gpY(gpPoints[n-1])} r="3" fill="#84cc16"/>
        {/* Trait de connexion + label GP */}
        <line x1={lastX} y1={gpY(gpPoints[n-1])} x2={lastX+4} y2={gpLabelY+1}
          stroke="#84cc16" strokeWidth="0.7" strokeOpacity="0.5"/>
        <text x={lastX+6} y={gpLabelY+4} fill="#84cc16" fontSize="9" fontWeight="bold">
          {gpPoints[n-1]} pts
        </text>
        {/* Labels zones avec trait de connexion et position anti-overlap */}
        {rawLabels.map((l,i)=>{
          const lineEndY=l.rawY;
          const labelY=adjustedY[i];
          return(
            <g key={l.zk}>
              <line x1={lastX} y1={lineEndY} x2={lastX+4} y2={labelY+1}
                stroke={l.color} strokeWidth="0.7" strokeOpacity="0.4"/>
              <text x={lastX+6} y={labelY+4} fill={l.color} fontSize="8" opacity="0.85">
                {l.text}
              </text>
            </g>
          );
        })}
      </svg>
      <div style={{fontSize:10,color:"#374151",textAlign:"center",marginTop:4}}>
        {n-1} partie{n-1>1?"s":""} · pts globaux —— zones - - -
      </div>
    </div>
  );
}

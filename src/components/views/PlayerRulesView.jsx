import { useState } from "react";
import { ZONES, ZK, ZONE_IMAGES } from "../../config/zones.js";
import { useZn, useT } from "../../hooks/useLang.js";

export function PlayerRulesView(){
  const [openZone,setOpenZone]=useState(null);
  const t=useT();
  const zn=useZn();
  return(
    <div className="anim-up">
      {/* Header */}
      <div style={{marginBottom:20}}>
        <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:22,color:"#fff",marginBottom:4}}>{t.rulesTitle}</div>
        <div style={{fontSize:12,color:"#4b5563"}}>{t.rulesSubtitle}</div>
      </div>

      {/* Types de points */}
      <div style={{borderRadius:14,padding:14,marginBottom:12,background:"#0d0f1a",border:"1px solid #1f2937"}}>
        <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:13,color:"#fff",letterSpacing:2,textTransform:"uppercase",marginBottom:10}}>
          {t.pointTypes}
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          <div style={{borderRadius:10,padding:"10px 12px",background:"#B8E02010",border:"1px solid #B8E02030"}}>
            <div style={{fontWeight:700,color:"#B8E020",fontSize:13,marginBottom:3}}>{t.globalPointsTitle}</div>
            <div style={{fontSize:12,color:"#9ca3af",lineHeight:1.5}}>{t.globalPointsDesc}<br/>
              <span style={{color:"#6b7280"}}>{t.globalPointsRange}</span>
            </div>
          </div>
          <div style={{borderRadius:10,padding:"10px 12px",background:"#6366f110",border:"1px solid #6366f130"}}>
            <div style={{fontWeight:700,color:"#818cf8",fontSize:13,marginBottom:3}}>{t.zonePointsTitle}</div>
            <div style={{fontSize:12,color:"#9ca3af",lineHeight:1.5}}>{t.zonePointsDesc}<br/>
              <span style={{color:"#6b7280"}}>{t.zonePointsRange}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Global points banner */}
      <div style={{borderRadius:14,padding:14,marginBottom:16,background:"#111a05",border:"1px solid #B8E02030"}}>
        <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:13,color:"#B8E020",letterSpacing:2,textTransform:"uppercase",marginBottom:10}}>
          {t.pointSystem}
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          <div style={{display:"flex",gap:10,alignItems:"flex-start"}}>
            <div style={{width:32,height:32,borderRadius:8,background:"#B8E02020",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>🏆</div>
            <div>
              <div style={{fontSize:12,color:"#9ca3af",fontWeight:600,marginBottom:2}}>{t.handicapLabel}</div>
              <div style={{fontSize:12,color:"#6b7280",lineHeight:1.5}}>{t.handicapDesc}</div>
            </div>
          </div>
          <div style={{height:1,background:"#1f2937"}}/>
          <div style={{display:"flex",gap:10,alignItems:"flex-start"}}>
            <div style={{width:32,height:32,borderRadius:8,background:"#f9731620",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>🔥</div>
            <div>
              <div style={{fontSize:12,color:"#9ca3af",fontWeight:600,marginBottom:2}}>{t.winStreakLabel}</div>
              <div style={{fontSize:12,color:"#6b7280",lineHeight:1.5}}>{t.streakDesc}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Zone rules accordion */}
      <div style={{display:"flex",flexDirection:"column",gap:6}}>
        {ZK.map(zk=>{
          const z=ZONES[zk];
          const zl=zn(zk);
          const isOpen=openZone===zk;
          return(
            <div key={zk} style={{borderRadius:14,overflow:"hidden",border:"1px solid "+(isOpen?z.color:"#1f2937"),transition:"border-color .2s"}}>
              {/* Header cliquable */}
              <button onClick={()=>setOpenZone(isOpen?null:zk)} style={{
                width:"100%",padding:"12px 14px",background:isOpen?z.bg:"#0d0f1a",
                border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:12,textAlign:"left"}}>
                <div style={{width:38,height:38,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,background:z.bg,border:"1px solid "+z.border,flexShrink:0}}>{z.icon}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:15,color:isOpen?z.color:"#fff"}}>{zl.name.toUpperCase()}</div>
                  <div style={{fontSize:11,color:"#6b7280",marginTop:1}}>{zl.sub}</div>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
                  <div style={{display:"flex",gap:4}}>
                    <span style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:12,color:"#22c55e",background:"#22c55e15",padding:"2px 6px",borderRadius:5}}>
                      +{z.gameStyle==="team"&&zk==="purinstinct"?10:4} pts
                    </span>
                    <span style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:12,color:"#ef4444",background:"#ef444415",padding:"2px 6px",borderRadius:5}}>
                      -{z.gameStyle==="team"&&zk==="purinstinct"?3:2} pts
                    </span>
                  </div>
                  <div style={{fontSize:16,color:isOpen?z.color:"#374151",transition:"transform .2s",transform:isOpen?"rotate(90deg)":"rotate(0deg)"}}>›</div>
                </div>
              </button>
              {/* Contenu expandé */}
              {isOpen&&(
                <div className="anim-up" style={{background:z.bg}}>
                  {ZONE_IMAGES[zk]&&(
                    <div style={{width:"100%",aspectRatio:"16/9",overflow:"hidden"}}>
                      <img src={ZONE_IMAGES[zk]} alt={zl.name} style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}}/>
                    </div>
                  )}
                  <div style={{padding:"14px 16px 16px 16px",display:"flex",flexDirection:"column",gap:8}}>
                    {zl.rules.map((rule,i)=>(
                      <div key={i} style={{display:"flex",gap:10,alignItems:"flex-start"}}>
                        <div style={{width:20,height:20,borderRadius:"50%",background:z.color+"25",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,color:z.color,flexShrink:0,marginTop:1}}>
                          {i+1}
                        </div>
                        <div style={{fontSize:12,color:"#d1d5db",lineHeight:1.6}}>{rule}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

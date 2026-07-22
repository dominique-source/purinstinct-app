import { FONTS } from "../../config/fonts.js";
import { ZONES, ZONE_VIGNETTES, AUGMENTED_ZONE } from "../../config/zones.js";
import { useZn } from "../../hooks/useLang.js";
import { S } from "../shared/styles.js";
import { LangFooter } from "../shared/LangFooter.jsx";

export function TestLanding({onEnter}){
  const zn=useZn();
  const DISPLAY_ZK=["purinstinct","handAgility","footAgility","generalAgility","iq","speed","augmented"];
  return(
    <div style={{minHeight:"100vh",background:"#0A0A0A",fontFamily:"'DM Sans',sans-serif",
      display:"flex",flexDirection:"column",alignItems:"center",padding:"32px 16px 80px"}}>
      <style>{FONTS}</style>
      {/* Logo */}
      <div className="anim-pop" style={{textAlign:"center",marginBottom:32}}>
        <img src={import.meta.env.BASE_URL+"purinstinct-games-logo.png"} alt="PürInstinct Games"
          style={{width:150,height:"auto",filter:"drop-shadow(0 0 40px #B8E02030)"}}/>
        <div style={{color:"#B8E020",fontSize:11,letterSpacing:3,textTransform:"uppercase",marginTop:8,fontWeight:700}}>
          🧪 TEST MODE
        </div>
      </div>

      {/* Zone grid — 2 cols */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,width:"100%",maxWidth:420}}>
        {DISPLAY_ZK.map((zk,i)=>{
          const isAug=zk==="augmented";
          const z=isAug?AUGMENTED_ZONE:ZONES[zk];
          const zl=isAug?AUGMENTED_ZONE.fr:zn(zk);
          const img=ZONE_VIGNETTES[zk];
          const isLast=DISPLAY_ZK.length%2!==0&&i===DISPLAY_ZK.length-1;
          return(
            <div key={zk}
              style={{gridColumn:isLast?"1 / -1":undefined,
                borderRadius:16,overflow:"hidden",cursor:"pointer",
                border:"2px solid "+z.color+"40",
                boxShadow:"0 4px 20px "+z.color+"20",
                transition:"transform .15s, box-shadow .15s",
                aspectRatio:isLast?"2.2/1":"1/1"}}
              onClick={()=>onEnter(zk)}
              onMouseEnter={e=>{e.currentTarget.style.transform="scale(1.03)";e.currentTarget.style.boxShadow="0 8px 32px "+z.color+"50";}}
              onMouseLeave={e=>{e.currentTarget.style.transform="scale(1)";e.currentTarget.style.boxShadow="0 4px 20px "+z.color+"20";}}>
              <img src={img} alt={zl.name}
                style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}}
                onError={e=>{e.target.style.display="none";e.target.nextSibling.style.display="flex";}}/>
              {/* Fallback */}
              <div style={{display:"none",width:"100%",height:"100%",minHeight:160,
                background:`linear-gradient(135deg, ${z.bg||"#0d0f1a"}, ${z.color}20)`,
                flexDirection:"column",alignItems:"center",justifyContent:"center",gap:8,padding:16}}>
                <div style={{fontSize:42}}>{z.icon}</div>
                <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,
                  fontSize:16,color:z.color,textAlign:"center",letterSpacing:1}}>
                  {zl.name.toUpperCase()}
                </div>
                {isAug&&<div style={{fontSize:10,color:z.color+"80",letterSpacing:2}}>by Moment Factory</div>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Enter admin button */}
      <button onClick={()=>onEnter(null)}
        style={{marginTop:24,padding:"12px 32px",clipPath:S.clip(10),
          border:"1px solid #B8E02050",background:"#111a05",
          color:"#B8E020",cursor:"pointer",fontFamily:"'Barlow Condensed',sans-serif",
          fontWeight:900,fontStyle:"italic",fontSize:16,letterSpacing:1}}>
        🛡️ ADMIN DASHBOARD
      </button>
      <LangFooter/>
    </div>
  );
}

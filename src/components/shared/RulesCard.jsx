import { useState, useRef } from "react";
import html2canvas from "html2canvas";
import { ZONES, ZONE_IMAGES } from "../../config/zones.js";
import { useZn } from "../../hooks/useLang.js";

export function RulesCard({zone}){
  const zn=useZn();
  const z=ZONES[zone];
  const zl=zn(zone);
  const img=ZONE_IMAGES[zone];
  const [storyRule,setStoryRule]=useState(null);
  const [savingStory,setSavingStory]=useState(false);
  const storyRef=useRef(null);

  const saveStory=async()=>{
    if(!storyRef.current||savingStory) return;
    setSavingStory(true);
    try{
      const canvas=await html2canvas(storyRef.current,{
        backgroundColor:"#0A0A0A",scale:3,useCORS:true,logging:false,removeContainer:true
      });
      const url=canvas.toDataURL("image/png");
      const a=document.createElement("a");
      a.href=url; a.download="purinstinct-regle.png"; a.click();
    }catch(e){console.error(e);}
    setSavingStory(false);
  };

  return(
    <>
    <div style={{borderRadius:16,overflow:"hidden",background:z.bg,border:"1px solid "+z.border}}>
      {img&&(
        <div style={{width:"100%",aspectRatio:"16/9",overflow:"hidden"}}>
          <img src={img} alt={zl.name} style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}}/>
        </div>
      )}
      <div style={{padding:16}}>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
          <span style={{fontSize:24}}>{z.icon}</span>
          <div>
            <div style={{color:"#fff",fontWeight:700,fontSize:16,fontFamily:"'Barlow Condensed',sans-serif"}}>{zl.name}</div>
            <div style={{color:z.color,fontSize:12,fontWeight:600}}>{z.minP} joueurs minimum</div>
          </div>
        </div>
        <ul style={{listStyle:"none",display:"flex",flexDirection:"column",gap:8}}>
          {zl.rules.map((r,i)=>(
            <li key={i} onClick={()=>setStoryRule(r)}
              style={{display:"flex",gap:8,fontSize:12,color:"#9ca3af",lineHeight:1.5,cursor:"pointer",
                borderRadius:8,padding:"4px 6px",transition:"background .15s"}}
              onMouseEnter={e=>e.currentTarget.style.background=z.color+"15"}
              onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              <span style={{color:z.color,flexShrink:0}}>▸</span>
              <span>{r} <span style={{fontSize:9,color:z.color,opacity:.6}}>📸</span></span>
            </li>
          ))}
        </ul>
      </div>
    </div>

    {/* Story overlay */}
    {storyRule&&(
      <div style={{position:"fixed",inset:0,zIndex:100,background:"rgba(0,0,0,.92)",
        display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:20}}>

        {/* Carte story (format 9:16) */}
        <div ref={storyRef} style={{
          width:320,height:568,borderRadius:24,overflow:"hidden",position:"relative",
          background:"#0A0A0A",display:"flex",flexDirection:"column",alignItems:"center",
          justifyContent:"center",padding:32,flexShrink:0}}>
          {/* Fond coloré */}
          <div style={{position:"absolute",inset:0,background:`radial-gradient(ellipse at center, ${z.color}22 0%, transparent 70%)`}}/>
          {/* Logo */}
          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:22,
            color:"#fff",letterSpacing:3,marginBottom:24,opacity:.6,zIndex:1}}>
            <span style={{color:"#B8E020"}}>PUR</span>INSTINCT
          </div>
          {/* Zone */}
          <div style={{fontSize:52,marginBottom:12,zIndex:1}}>{z.icon}</div>
          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:18,
            color:z.color,letterSpacing:2,textTransform:"uppercase",marginBottom:28,zIndex:1}}>
            {zl.name}
          </div>
          {/* Règle */}
          <div style={{background:z.color+"18",border:"1px solid "+z.color+"40",borderRadius:16,
            padding:"20px 24px",textAlign:"center",zIndex:1}}>
            <div style={{color:"#fff",fontSize:16,fontWeight:700,lineHeight:1.6}}>{storyRule}</div>
          </div>
          {/* Footer */}
          <div style={{position:"absolute",bottom:24,fontSize:11,color:"#374151",
            fontFamily:"'Barlow Condensed',sans-serif",letterSpacing:1}}>PURINSTINCT GAMES</div>
        </div>

        {/* Boutons */}
        <div style={{display:"flex",gap:10,marginTop:20}}>
          <button onClick={saveStory} disabled={savingStory}
            style={{padding:"12px 24px",borderRadius:12,border:"none",cursor:"pointer",
              background:z.color,color:"#000",fontWeight:700,fontSize:14,opacity:savingStory?.6:1}}>
            {savingStory?"⏳ Génération...":"📥 Enregistrer"}
          </button>
          <button onClick={()=>setStoryRule(null)}
            style={{padding:"12px 20px",borderRadius:12,border:"1px solid #374151",cursor:"pointer",
              background:"#111827",color:"#9ca3af",fontSize:14}}>
            Fermer
          </button>
        </div>
      </div>
    )}
    </>
  );
}

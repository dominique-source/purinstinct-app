import { useState } from "react";
import { FONTS } from "../../config/fonts.js";
import { ZONES, ZK } from "../../config/zones.js";
import { useZn, useT } from "../../hooks/useLang.js";
import { S } from "../shared/styles.js";
import { LangFooter } from "../shared/LangFooter.jsx";

export function LoginView({players,queues,onLogin,disabledZones,onGoLive}){
  const t=useT();
  const zn=useZn();
  const [tab,setTab]=useState("roles");
  return(<>
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",
      padding:"40px 16px",background:"#0A0A0A",fontFamily:"'DM Sans',sans-serif"}}>
      <style>{FONTS}</style>
      <div className="anim-pop" style={{marginBottom:32,textAlign:"center"}}>
        <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:72,letterSpacing:-2,lineHeight:1}}>
          <span style={{color:"#B8E020"}}>PUR</span><span style={{color:"#fff"}}>INSTINCT</span>
        </div>
        <div style={{color:"#B8E020",fontSize:13,letterSpacing:3,textTransform:"uppercase",marginTop:4,fontWeight:700}}>
          PurInstinct Games
        </div>
        <div style={{color:"#4b5563",fontSize:11,letterSpacing:2,textTransform:"uppercase",marginTop:4,fontWeight:600}}>
          Jeux Sportifs
        </div>
      </div>

      <div style={{display:"flex",gap:4,padding:4,borderRadius:12,background:"#0d0f1a",marginBottom:24}}>
        {[["roles",t.rolesTab],["players",t.playersTab],["station","📍 Responsable"]].map(([t,l])=>(
          <button key={t} onClick={()=>setTab(t)} style={{
            padding:"8px 16px",borderRadius:8,fontSize:13,fontWeight:600,border:"none",cursor:"pointer",
            background:tab===t?"#B8E020":"transparent",color:tab===t?"#000":"#6b7280"}}>
            {l}
          </button>
        ))}
      </div>

      {tab==="roles"?(
        <div className="anim-up" style={{width:"100%",maxWidth:360,display:"flex",flexDirection:"column",gap:8}}>
          <button onClick={()=>onLogin("admin",null)} style={{width:"100%",padding:"16px 20px",borderRadius:16,
            border:"1px solid #1f2937",background:"#111827",color:"#fff",cursor:"pointer",
            display:"flex",alignItems:"center",gap:12,fontFamily:"'DM Sans',sans-serif"}}>
            <span style={{fontSize:22}}>🛡️</span>
            <div style={{textAlign:"left"}}>
              <div style={{fontWeight:700,fontSize:14}}>{t.adminRole}</div>
              <div style={{color:"#6b7280",fontSize:12,fontWeight:400,marginTop:2}}>{t.adminSub}</div>
            </div>
          </button>
          <div style={{...S.label(),textAlign:"center",paddingTop:12,paddingBottom:4}}>{t.stationManagers}</div>
          {ZK.map(zk=>{
            const zl=zn(zk);
            const isOff=(disabledZones||[]).includes(zk);
            return(
            <button key={zk} onClick={()=>onLogin("station",zk)} style={{
              width:"100%",padding:"14px 16px",borderRadius:16,
              border:"1px solid "+(isOff?"#ef444440":ZONES[zk].border),
              background:isOff?"#1a0a0a":ZONES[zk].bg,
              color:isOff?"#ef4444":ZONES[zk].color,cursor:"pointer",
              display:"flex",alignItems:"center",gap:12,fontFamily:"'DM Sans',sans-serif",
              opacity:isOff?0.7:1,position:"relative"}}>
              <span style={{fontSize:22,opacity:isOff?0.5:1}}>{ZONES[zk].icon}</span>
              <div style={{textAlign:"left",flex:1}}>
                <div style={{fontWeight:700,fontSize:14}}>{zl.name}</div>
              </div>
              {isOff&&<span style={{fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:10,
                background:"#ef444420",color:"#ef4444",border:"1px solid #ef444440",flexShrink:0}}>
                DÉSACTIVÉE
              </span>}
            </button>
            );
          })}
        </div>
      ):tab==="players"?(
        <div className="anim-up" style={{width:"100%",maxWidth:420}}>
          <div style={{textAlign:"center",marginBottom:20}}>
            <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:13,color:"#4b5563",letterSpacing:3,textTransform:"uppercase",marginBottom:6}}>{t.selectNumber}</div>

          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:6}}>
            {players.map(p=>{
              const inQ=Object.values(queues||{}).some(q=>Array.isArray(q)&&q.includes(p.id));
              const genderColor=p.gender==="F"?"#ec4899":"#3b82f6";
              const statusColor=inQ?"#f97316":"#B8E020";
              return(
                <button key={p.id} onClick={()=>onLogin("player",p.id)} style={{
                  aspectRatio:"1",borderRadius:14,
                  border:"1px solid "+(inQ?"#f9731640":genderColor+"30"),
                  background:inQ?"#1c0e00":"#0d0f1a",
                  cursor:"pointer",position:"relative",
                  display:"flex",flexDirection:"column",
                  alignItems:"center",justifyContent:"center",gap:3,
                  padding:4}}>
                  <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:24,color:"#fff",lineHeight:1}}>{p.number}</div>
                  <div style={{fontSize:8,color:"#6b7280",textAlign:"center",padding:"0 4px",lineHeight:1.2,maxWidth:"100%",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                    {p.name.split(" ")[0]}
                  </div>
                </button>
              );
            })}
          </div>
          <div style={{marginTop:14,padding:"8px 12px",borderRadius:10,background:"#0d0f1a",border:"1px solid #1f2937",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span style={{fontSize:11,color:"#374151"}}>{players.length} {"joueurs"}</span>
            <span style={{fontSize:11,color:"#f97316"}}>{Object.values(queues||{}).flat().filter((v,i,a)=>a.indexOf(v)===i).length} {"en file"}</span>
          </div>
        </div>
      ):tab==="station"?(
        <div className="anim-up" style={{width:"100%",maxWidth:360,display:"flex",flexDirection:"column",alignItems:"center",gap:16}}>
          <div style={{textAlign:"center",marginBottom:8}}>
            <div style={{fontSize:48,marginBottom:12}}>📍</div>
            <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:22,color:"#fff",marginBottom:6}}>Responsable de plateau</div>
            <div style={{fontSize:13,color:"#6b7280",lineHeight:1.5}}>Gérez les stations et les files d'attente depuis votre appareil.</div>
          </div>
          <button onClick={()=>onLogin("stationPick",null)}
            style={{width:"100%",padding:"20px",borderRadius:18,border:"2px solid #f97316",
              background:"linear-gradient(135deg,#1a0d00,#0d0f1a)",
              color:"#f97316",cursor:"pointer",fontFamily:"'Barlow Condensed',sans-serif",
              fontWeight:900,fontSize:20,letterSpacing:1,
              boxShadow:"0 0 24px #f9731630",display:"flex",alignItems:"center",justifyContent:"center",gap:12}}
            onMouseEnter={e=>{e.currentTarget.style.background="#f97316";e.currentTarget.style.color="#000";}}
            onMouseLeave={e=>{e.currentTarget.style.background="linear-gradient(135deg,#1a0d00,#0d0f1a)";e.currentTarget.style.color="#f97316";}}>
            📍 Accéder au tableau de bord
          </button>
        </div>
      ):(null)}

      {/* Bouton Mode Live */}
      <div style={{marginTop:32,paddingTop:24,borderTop:"1px solid #1f2937",width:"100%",maxWidth:420,textAlign:"center"}}>
        <div style={{fontSize:11,color:"#374151",marginBottom:10,letterSpacing:1,textTransform:"uppercase"}}>Prêt pour une vraie session ?</div>
        <button onClick={onGoLive}
          style={{width:"100%",padding:"14px",borderRadius:16,border:"2px solid #B8E020",
            background:"linear-gradient(135deg,#111a05,#0d0f1a)",
            color:"#B8E020",cursor:"pointer",fontFamily:"'Barlow Condensed',sans-serif",
            fontWeight:900,fontSize:18,letterSpacing:1,
            boxShadow:"0 0 20px #B8E02020"}}
          onMouseEnter={e=>{e.currentTarget.style.background="#B8E020";e.currentTarget.style.color="#000";}}
          onMouseLeave={e=>{e.currentTarget.style.background="linear-gradient(135deg,#111a05,#0d0f1a)";e.currentTarget.style.color="#B8E020";}}>
          ⚡ Passer en mode LIVE
        </button>
        <div style={{fontSize:10,color:"#374151",marginTop:8}}>Expérience joueur simplifiée · Accès sécurisé par PIN</div>
      </div>
    </div>
    <LangFooter/>
  </>);
}

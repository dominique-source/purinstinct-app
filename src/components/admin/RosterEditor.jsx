import { useState } from "react";
import { useT } from "../../hooks/useLang.js";
import { S } from "../shared/styles.js";

export function RosterEditor({roster,onSave,onCancel}){
  const t=useT();
  const [name,setName]=useState(roster.name);
  const [entries,setEntries]=useState([...roster.entries]);
  const [newName,setNewName]=useState("");
  const [newGender,setNewGender]=useState("M");

  const addEntry=()=>{
    const n=newName.trim();
    if(!n) return;
    setEntries(e=>[...e,{name:n,gender:newGender}]);
    setNewName("");
  };
  const removeEntry=(idx)=>setEntries(e=>e.filter((_,i)=>i!==idx));
  const moveUp=(idx)=>{
    if(idx===0) return;
    const e=[...entries]; [e[idx-1],e[idx]]=[e[idx],e[idx-1]]; setEntries(e);
  };

  return(
    <div className="anim-up">
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
        <button onClick={onCancel} style={{...S.backBtn}}>{t.back}</button>
        <div style={{flex:1}}>
          <input value={name} onChange={e=>setName(e.target.value)}
            style={{width:"100%",padding:"8px 12px",borderRadius:10,border:"1px solid #B8E02040",
              background:"#111a05",color:"#B8E020",fontSize:14,fontWeight:700,outline:"none"}}/>
        </div>
        <button onClick={()=>onSave({...roster,name,entries})} style={{...S.btn("#B8E020"),padding:"8px 14px"}}>{t.save}</button>
      </div>
      <div style={{...S.label(),marginBottom:8}}>{entries.length} joueurs</div>
      <div style={{display:"flex",gap:8,marginBottom:12}}>
        <input value={newName} onChange={e=>setNewName(e.target.value)}
          onKeyDown={e=>{if(e.key==="Enter")addEntry();}}
          placeholder={t.playerName}
          style={{flex:1,padding:"8px 12px",borderRadius:10,border:"1px solid #1f2937",background:"#0d0f1a",color:"#fff",fontSize:13,outline:"none"}}/>
        <select value={newGender} onChange={e=>setNewGender(e.target.value)}
          style={{padding:"8px 10px",borderRadius:10,border:"1px solid #1f2937",background:"#0d0f1a",color:"#9ca3af",fontSize:13,outline:"none"}}>
          <option value="M">H</option>
          <option value="F">F</option>
        </select>
        <button onClick={addEntry} style={{...S.btn("#B8E020"),padding:"8px 14px"}}>{t.addBtn}</button>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:4,maxHeight:340,overflowY:"auto"}}>
        {entries.map((e,i)=>(
          <div key={i} style={{...S.row(),padding:"7px 10px",borderRadius:10,background:"#0d0f1a"}}>
            <div style={{width:22,height:22,borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",
              fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:11,
              background:"#B8E02018",color:"#B8E020",flexShrink:0}}>{i+1}</div>
            <span style={{flex:1,color:"#fff",fontSize:13}}>{e.name}</span>
            <span style={{fontSize:11,color:"#4b5563",marginRight:4}}>{e.gender==="M"?"H":"F"}</span>
            <button onClick={()=>moveUp(i)} disabled={i===0}
              style={{background:"none",border:"none",cursor:i===0?"default":"pointer",color:i===0?"#1f2937":"#6b7280",fontSize:14}}>↑</button>
            <button onClick={()=>removeEntry(i)}
              style={{background:"none",border:"none",cursor:"pointer",color:"#6b7280",fontSize:16,lineHeight:1}}>×</button>
          </div>
        ))}
      </div>
    </div>
  );
}

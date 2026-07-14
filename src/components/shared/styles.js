export const S = {
  card:(extra)=>({ borderRadius:16, padding:14, background:"#0d0f1a", border:"1px solid #1f2937", ...extra }),
  btn:(color,extra)=>({ padding:"8px 16px", borderRadius:10, border:"none", cursor:"pointer", fontWeight:700, fontSize:13, background:color||"#1f2937", color:color?"#000":"#9ca3af", ...extra }),
  tag:(color,extra)=>({ padding:"2px 8px", borderRadius:6, fontSize:11, fontWeight:600, background:color+"18", color:color, ...extra }),
  label:(extra)=>({ fontSize:11, color:"#4b5563", textTransform:"uppercase", letterSpacing:"3px", fontWeight:600, ...extra }),
  row:(extra)=>({ display:"flex", alignItems:"center", gap:10, ...extra }),
  backBtn:{ padding:"10px 20px", borderRadius:12, border:"1px solid #374151", background:"#111827",
    color:"#e5e7eb", cursor:"pointer", fontFamily:"'Barlow Condensed',sans-serif",
    fontWeight:700, fontSize:16, letterSpacing:1, display:"inline-flex", alignItems:"center", gap:8 },
};

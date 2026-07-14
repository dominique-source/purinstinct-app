export function PlayerAvatar({gender,skinColor,hairColor,morphology}){
  const cx=50;
  const bw=[28,36,46][morphology]||36;
  const bl=cx-bw/2, br=cx+bw/2;
  const acc="#84cc16";
  const darkSkin=(s)=>s.replace(/#/,"");
  // nose / smile tint derived from skin
  const shadow="rgba(0,0,0,0.18)";
  return(
    <svg viewBox="0 0 100 195" style={{width:"100%",height:"auto",display:"block"}} xmlns="http://www.w3.org/2000/svg">
      {/* Shadow */}
      <ellipse cx="50" cy="190" rx="26" ry="4" fill="rgba(0,0,0,0.35)"/>

      {/* ── LEGS ── */}
      <rect x={bl+3} y={122} width={bw/2-5} height={46} rx={8} fill={skinColor}/>
      <rect x={cx+2} y={122} width={bw/2-5} height={46} rx={8} fill={skinColor}/>

      {/* ── SHOES ── */}
      <rect x={bl} y={160} width={bw/2+1} height={12} rx={5} fill="#161616"/>
      <rect x={cx-1} y={160} width={bw/2+1} height={12} rx={5} fill="#161616"/>
      <rect x={bl+1} y={167} width={bw/2-1} height={2} rx={1} fill={acc} opacity="0.7"/>
      <rect x={cx} y={167} width={bw/2-1} height={2} rx={1} fill={acc} opacity="0.7"/>

      {/* ── SHORTS ── */}
      <rect x={bl} y={118} width={bw} height={18} rx={7} fill="#0d1508"/>
      <line x1={cx} y1={118} x2={cx} y2={136} stroke={acc} strokeWidth="1" opacity="0.3"/>

      {/* ── JERSEY ── */}
      <rect x={bl} y={70} width={bw} height={52} rx={11} fill="#111a05"/>
      {/* collar */}
      <path d={`M${cx-7},70 Q${cx},78 ${cx+7},70`} fill="#0a1204"/>
      {/* chest stripe */}
      <line x1={bl} y1={84} x2={br} y2={84} stroke={acc} strokeWidth="1.5" opacity="0.25"/>
      <text x={cx} y={108} textAnchor="middle" fontSize="19" fontWeight="900"
        fill={acc} fontFamily="Barlow Condensed,sans-serif" letterSpacing="-1">P</text>

      {/* ── ARMS ── */}
      <rect x={bl-13} y={73} width={15} height={42} rx={7} fill={skinColor}
        transform={`rotate(9,${bl-5},73)`}/>
      <rect x={br-2} y={73} width={15} height={42} rx={7} fill={skinColor}
        transform={`rotate(-9,${br+5},73)`}/>

      {/* ── NECK ── */}
      <rect x={cx-6} y={58} width={12} height={16} rx={5} fill={skinColor}/>

      {/* ── HEAD ── */}
      <circle cx={cx} cy={40} r={24} fill={skinColor}/>

      {/* ── HAIR MALE ── */}
      {gender==="M"&&(
        <path d={`M${cx-22},43 Q${cx-25},16 ${cx},14 Q${cx+25},16 ${cx+22},43
          Q${cx+15},30 ${cx},28 Q${cx-15},30 ${cx-22},43Z`}
          fill={hairColor}/>
      )}
      {/* ── HAIR FEMALE ── */}
      {gender!=="M"&&(
        <>
          <path d={`M${cx-22},43 Q${cx-25},14 ${cx},12 Q${cx+25},14 ${cx+22},43
            Q${cx+15},28 ${cx},26 Q${cx-15},28 ${cx-22},43Z`}
            fill={hairColor}/>
          <path d={`M${cx-22},43 Q${cx-30},62 ${cx-28},88 Q${cx-20},76 ${cx-22},58Z`}
            fill={hairColor}/>
          <path d={`M${cx+22},43 Q${cx+30},62 ${cx+28},88 Q${cx+20},76 ${cx+22},58Z`}
            fill={hairColor}/>
        </>
      )}

      {/* ── EYEBROWS ── */}
      <path d={`M${cx-13},33 Q${cx-8},30 ${cx-3},33`} stroke={hairColor}
        strokeWidth="2" fill="none" strokeLinecap="round"/>
      <path d={`M${cx+3},33 Q${cx+8},30 ${cx+13},33`} stroke={hairColor}
        strokeWidth="2" fill="none" strokeLinecap="round"/>

      {/* ── EYES ── */}
      <ellipse cx={cx-8} cy={41} rx={4.5} ry={4.8} fill="white"/>
      <ellipse cx={cx+8} cy={41} rx={4.5} ry={4.8} fill="white"/>
      <circle cx={cx-7.5} cy={42} r={3} fill="#1a1a1a"/>
      <circle cx={cx+8.5} cy={42} r={3} fill="#1a1a1a"/>
      <circle cx={cx-6.2} cy={40.5} r={1} fill="white"/>
      <circle cx={cx+9.8} cy={40.5} r={1} fill="white"/>

      {/* ── SMILE ── */}
      <path d={`M${cx-6},53 Q${cx},60 ${cx+6},53`}
        stroke={shadow} strokeWidth="1.8" fill="none" strokeLinecap="round"/>
      {gender!=="M"&&(
        <path d={`M${cx-5},53 Q${cx},58 ${cx+5},53`}
          stroke="rgba(160,60,60,0.4)" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      )}
    </svg>
  );
}

import { ZONES, ZK, QUEUE_MIN, getSprintTier } from "../config/zones.js";

export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length-1; i>0; i--) { const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; }
  return a;
}

export function teamAvg(pMap, ids, zone) {
  if (!ids || !ids.length) return 50;
  return ids.reduce((s,id) => s + (pMap[id] ? ((pMap[id].zoneScores||{})[zone]||50) : 50), 0) / ids.length;
}

export function getStatus(id, queues, activeGames) {
  const inQueues = ZK.filter(z => queues[z] && queues[z].includes(id));
  let playingAt = null;
  for (const z of ZK) {
    const g = activeGames[z];
    if (!g) continue;
    const all = g.participants || [...(g.teamA||[]), ...(g.teamB||[])];
    if (all.includes(id)) { playingAt = z; break; }
  }
  return { inQueues, playingAt };
}

export function generateFakeHistory(seed){
  // Génère un historique réaliste pour les séances du 15 et 20 mai 2026
  const ts15=new Date("2026-05-15T14:00:00").getTime();
  const ts20=new Date("2026-05-20T14:00:00").getTime();
  const rng=(n)=>((seed*9301+49297)%233280/233280*n)|0; // pseudo-random basé sur seed
  const r=(max,min=0)=>min+Math.abs((seed*7+max*13)%( max-min+1));

  const history=[];
  let gp=0;
  const zs={purinstinct:50,speed:50,handAgility:50,footAgility:50,generalAgility:50,iq:50};

  // Séance 15 mai — 3 zones jouées
  const zones15=[ZK[(seed)%6],ZK[(seed+1)%6],ZK[(seed+2)%6]];
  zones15.forEach((zone,j)=>{
    const isWin=(seed+j*3)%3!==0;
    const delta=isWin?ZONES[zone].winPts:-ZONES[zone].lossPts;
    gp=Math.max(0,gp+delta);
    zs[zone]=Math.min(100,Math.max(0,zs[zone]+(isWin?13:-9)));
    history.push({zone,isWin,delta,bonus:false,newStreak:isWin?1:0,
      ts:ts15+j*1800000,gp,zs:{...zs}});
  });

  // Séance 20 mai — 4 zones jouées
  const zones20=[ZK[(seed+3)%6],ZK[(seed+4)%6],ZK[(seed+1)%6],ZK[(seed+5)%6]];
  zones20.forEach((zone,j)=>{
    const isWin=(seed+j*2+1)%3!==2;
    const bonus=isWin&&j===2;
    const pts=isWin?ZONES[zone].winPts*(bonus?1.5:1):ZONES[zone].lossPts;
    const delta=isWin?Math.round(pts):-Math.round(pts);
    gp=Math.max(0,gp+delta);
    zs[zone]=Math.min(100,Math.max(0,zs[zone]+(isWin?bonus?22:13:-9)));
    history.push({zone,isWin,delta,bonus,newStreak:isWin?j+1:0,
      ts:ts20+j*1800000,gp,zs:{...zs}});
  });

  return{history,gp,zs,zonesPlayed:[...new Set([...zones15,...zones20])]};
}

export function createPlayersFromRoster(roster) {
  return roster.entries.map((e,i) => {
    const fake=generateFakeHistory(i+1);
    return{
      id:i+1, number:i+1, name:e.name, gender:e.gender||"M",
      globalPoints:0,
      zoneScores:fake.zs,
      zoneStreaks:{ purinstinct:0,speed:0,handAgility:0,footAgility:0,generalAgility:0,iq:0 },
      zonesPlayed:[], lastResult:null,
      history:fake.history,
      groupId:"main",
      age:"", email:"", instagram:"", tiktok:"", snapchat:"",
      photoConsent:false, videoConsent:false, profilePhoto:null, highlights:[]
    };
  });
}

export function makeEmptyGames() { const g={}; ZK.forEach(k=>{g[k]=null;}); return g; }

export function makeEmptyQueues() { const q={}; ZK.forEach(k=>{q[k]=[];}); return q; }

export function computeTeamResult(players, teamA, teamB, winner, zone) {
  const z = ZONES[zone];
  const pMap = {}; players.forEach(p=>{pMap[p.id]=p;});
  const aAvg = teamAvg(pMap,teamA,zone), bAvg = teamAvg(pMap,teamB,zone);
  const diff = Math.abs(aAvg-bAvg);
  const favored = diff>=5 ? (aAvg>bAvg?"A":"B") : null;

  return players.map(p => {
    const inA=teamA.includes(p.id), inB=teamB.includes(p.id);
    if (!inA&&!inB) return p;
    const myTeam = inA?"A":"B";
    const isWin = myTeam===winner;
    const isFav = favored===myTeam, isUnd = favored!==null&&!isFav;
    const prev = (p.zoneStreaks||{})[zone]||0;
    const newStreak = isWin?prev+1:0;
    const bonus = isWin&&prev>=2;
    let delta;
    if (isWin) {
      let pts=z.winPts;
      if(isFav) pts=Math.max(1,pts-1); if(isUnd) pts+=1; if(bonus) pts=Math.round(pts*1.5);
      delta=pts;
    } else {
      let pts=z.lossPts;
      if(isFav) pts+=1; if(isUnd) pts=Math.max(0,pts-1);
      delta=-pts;
    }
    const curZS=(p.zoneScores||{})[zone]||50;
    const newZS=isWin?Math.min(100,Math.round(curZS+(bonus?22:13))):Math.max(0,Math.round(curZS-9));
    const newGP=Math.max(0,p.globalPoints+delta);
    const newZoneScores={...(p.zoneScores||{}),[zone]:newZS};
    const newEntry={zone,isWin,delta,bonus,newStreak,ts:Date.now(),gp:newGP,zs:{...newZoneScores}};
    return {
      ...p,
      globalPoints:newGP,
      zoneScores:newZoneScores,
      zoneStreaks:{...(p.zoneStreaks||{}),[zone]:newStreak},
      zonesPlayed:(p.zonesPlayed||[]).includes(zone)?(p.zonesPlayed||[]):[...(p.zonesPlayed||[]),zone],
      lastResult:{zone,isWin,delta,bonus,newStreak},
      history:[...(p.history||[]),newEntry]
    };
  });
}

export function computeIndividualResult(players, participants, winnerId, zone, secondId=null) {
  const z = ZONES[zone];
  const pMap = {}; players.forEach(p=>{pMap[p.id]=p;});
  let favoredId = null;
  if (zone==="footAgility"&&participants.length===2) {
    const [a,b]=participants;
    if(Math.abs(((pMap[a]?.zoneScores||{})[zone]||50)-((pMap[b]?.zoneScores||{})[zone]||50))>=5)
      favoredId = ((pMap[a]?.zoneScores||{})[zone]||50)>((pMap[b]?.zoneScores||{})[zone]||50)?a:b;
  }
  return players.map(p => {
    if (!participants.includes(p.id)) return p;
    const isWin = p.id===winnerId;
    const isSecond = zone==="speed" && secondId && p.id===secondId;
    const isFav = favoredId===p.id, isUnd = favoredId!==null&&!isFav;
    const prev = (p.zoneStreaks||{})[zone]||0;
    const newStreak = isWin?prev+1:0;
    const bonus = isWin&&prev>=2;
    let tierAdj = 0;
    if (zone==="speed") {
      const tier = getSprintTier((p.zoneScores||{}).speed||50);
      if(isWin) tierAdj = tier===5?1:tier===1?-1:0;
      else tierAdj = tier===5?-1:tier===1?1:0;
    }
    let delta;
    if (isWin) {
      let pts=z.winPts;
      if(isFav) pts=Math.max(1,pts-1); if(isUnd) pts+=1; if(bonus) pts=Math.round(pts*1.5);
      pts=Math.max(1,pts+tierAdj); delta=pts;
    } else if (isSecond) {
      // 2e place vitesse : +2 pts globaux, +5 pts de zone
      delta=2;
    } else {
      let pts=z.lossPts;
      if(isFav) pts+=1; if(isUnd) pts=Math.max(0,pts-1);
      pts=Math.max(0,pts-tierAdj); delta=-pts;
    }
    const curZS=(p.zoneScores||{})[zone]||50;
    const newZS=isWin?Math.min(100,Math.round(curZS+(bonus?22:13))):isSecond?Math.min(100,Math.round(curZS+5)):Math.max(0,Math.round(curZS-9));
    const newGP=Math.max(0,p.globalPoints+delta);
    const newZoneScores={...(p.zoneScores||{}),[zone]:newZS};
    const newEntry={zone,isWin,isSecond:isSecond||false,delta,bonus,newStreak,ts:Date.now(),gp:newGP,zs:{...newZoneScores}};
    return {
      ...p,
      globalPoints:newGP,
      zoneScores:newZoneScores,
      zoneStreaks:{...(p.zoneStreaks||{}),[zone]:newStreak},
      zonesPlayed:(p.zonesPlayed||[]).includes(zone)?(p.zonesPlayed||[]):[...(p.zonesPlayed||[]),zone],
      lastResult:{zone,isWin,isSecond:isSecond||false,delta,bonus,newStreak},
      history:[...(p.history||[]),newEntry]
    };
  });
}

export function refillQueues(players, queues, activeGames) {
  const newQ = {}; ZK.forEach(z=>{newQ[z]=[...queues[z]];});
  ZK.forEach(zone => {
    const deficit = QUEUE_MIN[zone]-newQ[zone].length;
    if(deficit<=0) return;
    const eligible = shuffle(players.filter(p => {
      const {inQueues,playingAt} = getStatus(p.id,newQ,activeGames);
      return !playingAt && !newQ[zone].includes(p.id) && inQueues.length<2;
    }));
    eligible.slice(0,deficit+3).forEach(p=>{newQ[zone].push(p.id);});
  });
  return newQ;
}

export function buildInitialQueues(players) {
  const targets={purinstinct:20,speed:18,handAgility:12,footAgility:10,generalAgility:12,iq:10};
  const counts={}; players.forEach(p=>{counts[p.id]=0;});
  const q=makeEmptyQueues();
  ZK.forEach(zone=>{
    const pool=shuffle(players.map(p=>p.id));
    let added=0;
    for(const id of pool){
      if(added>=targets[zone]) break;
      if(counts[id]<2){q[zone].push(id);counts[id]++;added++;}
    }
  });
  return q;
}

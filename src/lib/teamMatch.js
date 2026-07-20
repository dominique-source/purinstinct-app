import { getStatus } from "./game-logic.js";

// Mode équipes manuel (corporate/ecole): les joueurs rejoignent une équipe nommée par
// zone au lieu d'une file individuelle, et les affrontements suivent une rotation
// équitable entre équipes plutôt qu'un tirage libre. Fonctions pures, mêmes conventions
// que game-logic.js — testées indépendamment de Firebase/React.

// Clé canonique d'une paire d'équipes, indépendante de l'ordre (A,B)===(B,A).
export function pairKey(teamIdA, teamIdB) {
  return [teamIdA, teamIdB].sort().join("|");
}

// Un joueur est "prêt" pour une équipe s'il n'est pas déjà engagé dans un autre match.
function isReady(playerId, activeGames) {
  return getStatus(playerId, {}, activeGames).playingAt === null;
}

// Cherche une équipe existante par nom (insensible à la casse/espaces) dans `teams`
// ({[teamId]:{name,memberIds}}). Retourne l'id existant, ou un nouvel id si aucune
// équipe ne correspond — à la charge de l'appelant de créer l'entrée.
export function joinOrCreateTeam(teams, name) {
  const trimmed = (name || "").trim();
  const normalized = trimmed.toLowerCase();
  const existing = Object.entries(teams || {}).find(
    ([, t]) => (t.name || "").trim().toLowerCase() === normalized,
  );
  if (existing) return { teamId: existing[0], name: existing[1].name, isNew: false };
  return { teamId: "team_" + Date.now(), name: trimmed, isNew: true };
}

// Équipes ayant au moins `teamSize` membres non engagés ailleurs, pour une zone donnée.
export function eligibleTeams(teams, activeGames, teamSize) {
  return Object.entries(teams || {})
    .filter(([, t]) => (t.memberIds || []).filter((id) => isReady(id, activeGames)).length >= teamSize)
    .map(([teamId]) => teamId);
}

// Choisit la prochaine paire d'équipes à affronter: parmi les équipes éligibles, celle
// dont le compte de parties déjà jouées ensemble (pairCounts) est le plus bas — rotation
// équitable "paire la moins jouée d'abord". Égalité tranchée par ordre d'apparition dans
// `teams` (approximativement chronologique, teamId="team_"+Date.now()).
// Retourne {teamAId, teamBId} ou null si moins de 2 équipes éligibles.
export function pickTeamMatchup(teams, activeGames, teamSize, pairCounts = {}) {
  const ready = eligibleTeams(teams, activeGames, teamSize);
  if (ready.length < 2) return null;

  let best = null;
  let bestCount = Infinity;
  for (let i = 0; i < ready.length; i++) {
    for (let j = i + 1; j < ready.length; j++) {
      const count = pairCounts[pairKey(ready[i], ready[j])] || 0;
      if (count < bestCount) {
        bestCount = count;
        best = { teamAId: ready[i], teamBId: ready[j] };
      }
    }
  }
  return best;
}

// Forme un match {type:"team",teamA,teamB} à partir de deux équipes: prend les
// `teamSize` premiers membres prêts (ordre d'inscription, FIFO) de chacune. Les membres
// excédentaires restent dans l'équipe pour le prochain match.
export function formTeamMatch(teamA, teamB, teamSize, activeGames) {
  const readyOf = (team) => (team.memberIds || []).filter((id) => isReady(id, activeGames)).slice(0, teamSize);
  return { type: "team", teamA: readyOf(teamA), teamB: readyOf(teamB) };
}

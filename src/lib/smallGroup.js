// Mode "Petit Groupe": orchestration automatique d'une manche (12 joueurs à
// PurInstinct + zones secondaires ouvertes en parallèle). Fonctions pures,
// mêmes conventions que game-logic.js/teamMatch.js — testées indépendamment
// de Firebase/React. La sélection de zones et la répartition des joueurs sont
// volontairement simples (heuristiques gloutonnes, pas d'optimisation
// combinatoire) — voir le plan pour le compromis assumé.

export const SECONDARY_ZONE_CANDIDATES = ["handAgility", "footAgility", "generalAgility", "iq"];

function lastPlayedTs(player, zone) {
  const entries = (player.history || []).filter((h) => h.zone === zone);
  if (!entries.length) return -Infinity;
  return Math.max(...entries.map((h) => h.ts));
}

function lastZoneOf(player) {
  const hist = player?.history || [];
  return hist.length ? hist[hist.length - 1].zone : null;
}

// Snake draft par score décroissant, même pattern que generateTeams
// (App.jsx) — dupliqué ici en petit plutôt que de refactorer generateTeams,
// pour ne toucher aucun code déjà en production.
function snakeDraft(ids, scoreFn) {
  const even = ids.length % 2 === 0 ? ids.length : ids.length - 1;
  const sorted = [...ids.slice(0, even)].sort((a, b) => scoreFn(b) - scoreFn(a));
  const teamA = [], teamB = [];
  sorted.forEach((id, i) => {
    const round = Math.floor(i / 2);
    if (round % 2 === 0) (i % 2 === 0 ? teamA : teamB).push(id);
    else (i % 2 === 0 ? teamB : teamA).push(id);
  });
  return { teamA, teamB };
}

// Sélectionne jusqu'à `count` joueurs pour PurInstinct: priorité à ceux
// n'ayant jamais joué purinstinct, puis aux plus anciens (dernier passage le
// plus vieux). Retourne aussi les joueurs non sélectionnés (`remaining`),
// disponibles pour les zones secondaires.
export function selectPurinstinctPlayers(availableIds, pMap, count = 12) {
  const sorted = [...availableIds].sort((a, b) => {
    const pa = pMap[a] || {}, pb = pMap[b] || {};
    const aPlayed = (pa.zonesPlayed || []).includes("purinstinct");
    const bPlayed = (pb.zonesPlayed || []).includes("purinstinct");
    if (aPlayed !== bPlayed) return aPlayed ? 1 : -1;
    return lastPlayedTs(pa, "purinstinct") - lastPlayedTs(pb, "purinstinct");
  });
  const selected = sorted.slice(0, count);
  const selectedSet = new Set(selected);
  const remaining = availableIds.filter((id) => !selectedSet.has(id));
  return { selected, remaining };
}

// Choisit quelles zones secondaires ouvrir: least-used-first parmi les
// candidates, égalité tranchée par l'ordre de `candidates`.
export function pickSecondaryZones(candidates, zoneCount, zoneUsageCounts = {}) {
  const sorted = [...candidates].sort((a, b) => (zoneUsageCounts[a] || 0) - (zoneUsageCounts[b] || 0));
  return sorted.slice(0, Math.max(0, Math.min(zoneCount, candidates.length)));
}

// Répartit les joueurs restants entre les zones secondaires (round-robin),
// puis une passe best-effort qui évite de renvoyer un joueur dans la zone où
// il a joué en dernier, quand un échange avec une autre zone est possible.
export function distributeSecondaryZones(remainingIds, secondaryZones, pMap) {
  const assignments = {};
  secondaryZones.forEach((z) => { assignments[z] = []; });
  if (!secondaryZones.length) return assignments;

  remainingIds.forEach((id, i) => {
    assignments[secondaryZones[i % secondaryZones.length]].push(id);
  });

  secondaryZones.forEach((zone) => {
    const list = assignments[zone];
    for (let i = 0; i < list.length; i++) {
      const id = list[i];
      if (lastZoneOf(pMap[id]) !== zone) continue;
      for (const otherZone of secondaryZones) {
        if (otherZone === zone) continue;
        const otherList = assignments[otherZone];
        // Suffisant que le remplaçant ne revienne pas dans SA zone (`zone`) —
        // `id` quitte forcément `otherZone` (puisque zone!==otherZone et
        // lastZoneOf(id)===zone), donc son côté du swap est déjà garanti.
        const swapIdx = otherList.findIndex((oid) => lastZoneOf(pMap[oid]) !== zone);
        if (swapIdx !== -1) {
          const otherId = otherList[swapIdx];
          list[i] = otherId;
          otherList[swapIdx] = id;
          break;
        }
      }
    }
  });

  return assignments;
}

// Course vitesse unique: tous les joueurs restants, triés comme le fait déjà
// generateTeams pour la zone speed (par zoneScores.speed croissant).
export function formSpeedRace(remainingIds, pMap) {
  return [...remainingIds].sort(
    (a, b) => ((pMap[a]?.zoneScores || {}).speed || 50) - ((pMap[b]?.zoneScores || {}).speed || 50),
  );
}

// Fonction chapeau: seule fonction de ce module appelée depuis App.jsx.
export function planRound({ availableIds, pMap, zoneCount, speedMode, secondaryZoneUsage = {} }) {
  const { selected: purinstinctIds, remaining } = selectPurinstinctPlayers(availableIds, pMap, 12);
  const purinstinct = snakeDraft(purinstinctIds, (id) => pMap[id]?.globalPoints || 0);

  if (speedMode) {
    const speedQueue = formSpeedRace(remaining, pMap);
    return { purinstinct, secondaryZones: [], secondaryAssignments: {}, speedQueue, updatedZoneUsage: secondaryZoneUsage };
  }

  const secondaryZones = pickSecondaryZones(SECONDARY_ZONE_CANDIDATES, zoneCount, secondaryZoneUsage);
  const secondaryAssignments = distributeSecondaryZones(remaining, secondaryZones, pMap);
  const updatedZoneUsage = { ...secondaryZoneUsage };
  secondaryZones.forEach((z) => { updatedZoneUsage[z] = (updatedZoneUsage[z] || 0) + 1; });

  return { purinstinct, secondaryZones, secondaryAssignments, speedQueue: [], updatedZoneUsage };
}

import { useState } from "react";
import { ZONES, ZK } from "../../../config/zones.js";
import { useZn, useT } from "../../../hooks/useLang.js";
import { Panel, Eyebrow } from "../../ui/Panel.jsx";
import { Button } from "../../ui/Button.jsx";
import { SECONDARY_ZONE_CANDIDATES } from "../../../lib/smallGroup.js";
import { TeamGameView } from "../../game/TeamGameView.jsx";
import { IndividualGameView } from "../../game/IndividualGameView.jsx";
import { SprintGameView } from "../../game/SprintGameView.jsx";

// Il n'y a que 4 zones secondaires candidates (speed en est exclue — voir
// plus bas) — le sélecteur de nombre de zones s'arrête donc à 4, pas 5.
const MAX_SECONDARY_ZONES = SECONDARY_ZONE_CANDIDATES.length;

function isPlaying(playerId, activeGames) {
  return ZK.some((zk) => {
    const g = activeGames[zk];
    if (!g) return false;
    const all = g.participants || [...(g.teamA || []), ...(g.teamB || [])];
    return all.includes(playerId);
  });
}

// Liste (noms) des joueurs en attente d'une zone — pas seulement le compte,
// pour que le responsable voie qui reviendra dans le prochain match. Teintée
// avec la couleur de la zone (comme les puces de match des GameView) —
// sur fond var(--pi-surface-1)/var(--pi-text-2) les puces étaient quasi
// invisibles (gris sur gris sombre), et la couleur renforce aussi
// visuellement que ces joueurs restent affectés à CETTE zone.
function WaitingList({ zone, queue, players }) {
  if (!queue || queue.length === 0) return null;
  const z = ZONES[zone];
  const pMap = {}; players.forEach((p) => { pMap[p.id] = p; });
  return (
    <div style={{ marginTop: "var(--pi-s2)", paddingTop: "var(--pi-s2)", borderTop: "1px solid "+z.border }}>
      <div style={{ fontSize: "var(--pi-fs-label)", color: "var(--pi-text-3)", marginBottom: 6 }}>
        En attente ({queue.length})
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {queue.map((id) => {
          const p = pMap[id];
          if (!p) return null;
          return (
            <span key={id} style={{ fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: "var(--pi-r-pill)",
              background: z.bg, border: "1px solid "+z.border, color: z.color }}>
              {p.number ? `#${p.number} ` : ""}{p.name.split(" ")[0]}
            </span>
          );
        })}
      </div>
    </div>
  );
}

// Carte de zone: rend le vrai composant de match interactif (les mêmes que
// StationView — boutons "retirer un joueur", "remplacer", "déclarer
// gagnant") dès qu'un match est formé. Simplification volontaire par
// rapport à StationView: soumission immédiate au clic, pas de fenêtre
// d'annulation de 10s — acceptable ici puisqu'un seul responsable de
// confiance pilote tout depuis ce tableau de bord.
// Bordure/fond teintés avec la couleur de la zone (z.border/z.bg, config/
// zones.js) plutôt que le gris générique var(--pi-line) — pour bien
// délimiter visuellement les zones secondaires les unes des autres.
function ZoneMatchCard({ zone, activeGame, queue, players, zn, onResult, onRemove, onReplace }) {
  const z = ZONES[zone];
  const zl = zn(zone);
  return (
    <div style={{ border: "1px solid "+z.border, borderRadius: "var(--pi-r-md)", padding: "var(--pi-s3)", background: z.bg }}>
      <Eyebrow style={{ marginBottom: "var(--pi-s2)", color: z.color }}>{z.icon} {zl.sn}</Eyebrow>
      {activeGame ? (
        activeGame.type === "team" ? (
          <TeamGameView game={activeGame} players={players} zone={zone} onResult={onResult} onRemove={onRemove} onReplace={onReplace} />
        ) : activeGame.type === "sprint" ? (
          <SprintGameView game={activeGame} players={players} zone={zone} onWinner={onResult} onRemove={onRemove} onReplace={onReplace} />
        ) : (
          <IndividualGameView game={activeGame} players={players} zone={zone} onWinner={onResult} onRemove={onRemove} onReplace={onReplace} />
        )
      ) : (
        <div style={{ fontSize: "var(--pi-fs-label)", color: "var(--pi-text-3)" }}>En attente</div>
      )}
      <WaitingList zone={zone} queue={queue} players={players} />
    </div>
  );
}

// Onglet admin "Petit Groupe": formulaire de lancement de manche (effectif
// indicatif, nombre de zones secondaires ou manche vitesse) + grand tableau
// des matchs en cours. L'orchestration elle-même (sélection des joueurs,
// répartition) vit dans src/lib/smallGroup.js et App.jsx:launchSmallGroupRound
// — ce composant ne fait qu'afficher l'état et déclencher onLaunchRound.
export function SmallGroupTab({ players, queues, activeGames, smallGroup, onLaunchRound, onPauseRound, onSubmitResult, onRemoveFromGame, onReplaceInGame, previewOnly = false }) {
  const zn = useZn();
  const t = useT();
  const [headcount, setHeadcount] = useState(smallGroup.headcount || 24);
  const [zoneCount, setZoneCount] = useState(smallGroup.zoneCount || 2);
  const [speedMode, setSpeedMode] = useState(false);

  const status = smallGroup.roundStatus || "idle";
  const canLaunch = status === "idle" || status === "roundEnded";
  const availableCount = players.filter((p) => !isPlaying(p.id, activeGames)).length;
  const boardZones = status === "idle" ? [] : (smallGroup.roundZones || []).filter((z) => z !== "purinstinct");

  return (
    <div className="pi-anim-up" style={{ display: "flex", flexDirection: "column", gap: "var(--pi-s3)" }}>
      {status === "wrapping" && (
        <Panel style={{ borderColor: "var(--pi-warn)", background: "var(--pi-warn-wash)" }}>
          <div style={{ fontWeight: 700, color: "var(--pi-warn)" }}>{t.smallGroupWrappingTitle}</div>
          <div style={{ fontSize: "var(--pi-fs-label)", color: "var(--pi-text-3)", marginTop: 2 }}>
            {t.smallGroupWrappingDesc}{" "}
            {(smallGroup.roundZones || []).filter((zk) => activeGames[zk]).map((zk) => zn(zk).sn).join(", ") || "—"}
          </div>
        </Panel>
      )}
      {status === "roundEnded" && (
        <Panel style={{ borderColor: "var(--pi-lime-line)", background: "var(--pi-lime-wash)" }}>
          <div style={{ fontWeight: 700, color: "var(--pi-lime)" }}>✓ Manche {smallGroup.roundNumber} terminée</div>
        </Panel>
      )}

      <Panel>
        <Eyebrow style={{ marginBottom: "var(--pi-s3)" }}>{t.smallGroupLaunchTitle}</Eyebrow>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--pi-s3)" }}>
          <div>
            <div style={{ fontSize: "var(--pi-fs-label)", color: "var(--pi-text-3)", marginBottom: 4 }}>
              {t.smallGroupHeadcountLabel} ({availableCount} disponible{availableCount !== 1 ? "s" : ""})
            </div>
            <input type="number" min={12} max={50} value={headcount}
              onChange={(e) => setHeadcount(Number(e.target.value))}
              className="pi-input" style={{ width: 100 }} />
            {availableCount < headcount && (
              <div style={{ fontSize: "var(--pi-fs-label)", color: "var(--pi-warn)", marginTop: 4 }}>
                ⚠️ Seulement {availableCount} joueur{availableCount !== 1 ? "s" : ""} disponible{availableCount !== 1 ? "s" : ""} pour l'instant.
              </div>
            )}
          </div>

          <div>
            <div style={{ fontSize: "var(--pi-fs-label)", color: "var(--pi-text-3)", marginBottom: 4 }}>{t.smallGroupZoneCountLabel}</div>
            <div style={{ display: "flex", gap: "var(--pi-s2)" }}>
              {Array.from({ length: MAX_SECONDARY_ZONES }, (_, i) => i + 1).map((n) => (
                <button key={n} onClick={() => setZoneCount(n)} disabled={speedMode}
                  className={zoneCount === n && !speedMode ? "pi-tab is-active" : "pi-tab"}
                  style={speedMode ? {
                    minWidth: 40, cursor: "not-allowed", opacity: 0.35,
                    background: "var(--pi-surface-1)", color: "var(--pi-text-4)",
                    textDecoration: "line-through", filter: "grayscale(1)",
                  } : zoneCount === n ? { minWidth: 40 } : {
                    minWidth: 40, border: "1px solid var(--pi-line-strong)", background: "var(--pi-surface-1)",
                  }}>
                  {n}
                </button>
              ))}
            </div>
          </div>

          <button onClick={() => setSpeedMode((s) => !s)}
            style={{ alignSelf: "flex-start", padding: "7px 16px", borderRadius: "var(--pi-r-pill)", border: "1px solid", cursor: "pointer",
              fontSize: "var(--pi-fs-label)", fontWeight: 700,
              background: speedMode ? "var(--pi-lime-wash)" : "var(--pi-surface-2)",
              color: speedMode ? "var(--pi-lime)" : "var(--pi-text-3)",
              borderColor: speedMode ? "var(--pi-lime-line)" : "var(--pi-line)" }}>
            ⚡ {t.smallGroupSpeedModeLabel} {speedMode ? t.teamModeActive : t.teamModeInactive}
          </button>

          <Button variant="primary" size="lg" disabled={!canLaunch}
            onClick={() => onLaunchRound({ headcount, zoneCount, speedMode })}>
            {status === "roundEnded" ? `🚀 Lancer la manche ${(smallGroup.roundNumber || 0) + 1}` : t.smallGroupLaunchBtn}
          </Button>
          {previewOnly && (
            <div style={{ fontSize: "var(--pi-fs-label)", color: "var(--pi-text-3)" }}>
              🧪 Aperçu — joueurs de test.
            </div>
          )}
          {!canLaunch && (
            <div style={{ fontSize: "var(--pi-fs-label)", color: "var(--pi-text-3)" }}>
              Manche {smallGroup.roundNumber} en cours…
            </div>
          )}
          {!canLaunch && onPauseRound && (
            <button onClick={() => { if (window.confirm(t.smallGroupPauseConfirm)) onPauseRound(); }} style={{
              alignSelf: "flex-start", padding: "6px 12px", borderRadius: "var(--pi-r-pill)",
              border: "1px solid var(--pi-line)", background: "transparent", color: "var(--pi-text-3)",
              cursor: "pointer", fontSize: "var(--pi-fs-label)" }}>
              ⏸ {t.smallGroupPauseBtn}
            </button>
          )}
        </div>
      </Panel>

      {status !== "idle" && (
        <Panel>
          <Eyebrow style={{ marginBottom: "var(--pi-s3)" }}>Manche {smallGroup.roundNumber} — {t.smallGroupBoardTitle}</Eyebrow>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--pi-s3)" }}>
            <ZoneMatchCard zone="purinstinct" activeGame={activeGames.purinstinct} queue={queues.purinstinct} players={players} zn={zn}
              onResult={(winner) => onSubmitResult("purinstinct", winner)}
              onRemove={(id) => onRemoveFromGame("purinstinct", id)}
              onReplace={() => onReplaceInGame("purinstinct")} />
            {boardZones.map((zk) => (
              <ZoneMatchCard key={zk} zone={zk} activeGame={activeGames[zk]} queue={queues[zk]} players={players} zn={zn}
                onResult={(winner, second) => onSubmitResult(zk, winner, second)}
                onRemove={(id) => onRemoveFromGame(zk, id)}
                onReplace={() => onReplaceInGame(zk)} />
            ))}
          </div>
        </Panel>
      )}
    </div>
  );
}

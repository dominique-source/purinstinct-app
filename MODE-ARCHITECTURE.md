# MODE-ARCHITECTURE.md

Branche: `feat/multi-mode` (base: `redesign/level-5`, 15 commits devant `main`).

## 1. État actuel — routing (src/App.jsx)

Le routing est un état local `view` (`{type, ...}`), initialisé depuis l'URL :
- `?kiosk=1[&zone=X]` → `{type:"kiosk", zone}` directement (bypass écran PIN)
- sinon → `{type:"login"}`

Table `view.type` → composant monté :

| view.type          | Composant                    | Déclenché depuis | Notes |
|---------------------|-------------------------------|-------------------|-------|
| `login`             | `ModeSelectView`               | défaut            | Choix LIVE/TEST, gated par `MODE_PIN` unique (4 chiffres) |
| `kiosk`              | `KioskView`                    | `?kiosk=1`        | Self-service 3 taps zone→nom→confirmer, `onRegister=kioskRegister` |
| `liveLogin`          | `LiveLoginView`                 | `onLive` (ModeSelectView), Firebase `liveMode:true` | Login joueur réel + gating admin/station via `ADMIN_PIN`/`STATION_PIN` (LiveLoginView.jsx:142) |
| `testLogin`          | `TestLanding`                   | `onTest` (ModeSelectView) | Pré-remplit 30 `TEST_PLAYERS` hardcodés, jamais synced Firebase |
| `testLoginFull`      | `LoginView`                     | (legacy, atteignable seulement par code, pas de bouton actif observé) | |
| `augmentedLanding`   | `AugmentedLanding`              | TestLanding → "augmented" | |
| `augmentedStation`   | `AugmentedStation`              | AugmentedLanding | |
| `adminHome`          | inline JSX (menu 4 boutons)     | après login live/test | Session/Station/Sessions-tab/Déconnexion |
| `admin`              | `AdminView`                     | adminHome           | Full CRUD roster/joueurs/arena |
| `station`            | `StationView`                   | stationPick          | Zone de jeu (queue, generateTeams, submitResult) |
| `stationPick`        | inline JSX (liste des zones)     | adminHome/player      | |
| `player`             | `PlayerView`                     | après login joueur    | Vue joueur (queue, historique, devenir station) |

Sync Firebase : un seul nœud `state` (players, queues, activeGames, arenaState, comments,
winnersPublished, rosterCodes, pendingSessions, liveMode, activeRosterId, extraRosters).
Écritures atomiques via `fbUpdate` sur des chemins ciblés (Bullet A, déjà en place) — jamais de
réécriture globale dans le flux de jeu.

### PINs actuels (src/config/pins.js)
- `MODE_PIN` (défaut `1111`) — gate LIVE vs TEST dans `ModeSelectView`
- `ADMIN_PIN` (défaut `1111`) / `STATION_PIN` (défaut `2222`) — gate rôle admin/station **à
  l'intérieur** du flux `liveLogin` (LiveLoginView.jsx:142), indépendant du MODE_PIN

### Modèle joueur actuel (addPlayerToSession, App.jsx:202)
```
{ id, number, name, gender, globalPoints,
  zoneScores:{...}, zoneStreaks:{...}, zonesPlayed:[], lastResult, history:[],
  groupId,
  age:"", email:"", instagram:"", tiktok:"", snapchat:"",
  photoConsent:false, videoConsent:false, profilePhoto:null, highlights:[] }
```
Un champ `email` texte libre existe déjà mais n'est actuellement pas rendu dans l'UI
d'inscription (ni Live ni Kiosk) — pas de `marketingConsent`.

### Règles Firebase (database.rules.json)
Minimal : `.read`/`.write` gated sur `auth != null` au niveau `state`, plus quelques
`.validate` de type sur `meta/lastPlayerId`, `winnersPublished`, `liveMode`, `activeRosterId`.
Aucune règle par champ pour l'instant (à étendre à l'étape 5).

## 2. Baseline (avant toute modif)
- `npm test` → 21/21 verts (vitest, src/lib/game-logic.test.js)
- `npm run lint` → 22 erreurs / 1 warning **pré-existants**, sans lien avec cette tâche
  (no-unused-vars et react-hooks/set-state-in-effect dans plusieurs fichiers). Ces erreurs
  serviront de référence : le multi-mode ne doit pas en ajouter de nouvelles, mais on ne les
  corrige pas dans cette branche (hors scope).

## 3. Plan des 5 modes (config de référence, à implémenter tel quel à l'étape 1)

| mode      | entryFlow          | captureFields                    | consent            | allowPII | kioskDefault | enabledViews |
|-----------|---------------------|-----------------------------------|----------------------|----------|----------------|----------------|
| games     | rfid                | name, number                      | photo                | true     | false          | live, station, admin, player, leaderboard |
| corporate | prereg-checkin      | name, email, company              | marketing             | true     | false          | checkin, station, player, leaderboard |
| ecole     | roster-team         | firstName, class                  | none                  | false    | false          | roster, station, leaderboard |
| festival  | selfserve-qr        | firstName, emailOptional          | marketingOptional     | true     | true           | kiosk, station, leaderboard |
| parc      | kiosk-fixed         | firstName                          | none                  | true     | true           | kiosk, station, leaderboard |

\+ mode caché `admin` (via `ADMIN_PIN`) → débloque tout (démos).

`games` = comportement Live actuel de référence, ne doit subir **aucune régression**.

## 4. Prochaines étapes
1. `src/config/modes.js` — objet `MODES` + `resolveMode(code)`, additif, non câblé, tests unitaires.
2. Refactor `ModeSelectView.jsx` — code d'entrée → `resolveMode` → `onSelectMode(modeKey)`.
3. État global `activationMode` (+ contexte) et routing conditionnel par `enabledViews` dans `App.jsx`.
4. Capture de données paramétrable (`captureFields`) + `<ConsentGate>` + verrou dur `allowPII=false`.
5. Règles Firebase par mode (rejet serveur des champs email en mode `ecole`).
6. QA e2e des 5 modes, docs, smoke test de bascule.

Chaque étape : commit conventionnel, tests + lint, diff résumé, puis attente du "OK".

# MODE-ARCHITECTURE.md

Branche: `feat/multi-mode` (base: `redesign/level-5`, 15 commits devant `main`).

> Les sections 1 à 4 ci-dessous sont l'état des lieux et le plan tels que rédigés à
> l'étape 0, avant toute implémentation — conservées comme référence historique.
> Voir **section 5** pour l'état final réellement implémenté.

## 1. État initial — routing (src/App.jsx)

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

## 4. Plan d'étapes (tel que rédigé à l'étape 0)
1. `src/config/modes.js` — objet `MODES` + `resolveMode(code)`, additif, non câblé, tests unitaires.
2. Refactor `ModeSelectView.jsx` — code d'entrée → `resolveMode` → `onSelectMode(modeKey)`.
3. État global `activationMode` (+ contexte) et routing conditionnel par `enabledViews` dans `App.jsx`.
4. Capture de données paramétrable (`captureFields`) + `<ConsentGate>` + verrou dur `allowPII=false`.
5. Règles Firebase par mode (rejet serveur des champs email en mode `ecole`).
6. QA e2e des 5 modes, docs, smoke test de bascule.

Chaque étape : commit conventionnel, tests + lint, diff résumé, puis attente du "OK".

---

## 5. État final implémenté (étapes 1-6)

### 5.1 Config centrale — `src/config/modes.js`
- `MODES` : les 5 modes de la table §3, tel quel, + mode caché `admin` (union
  automatique de tous les `enabledViews`, `hidden:true`).
- `resolveMode(code)` : code à 4 chiffres → clé de mode, ou `"admin"` si le code
  correspond à `ADMIN_PIN`, ou `null` si inconnu. Codes de repli en dev : `0000`
  (games) … `0004` (parc) — paddés en 4 chiffres pour garder le pavé numérique
  existant à l'identique (décision validée à l'étape 2 : le pavé n'a **pas** été
  raccourci à 2 chiffres).
- `classifyModeRoute(modeKey)` : classification `"live" | "admin" | "kiosk" | "stub" |
  null`, utilisée à la fois par `App.jsx` (dispatcher réel) et par le smoke test —
  une seule source de vérité pour "quel mode va où".

### 5.2 Sélecteur d'entrée — `ModeSelectView.jsx`
Écran unique de saisie de code (4 chiffres, mêmes dots/numpad/animations qu'avant).
Remplace l'ancien écran à deux étapes LIVE/TEST + `MODE_PIN` unique. `MODE_PIN` /
`VITE_MODE_PIN` ont été retirés (dead code) une fois cette bascule terminée.

### 5.3 État global — `App.jsx` + `src/hooks/useMode.js`
- `activationMode` (état React) persisté sur `state/activationMode` (Firebase),
  lu au chargement comme `activeRosterId`.
- `ModeContext` / `useMode()` / `hasView(mode, category)` : contexte React exposant
  `{mode, modeConfig}` à tout composant descendant (utilisé par `KioskView`).
- Dispatcher `onSelectMode` (branché sur `classifyModeRoute`) :
  - **live** (games) → flux Live actuel, inchangé à l'octet près (zéro régression).
  - **admin** → flux Test/Admin actuel, inchangé (raccourci "tout débloqué").
  - **kiosk** (festival, parc — `kioskDefault:true`) → bascule direct sur le vrai
    `KioskView`, comme `?kiosk=1` aujourd'hui, piloté par la config et non par le nom
    du mode.
  - **stub** (corporate, ecole) → écran de confirmation temporaire (`entryFlow`
    affiché dynamiquement) ; ces deux modes n'ont pas encore de vue dédiée montée
    dans le routing (voir §6 — reste optionnel).

### 5.4 Capture de données paramétrable
- Modèle joueur étendu : `marketingConsent` (`email` existait déjà mais n'était
  rendu dans aucune UI avant l'étape 4).
- `<ConsentGate>` (`src/components/shared/ConsentGate.jsx`) : case à cocher + texte
  Loi 25, bilingue FR/EN, rendu quand `consent` est `"marketing"` ou
  `"marketingOptional"`.
- `KioskView` lit `MODES[mode].captureFields`/`consent` via `useMode()` : champ
  courriel + `ConsentGate` affichés seulement quand le mode le prévoit (festival :
  facultatifs ; parc : aucun champ additionnel, identique à avant l'étape 4).
  `LiveLoginView` (games) non touché — son `captureFields` (`name`, `number`) ne
  change rien à l'existant.
- Verrou dur PII : `src/lib/playerCapture.js` (`assertAllowedCapture`) lève une
  erreur si un champ de contact (`email`/`instagram`/`tiktok`/`snapchat`) est soumis
  pour un mode à `allowPII:false` (ecole). Câblé en défense en profondeur dans
  `addPlayerToSession` (App.jsx), même si aucune UI ecole n'existe encore.

### 5.5 Règles Firebase — `database.rules.json`
`.validate` sur `state/players/$playerId/{email,instagram,tiktok,snapchat}` :
rejet côté serveur de toute valeur **non vide** quand `state/activationMode ===
"ecole"` (source de vérité écrite par le client à l'étape 3). La chaîne vide
(valeur par défaut) reste toujours permise. `activationMode` a aussi sa validation
de type, au même titre que `activeRosterId`. Aucune règle existante relâchée.

**Pas déployé** sur le projet Firebase — à faire séparément (`firebase deploy
--only database` ou console), hors scope de ce travail additif/branché.

### 5.6 Tests
- `src/config/modes.test.js` — `MODES`, `resolveMode`, et le **smoke test de
  bascule de mode** (`mode switching (smoke test)`) : pour chacun des 6 codes,
  vérifie le trajet complet code → `resolveMode` → `classifyModeRoute`.
- `src/lib/playerCapture.test.js` — verrou PII (5 tests, dont le test explicite
  "throws if an email is submitted in ecole mode").
- `src/lib/databaseRules.test.js` — mini-simulateur qui évalue littéralement les
  expressions `.validate` du `database.rules.json` réel (pas d'émulateur Firebase
  installé dans ce projet).
- Total : 42/42 tests verts, lint 21 erreurs/1 warning (baseline pré-existante,
  aucune régression ajoutée à aucune étape).

## 6. Ce qui reste optionnel / hors scope
- **Vues dédiées corporate/ecole** (`prereg-checkin`, `roster-team`) — la capture de
  données est déjà paramétrable (§5.4), mais aucun écran n'est monté dans
  `App.jsx` ; ces deux codes affichent l'écran stub "CODE RECONNU".
- **Import de liste RH** (mode corporate) — chargement d'une liste d'employés
  pré-inscrits, non traité.
- **Compteurs de débit / limite de capacité** (mode parc) — pas de gestion de flux
  ou de file d'attente physique au-delà de ce qu'offre déjà `KioskView`.
- **Encodage RFID in-app** (mode games) — l'association bracelet/joueur reste hors
  de cette app.
- **Déploiement des règles Firebase** (§5.5) — écrites et testées, non poussées sur
  le projet Firebase réel.
- **Émulateur Firebase RTDB** — le test des règles est un simulateur JS léger, pas
  le véritable émulateur (`firebase-tools` + JVM non installés dans ce projet).

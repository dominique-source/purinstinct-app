# PurInstinct Games

App de gestion d'événements sportifs en temps réel (React + Vite + Firebase Realtime
Database). Voir [CLAUDE.md](CLAUDE.md) pour l'identité visuelle et les règles de design,
et [MODE-ARCHITECTURE.md](MODE-ARCHITECTURE.md) pour le détail du système multi-mode.

## Démarrage

```bash
npm install
cp .env.example .env   # remplir les clés Firebase + codes d'accès
npm run dev
```

- `npm run dev` — serveur de développement Vite
- `npm run build` — build de production
- `npm test` — tests unitaires (Vitest)
- `npm run lint` — ESLint

## Variables d'environnement

Voir [.env.example](.env.example) pour la liste complète. Deux familles:

- `VITE_FB_*` — configuration Firebase (auth anonyme + Realtime Database, `auth != null`
  requis par `database.rules.json`).
- `VITE_ADMIN_PIN` / `VITE_STATION_PIN` / `VITE_CODE_*` — codes d'accès à 4 chiffres
  (jamais dans le code source).

## Multi-mode

Une seule app, un seul backend Firebase, un mode choisi par code d'entrée à l'écran de
démarrage. Chaque mode débloque une combinaison différente de vues et de champs de
capture de joueur — voir `src/config/modes.js` (`MODES`, `resolveMode`,
`classifyModeRoute`) et [MODE-ARCHITECTURE.md](MODE-ARCHITECTURE.md) pour le détail.

| Code (dev)     | Mode      | Description                                    |
|----------------|-----------|-------------------------------------------------|
| `VITE_CODE_GAMES` (`0000`)     | games     | Référence RFID/Live — comportement historique |
| `VITE_CODE_CORPORATE` (`0001`) | corporate | Pré-inscription + check-in (vue à construire) |
| `VITE_CODE_ECOLE` (`0002`)     | ecole     | Roster par classe, aucune PII (vue à construire) |
| `VITE_CODE_FESTIVAL` (`0003`)  | festival  | Kiosque libre-service, courriel/consentement facultatifs |
| `VITE_CODE_PARC` (`0004`)      | parc      | Kiosque fixe, prénom seulement |
| `VITE_ADMIN_PIN` (`1111`)      | admin     | Raccourci caché — débloque toutes les vues (démos) |

## Tests

- `src/lib/*.test.js` — logique de jeu, verrou PII, simulation des règles Firebase
- `src/config/modes.test.js` — résolution des codes + smoke test de bascule de mode

Le pipeline complet (code → `resolveMode` → `classifyModeRoute` → vue montée dans
`App.jsx`) est couvert par le smoke test `mode switching (smoke test)`.

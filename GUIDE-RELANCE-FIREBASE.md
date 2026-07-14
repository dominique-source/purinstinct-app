# Guide de relance — PürInstinct App sur Firebase

Temps estimé: 20 minutes. Aucune ligne de code à écrire.

## Étape 1 — Créer le projet Firebase (5 min)

1. Va sur https://console.firebase.google.com
2. **Ajouter un projet** → nom: `purinstinct-app` (ou réutilise `purinstinct-games` s'il existe encore et que tu veux repartir dessus)
3. Google Analytics: désactive (inutile pour l'instant)

## Étape 2 — Realtime Database (3 min)

1. Menu gauche → **Build → Realtime Database** → **Créer une base de données**
2. Région: `us-central1` (la plus proche avec RTDB)
3. Mode: **verrouillé** (on met nos propres règles à l'étape 3)

## Étape 3 — Règles de sécurité (2 min)

1. Onglet **Règles** de la Realtime Database
2. Colle le contenu du fichier `database.rules.json` (à la racine du repo)
3. **Publier**

Ce que ces règles font: toute lecture/écriture exige une identité authentifiée. La base n'est plus ouverte à quiconque trouve l'URL.

## Étape 4 — Authentification anonyme (1 min)

1. Menu gauche → **Build → Authentication** → **Commencer**
2. Onglet **Sign-in method** → **Anonyme** → activer → enregistrer

Chaque appareil (mobile joueur, tablette de plateau, poste admin) obtient automatiquement une identité au chargement de l'app. Aucun impact visible pour les utilisateurs.

## Étape 5 — Récupérer la configuration (2 min)

1. Roue dentée → **Paramètres du projet** → section **Tes applications**
2. **Ajouter une application** → icône **Web** `</>` → nom: `purinstinct-app`
3. Copie les valeurs du bloc `firebaseConfig`

## Étape 6 — Variables d'environnement

### En local
1. Copie `.env.example` vers `.env`
2. Remplis les valeurs `VITE_FB_*` avec la config de l'étape 5
3. Change les PINs (`VITE_MODE_PIN`, `VITE_ADMIN_PIN`, `VITE_STATION_PIN`)

### Sur Vercel
1. Projet Vercel → **Settings → Environment Variables**
2. Ajoute chacune des variables du `.env` (Production + Preview)
3. **Redeploy** (Deployments → ⋯ → Redeploy)

## Étape 7 — Vérification (5 min)

1. Ouvre l'app déployée sur deux appareils en même temps
2. Console Firebase → Authentication → tu dois voir apparaître des utilisateurs anonymes
3. Console Firebase → Realtime Database → tu dois voir `state/` se peupler
4. Test de collision: deux plateaux soumettent un résultat à moins d'une seconde d'intervalle → les deux résultats doivent être conservés (c'était le bug principal avant)

## Ce qui a changé dans le code

**`src/firebase.js` (réécrit)**
- Config lue depuis les variables d'environnement, plus rien de sensible dans le repo
- `ensureAuth()`: connexion anonyme automatique au démarrage
- `fbUpdate()`: écritures multi-chemins atomiques
- `allocPlayerId()`: numéros de joueurs alloués par transaction (fini les doublons quand deux personnes s'inscrivent en même temps)

**`src/App.jsx` (couche de sync refactorée)**
- Résultat de match: écrit seulement les joueurs du match + le match de la zone + les files modifiées, en une opération atomique. Avant, chaque résultat réécrivait la totalité des joueurs et des files, ce qui écrasait les actions simultanées des autres plateaux.
- Files d'attente: chaque ajout/retrait/réordonnancement n'écrit que la file de sa zone
- Inscriptions: écriture d'un seul joueur, ID atomique
- Commentaires et sessions en attente: écriture par élément
- PINs sortis du code source vers `.env`
- Les écritures globales sont conservées uniquement pour les actions admin volontaires (activer une session, resets globaux)

## Prochaine marche de sécurité (optionnel, phase A2)

Les PINs restent vérifiés côté client. Pour une sécurité de niveau production (rôles admin/plateau imposés par les règles de la base elle-même), il faudra des custom claims via une Cloud Function. À faire avant les gros événements publics, pas bloquant pour relancer maintenant.

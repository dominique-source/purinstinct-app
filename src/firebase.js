import { initializeApp } from "firebase/app";
import {
  getDatabase, ref, set, onValue, off, update, runTransaction,
  goOnline, goOffline,
} from "firebase/database";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";

// ── Configuration ────────────────────────────────────────────────
// Priorité aux variables d'environnement (VITE_FB_*) définies dans .env
// (local) et dans Vercel > Settings > Environment Variables (production).
// Le fallback pointe vers l'ancien projet pour ne rien casser en transition.
const env = import.meta.env;

const firebaseConfig = {
  apiKey:            env.VITE_FB_API_KEY            || "AIzaSyBkXHtdoEfGhRTH-T06XPk3rteni7kiFr8",
  authDomain:        env.VITE_FB_AUTH_DOMAIN        || "purinstinct-games.firebaseapp.com",
  databaseURL:       env.VITE_FB_DATABASE_URL       || "https://purinstinct-games-default-rtdb.firebaseio.com",
  projectId:         env.VITE_FB_PROJECT_ID         || "purinstinct-games",
  storageBucket:     env.VITE_FB_STORAGE_BUCKET     || "purinstinct-games.firebasestorage.app",
  messagingSenderId: env.VITE_FB_MESSAGING_SENDER_ID || "773541012659",
  appId:             env.VITE_FB_APP_ID             || "1:773541012659:web:6544db54b64a5c859cfcc6",
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export const auth = getAuth(app);

// ── Authentification anonyme ─────────────────────────────────────
// Les règles de sécurité (database.rules.json) exigent auth != null.
// Chaque appareil (mobile joueur, tablette plateau, poste admin) obtient
// une identité anonyme au chargement. Si l'auth anonyme n'est pas encore
// activée dans la console Firebase, on continue quand même (mode transition)
// et on log un avertissement.
let authReadyPromise = null;

export const ensureAuth = () => {
  if (authReadyPromise) return authReadyPromise;
  authReadyPromise = new Promise((resolve) => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) { unsub(); resolve(user); }
    });
    signInAnonymously(auth).catch((err) => {
      console.warn(
        "[PürInstinct] Auth anonyme indisponible (" + err.code + "). " +
        "Active 'Anonymous' dans Firebase > Authentication > Sign-in method. " +
        "L'app continue sans auth (les règles doivent être ouvertes)."
      );
      unsub();
      resolve(null);
    });
  });
  return authReadyPromise;
};

// ── Écritures granulaires ────────────────────────────────────────
// Cœur du correctif anti-collision: au lieu de réécrire des blocs entiers
// (tous les joueurs, toutes les files), chaque action écrit UNIQUEMENT les
// chemins qu'elle modifie, en UNE seule opération atomique multi-chemins.
// Deux responsables de plateau peuvent soumettre des résultats en même
// temps sans jamais s'écraser mutuellement.

// fbUpdate({ "state/players/12": {...}, "state/activeGames/speed": null })
export const fbUpdate = (pathValueMap) => update(ref(db), pathValueMap);

export const fbSetPath = (path, value) => set(ref(db, path), value);

export const fbRef = (path) => ref(db, path);

// ── Allocation atomique d'ID joueur ──────────────────────────────
// Remplace Math.max(ids)+1 (racy: deux inscriptions simultanées obtenaient
// le même numéro). Transaction sur un compteur central; minId permet de
// s'amorcer au-dessus des IDs existants lors de la migration.
export const allocPlayerId = async (minId = 0) => {
  const res = await runTransaction(
    ref(db, "state/meta/lastPlayerId"),
    (cur) => Math.max(Number(cur) || 0, minId) + 1
  );
  return res.snapshot.val();
};

// ── Transaction générique sur un chemin ──────────────────────────
// Utile pour les files d'attente: ajouter/retirer un joueur d'une file
// même si un autre appareil la modifie au même moment.
export const fbTransaction = (path, updateFn) =>
  runTransaction(ref(db, path), updateFn);

// ── Helpers array ↔ objet Firebase ───────────────────────────────
export const toFb = (arr) => {
  if (!arr || arr.length === 0) return {};
  const obj = {};
  arr.forEach((item) => { obj[String(item.id)] = item; });
  return obj;
};

export const fromFb = (obj) => {
  if (!obj) return [];
  return Object.values(obj).sort((a, b) => (a.id || 0) - (b.id || 0));
};

// ── Helpers queues / games ───────────────────────────────────────
export const queuesToFb = (queues) => {
  const obj = {};
  Object.entries(queues).forEach(([zone, ids]) => {
    obj[zone] = ids.length > 0 ? ids : null;
  });
  return obj;
};

export const queuesFromFb = (obj) => {
  const zones = ["purinstinct", "speed", "handAgility", "footAgility", "generalAgility", "iq"];
  const q = {};
  zones.forEach((z) => { q[z] = (obj && obj[z]) ? Object.values(obj[z]) : []; });
  return q;
};

export { set, onValue, off, update, goOnline, goOffline };

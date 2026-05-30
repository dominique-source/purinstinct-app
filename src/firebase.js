import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, onValue, off, update } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyBkXHtdoEfGhRTH-T06XPk3rteni7kiFr8",
  authDomain: "purinstinct-games.firebaseapp.com",
  databaseURL: "https://purinstinct-games-default-rtdb.firebaseio.com",
  projectId: "purinstinct-games",
  storageBucket: "purinstinct-games.firebasestorage.app",
  messagingSenderId: "773541012659",
  appId: "1:773541012659:web:6544db54b64a5c859cfcc6"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);

// ── Helpers array ↔ objet Firebase ──────────────────────────────
export const toFb = (arr) => {
  if (!arr || arr.length === 0) return {};
  const obj = {};
  arr.forEach(item => { obj[String(item.id)] = item; });
  return obj;
};

export const fromFb = (obj) => {
  if (!obj) return [];
  return Object.values(obj).sort((a, b) => (a.id||0) - (b.id||0));
};

// ── Helpers queues / games ────────────────────────────────────────
export const queuesToFb = (queues) => {
  const obj = {};
  Object.entries(queues).forEach(([zone, ids]) => {
    obj[zone] = ids.length > 0 ? ids : null;
  });
  return obj;
};

export const queuesFromFb = (obj) => {
  const zones = ["purinstinct","speed","handAgility","footAgility","generalAgility","iq"];
  const q = {};
  zones.forEach(z => { q[z] = (obj && obj[z]) ? Object.values(obj[z]) : []; });
  return q;
};

// ── Refs ────────────────────────────────────────────────────────
export const fbRef = (path) => ref(db, path);

export { set, onValue, off, update };

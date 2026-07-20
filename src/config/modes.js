import { ADMIN_PIN } from "./pins.js";

// Un seul backend Firebase pour les 5 modes: seuls l'UI, la capture de
// données et les vues montées changent selon le mode actif.
const BASE_MODES = {
  games:{
    entryFlow:"rfid", captureFields:["name","number"], consent:"photo",
    allowPII:true, kioskDefault:false,
    enabledViews:["live","station","admin","player","leaderboard"],
  },
  corporate:{
    entryFlow:"prereg-checkin", captureFields:["name","email","company"], consent:"marketing",
    allowPII:true, kioskDefault:false,
    enabledViews:["checkin","station","player","leaderboard"],
  },
  ecole:{
    entryFlow:"roster-team", captureFields:["firstName","class"], consent:"none",
    allowPII:false, kioskDefault:false,
    enabledViews:["roster","station","leaderboard"],
  },
  festival:{
    entryFlow:"selfserve-qr", captureFields:["firstName","emailOptional"], consent:"marketingOptional",
    allowPII:true, kioskDefault:true,
    enabledViews:["kiosk","station","leaderboard"],
  },
  parc:{
    entryFlow:"kiosk-fixed", captureFields:["firstName"], consent:"none",
    allowPII:true, kioskDefault:true,
    enabledViews:["kiosk","station","leaderboard"],
  },
};

// Mode caché débloqué par ADMIN_PIN: union de toutes les vues, pour les démos.
const ALL_VIEWS=[...new Set(Object.values(BASE_MODES).flatMap(m=>m.enabledViews))];

export const MODES={
  ...BASE_MODES,
  admin:{
    entryFlow:"admin", captureFields:[], consent:"none",
    allowPII:true, kioskDefault:false,
    enabledViews:ALL_VIEWS,
    hidden:true,
  },
};

// Codes d'entrée → clé de mode. Le pavé numérique de ModeSelectView est fixé
// à 4 chiffres (dots + validation à 4 caractères) — les codes de référence
// (00/01/02/03/04) sont donc paddés en 4 chiffres pour ne pas y toucher.
const MODE_CODES={
  games:import.meta.env.VITE_CODE_GAMES||"0000",
  corporate:import.meta.env.VITE_CODE_CORPORATE||"0001",
  ecole:import.meta.env.VITE_CODE_ECOLE||"0002",
  festival:import.meta.env.VITE_CODE_FESTIVAL||"0003",
  parc:import.meta.env.VITE_CODE_PARC||"0004",
};

// Mappe un code saisi → clé de mode ("games","corporate",...) ou "admin"
// si le code correspond au ADMIN_PIN. Retourne null si le code est inconnu.
export function resolveMode(code){
  if(!code) return null;
  if(code===ADMIN_PIN) return "admin";
  const entry=Object.entries(MODE_CODES).find(([,c])=>c===code);
  return entry?entry[0]:null;
}

// Classification utilisée par App.jsx pour router après resolveMode(code) —
// centralisée ici pour qu'un seul test end-to-end (code → route) couvre la
// même logique que le dispatcher réel, sans dupliquer les branches.
//   "live"  → games, flux Live actuel (référence, zéro régression)
//   "admin" → mode caché, tout débloqué (reprend l'ancien TEST MODE)
//   "kiosk" → kioskDefault: bascule direct en KioskView (comme ?kiosk=1)
//   "stub"  → mode valide sans vue dédiée pour l'instant (corporate/ecole)
//   null    → clé de mode inconnue
export function classifyModeRoute(modeKey){
  if(modeKey==="games") return "live";
  if(modeKey==="admin") return "admin";
  if(MODES[modeKey]?.kioskDefault) return "kiosk";
  if(MODES[modeKey]) return "stub";
  return null;
}

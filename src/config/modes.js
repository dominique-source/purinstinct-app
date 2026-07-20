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

// Codes d'entrée → clé de mode. Valeurs de repli en dev = celles de la
// config de référence (00 games / 01 corporate / 02 ecole / 03 festival / 04 parc).
const MODE_CODES={
  games:import.meta.env.VITE_CODE_GAMES||"00",
  corporate:import.meta.env.VITE_CODE_CORPORATE||"01",
  ecole:import.meta.env.VITE_CODE_ECOLE||"02",
  festival:import.meta.env.VITE_CODE_FESTIVAL||"03",
  parc:import.meta.env.VITE_CODE_PARC||"04",
};

// Mappe un code saisi → clé de mode ("games","corporate",...) ou "admin"
// si le code correspond au ADMIN_PIN. Retourne null si le code est inconnu.
export function resolveMode(code){
  if(!code) return null;
  if(code===ADMIN_PIN) return "admin";
  const entry=Object.entries(MODE_CODES).find(([,c])=>c===code);
  return entry?entry[0]:null;
}

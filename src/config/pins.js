export const ADMIN_PIN=import.meta.env.VITE_ADMIN_PIN||"1111";

export const STATION_PIN=import.meta.env.VITE_STATION_PIN||"2222";

// sessionStorage (pas localStorage): le déverrouillage du QR responsable de
// plateau (StationHubPinView) doit tenir tant que l'onglet/navigateur reste
// ouvert, mais jamais survivre à sa fermeture — un téléphone partagé entre
// équipes ne doit pas rester déverrouillé indéfiniment.
export const STATION_HUB_UNLOCKED_KEY="pi_stationHub_unlocked";

// Raccourci local (jamais synced à Firebase) qui ouvre le Mode Développeur —
// aperçu de chaque mode/rôle sans toucher liveMode/activationMode partagés.
export const DEV_PIN=import.meta.env.VITE_DEV_PIN||"9999";

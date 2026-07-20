import { MODES } from "../config/modes.js";

// Champs considérés comme des renseignements personnels (PII) au sens du
// verrou allowPII — courriel et coordonnées de contact.
export const PII_FIELDS = ["email", "instagram", "tiktok", "snapchat"];

// Verrou dur: si le mode interdit les PII (allowPII=false, ex. ecole),
// aucune donnée de contact ne doit pouvoir être écrite pour ce mode —
// quelle que soit la vue qui a produit ces données. Lève une erreur plutôt
// que de filtrer silencieusement, pour que toute violation soit détectable.
export function assertAllowedCapture(modeKey, data) {
  const cfg = MODES[modeKey];
  if (!cfg || cfg.allowPII) return;
  const offending = PII_FIELDS.filter((field) => data?.[field]);
  if (offending.length > 0) {
    throw new Error(
      `Mode "${modeKey}" interdit les données personnelles: ${offending.join(", ")}`,
    );
  }
}

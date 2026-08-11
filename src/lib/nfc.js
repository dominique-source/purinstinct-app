// Bracelets NFC: la puce ne porte jamais l'id Firebase du joueur, seulement un
// token opaque aléatoire — évite qu'un bracelet perdu ne révèle un id
// exploitable. state/nfcTags fait le pont token -> playerId côté serveur.
// Fonctions pures, mêmes conventions que smallGroup.js/teamMatch.js — testées
// indépendamment de Firebase/React. baseUrl/expectedOrigin sont passés
// explicitement par l'appelant (BASE_URL, config/constants.js) plutôt
// qu'importés ici: constants.js lit window.location au chargement du module,
// ce qui casserait ces tests (environnement Node, sans window/jsdom).

export const TOKEN_RE = /^[0-9a-f]{32}$/;

export function generateNfcToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function buildNfcUrl(token, baseUrl) {
  return `${baseUrl}/?nfc=${token}`;
}

// Accepte soit une URL complète (lue sur le tag), soit directement
// window.location.href. Rejette tout token dont l'origine ne correspond pas
// à expectedOrigin (tag écrit pour un autre déploiement / falsifié) et tout
// format non conforme à TOKEN_RE.
export function parseNfcToken(urlOrString, expectedOrigin) {
  let parsed;
  try {
    parsed = new URL(urlOrString);
  } catch {
    return null;
  }
  if (parsed.origin !== expectedOrigin) return null;
  const token = parsed.searchParams.get("nfc");
  if (!token || !TOKEN_RE.test(token)) return null;
  return token;
}

// nfcTags: état Firebase state/nfcTags tel que synchronisé dans App.jsx.
export function resolvePlayerId(token, nfcTags) {
  const entry = nfcTags?.[token];
  if (!entry || entry.active !== true) return null;
  return entry.playerId;
}

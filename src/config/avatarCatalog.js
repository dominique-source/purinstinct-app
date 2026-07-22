// Catalogue des avatars joueur — un ensemble de "looks" pré-rendus (photos)
// par combinaison âge × genre. Tant qu'un combo n'a pas encore de photos,
// PlayerStatsTab retombe automatiquement sur l'avatar SVG existant
// (PlayerAvatar.jsx) avec les réglages Peau/Cheveux/Corps — voir
// getAvatarLooks() ci-dessous. Ajouter une nouvelle photo = ajouter un
// fichier dans public/avatars/<key>/ et incrémenter le count ici, rien
// d'autre à toucher.

const BASE = import.meta.env.BASE_URL;

function buildLooks(key, count) {
  return Array.from({ length: count }, (_, i) => {
    const n = String(i + 1).padStart(2, "0");
    return {
      id: `${key}-${n}`,
      label: "Look " + (i + 1),
      portraitSrc: `${BASE}avatars/${key}/${key}-${n}-portrait.webp`,
      fullBodySrc: `${BASE}avatars/${key}/${key}-${n}-full.webp`,
    };
  });
}

export const AGE_CATEGORIES = [
  { key: "enfant", label: "Enfant", ageRange: "8-12 ans" },
  { key: "ado", label: "Ado", ageRange: "13-17 ans" },
  { key: "adulte", label: "Adulte", ageRange: "18 ans et +" },
];

// { [ageCategoryKey]: { male: AvatarLook[], female: AvatarLook[] } }
// Tableaux vides = pas encore de photos pour ce combo (repli SVG).
const AVATAR_CATALOG = {
  enfant: { male: [], female: [] },
  ado: { male: [], female: [] },
  adulte: { male: buildLooks("adult-male", 10), female: buildLooks("adult-female", 10) },
};

export function getAvatarLooks(ageCategoryKey, gender) {
  const g = gender === "F" ? "female" : "male";
  return AVATAR_CATALOG[ageCategoryKey]?.[g] || [];
}

// Seul fichier du projet qui touche window.NDEFReader (Web NFC — Android
// Chrome uniquement, aucun polyfill). Détection de capacité systématique,
// jamais d'appel direct à NDEFReader ailleurs dans le code.

export function isWebNfcSupported() {
  return typeof window !== "undefined" && "NDEFReader" in window;
}

// Lecture continue (identification borne): ne verrouille jamais le tag,
// n'écrit rien. onRead(url) est appelé à chaque lecture d'un enregistrement
// URL. Retourne stop() pour interrompre le scan (changement d'étape,
// démontage du composant).
export function scanNfc({ onRead, onError }) {
  if (!isWebNfcSupported()) {
    onError?.(new Error("web-nfc-unsupported"));
    return () => {};
  }
  const reader = new window.NDEFReader();
  const controller = new AbortController();
  reader.addEventListener("reading", (event) => {
    for (const record of event.message.records) {
      if (record.recordType === "url" || record.recordType === "absolute-url") {
        const url = new TextDecoder(record.encoding || "utf-8").decode(record.data);
        onRead?.(url);
        return;
      }
    }
  });
  reader.addEventListener("readingerror", () => {
    onError?.(new Error("web-nfc-reading-error"));
  });
  reader.scan({ signal: controller.signal }).catch((err) => onError?.(err));
  return () => controller.abort();
}

// Écriture (flux d'assignation admin): écrase le tag avec l'URL fournie.
// N'expose jamais l'exception brute au caller — la ramène à un message
// stable (NotAllowedError = refus/permission, NotSupportedError = tag
// incompatible, AbortError = annulation/timeout).
export async function writeNfcUrl(url) {
  if (!isWebNfcSupported()) {
    return { ok: false, error: "unsupported" };
  }
  try {
    const writer = new window.NDEFReader();
    await writer.write({ records: [{ recordType: "url", data: url }] });
    return { ok: true };
  } catch (err) {
    if (err?.name === "NotAllowedError") return { ok: false, error: "not-allowed" };
    if (err?.name === "NotSupportedError") return { ok: false, error: "not-supported" };
    if (err?.name === "AbortError") return { ok: false, error: "aborted" };
    return { ok: false, error: "unknown" };
  }
}

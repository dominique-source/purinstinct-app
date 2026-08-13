// Seul fichier du projet qui touche window.NDEFReader (Web NFC — Android
// Chrome uniquement, aucun polyfill). Détection de capacité systématique,
// jamais d'appel direct à NDEFReader ailleurs dans le code.

export function isWebNfcSupported() {
  return typeof window !== "undefined" && "NDEFReader" in window;
}

// Lecture continue (identification borne): ne verrouille jamais le tag,
// n'écrit rien. onRead(url) est appelé à chaque lecture d'un enregistrement
// URL, onBlank() quand le tag lu ne porte aucun enregistrement URL exploitable
// (bracelet jamais écrit — l'événement "reading" arrive quand même, avec un
// message NDEF vide ou sans record de type url/absolute-url). Retourne stop()
// pour interrompre le scan (changement d'étape, démontage du composant).
// onStarted() confirme que reader.scan() a bien démarré (permission accordée,
// dispatch NFC actif) — distinct de onError, pour diagnostiquer le cas où le
// scan démarre sans erreur mais ne reçoit jamais aucun événement "reading".
// onRawEvent({recordCount,types,serial}) est appelé en premier à CHAQUE
// événement "reading", avant tout parsing — sert à vérifier que l'événement
// arrive vraiment côté page, même si le contenu ne matche aucun cas connu.
export function scanNfc({ onRead, onBlank, onError, onStarted, onRawEvent }) {
  if (!isWebNfcSupported()) {
    onError?.(new Error("web-nfc-unsupported"));
    return () => {};
  }
  const reader = new window.NDEFReader();
  const controller = new AbortController();
  reader.addEventListener("reading", (event) => {
    let decodedPreview = null;
    try {
      const first = event.message.records[0];
      if (first) decodedPreview = new TextDecoder(first.encoding || "utf-8").decode(first.data);
    } catch { /* diagnostic best-effort only */ }
    onRawEvent?.({
      recordCount: event.message.records.length,
      types: event.message.records.map((r) => r.recordType),
      serial: event.serialNumber || null,
      decodedPreview,
    });
    for (const record of event.message.records) {
      if (record.recordType === "url" || record.recordType === "absolute-url") {
        const url = new TextDecoder(record.encoding || "utf-8").decode(record.data);
        onRead?.(url);
        return;
      }
    }
    onBlank?.();
  });
  reader.addEventListener("readingerror", () => {
    onError?.(new Error("web-nfc-reading-error"));
  });
  reader.scan({ signal: controller.signal }).then(() => onStarted?.()).catch((err) => onError?.(err));
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

import { useState } from "react";
import { useT } from "../../hooks/useLang.js";
import { Modal } from "../ui/Modal.jsx";
import { Button } from "../ui/Button.jsx";
import { generateNfcToken, buildNfcUrl } from "../../lib/nfc.js";
import { isWebNfcSupported, writeNfcUrl } from "../../lib/webNfc.js";

// Flux admin d'assignation d'un bracelet: confirm-replace (si le joueur en a
// déjà un) -> approach (écriture NDEF) -> success/error. N'écrit dans Firebase
// qu'après succès de l'écriture physique — onAssigned(token) délègue cette
// écriture au caller (assignNfcTag dans App.jsx), ce composant ne touche
// jamais Firebase directement.
export function AssignWristbandFlow({ player, baseUrl, onAssigned, onCancel }) {
  const t = useT();
  const hasExisting = !!player.nfcToken;
  const [step, setStep] = useState(hasExisting ? "confirm" : "approach");
  const [token] = useState(() => generateNfcToken());

  const startWrite = async () => {
    setStep("writing");
    const result = await writeNfcUrl(buildNfcUrl(token, baseUrl));
    if (result.ok) {
      onAssigned(token);
      setStep("success");
    } else {
      setStep("error");
    }
  };

  return (
    <Modal open onClose={onCancel} labelledBy="pi-nfc-assign-title">
      {step === "confirm" && (
        <>
          <h2 id="pi-nfc-assign-title" style={{ fontFamily: "var(--pi-font-display)", fontWeight: 900,
            fontStyle: "italic", fontSize: "var(--pi-fs-section)", color: "var(--pi-text)", marginBottom: "var(--pi-s2)" }}>
            {t.nfcConfirmReplaceTitle}
          </h2>
          <p style={{ color: "var(--pi-text-2)", fontSize: "var(--pi-fs-body)", marginBottom: "var(--pi-s6)" }}>
            {t.nfcConfirmReplaceDesc}
          </p>
          <div style={{ display: "flex", gap: "var(--pi-s2)" }}>
            <Button variant="secondary" block onClick={onCancel}>{t.nfcCancelBtn}</Button>
            <Button variant="primary" block onClick={() => setStep("approach")}>{t.nfcConfirmReplaceBtn}</Button>
          </div>
        </>
      )}

      {step === "approach" && (
        <>
          <h2 id="pi-nfc-assign-title" style={{ fontFamily: "var(--pi-font-display)", fontWeight: 900,
            fontStyle: "italic", fontSize: "var(--pi-fs-section)", color: "var(--pi-text)", marginBottom: "var(--pi-s2)" }}>
            {t.nfcApproachTitle}
          </h2>
          {isWebNfcSupported() ? (
            <>
              <p style={{ color: "var(--pi-text-2)", fontSize: "var(--pi-fs-body)", marginBottom: "var(--pi-s6)" }}>
                {t.nfcApproachDesc}
              </p>
              <div style={{ display: "flex", gap: "var(--pi-s2)" }}>
                <Button variant="secondary" block onClick={onCancel}>{t.nfcCancelBtn}</Button>
                <Button variant="primary" block onClick={startWrite}>{t.nfcApproachTitle}</Button>
              </div>
            </>
          ) : (
            <>
              <p style={{ color: "var(--pi-text-2)", fontSize: "var(--pi-fs-body)", marginBottom: "var(--pi-s6)" }}>
                {t.nfcUnsupportedBrowser}
              </p>
              <Button variant="secondary" block onClick={onCancel}>{t.nfcCancelBtn}</Button>
            </>
          )}
        </>
      )}

      {step === "writing" && (
        <p style={{ color: "var(--pi-text-2)", fontSize: "var(--pi-fs-body)", textAlign: "center", padding: "var(--pi-s6) 0" }}>
          {t.nfcWriting}
        </p>
      )}

      {step === "success" && (
        <>
          <p style={{ color: "var(--pi-lime)", fontSize: "var(--pi-fs-section)", fontWeight: 700, marginBottom: "var(--pi-s6)" }}>
            {t.nfcAssignSuccess}
          </p>
          <Button variant="primary" block onClick={onCancel}>{t.nfcCancelBtn}</Button>
        </>
      )}

      {step === "error" && (
        <>
          <p style={{ color: "#ef4444", fontSize: "var(--pi-fs-body)", marginBottom: "var(--pi-s6)" }}>
            {t.nfcAssignError}
          </p>
          <div style={{ display: "flex", gap: "var(--pi-s2)" }}>
            <Button variant="secondary" block onClick={onCancel}>{t.nfcCancelBtn}</Button>
            <Button variant="primary" block onClick={() => setStep("approach")}>{t.nfcApproachTitle}</Button>
          </div>
        </>
      )}
    </Modal>
  );
}

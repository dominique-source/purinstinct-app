import { useState } from "react";
import { FONTS } from "../../config/fonts.js";
import { useT } from "../../hooks/useLang.js";
import { ClaimCodeKeypad } from "../shared/ClaimCodeKeypad.jsx";
import braceletLime from "../../assets/bracelet-lime.png";

// Vue publique/anonyme affichée quand ?nfc=TOKEN ne résout à aucun profil actif
// (bracelet pas encore lié à personne). Deux chemins depuis l'accroche, tous
// deux sans recherche par nom: (1) "Nouveau ? Inscris-toi" — formulaire
// nom/email/cell, active le bracelet tout de suite; (2) "J'ai un code" — la
// personne a été pré-inscrite par un responsable (nom/coordonnées déjà
// saisis à l'avance, code reçu par texto/courriel) et confirme avant
// activation, sans tout retaper. Pas de recherche-par-nom en libre-service:
// ça permettrait à quelqu'un de lier un bracelet au profil d'une AUTRE
// personne par erreur (ou en cliquant vite sans lire) — le code/l'inscription
// garantissent que le bon profil est visé.

export function NfcUnassignedView({ onBack, onConnect, onRegister, onFindByCode }) {
  const t = useT();
  const [step, setStep] = useState("landing"); // landing | register | code | confirm | success
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [registering, setRegistering] = useState(false);
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState(false);
  const [codeMode, setCodeMode] = useState("digits"); // digits | letters
  const [foundPlayer, setFoundPlayer] = useState(null);
  const [registeredId, setRegisteredId] = useState(null);
  const [emailStatus, setEmailStatus] = useState(null); // null | sending | sent | failed

  const handleRegister = () => {
    if (!name.trim() || registering) return;
    setRegistering(true);
    // Pas d'email fourni: aucun statut à montrer, on continue directement
    // vers le profil (pas de friction ajoutée). Avec un email: écran de
    // confirmation "courriel envoyé" avant de continuer, même sécurité que
    // le code visible à l'écran si l'envoi échoue.
    onRegister(name.trim(), email.trim(), phone.trim(), (newId, emailPromise) => {
      setRegistering(false);
      if (!emailPromise) { onConnect(newId); return; }
      setRegisteredId(newId);
      setEmailStatus("sending");
      emailPromise.then((ok) => setEmailStatus(ok ? "sent" : "failed"));
      setStep("success");
    });
  };

  const handleCodeComplete = (value) => {
    const player = onFindByCode(value);
    if (player) {
      setFoundPlayer(player);
      setCodeError(false);
      setStep("confirm");
    } else {
      setCodeError(true);
      setCode("");
    }
  };

  const wrap = (children) => (
    <div style={{ minHeight: "100svh", background: "#0A0A0A", fontFamily: "'DM Sans',sans-serif",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: 24, textAlign: "center" }}>
      <style>{FONTS}</style>
      {children}
    </div>
  );

  if (step === "register") {
    return wrap(
      <div style={{ width: "100%", maxWidth: 360, textAlign: "left" }}>
        <button onClick={() => setStep("landing")} style={{ marginBottom: 20, padding: "8px 14px", borderRadius: 10,
          background: "#111827", border: "1px solid #B8E02040", color: "#B8E020", cursor: "pointer",
          fontSize: 13, fontWeight: 700 }}>
          {t.back}
        </button>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>👋</div>
          <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontStyle: "italic",
            fontSize: 22, color: "#fff" }}>{t.nfcRegisterTitle}</div>
          <div style={{ fontSize: 13, color: "#9ca3af", marginTop: 6 }}>{t.nfcRegisterDesc}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 }}>{t.fullName}</div>
            <input value={name} onChange={e => setName(e.target.value)} autoFocus
              placeholder={t.nfcNamePlaceholder}
              style={{ width: "100%", padding: "14px 16px", borderRadius: 12, border: "1px solid #1f2937",
                background: "#0d0f1a", color: "#fff", fontSize: 15, outline: "none", boxSizing: "border-box" }}/>
          </div>
          <div>
            <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 }}>{t.nfcEmailOptional}</div>
            <input value={email} onChange={e => setEmail(e.target.value)} type="email"
              placeholder="email@exemple.com"
              style={{ width: "100%", padding: "14px 16px", borderRadius: 12, border: "1px solid #1f2937",
                background: "#0d0f1a", color: "#fff", fontSize: 15, outline: "none", boxSizing: "border-box" }}/>
          </div>
          <div>
            <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 }}>{t.nfcPhoneOptional}</div>
            <input value={phone} onChange={e => setPhone(e.target.value)} type="tel"
              placeholder="418 555-1234"
              style={{ width: "100%", padding: "14px 16px", borderRadius: 12, border: "1px solid #1f2937",
                background: "#0d0f1a", color: "#fff", fontSize: 15, outline: "none", boxSizing: "border-box" }}/>
          </div>
          <button onClick={handleRegister} disabled={!name.trim() || registering} style={{
            marginTop: 8, padding: "16px", borderRadius: 14, border: "none",
            cursor: name.trim() ? "pointer" : "default",
            fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 17,
            background: name.trim() ? "#B8E020" : "#1f2937", color: name.trim() ? "#000" : "#4b5563" }}>
            {registering ? t.nfcWriting : t.nfcConnectCta}
          </button>
        </div>
      </div>
    );
  }

  if (step === "success") {
    return wrap(
      <div style={{ width: "100%", maxWidth: 340 }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>✓</div>
        <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontStyle: "italic",
          fontSize: 22, color: "#fff", marginBottom: 16 }}>{t.nfcConnectDoneTitle}</div>
        {emailStatus && (
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 24,
            color: emailStatus === "sent" ? "#22c55e" : emailStatus === "failed" ? "#f59e0b" : "#9ca3af" }}>
            {emailStatus === "sending" && t.nfcEmailSending}
            {emailStatus === "sent" && t.nfcEmailSent.replace("{email}", email.trim())}
            {emailStatus === "failed" && t.nfcEmailFailed}
          </div>
        )}
        <button onClick={() => onConnect(registeredId)} style={{
          width: "100%", padding: "16px", borderRadius: 14, border: "none", cursor: "pointer",
          fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 17,
          background: "#B8E020", color: "#000" }}>
          {t.nfcConnectContinueBtn}
        </button>
      </div>
    );
  }

  if (step === "code") {
    return wrap(
      <div style={{ width: "100%", maxWidth: 340 }}>
        <button onClick={() => { setStep("landing"); setCode(""); setCodeError(false); }} style={{ marginBottom: 20, padding: "8px 14px", borderRadius: 10,
          background: "#111827", border: "1px solid #B8E02040", color: "#B8E020", cursor: "pointer",
          fontSize: 13, fontWeight: 700 }}>
          {t.back}
        </button>
        <div style={{ fontSize: 32, marginBottom: 8 }}>🔑</div>
        <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontStyle: "italic",
          fontSize: 22, color: "#fff", marginBottom: 6 }}>{t.nfcCodeTitle}</div>
        <div style={{ fontSize: 13, color: "#9ca3af", marginBottom: 24 }}>{t.nfcCodeDesc}</div>
        {codeError && <div style={{ color: "#ef4444", fontSize: 13, marginBottom: 16 }}>{t.nfcCodeError}</div>}
        <ClaimCodeKeypad code={code} mode={codeMode}
          onCodeChange={(v) => { setCode(v); setCodeError(false); }}
          onModeChange={setCodeMode}
          onComplete={handleCodeComplete}/>
      </div>
    );
  }

  if (step === "confirm" && foundPlayer) {
    return wrap(
      <div style={{ width: "100%", maxWidth: 340 }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>✋</div>
        <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontStyle: "italic",
          fontSize: 22, color: "#fff", marginBottom: 4 }}>{t.nfcConfirmTitle}</div>
        <div style={{ fontSize: 13, color: "#9ca3af", marginBottom: 20 }}>{t.nfcConfirmDesc}</div>
        <div style={{ background: "#0d0f1a", border: "1px solid #1f2937", borderRadius: 14, padding: 18, marginBottom: 20, textAlign: "left" }}>
          <div style={{ color: "#fff", fontWeight: 700, fontSize: 17, marginBottom: 6 }}>{foundPlayer.name}</div>
          {foundPlayer.email && <div style={{ color: "#9ca3af", fontSize: 13 }}>📧 {foundPlayer.email}</div>}
          {foundPlayer.phone && <div style={{ color: "#9ca3af", fontSize: 13, marginTop: 2 }}>📱 {foundPlayer.phone}</div>}
        </div>
        <button onClick={() => onConnect(foundPlayer.id)} style={{
          width: "100%", padding: "16px", borderRadius: 14, border: "none", cursor: "pointer",
          fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 17,
          background: "#B8E020", color: "#000", marginBottom: 10 }}>
          {t.nfcConfirmBtn}
        </button>
        <button onClick={() => { setStep("code"); setCode(""); setFoundPlayer(null); }} style={{
          padding: "10px", borderRadius: 10, border: "none", background: "none",
          color: "#6b7280", cursor: "pointer", fontSize: 13 }}>
          {t.stationCancelBackToSearch}
        </button>
      </div>
    );
  }

  return wrap(
    <>
      <img src={braceletLime} alt="" style={{ width: "100%", maxWidth: 300, borderRadius: 20,
        marginBottom: 24, border: "2px solid #B8E02050", boxShadow: "0 4px 24px #B8E02020" }}/>
      <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontStyle: "italic",
        fontSize: 24, color: "#fff", marginBottom: 10 }}>{t.nfcUnassignedTitle}</div>
      <div style={{ fontSize: 14, color: "#9ca3af", maxWidth: 320, marginBottom: 28 }}>{t.nfcUnassignedDesc}</div>
      <button onClick={() => setStep("register")} style={{
        width: "100%", maxWidth: 320, padding: "16px 32px", borderRadius: 14, border: "none", cursor: "pointer",
        fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 17,
        background: "#B8E020", color: "#000", marginBottom: 10 }}>
        {t.nfcConnectCta}
      </button>
      <button onClick={() => setStep("code")} style={{
        width: "100%", maxWidth: 320, padding: "14px 32px", borderRadius: 14, cursor: "pointer",
        fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 15,
        background: "transparent", border: "1px solid #B8E02060", color: "#B8E020", marginBottom: 20 }}>
        {t.nfcHaveCodeCta}
      </button>
      <button onClick={onBack} style={{ marginTop: 14, padding: "10px", borderRadius: 10, border: "none",
        background: "none", color: "#6b7280", cursor: "pointer", fontSize: 13 }}>
        {t.nfcUnassignedBackBtn}
      </button>
    </>
  );
}

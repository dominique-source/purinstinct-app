import { useState } from "react";
import { FONTS } from "../../config/fonts.js";
import { useT } from "../../hooks/useLang.js";
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
// Lettres autorisées dans le code de réclamation — 10 lettres choisies pour
// éviter toute ambiguïté visuelle sur un cadran (pas de I/O confondus avec 1/0).
const CODE_LETTERS = ["A","B","C","D","E","F","G","H","L","M"];

export function NfcUnassignedView({ onBack, onConnect, onRegister, onFindByCode }) {
  const t = useT();
  const [step, setStep] = useState("landing"); // landing | register | code | confirm
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [registering, setRegistering] = useState(false);
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState(false);
  const [codeMode, setCodeMode] = useState("digits"); // digits | letters
  const [foundPlayer, setFoundPlayer] = useState(null);

  const handleRegister = () => {
    if (!name.trim() || registering) return;
    setRegistering(true);
    onRegister(name.trim(), email.trim(), phone.trim(), (newId) => onConnect(newId));
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

  if (step === "code") {
    const digitKeys = [1,2,3,4,5,6,7,8,9,"",0,"⌫"];
    const letterKeys = [...CODE_LETTERS.slice(0,9),"",CODE_LETTERS[9],"⌫"];
    const keys = codeMode === "digits" ? digitKeys : letterKeys;
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
        <div style={{ display: "flex", justifyContent: "center", gap: 12, marginBottom: 24 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{ width: 16, height: 16, borderRadius: "50%",
              background: i < code.length ? "#B8E020" : "#1f2937",
              border: `2px solid ${i < code.length ? "#B8E020" : "#374151"}` }}/>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, maxWidth: 260, margin: "0 auto" }}>
          {keys.map((k, i) => (
            <button key={codeMode+i} onClick={() => {
              if (k === "") return;
              if (k === "⌫") { setCode(code.slice(0, -1)); return; }
              if (code.length < 4) {
                const nv = code + k; setCode(nv); setCodeError(false);
                if (nv.length === 4) setTimeout(() => handleCodeComplete(nv), 150);
              }
            }} style={{ padding: 18, borderRadius: 14, border: "1px solid #1f2937",
              background: k === "" ? "transparent" : "#0d0f1a", color: "#fff",
              fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 20,
              cursor: k === "" ? "default" : "pointer", opacity: k === "" ? 0 : 1 }}>
              {k}
            </button>
          ))}
        </div>
        <button onClick={() => setCodeMode(m => m === "digits" ? "letters" : "digits")} style={{
          marginTop: 16, padding: "10px 20px", borderRadius: 12, border: "1px solid #B8E02060",
          background: "transparent", color: "#B8E020", cursor: "pointer",
          fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 14 }}>
          {codeMode === "digits" ? t.nfcCodeSwitchToLetters : t.nfcCodeSwitchToDigits}
        </button>
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

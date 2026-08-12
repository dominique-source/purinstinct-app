import { useState } from "react";
import { FONTS } from "../../config/fonts.js";
import { useT } from "../../hooks/useLang.js";
import braceletLime from "../../assets/bracelet-lime.png";

// Vue publique/anonyme affichée quand ?nfc=TOKEN ne résout à aucun profil actif
// (bracelet vierge ou désactivé). Flux en 2 temps: écran d'accroche "Connecter
// mon bracelet" -> liste de noms (roster de la session active) -> tap sur un
// nom lie le bracelet à ce joueur (onConnect) et ouvre directement son profil.
// Aucune action admin ici — cohérent avec le reste de l'app où tout appareil
// anonyme peut déjà écrire son propre statut (voir NFC-WRISTBANDS §6/§9).
export function NfcUnassignedView({ players, onBack, onConnect }) {
  const t = useT();
  const [step, setStep] = useState("landing"); // landing | select
  const [search, setSearch] = useState("");

  const filtered = search.trim().length > 0
    ? players.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || String(p.number).includes(search))
    : players;

  if (step === "select") {
    return (
      <div style={{ minHeight: "100vh", background: "#0A0A0A", fontFamily: "'DM Sans',sans-serif",
        display: "flex", flexDirection: "column", padding: 24 }}>
        <style>{FONTS}</style>
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontStyle: "italic",
            fontSize: 22, color: "#fff", marginBottom: 6 }}>{t.nfcSelectNameTitle}</div>
          <div style={{ fontSize: 13, color: "#9ca3af" }}>{t.nfcSelectNameDesc}</div>
        </div>

        <input value={search} onChange={e => setSearch(e.target.value)} autoFocus
          placeholder={t.nfcSelectNameSearchPlaceholder}
          style={{ width: "100%", padding: "14px 16px", borderRadius: 12, border: "1px solid #1f2937",
            background: "#0d0f1a", color: "#fff", fontSize: 16, outline: "none", marginBottom: 14,
            boxSizing: "border-box" }}/>

        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.length === 0 && (
            <div style={{ textAlign: "center", color: "#4b5563", fontSize: 13, marginTop: 20 }}>{t.nfcSelectNameEmpty}</div>
          )}
          {filtered.map(p => (
            <button key={p.id} onClick={() => onConnect(p.id)} style={{
              display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderRadius: 12,
              border: "1px solid #1f2937", background: "#0d0f1a", cursor: "pointer", textAlign: "left" }}>
              <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontStyle: "italic",
                fontSize: 18, color: "#B8E020", width: 32, flexShrink: 0, textAlign: "center" }}>#{p.number}</span>
              <span style={{ flex: 1, color: "#fff", fontWeight: 600, fontSize: 15 }}>{p.name}</span>
              <span style={{ color: "#4b5563", fontSize: 18 }}>›</span>
            </button>
          ))}
        </div>

        <button onClick={onBack} style={{ marginTop: 14, padding: "10px", borderRadius: 10, border: "none",
          background: "none", color: "#6b7280", cursor: "pointer", fontSize: 13 }}>
          {t.nfcUnassignedBackBtn}
        </button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0A0A0A", fontFamily: "'DM Sans',sans-serif",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: 24, textAlign: "center" }}>
      <style>{FONTS}</style>
      <img src={braceletLime} alt="" style={{ width: "100%", maxWidth: 340, borderRadius: 20,
        marginBottom: 24, border: "2px solid #B8E02050", boxShadow: "0 4px 24px #B8E02020" }}/>
      <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontStyle: "italic",
        fontSize: 24, color: "#fff", marginBottom: 10 }}>{t.nfcUnassignedTitle}</div>
      <div style={{ fontSize: 14, color: "#9ca3af", maxWidth: 320, marginBottom: 28 }}>{t.nfcUnassignedDesc}</div>
      <button onClick={() => setStep("select")} style={{
        padding: "16px 32px", borderRadius: 14, border: "none", cursor: "pointer",
        fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 17,
        background: "#B8E020", color: "#000" }}>
        {t.nfcConnectCta}
      </button>
      <button onClick={onBack} style={{ marginTop: 14, padding: "10px", borderRadius: 10, border: "none",
        background: "none", color: "#6b7280", cursor: "pointer", fontSize: 13 }}>
        {t.nfcUnassignedBackBtn}
      </button>
    </div>
  );
}

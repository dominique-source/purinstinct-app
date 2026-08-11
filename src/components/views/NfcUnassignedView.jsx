import { FONTS } from "../../config/fonts.js";
import { useT } from "../../hooks/useLang.js";

// Vue publique/anonyme affichée quand ?nfc=TOKEN ne résout à aucun profil actif
// (bracelet vierge, désactivé, ou falsifié) — aucune action admin exposée ici.
export function NfcUnassignedView({ onBack }) {
  const t = useT();
  return (
    <div style={{ minHeight: "100vh", background: "#0A0A0A", fontFamily: "'DM Sans',sans-serif",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: 24, textAlign: "center" }}>
      <style>{FONTS}</style>
      <div style={{ fontSize: 48, marginBottom: 16 }}>📶</div>
      <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontStyle: "italic",
        fontSize: 24, color: "#fff", marginBottom: 10 }}>{t.nfcUnassignedTitle}</div>
      <div style={{ fontSize: 14, color: "#9ca3af", maxWidth: 320, marginBottom: 28 }}>{t.nfcUnassignedDesc}</div>
      <button onClick={onBack} style={{
        padding: "12px 24px", borderRadius: 12, border: "none", cursor: "pointer",
        fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 15,
        background: "#B8E020", color: "#000" }}>
        {t.nfcUnassignedBackBtn}
      </button>
    </div>
  );
}

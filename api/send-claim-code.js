// Fonction serverless Vercel (Node) — jamais bundlée côté client, seul
// endroit où RESEND_API_KEY existe. Le contenu de l'email est construit
// ici, jamais fourni par l'appelant: le endpoint n'accepte que
// {name,email,code} et refuse tout ce qui ressemble à un relais email
// générique (sujet/corps arbitraires). x-internal-key est une friction
// minimale, pas une vraie barrière de sécurité (la valeur est dans le
// bundle client) — suffisant pour un outil admin interne à faible enjeu.
const escapeHtml = (s) =>
  String(s || "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const expected = process.env.INTERNAL_API_SECRET;
  if (expected && req.headers["x-internal-key"] !== expected) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { name, email, code } = req.body || {};
  if (!email || !code) {
    res.status(400).json({ error: "Missing email or code" });
    return;
  }

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    res.status(500).json({ error: "Email service not configured" });
    return;
  }
  const from = process.env.RESEND_FROM || "PurInstinct Games <onboarding@resend.dev>";

  const safeName = escapeHtml(name);
  const safeCode = escapeHtml(code);
  const html = `
    <div style="font-family:sans-serif;max-width:420px;margin:0 auto;padding:24px;background:#0A0A0A;color:#fff;">
      <p>Salut ${safeName || ""},</p>
      <p>Voici ton code pour activer ton bracelet PürInstinct Games :</p>
      <p style="font-size:36px;font-weight:900;letter-spacing:8px;color:#B8E020;margin:20px 0;">${safeCode}</p>
      <p>Entre-le à l'écran <strong>« 🔑 J'ai un code »</strong> quand tu approches ton bracelet du kiosque.</p>
    </div>`;

  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [email],
        subject: "Ton code PürInstinct Games",
        html,
      }),
    });
    if (!r.ok) {
      const detail = await r.text();
      res.status(502).json({ error: "send failed", detail });
      return;
    }
    res.status(200).json({ ok: true });
  } catch (err) {
    res.status(502).json({ error: String(err) });
  }
}

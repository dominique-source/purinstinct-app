// Appelle l'API serverless /api/send-claim-code (Vercel) qui parle à
// Resend — jamais de clé Resend côté client. x-internal-key est une
// friction minimale (voir api/send-claim-code.js), pas un vrai secret.
export async function sendClaimCodeEmail(name, email, code) {
  try {
    const res = await fetch("/api/send-claim-code", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(import.meta.env.VITE_INTERNAL_API_SECRET
          ? { "x-internal-key": import.meta.env.VITE_INTERNAL_API_SECRET }
          : {}),
      },
      body: JSON.stringify({ name, email, code }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

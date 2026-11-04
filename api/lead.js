// Vercel Serverless Function: validates the lead and forwards it to the n8n webhook.
// Keeps the webhook URL out of the browser and sidesteps CORS.
// Required env var: N8N_WEBHOOK_URL

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const E164 = /^\+[1-9]\d{7,14}$/;
const clip = (v, n) => String(v ?? "").trim().slice(0, n);

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const url = process.env.N8N_WEBHOOK_URL;
  if (!url) return res.status(500).json({ ok: false, error: "Webhook not configured" });

  const b = typeof req.body === "string" ? safeParse(req.body) : req.body || {};
  const lead = {
    full_name: clip(b.full_name, 120),
    email: clip(b.email, 200),
    phone: clip(b.phone, 20).replace(/[\s\-().]/g, ""),
    service: clip(b.service, 80),
    budget: clip(b.budget, 40),
    message: clip(b.message, 1500),
    source: "demo_landing_page",
    submitted_at: isIso(b.submitted_at) ? b.submitted_at : new Date().toISOString()
  };

  if (lead.full_name.length < 2 || !EMAIL.test(lead.email) || !E164.test(lead.phone) || !lead.service) {
    return res.status(400).json({ ok: false, error: "Invalid input" });
  }

  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(lead),
      signal: AbortSignal.timeout(10000)
    });
    if (!r.ok) return res.status(502).json({ ok: false, error: "Automation unavailable" });
    return res.status(200).json({ ok: true });
  } catch {
    return res.status(502).json({ ok: false, error: "Automation unreachable" });
  }
};

function safeParse(s) { try { return JSON.parse(s); } catch { return {}; } }
function isIso(s) { return typeof s === "string" && !Number.isNaN(Date.parse(s)); }

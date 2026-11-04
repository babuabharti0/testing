// Where the form sends its JSON.
// Default: the bundled Vercel function (/api/lead), which forwards to n8n and keeps the webhook URL private.
// To post straight to n8n instead, replace the value with the live production webhook URL,
// e.g. "https://your-n8n-host/webhook/lead-capture" (the Webhook node must allow your origin).
window.LEAD_ENDPOINT = "/api/lead";

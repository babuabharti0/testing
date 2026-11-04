# Lead Capture Demo

Single-page lead form (HTML5, Tailwind, vanilla JS) that posts JSON to an n8n webhook.
n8n then saves the lead to Google Sheets, emails and WhatsApps the prospect, and alerts the team on Telegram.

## Structure

| Path | Purpose |
| --- | --- |
| `index.html`, `assets/app.js` | The page, validation and submit logic |
| `config.js` | Endpoint the form posts to |
| `api/lead.js` | Vercel function: validates, then forwards to n8n |
| `n8n/lead-capture-workflow.json` | Importable n8n workflow |
| `vercel.json` | Security headers |

## 1. Set up n8n

1. In n8n choose **Import from file** and select `n8n/lead-capture-workflow.json`.
2. Connect credentials and fill the blanks on each node:
   - **Google Sheets**: pick the spreadsheet and sheet. Row 1 headers: `submitted_at, full_name, email, phone, service, budget, message, source`.
   - **Gmail**: connect the sending account.
   - **WhatsApp**: add the phone number ID from Meta's WhatsApp Business Cloud API. Meta only allows free-text messages inside a 24-hour window, so for cold prospects switch to an approved template message.
   - **Telegram**: set the chat ID (or replace with a Slack node).
3. Click **Activate**. Copy the **Production** webhook URL (`.../webhook/lead-capture`), not the test URL.

## 2. Deploy to Vercel

1. Run `vercel` in this folder (or drag it into vercel.com/new).
2. Add the environment variable `N8N_WEBHOOK_URL` with the production webhook URL, then redeploy.

The form posts to `/api/lead`, which forwards to n8n server-side. The webhook URL stays private and CORS is not an issue.

### Alternative: post straight to n8n

Set `window.LEAD_ENDPOINT` in `config.js` to the production webhook URL. The Webhook node already allows all origins; restrict it to your domain after the demo.

## Payload sent to n8n

```json
{
  "full_name": "Arjun Sharma",
  "email": "arjun@example.com",
  "phone": "+919876543210",
  "service": "Workflow Automation",
  "budget": "₹50k - ₹1L",
  "message": "Looking to automate client follow-ups and CRM sync.",
  "source": "demo_landing_page",
  "submitted_at": "2026-11-03T16:48:20.123Z"
}
```

Phone numbers are normalized to E.164 (spaces removed) before sending.

## Rebranding

Search for "Brightwire Studio" in `index.html` and `n8n/lead-capture-workflow.json` and replace it with the client's name. Colors are defined once in the Tailwind config at the top of `index.html`.

## Test

```bash
curl -X POST "$N8N_WEBHOOK_URL" -H "Content-Type: application/json" \
  -d '{"full_name":"Test User","email":"you@example.com","phone":"+919876543210","service":"CRM Setup","budget":"₹3L+","message":"Test","source":"demo_landing_page","submitted_at":"2026-11-04T10:00:00.000Z"}'
```

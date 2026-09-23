# Receipt Analyzer

AI-powered receipt/invoice analyzer. Upload a receipt or invoice (image or PDF), and Claude's vision model extracts vendor, date, total, category, and line items as structured JSON. Users can review and correct any field before it's used — v1 is stateless (upload → extract → display → edit), nothing is persisted server-side.

## Highlights

- **Real AI integration, not a chat wrapper** — structured JSON extraction from images/PDFs via Claude's vision API, with a schema-constrained prompt and server-side normalization of the response.
- **Doesn't trust the model blindly** — the AI's JSON output is regex-extracted, parsed defensively, and every field is validated/normalized against an allowed schema (unknown categories fall back to `"other"`, malformed line items are dropped) before it ever reaches the client.
- **Tested failure handling** — 6 unit tests ([server/test/aiService.test.js](server/test/aiService.test.js)) cover malformed JSON, markdown-wrapped responses, missing JSON, and garbage input, proving the app degrades gracefully instead of crashing or showing bad data.
- **Security-conscious by default** — API key is server-side only and never reaches the client; uploads are validated by MIME type and size before hitting the AI call; the extraction endpoint is rate-limited to prevent runaway API costs.
- **Verified end-to-end against the live Anthropic API** — authentication, request formatting, and error propagation were all confirmed working against the real API (not just mocked), with the only remaining gap being account billing/credits.

## Stack
- **Server:** Node/Express, Anthropic Claude API, Multer, express-rate-limit
- **Client:** React + Vite

## Setup

### Server
```
cd server
npm install
cp .env.example .env   # fill in ANTHROPIC_API_KEY
npm run dev
npm test                # run the AI-response handling test suite
```

### Client
```
cd client
npm install
cp .env.example .env
npm run dev
```

## Deployment
This is a monorepo — the client and server deploy to different platforms.

- **Client (static site):** Deploy to Vercel/Netlify with root directory-aware config (see [vercel.json](vercel.json), which builds `client/` and serves `client/dist`). Set the env var `VITE_API_BASE_URL` to your deployed server's URL.
- **Server (Express process):** Deploy to Render (see [render.yaml](render.yaml)), Railway, or Fly.io — it needs a persistent Node process, not a serverless function. Set `ANTHROPIC_API_KEY` and `FRONTEND_ORIGIN` (your deployed client URL) as platform secrets/env vars, never in code.

## API
- `POST /api/analyze` — multipart upload, field name `receipt` (JPEG/PNG/WEBP/PDF, max 10MB). Rate-limited to 20 requests / 15 min. Returns extracted JSON directly; nothing is saved.

## Security notes
- Anthropic API key is only used server-side, never sent to the client.
- Uploads are validated by MIME type and size before being processed.
- AI JSON output is parsed defensively (regex-extracted, schema-normalized) — never trusted or executed directly.
- Analyze endpoint is rate-limited to prevent API credit abuse.

## Out of scope for v1
Database/persistence, auth, upload history, batch upload. The AI service and route layer are structured so a DB layer could be added later without a rewrite.

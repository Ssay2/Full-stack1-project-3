# Project 3: AI-Powered Receipt/Document Analyzer

## Overview

A web tool where a user uploads a receipt, invoice, or document (image or PDF),
and an AI vision model extracts structured data from it — vendor, date, total,
line items, and a suggested spending category. The user sees the results in a
clean summary and can correct any field the AI got wrong.

This is Project 3 of 3 in a portfolio. Project 1 covered spending categorization,
so this connects to the same finance theme without repeating it. This one is
meant to be the smallest/leanest of the three — target 1-2 weeks.

## Scope for v1 — STATELESS

No database for v1. Flow is: upload → extract → display → edit in the UI →
done. Nothing is persisted server-side. This is a deliberate scope-down to
move fast; do not add Postgres, a DB layer, or auth in v1.

(v2, not now: persist extracted results to Postgres, add a history/list view.
Leave the code structured so a DB layer could be added later without a
rewrite, but don't build it yet.)

## MVP Features

1. Upload a receipt/invoice — image (jpg/png) or PDF
2. Send it to an AI vision model with a prompt requesting structured JSON:
vendor, date, total, line items, suggested category
3. Display extracted data in a clean card/table in the UI
4. Let the user edit/correct any field inline if the extraction is wrong
5. Handle failure cases gracefully — malformed JSON from the model, a file
the model can't parse, low-confidence extraction — with a clear message
to the user, not a silent failure or a crash

## Tech Stack

- Backend: Node.js + Express
- Frontend: React
- AI: Anthropic API (Claude vision), called server-side only
- No database in v1

## Required Structure

Set up as a monorepo-style layout:

```
/server   - Express app, API routes, AI-calling logic, file upload handling
/client   - React app, upload UI, results display/edit UI
```

Backend responsibilities:

- One endpoint to accept a file upload and return extracted JSON
- All AI calls happen server-side — the API key must never be exposed to
the frontend or committed to the repo (use environment variables)

## Non-negotiable Requirements

- **API key server-side only** — never sent to or used by the frontend
- **File validation** — restrict upload type (jpg/png/pdf only) and size
(reasonable cap, e.g. 10MB) before it ever reaches the AI call
- **Graceful AI failure handling** — if the model returns malformed JSON or
fails to parse the document, catch it and return a clear error to the UI
instead of crashing or showing garbage data
- **Rate limiting** — basic rate limit on the upload/extract endpoint so a
single user (or bug) can't burn through API credits
- **Editable results** — the UI must let the user correct extracted fields;
this is a deliberate design choice showing awareness that AI extraction
isn't perfect, and it's a good interview talking point — don't skip it

## Definition of Done (v1)

- User can upload a receipt image or PDF
- Extracted data (vendor, date, total, line items, category) displays in a
clean, readable format
- User can edit any field if the extraction is wrong
- Bad uploads and AI failures are handled with a clear message, not a crash
- API key is not exposed anywhere in client-side code or the repo
- Basic rate limiting is in place on the extraction endpoint

## Explicitly Out of Scope for v1

- Database / persistence
- Auth / user accounts
- History of past uploads
- Batch upload of multiple receipts at once

# SS Healthcare CRM — Fully Working Call Review Patch

This patch fixes the backend boot issue and adds the complete **Option B Callyzer Manual Call Review** workflow.

## What this patch does

1. Fixes backend crash caused by missing `backend/routes/chat.js`.
2. Adds `/api/chat/health` and a safe local fallback chat route.
3. Adds `/api/callyzer/webhook` for Callyzer webhook call-log ingestion.
4. Adds `/api/callyzer/sync` for optional manual backfill from Callyzer API.
5. Adds `call_inquiries` table and private `call-recordings` Supabase bucket.
6. Adds `Call Review` page in the frontend.
7. Allows staff to manually upload important call recordings into Supabase Storage.
8. Allows staff to paste transcript/call notes and extract fields locally.
9. Allows staff to manually click **Add to Pipeline** after review.

## Cost model supported

This is built for Option B:

```text
Callyzer Basic plan + API/Webhook add-on
No Callyzer recording-storage add-on required
Supabase stores only manually uploaded important recordings
```

## Files included

```text
backend/server.js
backend/routes/chat.js
backend/routes/callyzer.js
backend/utils/callyzer-normalizer.js
backend/.env.example
src/App.tsx
src/components/Sidebar.tsx
src/pages/CallReviewInbox.tsx
supabase/migrations/003_callyzer_option_b_manual_call_review.sql
samples/callyzer-webhook-sample.json
```

## Install patch

From the root of your repo:

```bash
cp -R ss-healthcare-full-working-call-review-pack/* .
```

## Database setup

Open Supabase SQL Editor and run:

```text
supabase/migrations/003_callyzer_option_b_manual_call_review.sql
```

This creates:

```text
call_inquiries
call-recordings private storage bucket
add_call_inquiry_to_pipeline(call_id)
```

## Backend setup

Create `backend/.env` from `backend/.env.example`:

```bash
cd backend
cp .env.example .env
```

Fill:

```text
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY
CALLYZER_WEBHOOK_SECRET=change-this-secret
CALLYZER_API_TOKEN=YOUR_CALLYZER_API_TOKEN
```

Then run:

```bash
npm install
npm run dev
```

Test:

```bash
curl http://localhost:3001/health
curl http://localhost:3001/api/chat/health
curl http://localhost:3001/api/callyzer/health
```

## Frontend setup

From repo root:

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:5173/call-review
```

## Test Callyzer webhook locally

```bash
curl -X POST http://localhost:3001/api/callyzer/webhook \
  -H "Content-Type: application/json" \
  -H "x-callyzer-secret: change-this-secret" \
  --data @samples/callyzer-webhook-sample.json
```

Refresh `/call-review`. The call should appear in the inbox.

## Production Callyzer webhook URL

After deploying backend, give Callyzer this webhook URL:

```text
https://YOUR_BACKEND_DOMAIN.com/api/callyzer/webhook?secret=YOUR_SECRET
```

Or use header:

```text
x-callyzer-secret: YOUR_SECRET
```

## Operational workflow

```text
Employee answers manual phone call
Callyzer tracks call log
Callyzer sends webhook to backend
Backend stores call in Supabase call_inquiries
Staff opens Call Review page
Staff uploads important recording manually to Supabase
Staff pastes transcript/call notes
Staff clicks Extract Fields
Staff verifies fields
Staff clicks Add to Pipeline
Lead appears in AI CRM New Lead stage
```

## Important limitations

- This patch does not use Callyzer recording storage.
- It does not auto-transcribe recordings because that would require a paid transcription API.
- It is intentionally manual-review-first to avoid polluting the pipeline with spam, missed calls, and duplicate callers.
- If `crm_leads` has a very different schema, adjust the SQL function `add_call_inquiry_to_pipeline`.

## Recommended next hardening

1. Add duplicate caller detection before adding to pipeline.
2. Add role-based access control for Call Review.
3. Add employee-to-Callyzer-phone mapping table.
4. Add optional OpenAI/Whisper transcription for high-value calls only.
5. Add WhatsApp template follow-up after pipeline conversion.

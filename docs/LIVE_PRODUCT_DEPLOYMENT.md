# SS Healthcare Live Product V3 — Deployment and Validation

This patch exists because the earlier build proved the plumbing, but parts of the UI still felt static. V3 makes the key admin pages visibly data-bound and adds a system-health screen so missing backend/Supabase config is obvious.

## What this patch changes

- Dashboard no longer uses mock KPI cards for the primary operational numbers.
- AI CRM pipeline reads directly from `crm_leads` and updates stages live.
- Added `/admin/system` to prove backend and Supabase connectivity.
- Added `/api/system/health` backend health diagnostics.
- Added a hardening migration with idempotent live tables, updated RPC, and storage bucket creation.

## Apply files

Copy the patch into the repo root:

```bash
cp -R ss-healthcare-live-product-v3/* .
```

Run migration in Supabase SQL Editor:

```text
supabase/migrations/005_live_product_ops_hardening.sql
```

## Frontend environment variables

For Vercel/local frontend:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
VITE_BACKEND_URL=https://YOUR_DEPLOYED_BACKEND_URL
```

If `VITE_BACKEND_URL` is missing, `/admin/system` assumes `http://localhost:3001`.

## Backend environment variables

Backend needs:

```env
PORT=3001
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY
CALLYZER_WEBHOOK_SECRET=YOUR_REAL_SECRET
CALLYZER_API_TOKEN=optional_for_backfill_sync
CALLYZER_CALL_HISTORY_URL=https://api1.callyzer.co/api/v2.1/callHistory
```

## Production architecture

Vercel only hosts the frontend. It cannot receive Callyzer webhooks unless you deploy the Express backend separately.

Required production shape:

```text
Vercel frontend
  -> reads Supabase using anon key
  -> calls backend using VITE_BACKEND_URL

Railway/Render backend
  -> receives Callyzer webhook
  -> uses Supabase service role key
  -> inserts call_inquiries securely

Supabase
  -> database tables
  -> RPC add_call_inquiry_to_pipeline
  -> call-recordings bucket
```

## Validation

1. Start backend:

```bash
cd backend
npm run dev
```

2. Start frontend:

```bash
npm run dev
```

3. Open:

```text
http://localhost:5173/admin/system
```

You should see:

- Backend reachable
- Supabase env configured
- Counts for crm_leads, call_inquiries, employees, manual_attendance

4. Send sample Callyzer webhook:

```powershell
$body = Get-Content .\samples\callyzer-webhook-sample.json -Raw
Invoke-RestMethod -Uri "http://localhost:3001/api/callyzer/webhook?secret=YOUR_SECRET" -Method POST -ContentType "application/json" -Body $body
```

5. Open:

```text
http://localhost:5173/admin/calls
http://localhost:5173/admin/crm
http://localhost:5173/admin
```

The call should appear in calls, conversion should create a real pipeline lead, and dashboard counts should update.

## Why it looked static before

The product had the UI shell and local backend validation, but a live deployed product requires these four things simultaneously:

1. Supabase migration applied.
2. Frontend deployed with VITE_SUPABASE_* and VITE_BACKEND_URL.
3. Backend deployed separately with SUPABASE service role and Callyzer secret.
4. Callyzer webhook pointed to the deployed backend, not localhost.

If any one is missing, the frontend may load but feel static.

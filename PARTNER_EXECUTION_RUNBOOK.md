# Partner Runbook — Phase 1 Live SS Health Care CRM OS

## Mission

Make the current SS Health Care Admin OS live and usable by the client. Do not add features. Do not connect Callyzer or Meta yet. Complete Phase 1.

## Phase 1 deliverable

A deployed internal CRM with:
- Dashboard
- Call Leads
- AI CRM pipeline
- Staff assignment
- Staff ID card generation
- Public staff ID verification link
- WhatsApp prefilled message/logging
- HR
- Attendance
- Billing
- Access control

## Step-by-step

### Step 1 — Commit release

```bash
git status
git add .
git commit -m "release: phase 1 live ss healthcare crm os"
git tag ss-healthcare-v1.0-phase1-live
git push origin main --tags
```

### Step 2 — Local build

```bash
npm install
npm run build
```

Backend:

```bash
cd backend
npm install
npm run dev
```

Health:

```bash
curl http://localhost:3001/health
curl http://localhost:3001/api/chat/health
curl http://localhost:3001/api/callyzer/health
curl http://localhost:3001/api/system/health
```

### Step 3 — Supabase production setup

Create a production project named:

```text
ss-healthcare-production
```

Run migrations in order:

```text
003_callyzer_option_b_manual_call_review.sql
004_admin_parity_callyzer_attendance.sql
005_live_product_ops_hardening.sql
006_pipeline_parity_staff_templates_call_leads.sql
007_product_ready_tomorrow_baseline.sql
008_staff_id_cards_services_whatsapp.sql
009_brand_lock_ss_healthcare.sql
```

### Step 4 — Backend deploy

Deploy `/backend`.

Backend env:

```env
NODE_ENV=production
PORT=3001
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_KEY=YOUR_SERVICE_ROLE_KEY
CALLYZER_WEBHOOK_SECRET=phase2_not_active_yet
CALLYZER_API_TOKEN=
META_WA_ACCESS_TOKEN=
META_WA_PHONE_NUMBER_ID=
META_WA_BUSINESS_ACCOUNT_ID=
META_WA_VERIFY_TOKEN=
META_WA_APP_SECRET=
META_WA_API_VERSION=v23.0
```

Test deployed backend:

```text
/health
/api/chat/health
/api/callyzer/health
/api/system/health
```

### Step 5 — Frontend deploy

Deploy root project to Vercel.

Build:

```bash
npm run build
```

Output:

```text
dist
```

Vercel env:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY
VITE_BACKEND_URL=https://YOUR_BACKEND_DOMAIN
VITE_APP_MODE=os
```

### Step 6 — Smoke test

Run the checklist in `SMOKE_TEST_PHASE1.md`.

### Step 7 — Handover

Use `CLIENT_HANDOVER_GUIDE.md`.

## Do not do

- Do not connect real Callyzer yet.
- Do not connect real Meta WhatsApp yet.
- Do not add new screens.
- Do not change branding.
- Do not hand over with `password123`.
- Do not expose service role key.

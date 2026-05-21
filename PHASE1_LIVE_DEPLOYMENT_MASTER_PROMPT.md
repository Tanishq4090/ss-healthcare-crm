# SS Health Care Phase 1 Live CRM OS — Execution Prompt

You are taking over a working SS Health Care Admin OS codebase. Your job is **not to add features**. Your job is to make the current Phase 1 system live, stable, branded, and handover-ready for the client.

## Product scope

This is **Phase 1 Live CRM OS**.

Included:
- Admin login
- Dashboard
- Call Leads module with manual/demo call entries
- Add Call Lead to CRM
- AI CRM pipeline
- Staff assignment
- Staff ID card generation
- Public staff ID verification link
- WhatsApp prefilled message + message history log
- Clients
- AI HR / staff directory
- Manual attendance
- Billing screen
- Access control
- SS Health Care green/blue branding everywhere

Not included yet:
- Live Callyzer webhook
- Live Meta WhatsApp Business API
- Automatic WhatsApp delivery/read status
- Automatic call recording sync

Callyzer and Meta WhatsApp API are Phase 2 integrations. Do not block Phase 1 handover on them.

## Non-negotiable rules

1. Do not introduce new features.
2. Do not redesign the product.
3. Do not touch public website functionality; the client already has a website.
4. Do not put Supabase service role key in frontend/Vercel.
5. Do not commit `.env`, `backend/.env`, or any secret.
6. Do not use `admin / password123` for live handover.
7. Keep all screens under SS Health Care branding only.
8. Public staff ID pages must not expose Aadhaar, salary, full address, private documents, or internal notes.
9. Before handover, `/admin/system` must show green health checks.

## Execution order

### 1. Freeze current code

Run:

```bash
git status
git add .
git commit -m "release: phase 1 live ss healthcare crm os"
git tag ss-healthcare-v1.0-phase1-live
git push origin main --tags
```

If the working tree has sensitive files, stop and confirm they are ignored before committing.

### 2. Verify build locally

From project root:

```bash
npm install
npm run build
```

From backend folder:

```bash
cd backend
npm install
npm run dev
```

Health checks:

```bash
curl http://localhost:3001/health
curl http://localhost:3001/api/chat/health
curl http://localhost:3001/api/callyzer/health
curl http://localhost:3001/api/system/health
```

Expected: healthy JSON responses.

### 3. Create production Supabase project

Project name:

```text
ss-healthcare-production
```

Collect securely:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- database password

Store secrets in a password manager. Do not paste secrets into chat, GitHub, or docs.

### 4. Run Supabase migrations

Run these SQL files in Supabase SQL Editor, in this order:

```text
003_callyzer_option_b_manual_call_review.sql
004_admin_parity_callyzer_attendance.sql
005_live_product_ops_hardening.sql
006_pipeline_parity_staff_templates_call_leads.sql
007_product_ready_tomorrow_baseline.sql
008_staff_id_cards_services_whatsapp.sql
009_brand_lock_ss_healthcare.sql
```

After migrations, verify tables:

```sql
select table_name
from information_schema.tables
where table_schema = 'public'
order by table_name;
```

Required tables:
- `crm_leads`
- `call_inquiries`
- `employees`
- `manual_attendance`
- `lead_staff_assignments`
- `template_message_logs`
- `whatsapp_messages`

Verify storage:
- Supabase → Storage → `call-recordings`
- It should be private.
- Create it manually if missing.

### 5. Deploy backend

Deploy `/backend` to Railway, Render, or VPS.

Start command:

```bash
npm install && npm start
```

Backend environment:

```env
NODE_ENV=production
PORT=3001

SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY

CALLYZER_WEBHOOK_SECRET=phase2_not_active_yet
CALLYZER_API_TOKEN=

META_WA_ACCESS_TOKEN=
META_WA_PHONE_NUMBER_ID=
META_WA_BUSINESS_ACCOUNT_ID=
META_WA_VERIFY_TOKEN=
META_WA_APP_SECRET=
META_WA_API_VERSION=v23.0
```

For Phase 1, Callyzer and Meta variables can stay blank.

Verify deployed backend:

```text
https://YOUR-BACKEND-DOMAIN/health
https://YOUR-BACKEND-DOMAIN/api/chat/health
https://YOUR-BACKEND-DOMAIN/api/callyzer/health
https://YOUR-BACKEND-DOMAIN/api/system/health
```

### 6. Deploy frontend to Vercel

Frontend root: project root.

Build command:

```bash
npm run build
```

Output directory:

```text
dist
```

Vercel environment:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
VITE_BACKEND_URL=https://YOUR-BACKEND-DOMAIN
VITE_APP_MODE=os
```

Do not add service role key to Vercel frontend env.

### 7. Create live admin credentials

Do not hand over `password123`.

Recommended:
- Username: `admin`
- Password: create a strong client-safe password.

Create at least one admin account. If role management is ready, create:
- Reception user: Calls + CRM + Clients
- HR user: HR + Attendance
- Billing user: Billing + Clients

### 8. Production smoke test

Test on the deployed frontend, not only localhost.

Required flow:

1. Login.
2. Open `/admin/system`; confirm green.
3. Open `/admin/calls`.
4. Open a call lead; verify summary, intent, captured data, full transcript.
5. Click Add to CRM.
6. Open `/admin/crm`; confirm new lead appears.
7. Move lead through stages:
   - New Lead
   - New Inquiry
   - In Discussion
   - Quotation Sent
   - Form Submitted
   - Staff Assigned
   - Deposit Pending
   - Active Client
   - Monthly Billing
   - Closed Won
8. Assign staff from the lead card.
9. Confirm lead moves to Staff Assigned.
10. Open `/admin/hr`; create or view a staff member.
11. Preview staff ID card.
12. Open `/staff-id/:token` without login.
13. From CRM, send/open Staff ID WhatsApp template.
14. Confirm WhatsApp History logs the action.
15. Open `/admin/attendance`; create one attendance entry.
16. Open `/admin/billing`; confirm page loads.
17. Confirm no legacy SS Health Care branding appears anywhere.

### 9. Handover

Give the client:
- CRM URL
- admin username/password
- usage guide
- support contact
- Phase 2 integration note

Client positioning:

> This is Phase 1 of the live SS Health Care Admin OS. It is ready for internal CRM operations, staff management, lead tracking, staff assignment, ID verification, attendance, and billing workflows. Live Callyzer call-log sync and Meta WhatsApp Business API delivery are prepared as Phase 2 integrations after operational approval.

## Stop conditions

Stop handover if any of these fail:
- Frontend production URL does not open.
- Backend health is unreachable.
- `/admin/system` is red.
- Admin login fails.
- Add to CRM fails.
- Staff assignment fails.
- Public staff ID link requires login.
- Attendance does not save.
- Any screen shows SS Health Care or old branding.
- Service role key is visible in frontend env or GitHub.

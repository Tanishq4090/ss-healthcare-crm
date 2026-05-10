# SS Healthcare CRM — Admin Parity v2

## Goal

This patch moves `ss-healthcare-crm` toward the operational structure of the existing `HealthCare / SS Health Care` admin system while preserving the SS Health Care visual identity, logo, and green/blue clinical UI.

No public website is included. The client already has `https://homecareservices.co.in/`, so this build is CRM/admin-only.

## Product Architecture

The old AI-agent-calling idea is intentionally removed from the roadmap.

The call acquisition layer is now:

```text
Employee answers manual call
→ Callyzer tracks call log via API/Webhook
→ CRM receives call in Call Review Inbox
→ Staff manually reviews and qualifies
→ Optional recording upload to Supabase
→ Optional transcript / notes
→ Add to Pipeline
→ CRM lead is created
```

## Included Files

```text
backend/server.js
backend/routes/chat.js
backend/routes/callyzer.js
backend/utils/callyzer-normalizer.js
backend/.env.example

src/App.tsx
src/components/Sidebar.tsx
src/contexts/AuthContext.tsx
src/pages/Dashboard.tsx
src/pages/AICRM.tsx
src/pages/CallReviewInbox.tsx
src/pages/ManualAttendance.tsx

supabase/migrations/003_callyzer_option_b_manual_call_review.sql
supabase/migrations/004_admin_parity_callyzer_attendance.sql
samples/callyzer-webhook-sample.json
```

## Admin Routes

```text
/admin              Dashboard
/admin/crm          AI CRM Pipeline
/admin/calls        Callyzer Call Review Inbox
/admin/clients      Clients
/admin/hr           AI HR
/admin/attendance   Manual Attendance
/admin/billing      Finance
/admin/settings     Access Control
```

Backward-compatible redirects are also included:

```text
/ai-crm → /admin/crm
/call-review → /admin/calls
/clients → /admin/clients
/ai-hr → /admin/hr
/manual-attendance → /admin/attendance
/finance → /admin/billing
/access-control → /admin/settings
```

## Database Setup

Run both SQL files in Supabase SQL Editor if not already applied:

```text
supabase/migrations/003_callyzer_option_b_manual_call_review.sql
supabase/migrations/004_admin_parity_callyzer_attendance.sql
```

Migration 003 creates:

```text
call_inquiries
call-recordings bucket
add_call_inquiry_to_pipeline(uuid) RPC
```

Migration 004 creates:

```text
manual_attendance
manual_attendance_daily_summary view
additional crm_leads compatibility columns
```

## Backend Setup

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

Required `.env` values:

```text
PORT=3001
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_service_role_key
CALLYZER_WEBHOOK_SECRET=generate_a_fresh_secret
CALLYZER_API_TOKEN=optional_for_manual_backfill
CALLYZER_API_BASE_URL=https://api1.callyzer.co/api/v2.1
```

Never commit `backend/.env`.

## Frontend Setup

```bash
npm install
npm run dev
```

Login:

```text
/admin
username: admin
password: password123
```

## Callyzer Live Webhook

Expose local backend:

```bash
ngrok http 3001
```

Configure Callyzer webhook URL:

```text
https://YOUR-NGROK-URL.ngrok-free.app/api/callyzer/webhook?secret=YOUR_SECRET
```

## Demo Flow

Show only the operational backbone first:

```text
Manual employee call
→ Callyzer call appears in Call Review Inbox
→ Staff reviews and edits extracted fields
→ Staff optionally uploads recording
→ Staff clicks Add to Pipeline
→ Lead appears in CRM Pipeline
```

Do not overpromise automatic transcription until real client recordings are validated.

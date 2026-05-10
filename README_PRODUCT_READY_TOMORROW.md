# SS Healthcare Admin OS — Product-Ready Tomorrow Pack

This pack is for tomorrow's client-ready demo baseline. It does not depend on live Callyzer or Meta WhatsApp approval. The CRM should feel live using real Supabase data, seeded demo data, working call-review flow, staff assignment, attendance, billing stages, and template action logs.

## Scope locked for tomorrow

Included:
- Admin-only CRM OS.
- Dashboard, CRM pipeline, Call Leads, Clients, AI HR, Manual Attendance, Finance/Billing, Access Control.
- Pipeline stages: New Lead, New Inquiry, In Discussion, Quotation Sent, Form Submitted, Staff Assigned, Deposit Pending, Active Client, Monthly Billing, Closed Won.
- Staff assignment from CRM lead card.
- Template message action logging.
- Call Leads with call log, summary, intent, captured lead data, transcript, recording path, and Add to CRM.
- Supabase Storage bucket for manually uploaded call recordings.

Deferred until after demo:
- Live Callyzer webhook production configuration.
- Meta WhatsApp Business API production sending.
- Automated call transcription.
- Public website.

## Apply order

1. Copy this pack into the root of `ss-healthcare-crm`.
2. Run the migration in Supabase SQL Editor:

```text
supabase/migrations/007_product_ready_tomorrow_baseline.sql
```

3. Restart backend and frontend:

```bash
cd backend
npm install
npm run dev
```

```bash
npm install
npm run dev
```

4. Open:

```text
http://localhost:5173/login
```

5. Login with the current demo admin credentials configured in your app.

6. Validate:

```text
/admin
/admin/calls
/admin/crm
/admin/hr
/admin/attendance
/admin/billing
/admin/settings
```

## Tomorrow demo rule

Do not demo unfinished external integrations. Demo the operational workflow:

```text
Call Lead -> Review summary/intent/transcript -> Add to CRM -> Move pipeline stage -> Assign Staff -> Send Template Action -> Deposit Pending -> Active Client -> Monthly Billing
```

If asked about Callyzer or Meta:

```text
The CRM is integration-ready. Callyzer will feed real call logs into this same Call Leads screen, and Meta WhatsApp API will replace the current logged template action with approved live message delivery.
```

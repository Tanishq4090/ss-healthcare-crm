# SS Healthcare Pipeline Parity V4

This patch moves SS Healthcare Admin OS closer to the working `HealthCare` admin CRM behavior while preserving the SS Healthcare theme/logo and replacing AI-agent calling with Callyzer manual call tracking.

## What this adds

### AI CRM Pipeline
Required live stages:

1. New Lead
2. New Inquiry
3. In Discussion
4. Quotation Sent
5. Form Submitted
6. Staff Assigned
7. Deposit Pending
8. Active Client
9. Monthly Billing
10. Closed Won

The pipeline is powered by `public.crm_leads`.

### Staff assignment
Each lead card has **Assign Staff**. It opens all available employees from `public.employees`, then calls:

```sql
select public.assign_staff_to_lead('<lead_id>', '<employee_id>');
```

The RPC updates the lead to `staff-assigned`, records assignment history in `lead_staff_assignments`, and stores assigned staff metadata on the lead.

### Custom template messages
Each lead card has **Template**. It opens editable WhatsApp templates from `message_templates`, replaces variables like `{{name}}`, `{{service}}`, `{{location}}`, and opens WhatsApp Web. It also logs the action in `template_message_logs`.

### Call Leads Inbox
The Call Review page now shows:

- Call logs
- Summary and intent
- Lead data captured
- Add to CRM option
- View full transcript
- Recording upload to Supabase Storage

Call data comes from `public.call_inquiries`.

## Files included

```text
src/pages/AICRM.tsx
src/pages/CallReviewInbox.tsx
backend/routes/callyzer.js
supabase/migrations/006_pipeline_parity_staff_templates_call_leads.sql
samples/callyzer-webhook-full-sample.json
SMOKE_TEST_PIPELINE_PARITY_V4.md
```

## Apply

```bash
cp -R ss-healthcare-pipeline-parity-v4/* .
```

Run SQL in Supabase SQL Editor:

```text
supabase/migrations/006_pipeline_parity_staff_templates_call_leads.sql
```

Restart backend and frontend:

```bash
cd backend
npm run dev
```

```bash
npm run dev
```

## Routes to test

```text
/admin/crm
/admin/calls
```

If your router still uses older paths, these components also work when mounted as:

```text
/ai-crm
/call-review
```

## Callyzer webhook

Use:

```text
https://YOUR-BACKEND-DOMAIN/api/callyzer/webhook?secret=YOUR_SECRET
```

For local live test:

```bash
ngrok http 3001
```

Then use:

```text
https://YOUR-NGROK-DOMAIN/api/callyzer/webhook?secret=YOUR_SECRET
```

## Important product rule

Callyzer is only call tracking. It is not AI calling. All real calls are answered manually by employees. The CRM receives the call log, shows it in Call Leads, and only reviewed calls become pipeline leads.

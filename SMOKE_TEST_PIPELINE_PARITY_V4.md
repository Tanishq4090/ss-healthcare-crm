# Smoke Test — Pipeline Parity V4

## 1. Database
Run:

```sql
select count(*) from crm_leads;
select count(*) from call_inquiries;
select count(*) from employees;
select count(*) from message_templates;
select count(*) from lead_staff_assignments;
```

Expected: all queries succeed.

## 2. Backend Callyzer Health

```bash
curl http://localhost:3001/api/callyzer/health
```

Expected:

```json
{"ok":true}
```

## 3. Callyzer Webhook Sample

PowerShell:

```powershell
$body = Get-Content .\samples\callyzer-webhook-full-sample.json -Raw
Invoke-RestMethod `
  -Uri "http://localhost:3001/api/callyzer/webhook?secret=YOUR_SECRET" `
  -Method POST `
  -ContentType "application/json" `
  -Body $body
```

Then verify:

```sql
select caller_number, summary, intent, captured_name, captured_service, captured_location, review_status
from call_inquiries
order by created_at desc
limit 5;
```

## 4. Call Leads UI

Open:

```text
http://localhost:5173/admin/calls
```

Verify each card shows:

- Caller number
- Employee
- Call type/duration
- Summary
- Intent
- Lead data captured
- Full Transcript button
- Add to CRM button

## 5. Add to CRM

Click **Add to CRM** from Call Leads.

Verify:

```sql
select client_name, phone, stage, service_type, source, tags
from crm_leads
order by created_at desc
limit 5;
```

Expected: new row with `stage = new-lead`, `source = callyzer_call_review`.

## 6. CRM Pipeline

Open:

```text
http://localhost:5173/admin/crm
```

Verify stages exist:

```text
New Lead
New Inquiry
In Discussion
Quotation Sent
Form Submitted
Staff Assigned
Deposit Pending
Active Client
Monthly Billing
Closed Won
```

## 7. Assign Staff

Add at least one employee in AI HR or run this SQL for demo staff:

```sql
insert into employees (full_name, username, position, department, phone, availability_status)
values ('Rina Staff', 'rina_staff', 'Caregiver', 'Home Care', '+919876543210', 'available')
on conflict do nothing;
```

Click **Assign** on a lead. Pick staff. Verify:

```sql
select client_name, stage, assignee, assignee_id
from crm_leads
order by updated_at desc
limit 5;

select * from lead_staff_assignments order by created_at desc limit 5;
```

Expected: lead stage becomes `staff-assigned`.

## 8. Template Message

Click **Template** on a lead, choose a template, edit the text, click **Open WhatsApp**.

Verify:

```sql
select template_key, recipient_phone, status, created_at
from template_message_logs
order by created_at desc
limit 5;
```

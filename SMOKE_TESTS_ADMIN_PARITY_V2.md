# Smoke Tests — Admin Parity v2

## 1. Backend health

```bash
curl http://localhost:3001/health
curl http://localhost:3001/api/chat/health
curl http://localhost:3001/api/callyzer/health
```

Expected: JSON success response.

## 2. Sample Callyzer webhook

PowerShell:

```powershell
$body = Get-Content .\samples\callyzer-webhook-sample.json -Raw
Invoke-RestMethod -Uri "http://localhost:3001/api/callyzer/webhook?secret=YOUR_SECRET" -Method POST -ContentType "application/json" -Body $body
```

Expected: `ok: true`.

## 3. Verify DB insertion

```sql
select *
from call_inquiries
order by created_at desc
limit 5;
```

## 4. Frontend admin login

```text
http://localhost:5173/admin
username: admin
password: password123
```

## 5. Verify modules

Open:

```text
/admin
/admin/crm
/admin/calls
/admin/clients
/admin/hr
/admin/attendance
/admin/billing
/admin/settings
```

## 6. Verify Add to Pipeline

In `/admin/calls`, click Add to Pipeline on a test call.

Then run:

```sql
select *
from crm_leads
order by created_at desc
limit 5;
```

## 7. Verify manual attendance

In `/admin/attendance`, mark one employee present.

Then run:

```sql
select *
from manual_attendance
order by created_at desc
limit 5;
```

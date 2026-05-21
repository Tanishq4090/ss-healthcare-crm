# Phase 1 Production Smoke Test

Run this on the deployed production CRM URL.

## 1. Login

- Open `/login`
- Login as admin
- Confirm `/admin` dashboard loads

Pass criteria:
- Dashboard opens
- SS Health Care logo/theme visible
- No SS Health Care branding

## 2. System status

Open:

```text
/admin/system
```

Pass criteria:
- Backend reachable
- Supabase reachable
- Core tables accessible

## 3. Call Leads

Open:

```text
/admin/calls
```

Check:
- Call logs visible
- Summary visible
- Intent visible
- Lead data captured visible
- Full transcript opens
- Add to CRM button visible

Click Add to CRM.

Pass criteria:
- New CRM lead is created

## 4. AI CRM pipeline

Open:

```text
/admin/crm
```

Confirm stages:
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

Move one lead through at least three stages.

Pass criteria:
- Stage persists after refresh

## 5. Staff assignment

From a lead:
- Click Assign Staff
- Select available staff
- Confirm

Pass criteria:
- Staff list loads
- Assignment saves
- Lead moves to Staff Assigned

## 6. Staff ID card

Open:

```text
/admin/hr
```

Create or open staff.

Check ID card:
- SS Health Care logo
- Employee ID
- Name
- Role
- Experience
- Gender
- Services/skills
- Verified/active status

Open public staff card link:

```text
/staff-id/:token
```

Pass criteria:
- Opens without login
- Does not show Aadhaar, salary, internal documents, or private address

## 7. WhatsApp template action

From CRM lead:
- Click Send Staff ID Template

Pass criteria:
- WhatsApp opens with prefilled message OR action logs
- Staff ID public link is included
- WhatsApp History shows the message/action

## 8. Attendance

Open:

```text
/admin/attendance
```

Create one attendance entry.

Pass criteria:
- Saves successfully
- Remains after refresh

## 9. Billing

Open:

```text
/admin/billing
```

Pass criteria:
- Page loads
- No crash
- No blank screen

## 10. Final brand check

Check:
- `/login`
- `/admin`
- `/admin/calls`
- `/admin/crm`
- `/admin/hr`
- `/staff-id/:token`

Pass criteria:
- All screens use SS Health Care green/blue theme and logo
- No SS Health Care text/logo
- No ElevenLabs or AI-calling language

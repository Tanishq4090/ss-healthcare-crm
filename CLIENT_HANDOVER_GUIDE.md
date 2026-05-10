# SS Health Care Admin OS — Client Handover Guide

## Login

CRM URL:

```text
https://YOUR_CRM_URL/login
```

Credentials:

```text
Username: admin
Password: PROVIDED_SECURELY
```

## Daily workflow

1. Open the CRM and login.
2. Go to **Call Leads** to review new inquiries.
3. Click **Add to CRM** for qualified inquiries.
4. Go to **AI CRM** to manage the lead pipeline.
5. Move leads through the workflow stages.
6. Assign available staff to confirmed clients.
7. Send the staff ID card verification link through WhatsApp.
8. Use **AI HR** to manage staff.
9. Use **Attendance** for daily staff attendance.
10. Use **Billing** for deposit/monthly billing tracking.

## Pipeline stages

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

## Staff ID verification

When staff is assigned to a client, the system can generate a public staff ID verification link. This link can be sent to the client on WhatsApp.

The client can open the link without login and verify:
- staff name
- role
- services/skills
- verification status
- SS Health Care branding

## Phase 2 integrations

Phase 1 is live internal CRM operations.

Phase 2 will connect:
- Callyzer for automatic live call-log sync
- Meta WhatsApp Business API for automatic template sending, delivery status, and client replies

Until Phase 2, WhatsApp messages are opened/logged as prefilled actions.

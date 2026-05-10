# Phase 2 Notes — Callyzer and Meta

Do not connect these until Phase 1 is stable.

## Callyzer

Need:
- Callyzer Basic plan
- API/Webhook add-on
- employee phone numbers configured

Backend webhook URL:

```text
https://YOUR_BACKEND_DOMAIN/api/callyzer/webhook?secret=YOUR_SECRET
```

Safe production promise:

```text
Callyzer syncs call logs into the CRM. Recordings can be manually uploaded for important calls.
```

Do not promise automatic recording sync unless Callyzer confirms recording URL/storage API availability.

## Meta WhatsApp Business API

Need:
- Meta Business Portfolio
- WhatsApp Business Account
- dedicated phone number
- Phone Number ID
- WABA ID
- permanent access token
- approved templates
- webhook verify token
- payment method

Templates:
- inquiry_received
- quotation_sent
- form_link
- staff_assigned
- deposit_pending
- monthly_billing
- general_followup

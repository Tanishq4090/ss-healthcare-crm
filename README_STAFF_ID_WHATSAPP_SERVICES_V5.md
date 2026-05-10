# SS Healthcare Staff ID + Services + WhatsApp History V5

This patch adds the operational staff ID-card workflow required for SS Healthcare:

1. Add employee with photo, services, Aadhaar, DOB, address, experience, payment scheme, and rate.
2. Generate SS Healthcare staff ID card automatically.
3. Publish a public verification link at `/staff-id/:token`.
4. Assign staff to a CRM lead from the AI CRM pipeline.
5. Include the assigned staff ID-card link in the WhatsApp template message.
6. Log WhatsApp template messages into CRM chat history.
7. Seed SS Healthcare business services from the existing business website.

## Files included

```text
supabase/migrations/008_staff_id_cards_services_whatsapp.sql
src/config/ssHealthcareServices.ts
src/components/StaffIDCard.tsx
src/pages/PublicStaffIDCard.tsx
src/pages/AIHR.tsx
src/pages/AICRM.tsx
src/lib/staffIdentity.ts
docs/ROUTE_PATCH.md
```

## Apply

```bash
cp -R ss-healthcare-staff-id-whatsapp-services-v5/* .
```

Run this SQL in Supabase:

```text
supabase/migrations/008_staff_id_cards_services_whatsapp.sql
```

Add the route from:

```text
docs/ROUTE_PATCH.md
```

Then restart:

```bash
npm run dev
```

## Demo flow

```text
/admin/hr
→ Add New Employee
→ upload photo
→ select services/skills
→ create employee
→ ID Card Preview opens

/admin/crm
→ open pipeline lead
→ Assign Staff
→ available employees are shown
→ selected staff ID card preview appears
→ Assign Staff + Send ID Card Template
→ WhatsApp opens with staff ID card link
→ message is logged in WhatsApp History
```

## Production note

The current template flow uses `wa.me` plus database logging. When Meta WhatsApp Business API is ready, replace the `window.open(wa.me...)` adapter with backend `/api/meta/send-template`. The CRM workflow does not need to change.

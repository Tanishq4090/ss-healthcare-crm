# SS Health Care Brand Lock V6

This patch forces the whole Admin OS to use the SS Health Care identity.

## Brand

- Name: SS Health Care
- Product: SS Health Care Admin OS
- Logo: `/logo.png`
- Primary green: `#00A859`
- Secondary blue: `#004C8C`
- Website: `https://homecareservices.co.in/`

## Apply

```bash
cp -R ss-healthcare-brand-lock-v6/* .
node scripts/brand-lock-ss-healthcare.mjs
node scripts/check-brand-lock.mjs
npm run build
```

Run SQL:

```text
supabase/migrations/009_brand_lock_ss_healthcare.sql
```

## Critical screens to verify

- `/login`
- `/admin`
- `/admin/crm`
- `/admin/calls`
- `/admin/hr`
- `/admin/attendance`
- `/admin/billing`
- `/staff-id/:token`

No screen should show SS Health Care, SS Health Care, SS Health Care Voice AI, or old teal-only branding.

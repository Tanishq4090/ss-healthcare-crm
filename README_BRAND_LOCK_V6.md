# SS Health Care Brand Lock V6

This package fixes the common clone problem: old SS Health Care branding leaking into SS Healthcare screens.

## Commands

```bash
cp -R ss-healthcare-brand-lock-v6/* .
node scripts/brand-lock-ss-healthcare.mjs
node scripts/check-brand-lock.mjs
npm run build
```

## SQL

Run:

```text
supabase/migrations/009_brand_lock_ss_healthcare.sql
```

## Notes

The patch is intentionally aggressive. It rewrites legacy brand strings in source files and adds a CSS brand override layer.

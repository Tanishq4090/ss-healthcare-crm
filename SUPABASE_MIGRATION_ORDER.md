# Supabase Migration Order

Run these in Supabase Dashboard → SQL Editor.

```text
003_callyzer_option_b_manual_call_review.sql
004_admin_parity_callyzer_attendance.sql
005_live_product_ops_hardening.sql
006_pipeline_parity_staff_templates_call_leads.sql
007_product_ready_tomorrow_baseline.sql
008_staff_id_cards_services_whatsapp.sql
009_brand_lock_ss_healthcare.sql
```

## Verify tables

```sql
select table_name
from information_schema.tables
where table_schema = 'public'
order by table_name;
```

Required tables:

```text
crm_leads
call_inquiries
employees
manual_attendance
lead_staff_assignments
template_message_logs
whatsapp_messages
```

## Verify bucket

Supabase → Storage:

```text
call-recordings
```

The bucket should be private.

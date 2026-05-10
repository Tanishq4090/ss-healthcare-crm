# Smoke test V5

## 1. Migration

Run:

```sql
select count(*) from service_catalog;
select employee_code, id_card_token, id_card_url from employees order by created_at desc limit 5;
```

Expected: services exist; employees have employee code and ID card token.

## 2. Add employee

Open `/admin/hr`.

Create one employee with:

```text
Full Name: Anitha Patel
Job Title: Registered Nurse
Gender: Female
Phone: 9876543210
Experience: 3 years
Payment Scheme: Monthly
Services: Nursing Care at Home, Home ICU Trained Nursing Staff
```

Expected: ID Card Preview opens.

## 3. Public ID card

Copy the employee's `id_card_url` from DB or UI.
Open:

```text
/staff-id/<token>
```

Expected: client-visible SS Healthcare ID card page loads without login.

## 4. Assign staff

Open `/admin/crm`, select any lead, click `Assign Staff`.

Expected:

- employee list appears
- ID preview appears
- clicking assign moves lead to `Staff Assigned`
- WhatsApp opens with ID card link
- `template_message_logs` receives a row
- `whatsapp_messages` receives an outbound message

## 5. Verify SQL

```sql
select id, client_name, stage, assigned_staff_name, staff_id_card_url
from crm_leads
order by created_at desc
limit 10;

select * from template_message_logs order by created_at desc limit 10;
select * from whatsapp_messages order by created_at desc limit 10;
```

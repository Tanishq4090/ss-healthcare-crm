-- 008_staff_id_cards_services_whatsapp.sql
-- SS Healthcare Admin OS: staff ID cards, business service catalog, staff assignment links,
-- and WhatsApp history/log support.

create extension if not exists pgcrypto;

drop table if exists public.lead_staff_assignments cascade;
drop table if exists public.whatsapp_messages cascade;

-- -----------------------------------------------------------------------------
-- 1) Service catalog extracted from SS Healthcare's public business website
-- -----------------------------------------------------------------------------
create table if not exists public.service_catalog (
  id text primary key,
  name text not null,
  category text not null default 'home_healthcare',
  description text,
  active boolean not null default true,
  display_order int not null default 100,
  created_at timestamptz not null default now()
);

insert into public.service_catalog (id, name, category, description, display_order)
values
  ('home_icu_trained_nursing_staff', 'Home ICU Trained Nursing Staff', 'nursing', 'ICU-trained nursing staff for home healthcare support.', 10),
  ('doctor_at_home', 'Doctor At Home / Doctor Visits', 'doctor', 'Doctor visit at home for examination, diagnosis, medication and treatment guidance.', 20),
  ('medical_attendant_elder_care', 'Medical Attendant (Elder Care)', 'attendant', 'Medical attendant support for elderly patients, hygiene, comfort, daily living and mobility.', 30),
  ('home_physiotherapy', 'Home Physiotherapy', 'physiotherapy', 'Physiotherapy at home to restore mobility, improve muscle strength and functional ability.', 40),
  ('ambulance_24_7', 'Ambulance Service (24/7)', 'ambulance', '24/7 ambulance support for sick or injured patients.', 50),
  ('dressing_at_home', 'All Type Of Dressing at Home', 'procedure', 'Home dressing and wound-care support.', 60),
  ('catheterization_at_home', 'Catherization at Home', 'procedure', 'Catheterization support at home.', 70),
  ('injections_at_home', 'IV / IM / IC Injections at Home', 'procedure', 'Intravenous, intramuscular and other injection support at home.', 80),
  ('baby_sitter', 'Baby Sitter', 'baby_care', 'Baby sitter / newborn baby care support at home.', 90),
  ('medical_equipment', 'Medical Equipment', 'equipment', 'Medical equipment support for home healthcare.', 100),
  ('nursing_care_at_home', 'Nursing Care at Home', 'nursing', 'Skilled nursing care at home.', 110),
  ('caretaker_service_at_home', 'Caretaker Service at Home', 'caretaker', 'Caretaker support for patients and families at home.', 120),
  ('occupational_therapy', 'Occupational Therapy', 'therapy', 'Occupational therapy support as part of home healthcare.', 130),
  ('daily_living_assistance', 'Assistance with Daily Living Activities', 'attendant', 'Support with day-to-day activities and patient comfort.', 140)
on conflict (id) do update set
  name = excluded.name,
  category = excluded.category,
  description = excluded.description,
  active = true,
  display_order = excluded.display_order;

-- -----------------------------------------------------------------------------
-- 2) Employee identity / ID card fields
-- -----------------------------------------------------------------------------
create sequence if not exists public.employee_code_seq start with 1 increment by 1;

alter table public.employees add column if not exists employee_code text;
alter table public.employees add column if not exists id_card_token uuid default gen_random_uuid();
alter table public.employees add column if not exists id_card_url text;
alter table public.employees add column if not exists job_title text;
alter table public.employees add column if not exists service_skills text[] not null default '{}';
alter table public.employees add column if not exists aadhaar text;
alter table public.employees add column if not exists date_of_birth date;
alter table public.employees add column if not exists residential_address text;
alter table public.employees add column if not exists experience text;
alter table public.employees add column if not exists payment_scheme text default 'Daily Rate';
alter table public.employees add column if not exists daily_rate numeric(12,2) default 0;
alter table public.employees add column if not exists id_documents jsonb not null default '[]'::jsonb;
alter table public.employees add column if not exists status text not null default 'active';

update public.employees
set employee_code = 'EMP-' || lpad(nextval('public.employee_code_seq')::text, 6, '0')
where employee_code is null or employee_code = '';

update public.employees
set id_card_token = gen_random_uuid()
where id_card_token is null;

update public.employees
set job_title = coalesce(nullif(job_title, ''), nullif(position, ''), 'Care Specialist')
where job_title is null or job_title = '';

update public.employees
set id_card_url = '/staff-id/' || id_card_token::text
where id_card_url is null or id_card_url = '';

create unique index if not exists employees_employee_code_uidx on public.employees(employee_code);
create unique index if not exists employees_id_card_token_uidx on public.employees(id_card_token);

create or replace function public.set_employee_identity_defaults()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.employee_code is null or new.employee_code = '' then
    new.employee_code := 'EMP-' || lpad(nextval('public.employee_code_seq')::text, 6, '0');
  end if;

  if new.id_card_token is null then
    new.id_card_token := gen_random_uuid();
  end if;

  if new.job_title is null or new.job_title = '' then
    new.job_title := coalesce(nullif(new.position, ''), 'Care Specialist');
  end if;

  if new.id_card_url is null or new.id_card_url = '' then
    new.id_card_url := '/staff-id/' || new.id_card_token::text;
  end if;

  if new.status is null or new.status = '' then
    new.status := 'active';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_set_employee_identity_defaults on public.employees;
create trigger trg_set_employee_identity_defaults
before insert or update on public.employees
for each row execute function public.set_employee_identity_defaults();

-- -----------------------------------------------------------------------------
-- 3) CRM lead assignment fields
-- -----------------------------------------------------------------------------
alter table public.crm_leads add column if not exists assigned_staff_id uuid;
alter table public.crm_leads add column if not exists assigned_staff_name text;
alter table public.crm_leads add column if not exists assigned_staff_phone text;
alter table public.crm_leads add column if not exists assigned_staff_code text;
alter table public.crm_leads add column if not exists staff_id_card_url text;
alter table public.crm_leads add column if not exists service_type text;
alter table public.crm_leads add column if not exists service_skills text[] not null default '{}';
alter table public.crm_leads add column if not exists last_template_sent text;
alter table public.crm_leads add column if not exists last_template_sent_at timestamptz;

create table if not exists public.lead_staff_assignments (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null,
  employee_id uuid not null,
  employee_code text,
  employee_name text not null,
  employee_phone text,
  employee_job_title text,
  id_card_url text,
  assignment_status text not null default 'assigned',
  assigned_by text,
  created_at timestamptz not null default now()
);

create index if not exists lead_staff_assignments_lead_idx on public.lead_staff_assignments(lead_id);
create index if not exists lead_staff_assignments_employee_idx on public.lead_staff_assignments(employee_id);

-- -----------------------------------------------------------------------------
-- 4) WhatsApp history/log layer for CRM demo and future Meta API sync
-- -----------------------------------------------------------------------------
create table if not exists public.whatsapp_messages (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid,
  phone text not null,
  direction text not null check (direction in ('inbound', 'outbound')),
  message_type text not null default 'text',
  template_name text,
  content text not null,
  status text not null default 'sent',
  meta_message_id text,
  sent_by text,
  created_at timestamptz not null default now()
);

create index if not exists whatsapp_messages_lead_idx on public.whatsapp_messages(lead_id);
create index if not exists whatsapp_messages_phone_idx on public.whatsapp_messages(phone);
create index if not exists whatsapp_messages_created_idx on public.whatsapp_messages(created_at desc);

create table if not exists public.template_message_logs (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid,
  phone text not null,
  template_name text not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'logged',
  provider text not null default 'demo_wa_me',
  sent_by text,
  created_at timestamptz not null default now()
);

create index if not exists template_message_logs_lead_idx on public.template_message_logs(lead_id);
create index if not exists template_message_logs_created_idx on public.template_message_logs(created_at desc);

create table if not exists public.whatsapp_templates (
  id text primary key,
  label text not null,
  category text not null default 'utility',
  body text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.whatsapp_templates (id, label, category, body)
values
  ('inquiry_received', 'Inquiry Received', 'utility', 'Namaste {{name}} ji, thank you for contacting SS Health Care. We have received your inquiry for {{service}} and our team will contact you shortly.'),
  ('quotation_sent', 'Quotation Sent', 'utility', 'Namaste {{name}} ji, your quotation for {{service}} is ready. Estimated monthly amount: {{amount}}. Please reply if you would like to proceed.'),
  ('form_submitted', 'Form Submitted', 'utility', 'Namaste {{name}} ji, we have received your form. Our care coordinator will verify the details and move to staff assignment.'),
  ('staff_assigned', 'Staff Assigned With ID Card', 'utility', 'Good news {{name}} ji. We have assigned {{staff_name}} ({{staff_role}}) for your service. Please verify the staff ID card here: {{id_card_url}}'),
  ('deposit_pending', 'Deposit Pending', 'utility', 'Namaste {{name}} ji, your deposit is pending. Once deposit is completed, we will confirm your service start.'),
  ('monthly_billing', 'Monthly Billing', 'utility', 'Namaste {{name}} ji, your monthly bill for {{month}} is ready. Amount: {{amount}}. Please contact SS Health Care for payment details.'),
  ('general_followup', 'General Follow-up', 'utility', 'Namaste {{name}} ji, this is a follow-up from SS Health Care regarding your home healthcare service inquiry.')
on conflict (id) do update set
  label = excluded.label,
  category = excluded.category,
  body = excluded.body,
  active = true,
  updated_at = now();

-- -----------------------------------------------------------------------------
-- 5) Staff assignment RPC used by CRM Pipeline
-- -----------------------------------------------------------------------------
create or replace function public.assign_staff_to_lead(
  p_lead_id uuid,
  p_employee_id uuid,
  p_sent_by text default 'admin'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_emp record;
  v_lead record;
  v_assignment_id uuid;
  v_id_url text;
begin
  select * into v_emp
  from public.employees
  where id = p_employee_id;

  if not found then
    raise exception 'Employee not found: %', p_employee_id;
  end if;

  select * into v_lead
  from public.crm_leads
  where id = p_lead_id;

  if not found then
    raise exception 'Lead not found: %', p_lead_id;
  end if;

  v_id_url := coalesce(v_emp.id_card_url, '/staff-id/' || v_emp.id_card_token::text);

  insert into public.lead_staff_assignments (
    lead_id,
    employee_id,
    employee_code,
    employee_name,
    employee_phone,
    employee_job_title,
    id_card_url,
    assigned_by
  ) values (
    p_lead_id,
    p_employee_id,
    v_emp.employee_code,
    coalesce(v_emp.full_name, v_emp.username, 'Staff'),
    v_emp.phone,
    coalesce(v_emp.job_title, v_emp.position, 'Care Specialist'),
    v_id_url,
    p_sent_by
  ) returning id into v_assignment_id;

  update public.crm_leads
  set
    assigned_staff_id = p_employee_id,
    assigned_staff_name = coalesce(v_emp.full_name, v_emp.username, 'Staff'),
    assigned_staff_phone = v_emp.phone,
    assigned_staff_code = v_emp.employee_code,
    staff_id_card_url = v_id_url,
    assignee = coalesce(v_emp.full_name, v_emp.username, assignee),
    stage = 'staff-assigned'
  where id = p_lead_id;

  return jsonb_build_object(
    'ok', true,
    'assignment_id', v_assignment_id,
    'lead_id', p_lead_id,
    'employee_id', p_employee_id,
    'employee_name', coalesce(v_emp.full_name, v_emp.username, 'Staff'),
    'employee_code', v_emp.employee_code,
    'id_card_url', v_id_url
  );
end;
$$;

-- -----------------------------------------------------------------------------
-- 6) Template logging RPC used until Meta WhatsApp API is connected
-- -----------------------------------------------------------------------------
create or replace function public.log_whatsapp_template_message(
  p_lead_id uuid,
  p_phone text,
  p_template_name text,
  p_content text,
  p_payload jsonb default '{}'::jsonb,
  p_sent_by text default 'admin'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_log_id uuid;
  v_message_id uuid;
begin
  insert into public.template_message_logs (lead_id, phone, template_name, payload, status, provider, sent_by)
  values (p_lead_id, p_phone, p_template_name, p_payload, 'logged', 'demo_wa_me', p_sent_by)
  returning id into v_log_id;

  insert into public.whatsapp_messages (lead_id, phone, direction, message_type, template_name, content, status, sent_by)
  values (p_lead_id, p_phone, 'outbound', 'template', p_template_name, p_content, 'sent', p_sent_by)
  returning id into v_message_id;

  update public.crm_leads
  set last_template_sent = p_template_name,
      last_template_sent_at = now()
  where id = p_lead_id;

  return jsonb_build_object('ok', true, 'template_log_id', v_log_id, 'message_id', v_message_id);
end;
$$;

-- -----------------------------------------------------------------------------
-- 7) Storage buckets for demo assets
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('staff-assets', 'staff-assets', true)
on conflict (id) do update set public = true;

-- Demo-friendly policies. Tighten these when Supabase Auth is fully enforced.
drop policy if exists "staff_assets_public_select" on storage.objects;
create policy "staff_assets_public_select"
on storage.objects for select
using (bucket_id = 'staff-assets');

drop policy if exists "staff_assets_demo_insert" on storage.objects;
create policy "staff_assets_demo_insert"
on storage.objects for insert
with check (bucket_id = 'staff-assets');

drop policy if exists "staff_assets_demo_update" on storage.objects;
create policy "staff_assets_demo_update"
on storage.objects for update
using (bucket_id = 'staff-assets')
with check (bucket_id = 'staff-assets');

-- -----------------------------------------------------------------------------
-- 8) Seed WhatsApp history for demo leads if phone exists
-- -----------------------------------------------------------------------------
insert into public.whatsapp_messages (lead_id, phone, direction, message_type, content, status, sent_by, created_at)
select id, coalesce(phone, '+917779006972'), 'outbound', 'text', 'Namaste, thank you for contacting SS Health Care. We have received your home healthcare inquiry.', 'sent', 'admin', now() - interval '2 hours'
from public.crm_leads
where phone is not null
order by created_at desc
limit 3
on conflict do nothing;

insert into public.whatsapp_messages (lead_id, phone, direction, message_type, content, status, sent_by, created_at)
select id, coalesce(phone, '+917779006972'), 'inbound', 'text', 'Please share staff details and monthly charges.', 'received', null, now() - interval '90 minutes'
from public.crm_leads
where phone is not null
order by created_at desc
limit 3
on conflict do nothing;

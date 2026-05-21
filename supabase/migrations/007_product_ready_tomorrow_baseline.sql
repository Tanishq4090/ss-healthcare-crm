-- SS Healthcare Admin OS — Product-Ready Tomorrow Baseline
-- Safe/idempotent migration for demo readiness.
-- Run in Supabase SQL Editor.

create extension if not exists pgcrypto;

drop table if exists public.lead_staff_assignments cascade;
drop table if exists public.manual_attendance cascade;
drop table if exists public.template_message_logs cascade;

-- 1) Employees / staff directory ------------------------------------------------
create table if not exists public.employees (
  id uuid primary key default gen_random_uuid(),
  username text,
  full_name text not null,
  role text default 'user',
  position text,
  department text,
  phone text,
  email text,
  address text,
  experience text,
  gender text,
  shift_hours numeric default 8,
  join_date date default current_date,
  photo_url text,
  accesses text[] default array['dashboard','crm','clients','hr']::text[],
  status text default 'active',
  is_available boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.employees add column if not exists username text;
alter table public.employees add column if not exists full_name text;
alter table public.employees add column if not exists role text default 'user';
alter table public.employees add column if not exists position text;
alter table public.employees add column if not exists department text;
alter table public.employees add column if not exists phone text;
alter table public.employees add column if not exists email text;
alter table public.employees add column if not exists address text;
alter table public.employees add column if not exists experience text;
alter table public.employees add column if not exists gender text;
alter table public.employees add column if not exists shift_hours numeric default 8;
alter table public.employees add column if not exists join_date date default current_date;
alter table public.employees add column if not exists photo_url text;
alter table public.employees add column if not exists accesses text[] default array['dashboard','crm','clients','hr']::text[];
alter table public.employees add column if not exists status text default 'active';
alter table public.employees add column if not exists is_available boolean default true;
alter table public.employees add column if not exists created_at timestamptz default now();
alter table public.employees add column if not exists updated_at timestamptz default now();

create unique index if not exists employees_username_unique_idx on public.employees (username) where username is not null;

-- 2) CRM leads / pipeline -------------------------------------------------------
create table if not exists public.crm_leads (
  id uuid primary key default gen_random_uuid(),
  client_name text not null,
  contact_person text,
  phone text,
  email text,
  address text,
  service_type text,
  service_start_date date,
  value numeric default 0,
  stage text default 'new-lead',
  priority text default 'Medium',
  assignee text,
  assigned_staff_id uuid,
  assigned_staff_name text,
  assigned_staff_phone text,
  tags text[] default '{}'::text[],
  notes text,
  source text default 'manual',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.crm_leads add column if not exists client_name text;
alter table public.crm_leads add column if not exists contact_person text;
alter table public.crm_leads add column if not exists phone text;
alter table public.crm_leads add column if not exists email text;
alter table public.crm_leads add column if not exists address text;
alter table public.crm_leads add column if not exists service_type text;
alter table public.crm_leads add column if not exists service_start_date date;
alter table public.crm_leads add column if not exists value numeric default 0;
alter table public.crm_leads add column if not exists stage text default 'new-lead';
alter table public.crm_leads add column if not exists priority text default 'Medium';
alter table public.crm_leads add column if not exists assignee text;
alter table public.crm_leads add column if not exists assigned_staff_id uuid;
alter table public.crm_leads add column if not exists assigned_staff_name text;
alter table public.crm_leads add column if not exists assigned_staff_phone text;
alter table public.crm_leads add column if not exists tags text[] default '{}'::text[];
alter table public.crm_leads add column if not exists notes text;
alter table public.crm_leads add column if not exists source text default 'manual';
alter table public.crm_leads add column if not exists created_at timestamptz default now();
alter table public.crm_leads add column if not exists updated_at timestamptz default now();

create index if not exists crm_leads_stage_idx on public.crm_leads (stage);
create index if not exists crm_leads_phone_idx on public.crm_leads (phone);
create index if not exists crm_leads_created_at_idx on public.crm_leads (created_at desc);

-- 3) Call inquiries / Call Leads ------------------------------------------------
create table if not exists public.call_inquiries (
  id uuid primary key default gen_random_uuid(),
  callyzer_call_id text unique,
  caller_number text,
  employee_name text,
  employee_number text,
  call_type text,
  call_started_at timestamptz,
  duration_seconds integer default 0,
  summary text,
  intent text,
  captured_name text,
  captured_phone text,
  captured_service_type text,
  captured_location text,
  captured_budget text,
  urgency text default 'medium',
  transcript text,
  recording_path text,
  recording_public_url text,
  review_status text default 'new',
  lead_id uuid,
  raw_payload jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.call_inquiries add column if not exists callyzer_call_id text;
alter table public.call_inquiries add column if not exists caller_number text;
alter table public.call_inquiries add column if not exists employee_name text;
alter table public.call_inquiries add column if not exists employee_number text;
alter table public.call_inquiries add column if not exists call_type text;
alter table public.call_inquiries add column if not exists call_started_at timestamptz;
alter table public.call_inquiries add column if not exists duration_seconds integer default 0;
alter table public.call_inquiries add column if not exists summary text;
alter table public.call_inquiries add column if not exists intent text;
alter table public.call_inquiries add column if not exists captured_name text;
alter table public.call_inquiries add column if not exists captured_phone text;
alter table public.call_inquiries add column if not exists captured_service_type text;
alter table public.call_inquiries add column if not exists captured_location text;
alter table public.call_inquiries add column if not exists captured_budget text;
alter table public.call_inquiries add column if not exists urgency text default 'medium';
alter table public.call_inquiries add column if not exists transcript text;
alter table public.call_inquiries add column if not exists recording_path text;
alter table public.call_inquiries add column if not exists recording_public_url text;
alter table public.call_inquiries add column if not exists review_status text default 'new';
alter table public.call_inquiries add column if not exists lead_id uuid;
alter table public.call_inquiries add column if not exists raw_payload jsonb default '{}'::jsonb;
alter table public.call_inquiries add column if not exists created_at timestamptz default now();
alter table public.call_inquiries add column if not exists updated_at timestamptz default now();

create unique index if not exists call_inquiries_callyzer_call_id_unique_idx on public.call_inquiries (callyzer_call_id) where callyzer_call_id is not null;
create index if not exists call_inquiries_review_status_idx on public.call_inquiries (review_status);
create index if not exists call_inquiries_created_at_idx on public.call_inquiries (created_at desc);

-- 4) Staff assignment history ---------------------------------------------------
create table if not exists public.lead_staff_assignments (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null,
  staff_id uuid,
  staff_name text,
  staff_phone text,
  assigned_by text default 'admin',
  assignment_status text default 'assigned',
  notes text,
  created_at timestamptz default now()
);

create index if not exists lead_staff_assignments_lead_id_idx on public.lead_staff_assignments (lead_id);
create index if not exists lead_staff_assignments_staff_id_idx on public.lead_staff_assignments (staff_id);

-- 5) Template message action logs ---------------------------------------------
create table if not exists public.template_message_logs (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid,
  call_inquiry_id uuid,
  recipient_phone text,
  recipient_name text,
  template_key text not null,
  template_label text,
  message_body text,
  channel text default 'whatsapp_demo',
  provider text default 'wa_me_link',
  status text default 'logged',
  meta_message_id text,
  error_message text,
  sent_by text default 'admin',
  created_at timestamptz default now()
);

create index if not exists template_message_logs_lead_id_idx on public.template_message_logs (lead_id);
create index if not exists template_message_logs_created_at_idx on public.template_message_logs (created_at desc);

-- 6) Manual attendance ----------------------------------------------------------
create table if not exists public.manual_attendance (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid,
  employee_name text,
  attendance_date date default current_date,
  status text default 'present',
  check_in time,
  check_out time,
  total_hours numeric default 0,
  notes text,
  marked_by text default 'admin',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists manual_attendance_date_idx on public.manual_attendance (attendance_date desc);
create index if not exists manual_attendance_employee_id_idx on public.manual_attendance (employee_id);

-- 7) Storage bucket -------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('call-recordings', 'call-recordings', false)
on conflict (id) do nothing;

-- 8) RPC: convert call inquiry to CRM lead -------------------------------------
drop function if exists public.add_call_inquiry_to_pipeline(uuid);
create or replace function public.add_call_inquiry_to_pipeline(p_call_id uuid)
returns uuid
language plpgsql
security definer
as $$
declare
  v_call record;
  v_lead_id uuid;
begin
  select * into v_call
  from public.call_inquiries
  where id = p_call_id;

  if not found then
    raise exception 'Call inquiry not found: %', p_call_id;
  end if;

  if v_call.lead_id is not null then
    return v_call.lead_id;
  end if;

  insert into public.crm_leads (
    client_name,
    contact_person,
    phone,
    address,
    service_type,
    stage,
    priority,
    assignee,
    tags,
    notes,
    source,
    created_at,
    updated_at
  ) values (
    coalesce(nullif(v_call.captured_name, ''), 'Unknown Caller'),
    coalesce(nullif(v_call.captured_name, ''), 'Unknown Caller'),
    coalesce(nullif(v_call.captured_phone, ''), v_call.caller_number),
    v_call.captured_location,
    v_call.captured_service_type,
    case when v_call.intent is not null then 'new-inquiry' else 'new-lead' end,
    case
      when lower(coalesce(v_call.urgency, '')) in ('urgent','high','very high') then 'High'
      when lower(coalesce(v_call.urgency, '')) in ('low') then 'Low'
      else 'Medium'
    end,
    coalesce(v_call.employee_name, 'Unassigned'),
    array['Call Inquiry','Callyzer','Healthcare Inquiry']::text[],
    concat_ws(E'\n',
      'Source: Manual call review via Callyzer/demo call lead',
      'Call ID: ' || coalesce(v_call.callyzer_call_id, v_call.id::text),
      'Caller: ' || coalesce(v_call.caller_number, 'Unknown'),
      'Intent: ' || coalesce(v_call.intent, 'Not captured'),
      'Summary: ' || coalesce(v_call.summary, 'No summary'),
      'Transcript: ' || left(coalesce(v_call.transcript, ''), 1200)
    ),
    'call_review',
    now(),
    now()
  ) returning id into v_lead_id;

  update public.call_inquiries
  set review_status = 'added_to_pipeline',
      lead_id = v_lead_id,
      updated_at = now()
  where id = p_call_id;

  return v_lead_id;
end;
$$;

-- 9) RPC: assign staff to lead --------------------------------------------------
create or replace function public.assign_staff_to_lead(
  p_lead_id uuid,
  p_staff_id uuid,
  p_assigned_by text default 'admin',
  p_notes text default null
)
returns uuid
language plpgsql
security definer
as $$
declare
  v_staff record;
  v_assignment_id uuid;
begin
  select id, full_name, phone into v_staff
  from public.employees
  where id = p_staff_id;

  if not found then
    raise exception 'Staff not found: %', p_staff_id;
  end if;

  update public.crm_leads
  set assigned_staff_id = v_staff.id,
      assigned_staff_name = v_staff.full_name,
      assigned_staff_phone = v_staff.phone,
      assignee = v_staff.full_name,
      stage = 'staff-assigned',
      updated_at = now()
  where id = p_lead_id;

  insert into public.lead_staff_assignments (
    lead_id, staff_id, staff_name, staff_phone, assigned_by, notes
  ) values (
    p_lead_id, v_staff.id, v_staff.full_name, v_staff.phone, p_assigned_by, p_notes
  ) returning id into v_assignment_id;

  return v_assignment_id;
end;
$$;

-- 10) Demo-ready seed data ------------------------------------------------------
insert into public.employees (username, full_name, role, position, department, phone, email, experience, gender, shift_hours, accesses, status, is_available)
select 'rina_staff', 'Rina Staff', 'user', 'Home Care Attendant', 'Home Care', '+919876543210', 'rina.staff@example.com', '3 years', 'Female', 12, array['dashboard','crm','clients','hr']::text[], 'active', true
where not exists (select 1 from public.employees where username = 'rina_staff');

insert into public.employees (username, full_name, role, position, department, phone, email, experience, gender, shift_hours, accesses, status, is_available)
select 'mahesh_nurse', 'Mahesh Nurse', 'user', 'Nursing Assistant', 'Nursing', '+919812345670', 'mahesh.nurse@example.com', '5 years', 'Male', 8, array['dashboard','crm','clients','hr']::text[], 'active', true
where not exists (select 1 from public.employees where username = 'mahesh_nurse');

insert into public.employees (username, full_name, role, position, department, phone, email, experience, gender, shift_hours, accesses, status, is_available)
select 'aarti_caregiver', 'Aarti Caregiver', 'user', 'Caregiver', 'Old Age Care', '+919998887776', 'aarti.caregiver@example.com', '2 years', 'Female', 24, array['dashboard','crm','clients','hr']::text[], 'active', true
where not exists (select 1 from public.employees where username = 'aarti_caregiver');

insert into public.call_inquiries (
  callyzer_call_id, caller_number, employee_name, employee_number, call_type, call_started_at,
  duration_seconds, summary, intent, captured_name, captured_phone, captured_service_type,
  captured_location, captured_budget, urgency, transcript, review_status, raw_payload
)
select
  'demo-call-ss-001', '+919999888877', 'Rina Staff', '+919876543210', 'incoming', now() - interval '35 minutes',
  184,
  'Caller asked for a female caretaker for old-age home support in Surat. Service required from next week. Budget discussion pending.',
  'Old age care inquiry',
  'Mehul Patel', '+919999888877', 'Old Age Care', 'Adajan, Surat', 'Budget pending', 'medium',
  'Employee: Hello, SS Healthcare. How can I help you? Caller: I need a caretaker for my father in Adajan. He needs support during the day. Employee: When do you want to start? Caller: From next week. Employee: We can arrange available staff and share details after review.',
  'new',
  '{"source":"demo_seed","provider":"callyzer_demo"}'::jsonb
where not exists (select 1 from public.call_inquiries where callyzer_call_id = 'demo-call-ss-001');

insert into public.call_inquiries (
  callyzer_call_id, caller_number, employee_name, employee_number, call_type, call_started_at,
  duration_seconds, summary, intent, captured_name, captured_phone, captured_service_type,
  captured_location, captured_budget, urgency, transcript, review_status, raw_payload
)
select
  'demo-call-ss-002', '+919812341234', 'Mahesh Nurse', '+919812345670', 'incoming', now() - interval '3 hours',
  245,
  'Caller requested nursing support for injection and post-surgery care. Needs quotation and service confirmation today.',
  'Nursing care urgent inquiry',
  'Priya Shah', '+919812341234', 'Nursing Care', 'Vesu, Surat', '₹25,000 monthly expected', 'high',
  'Caller: We need a nurse for my mother after surgery. Employee: Is this daily or full-time? Caller: Daily visit plus support for injections. Employee: We will send quotation and confirm availability.',
  'new',
  '{"source":"demo_seed","provider":"callyzer_demo"}'::jsonb
where not exists (select 1 from public.call_inquiries where callyzer_call_id = 'demo-call-ss-002');

insert into public.crm_leads (client_name, contact_person, phone, address, service_type, value, stage, priority, assignee, tags, notes, source)
select 'Sharma Family', 'Rajesh Sharma', '+919700001111', 'Athwa, Surat', 'Baby Care', 22000, 'new-lead', 'Medium', 'Admin', array['Manual','Baby Care']::text[], 'Demo lead: family asked for baby care support.', 'demo_seed'
where not exists (select 1 from public.crm_leads where phone = '+919700001111');

insert into public.crm_leads (client_name, contact_person, phone, address, service_type, value, stage, priority, assignee, tags, notes, source)
select 'Desai Family', 'Kiran Desai', '+919700002222', 'City Light, Surat', 'Japa Care', 30000, 'in-discussion', 'High', 'Rina Staff', array['Japa Care','Follow-up']::text[], 'Demo lead: pricing and staff availability discussion ongoing.', 'demo_seed'
where not exists (select 1 from public.crm_leads where phone = '+919700002222');

insert into public.crm_leads (client_name, contact_person, phone, address, service_type, value, stage, priority, assignee, tags, notes, source)
select 'Patel Family', 'Mehul Patel', '+919700003333', 'Adajan, Surat', 'Old Age Care', 28000, 'quotation-sent', 'Medium', 'Mahesh Nurse', array['Old Age Care','Quotation']::text[], 'Demo lead: quotation sent, waiting for confirmation.', 'demo_seed'
where not exists (select 1 from public.crm_leads where phone = '+919700003333');

insert into public.crm_leads (client_name, contact_person, phone, address, service_type, value, stage, priority, assignee, assigned_staff_id, assigned_staff_name, assigned_staff_phone, tags, notes, source)
select 'Shah Family', 'Priya Shah', '+919700004444', 'Vesu, Surat', 'Nursing Care', 35000, 'active-client', 'High', e.full_name, e.id, e.full_name, e.phone, array['Nursing','Active']::text[], 'Demo active client with assigned staff.', 'demo_seed'
from public.employees e
where e.username = 'mahesh_nurse'
and not exists (select 1 from public.crm_leads where phone = '+919700004444');

insert into public.template_message_logs (recipient_phone, recipient_name, template_key, template_label, message_body, status, sent_by)
select '+919700003333', 'Mehul Patel', 'quotation_sent', 'Quotation Sent', 'Demo log: quotation template action created from CRM.', 'logged', 'admin'
where not exists (select 1 from public.template_message_logs where recipient_phone = '+919700003333' and template_key = 'quotation_sent');

-- 005_live_product_ops_hardening.sql
-- Purpose: make SS Healthcare Admin OS behave like a live operational product, not a static shell.
-- Safe to run multiple times.

create extension if not exists pgcrypto;

create table if not exists public.crm_leads (
  id uuid primary key default gen_random_uuid(),
  client_name text not null default 'Unnamed Lead',
  contact_person text,
  phone text,
  email text,
  address text,
  stage text not null default 'new-lead',
  priority text not null default 'Medium',
  value numeric not null default 0,
  assignee text default 'Unassigned',
  tags text[] default '{}',
  notes text,
  source text default 'manual',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.crm_leads add column if not exists source text default 'manual';
alter table public.crm_leads add column if not exists updated_at timestamptz default now();
alter table public.crm_leads add column if not exists tags text[] default '{}';

create table if not exists public.call_inquiries (
  id uuid primary key default gen_random_uuid(),
  external_call_id text unique,
  caller_number text not null,
  caller_name text,
  employee_name text,
  employee_number text,
  call_type text,
  call_status text,
  duration_seconds integer default 0,
  call_started_at timestamptz,
  recording_url text,
  recording_path text,
  recording_uploaded_at timestamptz,
  transcript text,
  summary text,
  extracted_patient_name text,
  extracted_service text,
  extracted_location text,
  extracted_urgency text,
  extracted_preferred_time text,
  extracted_budget text,
  extracted_language text,
  review_notes text,
  review_status text not null default 'new',
  lead_id uuid references public.crm_leads(id),
  raw_payload jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.manual_attendance (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null,
  employee_name text,
  work_date date not null default current_date,
  status text not null default 'present',
  check_in_time text,
  check_out_time text,
  hours_worked numeric default 0,
  notes text,
  marked_by text default 'admin',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(employee_id, work_date)
);

create table if not exists public.live_activity_log (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid,
  action text not null,
  message text,
  created_by text default 'system',
  created_at timestamptz not null default now()
);

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_crm_leads_touch on public.crm_leads;
create trigger trg_crm_leads_touch before update on public.crm_leads for each row execute function public.touch_updated_at();

drop trigger if exists trg_call_inquiries_touch on public.call_inquiries;
create trigger trg_call_inquiries_touch before update on public.call_inquiries for each row execute function public.touch_updated_at();

drop trigger if exists trg_manual_attendance_touch on public.manual_attendance;
create trigger trg_manual_attendance_touch before update on public.manual_attendance for each row execute function public.touch_updated_at();

drop function if exists public.add_call_inquiry_to_pipeline(uuid);
create or replace function public.add_call_inquiry_to_pipeline(p_call_id uuid)
returns jsonb
language plpgsql
security definer
as $$
declare
  c record;
  new_lead_id uuid;
begin
  select * into c from public.call_inquiries where id = p_call_id;
  if not found then
    raise exception 'Call inquiry not found: %', p_call_id;
  end if;

  if c.lead_id is not null then
    return jsonb_build_object('ok', true, 'lead_id', c.lead_id, 'already_added', true);
  end if;

  insert into public.crm_leads (
    client_name,
    contact_person,
    phone,
    address,
    stage,
    priority,
    value,
    assignee,
    tags,
    notes,
    source
  ) values (
    coalesce(nullif(c.extracted_patient_name, ''), nullif(c.caller_name, ''), c.caller_number, 'Call Inquiry'),
    coalesce(nullif(c.caller_name, ''), nullif(c.extracted_patient_name, ''), c.caller_number),
    c.caller_number,
    c.extracted_location,
    'new-lead',
    case
      when lower(coalesce(c.extracted_urgency, '')) in ('urgent','high','very high','emergency') then 'High'
      else 'Medium'
    end,
    0,
    coalesce(nullif(c.employee_name, ''), 'Unassigned'),
    array_remove(array['Call Inquiry','Callyzer','Healthcare Inquiry', c.extracted_service], null),
    concat_ws(E'\n',
      'Source: Manual call review via Callyzer',
      'Call ID: ' || c.id::text,
      'Caller: ' || coalesce(c.caller_number, 'unknown'),
      'Employee: ' || coalesce(c.employee_name, 'unknown'),
      'Service: ' || coalesce(c.extracted_service, 'not specified'),
      'Location: ' || coalesce(c.extracted_location, 'not specified'),
      'Urgency: ' || coalesce(c.extracted_urgency, 'not specified'),
      'Preferred time: ' || coalesce(c.extracted_preferred_time, 'not specified'),
      'Review notes: ' || coalesce(c.review_notes, ''),
      'Transcript: ' || left(coalesce(c.transcript, ''), 2000)
    ),
    'callyzer_call_review'
  ) returning id into new_lead_id;

  update public.call_inquiries
  set review_status = 'added_to_pipeline', lead_id = new_lead_id, updated_at = now()
  where id = p_call_id;

  insert into public.live_activity_log(entity_type, entity_id, action, message)
  values ('call_inquiry', p_call_id, 'added_to_pipeline', 'Call inquiry converted into CRM lead ' || new_lead_id::text);

  return jsonb_build_object('ok', true, 'lead_id', new_lead_id, 'already_added', false);
end;
$$;

insert into storage.buckets (id, name, public)
values ('call-recordings', 'call-recordings', false)
on conflict (id) do nothing;

-- Dev/demo policies. Tighten these before production multi-user rollout.
alter table public.crm_leads enable row level security;
alter table public.call_inquiries enable row level security;
alter table public.manual_attendance enable row level security;
alter table public.live_activity_log enable row level security;

do $$ begin
  create policy "dev read crm_leads" on public.crm_leads for select using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "dev write crm_leads" on public.crm_leads for all using (true) with check (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "dev read call_inquiries" on public.call_inquiries for select using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "dev write call_inquiries" on public.call_inquiries for all using (true) with check (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "dev read manual_attendance" on public.manual_attendance for select using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "dev write manual_attendance" on public.manual_attendance for all using (true) with check (true);
exception when duplicate_object then null; end $$;

create or replace view public.live_admin_dashboard_v as
select
  (select count(*) from public.crm_leads) as total_leads,
  (select count(*) from public.call_inquiries where review_status = 'new') as pending_calls,
  (select count(*) from public.call_inquiries where review_status = 'added_to_pipeline') as converted_calls,
  (select count(*) from public.manual_attendance where work_date = current_date and status = 'present') as present_today,
  (select coalesce(sum(value), 0) from public.crm_leads) as pipeline_value;

-- SS Healthcare CRM — Callyzer Option B Manual Call Review
-- Purpose:
-- 1) Sync Callyzer call logs through API/Webhook.
-- 2) Store calls in a manual review inbox first.
-- 3) Allow staff to upload selected recordings into Supabase Storage.
-- 4) Convert only reviewed/approved calls into crm_leads.

create extension if not exists pgcrypto;

-- Core call review table.
create table if not exists public.call_inquiries (
  id uuid primary key default gen_random_uuid(),

  provider text not null default 'callyzer',
  provider_call_id text,
  employee_name text,
  employee_phone text,

  caller_phone text not null,
  caller_name text,

  call_type text not null default 'unknown',
  call_status text,
  call_started_at timestamptz,
  duration_seconds integer not null default 0,

  -- Callyzer may or may not provide this depending on plan/config.
  recording_source_url text,

  -- Supabase Storage path inside bucket call-recordings.
  recording_storage_path text,

  transcript text,
  transcript_status text not null default 'not_started',

  extracted_patient_name text,
  extracted_service_required text,
  extracted_location text,
  extracted_urgency text not null default 'Medium',
  extracted_preferred_time text,
  extracted_budget text,
  extracted_notes text,

  review_status text not null default 'new'
    check (review_status in ('new', 'in_review', 'qualified', 'rejected', 'added_to_pipeline')),
  review_notes text,

  added_to_pipeline_at timestamptz,
  crm_lead_id text,

  raw_payload jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (provider, provider_call_id)
);

create index if not exists idx_call_inquiries_review_status
  on public.call_inquiries (review_status);

create index if not exists idx_call_inquiries_started_at
  on public.call_inquiries (call_started_at desc);

create index if not exists idx_call_inquiries_caller_phone
  on public.call_inquiries (caller_phone);

create table if not exists public.call_inquiry_events (
  id uuid primary key default gen_random_uuid(),
  call_inquiry_id uuid not null references public.call_inquiries(id) on delete cascade,
  event_type text not null,
  event_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_call_inquiries_updated_at on public.call_inquiries;
create trigger trg_call_inquiries_updated_at
before update on public.call_inquiries
for each row
execute function public.set_updated_at();

-- Minimal CRM compatibility layer.
-- If crm_leads already exists, this only adds nullable columns used by this module.
-- If crm_leads does not exist yet, this creates a compatible baseline table for AICRM.tsx.
create table if not exists public.crm_leads (
  id uuid primary key default gen_random_uuid(),
  client_name text,
  contact_person text,
  phone text,
  priority text not null default 'Medium',
  value numeric not null default 0,
  assigned_to text not null default 'Unassigned',
  stage text not null default 'new-lead',
  source text,
  notes text,
  tags text[] not null default '{}'::text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.crm_leads add column if not exists client_name text;
alter table public.crm_leads add column if not exists contact_person text;
alter table public.crm_leads add column if not exists phone text;
alter table public.crm_leads add column if not exists priority text default 'Medium';
alter table public.crm_leads add column if not exists value numeric default 0;
alter table public.crm_leads add column if not exists assigned_to text default 'Unassigned';
alter table public.crm_leads add column if not exists stage text default 'new-lead';
alter table public.crm_leads add column if not exists source text;
alter table public.crm_leads add column if not exists notes text;
alter table public.crm_leads add column if not exists tags text[] default '{}'::text[];
alter table public.crm_leads add column if not exists created_at timestamptz default now();
alter table public.crm_leads add column if not exists updated_at timestamptz default now();

drop trigger if exists trg_crm_leads_updated_at on public.crm_leads;
create trigger trg_crm_leads_updated_at
before update on public.crm_leads
for each row
execute function public.set_updated_at();

-- Server-side conversion function. The UI calls this RPC after manual review.
create or replace function public.convert_call_inquiry_to_crm_lead(p_call_inquiry_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_call public.call_inquiries%rowtype;
  v_lead_id text;
  v_notes text;
begin
  select *
  into v_call
  from public.call_inquiries
  where id = p_call_inquiry_id;

  if not found then
    raise exception 'Call inquiry not found: %', p_call_inquiry_id;
  end if;

  if v_call.review_status = 'added_to_pipeline' and v_call.crm_lead_id is not null then
    return v_call.crm_lead_id;
  end if;

  v_notes :=
    concat_ws(E'\n',
      'Source: Callyzer manual call review',
      'Caller Phone: ' || coalesce(v_call.caller_phone, ''),
      'Employee: ' || coalesce(v_call.employee_name, ''),
      'Call Type: ' || coalesce(v_call.call_type, ''),
      'Duration Seconds: ' || coalesce(v_call.duration_seconds::text, '0'),
      'Service Required: ' || coalesce(v_call.extracted_service_required, ''),
      'Location: ' || coalesce(v_call.extracted_location, ''),
      'Preferred Time: ' || coalesce(v_call.extracted_preferred_time, ''),
      'Budget: ' || coalesce(v_call.extracted_budget, ''),
      'Review Notes: ' || coalesce(v_call.review_notes, ''),
      'Transcript: ' || coalesce(left(v_call.transcript, 1200), '')
    );

  insert into public.crm_leads (
    client_name,
    contact_person,
    phone,
    priority,
    value,
    assigned_to,
    stage,
    source,
    notes,
    tags
  )
  values (
    coalesce(nullif(v_call.extracted_patient_name, ''), nullif(v_call.caller_name, ''), v_call.caller_phone),
    coalesce(nullif(v_call.extracted_patient_name, ''), nullif(v_call.caller_name, ''), v_call.caller_phone),
    v_call.caller_phone,
    coalesce(nullif(v_call.extracted_urgency, ''), 'Medium'),
    0,
    coalesce(nullif(v_call.employee_name, ''), 'Unassigned'),
    'new-lead',
    'callyzer-call',
    v_notes,
    array_remove(array[
      'Callyzer',
      'Manual Review',
      nullif(v_call.extracted_service_required, ''),
      nullif(v_call.extracted_urgency, '')
    ], null)
  )
  returning id::text into v_lead_id;

  update public.call_inquiries
  set
    review_status = 'added_to_pipeline',
    crm_lead_id = v_lead_id,
    added_to_pipeline_at = now()
  where id = p_call_inquiry_id;

  insert into public.call_inquiry_events (call_inquiry_id, event_type, event_payload)
  values (
    p_call_inquiry_id,
    'added_to_pipeline',
    jsonb_build_object('crm_lead_id', v_lead_id)
  );

  return v_lead_id;
end;
$$;

-- Private bucket for selected/qualified call recordings.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'call-recordings',
  'call-recordings',
  false,
  52428800,
  array[
    'audio/mpeg',
    'audio/mp3',
    'audio/mp4',
    'audio/wav',
    'audio/webm',
    'audio/ogg',
    'audio/x-m4a',
    'audio/aac',
    'application/octet-stream'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Policies are permissive for authenticated users because this app already has a protected admin shell.
-- Tighten these later if employee-level access control becomes required.
alter table public.call_inquiries enable row level security;
alter table public.call_inquiry_events enable row level security;

drop policy if exists "authenticated can read call inquiries" on public.call_inquiries;
create policy "authenticated can read call inquiries"
on public.call_inquiries for select
to authenticated
using (true);

drop policy if exists "authenticated can insert call inquiries" on public.call_inquiries;
create policy "authenticated can insert call inquiries"
on public.call_inquiries for insert
to authenticated
with check (true);

drop policy if exists "authenticated can update call inquiries" on public.call_inquiries;
create policy "authenticated can update call inquiries"
on public.call_inquiries for update
to authenticated
using (true)
with check (true);

drop policy if exists "authenticated can read call inquiry events" on public.call_inquiry_events;
create policy "authenticated can read call inquiry events"
on public.call_inquiry_events for select
to authenticated
using (true);

drop policy if exists "authenticated can insert call inquiry events" on public.call_inquiry_events;
create policy "authenticated can insert call inquiry events"
on public.call_inquiry_events for insert
to authenticated
with check (true);

drop policy if exists "authenticated can upload call recordings" on storage.objects;
create policy "authenticated can upload call recordings"
on storage.objects for insert
to authenticated
with check (bucket_id = 'call-recordings');

drop policy if exists "authenticated can read call recordings" on storage.objects;
create policy "authenticated can read call recordings"
on storage.objects for select
to authenticated
using (bucket_id = 'call-recordings');

drop policy if exists "authenticated can update call recordings" on storage.objects;
create policy "authenticated can update call recordings"
on storage.objects for update
to authenticated
using (bucket_id = 'call-recordings')
with check (bucket_id = 'call-recordings');

drop policy if exists "authenticated can delete call recordings" on storage.objects;
create policy "authenticated can delete call recordings"
on storage.objects for delete
to authenticated
using (bucket_id = 'call-recordings');

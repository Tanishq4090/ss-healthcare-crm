-- SS Healthcare CRM — Option B Manual Call Review
-- Callyzer Basic + API/Webhook logs calls automatically.
-- Recordings are uploaded manually into Supabase only for important/qualified calls.

create extension if not exists pgcrypto;

create table if not exists public.call_inquiries (
  id uuid primary key default gen_random_uuid(),
  source text not null default 'callyzer',
  external_call_id text unique,

  employee_name text,
  employee_number text,
  caller_name text,
  caller_number text not null,

  call_type text default 'unknown',
  call_status text default 'completed',
  call_started_at timestamptz,
  call_ended_at timestamptz,
  duration_seconds integer default 0,
  duration_label text,

  original_recording_url text,
  recording_bucket text default 'call-recordings',
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
  extracted_notes jsonb not null default '{}'::jsonb,

  review_status text not null default 'new'
    check (review_status in ('new', 'reviewed', 'added_to_pipeline', 'ignored')),
  review_notes text,
  lead_id text,
  pipeline_stage text default 'new-lead',

  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_call_inquiries_review_status on public.call_inquiries(review_status);
create index if not exists idx_call_inquiries_started_at on public.call_inquiries(call_started_at desc);
create index if not exists idx_call_inquiries_caller_number on public.call_inquiries(caller_number);
create index if not exists idx_call_inquiries_employee_number on public.call_inquiries(employee_number);

-- Normalize the existing crm_leads table enough for this feature to work.
-- These are additive and safe if the columns already exist.
do $$
begin
  if to_regclass('public.crm_leads') is not null then
    alter table public.crm_leads add column if not exists client_name text;
    alter table public.crm_leads add column if not exists contact_person text;
    alter table public.crm_leads add column if not exists phone text;
    alter table public.crm_leads add column if not exists stage text default 'new-lead';
    alter table public.crm_leads add column if not exists status text default 'new-lead';
    alter table public.crm_leads add column if not exists priority text default 'Medium';
    alter table public.crm_leads add column if not exists value numeric default 0;
    alter table public.crm_leads add column if not exists assignee text default 'Unassigned';
    alter table public.crm_leads add column if not exists due_date date;
    alter table public.crm_leads add column if not exists tags text[] default array[]::text[];
    alter table public.crm_leads add column if not exists notes text;
    alter table public.crm_leads add column if not exists created_at timestamptz default now();
    alter table public.crm_leads add column if not exists updated_at timestamptz default now();
  end if;
end $$;

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
for each row execute function public.set_updated_at();

-- Create private Supabase Storage bucket for manually uploaded important recordings.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'call-recordings',
  'call-recordings',
  false,
  52428800,
  array[
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/x-wav',
    'audio/webm',
    'audio/mp4',
    'audio/aac',
    'audio/ogg',
    'video/mp4',
    'application/octet-stream'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- RLS: keep simple for MVP. Tighten later once final staff roles are locked.
alter table public.call_inquiries enable row level security;

drop policy if exists "call_inquiries_authenticated_read" on public.call_inquiries;
create policy "call_inquiries_authenticated_read"
on public.call_inquiries for select
to authenticated
using (true);

drop policy if exists "call_inquiries_authenticated_insert" on public.call_inquiries;
create policy "call_inquiries_authenticated_insert"
on public.call_inquiries for insert
to authenticated
with check (true);

drop policy if exists "call_inquiries_authenticated_update" on public.call_inquiries;
create policy "call_inquiries_authenticated_update"
on public.call_inquiries for update
to authenticated
using (true)
with check (true);

-- Storage policies for authenticated staff/admin uploads and playback via signed URLs.
drop policy if exists "call_recordings_authenticated_upload" on storage.objects;
create policy "call_recordings_authenticated_upload"
on storage.objects for insert
to authenticated
with check (bucket_id = 'call-recordings');

drop policy if exists "call_recordings_authenticated_read" on storage.objects;
create policy "call_recordings_authenticated_read"
on storage.objects for select
to authenticated
using (bucket_id = 'call-recordings');

drop policy if exists "call_recordings_authenticated_update" on storage.objects;
create policy "call_recordings_authenticated_update"
on storage.objects for update
to authenticated
using (bucket_id = 'call-recordings')
with check (bucket_id = 'call-recordings');

-- Converts one reviewed call into crm_leads.
-- This assumes the current crm_leads table has the common SS Healthcare columns used by AICRM.tsx:
-- client_name/contact_person/phone/stage/status/priority/value/assignee/due_date/tags.
drop function if exists public.add_call_inquiry_to_pipeline(uuid);
create or replace function public.add_call_inquiry_to_pipeline(p_call_id uuid)
returns jsonb
language plpgsql
security definer
as $$
declare
  c public.call_inquiries%rowtype;
  new_lead_id text;
  lead_name text;
  service_label text;
  lead_tags text[];
begin
  select * into c from public.call_inquiries where id = p_call_id;

  if not found then
    raise exception 'Call inquiry not found: %', p_call_id;
  end if;

  if c.review_status = 'added_to_pipeline' and c.lead_id is not null then
    return jsonb_build_object('ok', true, 'already_added', true, 'lead_id', c.lead_id);
  end if;

  lead_name := coalesce(nullif(c.extracted_patient_name, ''), nullif(c.caller_name, ''), 'Call Lead ' || right(c.caller_number, 4));
  service_label := coalesce(nullif(c.extracted_service, ''), 'Healthcare Inquiry');
  lead_tags := array_remove(array['Call Inquiry', 'Callyzer', service_label, c.extracted_urgency], null);

  insert into public.crm_leads (
    client_name,
    contact_person,
    phone,
    stage,
    status,
    priority,
    value,
    assignee,
    due_date,
    tags,
    notes,
    created_at,
    updated_at
  ) values (
    lead_name,
    coalesce(nullif(c.caller_name, ''), lead_name),
    c.caller_number,
    'new-lead',
    'new-lead',
    case
      when lower(coalesce(c.extracted_urgency, '')) in ('urgent', 'high', 'very high', 'emergency') then 'High'
      else 'Medium'
    end,
    0,
    coalesce(nullif(c.employee_name, ''), 'Unassigned'),
    current_date,
    lead_tags,
    concat_ws(E'\n',
      'Source: Manual call review via Callyzer',
      'Call ID: ' || c.id::text,
      'Caller: ' || c.caller_number,
      'Service: ' || coalesce(c.extracted_service, 'Not specified'),
      'Location: ' || coalesce(c.extracted_location, 'Not specified'),
      'Preferred time: ' || coalesce(c.extracted_preferred_time, 'Not specified'),
      'Budget: ' || coalesce(c.extracted_budget, 'Not specified'),
      'Summary: ' || coalesce(c.summary, 'Not available'),
      'Review notes: ' || coalesce(c.review_notes, 'None')
    ),
    now(),
    now()
  ) returning id::text into new_lead_id;

  update public.call_inquiries
  set review_status = 'added_to_pipeline',
      lead_id = new_lead_id,
      pipeline_stage = 'new-lead',
      updated_at = now()
  where id = p_call_id;

  return jsonb_build_object('ok', true, 'already_added', false, 'lead_id', new_lead_id);
end;
$$;

grant execute on function public.add_call_inquiry_to_pipeline(uuid) to authenticated;

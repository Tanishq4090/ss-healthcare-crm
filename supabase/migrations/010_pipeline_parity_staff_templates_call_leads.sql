-- 006_pipeline_parity_staff_templates_call_leads.sql
-- SS Healthcare Admin OS: HealthCare admin parity for CRM pipeline, Callyzer call leads,
-- staff assignment, WhatsApp template logging, and Supabase recording storage.
-- Safe to run multiple times.

create extension if not exists pgcrypto;

-- -----------------------------------------------------------------------------
-- Helpers
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- Core CRM Leads
-- -----------------------------------------------------------------------------
create table if not exists public.crm_leads (
  id uuid primary key default gen_random_uuid(),
  client_name text not null default 'Unknown Client',
  contact_person text,
  phone text,
  email text,
  address text,
  stage text not null default 'new-lead',
  priority text not null default 'Medium',
  value numeric default 0,
  assignee text,
  assignee_id uuid,
  service_type text,
  source text default 'manual',
  tags text[] default '{}',
  notes text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.crm_leads add column if not exists contact_person text;
alter table public.crm_leads add column if not exists phone text;
alter table public.crm_leads add column if not exists email text;
alter table public.crm_leads add column if not exists address text;
alter table public.crm_leads add column if not exists stage text not null default 'new-lead';
alter table public.crm_leads add column if not exists priority text not null default 'Medium';
alter table public.crm_leads add column if not exists value numeric default 0;
alter table public.crm_leads add column if not exists assignee text;
alter table public.crm_leads add column if not exists assignee_id uuid;
alter table public.crm_leads add column if not exists service_type text;
alter table public.crm_leads add column if not exists source text default 'manual';
alter table public.crm_leads add column if not exists tags text[] default '{}';
alter table public.crm_leads add column if not exists notes text;
alter table public.crm_leads add column if not exists metadata jsonb not null default '{}';
alter table public.crm_leads add column if not exists created_at timestamptz not null default now();
alter table public.crm_leads add column if not exists updated_at timestamptz not null default now();

create index if not exists idx_crm_leads_stage on public.crm_leads(stage);
create index if not exists idx_crm_leads_phone on public.crm_leads(phone);
create index if not exists idx_crm_leads_created_at on public.crm_leads(created_at desc);

drop trigger if exists trg_crm_leads_updated_at on public.crm_leads;
create trigger trg_crm_leads_updated_at
before update on public.crm_leads
for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Employees / Staff
-- -----------------------------------------------------------------------------
create table if not exists public.employees (
  id uuid primary key default gen_random_uuid(),
  username text unique,
  full_name text not null,
  role text default 'user',
  position text,
  department text,
  phone text,
  email text,
  address text,
  gender text,
  experience text,
  skills text[] default '{}',
  languages text[] default '{}',
  availability_status text default 'available',
  shift_hours numeric default 8,
  join_date date,
  photo_url text,
  accesses text[] default '{dashboard,crm,clients,hr}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.employees add column if not exists username text;
alter table public.employees add column if not exists full_name text;
alter table public.employees add column if not exists role text default 'user';
alter table public.employees add column if not exists position text;
alter table public.employees add column if not exists department text;
alter table public.employees add column if not exists phone text;
alter table public.employees add column if not exists email text;
alter table public.employees add column if not exists address text;
alter table public.employees add column if not exists gender text;
alter table public.employees add column if not exists experience text;
alter table public.employees add column if not exists skills text[] default '{}';
alter table public.employees add column if not exists languages text[] default '{}';
alter table public.employees add column if not exists availability_status text default 'available';
alter table public.employees add column if not exists shift_hours numeric default 8;
alter table public.employees add column if not exists join_date date;
alter table public.employees add column if not exists photo_url text;
alter table public.employees add column if not exists accesses text[] default '{dashboard,crm,clients,hr}';
alter table public.employees add column if not exists created_at timestamptz not null default now();
alter table public.employees add column if not exists updated_at timestamptz not null default now();

create index if not exists idx_employees_availability on public.employees(availability_status);

drop trigger if exists trg_employees_updated_at on public.employees;
create trigger trg_employees_updated_at
before update on public.employees
for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Callyzer Call Leads / Review Inbox
-- -----------------------------------------------------------------------------
create table if not exists public.call_inquiries (
  id uuid primary key default gen_random_uuid(),
  external_call_id text unique,
  caller_number text,
  employee_name text,
  employee_number text,
  call_type text,
  call_direction text,
  call_status text,
  call_started_at timestamptz,
  duration_seconds int default 0,
  recording_url text,
  recording_path text,
  recording_storage_path text,
  recording_public_url text,
  transcript text,
  summary text,
  intent text,
  captured_name text,
  captured_phone text,
  captured_service text,
  captured_location text,
  captured_urgency text,
  captured_priority text default 'Medium',
  captured_budget text,
  captured_timing text,
  captured_notes text,
  extracted_data jsonb not null default '{}',
  review_status text not null default 'new',
  added_to_pipeline boolean not null default false,
  lead_id uuid,
  pipeline_lead_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.call_inquiries add column if not exists external_call_id text;
alter table public.call_inquiries add column if not exists caller_number text;
alter table public.call_inquiries add column if not exists employee_name text;
alter table public.call_inquiries add column if not exists employee_number text;
alter table public.call_inquiries add column if not exists call_type text;
alter table public.call_inquiries add column if not exists call_direction text;
alter table public.call_inquiries add column if not exists call_status text;
alter table public.call_inquiries add column if not exists call_started_at timestamptz;
alter table public.call_inquiries add column if not exists duration_seconds int default 0;
alter table public.call_inquiries add column if not exists recording_url text;
alter table public.call_inquiries add column if not exists recording_path text;
alter table public.call_inquiries add column if not exists recording_storage_path text;
alter table public.call_inquiries add column if not exists recording_public_url text;
alter table public.call_inquiries add column if not exists transcript text;
alter table public.call_inquiries add column if not exists summary text;
alter table public.call_inquiries add column if not exists intent text;
alter table public.call_inquiries add column if not exists captured_name text;
alter table public.call_inquiries add column if not exists captured_phone text;
alter table public.call_inquiries add column if not exists captured_service text;
alter table public.call_inquiries add column if not exists captured_location text;
alter table public.call_inquiries add column if not exists captured_urgency text;
alter table public.call_inquiries add column if not exists captured_priority text default 'Medium';
alter table public.call_inquiries add column if not exists captured_budget text;
alter table public.call_inquiries add column if not exists captured_timing text;
alter table public.call_inquiries add column if not exists captured_notes text;
alter table public.call_inquiries add column if not exists extracted_data jsonb not null default '{}';
alter table public.call_inquiries add column if not exists review_status text not null default 'new';
alter table public.call_inquiries add column if not exists added_to_pipeline boolean not null default false;
alter table public.call_inquiries add column if not exists lead_id uuid;
alter table public.call_inquiries add column if not exists pipeline_lead_id uuid;
alter table public.call_inquiries add column if not exists created_at timestamptz not null default now();
alter table public.call_inquiries add column if not exists updated_at timestamptz not null default now();

create unique index if not exists idx_call_inquiries_external_call_id on public.call_inquiries(external_call_id) where external_call_id is not null;
create index if not exists idx_call_inquiries_review_status on public.call_inquiries(review_status);
create index if not exists idx_call_inquiries_created_at on public.call_inquiries(created_at desc);
create index if not exists idx_call_inquiries_caller_number on public.call_inquiries(caller_number);

drop trigger if exists trg_call_inquiries_updated_at on public.call_inquiries;
create trigger trg_call_inquiries_updated_at
before update on public.call_inquiries
for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Lead / Staff Assignment
-- -----------------------------------------------------------------------------
create table if not exists public.lead_staff_assignments (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.crm_leads(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete restrict,
  assigned_by text,
  assignment_status text not null default 'assigned',
  notes text,
  assigned_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique(lead_id, employee_id, assignment_status)
);

create index if not exists idx_lead_staff_assignments_lead on public.lead_staff_assignments(lead_id);
create index if not exists idx_lead_staff_assignments_employee on public.lead_staff_assignments(employee_id);

-- -----------------------------------------------------------------------------
-- WhatsApp / Template Message Layer
-- -----------------------------------------------------------------------------
create table if not exists public.message_templates (
  id uuid primary key default gen_random_uuid(),
  template_key text unique not null,
  label text not null,
  category text not null default 'pipeline',
  stage text,
  language text not null default 'Hinglish',
  body text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.template_message_logs (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.crm_leads(id) on delete set null,
  call_inquiry_id uuid references public.call_inquiries(id) on delete set null,
  template_key text,
  recipient_phone text,
  message_body text,
  delivery_channel text default 'whatsapp_link',
  status text default 'opened',
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists idx_template_logs_lead on public.template_message_logs(lead_id);
create index if not exists idx_template_logs_call on public.template_message_logs(call_inquiry_id);

drop trigger if exists trg_message_templates_updated_at on public.message_templates;
create trigger trg_message_templates_updated_at
before update on public.message_templates
for each row execute function public.set_updated_at();

-- Default operational templates for manual sending.
insert into public.message_templates (template_key, label, category, stage, language, body)
values
('inquiry_hinglish', 'Initial Inquiry Follow-up', 'pipeline', 'new-inquiry', 'Hinglish', 'Namaste {{name}} ji, SS Health Care se baat hui thi. Aapki {{service}} inquiry receive ho gayi hai. Hamari team details verify karke aapko next step batayegi.'),
('quotation_hinglish', 'Quotation Sent', 'pipeline', 'quotation-sent', 'Hinglish', 'Namaste {{name}} ji, aapke liye SS Health Care quotation ready hai. Service: {{service}}. Location: {{location}}. Agar koi change chahiye ho toh reply karein.'),
('form_submitted_hinglish', 'Form Submitted Confirmation', 'pipeline', 'form-submitted', 'Hinglish', 'Thank you {{name}} ji. Aapka form submit ho gaya hai. Ab hum staff matching process start kar rahe hain.'),
('staff_assigned_hinglish', 'Staff Assigned', 'pipeline', 'staff-assigned', 'Hinglish', 'Good news {{name}} ji. Aapke liye {{staff}} ko assign kiya gaya hai. Service start details ke liye hamari team aapko confirm karegi.'),
('deposit_pending_hinglish', 'Deposit Pending', 'pipeline', 'deposit-pending', 'Hinglish', 'Namaste {{name}} ji, service start karne ke liye deposit pending hai. Payment complete hone ke baad staff deployment confirm ho jayega.'),
('monthly_billing_hinglish', 'Monthly Billing', 'pipeline', 'monthly-billing', 'Hinglish', 'Namaste {{name}} ji, is mahine ka bill ready hai. Kripya payment complete karein. SS Health Care choose karne ke liye dhanyavaad.'),
('custom_hinglish', 'Custom Message', 'pipeline', null, 'Hinglish', 'Namaste {{name}} ji, SS Health Care se message. {{custom}}')
on conflict (template_key) do update
set label = excluded.label,
    category = excluded.category,
    stage = excluded.stage,
    language = excluded.language,
    body = excluded.body,
    is_active = true,
    updated_at = now();

-- -----------------------------------------------------------------------------
-- Manual Attendance baseline
-- -----------------------------------------------------------------------------
create table if not exists public.manual_attendance (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid references public.employees(id) on delete set null,
  employee_name text,
  work_date date not null default current_date,
  status text not null default 'present',
  check_in_time time,
  check_out_time time,
  hours_worked numeric default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_manual_attendance_date on public.manual_attendance(work_date desc);
create index if not exists idx_manual_attendance_employee on public.manual_attendance(employee_id);

drop trigger if exists trg_manual_attendance_updated_at on public.manual_attendance;
create trigger trg_manual_attendance_updated_at
before update on public.manual_attendance
for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Supabase Storage bucket for recordings
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'call-recordings',
  'call-recordings',
  false,
  52428800,
  array['audio/mpeg','audio/mp3','audio/mp4','audio/m4a','audio/wav','audio/x-wav','audio/webm','application/octet-stream']
)
on conflict (id) do update
set public = false,
    file_size_limit = 52428800,
    allowed_mime_types = excluded.allowed_mime_types;

-- -----------------------------------------------------------------------------
-- RPC: Add reviewed call inquiry to CRM pipeline
-- -----------------------------------------------------------------------------
drop function if exists public.add_call_inquiry_to_pipeline(uuid);

create or replace function public.add_call_inquiry_to_pipeline(p_call_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  c public.call_inquiries%rowtype;
  new_lead_id uuid;
  lead_name text;
  lead_phone text;
  lead_priority text;
begin
  select * into c
  from public.call_inquiries
  where id = p_call_id
  for update;

  if not found then
    raise exception 'call_inquiry not found: %', p_call_id;
  end if;

  if c.added_to_pipeline = true and coalesce(c.lead_id, c.pipeline_lead_id) is not null then
    return coalesce(c.lead_id, c.pipeline_lead_id);
  end if;

  lead_name := coalesce(nullif(c.captured_name, ''), nullif((c.extracted_data->>'name'), ''), 'Unknown Caller');
  lead_phone := coalesce(nullif(c.captured_phone, ''), nullif(c.caller_number, ''), nullif((c.extracted_data->>'phone'), ''));
  lead_priority := coalesce(nullif(c.captured_priority, ''), case when lower(coalesce(c.captured_urgency, c.intent, '')) like any(array['%urgent%','%emergency%','%today%']) then 'High' else 'Medium' end);

  insert into public.crm_leads (
    client_name,
    contact_person,
    phone,
    address,
    stage,
    priority,
    value,
    assignee,
    service_type,
    source,
    tags,
    notes,
    metadata
  ) values (
    lead_name,
    lead_name,
    lead_phone,
    coalesce(nullif(c.captured_location, ''), c.extracted_data->>'location'),
    'new-lead',
    lead_priority,
    0,
    coalesce(nullif(c.employee_name, ''), 'Unassigned'),
    coalesce(nullif(c.captured_service, ''), c.extracted_data->>'service', c.intent),
    'callyzer_call_review',
    array['Call Inquiry','Callyzer','Healthcare Inquiry'],
    concat_ws(E'\n',
      'Source: Manual call review via Callyzer',
      'Call ID: ' || c.id::text,
      'External Call ID: ' || coalesce(c.external_call_id, '—'),
      'Caller: ' || coalesce(c.caller_number, '—'),
      'Employee: ' || coalesce(c.employee_name, '—'),
      'Intent: ' || coalesce(c.intent, '—'),
      'Summary: ' || coalesce(c.summary, '—'),
      'Captured notes: ' || coalesce(c.captured_notes, '—')
    ),
    jsonb_build_object(
      'call_inquiry_id', c.id,
      'external_call_id', c.external_call_id,
      'duration_seconds', c.duration_seconds,
      'recording_storage_path', c.recording_storage_path,
      'recording_path', c.recording_path,
      'intent', c.intent,
      'summary', c.summary
    )
  ) returning id into new_lead_id;

  update public.call_inquiries
  set added_to_pipeline = true,
      review_status = 'added_to_pipeline',
      lead_id = new_lead_id,
      pipeline_lead_id = new_lead_id,
      updated_at = now()
  where id = p_call_id;

  return new_lead_id;
end;
$$;

grant execute on function public.add_call_inquiry_to_pipeline(uuid) to anon, authenticated, service_role;

-- -----------------------------------------------------------------------------
-- RPC: Assign available staff to CRM lead
-- -----------------------------------------------------------------------------
create or replace function public.assign_staff_to_lead(p_lead_id uuid, p_employee_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  e record;
  assignment_id uuid;
begin
  select id, full_name, position, department, phone
  into e
  from public.employees
  where id = p_employee_id;

  if not found then
    raise exception 'employee not found: %', p_employee_id;
  end if;

  insert into public.lead_staff_assignments (lead_id, employee_id, assigned_by, assignment_status, notes)
  values (p_lead_id, p_employee_id, 'admin', 'assigned', 'Assigned from SS Healthcare CRM')
  on conflict (lead_id, employee_id, assignment_status) do update
  set assigned_at = now()
  returning id into assignment_id;

  update public.crm_leads
  set stage = 'staff-assigned',
      assignee = e.full_name,
      assignee_id = e.id,
      metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
        'assigned_staff_id', e.id,
        'assigned_staff_name', e.full_name,
        'assigned_staff_position', e.position,
        'assigned_staff_phone', e.phone,
        'staff_assigned_at', now()
      ),
      updated_at = now()
  where id = p_lead_id;

  update public.employees
  set availability_status = case when coalesce(availability_status, 'available') = 'available' then 'assigned' else availability_status end,
      updated_at = now()
  where id = p_employee_id;

  return assignment_id;
end;
$$;

grant execute on function public.assign_staff_to_lead(uuid, uuid) to anon, authenticated, service_role;

-- -----------------------------------------------------------------------------
-- RLS: keep simple for current admin-only MVP. Tighten after auth model is final.
-- -----------------------------------------------------------------------------
alter table public.crm_leads enable row level security;
alter table public.call_inquiries enable row level security;
alter table public.employees enable row level security;
alter table public.lead_staff_assignments enable row level security;
alter table public.message_templates enable row level security;
alter table public.template_message_logs enable row level security;
alter table public.manual_attendance enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array['crm_leads','call_inquiries','employees','lead_staff_assignments','message_templates','template_message_logs','manual_attendance'] loop
    execute format('drop policy if exists "Admin OS read %I" on public.%I', t, t);
    execute format('drop policy if exists "Admin OS write %I" on public.%I', t, t);
    execute format('create policy "Admin OS read %I" on public.%I for select using (true)', t, t);
    execute format('create policy "Admin OS write %I" on public.%I for all using (true) with check (true)', t, t);
  end loop;
end $$;

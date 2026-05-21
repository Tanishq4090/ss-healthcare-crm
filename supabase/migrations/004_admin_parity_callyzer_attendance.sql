-- SS Healthcare CRM — Admin Parity v2
-- Adds manual attendance and widens CRM stages for the HealthCare-style admin OS.

create extension if not exists pgcrypto;

-- Ensure CRM table has the columns used by SS admin modules.
do $$
begin
  if to_regclass('public.crm_leads') is null then
    create table public.crm_leads (
      id uuid primary key default gen_random_uuid(),
      client_name text,
      contact_person text,
      phone text,
      email text,
      address text,
      stage text default 'new-lead',
      status text default 'new-lead',
      priority text default 'Medium',
      value numeric default 0,
      assignee text default 'Unassigned',
      due_date date,
      tags text[] default array[]::text[],
      notes text,
      created_at timestamptz default now(),
      updated_at timestamptz default now()
    );
  else
    alter table public.crm_leads add column if not exists client_name text;
    alter table public.crm_leads add column if not exists contact_person text;
    alter table public.crm_leads add column if not exists phone text;
    alter table public.crm_leads add column if not exists email text;
    alter table public.crm_leads add column if not exists address text;
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

-- Manual attendance MVP. This is intentionally separate from automated Callyzer logs.
create table if not exists public.manual_attendance (
  id uuid primary key default gen_random_uuid(),
  employee_id text not null,
  employee_name text,
  work_date date not null default current_date,
  status text not null default 'present'
    check (status in ('present', 'absent', 'half_day', 'leave')),
  check_in_time time,
  check_out_time time,
  hours_worked numeric default 0,
  notes text,
  marked_by text default 'admin',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(employee_id, work_date)
);

-- Guard: if table pre-existed with different schema (e.g. from 007_ which uses
-- attendance_date + total_hours), ensure the columns this view needs are present.
alter table public.manual_attendance add column if not exists hours_worked numeric default 0;
alter table public.manual_attendance add column if not exists work_date date;


create index if not exists idx_manual_attendance_employee_date on public.manual_attendance(employee_id, work_date desc);
create index if not exists idx_manual_attendance_work_date on public.manual_attendance(work_date desc);
create index if not exists idx_manual_attendance_status on public.manual_attendance(status);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_manual_attendance_updated_at on public.manual_attendance;
create trigger trg_manual_attendance_updated_at
before update on public.manual_attendance
for each row execute function public.set_updated_at();

-- Optional summary view for dashboard/payroll reporting.
create or replace view public.manual_attendance_daily_summary as
select
  work_date,
  count(*) as total_marked,
  count(*) filter (where status = 'present') as present_count,
  count(*) filter (where status = 'absent') as absent_count,
  count(*) filter (where status = 'half_day') as half_day_count,
  count(*) filter (where status = 'leave') as leave_count,
  coalesce(sum(hours_worked), 0) as total_hours
from public.manual_attendance
group by work_date;

alter table public.manual_attendance enable row level security;

drop policy if exists "manual_attendance_authenticated_read" on public.manual_attendance;
create policy "manual_attendance_authenticated_read"
on public.manual_attendance for select
to authenticated
using (true);

drop policy if exists "manual_attendance_authenticated_insert" on public.manual_attendance;
create policy "manual_attendance_authenticated_insert"
on public.manual_attendance for insert
to authenticated
with check (true);

drop policy if exists "manual_attendance_authenticated_update" on public.manual_attendance;
create policy "manual_attendance_authenticated_update"
on public.manual_attendance for update
to authenticated
using (true)
with check (true);

-- Admin shortcut/dev mode uses service role; authenticated RLS still protects regular users.

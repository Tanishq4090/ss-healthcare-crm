-- 012_reconcile_manual_attendance.sql
-- Reconciles manual_attendance column naming inconsistencies:
--   004_/005_/010_ create the table with work_date + hours_worked
--   007_           drops + recreates with attendance_date + total_hours
-- This migration ensures all column variants exist so the view and app code work.

-- Ensure both date column variants exist
alter table public.manual_attendance add column if not exists work_date date;
alter table public.manual_attendance add column if not exists attendance_date date default current_date;

-- Ensure both hours column variants exist
alter table public.manual_attendance add column if not exists hours_worked numeric default 0;
alter table public.manual_attendance add column if not exists total_hours numeric default 0;

-- Sync values between duplicate columns so data is consistent
update public.manual_attendance set work_date = attendance_date where work_date is null and attendance_date is not null;
update public.manual_attendance set attendance_date = work_date where attendance_date is null and work_date is not null;
update public.manual_attendance set hours_worked = total_hours where hours_worked = 0 and total_hours > 0;
update public.manual_attendance set total_hours = hours_worked where total_hours = 0 and hours_worked > 0;

-- Recreate the daily summary view using COALESCE to handle both schemas
drop view if exists public.manual_attendance_daily_summary;
create or replace view public.manual_attendance_daily_summary as
select
  coalesce(work_date, attendance_date) as work_date,
  count(*) as total_marked,
  count(*) filter (where status = 'present') as present_count,
  count(*) filter (where status = 'absent') as absent_count,
  count(*) filter (where status = 'half_day') as half_day_count,
  count(*) filter (where status = 'leave') as leave_count,
  coalesce(sum(hours_worked), sum(total_hours), 0) as total_hours
from public.manual_attendance
group by coalesce(work_date, attendance_date);

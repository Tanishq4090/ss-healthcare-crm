-- Create attendance tracking table
-- NOTE: worker_id previously referenced public.workers which was merged into
-- public.employees (see 20260416100025_merge_workers_to_employees.sql).
-- FK removed to avoid dependency on a table that may not exist yet.
CREATE TABLE IF NOT EXISTS public.attendance (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    worker_id UUID,  -- no FK: workers merged into employees
    check_in_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    check_out_time TIMESTAMP WITH TIME ZONE,
    status TEXT NOT NULL DEFAULT 'On Duty', -- 'On Duty' | 'Completed'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- Create policy for all viewing/editing (assuming internal tool access config)
DO $$ BEGIN
  CREATE POLICY "Enable all access for attendance" ON public.attendance
    FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


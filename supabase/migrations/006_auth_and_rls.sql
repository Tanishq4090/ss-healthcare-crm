-- 006_auth_and_rls.sql
-- Setting up Security Profiles and enforcing Row Level Security (RLS)

-- 1. Create Profiles Table to extend auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role TEXT DEFAULT 'admin',
    accesses TEXT[] DEFAULT '{"crm", "clients", "hr", "finance"}',
    avatar TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 1.5 Create Missing Tables IF NOT EXISTS
-- NOTE: payroll and duty_logs previously referenced public.workers which was
-- merged into public.employees (see 20260416100025_merge_workers_to_employees.sql).
-- References are now nullable UUIDs without FK constraints to avoid dependency issues.
CREATE TABLE IF NOT EXISTS public.payroll (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    worker_id UUID,   -- no FK: workers merged into employees
    amount NUMERIC,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.duty_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    worker_id UUID,   -- no FK: workers merged into employees
    client_id UUID,   -- no FK: clients table may not exist yet
    date DATE,
    status TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.contact_submissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT,
    email TEXT,
    phone TEXT,
    message TEXT,
    status TEXT DEFAULT 'new',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Enable RLS on tables that exist
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.duty_logs ENABLE ROW LEVEL SECURITY;

-- Enable RLS on optional legacy tables only if they exist
DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'workers') THEN
    EXECUTE 'ALTER TABLE public.workers ENABLE ROW LEVEL SECURITY';
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'clients') THEN
    EXECUTE 'ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY';
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'leads') THEN
    EXECUTE 'ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY';
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'attendance') THEN
    EXECUTE 'ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY';
  END IF;
END $$;

-- 3. Create generic policies (Allow only authenticated users)
-- Profiles
DO $$ BEGIN
  CREATE POLICY "Profiles are viewable by all authenticated users" ON public.profiles FOR SELECT USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Workers (only if table exists)
DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'workers') THEN
    BEGIN
      CREATE POLICY "Authenticated users can manage workers" ON public.workers FOR ALL USING (auth.role() = 'authenticated');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END IF;
END $$;

-- Clients (only if table exists)
DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'clients') THEN
    BEGIN
      CREATE POLICY "Authenticated users can manage clients" ON public.clients FOR ALL USING (auth.role() = 'authenticated');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END IF;
END $$;

-- Leads (only if table exists)
DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'leads') THEN
    BEGIN
      CREATE POLICY "Authenticated users can manage leads" ON public.leads FOR ALL USING (auth.role() = 'authenticated');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END IF;
END $$;

-- CRM Leads (Pipeline)
DO $$ BEGIN
  CREATE POLICY "Authenticated users can manage crm_leads" ON public.crm_leads FOR ALL USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Attendance (only if table exists)
DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'attendance') THEN
    BEGIN
      CREATE POLICY "Authenticated users can manage attendance" ON public.attendance FOR ALL USING (auth.role() = 'authenticated');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END IF;
END $$;

-- Payroll
DO $$ BEGIN
  CREATE POLICY "Authenticated users can manage payroll" ON public.payroll FOR ALL USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Duty Logs
DO $$ BEGIN
  CREATE POLICY "Authenticated users can manage duty logs" ON public.duty_logs FOR ALL USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Contact Submissions (Public Website Data Pipeline)
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Anyone can insert contact submissions" ON public.contact_submissions FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Only authenticated users can view/manage contact submissions" ON public.contact_submissions FOR SELECT USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Only authenticated users can update contact submissions" ON public.contact_submissions FOR UPDATE USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Only authenticated users can delete contact submissions" ON public.contact_submissions FOR DELETE USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

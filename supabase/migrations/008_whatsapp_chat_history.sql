-- 008_whatsapp_chat_history.sql
-- Creates the whatsapp_messages table and seeds demo conversations for AI CRM.

create table if not exists public.whatsapp_messages (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.crm_leads(id) on delete cascade,
  phone text not null,
  direction text not null check (direction in ('inbound', 'outbound')),
  message_type text not null default 'text' check (message_type in ('text', 'template', 'media')),
  template_name text,
  content text not null,
  status text not null default 'queued' check (status in ('queued', 'sent', 'delivered', 'read', 'failed')),
  meta_message_id text,
  sent_by text default 'system',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_whatsapp_messages_lead_id on public.whatsapp_messages(lead_id);
create index if not exists idx_whatsapp_messages_phone on public.whatsapp_messages(phone);
create index if not exists idx_whatsapp_messages_created_at on public.whatsapp_messages(created_at desc);

-- RLS Policies
alter table public.whatsapp_messages enable row level security;

drop policy if exists "Admin OS read whatsapp_messages" on public.whatsapp_messages;
drop policy if exists "Admin OS write whatsapp_messages" on public.whatsapp_messages;

create policy "Admin OS read whatsapp_messages" on public.whatsapp_messages for select using (true);
create policy "Admin OS write whatsapp_messages" on public.whatsapp_messages for all using (true) with check (true);

-- Seed demo conversations for the seeded CRM leads
do $$
declare
  lead_desai uuid;
  lead_shah uuid;
begin
  select id into lead_desai from public.crm_leads where client_name = 'Desai Family' limit 1;
  select id into lead_shah from public.crm_leads where client_name = 'Shah Family' limit 1;

  if lead_desai is not null then
    insert into public.whatsapp_messages (lead_id, phone, direction, message_type, content, status, sent_by, created_at)
    values
      (lead_desai, '+919700002222', 'inbound', 'text', 'Hello, we are looking for a reliable Japa Care attendant for our newborn. Do you have someone available in City Light?', 'read', 'client', now() - interval '2 days'),
      (lead_desai, '+919700002222', 'outbound', 'text', 'Namaste Kiran ji, congratulations! Yes, we have highly trained Japa Care staff available. We can share profiles today.', 'read', 'admin', now() - interval '1 day 23 hours'),
      (lead_desai, '+919700002222', 'outbound', 'template', 'Namaste Kiran ji, aapke liye SS Health Care quotation ready hai. Service: Japa Care. Agar koi change chahiye ho toh reply karein.', 'delivered', 'admin', now() - interval '2 hours');
  end if;

  if lead_shah is not null then
    insert into public.whatsapp_messages (lead_id, phone, direction, message_type, content, status, sent_by, created_at)
    values
      (lead_shah, '+919700004444', 'outbound', 'template', 'Good news Priya ji. Aapke liye Rina Staff ko assign kiya gaya hai. Service start details ke liye hamari team aapko confirm karegi.', 'read', 'admin', now() - interval '5 days'),
      (lead_shah, '+919700004444', 'inbound', 'text', 'Thank you. Rina is doing a great job.', 'read', 'client', now() - interval '4 days'),
      (lead_shah, '+919700004444', 'outbound', 'template', 'Namaste Priya ji, is mahine ka bill ready hai. Kripya payment complete karein. SS Health Care choose karne ke liye dhanyavaad.', 'sent', 'admin', now() - interval '1 hour');
  end if;
end $$;

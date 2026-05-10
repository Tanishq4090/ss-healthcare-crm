-- 009_brand_lock_ss_healthcare.sql
-- Safe brand metadata and message template alignment for SS Health Care.

create table if not exists public.app_brand_settings (
  id text primary key default 'global',
  brand_name text not null default 'SS Health Care',
  product_name text not null default 'SS Health Care Admin OS',
  logo_path text not null default '/logo.png',
  primary_color text not null default '#00A859',
  secondary_color text not null default '#004C8C',
  website text not null default 'https://homecareservices.co.in/',
  updated_at timestamptz not null default now()
);

insert into public.app_brand_settings (
  id, brand_name, product_name, logo_path, primary_color, secondary_color, website, updated_at
) values (
  'global', 'SS Health Care', 'SS Health Care Admin OS', '/logo.png', '#00A859', '#004C8C', 'https://homecareservices.co.in/', now()
)
on conflict (id) do update set
  brand_name = excluded.brand_name,
  product_name = excluded.product_name,
  logo_path = excluded.logo_path,
  primary_color = excluded.primary_color,
  secondary_color = excluded.secondary_color,
  website = excluded.website,
  updated_at = now();

-- Optional cleanup where template tables exist.
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema='public' and table_name='whatsapp_templates') then
    update public.whatsapp_templates
    set body = replace(replace(replace(body, 'SS Health Care', 'SS Health Care'), 'SS Health Care', 'SS Health Care'), 'homecareservices.co.in', 'homecareservices.co.in')
    where body ilike '%99care%' or body ilike '%99 care%';
  end if;

  if exists (select 1 from information_schema.tables where table_schema='public' and table_name='template_message_logs') then
    update public.template_message_logs
    set message_body = replace(replace(replace(message_body, 'SS Health Care', 'SS Health Care'), 'SS Health Care', 'SS Health Care'), 'homecareservices.co.in', 'homecareservices.co.in')
    where message_body ilike '%99care%' or message_body ilike '%99 care%';
  end if;
end $$;

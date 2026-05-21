import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const patchSql = `
-- Drop existing dependent RPC first
DROP FUNCTION IF EXISTS public.log_whatsapp_template_message(text, uuid, jsonb, text, uuid, text);
DROP FUNCTION IF EXISTS public.log_whatsapp_template_message(text, text, jsonb, uuid);

-- Drop table (only 1 row exists, so safe for staging)
DROP TABLE IF EXISTS public.template_message_logs CASCADE;

CREATE TABLE public.template_message_logs (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    phone text NOT NULL,
    template_name text NOT NULL,
    payload jsonb,
    status text DEFAULT 'sent'::text,
    provider text DEFAULT 'wa.me'::text,
    sent_by uuid,
    created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.template_message_logs ADD CONSTRAINT template_message_logs_pkey PRIMARY KEY (id);

CREATE OR REPLACE FUNCTION public.log_whatsapp_template_message(p_phone text, p_template_name text, p_payload jsonb, p_sent_by uuid DEFAULT NULL::uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_message_body text;
BEGIN
    -- Log to template logs
    INSERT INTO public.template_message_logs (phone, template_name, payload, status, provider, sent_by)
    VALUES (p_phone, p_template_name, p_payload, 'sent', 'wa.me', p_sent_by);

    -- Extract or mock body for general whatsapp history
    v_message_body := 'Sent template: ' || p_template_name;

    -- Also log to general whatsapp history
    INSERT INTO public.whatsapp_messages (phone_number, direction, message_type, content, status, is_template)
    VALUES (p_phone, 'outbound', 'template', v_message_body, 'sent', true);
END;
$function$;
`;

async function applyPatch() {
  const { error } = await supabase.rpc('exec_sql', { query: patchSql });
  if (error) {
     console.error("Could not run exec_sql. Will try using REST API or suggest manual application:", error);
  } else {
     console.log("Patch applied successfully via RPC.");
  }
}
applyPatch();

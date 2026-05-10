import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
import { normalizeCallyzerPayload } from '../_shared/callyzer-normalizer.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-callyzer-secret',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const webhookSecret = Deno.env.get('CALLYZER_WEBHOOK_SECRET') || '';
  if (webhookSecret) {
    const incomingSecret = req.headers.get('x-callyzer-secret') || '';
    if (incomingSecret !== webhookSecret) {
      return json({ error: 'Invalid webhook secret' }, 401);
    }
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !serviceRoleKey) {
    return json({ error: 'Missing Supabase environment variables' }, 500);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return json({ error: 'Invalid JSON payload' }, 400);
  }

  const records = Array.isArray(payload) ? payload : [payload];
  const normalizedRows = records.map(normalizeCallyzerPayload);

  const validRows = normalizedRows.filter((row) => row.caller_phone && row.caller_phone !== 'unknown');

  if (!validRows.length) {
    return json({
      ok: true,
      inserted: 0,
      skipped: records.length,
      message: 'Webhook received, but no valid caller phone was found.',
    });
  }

  const { data, error } = await supabase
    .from('call_inquiries')
    .upsert(validRows, {
      onConflict: 'provider,provider_call_id',
      ignoreDuplicates: false,
    })
    .select('id, provider_call_id, caller_phone, review_status');

  if (error) {
    return json({ error: error.message }, 500);
  }

  return json({
    ok: true,
    inserted_or_updated: data?.length || 0,
    records: data,
  });
});

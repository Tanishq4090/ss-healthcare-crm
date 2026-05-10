import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
import {
  normalizeCallyzerPayload,
  pickRecordsFromCallyzerResponse,
} from '../_shared/callyzer-normalizer.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const callyzerToken = Deno.env.get('CALLYZER_API_TOKEN');

  if (!supabaseUrl || !serviceRoleKey) {
    return json({ error: 'Missing Supabase environment variables' }, 500);
  }

  if (!callyzerToken) {
    return json({ error: 'Missing CALLYZER_API_TOKEN' }, 500);
  }

  const body = await req.json().catch(() => ({}));

  const apiBase = Deno.env.get('CALLYZER_API_BASE') || 'https://api1.callyzer.co/api/v2.1';
  const historyPath = Deno.env.get('CALLYZER_CALL_HISTORY_PATH') || 'callHistory';

  // Keep request body flexible because Callyzer account-level payload shape may vary.
  // Common fields: callStartDate, callEndDate, employeeNumbers, callTypes, recordFrom, pageSize.
  const requestPayload = {
    callStartDate: body.callStartDate || body.from || body.startDate,
    callEndDate: body.callEndDate || body.to || body.endDate,
    employeeNumbers: body.employeeNumbers || body.employee_numbers || [],
    callTypes: body.callTypes || body.call_types || [],
    recordFrom: body.recordFrom || 0,
    pageSize: body.pageSize || 100,
    ...body.extraPayload,
  };

  const endpoint = `${apiBase.replace(/\/$/, '')}/${historyPath.replace(/^\//, '')}`;

  const callyzerResponse = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${callyzerToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestPayload),
  });

  const responseText = await callyzerResponse.text();
  let responseJson: unknown = null;

  try {
    responseJson = JSON.parse(responseText);
  } catch {
    return json({
      error: 'Callyzer returned non-JSON response',
      status: callyzerResponse.status,
      body: responseText.slice(0, 1000),
    }, 502);
  }

  if (!callyzerResponse.ok) {
    return json({
      error: 'Callyzer API request failed',
      status: callyzerResponse.status,
      response: responseJson,
    }, 502);
  }

  const records = pickRecordsFromCallyzerResponse(responseJson);
  const rows = records
    .map(normalizeCallyzerPayload)
    .filter((row) => row.caller_phone && row.caller_phone !== 'unknown');

  if (!rows.length) {
    return json({ ok: true, imported: 0, message: 'No valid call records found.' });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const { data, error } = await supabase
    .from('call_inquiries')
    .upsert(rows, {
      onConflict: 'provider,provider_call_id',
      ignoreDuplicates: false,
    })
    .select('id, provider_call_id, caller_phone');

  if (error) {
    return json({ error: error.message }, 500);
  }

  return json({
    ok: true,
    imported: data?.length || 0,
    records: data,
  });
});

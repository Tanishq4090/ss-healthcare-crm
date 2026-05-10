import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

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

  const openaiKey = Deno.env.get('OPENAI_API_KEY');
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!openaiKey) return json({ error: 'Missing OPENAI_API_KEY' }, 500);
  if (!supabaseUrl || !serviceRoleKey) {
    return json({ error: 'Missing Supabase environment variables' }, 500);
  }

  const { callInquiryId } = await req.json().catch(() => ({}));

  if (!callInquiryId) {
    return json({ error: 'callInquiryId is required' }, 400);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const { data: call, error: callError } = await supabase
    .from('call_inquiries')
    .select('id, recording_storage_path')
    .eq('id', callInquiryId)
    .single();

  if (callError || !call) {
    return json({ error: callError?.message || 'Call inquiry not found' }, 404);
  }

  if (!call.recording_storage_path) {
    return json({ error: 'No Supabase recording path found for this call.' }, 400);
  }

  await supabase
    .from('call_inquiries')
    .update({ transcript_status: 'processing' })
    .eq('id', callInquiryId);

  const { data: fileData, error: fileError } = await supabase.storage
    .from('call-recordings')
    .download(call.recording_storage_path);

  if (fileError || !fileData) {
    await supabase
      .from('call_inquiries')
      .update({ transcript_status: 'failed' })
      .eq('id', callInquiryId);

    return json({ error: fileError?.message || 'Unable to download recording' }, 500);
  }

  const form = new FormData();
  form.append('model', Deno.env.get('OPENAI_TRANSCRIBE_MODEL') || 'gpt-4o-mini-transcribe');
  form.append('file', fileData, 'call-recording.mp3');

  const openaiResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${openaiKey}`,
    },
    body: form,
  });

  const text = await openaiResponse.text();
  let result: Record<string, unknown> = {};
  try {
    result = JSON.parse(text);
  } catch {
    result = { text };
  }

  if (!openaiResponse.ok) {
    await supabase
      .from('call_inquiries')
      .update({ transcript_status: 'failed' })
      .eq('id', callInquiryId);

    return json({
      error: 'Transcription failed',
      details: result,
    }, 502);
  }

  const transcript = String(result.text || '').trim();

  const { error: updateError } = await supabase
    .from('call_inquiries')
    .update({
      transcript,
      transcript_status: transcript ? 'completed' : 'empty',
      review_status: 'in_review',
    })
    .eq('id', callInquiryId);

  if (updateError) {
    return json({ error: updateError.message }, 500);
  }

  return json({
    ok: true,
    callInquiryId,
    transcript,
  });
});

/**
 * Pipeline Service
 * Backend operations for CRM pipeline stage management.
 */
import { supabase } from './supabase.js';

export const PIPELINE_STAGES = [
  'new-lead', 'new-inquiry', 'in-discussion', 'quotation-sent',
  'form-submitted', 'staff-assigned', 'deposit-pending',
  'active-client', 'monthly-billing', 'closed-won',
];

export async function moveLeadStage(leadId, newStage) {
  if (!PIPELINE_STAGES.includes(newStage)) {
    throw new Error(`Invalid stage: ${newStage}`);
  }
  const { data, error } = await supabase
    .from('crm_leads')
    .update({ stage: newStage })
    .eq('id', leadId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function createLeadFromCallInquiry(callId) {
  const { data: call, error: fetchErr } = await supabase
    .from('call_inquiries')
    .select('*')
    .eq('id', callId)
    .single();
  if (fetchErr) throw fetchErr;

  const { data: lead, error: insertErr } = await supabase
    .from('crm_leads')
    .insert([{
      full_name: call.caller_name || 'Call Lead',
      phone: call.caller_phone || '',
      stage: 'new-lead',
      source: 'call_lead',
      notes: `Converted from call. Summary: ${call.summary || 'N/A'}`,
      priority: 'Medium',
    }])
    .select()
    .single();
  if (insertErr) throw insertErr;

  await supabase
    .from('call_inquiries')
    .update({ status: 'added_to_pipeline', lead_id: lead.id })
    .eq('id', callId);

  return lead;
}

export async function getLeadsByStage(stage) {
  const query = supabase.from('crm_leads').select('*').order('created_at', { ascending: false });
  if (stage) query.eq('stage', stage);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

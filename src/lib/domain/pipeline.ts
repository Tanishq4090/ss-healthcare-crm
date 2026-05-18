/**
 * Pipeline Domain Logic
 * Manages CRM pipeline stages, transitions, and lead operations.
 */
import { supabase } from '@/lib/supabase';
import {
  CRM_PIPELINE_STAGES,
  CRM_PIPELINE_VIEW_STAGES,
  CRM_CLIENT_VIEW_STAGES,
  CRM_STAGE_LABELS,
  CRM_PIPELINE_STAGE_IDS,
  CRM_CLIENT_STAGE_IDS,
  normalizeCrmStage,
  type CrmStageId,
} from '@/config/crmStages';

export {
  CRM_PIPELINE_STAGES,
  CRM_PIPELINE_VIEW_STAGES,
  CRM_CLIENT_VIEW_STAGES,
  CRM_STAGE_LABELS,
  CRM_PIPELINE_STAGE_IDS,
  CRM_CLIENT_STAGE_IDS,
  normalizeCrmStage,
};
export type { CrmStageId };

/* ── Lead CRUD ──────────────────────────────────────────────────────── */

export async function fetchLeads() {
  const { data, error } = await supabase
    .from('crm_leads')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function updateLeadStage(leadId: string, newStage: string) {
  const normalized = normalizeCrmStage(newStage);
  const { error } = await supabase
    .from('crm_leads')
    .update({ stage: normalized })
    .eq('id', leadId);
  if (error) throw error;
  return normalized;
}

export async function createLeadFromCall(callInquiry: {
  caller_name?: string;
  caller_phone?: string;
  notes?: string;
  call_inquiry_id?: string;
}) {
  const { data, error } = await supabase
    .from('crm_leads')
    .insert([{
      full_name: callInquiry.caller_name || 'Call Lead',
      phone: callInquiry.caller_phone || '',
      stage: 'new-lead',
      source: 'call_lead',
      notes: callInquiry.notes || `Converted from call inquiry ${callInquiry.call_inquiry_id || ''}`,
      priority: 'Medium',
    }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

/* ── Grouping helpers ───────────────────────────────────────────────── */

export function groupLeadsByStage<T extends { stage?: string | null }>(leads: T[]) {
  const grouped: Record<string, T[]> = {};
  CRM_PIPELINE_STAGES.forEach((s) => { grouped[s.id] = []; });
  leads.forEach((lead) => {
    const stage = normalizeCrmStage(lead.stage);
    if (!grouped[stage]) grouped[stage] = [];
    grouped[stage].push(lead);
  });
  return grouped;
}

export function isPipelineStage(stageId: string): boolean {
  return CRM_PIPELINE_STAGE_IDS.has(stageId as CrmStageId);
}

export function isClientStage(stageId: string): boolean {
  return CRM_CLIENT_STAGE_IDS.has(stageId as CrmStageId);
}

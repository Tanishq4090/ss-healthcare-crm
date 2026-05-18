/**
 * Call Leads Domain Logic
 * Manages call inquiry data for the Call Leads tab in AI CRM.
 */
import { supabase } from '@/lib/supabase';

export type CallInquiry = {
  id: string;
  caller_name?: string | null;
  caller_phone?: string | null;
  call_date?: string | null;
  duration_seconds?: number | null;
  summary?: string | null;
  intent?: string | null;
  transcript?: string | null;
  recording_url?: string | null;
  status?: string | null;
  lead_id?: string | null;
  created_at?: string;
};

export async function fetchCallInquiries(): Promise<CallInquiry[]> {
  const { data, error } = await supabase
    .from('call_inquiries')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) {
    console.warn('call_inquiries table may not exist yet:', error.message);
    return [];
  }
  return (data || []) as CallInquiry[];
}

export async function markCallAsAddedToPipeline(callId: string, leadId: string) {
  const { error } = await supabase
    .from('call_inquiries')
    .update({ status: 'added_to_pipeline', lead_id: leadId })
    .eq('id', callId);
  if (error) console.warn('Failed to update call inquiry:', error.message);
}

export function formatCallDuration(seconds?: number | null): string {
  if (!seconds) return '—';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

export function isCallConvertible(call: CallInquiry): boolean {
  return call.status !== 'added_to_pipeline' && !call.lead_id;
}

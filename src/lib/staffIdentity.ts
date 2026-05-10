import { supabase } from '@/lib/supabase';

export function absoluteStaffIdUrl(pathOrUrl?: string | null) {
  if (!pathOrUrl) return '';
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  return `${origin}${pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`}`;
}

export function buildStaffAssignedMessage({
  clientName,
  staffName,
  staffRole,
  idCardUrl,
}: {
  clientName: string;
  staffName: string;
  staffRole: string;
  idCardUrl: string;
}) {
  return `Good news ${clientName || 'there'} ji. We have assigned ${staffName} (${staffRole}) for your SS Health Care service.\n\nPlease verify the staff ID card before service starts:\n${idCardUrl}\n\nThank you,\nSS Health Care`;
}

export function toWhatsAppPhone(phone?: string | null) {
  const digits = (phone || '').replace(/\D/g, '');
  if (!digits) return '';
  return digits.length === 10 ? `91${digits}` : digits;
}

export async function logTemplateMessage({
  leadId,
  phone,
  templateName,
  content,
  payload,
  sentBy = 'admin',
}: {
  leadId?: string | null;
  phone: string;
  templateName: string;
  content: string;
  payload?: Record<string, unknown>;
  sentBy?: string;
}) {
  const { data, error } = await supabase.rpc('log_whatsapp_template_message', {
    p_lead_id: leadId || null,
    p_phone: phone,
    p_template_name: templateName,
    p_content: content,
    p_payload: payload || {},
    p_sent_by: sentBy,
  });
  if (error) throw error;
  return data;
}

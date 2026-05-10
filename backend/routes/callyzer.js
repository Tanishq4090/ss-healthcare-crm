import express from 'express';
import { supabase } from '../services/supabase.js';

const router = express.Router();

function pick(obj, keys, fallback = null) {
  for (const key of keys) {
    if (obj && obj[key] !== undefined && obj[key] !== null && obj[key] !== '') return obj[key];
  }
  return fallback;
}

function normalizePhone(value) {
  if (!value) return null;
  const raw = String(value).trim();
  const digits = raw.replace(/\D/g, '');
  if (!digits) return raw;
  if (digits.length === 10) return `+91${digits}`;
  if (digits.startsWith('91') && digits.length === 12) return `+${digits}`;
  return raw.startsWith('+') ? raw : `+${digits}`;
}

function parseDuration(value) {
  if (value === undefined || value === null || value === '') return 0;
  if (typeof value === 'number') return Math.max(0, Math.round(value));
  const text = String(value).trim();
  if (/^\d+$/.test(text)) return Number(text);
  const parts = text.split(':').map((part) => Number(part));
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return 0;
}

function parseDate(value) {
  if (!value) return new Date().toISOString();
  const d = new Date(value);
  if (!Number.isNaN(d.getTime())) return d.toISOString();
  return new Date().toISOString();
}

function inferService(text = '') {
  const lower = text.toLowerCase();
  if (lower.includes('baby') || lower.includes('japa') || lower.includes('newborn')) return lower.includes('japa') ? 'Japa Care' : 'Baby Care';
  if (lower.includes('old') || lower.includes('elder') || lower.includes('senior')) return 'Old Age Care';
  if (lower.includes('nurs') || lower.includes('injection') || lower.includes('iv')) return 'Nursing Care';
  if (lower.includes('physio')) return 'Physiotherapy';
  return null;
}

function inferUrgency(text = '') {
  const lower = text.toLowerCase();
  if (lower.includes('urgent') || lower.includes('today') || lower.includes('immediate') || lower.includes('emergency')) return 'Urgent';
  if (lower.includes('tomorrow') || lower.includes('soon')) return 'Soon';
  return null;
}

function normalizeCallyzerPayload(payload) {
  const root = payload?.data || payload?.call || payload?.payload || payload || {};
  const note = String(pick(root, ['note', 'notes', 'remarks', 'description', 'summary'], '') || '');
  const transcript = String(pick(root, ['transcript', 'fullTranscript', 'callTranscript'], '') || '');
  const combinedText = `${note}\n${transcript}`;
  const service = pick(root, ['service', 'service_type', 'intent'], null) || inferService(combinedText);
  const urgency = pick(root, ['urgency', 'priority'], null) || inferUrgency(combinedText);
  const caller = normalizePhone(pick(root, ['number', 'phone', 'callerNumber', 'customerNumber', 'customerPhone', 'from', 'mobileNumber']));

  return {
    external_call_id: String(pick(root, ['id', 'call_id', 'callId', 'callLogId', 'conversation_id'], `${Date.now()}-${caller || 'unknown'}`)),
    caller_number: caller,
    employee_name: pick(root, ['employeeName', 'employee_name', 'emp_name', 'userName', 'agentName', 'staffName'], null),
    employee_number: normalizePhone(pick(root, ['employeeNumber', 'employee_number', 'emp_number', 'userNumber', 'agentNumber', 'staffNumber'])),
    call_type: pick(root, ['callType', 'type', 'call_type'], null),
    call_direction: pick(root, ['callDirection', 'direction', 'call_direction'], null),
    call_status: pick(root, ['status', 'callStatus', 'call_status'], 'completed'),
    call_started_at: parseDate(pick(root, ['callTime', 'call_time', 'callDate', 'startTime', 'callStartTime', 'created_at'], null)),
    duration_seconds: parseDuration(pick(root, ['duration', 'durationSeconds', 'callDuration', 'call_duration'], 0)),
    recording_url: pick(root, ['recordingURL', 'recordingUrl', 'recording_url', 'audioUrl', 'audio_url'], null),
    transcript,
    summary: pick(root, ['summary', 'note', 'notes', 'remarks'], null),
    intent: pick(root, ['intent', 'purpose'], service || null),
    captured_name: pick(root, ['name', 'clientName', 'customerName', 'patientName'], null),
    captured_phone: caller,
    captured_service: service,
    captured_location: pick(root, ['location', 'area', 'city', 'address'], null),
    captured_urgency: urgency,
    captured_priority: urgency === 'Urgent' ? 'High' : 'Medium',
    captured_budget: pick(root, ['budget', 'rate', 'price'], null),
    captured_timing: pick(root, ['timing', 'preferredTime', 'startDate'], null),
    captured_notes: note,
    extracted_data: root,
    review_status: 'new',
  };
}

function verifySecret(req, res, next) {
  const configured = process.env.CALLYZER_WEBHOOK_SECRET;
  if (!configured) return next();
  const provided = req.query.secret || req.headers['x-callyzer-secret'] || req.headers['x-webhook-secret'];
  if (provided !== configured) return res.status(401).json({ ok: false, error: 'Invalid webhook secret' });
  return next();
}

router.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'callyzer', mode: 'manual-call-review' });
});

router.post('/webhook', verifySecret, async (req, res) => {
  try {
    const normalized = normalizeCallyzerPayload(req.body);
    const { data, error } = await supabase
      .from('call_inquiries')
      .upsert(normalized, { onConflict: 'external_call_id' })
      .select('id, external_call_id, caller_number, review_status')
      .single();

    if (error) throw error;
    res.json({ ok: true, call: data });
  } catch (error) {
    console.error('[Callyzer Webhook Error]', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

router.post('/sync', verifySecret, async (_req, res) => {
  // Placeholder for Callyzer API backfill. Webhook is the production path.
  res.json({ ok: true, message: 'Webhook-first sync is active. Add Callyzer API token here for historical backfill.' });
});

export default router;

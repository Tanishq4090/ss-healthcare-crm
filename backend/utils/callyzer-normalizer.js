function firstValue(payload, keys, fallback = null) {
  for (const key of keys) {
    const value = payload?.[key];
    if (value !== undefined && value !== null && String(value).trim() !== '') return value;
  }
  return fallback;
}

function onlyDigits(value) {
  if (!value) return '';
  const raw = String(value).trim();
  const plus = raw.startsWith('+') ? '+' : '';
  const digits = raw.replace(/\D/g, '');
  return `${plus}${digits}` || raw;
}

function parseDate(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function parseDurationSeconds(value) {
  if (value === undefined || value === null || value === '') return 0;
  if (typeof value === 'number') return Math.max(0, Math.round(value));
  const text = String(value).trim();
  if (/^\d+$/.test(text)) return Number(text);
  const parts = text.split(':').map(Number);
  if (parts.some(Number.isNaN)) return 0;
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return 0;
}

function durationLabel(seconds) {
  const total = Math.max(0, Number(seconds || 0));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h) return `${h}h ${m}m ${s}s`;
  if (m) return `${m}m ${s}s`;
  return `${s}s`;
}

function normalizeCallType(value) {
  const text = String(value || '').toLowerCase();
  if (text.includes('miss')) return 'missed';
  if (text.includes('out')) return 'outgoing';
  if (text.includes('in')) return 'incoming';
  return text || 'unknown';
}

export function normalizeCallyzerPayload(payload = {}) {
  const nested = payload.data && typeof payload.data === 'object' ? payload.data : payload;
  const externalId = firstValue(nested, ['id', 'call_id', 'callId', 'logId', 'callLogId', 'uniqueId', 'uuid']);
  const callerNumber = onlyDigits(firstValue(nested, [
    'number', 'callerNumber', 'customerNumber', 'phoneNumber', 'clientNumber', 'mobile', 'customer_mobile', 'contact_number'
  ], ''));
  const employeeNumber = onlyDigits(firstValue(nested, [
    'employeeNumber', 'empNumber', 'emp_number', 'userNumber', 'agentNumber', 'staffNumber'
  ]));
  const startedAt = parseDate(firstValue(nested, [
    'callTime', 'call_time', 'startTime', 'callStartTime', 'callStartDate', 'createdAt', 'dateTime', 'timestamp'
  ]));
  const endedAt = parseDate(firstValue(nested, ['endTime', 'callEndTime', 'callEndDate']));
  const duration = parseDurationSeconds(firstValue(nested, ['duration', 'callDuration', 'durationSeconds', 'call_duration']));

  return {
    source: 'callyzer',
    external_call_id: externalId ? String(externalId) : null,
    employee_name: firstValue(nested, ['employeeName', 'empName', 'emp_name', 'userName', 'agentName', 'staffName']),
    employee_number: employeeNumber || null,
    caller_name: firstValue(nested, ['callerName', 'customerName', 'name', 'clientName', 'contactName']),
    caller_number: callerNumber || 'unknown',
    call_type: normalizeCallType(firstValue(nested, ['callType', 'type', 'direction'])),
    call_status: String(firstValue(nested, ['status', 'callStatus'], 'completed')).toLowerCase(),
    call_started_at: startedAt,
    call_ended_at: endedAt,
    duration_seconds: duration,
    duration_label: durationLabel(duration),
    original_recording_url: firstValue(nested, ['recordingURL', 'recordingUrl', 'recording_url', 'recording', 'audioUrl', 'fileUrl']),
    review_status: 'new',
    raw_payload: payload,
  };
}

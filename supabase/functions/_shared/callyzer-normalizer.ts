export type NormalizedCallyzerCall = {
  provider: 'callyzer';
  provider_call_id: string | null;
  employee_name: string | null;
  employee_phone: string | null;
  caller_phone: string;
  caller_name: string | null;
  call_type: string;
  call_status: string | null;
  call_started_at: string | null;
  duration_seconds: number;
  recording_source_url: string | null;
  raw_payload: Record<string, unknown>;
};

function firstString(payload: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const value = payload[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number') return String(value);
  }
  return null;
}

function firstNumber(payload: Record<string, unknown>, keys: string[]): number {
  for (const key of keys) {
    const value = payload[key];
    if (typeof value === 'number' && Number.isFinite(value)) return Math.max(0, Math.round(value));
    if (typeof value === 'string' && value.trim()) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return Math.max(0, Math.round(parsed));
    }
  }
  return 0;
}

function normalizePhone(value: string | null): string {
  if (!value) return '';
  const trimmed = value.trim();
  const plus = trimmed.startsWith('+') ? '+' : '';
  const digits = trimmed.replace(/[^\d]/g, '');
  return `${plus}${digits}`;
}

function normalizeCallType(value: string | null): string {
  const raw = (value || '').toLowerCase();
  if (raw.includes('incoming') || raw === 'in' || raw === 'received') return 'incoming';
  if (raw.includes('outgoing') || raw === 'out' || raw === 'dialed') return 'outgoing';
  if (raw.includes('missed')) return 'missed';
  if (raw.includes('rejected')) return 'rejected';
  return raw || 'unknown';
}

function normalizeDate(value: string | null): string | null {
  if (!value) return null;
  const direct = new Date(value);
  if (!Number.isNaN(direct.getTime())) return direct.toISOString();

  // Common compact formats are handled defensively.
  const cleaned = value.replace(/\//g, '-');
  const parsed = new Date(cleaned);
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();

  return null;
}

export function normalizeCallyzerPayload(input: unknown): NormalizedCallyzerCall {
  const payload = (input || {}) as Record<string, unknown>;

  const providerCallId = firstString(payload, [
    'id',
    'callId',
    'call_id',
    'callLogId',
    'call_log_id',
    'uniqueId',
    'unique_id',
    'sid',
  ]);

  const callerPhone = normalizePhone(firstString(payload, [
    'number',
    'phone',
    'mobile',
    'callerNumber',
    'caller_number',
    'customerNumber',
    'customer_number',
    'clientNumber',
    'client_number',
  ]));

  const employeePhone = normalizePhone(firstString(payload, [
    'employeeNumber',
    'employee_number',
    'emp_number',
    'empNumber',
    'agentNumber',
    'agent_number',
    'staffNumber',
    'staff_number',
  ]));

  const callType = normalizeCallType(firstString(payload, [
    'callType',
    'call_type',
    'type',
    'direction',
  ]));

  const callStartedAt = normalizeDate(firstString(payload, [
    'callTime',
    'call_time',
    'callStartTime',
    'call_start_time',
    'callStartDate',
    'call_start_date',
    'startTime',
    'start_time',
    'createdAt',
    'created_at',
  ]));

  const durationSeconds = firstNumber(payload, [
    'duration',
    'durationSeconds',
    'duration_seconds',
    'callDuration',
    'call_duration',
    'talkTime',
    'talk_time',
  ]);

  const recordingUrl = firstString(payload, [
    'recordingURL',
    'recordingUrl',
    'recording_url',
    'recording',
    'audioUrl',
    'audio_url',
    'callRecordingUrl',
    'call_recording_url',
  ]);

  return {
    provider: 'callyzer',
    provider_call_id: providerCallId,
    employee_name: firstString(payload, [
      'employeeName',
      'employee_name',
      'emp_name',
      'empName',
      'agentName',
      'agent_name',
      'staffName',
      'staff_name',
    ]),
    employee_phone: employeePhone || null,
    caller_phone: callerPhone || 'unknown',
    caller_name: firstString(payload, [
      'name',
      'callerName',
      'caller_name',
      'customerName',
      'customer_name',
      'clientName',
      'client_name',
    ]),
    call_type: callType,
    call_status: firstString(payload, ['status', 'callStatus', 'call_status']),
    call_started_at: callStartedAt,
    duration_seconds: durationSeconds,
    recording_source_url: recordingUrl,
    raw_payload: payload,
  };
}

export function pickRecordsFromCallyzerResponse(response: unknown): unknown[] {
  if (Array.isArray(response)) return response;

  const payload = (response || {}) as Record<string, unknown>;
  const possibleArrays = [
    payload.data,
    payload.records,
    payload.result,
    payload.results,
    payload.callHistory,
    payload.calls,
  ];

  for (const item of possibleArrays) {
    if (Array.isArray(item)) return item;
  }

  if (payload.data && typeof payload.data === 'object') {
    const nested = payload.data as Record<string, unknown>;
    for (const key of ['records', 'result', 'results', 'callHistory', 'calls']) {
      if (Array.isArray(nested[key])) return nested[key] as unknown[];
    }
  }

  return [];
}

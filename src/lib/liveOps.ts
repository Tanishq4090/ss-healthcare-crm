import { supabase } from '@/lib/supabase';

export const CRM_STAGES = [
  { id: 'new-lead', label: 'New Lead' },
  { id: 'new-inquiry', label: 'New Inquiry' },
  { id: 'in-discussion', label: 'In Discussion' },
  { id: 'quotation-sent', label: 'Quotation Sent' },
  { id: 'staff-confirmed', label: 'Staff Confirmed' },
  { id: 'deposit-pending', label: 'Deposit Pending' },
  { id: 'closed-won', label: 'Active Client' },
  { id: 'closed-lost', label: 'Closed Lost' },
] as const;

export const stageLabel = CRM_STAGES.reduce<Record<string, string>>((acc, stage) => {
  acc[stage.id] = stage.label;
  return acc;
}, {});

export const stageColors: Record<string, string> = {
  'new-lead': '#3B82F6',
  'new-inquiry': '#8B5CF6',
  'in-discussion': '#F59E0B',
  'quotation-sent': '#EC4899',
  'staff-confirmed': '#0EA5E9',
  'deposit-pending': '#F97316',
  'closed-won': '#00A859',
  'closed-lost': '#64748B',
};

export type LeadRow = {
  id: string;
  client_name?: string | null;
  contact_person?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  stage?: string | null;
  priority?: string | null;
  value?: number | null;
  assignee?: string | null;
  tags?: string[] | null;
  notes?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type CallInquiry = {
  id: string;
  external_call_id?: string | null;
  caller_number: string;
  caller_name?: string | null;
  employee_name?: string | null;
  employee_number?: string | null;
  call_type?: string | null;
  call_status?: string | null;
  duration_seconds?: number | null;
  call_started_at?: string | null;
  recording_url?: string | null;
  recording_path?: string | null;
  transcript?: string | null;
  summary?: string | null;
  extracted_patient_name?: string | null;
  extracted_service?: string | null;
  extracted_location?: string | null;
  extracted_urgency?: string | null;
  extracted_preferred_time?: string | null;
  extracted_budget?: string | null;
  extracted_language?: string | null;
  review_notes?: string | null;
  review_status: string;
  lead_id?: string | null;
  created_at: string;
  updated_at?: string | null;
};

export type EmployeeRow = {
  id: string;
  full_name: string;
  username?: string | null;
  phone?: string | null;
  role?: string | null;
  position?: string | null;
  department?: string | null;
  shift_hours?: number | null;
  accesses?: string[] | null;
  created_at?: string | null;
};

export type AttendanceRow = {
  id: string;
  employee_id: string;
  employee_name?: string | null;
  work_date: string;
  status: string;
  check_in_time?: string | null;
  check_out_time?: string | null;
  hours_worked?: number | null;
  notes?: string | null;
  created_at?: string | null;
};

export function formatINR(value: number | null | undefined) {
  return `₹${Number(value || 0).toLocaleString('en-IN')}`;
}

export function formatDateTime(value?: string | null) {
  if (!value) return '—';
  try {
    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value));
  } catch {
    return '—';
  }
}

export function formatDuration(seconds?: number | null) {
  const total = Number(seconds || 0);
  if (!total) return '0s';
  const min = Math.floor(total / 60);
  const sec = total % 60;
  return min ? `${min}m ${sec}s` : `${sec}s`;
}

export function todayIndia() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

export async function fetchLiveOpsSnapshot() {
  const today = todayIndia();
  const [leadsRes, callsRes, employeesRes, attendanceRes] = await Promise.allSettled([
    supabase.from('crm_leads').select('*').order('created_at', { ascending: false }).limit(500),
    supabase.from('call_inquiries').select('*').order('created_at', { ascending: false }).limit(200),
    supabase.from('employees').select('*').order('full_name', { ascending: true }).limit(500),
    supabase.from('manual_attendance').select('*').eq('work_date', today).limit(500),
  ]);

  return {
    leads: leadsRes.status === 'fulfilled' ? ((leadsRes.value.data || []) as LeadRow[]) : [],
    calls: callsRes.status === 'fulfilled' ? ((callsRes.value.data || []) as CallInquiry[]) : [],
    employees: employeesRes.status === 'fulfilled' ? ((employeesRes.value.data || []) as EmployeeRow[]) : [],
    attendance: attendanceRes.status === 'fulfilled' ? ((attendanceRes.value.data || []) as AttendanceRow[]) : [],
    errors: {
      leads: leadsRes.status === 'fulfilled' ? leadsRes.value.error?.message : 'Failed to load leads',
      calls: callsRes.status === 'fulfilled' ? callsRes.value.error?.message : 'Failed to load calls',
      employees: employeesRes.status === 'fulfilled' ? employeesRes.value.error?.message : 'Failed to load employees',
      attendance: attendanceRes.status === 'fulfilled' ? attendanceRes.value.error?.message : 'Failed to load attendance',
    },
  };
}

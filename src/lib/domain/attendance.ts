/**
 * Attendance Domain Logic
 * Manages attendance tracking for deployed staff.
 */
import { supabase } from '@/lib/supabase';

export type AttendanceRecord = {
  id: string;
  employee_id: string;
  date: string;
  status: 'present' | 'absent' | 'half-day' | 'leave';
  check_in?: string | null;
  check_out?: string | null;
  notes?: string | null;
};

export async function fetchAttendanceForDate(date: string): Promise<AttendanceRecord[]> {
  const { data, error } = await supabase
    .from('attendance')
    .select('*')
    .eq('date', date)
    .order('created_at', { ascending: false });
  if (error) {
    console.warn('Attendance fetch error:', error.message);
    return [];
  }
  return (data || []) as AttendanceRecord[];
}

export async function markAttendance(
  employeeId: string,
  date: string,
  status: AttendanceRecord['status'],
) {
  const { data, error } = await supabase
    .from('attendance')
    .upsert({ employee_id: employeeId, date, status }, { onConflict: 'employee_id,date' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export function todayDateString(): string {
  return new Date().toISOString().split('T')[0];
}

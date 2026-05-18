/**
 * Staff Assignment Domain Logic
 * Handles worker-to-lead assignment formatting and operations.
 */
import { supabase } from '@/lib/supabase';

export async function fetchAvailableWorkers() {
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function assignWorkerToLead(leadId: string, worker: {
  id: string;
  full_name: string;
  job_title?: string;
  employee_code?: string;
}) {
  const { error } = await supabase
    .from('crm_leads')
    .update({
      stage: 'staff-assigned',
      assigned_staff_name: worker.full_name,
      assigned_staff_role: worker.job_title || 'Care Specialist',
      assigned_staff_id: worker.employee_code || worker.id,
    })
    .eq('id', leadId);
  if (error) throw error;
}

export function formatWorkerCard(worker: {
  full_name: string;
  job_title?: string | null;
  phone?: string | null;
  availability_status?: string | null;
}) {
  return {
    name: worker.full_name,
    role: worker.job_title || 'Care Specialist',
    phone: worker.phone || '',
    available: (worker.availability_status || 'available') === 'available',
  };
}

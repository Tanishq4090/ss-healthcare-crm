/**
 * Staff Assignment Service
 * Backend operations for assigning workers to clients/leads.
 */
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function assignWorker(leadId, workerId) {
  const { data: worker, error: wErr } = await supabase
    .from('employees')
    .select('*')
    .eq('id', workerId)
    .single();
  if (wErr) throw wErr;

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

  // Mark worker as assigned
  await supabase
    .from('employees')
    .update({ availability_status: 'assigned' })
    .eq('id', workerId);

  return { lead_id: leadId, worker };
}

async function getAvailableWorkers() {
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .eq('availability_status', 'available')
    .order('full_name');
  if (error) throw error;
  return data || [];
}

module.exports = { assignWorker, getAvailableWorkers };

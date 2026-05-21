import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function testWorkflows() {
  console.log('=== Starting Operational Workflow Validation ===');

  // 1. Fetch lead & employee
  const { data: leads } = await supabase.from('crm_leads').select('id, client_name, stage').order('created_at', { ascending: false }).limit(1);
  const { data: employees } = await supabase.from('employees').select('id, full_name, employee_code').limit(1);

  if (!leads || leads.length === 0) {
    console.error('No leads found in database.');
    return;
  }
  if (!employees || employees.length === 0) {
    console.error('No employees found in database.');
    return;
  }

  const lead = leads[0];
  const employee = employees[0];

  console.log(`Using Lead: "${lead.client_name}" (${lead.id}) currently in stage: "${lead.stage}"`);
  console.log(`Using Employee: "${employee.full_name}" (${employee.id})`);

  // 2. Assign staff to lead via RPC
  console.log('\n--- Step 1: Assigning Staff ---');
  const { data: assignResult, error: assignError } = await supabase.rpc('assign_staff_to_lead', {
    p_lead_id: lead.id,
    p_employee_id: employee.id,
    p_sent_by: 'admin'
  });

  if (assignError) {
    console.error('Assignment RPC Error:', assignError);
    return;
  }
  console.log('Assignment RPC Success:', assignResult);

  // 3. Verify lead stage updated
  const { data: updatedLead } = await supabase.from('crm_leads').select('id, client_name, stage, assigned_staff_name').eq('id', lead.id).single();
  console.log(`Updated Lead stage: "${updatedLead.stage}", assigned staff: "${updatedLead.assigned_staff_name}"`);

  if (updatedLead.stage !== 'staff-assigned') {
    console.error('FAIL: Lead stage was not updated to staff-assigned.');
  } else {
    console.log('PASS: Lead stage successfully updated to staff-assigned.');
  }

  // 4. Log WhatsApp template message via RPC
  console.log('\n--- Step 2: Logging Prefilled WhatsApp Template ---');
  const templateName = 'staff_assigned';
  const phone = '+919999888877';
  const content = `Good news ji. We have assigned ${employee.full_name} for your service. Please verify the staff ID card here: http://localhost:5173/staff-id/${employee.id}`;

  const { data: logResult, error: logError } = await supabase.rpc('log_whatsapp_template_message', {
    p_lead_id: lead.id,
    p_phone: phone,
    p_template_name: templateName,
    p_content: content,
    p_payload: { name: lead.client_name, staff_name: employee.full_name, staff_role: 'Caregiver', id_card_url: `http://localhost:5173/staff-id/${employee.id}` },
    p_sent_by: 'admin'
  });

  if (logError) {
    console.error('Template Log RPC Error:', logError);
    return;
  }
  console.log('Template Log RPC Success:', logResult);

  // 5. Verify log entries
  const { data: logs } = await supabase.from('template_message_logs').select('*').eq('lead_id', lead.id).order('created_at', { ascending: false }).limit(1);
  console.log('Verified Log Entry in template_message_logs:', logs[0]);

  if (logs.length > 0 && logs[0].template_name === templateName) {
    console.log('PASS: WhatsApp template transaction successfully logged.');
  } else {
    console.error('FAIL: WhatsApp template transaction was not logged.');
  }

  console.log('\n=== Operational Workflow Validation Complete ===');
}

testWorkflows();

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function verify() {
  console.log("\n=== 1. Checking crm_leads ===");
  const { data: leads } = await supabase.from('crm_leads')
    .select('id, client_name, phone, stage, assigned_staff_id, assigned_staff_name')
    .order('created_at', { ascending: false }).limit(10);
  console.log(leads);

  console.log("\n=== 2. Checking call_inquiries ===");
  const { data: calls } = await supabase.from('call_inquiries')
    .select('id, caller_number, intent, review_status, lead_id')
    .order('created_at', { ascending: false }).limit(10);
  console.log(calls);

  console.log("\n=== 3. Checking lead_staff_assignments ===");
  const { data: assignments } = await supabase.from('lead_staff_assignments')
    .select('*').order('created_at', { ascending: false }).limit(10);
  console.log(assignments);

  console.log("\n=== 4. Checking template_message_logs ===");
  const { data: templates } = await supabase.from('template_message_logs')
    .select('*').order('created_at', { ascending: false }).limit(10);
  console.log(templates);
}

verify();

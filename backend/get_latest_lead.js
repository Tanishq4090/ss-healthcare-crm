import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function getLatest() {
  const { data: leads, error } = await supabase.from('crm_leads')
    .select('*')
    .order('created_at', { ascending: false }).limit(1);
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Latest CRM Lead:', leads[0]);
  }
}

getLatest();

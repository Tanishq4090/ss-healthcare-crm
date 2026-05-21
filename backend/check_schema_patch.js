import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkRowCounts() {
  const { count, error } = await supabase.from('template_message_logs').select('*', { count: 'exact', head: true });
  if (error) {
    console.error('Error getting count:', error);
  } else {
    console.log('Row count in template_message_logs:', count);
  }
}

checkRowCounts();

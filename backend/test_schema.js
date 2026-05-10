import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function checkSchema() {
  const { data, error } = await supabase.rpc('execute_sql_query', { query: "select column_name, data_type from information_schema.columns where table_name='call_inquiries';" });
  if (error) {
    console.error("RPC Error:", error);
    // fallback: just try to insert a uuid into lead_id and pipeline_lead_id
  }
}

checkSchema();

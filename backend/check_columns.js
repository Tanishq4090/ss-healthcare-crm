import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function check() {
  const { data, error } = await supabase.from('call_inquiries').select('*').limit(1);
  if (error) {
    console.error('Error fetching call_inquiries:', error);
  } else {
    console.log('Columns in call_inquiries:', Object.keys(data[0] || {}));
  }
}

check();

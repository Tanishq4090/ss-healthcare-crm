import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkColumns() {
  const { data, error } = await supabase.from('whatsapp_messages').select('*').limit(1);
  if (error) {
     console.error("Error fetching whatsapp_messages:", error);
  } else {
     if (data.length === 0) {
        console.log("whatsapp_messages is empty. Getting columns from error...");
        const { error: err2 } = await supabase.from('whatsapp_messages').insert([{ dummy: 1 }]);
        console.log("Insert error details (might show columns):", err2);
     } else {
        console.log("Columns in whatsapp_messages:", Object.keys(data[0]));
     }
  }
}
checkColumns();

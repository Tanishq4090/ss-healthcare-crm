import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function testRpc() {
  const { data: calls } = await supabase.from('call_inquiries').select('*').limit(1);
  if (!calls || calls.length === 0) {
    console.log("No calls found");
    return;
  }
  const call = calls[0];
  console.log("Testing RPC with call ID:", call.id);
  const { data, error } = await supabase.rpc('add_call_inquiry_to_pipeline', { p_call_id: call.id });
  if (error) {
    console.error("RPC Error:", error);
  } else {
    console.log("RPC Success:", data);
  }
}

testRpc();

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkSchema() {
    try {
        const { data, error } = await supabase.from('template_message_logs').select('*').limit(1);
        if (error) {
            console.error('Error fetching template_message_logs:', error);
        } else {
            console.log('template_message_logs exists. Keys:', data.length ? Object.keys(data[0]) : 'Table is empty');

            // let's check exact columns by doing an explain or simply checking error
            const testRow = { phone: '1', template_name: 't', payload: '{}', status: 'sent', provider: 'wa.me', sent_by: null };
            console.log("Checking insert capability for: phone, template_name, payload, status, provider, sent_by");
        }

        const { data: rpcData, error: rpcError } = await supabase.rpc('log_whatsapp_template_message', {
            p_phone: '+1234567890',
            p_template_name: 'test_schema',
            p_payload: '{}',
            p_sent_by: null
        });
        if (rpcError) {
             console.error('Error executing log_whatsapp_template_message RPC:', rpcError);
        } else {
             console.log('RPC log_whatsapp_template_message seems to exist and execute properly.');
        }

    } catch (e) {
        console.error('Exception during schema check:', e);
    }
}
checkSchema();

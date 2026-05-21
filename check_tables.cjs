const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Parse .env manually to avoid dotenv dependency issues
const envContent = fs.readFileSync(path.join(__dirname, '.env'), 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
        const key = match[1];
        let value = match[2] || '';
        if (value.length > 0 && value.charAt(0) === '"' && value.charAt(value.length - 1) === '"') {
            value = value.replace(/^"|"+$/g, '');
        }
        env[key] = value.trim();
    }
});

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
    console.log('Fetching single lead to see columns...');
    const { data: leads, error: leadError } = await supabase.from('crm_leads').select('*').limit(1);
    if (leadError) {
        console.error('Lead error:', leadError);
    } else {
        console.log('Lead columns:', Object.keys(leads[0] || {}));
        console.log('Lead sample:', leads[0]);
    }

    console.log('\nFetching CRM settings...');
    const { data: settings, error: settingsError } = await supabase.from('crm_settings').select('*');
    if (settingsError) {
        console.error('Settings error:', settingsError);
    } else {
        console.log('Settings rows count:', settings.length);
        if (settings[0]) {
            console.log('Settings columns:', Object.keys(settings[0]));
            console.log('Settings content:', settings[0]);
        }
    }
}

main();

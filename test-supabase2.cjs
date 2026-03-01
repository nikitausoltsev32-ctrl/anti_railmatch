require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function test() {
    const { data, error } = await sb.from('requests').select('*').limit(1);
    if (data && data.length > 0) {
        console.log('KEYS:', Object.keys(data[0]));
    } else {
        console.log('No data found, but error is:', error);
    }
}
test();

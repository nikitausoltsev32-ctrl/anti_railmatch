require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function test() {
    const { data, error } = await sb.from('requests').insert([{
        stationFrom: 'A',
        stationTo: 'B',
        cargoType: 'C',
        wagonType: 'D',
        totalWagons: 1,
        totalTons: 1,
        target_price: 1,
        fulfilledWagons: 0,
        fulfilledTons: 0,
        shipperId: '00000000-0000-0000-0000-000000000000',
        shipperName: 'test',
        shipperPhone: 'test',
        shipperInn: 'test',
        status: 'open'
    }]);
    console.log('RESULT:', data);
    console.log('ERROR:', JSON.stringify(error, null, 2));
}
test();

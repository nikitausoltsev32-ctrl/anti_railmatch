import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function testInsert() {
    // Attempting to insert a small mock to see what the exact 400 error is.
    const mockRequest = {
        stationFrom: 'Екатеринбург',
        stationTo: 'Москва',
        cargoType: 'ТНП',
        wagonType: 'Крытый',
        totalWagons: 10,
        totalTons: 600,
        target_price: 180000,
        fulfilledWagons: 0,
        fulfilledTons: 0,
        shipperInn: '7700000000',
        status: 'open'
    };

    const { data, error } = await supabase.from('requests').insert([mockRequest]);
    if (error) {
        console.log("INSERT ERROR:");
        console.log(JSON.stringify(error, null, 2));
    } else {
        console.log("INSERT SUCCESS!");
    }
}
testInsert();

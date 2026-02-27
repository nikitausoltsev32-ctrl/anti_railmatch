import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function test() {
    const { data, error } = await supabase.from('requests').insert([{ stationFrom: 'A', stationTo: 'B', cargoType: 'C', wagonType: 'Крытый', totalWagons: 1, totalTons: 0, target_price: 100, fulfilledWagons: 0, fulfilledTons: 0, shipperInn: '123', status: 'open' }]);
    console.log("TEST INSERT RESULT:", error);
}
test();

import fs from 'fs';

const env = fs.readFileSync('.env', 'utf-8');
const SUPABASE_URL = env.match(/VITE_SUPABASE_URL=(.*)/)[1].trim();
const SUPABASE_KEY = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1].trim();

async function testFetch() {
    console.log("Fetching from:", SUPABASE_URL);
    const res = await fetch(`${SUPABASE_URL}/rest/v1/requests?select=*&limit=1`, {
        headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`
        }
    });

    const body = await res.json();
    console.log("RESPONSE:", JSON.stringify(body, null, 2));


    const resPost = await fetch(`${SUPABASE_URL}/rest/v1/requests`, {
        method: 'POST',
        headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        },
        body: JSON.stringify({
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
        })
    });

    const bodyPost = await resPost.json();
    console.log("POST RESPONSE:", JSON.stringify(bodyPost, null, 2));
}

testFetch();

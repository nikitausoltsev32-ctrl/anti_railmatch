import fs from 'fs';

const env = fs.readFileSync('.env', 'utf-8');
const SUPABASE_URL = env.match(/VITE_SUPABASE_URL=(.*)/)[1].trim();
const SUPABASE_KEY = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1].trim();

async function resetDemoData() {
    console.log("deleting old mock data...");

    const delRes = await fetch(`${SUPABASE_URL}/rest/v1/requests?shipperInn=in.(7700000000,7711111111)`, {
        method: 'DELETE',
        headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`
        }
    });

    if (!delRes.ok) {
        console.error("Delete Error:", await delRes.text());
        return;
    }

    const mockRequests = [
        { stationFrom: 'Екатеринбург', stationTo: 'Москва', cargoType: 'ТНП', wagonType: 'Крытый', totalWagons: 10, totalTons: 600, target_price: 180000, fulfilledWagons: 0, fulfilledTons: 0, shipperInn: '7700000000', status: 'open' },
        { stationFrom: 'Екатеринбург', stationTo: 'Москва', cargoType: 'ТНП', wagonType: 'Крытый', totalWagons: 15, totalTons: 900, target_price: 150000, fulfilledWagons: 0, fulfilledTons: 0, shipperInn: '7700000000', status: 'open' },
        { stationFrom: 'Екатеринбург', stationTo: 'Москва', cargoType: 'ТНП', wagonType: 'Крытый', totalWagons: 5, totalTons: 300, target_price: 165000, fulfilledWagons: 0, fulfilledTons: 0, shipperInn: '7700000000', status: 'open' },
        { stationFrom: 'Санкт-Петербург', stationTo: 'Казань', cargoType: 'Уголь', wagonType: 'Полувагон', totalWagons: 50, totalTons: 3500, target_price: 120000, fulfilledWagons: 0, fulfilledTons: 0, shipperInn: '7711111111', status: 'open' },
        { stationFrom: 'Санкт-Петербург', stationTo: 'Казань', cargoType: 'Уголь', wagonType: 'Полувагон', totalWagons: 20, totalTons: 1400, target_price: 90000, fulfilledWagons: 0, fulfilledTons: 0, shipperInn: '7711111111', status: 'open' }
    ];

    console.log("inserting 5 fresh mock requests...");
    const insRes = await fetch(`${SUPABASE_URL}/rest/v1/requests`, {
        method: 'POST',
        headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(mockRequests)
    });

    if (!insRes.ok) {
        console.error("Insert Error:", await insRes.text());
    } else {
        console.log("Successfully reset 5 mock requests.");
    }
}

resetDemoData();

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const mockRequests = [
    {
        stationFrom: 'Екатеринбург', stationTo: 'Москва', cargoType: 'ТНП', wagonType: 'Крытый', totalWagons: 10, totalTons: 600, target_price: 180000, fulfilledWagons: 0, fulfilledTons: 0, shipperInn: '7700000000', status: 'open'
    },
    {
        stationFrom: 'Екатеринбург', stationTo: 'Москва', cargoType: 'ТНП', wagonType: 'Крытый', totalWagons: 15, totalTons: 900, target_price: 150000, fulfilledWagons: 0, fulfilledTons: 0, shipperInn: '7700000000', status: 'open'
    },
    {
        stationFrom: 'Екатеринбург', stationTo: 'Москва', cargoType: 'ТНП', wagonType: 'Крытый', totalWagons: 5, totalTons: 300, target_price: 165000, fulfilledWagons: 0, fulfilledTons: 0, shipperInn: '7700000000', status: 'open'
    },
    {
        stationFrom: 'Санкт-Петербург', stationTo: 'Казань', cargoType: 'Уголь', wagonType: 'Полувагон', totalWagons: 50, totalTons: 3500, target_price: 120000, fulfilledWagons: 0, fulfilledTons: 0, shipperInn: '7711111111', status: 'open'
    },
    {
        stationFrom: 'Санкт-Петербург', stationTo: 'Казань', cargoType: 'Уголь', wagonType: 'Полувагон', totalWagons: 20, totalTons: 1400, target_price: 90000, fulfilledWagons: 0, fulfilledTons: 0, shipperInn: '7711111111', status: 'open'
    }
];

async function insertMockData() {
    console.log("Inserting mock data...");
    const { data, error } = await supabase.from('requests').insert(mockRequests);

    if (error) {
        console.error("Error inserting mock data:", error);
    } else {
        console.log("Successfully inserted mock data!");
    }
}

insertMockData();

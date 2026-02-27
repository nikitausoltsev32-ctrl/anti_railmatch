import fs from 'fs';

const env = fs.readFileSync('.env', 'utf-8');
const SUPABASE_URL = env.match(/VITE_SUPABASE_URL=(.*)/)[1].trim();
const SUPABASE_KEY = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1].trim();

async function testFetch() {
    // Open API spec to see columns
    const res = await fetch(`${SUPABASE_URL}/rest/v1/`, {
        headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`
        }
    });

    const body = await res.json();
    console.log("SCHEMA:");
    if (body.definitions && body.definitions.requests) {
        console.log(JSON.stringify(body.definitions.requests.properties, null, 2));
    } else {
        console.log("Not found in OpenAPI spec");
    }
}

testFetch();

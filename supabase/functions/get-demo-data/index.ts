// Supabase Edge Function: get-demo-data
// Returns all open requests and profiles for unauthenticated demo users.
// Uses service role to bypass RLS.
//
// Deploy:
//   supabase functions deploy get-demo-data --no-verify-jwt

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

        const [{ data: requests }, { data: profiles }] = await Promise.all([
            supabase
                .from('requests')
                .select('*')
                .eq('status', 'open')
                .order('created_at', { ascending: false }),
            supabase
                .from('profiles')
                .select('id, name, company, inn, role, verification_status, is_verified'),
        ]);

        return new Response(JSON.stringify({ requests: requests ?? [], profiles: profiles ?? [] }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });
    } catch (err) {
        return new Response(JSON.stringify({ error: String(err) }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        });
    }
});

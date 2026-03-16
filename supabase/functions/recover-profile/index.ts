// Supabase Edge Function: recover-profile
// Creates a missing profile row for an authenticated user using admin credentials.
// Called client-side when the user has an auth account but no profile row
// (e.g. profile insert failed silently during registration).
//
// Deploy:
//   supabase functions deploy recover-profile --no-verify-jwt

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
    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    // Verify caller is an authenticated Supabase user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
    const jwt = authHeader.slice(7);

    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: { autoRefreshToken: false, persistSession: false },
    });

    // Resolve the calling user's identity from the JWT
    const { data: { user }, error: userError } = await adminClient.auth.getUser(jwt);
    if (userError || !user) {
        return new Response(JSON.stringify({ error: 'Invalid token' }), {
            status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    // Check whether a profile already exists (race-condition safety)
    const { data: existing } = await adminClient
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    if (existing) {
        return new Response(JSON.stringify({ ok: true, profile: existing }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    // Build profile from user_metadata (populated by send-confirmation-email)
    const meta = user.user_metadata ?? {};
    const name = meta.name?.trim() || 'Пользователь';
    const company = meta.company?.trim() || '';
    const phone = meta.phone?.trim() || '';
    const role = meta.role === 'shipper' ? 'shipper' : 'owner';
    const email = user.email ?? '';
    const inn = `9${Date.now().toString().slice(-9)}`;

    const { error: insertError } = await adminClient
        .from('profiles')
        .insert([{ id: user.id, name, company, phone, role, email, inn, plan: 'Free', leakage_attempts: 0, daily_profile_views: 0 }]);

    if (insertError) {
        console.error('recover-profile insert error:', insertError);
        return new Response(JSON.stringify({ error: insertError.message }), {
            status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    const { data: profile } = await adminClient
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    return new Response(JSON.stringify({ ok: true, profile }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
});

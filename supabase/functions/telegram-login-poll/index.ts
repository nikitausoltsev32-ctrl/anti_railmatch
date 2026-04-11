import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  let body: { code: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const { code } = body;
  if (!code) return json({ error: "Missing code" }, 400);

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: token } = await supabase
    .from("telegram_login_tokens")
    .select("status, access_token, refresh_token, expires_at, needs_onboarding")
    .eq("code", code)
    .maybeSingle();

  if (!token) return json({ error: "Token not found" }, 404);

  if (token.status === "claimed") {
    return json({
      claimed: true,
      access_token: token.access_token,
      refresh_token: token.refresh_token,
      needs_onboarding: token.needs_onboarding ?? false,
    });
  }

  if (new Date(token.expires_at) < new Date()) {
    // Mark as expired
    await supabase.from("telegram_login_tokens").update({ status: "expired" }).eq("code", code);
    return json({ expired: true });
  }

  return json({ claimed: false });
});

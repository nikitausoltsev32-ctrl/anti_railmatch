import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const BOT_SECRET = Deno.env.get("BOT_WEBHOOK_SECRET")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, x-bot-secret",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function getSession(
  supabase: ReturnType<typeof createClient>,
  email: string
) {
  const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
    type: "magiclink",
    email,
  });
  if (linkError || !linkData?.properties?.hashed_token) {
    console.error("generateLink error:", linkError);
    return null;
  }
  const { data: session, error: otpError } = await supabase.auth.verifyOtp({
    token_hash: linkData.properties.hashed_token,
    type: "magiclink",
  });
  if (otpError || !session?.session) {
    console.error("verifyOtp error:", otpError);
    return null;
  }
  return session.session;
}

async function createOrLoginUser(
  supabase: ReturnType<typeof createClient>,
  telegramId: string,
  firstName: string,
  username?: string
) {
  const fakeEmail = `tg_${telegramId}@railmatch.internal`;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("telegram_id", telegramId)
    .maybeSingle();

  if (profile) {
    const session = await getSession(supabase, fakeEmail);
    if (!session) return { error: "Failed to create session" };
    return {
      user_id: profile.id,
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      needs_onboarding: !profile.role,
    };
  }

  // New user
  const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
    email: fakeEmail,
    password: crypto.randomUUID(),
    email_confirm: true,
    user_metadata: { telegram_id: telegramId, telegram_username: username || null, name: firstName },
  });

  if (createError || !newUser?.user) {
    console.error("createUser error:", createError);
    return { error: `Failed to create user: ${createError?.message || 'unknown'}` };
  }

  await supabase.from("profiles").upsert([{
    id: newUser.user.id,
    telegram_id: telegramId,
    telegram_username: username || null,
    name: firstName,
    inn: `9${Date.now().toString().slice(-9)}`,
  }], { onConflict: "id" });

  const session = await getSession(supabase, fakeEmail);
  if (!session) return { error: "Failed to create session for new user" };

  return {
    user_id: newUser.user.id,
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    needs_onboarding: true,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const secret = req.headers.get("x-bot-secret");
  if (!secret || secret !== BOT_SECRET) return json({ error: "Unauthorized" }, 401);

  let body: { code: string; telegram_id: number; telegram_username?: string; first_name?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const { code, telegram_id, telegram_username, first_name } = body;
  if (!code || !telegram_id) return json({ error: "Missing code or telegram_id" }, 400);

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: token, error: tokenError } = await supabase
    .from("telegram_login_tokens")
    .select("*")
    .eq("code", code)
    .eq("status", "pending")
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (tokenError || !token) return json({ error: "Invalid or expired code" }, 404);

  let result;
  try {
    result = await createOrLoginUser(
      supabase,
      String(telegram_id),
      first_name || "Пользователь",
      telegram_username
    );
  } catch (err) {
    console.error("createOrLoginUser threw:", err);
    return json({ error: `Internal: ${err.message}` }, 500);
  }

  if (result.error) return json({ error: result.error }, 500);

  await supabase.from("telegram_login_tokens").update({
    status: "claimed",
    telegram_id,
    user_id: result.user_id,
    access_token: result.access_token,
    refresh_token: result.refresh_token,
    needs_onboarding: result.needs_onboarding ?? false,
  }).eq("code", code);

  return json({ ok: true, needs_onboarding: result.needs_onboarding });
});

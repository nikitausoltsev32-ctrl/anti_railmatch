import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN")!;
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

// Login Widget verification: secret = SHA-256(bot_token), then HMAC-SHA-256(data_check_string, secret)
async function verifyWidgetHash(data: Record<string, string>): Promise<boolean> {
  const { hash, ...rest } = data;
  if (!hash) return false;

  const dataCheckString = Object.keys(rest)
    .sort()
    .map((k) => `${k}=${rest[k]}`)
    .join("\n");

  const secretKey = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(TELEGRAM_BOT_TOKEN)
  );

  const hmacKey = await crypto.subtle.importKey(
    "raw",
    secretKey,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "HMAC",
    hmacKey,
    new TextEncoder().encode(dataCheckString)
  );

  const hexHash = Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return hexHash === hash;
}

// Mini App (WebApp) verification: secret = HMAC-SHA-256(bot_token, "WebAppData"), then HMAC-SHA-256(data_check_string, secret)
async function verifyWebAppData(initData: string): Promise<{ valid: boolean; user: Record<string, unknown> | null }> {
  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash) return { valid: false, user: null };

  params.delete("hash");
  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join("\n");

  // secret_key = HMAC-SHA-256("WebAppData", bot_token)
  const webAppDataKey = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode("WebAppData"),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const secretKey = await crypto.subtle.sign(
    "HMAC",
    webAppDataKey,
    new TextEncoder().encode(TELEGRAM_BOT_TOKEN)
  );

  const hmacKey = await crypto.subtle.importKey(
    "raw",
    secretKey,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "HMAC",
    hmacKey,
    new TextEncoder().encode(dataCheckString)
  );

  const hexHash = Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  if (hexHash !== hash) return { valid: false, user: null };

  let user: Record<string, unknown> | null = null;
  const userParam = params.get("user");
  if (userParam) {
    try {
      user = JSON.parse(userParam);
    } catch {
      return { valid: false, user: null };
    }
  }

  return { valid: true, user };
}

async function createOrLoginUser(supabase: ReturnType<typeof createClient>, telegramId: string, firstName: string, username?: string) {
  // Look up existing profile by telegram_id
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("telegram_id", telegramId)
    .maybeSingle();

  if (profileError) {
    console.error("Profile lookup error:", profileError);
    return { error: "Database error" };
  }

  if (profile) {
    const { data: sessionData, error: sessionError } = await supabase.auth.admin.createSession({
      user_id: profile.id,
    });

    if (sessionError || !sessionData?.session) {
      console.error("Session creation error:", sessionError);
      return { error: "Failed to create session" };
    }

    return {
      access_token: sessionData.session.access_token,
      refresh_token: sessionData.session.refresh_token,
      needs_onboarding: !profile.role,
    };
  }

  // New user
  const fakeEmail = `tg_${telegramId}@railmatch.internal`;
  const fakePassword = crypto.randomUUID();

  const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
    email: fakeEmail,
    password: fakePassword,
    email_confirm: true,
    user_metadata: {
      telegram_id: telegramId,
      telegram_username: username || null,
      name: firstName || "Пользователь",
    },
  });

  if (createError || !newUser?.user) {
    console.error("User creation error:", createError);
    return { error: "Failed to create user" };
  }

  await supabase.from("profiles").upsert([{
    id: newUser.user.id,
    telegram_id: telegramId,
    telegram_username: username || null,
    name: firstName || "Пользователь",
    inn: `9${Date.now().toString().slice(-9)}`,
  }], { onConflict: "id" });

  const { data: sessionData, error: sessionError } = await supabase.auth.admin.createSession({
    user_id: newUser.user.id,
  });

  if (sessionError || !sessionData?.session) {
    console.error("Session creation error for new user:", sessionError);
    return { error: "Failed to create session" };
  }

  return {
    access_token: sessionData.session.access_token,
    refresh_token: sessionData.session.refresh_token,
    needs_onboarding: true,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  let body: Record<string, string>;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // --- Mini App (WebApp) auth ---
  if (body.init_data) {
    const { valid, user } = await verifyWebAppData(body.init_data);
    if (!valid || !user) {
      return json({ error: "Unauthorized: invalid WebApp data" }, 401);
    }

    const telegramId = String(user.id);
    const firstName = String(user.first_name || "Пользователь");
    const username = user.username ? String(user.username) : undefined;

    const result = await createOrLoginUser(supabase, telegramId, firstName, username);
    if (result.error) return json({ error: result.error }, 500);
    return json(result);
  }

  // --- Login Widget auth ---
  const { id, hash, auth_date, first_name, username, photo_url, last_name } = body;

  if (!id || !hash || !auth_date) {
    return json({ error: "Missing required fields: id, hash, auth_date" }, 400);
  }

  const now = Math.floor(Date.now() / 1000);
  if (now - parseInt(auth_date) > 86400) {
    return json({ error: "Auth data expired" }, 401);
  }

  const allFields: Record<string, string> = { id, hash, auth_date };
  if (first_name) allFields.first_name = first_name;
  if (last_name) allFields.last_name = last_name;
  if (username) allFields.username = username;
  if (photo_url) allFields.photo_url = photo_url;

  const valid = await verifyWidgetHash(allFields);
  if (!valid) {
    return json({ error: "Unauthorized: invalid hash" }, 401);
  }

  const result = await createOrLoginUser(supabase, String(id), first_name || "Пользователь", username);
  if (result.error) return json({ error: result.error }, 500);
  return json(result);
});

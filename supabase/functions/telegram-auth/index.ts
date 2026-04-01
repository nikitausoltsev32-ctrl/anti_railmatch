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

async function verifyTelegramHash(data: Record<string, string>): Promise<boolean> {
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

  const { id, hash, auth_date, first_name, username, photo_url, last_name } = body;

  if (!id || !hash || !auth_date) {
    return json({ error: "Missing required fields: id, hash, auth_date" }, 400);
  }

  // Verify auth_date is within 24 hours
  const now = Math.floor(Date.now() / 1000);
  if (now - parseInt(auth_date) > 86400) {
    return json({ error: "Auth data expired" }, 401);
  }

  // Verify HMAC hash
  const allFields: Record<string, string> = { id, hash, auth_date };
  if (first_name) allFields.first_name = first_name;
  if (last_name) allFields.last_name = last_name;
  if (username) allFields.username = username;
  if (photo_url) allFields.photo_url = photo_url;

  const valid = await verifyTelegramHash(allFields);
  if (!valid) {
    return json({ error: "Unauthorized: invalid hash" }, 401);
  }

  const telegramId = String(id);
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Look up existing profile by telegram_id
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("telegram_id", telegramId)
    .maybeSingle();

  if (profileError) {
    console.error("Profile lookup error:", profileError);
    return json({ error: "Database error" }, 500);
  }

  if (profile) {
    // Existing user — create session
    const { data: sessionData, error: sessionError } = await supabase.auth.admin.createSession({
      user_id: profile.id,
    });

    if (sessionError || !sessionData?.session) {
      console.error("Session creation error:", sessionError);
      return json({ error: "Failed to create session" }, 500);
    }

    const needsOnboarding = !profile.role;
    return json({
      access_token: sessionData.session.access_token,
      refresh_token: sessionData.session.refresh_token,
      needs_onboarding: needsOnboarding,
    });
  }

  // New user — create auth user + set telegram_id on profile
  const fakeEmail = `tg_${telegramId}@railmatch.internal`;
  const fakePassword = crypto.randomUUID();

  const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
    email: fakeEmail,
    password: fakePassword,
    email_confirm: true,
    user_metadata: {
      telegram_id: telegramId,
      telegram_username: username || null,
      name: first_name || "Пользователь",
    },
  });

  if (createError || !newUser?.user) {
    console.error("User creation error:", createError);
    return json({ error: "Failed to create user" }, 500);
  }

  // Update profile with telegram_id (trigger creates profile row)
  await supabase
    .from("profiles")
    .update({
      telegram_id: telegramId,
      telegram_username: username || null,
    })
    .eq("id", newUser.user.id);

  const { data: sessionData, error: sessionError } = await supabase.auth.admin.createSession({
    user_id: newUser.user.id,
  });

  if (sessionError || !sessionData?.session) {
    console.error("Session creation error for new user:", sessionError);
    return json({ error: "Failed to create session" }, 500);
  }

  return json({
    access_token: sessionData.session.access_token,
    refresh_token: sessionData.session.refresh_token,
    needs_onboarding: true,
  });
});

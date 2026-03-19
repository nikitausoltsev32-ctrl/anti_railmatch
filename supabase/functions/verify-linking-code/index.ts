import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const BOT_SECRET = Deno.env.get("BOT_WEBHOOK_SECRET")!;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "content-type, x-bot-secret" },
    });
  }

  // Verify bot secret
  const secret = req.headers.get("x-bot-secret");
  if (!BOT_SECRET || secret !== BOT_SECRET) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  let body: { code?: string; telegram_chat_id?: number; telegram_username?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400 });
  }

  const { code, telegram_chat_id, telegram_username } = body;
  if (!code || !telegram_chat_id) {
    return new Response(JSON.stringify({ error: "code and telegram_chat_id are required" }), { status: 400 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const now = new Date().toISOString();

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, name, telegram_id")
    .eq("telegram_link_token", code.toUpperCase())
    .gt("telegram_link_token_expires", now)
    .single();

  if (error || !profile) {
    // Check if code exists but expired
    const { data: expired } = await supabase
      .from("profiles")
      .select("id")
      .eq("telegram_link_token", code.toUpperCase())
      .single();

    if (expired) {
      return new Response(JSON.stringify({ error: "Code expired" }), { status: 410 });
    }
    return new Response(JSON.stringify({ error: "Invalid code" }), { status: 404 });
  }

  // Link telegram account
  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      telegram_id: telegram_chat_id,
      telegram_username: telegram_username || null,
      telegram_link_token: null,
      telegram_link_token_expires: null,
    })
    .eq("id", profile.id);

  if (updateError) {
    return new Response(JSON.stringify({ error: "Failed to link account" }), { status: 500 });
  }

  return new Response(JSON.stringify({ ok: true, name: profile.name }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});

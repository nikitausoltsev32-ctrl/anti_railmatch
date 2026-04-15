import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const NOTION_API = "https://api.notion.com/v1";
const NOTION_VERSION = "2022-06-28";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const notionToken = Deno.env.get("NOTION_TOKEN");
  const notionDbId = Deno.env.get("NOTION_USERS_DB_ID");

  if (!notionToken || !notionDbId) {
    return new Response(
      JSON.stringify({ error: "NOTION_TOKEN and NOTION_USERS_DB_ID env vars required" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Fetch all profiles from Supabase
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, name, email, role, company, phone, telegram_id, telegram_username, is_banned, is_verified, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Fetch existing pages to avoid duplicates (by email)
  const existingEmails = new Set<string>();
  let hasMore = true;
  let startCursor: string | undefined;

  while (hasMore) {
    const queryBody: Record<string, unknown> = { page_size: 100 };
    if (startCursor) queryBody.start_cursor = startCursor;

    const queryRes = await fetch(`${NOTION_API}/databases/${notionDbId}/query`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${notionToken}`,
        "Notion-Version": NOTION_VERSION,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(queryBody),
    });
    const queryData = await queryRes.json();

    for (const page of queryData.results || []) {
      const email = page.properties?.Email?.email;
      if (email) existingEmails.add(email);
    }

    hasMore = queryData.has_more;
    startCursor = queryData.next_cursor;
  }

  let synced = 0;

  for (const p of profiles || []) {
    if (!p.email || existingEmails.has(p.email)) continue;

    const isOnboarded = !!(p.name && p.name !== "—" && p.company && p.role !== "demo");
    const roleLabel =
      p.role === "shipper" ? "Грузовладелец" :
      p.role === "owner" ? "Владелец вагонов" :
      p.role === "admin" ? "Админ" : p.role;

    await fetch(`${NOTION_API}/pages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${notionToken}`,
        "Notion-Version": NOTION_VERSION,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        parent: { database_id: notionDbId },
        properties: {
          Name: { title: [{ text: { content: p.name || "—" } }] },
          Email: { email: p.email },
          Role: { select: { name: roleLabel } },
          Company: { rich_text: [{ text: { content: p.company || "—" } }] },
          Phone: { phone_number: p.phone || null },
          Telegram: { rich_text: [{ text: { content: p.telegram_username ? `@${p.telegram_username}` : "—" } }] },
          Onboarded: { checkbox: isOnboarded },
          Banned: { checkbox: !!p.is_banned },
          "Reg Date": { date: { start: p.created_at } },
        },
      }),
    });

    synced++;

    // Rate limit: Notion allows ~3 req/sec
    if (synced % 3 === 0) {
      await new Promise((r) => setTimeout(r, 1100));
    }
  }

  return new Response(
    JSON.stringify({ success: true, synced, total: profiles?.length || 0, skipped: existingEmails.size }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const NOTION_API = "https://api.notion.com/v1";
const NOTION_VERSION = "2022-06-28";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ROLE_LABEL: Record<string, string> = {
  shipper: "Грузовладелец",
  owner: "Владелец вагонов",
  admin: "Админ",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const token = Deno.env.get("NOTION_TOKEN");
  const violationsDb = Deno.env.get("NOTION_VIOLATIONS_DB_ID");
  const usersDb = Deno.env.get("NOTION_USERS_DB_ID");
  if (!token || !violationsDb || !usersDb) {
    return json({ error: "missing env" }, 400);
  }

  const svc = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: rows, error } = await svc
    .from("chat_violations")
    .select("id, user_id, match_id, detector, severity, snippet, created_at, profiles!inner(email, name, role)")
    .is("notion_synced_at", null)
    .order("created_at", { ascending: true })
    .limit(200);

  if (error) return json({ error: error.message }, 500);

  let synced = 0, skipped = 0, errors = 0;
  const userPagesCache = new Map<string, string>(); // email → notion page id

  for (const row of rows ?? []) {
    try {
      const profile = (row as any).profiles;
      const exists = await findExisting(token, violationsDb, row.id);
      if (!exists) {
        await fetch(`${NOTION_API}/pages`, {
          method: "POST",
          headers: notionHeaders(token),
          body: JSON.stringify({
            parent: { database_id: violationsDb },
            properties: {
              Name: { title: [{ text: { content: `${ROLE_LABEL[profile.role] ?? profile.role} — ${row.detector}` } }] },
              "User Email": { email: profile.email ?? null },
              "User Name": { rich_text: [{ text: { content: profile.name ?? "—" } }] },
              Role: { select: { name: ROLE_LABEL[profile.role] ?? profile.role } },
              Match: { rich_text: [{ text: { content: String(row.match_id).slice(0, 8) } }] },
              Detector: { select: { name: row.detector } },
              Severity: { select: { name: row.severity } },
              Snippet: { rich_text: [{ text: { content: row.snippet.slice(0, 1900) } }] },
              Created: { date: { start: row.created_at } },
              "Supabase ID": { rich_text: [{ text: { content: row.id } }] },
            },
          }),
        });
      }

      // Aggregate update on Users DB
      if (profile.email) {
        const userPageId = userPagesCache.get(profile.email)
          ?? await findUserPage(token, usersDb, profile.email);
        if (userPageId) {
          userPagesCache.set(profile.email, userPageId);
          const agg = await svc
            .from("chat_violations")
            .select("detector, created_at")
            .eq("user_id", row.user_id)
            .order("created_at", { ascending: false });
          const list = agg.data ?? [];
          await fetch(`${NOTION_API}/pages/${userPageId}`, {
            method: "PATCH",
            headers: notionHeaders(token),
            body: JSON.stringify({
              properties: {
                "Violations Count": { number: list.length },
                "Last Violation At": list[0] ? { date: { start: list[0].created_at } } : { date: null },
                "Last Violation Type": list[0] ? { select: { name: list[0].detector } } : { select: null },
              },
            }),
          });
        }
      }

      await svc
        .from("chat_violations")
        .update({ notion_synced_at: new Date().toISOString() })
        .eq("id", row.id);

      if (exists) skipped++; else synced++;
      await sleep(350);
    } catch (e) {
      errors++;
      console.error("sync row failed", row.id, e);
    }
  }

  return json({ synced, skipped, errors, total: rows?.length ?? 0 }, 200);
});

function notionHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    "Notion-Version": NOTION_VERSION,
    "Content-Type": "application/json",
  };
}

async function findExisting(token: string, db: string, supabaseId: string): Promise<boolean> {
  const r = await fetch(`${NOTION_API}/databases/${db}/query`, {
    method: "POST",
    headers: notionHeaders(token),
    body: JSON.stringify({
      filter: { property: "Supabase ID", rich_text: { equals: supabaseId } },
      page_size: 1,
    }),
  });
  const d = await r.json();
  return (d.results ?? []).length > 0;
}

async function findUserPage(token: string, db: string, email: string): Promise<string | null> {
  const r = await fetch(`${NOTION_API}/databases/${db}/query`, {
    method: "POST",
    headers: notionHeaders(token),
    body: JSON.stringify({
      filter: { property: "Email", email: { equals: email } },
      page_size: 1,
    }),
  });
  const d = await r.json();
  return d.results?.[0]?.id ?? null;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const json = (b: unknown, s: number) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

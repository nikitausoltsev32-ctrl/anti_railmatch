import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const NOTION_TOKEN = Deno.env.get("NOTION_TOKEN")!;
const NOTION_BUGS_DB_ID = Deno.env.get("NOTION_BUGS_DB_ID")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function ensureBucket(supabase: ReturnType<typeof createClient>) {
  const { error } = await supabase.storage.createBucket("bug-screenshots", {
    public: true,
    fileSizeLimit: 5242880,
    allowedMimeTypes: ["image/png", "image/jpeg", "image/webp"],
  });
  // Игнорируем ошибку "already exists"
  if (error && !error.message.includes("already exists")) {
    console.warn("Bucket creation warning:", error.message);
  }
}

serve(async (req) => {
  console.log("[bug-report] REQUEST:", req.method, new Date().toISOString());
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  let body: {
    description: string;
    screenshot_base64?: string;
    environment: Record<string, string>;
  };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const { description, screenshot_base64, environment } = body;

  if (!description) {
    return json({ error: "description is required" }, 400);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Загрузить скриншот если передан
  let screenshotUrl: string | null = null;
  if (screenshot_base64) {
    await ensureBucket(supabase);
    try {
      const base64Data = screenshot_base64.replace(/^data:image\/\w+;base64,/, "");
      const bytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
      const filename = `bugs/${Date.now()}.png`;

      const { error: uploadError } = await supabase.storage
        .from("bug-screenshots")
        .upload(filename, bytes, { contentType: "image/png" });

      if (!uploadError) {
        const { data } = supabase.storage
          .from("bug-screenshots")
          .getPublicUrl(filename);
        screenshotUrl = data.publicUrl;
      } else {
        console.warn("Screenshot upload failed:", uploadError.message);
      }
    } catch (e) {
      console.warn("Screenshot processing failed:", e);
    }
  }

  // Создать запись в Notion
  console.log("[bug-report] DB_ID:", NOTION_BUGS_DB_ID?.slice(0, 8), "TOKEN_SET:", !!NOTION_TOKEN);
  const res = await fetch("https://api.notion.com/v1/pages", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${NOTION_TOKEN}`,
      "Notion-Version": "2022-06-28",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      parent: { database_id: NOTION_BUGS_DB_ID },
      properties: {
        Title: {
          title: [{ text: { content: description.slice(0, 100) } }],
        },
        Description: {
          rich_text: [{ text: { content: description.slice(0, 2000) } }],
        },
        ...(screenshotUrl ? { "Screenshot URL": { url: screenshotUrl } } : {}),
        Status: { select: { name: "Новый" } },
        Environment: {
          rich_text: [{ text: { content: JSON.stringify(environment || {}).slice(0, 2000) } }],
        },
        "Reporter User ID": {
          rich_text: [{ text: { content: environment?.user_id || "" } }],
        },
      },
    }),
  });

  const data = await res.json();
  console.log("[bug-report] Notion status:", res.status, "id:", data?.id, "error:", data?.message);

  if (!res.ok) {
    console.error("Notion API error:", JSON.stringify(data));
    return json({ error: "Notion error", details: data }, 500);
  }

  return json({ id: data.id });
});

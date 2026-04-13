import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { detect, detectSequence } from "../_shared/anti-leak.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Deps {
  resolveSender: (req: Request) => Promise<{ id: string; role: string } | null>;
  loadMatch: (id: string) => Promise<{ id: string; shipper_id: string; owner_id: string } | null>;
  loadHistory: (matchId: string) => Promise<string[]>;
  insertMessage: (row: { match_id: string; sender_id: string; text: string; kind: string }) => Promise<any>;
  insertViolation: (row: { user_id: string; match_id: string; detector: string; severity: string; snippet: string }) => Promise<void>;
}

export async function handleRequest(req: Request, deps: Deps): Promise<Response> {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method" }, 405);

  let body: any;
  try { body = await req.json(); } catch { return json({ error: "bad json" }, 400); }
  const { match_id, text, kind } = body ?? {};
  if (!match_id || typeof text !== "string" || (kind !== "user" && kind !== "system")) {
    return json({ error: "bad payload" }, 400);
  }

  const sender = await deps.resolveSender(req);
  if (!sender) return json({ error: "unauth" }, 401);
  if (kind === "system" && sender.role !== "admin") return json({ error: "forbidden" }, 403);

  const match = await deps.loadMatch(match_id);
  if (!match) return json({ error: "no match" }, 404);
  if (sender.role !== "admin" && sender.id !== match.shipper_id && sender.id !== match.owner_id) {
    return json({ error: "not participant" }, 403);
  }

  if (kind === "user") {
    const single = detect(text);
    let hit = single;
    if (!hit) {
      const history = await deps.loadHistory(match_id);
      hit = detectSequence(text, history);
    }
    if (hit) {
      await deps.insertViolation({
        user_id: sender.id,
        match_id,
        detector: hit.detector,
        severity: hit.severity,
        snippet: hit.snippet,
      });
      return json({ blocked: true, detector: hit.detector }, 422);
    }
  }

  const message = await deps.insertMessage({ match_id, sender_id: sender.id, text, kind });
  return json({ ok: true, message }, 200);
}

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Production wiring
serve(async (req) => {
  const url = Deno.env.get("SUPABASE_URL")!;
  const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const auth = req.headers.get("Authorization") ?? "";
  const userClient = createClient(url, anon, { global: { headers: { Authorization: auth } } });
  const svc = createClient(url, service);

  return handleRequest(req, {
    resolveSender: async () => {
      const { data } = await userClient.auth.getUser();
      if (!data.user) return null;
      const { data: prof } = await svc.from("profiles").select("id, role").eq("id", data.user.id).single();
      return prof ?? null;
    },
    loadMatch: async (id) => {
      const { data } = await svc.from("matches").select("id, shipper_id, owner_id").eq("id", id).single();
      return data;
    },
    loadHistory: async (matchId) => {
      const { data } = await svc
        .from("messages")
        .select("text")
        .eq("match_id", matchId)
        .order("created_at", { ascending: false })
        .limit(8);
      return (data ?? []).reverse().map((r: any) => r.text);
    },
    insertMessage: async (row) => {
      const { data } = await svc.from("messages").insert(row).select().single();
      return data;
    },
    insertViolation: async (row) => {
      await svc.from("chat_violations").insert(row);
    },
  });
});

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { detect, detectSequence } from "../_shared/anti-leak.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Deps {
  resolveSender: (req: Request) => Promise<{ id: string; role: string } | null>;
  // Returns the ownerId and shipperInn for the bid (both stored as text UUIDs)
  loadBid: (chatId: string) => Promise<{ ownerId: string; shipperInn: string } | null>;
  loadHistory: (chatId: string) => Promise<string[]>;
  insertMessage: (row: { chat_id: string; sender_id: string; text: string }) => Promise<any>;
  insertViolation: (row: { user_id: string; match_id: string; detector: string; severity: string; snippet: string }) => Promise<void>;
}

export async function handleRequest(req: Request, deps: Deps): Promise<Response> {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method" }, 405);

  let body: any;
  try { body = await req.json(); } catch { return json({ error: "bad json" }, 400); }
  const { chat_id, text, kind } = body ?? {};
  if (!chat_id || typeof text !== "string" || (kind !== "user" && kind !== "system")) {
    return json({ error: "bad payload" }, 400);
  }

  const sender = await deps.resolveSender(req);
  if (!sender) return json({ error: "unauth" }, 401);
  if (kind === "system" && sender.role !== "admin") return json({ error: "forbidden" }, 403);

  const bid = await deps.loadBid(chat_id);
  if (!bid) return json({ error: "no chat" }, 404);

  // Both ownerId and shipperInn are stored as text UUIDs in the bids/requests tables
  const isParticipant = sender.id === bid.ownerId || sender.id === bid.shipperInn;
  if (sender.role !== "admin" && !isParticipant) {
    return json({ error: "not participant" }, 403);
  }

  if (kind === "user") {
    const single = detect(text);
    let hit = single;
    if (!hit) {
      const history = await deps.loadHistory(chat_id);
      hit = detectSequence(text, history);
    }
    if (hit) {
      await deps.insertViolation({
        user_id: sender.id,
        match_id: chat_id,
        detector: hit.detector,
        severity: hit.severity,
        snippet: hit.snippet,
      });
      return json({ blocked: true, detector: hit.detector }, 422);
    }
  }

  // System messages use sender_id = 'system' to match existing app convention
  const senderId = kind === "system" ? "system" : sender.id;
  const message = await deps.insertMessage({ chat_id, sender_id: senderId, text });
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
    loadBid: async (chatId) => {
      const { data: bid } = await svc
        .from("bids")
        .select(`"ownerId", "requestId"`)
        .eq("id", chatId)
        .single();
      if (!bid) return null;
      const { data: req } = await svc
        .from("requests")
        .select(`"shipperInn"`)
        .eq("id", (bid as any)["requestId"])
        .single();
      if (!req) return null;
      return {
        ownerId: (bid as any)["ownerId"],
        shipperInn: (req as any)["shipperInn"],
      };
    },
    loadHistory: async (chatId) => {
      const { data } = await svc
        .from("messages")
        .select("text")
        .eq("chat_id", chatId)
        .neq("sender_id", "system")
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

import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { handleRequest } from "./index.ts";

const fakeDeps = (overrides: Partial<any> = {}) => ({
  resolveSender: async () => ({ id: "user-1", role: "shipper" }),
  loadMatch: async () => ({ id: "match-1", shipper_id: "user-1", owner_id: "user-2" }),
  loadHistory: async () => [],
  insertMessage: async (row: any) => ({ ...row, id: "msg-1" }),
  insertViolation: async () => { throw new Error("should not be called"); },
  ...overrides,
});

Deno.test("happy path: clean user message → 200 + message returned", async () => {
  const res = await handleRequest(
    new Request("http://x", {
      method: "POST",
      headers: { Authorization: "Bearer fake" },
      body: JSON.stringify({ match_id: "match-1", text: "когда грузим?", kind: "user" }),
    }),
    fakeDeps(),
  );
  assertEquals(res.status, 200);
  const body = await res.json();
  assertEquals(body.ok, true);
  assertEquals(body.message.id, "msg-1");
});

Deno.test("blocked: detector hit → 422 + violation inserted", async () => {
  let violationRow: any = null;
  const res = await handleRequest(
    new Request("http://x", {
      method: "POST",
      headers: { Authorization: "Bearer fake" },
      body: JSON.stringify({ match_id: "match-1", text: "звони +79991234567", kind: "user" }),
    }),
    fakeDeps({
      insertViolation: async (row: any) => { violationRow = row; },
      insertMessage: async () => { throw new Error("should not insert"); },
    }),
  );
  assertEquals(res.status, 422);
  const body = await res.json();
  assertEquals(body.blocked, true);
  assertEquals(body.detector, "phone");
  assertEquals(violationRow.user_id, "user-1");
  assertEquals(violationRow.detector, "phone");
});

Deno.test("sequence: assembled phone over history → 422", async () => {
  let violationRow: any = null;
  const res = await handleRequest(
    new Request("http://x", {
      method: "POST",
      headers: { Authorization: "Bearer fake" },
      body: JSON.stringify({ match_id: "match-1", text: "67", kind: "user" }),
    }),
    fakeDeps({
      loadHistory: async () => ["мой телефон", "+7", "999", "123", "45"],
      insertViolation: async (row: any) => { violationRow = row; },
      insertMessage: async () => { throw new Error("should not insert"); },
    }),
  );
  assertEquals(res.status, 422);
  assertEquals(violationRow.detector, "phone_sequence");
});

Deno.test("unauth → 401", async () => {
  const res = await handleRequest(
    new Request("http://x", {
      method: "POST",
      body: JSON.stringify({ match_id: "match-1", text: "hi", kind: "user" }),
    }),
    fakeDeps({ resolveSender: async () => null }),
  );
  assertEquals(res.status, 401);
});

Deno.test("non-participant → 403", async () => {
  const res = await handleRequest(
    new Request("http://x", {
      method: "POST",
      headers: { Authorization: "Bearer fake" },
      body: JSON.stringify({ match_id: "match-1", text: "hi", kind: "user" }),
    }),
    fakeDeps({
      resolveSender: async () => ({ id: "stranger", role: "shipper" }),
    }),
  );
  assertEquals(res.status, 403);
});

Deno.test("kind=system from non-admin → 403", async () => {
  const res = await handleRequest(
    new Request("http://x", {
      method: "POST",
      headers: { Authorization: "Bearer fake" },
      body: JSON.stringify({ match_id: "match-1", text: "hi", kind: "system" }),
    }),
    fakeDeps(),
  );
  assertEquals(res.status, 403);
});

Deno.test("kind=system from admin → 200", async () => {
  const res = await handleRequest(
    new Request("http://x", {
      method: "POST",
      headers: { Authorization: "Bearer fake" },
      body: JSON.stringify({ match_id: "match-1", text: "system note", kind: "system" }),
    }),
    fakeDeps({
      resolveSender: async () => ({ id: "admin-1", role: "admin" }),
    }),
  );
  assertEquals(res.status, 200);
});

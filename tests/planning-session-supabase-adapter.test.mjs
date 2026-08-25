import test from "node:test";
import assert from "node:assert/strict";
import { createSupabasePlanningSessionAdapter } from "../api/_lib/planning-session-adapters/supabase.js";

test("adapter Supabase falha alto sem configuracao e nao embute segredo", async () => {
  const adapter = createSupabasePlanningSessionAdapter({ env: {}, fetchImpl: async () => { throw new Error("nao deveria chamar fetch"); } });
  await assert.rejects(() => adapter.getOwned({ sessionId: "s1", tokenHash: "h" }), /planning_persistence_not_configured/);
});

test("adapter Supabase envia service role apenas no request server-side e filtra posse", async () => {
  const env = { SUPABASE_URL: "https://db.example", SUPABASE_SERVICE_ROLE_KEY: "server-secret" };
  const adapter = createSupabasePlanningSessionAdapter({ env, fetchImpl: async (url, options) => {
    assert.match(url, /id=eq\.s1/);
    assert.match(url, /anonymous_session_token_hash=eq\.hash-correto/);
    assert.equal(options.headers.apikey, "server-secret");
    assert.equal(options.headers.Authorization, "Bearer server-secret");
    return new Response(JSON.stringify([]), { status: 200 });
  }});
  assert.equal(await adapter.getOwned({ sessionId: "s1", tokenHash: "hash-correto" }), null);
});

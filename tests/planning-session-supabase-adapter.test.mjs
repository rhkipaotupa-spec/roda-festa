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

test("adapter Supabase trata retry da mesma finalizacao como idempotente", async () => {
  const env = { SUPABASE_URL: "https://db.example", SUPABASE_SERVICE_ROLE_KEY: "server-secret" };
  let calls = 0;
  const adapter = createSupabasePlanningSessionAdapter({ env, fetchImpl: async (_url, options) => {
    calls += 1;
    if (options.method === "PATCH") return new Response(JSON.stringify([]), { status: 200 });
    return new Response(JSON.stringify([{ id:"s1", version:2, final_proposal_snapshot:{code:"RF-990825-00001"} }]), { status:200 });
  }});
  const result = await adapter.finalize({ sessionId:"s1", tokenHash:"owner", finalSnapshot:{code:"RF-990825-00001"}, changes:[], expectedVersion:1 });
  assert.equal(result.idempotent, true);
  assert.equal(result.finalized, false);
  assert.equal(calls, 2);
});

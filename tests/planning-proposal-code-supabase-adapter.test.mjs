import test from "node:test";
import assert from "node:assert/strict";
import { createSupabasePlanningSessionAdapter } from "../api/_lib/planning-session-adapters/supabase.js";

test("Supabase finalize allocates canonical proposal code through server-only RPC", async () => {
  const env = { SUPABASE_URL: "https://db.example", SUPABASE_SERVICE_ROLE_KEY: "server-secret" };
  const calls = [];
  const adapter = createSupabasePlanningSessionAdapter({ env, fetchImpl: async (url, options) => {
    calls.push({ url, options });
    if (url.endsWith("/rest/v1/rpc/allocate_planning_proposal_code")) {
      return new Response(JSON.stringify("RF-260827-00004"), { status: 200 });
    }
    if (options.method === "PATCH") {
      const payload = JSON.parse(options.body);
      assert.equal(payload.final_proposal_snapshot.code, "RF-260827-00004");
      assert.equal(Object.hasOwn(payload, "planning_changes"), false);
      return new Response(JSON.stringify([{
        id: "s1", version: 2, final_proposal_snapshot: payload.final_proposal_snapshot,
      }]), { status: 200 });
    }
    throw new Error(`unexpected request: ${url}`);
  }});

  const result = await adapter.finalize({
    sessionId: "s1", tokenHash: "owner", expectedVersion: 1, finalSnapshot: { clientName: "Teste" }, changes: [],
  });
  assert.equal(result.finalized, true);
  assert.equal(result.session.final_proposal_snapshot.code, "RF-260827-00004");
  assert.ok(calls.some((call) => call.url.endsWith("/rpc/allocate_planning_proposal_code")));
});

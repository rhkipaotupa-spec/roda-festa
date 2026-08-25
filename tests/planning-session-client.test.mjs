import test from "node:test";
import assert from "node:assert/strict";
import { areRecommendationSnapshotsEquivalent, finalizePlanningSession, isPlanningSessionPersistenceEnabled, recordPlanningChanges, startPlanningSession } from "../src/planner/planning-book/planningSessionClient.js";

test("integracao fica desligada por padrao", () => {
  assert.equal(isPlanningSessionPersistenceEnabled({}), false);
  assert.equal(isPlanningSessionPersistenceEnabled({ VITE_PLANNING_SESSION_PERSISTENCE_ENABLED: "true" }), true);
});

test("cliente reconhece indisponibilidade explicita sem fingir persistencia", async () => {
  const fetchImpl = async () => new Response(JSON.stringify({ error: "planning_persistence_unavailable" }), { status: 503, headers: { "Content-Type": "application/json" } });
  const result = await startPlanningSession({}, { fetchImpl, clientRequestId: "client-request-1234567890" });
  assert.deepEqual(result, { available: false, reason: "planning_persistence_unavailable" });
});

test("cliente envia apenas sessionId/version/snapshot na finalizacao e usa cookie same-origin", async () => {
  const fetchImpl = async (url, options) => {
    assert.equal(url, "/api/planning-sessions");
    assert.equal(options.credentials, "same-origin");
    const payload = JSON.parse(options.body);
    assert.equal(payload.action, "finalize");
    assert.equal(payload.sessionId, "s1");
    assert.equal(payload.expectedVersion, 1);
    assert.equal(Object.prototype.hasOwnProperty.call(payload, "token"), false);
    return new Response(JSON.stringify({ ok:true, sessionId:"s1", version:2 }), { status:200, headers:{"Content-Type":"application/json"} });
  };
  const result = await finalizePlanningSession({ sessionId:"s1", expectedVersion:1, finalSnapshot:{code:"RF-1"} }, { fetchImpl });
  assert.equal(result.available, true);
  assert.equal(result.version, 2);
});


test("frontend detecta divergencia entre recomendacao exibida e recomendacao autoritativa", () => {
  const base = { versions:{recommendation:"1"}, items:[{id:"a",quantity:10,unitPrice:2,consignment:false}], totalCarts:1, investmentTotal:320 };
  assert.equal(areRecommendationSnapshotsEquivalent(base, structuredClone(base)), true);
  const changed = structuredClone(base); changed.items[0].quantity = 20;
  assert.equal(areRecommendationSnapshotsEquivalent(base, changed), false);
});


test("cliente envia timeline em batch com versao otimista e cookie same-origin", async () => {
  let request;
  const fetchImpl = async (url, init) => { request = { url, init, body: JSON.parse(init.body) }; return { ok:true, status:200, json:async()=>({ok:true,sessionId:"s1",version:3,appended:1}) }; };
  const result = await recordPlanningChanges({ sessionId:"s1", expectedVersion:2, changes:[{type:"SERVICE_ADDED",service:"WAITERS"}] }, { fetchImpl });
  assert.equal(result.version, 3);
  assert.equal(request.body.action, "changes");
  assert.equal(request.body.expectedVersion, 2);
  assert.equal(request.init.credentials, "same-origin");
});

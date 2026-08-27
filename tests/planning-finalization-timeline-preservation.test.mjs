import test from "node:test";
import assert from "node:assert/strict";

import { createPlanningSessionRepository } from "../api/_lib/planning-session-repository.js";
import { createMemoryPlanningSessionAdapter } from "../api/_lib/planning-session-adapters/memory.js";
import { createSupabasePlanningSessionAdapter } from "../api/_lib/planning-session-adapters/supabase.js";

const serviceTimeline = Object.freeze([
  Object.freeze({
    id: "change-1",
    sequence: 1,
    type: "SERVICE_ADDED",
    service: "WAITERS",
    actor: "CLIENT",
    recordedAt: "2026-08-27T15:00:00.000Z",
  }),
  Object.freeze({
    id: "change-2",
    sequence: 2,
    type: "SERVICE_REMOVED",
    service: "WAITERS",
    actor: "CLIENT",
    recordedAt: "2026-08-27T15:01:00.000Z",
  }),
  Object.freeze({
    id: "change-3",
    sequence: 3,
    type: "SERVICE_ADDED",
    service: "DISPOSABLES",
    actor: "CLIENT",
    recordedAt: "2026-08-27T15:02:00.000Z",
  }),
]);

test("memory finalization preserves the append-only planning timeline", async () => {
  const adapter = createMemoryPlanningSessionAdapter();
  const repository = createPlanningSessionRepository(adapter);

  await repository.create({
    id: "session-1",
    clientRequestId: "request-1",
    tokenHash: "owner-hash",
    inputSnapshot: { adults: 20 },
    recommendationSnapshot: { items: [], versions: {} },
  });

  const appended = await repository.appendChanges({
    sessionId: "session-1",
    tokenHash: "owner-hash",
    expectedVersion: 1,
    changes: serviceTimeline,
  });
  assert.equal(appended.session.version, 2);

  const finalized = await repository.finalize({
    sessionId: "session-1",
    tokenHash: "owner-hash",
    expectedVersion: 2,
    finalSnapshot: { code: "RF-TEST-1", items: [] },
    changes: [
      { type: "ITEM_QUANTITY_CHANGED", productId: "product-1", before: 10, after: 20 },
    ],
  });

  assert.equal(finalized.session.status, "FINALIZED");
  assert.equal(finalized.session.version, 3);
  assert.deepEqual(finalized.session.planning_changes, serviceTimeline);

  const journey = await repository.getJourney({
    sessionId: "session-1",
    tokenHash: "owner-hash",
  });
  assert.deepEqual(
    journey.planningChanges.map((change) => `${change.type}:${change.service}`),
    [
      "SERVICE_ADDED:WAITERS",
      "SERVICE_REMOVED:WAITERS",
      "SERVICE_ADDED:DISPOSABLES",
    ],
  );
});

test("supabase finalization does not overwrite planning_changes", async () => {
  const env = {
    SUPABASE_URL: "https://db.example",
    SUPABASE_SERVICE_ROLE_KEY: "server-secret",
  };
  let patchBody = null;

  const adapter = createSupabasePlanningSessionAdapter({
    env,
    fetchImpl: async (_url, options) => {
      assert.equal(options.method, "PATCH");
      patchBody = JSON.parse(options.body);
      return new Response(JSON.stringify([{
        id: "session-1",
        status: "FINALIZED",
        version: 3,
        planning_changes: serviceTimeline,
        final_proposal_snapshot: { code: "RF-TEST-1" },
      }]), { status: 200 });
    },
  });

  const result = await adapter.finalize({
    sessionId: "session-1",
    tokenHash: "owner-hash",
    expectedVersion: 2,
    finalSnapshot: { code: "RF-TEST-1" },
    changes: [
      { type: "ITEM_QUANTITY_CHANGED", productId: "product-1", before: 10, after: 20 },
    ],
  });

  assert.equal(result.finalized, true);
  assert.equal(Object.hasOwn(patchBody, "planning_changes"), false);
  assert.deepEqual(result.session.planning_changes, serviceTimeline);
});

import test from "node:test";
import assert from "node:assert/strict";

import {
  buildJourneyReadModel,
  assertJourneyReadModelIntegrity,
} from "../api/_lib/planning-journey-read-model.js";

test("read model reconstrui entrada, recomendacao, timeline e final sem recalcular historico", () => {
  const session = {
    id: "s-1",
    version: 4,
    createdAt: "2026-08-25T10:00:00.000Z",
    updatedAt: "2026-08-25T10:10:00.000Z",
    inputSnapshot: { adults: 20 },
    recommendationSnapshot: {
      versions: {
        recommendation: "RF-REC-1.0.0",
        commercialRules: "RF-COM-1.0.0",
        pricing: "RF-PRICE-2026-08-24",
      },
      investmentTotal: 1000,
    },
    planningChanges: [
      { id: "c2", sequence: 2, type: "ITEM_ADDED", recordedAt: "2026-08-25T10:02:00.000Z" },
      { id: "c1", sequence: 1, type: "ITEM_QUANTITY_CHANGED", recordedAt: "2026-08-25T10:01:00.000Z" },
    ],
    finalProposalSnapshot: {
      investmentTotal: 1200,
      ledger: { reconciliation: { difference: 0 } },
    },
  };

  const model = buildJourneyReadModel(session);
  assert.equal(model.status, "FINALIZED");
  assert.equal(model.recommendationSnapshot.investmentTotal, 1000);
  assert.equal(model.finalProposalSnapshot.investmentTotal, 1200);
  assert.deepEqual(model.planningChanges.map((c) => c.sequence), [1, 2]);
  assert.equal(model.reconciliation.difference, 0);
  assert.equal(model.versions.recommendation, "RF-REC-1.0.0");
  assert.equal(assertJourneyReadModelIntegrity(model), true);
});

test("read model entende formato persistido dos adapters sem perder recomendacao", () => {
  const model = buildJourneyReadModel({
    id: "persisted-1",
    version: 1,
    created_at: "2026-08-25T10:00:00.000Z",
    last_activity_at: "2026-08-25T10:01:00.000Z",
    input_snapshot: { adults: 20 },
    recommendation_snapshot: {
      totalCarts: 3,
      investmentTotal: 900,
      versions: { recommendation: "RF-REC-1.0.0" },
    },
    planning_changes: [],
    final_proposal_snapshot: null,
  });

  assert.equal(model.status, "RECOMMENDED");
  assert.equal(model.recommendationSnapshot.totalCarts, 3);
  assert.equal(model.inputSnapshot.adults, 20);
  assert.equal(model.createdAt, "2026-08-25T10:00:00.000Z");
  assert.equal(model.updatedAt, "2026-08-25T10:01:00.000Z");
});

test("read model nao aceita proposta final sem recomendacao historica", () => {
  const model = buildJourneyReadModel({
    id: "s-2",
    finalProposalSnapshot: { investmentTotal: 100 },
  });
  assert.throws(
    () => assertJourneyReadModelIntegrity(model),
    /final_without_recommendation/,
  );
});

test("read model nao muta snapshots de origem", () => {
  const source = {
    id: "s-3",
    recommendationSnapshot: { items: [{ id: "x", quantity: 5 }] },
    planningChanges: [],
  };
  const model = buildJourneyReadModel(source);
  model.recommendationSnapshot.items[0].quantity = 99;
  assert.equal(source.recommendationSnapshot.items[0].quantity, 5);
});

import test from "node:test";
import assert from "node:assert/strict";

import {
  buildAdminJourneySummary,
  buildAdminJourneyDetail,
} from "../api/_lib/planning-admin-journey-query.js";

function journey() {
  return {
    sessionId: "s-admin-1",
    status: "FINALIZED",
    version: 5,
    createdAt: "2026-08-25T10:00:00.000Z",
    updatedAt: "2026-08-25T10:30:00.000Z",
    inputSnapshot: { eventDate: "2026-09-20", guests: 80 },
    recommendationSnapshot: {
      investmentTotal: 1800,
      items: [{ id: "coxinha" }, { id: "pastel" }],
    },
    planningChanges: [
      { sequence: 1, type: "ITEM_QUANTITY_CHANGED" },
      { sequence: 2, type: "ITEM_ADDED" },
    ],
    finalProposalSnapshot: {
      investmentTotal: 2050,
      items: [{ id: "coxinha" }, { id: "pastel" }, { id: "burger" }],
    },
    reconciliation: { difference: 0 },
    versions: { recommendation: "RF-REC-1.0.0" },
  };
}

test("admin summary expoe resumo comercial e historico sem recalcular snapshots", () => {
  const model = buildAdminJourneySummary(journey());
  assert.equal(model.sessionId, "s-admin-1");
  assert.equal(model.event.guests, 80);
  assert.equal(model.commercial.recommendedTotal, 1800);
  assert.equal(model.commercial.finalTotal, 2050);
  assert.equal(model.commercial.effectiveTotal, 2050);
  assert.equal(model.commercial.itemCount, 3);
  assert.equal(model.commercial.reconciliation.difference, 0);
  assert.equal(model.history.changeCount, 2);
  assert.equal(model.history.hasFinalProposal, true);
});

test("admin summary usa recomendacao enquanto proposta final nao existe", () => {
  const source = journey();
  source.status = "RECOMMENDED";
  source.finalProposalSnapshot = null;
  const model = buildAdminJourneySummary(source);
  assert.equal(model.commercial.finalTotal, null);
  assert.equal(model.commercial.effectiveTotal, 1800);
  assert.equal(model.history.hasFinalProposal, false);
});

test("admin detail preserva snapshots explicaveis sem mutar a jornada", () => {
  const source = journey();
  const detail = buildAdminJourneyDetail(source);
  detail.recommendationSnapshot.items[0].id = "alterado";
  assert.equal(source.recommendationSnapshot.items[0].id, "coxinha");
  assert.equal(detail.inputSnapshot.eventDate, "2026-09-20");
});

test("admin query rejeita jornada sem sessionId", () => {
  assert.throws(
    () => buildAdminJourneySummary({ status: "STARTED" }),
    /admin_journey_missing_session_id/,
  );
});

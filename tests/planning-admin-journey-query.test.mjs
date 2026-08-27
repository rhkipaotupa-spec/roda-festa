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
    inputSnapshot: {
      eventDate: "2026-09-20",
      eventType: "infantil",
      adults: 64,
      olderChildren: 7,
      children: 9,
      realGuests: 80,
      duration: 4,
    },
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
  assert.equal(model.event.adults, 64);
  assert.equal(model.event.olderChildren, 7);
  assert.equal(model.event.children, 9);
  assert.equal(model.event.duration, 4);
  assert.equal(model.commercial.recommendedTotal, 1800);
  assert.equal(model.commercial.finalTotal, 2050);
  assert.equal(model.commercial.effectiveTotal, 2050);
  assert.equal(model.commercial.itemCount, 3);
  assert.equal(model.commercial.reconciliation.difference, 0);
  assert.equal(model.history.changeCount, 2);
  assert.equal(model.history.hasFinalProposal, true);
});

test("admin summary calcula convidados pelas faixas quando realGuests nao existir", () => {
  const source = journey();
  delete source.inputSnapshot.realGuests;
  const model = buildAdminJourneySummary(source);
  assert.equal(model.event.guests, 80);
});

test("admin summary preserva compatibilidade com snapshot legado de guests", () => {
  const source = journey();
  source.inputSnapshot = { eventDate: "2026-09-20", guests: 80 };
  const model = buildAdminJourneySummary(source);
  assert.equal(model.event.guests, 80);
  assert.equal(model.event.adults, 0);
  assert.equal(model.event.olderChildren, 0);
  assert.equal(model.event.children, 0);
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

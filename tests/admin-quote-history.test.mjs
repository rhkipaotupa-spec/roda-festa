import test from "node:test";
import assert from "node:assert/strict";
import { groupQuotesByEventMonth } from "../src/admin/adminQuoteHistory.js";

test("agrupa historico de orcamentos pelo mes do evento", () => {
  const groups = groupQuotesByEventMonth([
    { sessionId: "a", event: { date: "2026-09-14" }, history: { hasFinalProposal: false } },
    { sessionId: "b", event: { date: "2026-09-26" }, history: { hasFinalProposal: true } },
    { sessionId: "c", event: { date: "2026-12-12" }, history: { hasFinalProposal: true } },
  ]);

  assert.equal(groups.length, 2);
  assert.deepEqual(groups[0], {
    key: "2026-09",
    sortKey: "2026-09",
    label: "Setembro 2026",
    quotes: [
      { sessionId: "a", event: { date: "2026-09-14" }, history: { hasFinalProposal: false } },
      { sessionId: "b", event: { date: "2026-09-26" }, history: { hasFinalProposal: true } },
    ],
    validated: 1,
    pending: 1,
    total: 2,
  });
  assert.equal(groups[1].label, "Dezembro 2026");
  assert.equal(groups[1].validated, 1);
  assert.equal(groups[1].pending, 0);
});

test("orcamentos sem data ficam em grupo separado por ultimo", () => {
  const groups = groupQuotesByEventMonth([
    { sessionId: "x", event: { date: "" }, history: { hasFinalProposal: false } },
    { sessionId: "y", event: { date: "2026-01-03" }, history: { hasFinalProposal: true } },
  ]);

  assert.equal(groups[0].key, "2026-01");
  assert.equal(groups[1].key, "sem-data");
  assert.equal(groups[1].label, "Sem data definida");
});

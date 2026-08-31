import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  R4_PRODUCTION_VERSIONS,
  generateR4ProductionSuggestion,
} from "../src/planner/planning-book/engine/r4ProductionRecommendation.js";

const FULL_MENU_70 = [
  "coxinha-frango-catupiry",
  "bolinha-queijo",
  "pastel-queijo",
  "mini-x-burguer",
  "torta-frango-catupiry",
  "brigadeiro-chocolate",
  "bolo-beatriz",
  "agua-mineral",
  "suco-laranja-200ml",
  "refrigerante-200ml",
];

test("RF-REC-2 Production preserves the validated 70-person commercial reference after 2.1 evolution", () => {
  const result = generateR4ProductionSuggestion({
    adults: 55,
    olderChildren: 15,
    children: 0,
    serviceHours: 4,
    selectedProductIds: FULL_MENU_70,
    includeWaiters: true,
    includeDisposables: true,
    includeBeverages: true,
  });

  assert.equal(result.versions.recommendation, "RF-REC-2.1.0");
  assert.equal(result.policy.authoritative, true);
  assert.equal(result.guests.realGuests, 70);
  assert.equal(result.guests.equivalentGuests, 70);
  assert.equal(result.carts.totalCarts, 3);
  assert.equal(result.waiters.quantity, 4);
  assert.equal(result.disposables.value, 630);
  assert.equal(result.investment.total, 5889.5);
  assert.equal(result.investment.ledger.totals.consignmentEstimate, 1180);

  const quantities = Object.fromEntries(result.items.map((item) => [item.id, item.quantity]));
  assert.deepEqual(quantities, {
    "coxinha-frango-catupiry": 150,
    "bolinha-queijo": 175,
    "pastel-queijo": 130,
    "mini-x-burguer": 140,
    "torta-frango-catupiry": 33,
    "brigadeiro-chocolate": 350,
    "bolo-beatriz": 70,
    "agua-mineral": 90,
    "suco-laranja-200ml": 130,
    "refrigerante-200ml": 70,
  });
});

test("RF-REC-2 Production uses 35 percent for ages 0-6", () => {
  const result = generateR4ProductionSuggestion({
    adults: 27,
    olderChildren: 0,
    children: 15,
    serviceHours: 4,
    selectedProductIds: ["coxinha-frango-catupiry"],
  });
  assert.equal(result.guests.realGuests, 42);
  assert.equal(result.guests.equivalentGuests, 32.25);
});

test("authoritative browser and PlanningSession are wired through the same RF-REC-2 adapter", () => {
  const planningBook = fs.readFileSync(new URL("../src/planner/planning-book/PlanningBook.jsx", import.meta.url), "utf8");
  const planningSessions = fs.readFileSync(new URL("../api/planning-sessions.js", import.meta.url), "utf8");

  assert.match(planningBook, /generateR4ProductionSuggestion/);
  assert.doesNotMatch(planningBook, /generatePlanningSuggestion\s*\(/);
  assert.match(planningBook, /const equivalentGuests = adults \+ olderChildren \+ children \* 0\.35;/);
  assert.match(planningBook, /Equivalem a 0,35 adulto/);

  assert.match(planningSessions, /generateR4ProductionSuggestion/);
  assert.doesNotMatch(planningSessions, /generatePlanningSuggestion\s*\(/);
  assert.match(planningSessions, /const equivalentGuests = suggestion\.guests\.equivalentGuests/);
});

test("final commercial validation stamps current RF-REC-2 and the 35 percent child factor", () => {
  const submissions = fs.readFileSync(new URL("../api/planning-submissions.js", import.meta.url), "utf8");
  assert.match(submissions, /R4_PRODUCTION_VERSIONS/);
  assert.match(submissions, /children \* 0\.35/);
  assert.doesNotMatch(submissions, /children \* 0\.5/);
  assert.equal(R4_PRODUCTION_VERSIONS.recommendation, "RF-REC-2.1.0");
});

import test from "node:test";
import assert from "node:assert/strict";

import { PRODUCTS } from "../src/planner/planning-book/engine/planningRules.js";
import { rebuildAdminEffectiveSnapshot } from "../api/_lib/admin-quote-revision-domain.js";

const coxinha = PRODUCTS.coxinhaFrangoCatupiry;

function baseSnapshot() {
  return {
    code: "RF-260909-00001",
    adults: 20,
    olderChildren: 5,
    children: 10,
    duration: 4,
    items: [{ ...coxinha, quantity: 50, unitPrice: 1.5, estimatedValue: 75 }],
    includeDisposables: true,
    waiters: 0,
  };
}

test("admin revision accepts guest edits and applies 0.50 to ages 0-6", () => {
  const revised = rebuildAdminEffectiveSnapshot({
    baseSnapshot: baseSnapshot(),
    requestedItems: [{ id: coxinha.id, quantity: 50 }],
    requestedGuests: { adults: 30, olderChildren: 4, children: 12 },
    includeWaiters: true,
    includeDisposables: true,
    productCatalog: Object.values(PRODUCTS),
    now: new Date("2026-09-09T12:00:00Z"),
  });
  assert.equal(revised.adults, 30);
  assert.equal(revised.olderChildren, 4);
  assert.equal(revised.children, 12);
  assert.equal(revised.realGuests, 46);
  assert.equal(revised.equivalentGuests, 40);
  assert.equal(revised.youngChildFactor, 0.5);
  assert.equal(revised.items[0].quantity, 50, "guest edit must not silently rewrite negotiated product quantity");
});

test("admin revision rejects fractional or negative guest counts", () => {
  for (const requestedGuests of [
    { adults: -1, olderChildren: 0, children: 0 },
    { adults: 10.5, olderChildren: 0, children: 0 },
  ]) {
    assert.throws(() => rebuildAdminEffectiveSnapshot({
      baseSnapshot: baseSnapshot(),
      requestedItems: [{ id: coxinha.id, quantity: 50 }],
      requestedGuests,
      includeWaiters: false,
      includeDisposables: false,
      productCatalog: Object.values(PRODUCTS),
    }), /admin_quote_revision_invalid_/);
  }
});

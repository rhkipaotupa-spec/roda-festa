import test from "node:test";
import assert from "node:assert/strict";

import {
  PRODUCTS,
  PLANNING_PARAMETERS,
  calculateCarts,
  calculateDisposables,
  calculateInvestment,
  calculateWaiters,
  generatePlanningSuggestion,
} from "../src/planner/planning-book/engine/planningRules.js";
import { reconcileCommercialLedger } from "../src/planner/planning-book/engine/commercialLedger.js";

function item(product, quantity) {
  return {
    ...product,
    quantity,
    estimatedValue: product.consignment ? 0 : quantity * product.unitPrice,
  };
}

test("RF-001: tres grupos operacionais geram e cobram tres carrinhos", () => {
  const items = [
    item(PRODUCTS.coxinhaFrangoCatupiry, 100),
    item(PRODUCTS.miniHotDog, 40),
    item(PRODUCTS.sucoLaranja200ml, 40),
  ];
  const carts = calculateCarts({ items, serviceHours: 4 });
  const investment = calculateInvestment({
    items,
    totalCarts: carts.totalCarts,
    serviceHours: 4,
    waiters: { quantity: 0, value: 0 },
    disposables: { included: false, value: 0 },
  });

  assert.equal(carts.totalCarts, 3);
  assert.equal(investment.chargedTotalCarts, 3);
  assert.equal(investment.cartsValue, 900);
  assert.equal(investment.ledger.structure.chargedTotalCarts, 3);
  assert.equal(investment.reconciliation.ok, true);
});

test("consignacao nao entra no contratado, mas o carrinho de bebidas entra", () => {
  const items = [item(PRODUCTS.sucoLaranja200ml, 40)];
  const carts = calculateCarts({ items, serviceHours: 4 });
  const investment = calculateInvestment({
    items,
    totalCarts: carts.totalCarts,
    serviceHours: 4,
    waiters: { quantity: 0, value: 0 },
    disposables: { included: false, value: 0 },
  });

  assert.equal(carts.totalCarts, 1);
  assert.equal(investment.productsValue, 0);
  assert.equal(investment.cartsValue, 300);
  assert.equal(investment.total, 300);
  assert.equal(investment.ledger.totals.consignmentEstimate, 240);
});

test("hora adicional multiplica quantidade de carrinhos", () => {
  const suggestion = generatePlanningSuggestion({
    adults: 20,
    children: 0,
    serviceHours: 5,
    selectedProductIds: ["coxinha-frango-catupiry", "mini-hot-dog", "suco-laranja-200ml"],
    includeBeverages: true,
  });

  assert.equal(suggestion.carts.totalCarts, 3);
  assert.equal(suggestion.investment.cartsValue, 900);
  assert.equal(suggestion.investment.additionalHoursValue, 450);
  assert.equal(suggestion.investment.reconciliation.ok, true);
});

test("ledger discrimina produtos, carrinhos, garcons e descartaveis e fecha no total", () => {
  const items = [
    item(PRODUCTS.coxinhaFrangoCatupiry, 100),
    item(PRODUCTS.pastelCarne, 50),
  ];
  const carts = calculateCarts({ items, serviceHours: 4 });
  const waiters = calculateWaiters({ realGuests: 41, includeWaiters: true });
  const disposables = calculateDisposables({ equivalentGuests: 41, includeDisposables: true });
  const investment = calculateInvestment({ items, totalCarts: carts.totalCarts, serviceHours: 4, waiters, disposables });
  const reconciliation = reconcileCommercialLedger(investment.ledger, investment.total);

  assert.equal(reconciliation.ok, true);
  assert.equal(reconciliation.expectedDifference, 0);
  assert.equal(investment.ledger.contractedLines.some((line) => line.id === "product:coxinha-frango-catupiry"), true);
  assert.equal(investment.ledger.contractedLines.some((line) => line.id === "service:carts"), true);
  assert.equal(investment.ledger.contractedLines.some((line) => line.id === "service:waiters"), true);
  assert.equal(investment.ledger.contractedLines.some((line) => line.id === "service:disposables"), true);
});

test("preco base de carrinho permanece centralizado no parametro comercial", () => {
  assert.equal(PLANNING_PARAMETERS.service.cartBasePrice, 300);
});

import test from "node:test";
import assert from "node:assert/strict";
import { rebuildAuthoritativeSnapshot, normalizeEventDate } from "../api/planning-submissions.js";

function baseSnapshot() {
  return {
    code: "RF-TEST-00001",
    clientName: "Cliente Teste",
    eventDate: "2099-12-31",
    adults: 20,
    olderChildren: 0,
    children: 0,
    duration: 4,
    totalCarts: 2,
    waiters: 0,
    includeDisposables: false,
    investmentTotal: 877.5,
    items: [
      { id: "coxinha-frango-catupiry", quantity: 25, unitPrice: 0.01 },
      { id: "mini-hot-dog", quantity: 40, unitPrice: 0.01 },
    ],
  };
}

test("servidor ignora preco unitario enviado pelo navegador e usa catalogo confiavel", () => {
  const rebuilt = rebuildAuthoritativeSnapshot(baseSnapshot());
  const coxinha = rebuilt.items.find((item) => item.id === "coxinha-frango-catupiry");
  assert.equal(coxinha.unitPrice, 1.5);
  assert.equal(rebuilt.investmentTotal, 877.5);
  assert.equal(rebuilt.commercialReconciliation.ok, true);
});

test("servidor rejeita total adulterado mesmo que payload esteja estruturalmente valido", () => {
  const snapshot = baseSnapshot();
  snapshot.investmentTotal = 600;
  assert.throws(() => rebuildAuthoritativeSnapshot(snapshot), /commercial_total_mismatch/);
});

test("servidor rejeita quantidade fora do lote comercial", () => {
  const snapshot = baseSnapshot();
  snapshot.items[0].quantity = 26;
  assert.throws(() => rebuildAuthoritativeSnapshot(snapshot), /invalid_lot/);
});

test("servidor preserva regra de tres carrinhos incluindo bebidas em consignacao", () => {
  const snapshot = {
    code: "RF-TEST-00002",
    clientName: "Cliente Tres Carrinhos",
    eventDate: "2099-12-31",
    adults: 20, olderChildren: 0, children: 0, duration: 4,
    totalCarts: 3, waiters: 0, includeDisposables: false,
    investmentTotal: 1177.5,
    items: [
      { id: "coxinha-frango-catupiry", quantity: 25 },
      { id: "mini-hot-dog", quantity: 40 },
      { id: "suco-laranja-200ml", quantity: 20 },
    ],
  };
  const rebuilt = rebuildAuthoritativeSnapshot(snapshot);
  assert.equal(rebuilt.totalCarts, 3);
  assert.equal(rebuilt.investment.cartsValue, 900);
  assert.equal(rebuilt.investment.productsValue, 277.5);
  assert.equal(rebuilt.investmentTotal, 1177.5);
  assert.equal(rebuilt.consignmentTotal, 120);
});

test("validacao de data usa calendario de Sao Paulo", () => {
  const reference = new Date("2026-08-25T02:30:00.000Z"); // 24/08 23:30 em Sao Paulo
  assert.equal(normalizeEventDate("2026-08-23", reference), null);
  assert.equal(normalizeEventDate("2026-08-24", reference), "2026-08-24");
  assert.equal(normalizeEventDate("2026-08-25", reference), "2026-08-25");
});

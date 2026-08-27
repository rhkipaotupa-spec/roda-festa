import test from "node:test";
import assert from "node:assert/strict";

import {
  buildItemComparison,
  changeLabel,
  summarizeItemComparison,
} from "../src/admin/adminJourneyPresentation.js";

const recommendation = {
  items: [
    { id: "burger", name: "Mini X-Burguer", commercialCategory: "Mini lanches", quantity: 25, unitPrice: 6 },
    { id: "coxinha", name: "Coxinha", commercialCategory: "Petiscos", quantity: 100, unitPrice: 1.2 },
    { id: "bolo", name: "Bolo", commercialCategory: "Bolos", quantity: 5, unitPrice: 40 },
    { id: "suco", name: "Suco", commercialCategory: "Bebidas", quantity: 20, unitPrice: 8, consignment: true },
  ],
};

const finalProposal = {
  items: [
    { id: "burger", name: "Mini X-Burguer", commercialCategory: "Mini lanches", quantity: 40, unitPrice: 6 },
    { id: "coxinha", name: "Coxinha", commercialCategory: "Petiscos", quantity: 80, unitPrice: 1.2 },
    { id: "suco", name: "Suco", commercialCategory: "Bebidas", quantity: 20, unitPrice: 8, consignment: true },
    { id: "brigadeiro", name: "Brigadeiro", commercialCategory: "Doces", quantity: 50, unitPrice: 1.5 },
  ],
};

test("comparacao explica aumento reducao retirada adicao e manutencao", () => {
  const rows = buildItemComparison(recommendation, finalProposal);
  const byId = new Map(rows.map((row) => [row.id, row]));

  assert.equal(byId.get("burger").change, "increased");
  assert.equal(byId.get("burger").before, 25);
  assert.equal(byId.get("burger").after, 40);
  assert.equal(byId.get("coxinha").change, "reduced");
  assert.equal(byId.get("bolo").change, "removed");
  assert.equal(byId.get("brigadeiro").change, "added");
  assert.equal(byId.get("suco").change, "unchanged");
});

test("resumo da comparacao conta apenas mudancas efetivas", () => {
  const summary = summarizeItemComparison(buildItemComparison(recommendation, finalProposal));
  assert.equal(summary.changed, 4);
  assert.equal(summary.increased, 1);
  assert.equal(summary.reduced, 1);
  assert.equal(summary.added, 1);
  assert.equal(summary.removed, 1);
  assert.equal(summary.unchanged, 1);
});

test("sem proposta final a recomendacao aparece como estado atual sem falsas mudancas", () => {
  const rows = buildItemComparison(recommendation, null);
  assert.equal(rows.length, 4);
  assert.equal(rows.every((row) => row.change === "unchanged"), true);
});

test("rotulos de mudanca sao humanos", () => {
  assert.equal(changeLabel("increased"), "Aumentado");
  assert.equal(changeLabel("reduced"), "Reduzido");
  assert.equal(changeLabel("added"), "Adicionado");
  assert.equal(changeLabel("removed"), "Retirado");
  assert.equal(changeLabel("unchanged"), "Mantido");
});

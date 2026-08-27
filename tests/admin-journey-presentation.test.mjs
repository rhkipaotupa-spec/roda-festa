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

test("servico de descartaveis adicionado aparece na comparacao motor x final", () => {
  const initial = {
    items: [],
    ledger: {
      contractedLines: [],
    },
  };
  const final = {
    items: [],
    commercialLedger: {
      contractedLines: [
        {
          id: "service:disposables",
          type: "disposables",
          label: "Descartáveis",
          quantity: 1,
          subtotal: 560,
        },
      ],
    },
  };

  const rows = buildItemComparison(initial, final);
  assert.deepEqual(rows.map((row) => ({
    id: row.id,
    kind: row.kind,
    before: row.before,
    after: row.after,
    change: row.change,
  })), [
    {
      id: "service:disposables",
      kind: "service",
      before: 0,
      after: 1,
      change: "added",
    },
  ]);
});

test("garcons retirados aparecem na comparacao motor x final", () => {
  const initial = {
    items: [],
    ledger: {
      contractedLines: [
        {
          id: "service:waiters",
          type: "waiters",
          label: "Garçons",
          quantity: 3,
          subtotal: 600,
        },
      ],
    },
  };
  const final = {
    items: [],
    commercialLedger: {
      contractedLines: [],
    },
    waiters: 0,
  };

  const rows = buildItemComparison(initial, final);
  const waiter = rows.find((row) => row.id === "service:waiters");
  assert.equal(waiter?.kind, "service");
  assert.equal(waiter?.before, 3);
  assert.equal(waiter?.after, 0);
  assert.equal(waiter?.change, "removed");
});

test("servico que terminou igual ao motor nao vira falsa mudanca liquida", () => {
  const initial = {
    items: [],
    ledger: {
      contractedLines: [
        {
          id: "service:waiters",
          type: "waiters",
          label: "Garçons",
          quantity: 2,
          subtotal: 400,
        },
      ],
    },
  };
  const final = {
    items: [],
    commercialLedger: {
      contractedLines: [
        {
          id: "service:waiters",
          type: "waiters",
          label: "Garçons",
          quantity: 2,
          subtotal: 400,
        },
      ],
    },
  };

  const rows = buildItemComparison(initial, final);
  const waiter = rows.find((row) => row.id === "service:waiters");
  assert.equal(waiter?.change, "unchanged");
  assert.equal(summarizeItemComparison(rows).changed, 0);
});

test("servicos ausentes nos dois lados nao poluem a comparacao", () => {
  const rows = buildItemComparison(
    { items: [], ledger: { contractedLines: [] } },
    { items: [], commercialLedger: { contractedLines: [] } },
  );
  assert.deepEqual(rows, []);
});

test("fallback explicito reconhece servicos em snapshots sem ledger", () => {
  const rows = buildItemComparison(
    { items: [], waiters: 0, includeDisposables: false },
    { items: [], waiters: 4, includeDisposables: true },
  );
  const byId = new Map(rows.map((row) => [row.id, row]));

  assert.equal(byId.get("service:waiters")?.change, "added");
  assert.equal(byId.get("service:waiters")?.after, 4);
  assert.equal(byId.get("service:disposables")?.change, "added");
  assert.equal(byId.get("service:disposables")?.after, 1);
});

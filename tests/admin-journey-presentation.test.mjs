import test from "node:test";
import assert from "node:assert/strict";

import {
  buildItemComparison,
  buildSelectedServices,
  buildServiceHistory,
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
  assert.equal(rows.every((row) => row.kind === "product"), true);
});

test("resumo da comparacao conta apenas mudancas efetivas de produtos", () => {
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

test("servicos opcionais nao entram em motor x versao final", () => {
  const initial = {
    items: [],
    ledger: { contractedLines: [] },
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

  assert.deepEqual(buildItemComparison(initial, final), []);
});

test("servicos escolhidos mostram estado final de garcons e descartaveis", () => {
  const services = buildSelectedServices({
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
  });
  const byService = new Map(services.map((service) => [service.service, service]));

  assert.equal(byService.get("WAITERS")?.known, true);
  assert.equal(byService.get("WAITERS")?.included, false);
  assert.equal(byService.get("WAITERS")?.quantity, 0);
  assert.equal(byService.get("DISPOSABLES")?.known, true);
  assert.equal(byService.get("DISPOSABLES")?.included, true);
  assert.equal(byService.get("DISPOSABLES")?.quantity, 1);
  assert.equal(byService.get("DISPOSABLES")?.estimatedValue, 560);
});

test("servicos escolhidos preservam fallback explicito de snapshots historicos", () => {
  const services = buildSelectedServices({
    waiters: 4,
    includeDisposables: false,
  });
  const byService = new Map(services.map((service) => [service.service, service]));

  assert.equal(byService.get("WAITERS")?.included, true);
  assert.equal(byService.get("WAITERS")?.quantity, 4);
  assert.equal(byService.get("DISPOSABLES")?.included, false);
});

test("snapshot historico sem informacao de servico nao inventa ausencia", () => {
  const services = buildSelectedServices({ items: [] });
  assert.equal(services.length, 2);
  assert.equal(services.every((service) => service.known === false), true);
  assert.equal(services.every((service) => service.quantity === null), true);
});

test("historico de servicos preserva inclusao retirada e nova inclusao na ordem", () => {
  const rows = buildServiceHistory([
    {
      id: "c1",
      sequence: 1,
      type: "SERVICE_ADDED",
      service: "WAITERS",
      recordedAt: "2026-08-27T10:00:00.000Z",
    },
    {
      id: "c2",
      sequence: 2,
      type: "SERVICE_REMOVED",
      service: "WAITERS",
      recordedAt: "2026-08-27T10:01:00.000Z",
    },
    {
      id: "c3",
      sequence: 3,
      type: "SERVICE_ADDED",
      service: "DISPOSABLES",
      recordedAt: "2026-08-27T10:02:00.000Z",
    },
  ]);

  assert.deepEqual(rows.map((row) => ({
    name: row.name,
    action: row.action,
    sequence: row.sequence,
  })), [
    { name: "Garçons", action: "Incluído", sequence: 1 },
    { name: "Garçons", action: "Retirado", sequence: 2 },
    { name: "Descartáveis", action: "Incluído", sequence: 3 },
  ]);
});

test("historico de servicos ignora mudancas de produto e servicos desconhecidos", () => {
  const rows = buildServiceHistory([
    { type: "ITEM_ADDED", productId: "burger" },
    { type: "SERVICE_ADDED", service: "UNKNOWN" },
    { type: "SERVICE_ADDED", service: "DISPOSABLES" },
  ]);

  assert.equal(rows.length, 1);
  assert.equal(rows[0].name, "Descartáveis");
});

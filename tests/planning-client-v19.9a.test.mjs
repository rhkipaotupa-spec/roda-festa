import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { buildProposalPresentation } from "../src/planner/planning-book/proposalPresentation.js";
import { createPlanningSessionRepository } from "../api/_lib/planning-session-repository.js";
import { createMemoryPlanningSessionAdapter } from "../api/_lib/planning-session-adapters/memory.js";
import { startPlanningSessionCommand } from "../api/planning-sessions.js";

test("V19.9A deriva total geral e valores por pessoa sem alterar o contratado", () => {
  const result = buildProposalPresentation({ investmentTotal: 1800, consignmentTotal: 600, realGuests: 40 });
  assert.equal(result.investmentTotal, 1800);
  assert.equal(result.consignmentTotal, 600);
  assert.equal(result.estimatedEventTotal, 2400);
  assert.equal(result.contractedPerPerson, 45);
  assert.equal(result.consignmentPerPerson, 15);
  assert.equal(result.estimatedEventPerPerson, 60);
  assert.equal(result.hasConsignment, true);
});

test("V19.9A sem consignacao preserva estimativa geral igual ao contratado", () => {
  const result = buildProposalPresentation({ investmentTotal: 1250, consignmentTotal: 0, realGuests: 25 });
  assert.equal(result.estimatedEventTotal, 1250);
  assert.equal(result.contractedPerPerson, 50);
  assert.equal(result.estimatedEventPerPerson, 50);
  assert.equal(result.hasConsignment, false);
});

test("V19.9A evita divisao por zero no valor por pessoa", () => {
  const result = buildProposalPresentation({ investmentTotal: 1000, consignmentTotal: 200, realGuests: 0 });
  assert.equal(result.contractedPerPerson, 0);
  assert.equal(result.consignmentPerPerson, 0);
  assert.equal(result.estimatedEventPerPerson, 0);
});

test("V19.9A aceita cha de bebe no boundary autoritativo de PlanningSession", async () => {
  const repository = createPlanningSessionRepository(createMemoryPlanningSessionAdapter());
  const body = {
    clientRequestId: "client-request-cha-bebe-001",
    clientName: "Cliente Teste",
    phone: "14999999999",
    eventType: "cha-bebe",
    eventDate: "2099-08-25",
    adults: 20,
    olderChildren: 0,
    children: 0,
    duration: 4,
    selectedProductIds: ["coxinha-frango-catupiry"],
    includeWaiters: false,
    includeDisposables: false,
  };
  const result = await startPlanningSessionCommand({ body, token: "token-owner", repository, idFactory: () => "session-cha-bebe" });
  assert.equal(result.sessionId, "session-cha-bebe");
});

test("V19.9A mantem tipo de evento desconhecido bloqueado", async () => {
  const repository = createPlanningSessionRepository(createMemoryPlanningSessionAdapter());
  const body = {
    clientRequestId: "client-request-event-invalid",
    clientName: "Cliente Teste",
    phone: "14999999999",
    eventType: "nao-existe",
    eventDate: "2099-08-25",
    adults: 20,
    olderChildren: 0,
    children: 0,
    duration: 4,
    selectedProductIds: ["coxinha-frango-catupiry"],
    includeWaiters: false,
    includeDisposables: false,
  };
  await assert.rejects(() => startPlanningSessionCommand({ body, token: "token-owner", repository }), /invalid_event_type/);
});

test("V19.9A PDF usa paginacao de impressao natural e comunica os tres valores", () => {
  const source = fs.readFileSync(new URL("../src/planner/planning-book/PlanningBook.jsx", import.meta.url), "utf8");
  assert.match(source, /id: "cha-bebe", label: "Chá de bebê"/);
  assert.match(source, /Estimativa geral do evento/);
  assert.match(source, /Contratado por pessoa/);
  assert.match(source, /financial-page/);
  assert.match(source, /page-break-after:auto/);
  assert.match(source, /page-break-before:always/);
  assert.doesNotMatch(source, /\.page\{[^}]*page-break-after:always/);
  assert.match(source, /\.cover\{[^}]*min-height:297mm[^}]*page-break-after:always/);
});

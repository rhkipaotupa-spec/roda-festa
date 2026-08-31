import test from "node:test";
import assert from "node:assert/strict";
import { createPlanningSessionRepository } from "../api/_lib/planning-session-repository.js";
import { createMemoryPlanningSessionAdapter } from "../api/_lib/planning-session-adapters/memory.js";
import { appendPlanningChangesCommand, startPlanningSessionCommand, finalizePlanningSessionCommand, readPlanningJourneyCommand } from "../api/planning-sessions.js";
import { PRODUCTS } from "../src/planner/planning-book/engine/planningRules.js";
import { productCatalogFingerprint } from "../src/planner/planning-book/engine/productCatalog.js";

function repo() { return createPlanningSessionRepository(createMemoryPlanningSessionAdapter()); }
function startBody() {
  return {
    clientRequestId: "client-request-1234567890",
    catalogFingerprint: productCatalogFingerprint(Object.values(PRODUCTS)),
    clientName: "Cliente Teste",
    phone: "14999999999",
    eventType: "infantil",
    eventDate: "2099-08-25",
    adults: 20,
    olderChildren: 0,
    children: 0,
    duration: 4,
    selectedProductIds: ["coxinha-frango-catupiry", "mini-hot-dog", "suco-laranja-200ml"],
    includeWaiters: false,
    includeDisposables: false,
  };
}

test("start cria recomendacao autoritativa no servidor e preserva tres carrinhos", async () => {
  const repository = repo();
  const result = await startPlanningSessionCommand({ body: startBody(), token: "token-owner", repository, idFactory: () => "session-1" });
  assert.equal(result.sessionId, "session-1");
  assert.equal(result.recommendation.totalCarts, 3);
  assert.equal(result.recommendation.versions.recommendation, "RF-REC-2.1.0");
  assert.equal(result.catalogFingerprint, startBody().catalogFingerprint);
  const stored = await repository.getOwned({ sessionId: "session-1", tokenHash: (await import("../api/_lib/planning-session-security.js")).hashSessionToken("token-owner") });
  assert.equal(stored.recommendation_snapshot.totalCarts, 3);
  assert.equal(stored.input_snapshot.catalogFingerprint, startBody().catalogFingerprint);
  assert.ok(Array.isArray(stored.input_snapshot.productCatalogSnapshot));
});

test("start rejeita fingerprint de catalogo divergente antes de persistir", async () => {
  const body = startBody();
  body.catalogFingerprint = "rfcat-v1-deadbeef";
  await assert.rejects(
    () => startPlanningSessionCommand({ body, token: "token-owner", repository: repo() }),
    /planning_catalog_changed/,
  );
});

test("start rejeita produto inexistente antes de persistir", async () => {
  const body = startBody();
  body.selectedProductIds = ["nao-existe"];
  await assert.rejects(() => startPlanningSessionCommand({ body, token: "token-owner", repository: repo() }), /unknown_product/);
});

test("finalizacao usa recomendacao guardada, recalcula final e deriva delta no servidor", async () => {
  const repository = repo();
  const started = await startPlanningSessionCommand({ body: startBody(), token: "token-owner", repository, idFactory: () => "session-1" });
  const recommendation = started.recommendation;
  const finalItems = recommendation.items.map((item) => ({ ...item, operationalGroup: item.id === "coxinha-frango-catupiry" ? "fried" : item.id === "suco-laranja-200ml" ? "beverages" : "hotSandwiches", priceUnit: "unit", estimatedValue: item.consignment ? 0 : item.quantity * item.unitPrice }));
  finalItems[0].quantity += 25;
  finalItems[0].estimatedValue = finalItems[0].quantity * finalItems[0].unitPrice;
  const { rebuildAuthoritativeSnapshot } = await import("../api/planning-submissions.js");
  const seed = {
    code: "RF-990825-00001", clientName: "Cliente Teste", phone: "14999999999", eventDate: "2099-08-25", eventType: "infantil", eventLabel: "Festa Infantil",
    adults: 20, olderChildren: 0, children: 0, duration: 4, totalCarts: 3, waiters: 0, includeDisposables: false,
    items: finalItems, investmentTotal: 0,
  };
  const originalItems = seed.items;
  const products = (await import("../src/planner/planning-book/engine/planningRules.js")).PRODUCTS;
  const rules = await import("../src/planner/planning-book/engine/planningRules.js");
  const serverItems = originalItems.map(i => ({ ...products[Object.keys(products).find(k => products[k].id === i.id)], quantity:i.quantity, estimatedValue:i.consignment?0:i.quantity*i.unitPrice }));
  const carts = rules.calculateCarts({items:serverItems,serviceHours:4,equivalentGuests:20});
  const waiters = rules.calculateWaiters({realGuests:20,includeWaiters:false});
  const disposables = rules.calculateDisposables({equivalentGuests:20,includeDisposables:false});
  const investment = rules.calculateInvestment({items:serverItems,totalCarts:carts.totalCarts,serviceHours:4,waiters,disposables});
  seed.investmentTotal = investment.total;
  const checked = rebuildAuthoritativeSnapshot(seed);
  assert.equal(checked.investmentTotal, investment.total);
  const result = await finalizePlanningSessionCommand({ body: { sessionId:"session-1", expectedVersion:1, finalSnapshot:seed }, token:"token-owner", repository });
  assert.equal(result.finalized, true);
  assert.ok(result.changes.some(change => change.type === "ITEM_QUANTITY_CHANGED" && change.productId === "coxinha-frango-catupiry"));
});

test("finalizacao de sessao alheia e rejeitada", async () => {
  const repository = repo();
  await startPlanningSessionCommand({ body: startBody(), token: "token-owner", repository, idFactory: () => "session-1" });
  await assert.rejects(() => finalizePlanningSessionCommand({ body: { sessionId:"session-1", expectedVersion:1, finalSnapshot:{} }, token:"intruder", repository }), /not_found/);
});

test("finalizacao rejeita mudanca de contexto que nao pertence a mesma recomendacao", async () => {
  const repository = repo();
  await startPlanningSessionCommand({ body: startBody(), token: "token-owner", repository, idFactory: () => "session-1" });
  await assert.rejects(() => finalizePlanningSessionCommand({
    body: { sessionId: "session-1", expectedVersion: 1, finalSnapshot: { code: "RF-990825-00002", eventDate: "2099-08-26", eventType: "infantil", adults:20, olderChildren:0, children:0, duration:4, items:[] } },
    token: "token-owner", repository,
  }), /planning_context_mismatch:eventDate/);
});

test("timeline normaliza ator e timestamp no servidor e preserva ordem", async () => {
  const repository = repo();
  await startPlanningSessionCommand({ body:startBody(), token:"token-owner", repository, idFactory:()=>"session-1" });
  let n = 0;
  const result = await appendPlanningChangesCommand({
    body:{ sessionId:"session-1", expectedVersion:1, changes:[
      { type:"ITEM_QUANTITY_CHANGED", productId:"coxinha-frango-catupiry", beforeQuantity:25, afterQuantity:50 },
      { type:"SERVICE_ADDED", service:"WAITERS" },
    ] },
    token:"token-owner", repository, now:new Date("2026-08-25T15:00:00.000Z"), idFactory:()=>`change-${++n}`,
  });
  assert.equal(result.version, 2);
  assert.deepEqual(result.changes.map(c=>c.id), ["change-1","change-2"]);
  assert.ok(result.changes.every(c=>c.actor === "CLIENT" && c.recordedAt === "2026-08-25T15:00:00.000Z"));
});

test("timeline rejeita tipo, produto e ownership invalidos", async () => {
  const repository = repo();
  await startPlanningSessionCommand({ body:startBody(), token:"token-owner", repository, idFactory:()=>"session-1" });
  await assert.rejects(() => appendPlanningChangesCommand({ body:{sessionId:"session-1",expectedVersion:1,changes:[{type:"CLICK"}]}, token:"token-owner", repository }), /invalid_planning_change_type/);
  await assert.rejects(() => appendPlanningChangesCommand({ body:{sessionId:"session-1",expectedVersion:1,changes:[{type:"ITEM_ADDED",productId:"nao-existe"}]}, token:"token-owner", repository }), /unknown_product/);
  await assert.rejects(() => appendPlanningChangesCommand({ body:{sessionId:"session-1",expectedVersion:1,changes:[{type:"SERVICE_ADDED",service:"WAITERS"}]}, token:"intruder", repository }), /not_found/);
});

test("read command retorna jornada protegida por ownership sem recalcular historico", async () => {
  const repository = repo();
  const started = await startPlanningSessionCommand({
    body: startBody(),
    token: "token-owner",
    repository,
    idFactory: () => "session-read",
  });

  const result = await readPlanningJourneyCommand({
    body: { sessionId: started.sessionId },
    token: "token-owner",
    repository,
  });

  assert.equal(result.journey.sessionId, "session-read");
  assert.equal(result.journey.status, "RECOMMENDED");
  assert.equal(result.journey.recommendationSnapshot.totalCarts, 3);

  await assert.rejects(
    () => readPlanningJourneyCommand({
      body: { sessionId: started.sessionId },
      token: "intruder",
      repository,
    }),
    /planning_session_not_found/,
  );
});

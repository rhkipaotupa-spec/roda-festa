import test from "node:test";
import assert from "node:assert/strict";
import { createPlanningSessionRepository } from "../api/_lib/planning-session-repository.js";
import { createMemoryPlanningSessionAdapter } from "../api/_lib/planning-session-adapters/memory.js";

function setup() {
  const adapter = createMemoryPlanningSessionAdapter();
  return { adapter, repo: createPlanningSessionRepository(adapter) };
}

test("repositorio exige contrato completo de adapter", () => {
  assert.throws(() => createPlanningSessionRepository({}), /adapter_missing:create/);
});

test("adapter em memoria preserva recomendacao original e idempotencia de criacao", async () => {
  const { adapter, repo } = setup();
  const input = { adults: 20 };
  const recommendation = [{ id: "x", quantity: 10 }];
  const first = await repo.create({ id: "s1", clientRequestId: "request-1", tokenHash: "hash-a", inputSnapshot: input, recommendationSnapshot: recommendation });
  input.adults = 999;
  recommendation[0].quantity = 999;
  const second = await repo.create({ id: "s2", clientRequestId: "request-1", tokenHash: "hash-a", inputSnapshot: {}, recommendationSnapshot: [] });
  assert.equal(first.created, true);
  assert.equal(second.created, false);
  assert.equal(second.session.id, "s1");
  assert.equal(second.session.input_snapshot.adults, 20);
  assert.equal(second.session.recommendation_snapshot[0].quantity, 10);
  assert.equal(adapter._unsafeSizeForTests(), 1);
});

test("posse depende de sessionId e tokenHash", async () => {
  const { repo } = setup();
  await repo.create({ id: "s1", clientRequestId: "r1", tokenHash: "owner", inputSnapshot: {}, recommendationSnapshot: [] });
  assert.ok(await repo.getOwned({ sessionId: "s1", tokenHash: "owner" }));
  assert.equal(await repo.getOwned({ sessionId: "s1", tokenHash: "intruder" }), null);
});

test("finalizacao usa versao esperada, e segunda proposta diferente e bloqueada", async () => {
  const { repo } = setup();
  await repo.create({ id: "s1", clientRequestId: "r1", tokenHash: "owner", inputSnapshot: {}, recommendationSnapshot: [] });
  await assert.rejects(() => repo.finalize({ sessionId: "s1", tokenHash: "owner", finalSnapshot: { code: "RF-1" }, changes: [], expectedVersion: 99 }), /concurrent_update/);
  const done = await repo.finalize({ sessionId: "s1", tokenHash: "owner", finalSnapshot: { code: "RF-1" }, changes: [], expectedVersion: 1 });
  assert.equal(done.session.version, 2);
  const replay = await repo.finalize({ sessionId: "s1", tokenHash: "owner", finalSnapshot: { code: "RF-1" }, changes: [], expectedVersion: 1 });
  assert.equal(replay.idempotent, true);
  await assert.rejects(() => repo.finalize({ sessionId: "s1", tokenHash: "owner", finalSnapshot: { code: "RF-2" }, changes: [], expectedVersion: 2 }), /already_finalized/);
});

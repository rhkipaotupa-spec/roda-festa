import test from "node:test";
import assert from "node:assert/strict";
import { createPlanningSessionRuntime, getPlanningPersistenceProvider } from "../api/_lib/planning-session-runtime.js";

test("runtime fica disabled por padrao e falha alto", () => {
  assert.equal(getPlanningPersistenceProvider({}), "disabled");
  assert.throws(() => createPlanningSessionRuntime({ env: {} }), /planning_persistence_disabled/);
});

test("memory exige opt-in e e proibido em producao", () => {
  assert.throws(() => createPlanningSessionRuntime({ env: { RODA_FESTA_PLANNING_PERSISTENCE_PROVIDER: "memory" } }), /requires_explicit_opt_in/);
  assert.throws(() => createPlanningSessionRuntime({ env: { RODA_FESTA_PLANNING_PERSISTENCE_PROVIDER: "memory", RODA_FESTA_ALLOW_MEMORY_PLANNING_STORE: "1", NODE_ENV: "production" } }), /forbidden_in_production/);
  assert.ok(createPlanningSessionRuntime({ env: { RODA_FESTA_PLANNING_PERSISTENCE_PROVIDER: "memory", RODA_FESTA_ALLOW_MEMORY_PLANNING_STORE: "1", NODE_ENV: "test" } }));
});

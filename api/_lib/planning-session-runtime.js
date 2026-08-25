import { createPlanningSessionRepository } from "./planning-session-repository.js";
import { createMemoryPlanningSessionAdapter } from "./planning-session-adapters/memory.js";
import { createSupabasePlanningSessionAdapter } from "./planning-session-adapters/supabase.js";

export function getPlanningPersistenceProvider(env = process.env) {
  return String(env.RODA_FESTA_PLANNING_PERSISTENCE_PROVIDER || "disabled").trim().toLowerCase();
}

export function createPlanningSessionRuntime({ env = process.env, fetchImpl = globalThis.fetch } = {}) {
  const provider = getPlanningPersistenceProvider(env);

  if (provider === "disabled" || provider === "") {
    throw new Error("planning_persistence_disabled");
  }

  if (provider === "supabase") {
    return createPlanningSessionRepository(createSupabasePlanningSessionAdapter({ env, fetchImpl }));
  }

  if (provider === "memory") {
    if (env.NODE_ENV === "production") throw new Error("planning_memory_store_forbidden_in_production");
    if (String(env.RODA_FESTA_ALLOW_MEMORY_PLANNING_STORE || "") !== "1") {
      throw new Error("planning_memory_store_requires_explicit_opt_in");
    }
    return createPlanningSessionRepository(createMemoryPlanningSessionAdapter());
  }

  throw new Error(`planning_persistence_provider_unsupported:${provider}`);
}

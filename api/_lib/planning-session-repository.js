import { buildJourneyReadModel, assertJourneyReadModelIntegrity } from "./planning-journey-read-model.js";

export function createPlanningSessionRepository(adapter) {
  if (!adapter || typeof adapter !== "object") throw new Error("planning_session_adapter_required");
  const required = ["create", "getOwned", "appendChanges", "finalize", "touchContact"];
  for (const method of required) {
    if (typeof adapter[method] !== "function") throw new Error(`planning_session_adapter_missing:${method}`);
  }

  async function getJourney(input) {
    const session = await adapter.getOwned(input);
    if (!session) return null;
    const model = buildJourneyReadModel(session);
    assertJourneyReadModelIntegrity(model);
    return model;
  }

  return Object.freeze({
    create: (input) => adapter.create(input),
    getOwned: (input) => adapter.getOwned(input),
    getJourney,
    appendChanges: (input) => adapter.appendChanges(input),
    finalize: (input) => adapter.finalize(input),
    touchContact: (input) => adapter.touchContact(input),
  });
}

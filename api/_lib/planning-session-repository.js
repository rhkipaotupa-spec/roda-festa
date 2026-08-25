export function createPlanningSessionRepository(adapter) {
  if (!adapter || typeof adapter !== "object") throw new Error("planning_session_adapter_required");
  const required = ["create", "getOwned", "appendChanges", "finalize", "touchContact"];
  for (const method of required) {
    if (typeof adapter[method] !== "function") throw new Error(`planning_session_adapter_missing:${method}`);
  }

  return Object.freeze({
    create: (input) => adapter.create(input),
    getOwned: (input) => adapter.getOwned(input),
    appendChanges: (input) => adapter.appendChanges(input),
    finalize: (input) => adapter.finalize(input),
    touchContact: (input) => adapter.touchContact(input),
  });
}

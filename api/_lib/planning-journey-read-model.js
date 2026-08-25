function clone(value) {
  return value == null ? value : structuredClone(value);
}

function assertObject(value, name) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(`${name} must be an object`);
  }
}

function pick(session, camel, snake) {
  return session[camel] ?? session[snake] ?? null;
}

function sortChanges(changes = []) {
  return [...changes].sort((a, b) => {
    const av = Number(a.sequence ?? 0);
    const bv = Number(b.sequence ?? 0);
    if (av !== bv) return av - bv;
    return String(a.recordedAt ?? a.recorded_at ?? "")
      .localeCompare(String(b.recordedAt ?? b.recorded_at ?? ""));
  });
}

export function buildJourneyReadModel(session) {
  assertObject(session, "session");

  const recommendation = clone(pick(session, "recommendationSnapshot", "recommendation_snapshot"));
  const finalProposal = clone(pick(session, "finalProposalSnapshot", "final_proposal_snapshot"));
  const input = clone(pick(session, "inputSnapshot", "input_snapshot"));
  const rawChanges = pick(session, "planningChanges", "planning_changes") ?? [];
  const changes = sortChanges(rawChanges).map((change) => clone(change));

  const status = finalProposal
    ? "FINALIZED"
    : recommendation
      ? "RECOMMENDED"
      : "STARTED";

  return Object.freeze({
    sessionId: session.id,
    status,
    version: Number(session.version ?? 0),
    createdAt: session.createdAt ?? session.created_at ?? null,
    updatedAt: session.updatedAt ?? session.last_activity_at ?? session.updated_at ?? null,
    inputSnapshot: input,
    recommendationSnapshot: recommendation,
    planningChanges: Object.freeze(changes),
    finalProposalSnapshot: finalProposal,
    versions: Object.freeze({
      recommendation: recommendation?.versions?.recommendation ?? null,
      commercialRules: recommendation?.versions?.commercialRules ?? null,
      pricing: recommendation?.versions?.pricing ?? null,
    }),
    reconciliation: finalProposal?.ledger?.reconciliation ?? finalProposal?.reconciliation ?? null,
  });
}

export function assertJourneyReadModelIntegrity(model) {
  assertObject(model, "model");

  if (!model.sessionId) throw new Error("journey_read_model_missing_session_id");

  const changes = model.planningChanges ?? [];
  for (let index = 1; index < changes.length; index += 1) {
    const previous = Number(changes[index - 1].sequence ?? 0);
    const current = Number(changes[index].sequence ?? 0);
    if (current < previous) throw new Error("journey_read_model_changes_out_of_order");
  }

  if (model.finalProposalSnapshot && !model.recommendationSnapshot) {
    throw new Error("journey_read_model_final_without_recommendation");
  }

  return true;
}

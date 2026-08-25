function clone(value) {
  return value == null ? value : structuredClone(value);
}

function money(value) {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? number : 0;
}

function itemCount(snapshot) {
  const candidates = [
    snapshot?.items,
    snapshot?.products,
    snapshot?.selectedItems,
  ];
  const list = candidates.find(Array.isArray);
  return list ? list.length : 0;
}

export function buildAdminJourneySummary(journey) {
  if (!journey || typeof journey !== "object") {
    throw new TypeError("journey must be an object");
  }
  if (!journey.sessionId) throw new Error("admin_journey_missing_session_id");

  const recommendation = clone(journey.recommendationSnapshot);
  const finalProposal = clone(journey.finalProposalSnapshot);
  const changes = clone(journey.planningChanges ?? []);
  const effective = finalProposal ?? recommendation ?? null;

  return Object.freeze({
    sessionId: journey.sessionId,
    status: journey.status,
    version: Number(journey.version ?? 0),
    createdAt: journey.createdAt ?? null,
    updatedAt: journey.updatedAt ?? null,
    event: Object.freeze({
      date: journey.inputSnapshot?.eventDate ?? journey.inputSnapshot?.date ?? null,
      guests: Number(
        journey.inputSnapshot?.guests ??
        journey.inputSnapshot?.guestCount ??
        journey.inputSnapshot?.people ??
        0
      ),
    }),
    commercial: Object.freeze({
      recommendedTotal: money(
        recommendation?.investmentTotal ??
        recommendation?.total ??
        recommendation?.grandTotal
      ),
      finalTotal: finalProposal
        ? money(finalProposal?.investmentTotal ?? finalProposal?.total ?? finalProposal?.grandTotal)
        : null,
      effectiveTotal: effective
        ? money(effective?.investmentTotal ?? effective?.total ?? effective?.grandTotal)
        : 0,
      itemCount: itemCount(effective),
      reconciliation: clone(journey.reconciliation),
    }),
    history: Object.freeze({
      changeCount: changes.length,
      changes: Object.freeze(changes),
      hasFinalProposal: Boolean(finalProposal),
    }),
    versions: clone(journey.versions),
  });
}

export function buildAdminJourneyDetail(journey) {
  const summary = buildAdminJourneySummary(journey);
  return Object.freeze({
    ...summary,
    inputSnapshot: clone(journey.inputSnapshot),
    recommendationSnapshot: clone(journey.recommendationSnapshot),
    finalProposalSnapshot: clone(journey.finalProposalSnapshot),
  });
}

function clone(value) {
  return value == null ? value : structuredClone(value);
}

function money(value) {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? number : 0;
}

function nonNegativeNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : 0;
}

function optionalNonNegativeNumber(value) {
  if (value == null || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : null;
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

function buildGuestSummary(input = {}) {
  const adults = nonNegativeNumber(input?.adults);
  const olderChildren = nonNegativeNumber(input?.olderChildren);
  const children = nonNegativeNumber(input?.children);
  const calculatedTotal = adults + olderChildren + children;

  const explicitTotalCandidates = [
    input?.realGuests,
    input?.guests,
    input?.guestCount,
    input?.people,
  ];
  const explicitTotal = explicitTotalCandidates
    .map(optionalNonNegativeNumber)
    .find((value) => value !== null);

  return Object.freeze({
    guests: explicitTotal ?? calculatedTotal,
    adults,
    olderChildren,
    children,
  });
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
  const input = journey.inputSnapshot ?? {};
  const guests = buildGuestSummary(input);

  return Object.freeze({
    sessionId: journey.sessionId,
    status: journey.status,
    version: Number(journey.version ?? 0),
    createdAt: journey.createdAt ?? null,
    updatedAt: journey.updatedAt ?? null,
    event: Object.freeze({
      date: input?.eventDate ?? input?.date ?? null,
      type: input?.eventType ?? null,
      duration: nonNegativeNumber(input?.duration),
      guests: guests.guests,
      adults: guests.adults,
      olderChildren: guests.olderChildren,
      children: guests.children,
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

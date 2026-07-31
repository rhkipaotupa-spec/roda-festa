export const guestWeights = {
  adult: 1,
  child: 0.5,
};

export const defaultEventDurationHours = 4;

export const brigadeirosPerGuest = 6;

export const cakeReference = {
  referenceGuests: 21,
  kilogramsWithBrigadeiros: 2,
  kilogramsWithoutBrigadeiros: 3,
  roundingStepKg: 0.5,
};

function normalizeNumber(value, fallback = 0) {
  const parsedValue = Number(value);

  if (!Number.isFinite(parsedValue)) {
    return fallback;
  }

  return parsedValue;
}

function normalizeGuestQuantity(value) {
  return Math.max(0, normalizeNumber(value, 0));
}

function normalizeDurationHours(value) {
  return Math.max(
    1,
    normalizeNumber(value, defaultEventDurationHours)
  );
}

export function calculateEquivalentGuests({
  adults = 0,
  children = 0,
}) {
  const safeAdults = normalizeGuestQuantity(adults);
  const safeChildren = normalizeGuestQuantity(children);

  return (
    safeAdults * guestWeights.adult +
    safeChildren * guestWeights.child
  );
}

export function calculateDurationFactor({
  durationHours = defaultEventDurationHours,
}) {
  const safeDurationHours =
    normalizeDurationHours(durationHours);

  return safeDurationHours / defaultEventDurationHours;
}

export function buildQuantityContext({
  adults = 0,
  children = 0,
  durationHours = defaultEventDurationHours,
}) {
  const safeAdults = normalizeGuestQuantity(adults);
  const safeChildren = normalizeGuestQuantity(children);
  const safeDurationHours =
    normalizeDurationHours(durationHours);

  return {
    adults: safeAdults,
    children: safeChildren,
    totalGuests: safeAdults + safeChildren,

    equivalentGuests: calculateEquivalentGuests({
      adults: safeAdults,
      children: safeChildren,
    }),

    durationHours: safeDurationHours,

    durationFactor: calculateDurationFactor({
      durationHours: safeDurationHours,
    }),
  };
}

export function roundUpToStep(value, step) {
  const safeValue = normalizeNumber(value, 0);
  const safeStep = normalizeNumber(step, 0);

  if (safeValue <= 0 || safeStep <= 0) {
    return 0;
  }

  return Math.ceil(safeValue / safeStep) * safeStep;
}

export function calculateBrigadeiroQuantity({
  adults = 0,
  children = 0,
}) {
  const totalGuests =
    normalizeGuestQuantity(adults) +
    normalizeGuestQuantity(children);

  if (totalGuests === 0) {
    return 0;
  }

  return Math.ceil(
    totalGuests * brigadeirosPerGuest
  );
}

export function calculateCakeQuantity({
  adults = 0,
  children = 0,
  hasBrigadeiros = false,
}) {
  const totalGuests =
    normalizeGuestQuantity(adults) +
    normalizeGuestQuantity(children);

  if (totalGuests === 0) {
    return 0;
  }

  const referenceKilograms = hasBrigadeiros
    ? cakeReference.kilogramsWithBrigadeiros
    : cakeReference.kilogramsWithoutBrigadeiros;

  const kilogramsPerGuest =
    referenceKilograms /
    cakeReference.referenceGuests;

  const calculatedKilograms =
    totalGuests * kilogramsPerGuest;

  return roundUpToStep(
    calculatedKilograms,
    cakeReference.roundingStepKg
  );
}
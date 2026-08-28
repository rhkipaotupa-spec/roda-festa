function money(value) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) return 0;
  return Math.round(number * 100) / 100;
}

function perPerson(value, guests) {
  const count = Number(guests);
  if (!Number.isFinite(count) || count <= 0) return 0;
  return Math.round((money(value) / count) * 100) / 100;
}

export function buildProposalPresentation({ investmentTotal = 0, consignmentTotal = 0, realGuests = 0 } = {}) {
  const contracted = money(investmentTotal);
  const consignment = money(consignmentTotal);
  const estimatedEventTotal = money(contracted + consignment);

  return Object.freeze({
    investmentTotal: contracted,
    consignmentTotal: consignment,
    estimatedEventTotal,
    hasConsignment: consignment > 0,
    contractedPerPerson: perPerson(contracted, realGuests),
    consignmentPerPerson: perPerson(consignment, realGuests),
    estimatedEventPerPerson: perPerson(estimatedEventTotal, realGuests),
  });
}

const MONTHS_PT_BR = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

function monthIdentity(value) {
  const text = String(value || "").slice(0, 10);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
  if (!match) {
    return {
      key: "sem-data",
      sortKey: "9999-99",
      label: "Sem data definida",
    };
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  if (!Number.isInteger(year) || month < 1 || month > 12) {
    return {
      key: "sem-data",
      sortKey: "9999-99",
      label: "Sem data definida",
    };
  }

  return {
    key: `${match[1]}-${match[2]}`,
    sortKey: `${match[1]}-${match[2]}`,
    label: `${MONTHS_PT_BR[month - 1]} ${year}`,
  };
}

export function groupQuotesByEventMonth(quotes = []) {
  const groups = new Map();

  for (const quote of Array.isArray(quotes) ? quotes : []) {
    const identity = monthIdentity(quote?.event?.date);
    if (!groups.has(identity.key)) {
      groups.set(identity.key, {
        ...identity,
        quotes: [],
        validated: 0,
        pending: 0,
      });
    }

    const group = groups.get(identity.key);
    group.quotes.push(quote);
    if (quote?.history?.hasFinalProposal) group.validated += 1;
    else group.pending += 1;
  }

  return [...groups.values()]
    .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
    .map((group) => ({
      ...group,
      total: group.quotes.length,
    }));
}

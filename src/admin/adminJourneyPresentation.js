function toQuantity(value) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : 0;
}

function itemMap(items = []) {
  return new Map(
    (Array.isArray(items) ? items : []).map((item) => [String(item?.id || ""), item]),
  );
}

function classifyChange(before, after) {
  if (before === 0 && after > 0) return "added";
  if (before > 0 && after === 0) return "removed";
  if (after > before) return "increased";
  if (after < before) return "reduced";
  return "unchanged";
}

function ledgerFromSnapshot(snapshot) {
  return (
    snapshot?.commercialLedger ??
    snapshot?.investment?.ledger ??
    snapshot?.ledger ??
    null
  );
}

function contractedLines(snapshot) {
  const ledger = ledgerFromSnapshot(snapshot);
  return Array.isArray(ledger?.contractedLines) ? ledger.contractedLines : [];
}

function findServiceLine(snapshot, { id, type }) {
  return contractedLines(snapshot).find(
    (line) => String(line?.id || "") === id || String(line?.type || "") === type,
  );
}

function explicitWaiters(snapshot) {
  if (snapshot?.waiters == null) return null;
  return toQuantity(snapshot.waiters);
}

function explicitDisposables(snapshot) {
  if (snapshot?.includeDisposables == null) return null;
  return snapshot.includeDisposables ? 1 : 0;
}

function serviceQuantity(snapshot, definition) {
  const line = findServiceLine(snapshot, definition);
  if (line) return toQuantity(line.quantity);

  if (definition.service === "WAITERS") {
    return explicitWaiters(snapshot);
  }

  if (definition.service === "DISPOSABLES") {
    return explicitDisposables(snapshot);
  }

  return null;
}

function serviceValue(snapshot, definition) {
  const line = findServiceLine(snapshot, definition);
  return Number(line?.subtotal ?? 0) || 0;
}

function buildServiceComparison(recommendationSnapshot, finalProposalSnapshot) {
  const definitions = [
    {
      id: "service:waiters",
      type: "waiters",
      service: "WAITERS",
      name: "Garçons",
    },
    {
      id: "service:disposables",
      type: "disposables",
      service: "DISPOSABLES",
      name: "Descartáveis (pacote)",
    },
  ];

  const finalSnapshot = finalProposalSnapshot ?? recommendationSnapshot;
  const rows = [];

  for (const definition of definitions) {
    const beforeCandidate = serviceQuantity(recommendationSnapshot, definition);
    const afterCandidate = serviceQuantity(finalSnapshot, definition);

    const knownBefore = beforeCandidate !== null;
    const knownAfter = afterCandidate !== null;
    if (!knownBefore && !knownAfter) continue;

    const before = toQuantity(beforeCandidate);
    const after = toQuantity(afterCandidate);
    if (before === 0 && after === 0) continue;

    rows.push(Object.freeze({
      id: definition.id,
      kind: "service",
      service: definition.service,
      name: definition.name,
      category: "Serviços",
      before,
      after,
      delta: after - before,
      change: classifyChange(before, after),
      unitPrice: 0,
      consignment: false,
      estimatedValue: serviceValue(finalSnapshot, definition),
    }));
  }

  return rows;
}

export function buildItemComparison(recommendationSnapshot, finalProposalSnapshot) {
  const recommendationItems = Array.isArray(recommendationSnapshot?.items)
    ? recommendationSnapshot.items
    : [];
  const finalItems = Array.isArray(finalProposalSnapshot?.items)
    ? finalProposalSnapshot.items
    : recommendationItems;

  const initial = itemMap(recommendationItems);
  const final = itemMap(finalItems);
  const orderedIds = [];
  const seen = new Set();

  for (const item of recommendationItems) {
    const id = String(item?.id || "");
    if (!id || seen.has(id)) continue;
    seen.add(id);
    orderedIds.push(id);
  }

  for (const item of finalItems) {
    const id = String(item?.id || "");
    if (!id || seen.has(id)) continue;
    seen.add(id);
    orderedIds.push(id);
  }

  const itemRows = orderedIds.map((id) => {
    const beforeItem = initial.get(id);
    const afterItem = final.get(id);
    const source = afterItem ?? beforeItem ?? {};
    const before = toQuantity(beforeItem?.quantity);
    const after = toQuantity(afterItem?.quantity);

    return Object.freeze({
      id,
      kind: "product",
      name: source?.name || id,
      category: source?.commercialCategory || "Sem categoria",
      before,
      after,
      delta: after - before,
      change: classifyChange(before, after),
      unitPrice: Number(source?.unitPrice ?? 0) || 0,
      consignment: Boolean(source?.consignment),
      estimatedValue: Number(afterItem?.estimatedValue ?? 0) || 0,
    });
  });

  return Object.freeze([
    ...itemRows,
    ...buildServiceComparison(recommendationSnapshot, finalProposalSnapshot),
  ]);
}

export function summarizeItemComparison(rows = []) {
  const summary = {
    changed: 0,
    increased: 0,
    reduced: 0,
    added: 0,
    removed: 0,
    unchanged: 0,
  };

  for (const row of rows) {
    const key = row?.change;
    if (key in summary) summary[key] += 1;
    if (key && key !== "unchanged") summary.changed += 1;
  }

  return Object.freeze(summary);
}

export function changeLabel(change) {
  switch (change) {
    case "added":
      return "Adicionado";
    case "removed":
      return "Retirado";
    case "increased":
      return "Aumentado";
    case "reduced":
      return "Reduzido";
    default:
      return "Mantido";
  }
}

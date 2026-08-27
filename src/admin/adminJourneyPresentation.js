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

const SERVICE_DEFINITIONS = Object.freeze([
  Object.freeze({
    id: "service:waiters",
    type: "waiters",
    service: "WAITERS",
    name: "Garçons",
  }),
  Object.freeze({
    id: "service:disposables",
    type: "disposables",
    service: "DISPOSABLES",
    name: "Descartáveis",
  }),
]);

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
  if (!snapshot || typeof snapshot !== "object") return null;

  const line = findServiceLine(snapshot, definition);
  if (line) return toQuantity(line.quantity);

  if (definition.service === "WAITERS") {
    const explicit = explicitWaiters(snapshot);
    if (explicit !== null) return explicit;
  }

  if (definition.service === "DISPOSABLES") {
    const explicit = explicitDisposables(snapshot);
    if (explicit !== null) return explicit;
  }

  if (ledgerFromSnapshot(snapshot)) return 0;
  return null;
}

function serviceValue(snapshot, definition) {
  const line = findServiceLine(snapshot, definition);
  return Number(line?.subtotal ?? 0) || 0;
}

function normalizeServiceCode(change) {
  const raw =
    change?.service ??
    change?.serviceId ??
    change?.serviceCode ??
    change?.payload?.service ??
    null;
  return raw == null ? "" : String(raw).toUpperCase();
}

function definitionForService(code) {
  return SERVICE_DEFINITIONS.find((definition) => definition.service === code) ?? null;
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

  return Object.freeze(orderedIds.map((id) => {
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
  }));
}

export function buildSelectedServices(finalProposalSnapshot) {
  if (!finalProposalSnapshot || typeof finalProposalSnapshot !== "object") {
    return Object.freeze([]);
  }

  return Object.freeze(SERVICE_DEFINITIONS.map((definition) => {
    const quantity = serviceQuantity(finalProposalSnapshot, definition);
    const known = quantity !== null;

    return Object.freeze({
      id: definition.id,
      service: definition.service,
      name: definition.name,
      known,
      included: known ? quantity > 0 : false,
      quantity: known ? toQuantity(quantity) : null,
      estimatedValue: known ? serviceValue(finalProposalSnapshot, definition) : null,
    });
  }));
}

export function buildServiceHistory(changes = []) {
  const rows = [];

  for (const [index, change] of (Array.isArray(changes) ? changes : []).entries()) {
    const type = String(change?.type || "").toUpperCase();
    if (type !== "SERVICE_ADDED" && type !== "SERVICE_REMOVED") continue;

    const service = normalizeServiceCode(change);
    const definition = definitionForService(service);
    if (!definition) continue;

    rows.push(Object.freeze({
      id: String(change?.id || `${index + 1}:${type}:${service}`),
      sequence: Number.isFinite(Number(change?.sequence)) ? Number(change.sequence) : index + 1,
      service,
      name: definition.name,
      type,
      action: type === "SERVICE_ADDED" ? "Incluído" : "Retirado",
      recordedAt:
        change?.recordedAt ??
        change?.recorded_at ??
        change?.timestamp ??
        change?.createdAt ??
        null,
      actor: change?.actor ?? null,
    }));
  }

  return Object.freeze(rows);
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

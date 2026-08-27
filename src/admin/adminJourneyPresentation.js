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

  return orderedIds.map((id) => {
    const beforeItem = initial.get(id);
    const afterItem = final.get(id);
    const source = afterItem ?? beforeItem ?? {};
    const before = toQuantity(beforeItem?.quantity);
    const after = toQuantity(afterItem?.quantity);

    return Object.freeze({
      id,
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

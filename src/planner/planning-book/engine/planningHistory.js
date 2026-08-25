function toItemMap(items = []) {
  return new Map(items.map((item) => [item.id, item]));
}

export function createRecommendationSnapshot({ suggestion, context, versions }) {
  return {
    schemaVersion: 1,
    capturedAt: new Date().toISOString(),
    versions: { ...versions },
    context: { ...context },
    items: (suggestion?.items || []).map((item) => ({
      id: item.id,
      name: item.name,
      commercialCategory: item.commercialCategory,
      quantity: Number(item.quantity) || 0,
      unitPrice: Number(item.unitPrice) || 0,
      consignment: Boolean(item.consignment),
    })),
    totalCarts: Number(suggestion?.carts?.totalCarts) || 0,
    investmentTotal: Number(suggestion?.investment?.total) || 0,
    ledger: suggestion?.investment?.ledger || null,
  };
}

export function compareRecommendationToFinal(recommendationSnapshot, finalItems = []) {
  const original = toItemMap(recommendationSnapshot?.items || []);
  const finalMap = toItemMap(finalItems);
  const changes = [];

  for (const [id, item] of original) {
    const finalItem = finalMap.get(id);
    if (!finalItem) {
      changes.push({ type: "ITEM_REMOVED", productId: id, before: item.quantity, after: 0 });
      continue;
    }
    const before = Number(item.quantity) || 0;
    const after = Number(finalItem.quantity) || 0;
    if (before !== after) {
      changes.push({ type: "ITEM_QUANTITY_CHANGED", productId: id, before, after });
    }
  }

  for (const [id, item] of finalMap) {
    if (!original.has(id)) {
      changes.push({ type: "ITEM_ADDED", productId: id, before: 0, after: Number(item.quantity) || 0 });
    }
  }

  return changes;
}

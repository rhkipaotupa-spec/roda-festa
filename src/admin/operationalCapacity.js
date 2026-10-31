import { calculateCarts } from '../planner/planning-book/engine/planningRules.js';

// Called only by the authenticated editor with its existing admin catalog.
// This is advisory and never changes quantities, prices or the cart allocation.
export function getOperationalCapacityWarnings({ items = [], products = [], duration = 4 } = {}) {
  const byId = new Map(products.map((product) => [String(product.id), product]));
  const operationalItems = items.flatMap((item) => {
    const product = byId.get(String(item.id));
    return product ? [{ ...product, quantity: Number(item.quantity) || 0 }] : [];
  });
  const serviceHours = Math.max(4, Number(duration) || 4);
  return calculateCarts({ items: operationalItems, serviceHours }).groups
    .map((group) => {
      // Unknown throughput cannot erase the minimum load already known from
      // other items sharing the cart. Never assign throughput to unknown items.
      const knownLoad = group.items.reduce((sum, item) => {
        const capacity = Number(item.productionPerHour);
        return Number.isFinite(capacity) && capacity > 0 ? sum + item.quantity / capacity : sum;
      }, 0);
      return { ...group, knownLoad };
    })
    .filter((group) => group.knownLoad > serviceHours)
    .map((group) => ({
      group: group.operationalGroup,
      usagePercent: Math.round(group.knownLoad / serviceHours * 100),
      loadHours: Math.round(group.knownLoad * 100) / 100,
      serviceHours,
      ...(group.capacityUnmeasured ? { isLowerBound: true } : {}),
    }));
}

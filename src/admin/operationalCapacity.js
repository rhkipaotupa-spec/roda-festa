import { calculateCarts } from '../planner/planning-book/engine/planningRules.js';

// Called only by the authenticated editor with its existing admin catalog.
// This is advisory and never changes quantities, prices or the cart allocation.
export function getOperationalCapacityWarnings({ items = [], products = [], duration = 4 } = {}) {
  const byId = new Map(products.map((product) => [String(product.id), product]));
  const operationalItems = items.flatMap((item) => {
    const product = byId.get(String(item.id));
    return product ? [{ ...product, quantity: Number(item.quantity) || 0 }] : [];
  });
  return calculateCarts({ items: operationalItems, serviceHours: duration }).groups
    .filter((group) => group.withinPlannedCapacity === false)
    .map((group) => ({
      group: group.operationalGroup,
      usagePercent: Math.round(group.capacityUsage * 100),
      loadHours: Math.round(group.totalLoadInHours * 100) / 100,
      serviceHours: Math.max(4, Number(duration) || 4),
    }));
}

import {
  calculateCarts,
  calculateDisposables,
  calculateInvestment,
  calculatePreparers,
  calculateWaiters,
} from "../../src/planner/planning-book/engine/planningRules.js";
import { R4_PRODUCTION_VERSIONS } from "../../src/planner/planning-book/engine/r4ProductionRecommendation.js";
import { productCatalogById } from "../../src/planner/planning-book/engine/productCatalog.js";

const MAX_ITEM_QUANTITY = 100_000;
const TACHO_CATEGORY = "Brigadeiro no tacho";

function roundMoney(value) {
  return Math.round((Number(value) || 0) * 100) / 100;
}

function normalizeQuantity(value, product) {
  const quantity = Number(value);
  if (!Number.isFinite(quantity) || quantity <= 0 || quantity > MAX_ITEM_QUANTITY) {
    throw new Error(`admin_quote_revision_invalid_quantity:${product.id}`);
  }
  const lot = Math.max(Number(product.lotSize) || 1, Number.EPSILON);
  if (Math.abs(quantity / lot - Math.round(quantity / lot)) > 1e-9) {
    throw new Error(`admin_quote_revision_invalid_lot:${product.id}`);
  }
  return quantity;
}

function tachoAwareCarts({ items, serviceHours }) {
  const baseItems = items.filter((item) => item.commercialCategory !== TACHO_CATEGORY);
  const tachoItems = items.filter((item) => item.commercialCategory === TACHO_CATEGORY);
  const base = calculateCarts({ items: baseItems, serviceHours });
  if (tachoItems.length === 0) return base;
  if (tachoItems.length > 1) throw new Error("admin_quote_revision_tacho_single_option_required");

  const hasBeverageCart = baseItems.some(
    (item) => item.quantity > 0 && (item.operationalGroup === "beverages" || item.consignment),
  );
  if (hasBeverageCart) {
    return {
      ...base,
      groups: (base.groups || []).map((group) => (
        group.operationalGroup === "beverages"
          ? { ...group, sharedOperationalGroups: ["beverages", "tacho"] }
          : group
      )),
      tachoCartRule: "shared-with-beverages",
    };
  }

  const maximumAvailable = Number(base.maximumAvailable || 3);
  if (Number(base.totalCarts || 0) >= maximumAvailable) {
    throw new Error("admin_quote_revision_tacho_cart_capacity_exceeded");
  }
  const totalCarts = Number(base.totalCarts || 0) + 1;
  return {
    ...base,
    totalCarts,
    groups: [
      ...(base.groups || []),
      {
        operationalGroup: "tacho",
        items: tachoItems,
        totalLoadInHours: 0,
        cartsRequired: 1,
        capacityUsage: 0,
        withinPlannedCapacity: true,
      },
    ],
    reachedMaximum: totalCarts === maximumAvailable,
    tachoCartRule: "exclusive-without-beverages",
  };
}

export function rebuildAdminEffectiveSnapshot({
  baseSnapshot,
  requestedItems,
  includeWaiters,
  includeDisposables,
  productCatalog,
  now = new Date(),
} = {}) {
  if (!baseSnapshot || typeof baseSnapshot !== "object") {
    throw new Error("admin_quote_revision_base_snapshot_required");
  }
  if (!Array.isArray(requestedItems) || requestedItems.length === 0) {
    throw new Error("admin_quote_revision_items_required");
  }

  const catalogById = productCatalogById(productCatalog);
  const previousById = new Map(
    (Array.isArray(baseSnapshot.items) ? baseSnapshot.items : []).map((item) => [String(item.id), item]),
  );
  const seen = new Set();
  const items = requestedItems.map((requested) => {
    const id = String(requested?.id || "").trim();
    if (!id || seen.has(id)) throw new Error("admin_quote_revision_duplicate_or_missing_product");
    seen.add(id);

    const catalogProduct = catalogById.get(id);
    const previous = previousById.get(id);
    if (!catalogProduct && !previous) throw new Error(`admin_quote_revision_unknown_product:${id}`);
    if (!previous && !catalogProduct?.active) throw new Error(`admin_quote_revision_inactive_new_product:${id}`);

    const product = catalogProduct || previous;
    const quantity = normalizeQuantity(requested.quantity, product);
    if (product.commercialCategory === TACHO_CATEGORY) {
      if (Number(product.portionGrams) !== 80 || String(product.priceUnit) !== "portion80g") {
        throw new Error("admin_quote_revision_tacho_portion_contract_invalid");
      }
    }

    const unitPrice = previous && Number.isFinite(Number(previous.unitPrice))
      ? Number(previous.unitPrice)
      : Number(product.unitPrice || 0);

    return {
      ...product,
      unitPrice,
      quantity,
      estimatedValue: product.consignment ? 0 : roundMoney(quantity * unitPrice),
    };
  });

  const adults = Math.max(0, Number(baseSnapshot.adults) || 0);
  const olderChildren = Math.max(0, Number(baseSnapshot.olderChildren) || 0);
  const children = Math.max(0, Number(baseSnapshot.children) || 0);
  const realGuests = adults + olderChildren + children;
  const equivalentGuests = adults + olderChildren + children * 0.35;
  const duration = Math.max(4, Number(baseSnapshot.duration) || 4);

  const carts = tachoAwareCarts({ items, serviceHours: duration });
  const preparers = calculatePreparers(carts.totalCarts);
  const waiters = calculateWaiters({ realGuests, includeWaiters: Boolean(includeWaiters) });
  const disposables = calculateDisposables({
    equivalentGuests,
    includeDisposables: Boolean(includeDisposables),
  });
  const investment = calculateInvestment({
    items,
    totalCarts: carts.totalCarts,
    serviceHours: duration,
    waiters,
    disposables,
  });

  return Object.freeze({
    ...baseSnapshot,
    schemaVersion: Math.max(4, Number(baseSnapshot.schemaVersion) || 0),
    adminValidatedAt: new Date(now).toISOString(),
    versions: { ...R4_PRODUCTION_VERSIONS },
    adults,
    olderChildren,
    children,
    realGuests,
    equivalentGuests,
    duration,
    includeDisposables: Boolean(includeDisposables),
    totalCarts: carts.totalCarts,
    preparers,
    waiters: waiters.quantity,
    items: items.map((item) => ({
      id: item.id,
      name: item.name,
      commercialCategory: item.commercialCategory,
      operationalGroup: item.operationalGroup,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      lotSize: item.lotSize,
      productionPerHour: item.productionPerHour,
      priceUnit: item.priceUnit || "unit",
      portionGrams: item.portionGrams ?? null,
      consignment: Boolean(item.consignment),
      estimatedValue: item.estimatedValue,
    })),
    investment,
    investmentTotal: roundMoney(investment.total),
    consignmentTotal: roundMoney(investment.ledger.totals.consignmentEstimate),
    commercialLedger: investment.ledger,
    commercialReconciliation: investment.reconciliation,
    adminOperational: {
      carts,
      preparers,
      waiters,
      disposables,
    },
  });
}

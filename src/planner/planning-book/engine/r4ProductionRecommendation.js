/* =========================================================
   RODA FESTA - RF-REC-2 R4 PRODUCTION ADAPTER

   Authoritative recommendation adapter for PlanningBook and PlanningSession.
   It promotes the validated R4 demand, SKU allocation and RF-COM-1 commercial
   composition as one fail-closed suggestion boundary.
   ========================================================= */

import {
  PRODUCTS,
  calculateInvestment,
  calculatePreparers,
  evaluateSuggestion,
} from "./planningRules.js";
import { generateR4ShadowRecommendation } from "./shadowRecommendationR4.js";
import { allocateR4ShadowSkus } from "./shadowR4SkuAllocation.js";
import { buildR4ShadowCommercialPreview } from "./shadowR4CommercialPreview.js";

export const R4_PRODUCTION_VERSIONS = Object.freeze({
  recommendation: "RF-REC-2.1.0",
  parameters: "RF-PARAM-2.0.0-r4-elicited-2026-08-29",
  commercialRules: "RF-COM-1.0.0",
  priceBook: "RF-PRICE-2026-08-24",
});

export const R4_PRODUCTION_POLICY = Object.freeze({
  id: "RF-REC-2-PRODUCTION-ADAPTER-2",
  authoritative: true,
  failClosed: true,
  ageResolution: "legacy3",
  youngChildFactor: 0.35,
  skuStrategy: "equal-share-lot-aware-minimum-overage-provisional",
  tachoPolicy: "80g-per-equivalent-guest-one-flavor-option-shares-beverage-cart",
});

const TACHO_CATEGORY = "Brigadeiro no tacho";
const TACHO_PORTION_GRAMS = 80;

function normalizeCatalog(productCatalog) {
  if (Array.isArray(productCatalog)) return productCatalog;
  if (productCatalog && typeof productCatalog === "object") return Object.values(productCatalog);
  return Object.values(PRODUCTS);
}

function unique(values) {
  return [...new Set(values.map(String))];
}

function buildTachoItems({ tachoIds, equivalentGuests, byId }) {
  if (tachoIds.length === 0) return [];
  if (tachoIds.length > 1) {
    throw new Error("r4_production_tacho_requires_single_option");
  }

  const product = byId.get(tachoIds[0]);
  if (!product?.active || product.commercialCategory !== TACHO_CATEGORY) {
    throw new Error(`r4_production_unknown_product:${tachoIds[0]}`);
  }
  if (Number(product.portionGrams) !== TACHO_PORTION_GRAMS
      || String(product.priceUnit || "") !== "portion80g") {
    throw new Error("r4_production_tacho_portion_contract_invalid");
  }

  const quantity = Math.max(1, Math.ceil(Number(equivalentGuests) || 0));
  const estimatedValue = Math.round(quantity * Number(product.unitPrice || 0) * 100) / 100;
  return [{
    ...product,
    quantity,
    estimatedValue,
    r4ProductionSource: "tacho-80g-per-equivalent-guest",
  }];
}

function composeTachoCarts({ baseCarts, hasTacho, hasBeverageCart }) {
  if (!hasTacho) return baseCarts;

  if (hasBeverageCart) {
    return {
      ...baseCarts,
      groups: (baseCarts.groups || []).map((group) => (
        group.operationalGroup === "beverages"
          ? { ...group, sharedOperationalGroups: ["beverages", "tacho"] }
          : group
      )),
      tachoCartRule: "shared-with-beverages",
    };
  }

  const maximumAvailable = Number(baseCarts.maximumAvailable || 3);
  if (Number(baseCarts.totalCarts || 0) >= maximumAvailable) {
    throw new Error("r4_production_tacho_cart_capacity_exceeded");
  }

  const groups = [
    ...(baseCarts.groups || []),
    {
      operationalGroup: "tacho",
      items: [],
      totalLoadInHours: 0,
      cartsRequired: 1,
      capacityUsage: 0,
      withinPlannedCapacity: true,
    },
  ];
  const totalCarts = Number(baseCarts.totalCarts || 0) + 1;
  return {
    ...baseCarts,
    groups,
    totalCarts,
    reachedMaximum: totalCarts === maximumAvailable,
    tachoCartRule: "exclusive-without-beverages",
  };
}

export function generateR4ProductionSuggestion({
  adults = 0,
  olderChildren = 0,
  children = 0,
  serviceHours = 4,
  selectedProductIds = [],
  includeWaiters = false,
  includeDisposables = false,
  includeBeverages = false,
  productCatalog = Object.values(PRODUCTS),
} = {}) {
  const catalog = normalizeCatalog(productCatalog);
  const byId = new Map(catalog.map((product) => [String(product.id), product]));
  const selectedIds = unique(selectedProductIds);

  if (selectedIds.length === 0) {
    throw new Error("r4_production_requires_product_selection");
  }

  for (const id of selectedIds) {
    const product = byId.get(id);
    if (!product?.active) throw new Error(`r4_production_unknown_product:${id}`);
  }

  const tachoIds = selectedIds.filter(
    (id) => byId.get(id)?.commercialCategory === TACHO_CATEGORY,
  );
  const beverageIds = selectedIds.filter((id) => {
    const product = byId.get(id);
    return product && (product.commercialCategory === "Bebidas" || product.consignment);
  });
  const solidIds = selectedIds.filter((id) => {
    const product = byId.get(id);
    return product
      && product.commercialCategory !== "Bebidas"
      && product.commercialCategory !== TACHO_CATEGORY
      && !product.consignment;
  });
  const coreSelectedIds = [...solidIds, ...beverageIds];
  const solidCategories = unique(
    solidIds.map((id) => byId.get(id)?.commercialCategory).filter(Boolean)
  );
  const effectiveIncludeBeverages = Boolean(includeBeverages || beverageIds.length > 0);
  const selectedCategories = effectiveIncludeBeverages
    ? [...solidCategories, "Bebidas"]
    : solidCategories;

  const flavorCounts = {
    Tortas: Math.max(1, solidIds.filter((id) => byId.get(id)?.commercialCategory === "Tortas").length),
    Bolos: Math.max(1, solidIds.filter((id) => byId.get(id)?.commercialCategory === "Bolos").length),
  };

  const recommendation = generateR4ShadowRecommendation({
    ageResolution: "legacy3",
    adults,
    olderChildren,
    children,
    serviceHours,
    selectedProductIds: coreSelectedIds,
    selectedCategories,
    externalCategories: [],
    productCatalog: catalog,
    flavorCounts,
    includeBeverages: effectiveIncludeBeverages,
  });

  if (recommendation?.solids?.duration?.clamped) {
    throw new Error("r4_production_service_hours_outside_validated_domain");
  }

  const skuAllocation = allocateR4ShadowSkus({
    recommendation,
    selectedProductIds: solidIds,
    productCatalog: catalog,
  });

  const unresolvedSkuCategories = (skuAllocation.categories || []).filter(
    (category) => category.status !== "allocated-preview"
  );
  if (unresolvedSkuCategories.length > 0) {
    throw new Error(
      `r4_production_sku_allocation_incomplete:${unresolvedSkuCategories.map((item) => item.category).join(",")}`
    );
  }

  const commercial = buildR4ShadowCommercialPreview({
    recommendation,
    skuAllocation,
    selectedBeverageProductIds: effectiveIncludeBeverages ? beverageIds : [],
    productCatalog: catalog,
    serviceHours,
    includeWaiters,
    includeDisposables,
  });

  if (!commercial.complete) {
    throw new Error(
      `r4_production_commercial_incomplete:${(commercial.unresolved || []).map((item) => item.reason).join(",")}`
    );
  }
  if (!commercial.investment?.reconciliation?.ok) {
    throw new Error("r4_production_commercial_reconciliation_failed");
  }

  const equivalentGuests = Number(recommendation?.guests?.planningGuests || 0);
  const realGuests = Number(recommendation?.guests?.realGuests || 0);
  const tachoItems = buildTachoItems({ tachoIds, equivalentGuests, byId });
  const items = [...commercial.items.map((item) => ({ ...item })), ...tachoItems];
  const carts = composeTachoCarts({
    baseCarts: commercial.carts,
    hasTacho: tachoItems.length > 0,
    hasBeverageCart: beverageIds.length > 0,
  });
  const preparers = calculatePreparers(carts.totalCarts);
  const investment = calculateInvestment({
    items,
    totalCarts: carts.totalCarts,
    serviceHours,
    waiters: commercial.waiters,
    disposables: commercial.disposables,
  });
  if (!investment?.reconciliation?.ok) {
    throw new Error("r4_production_commercial_reconciliation_failed");
  }

  const evaluation = evaluateSuggestion({
    equivalentGuests,
    items,
    totalCarts: carts.totalCarts,
  });

  return {
    versions: { ...R4_PRODUCTION_VERSIONS },
    policy: { ...R4_PRODUCTION_POLICY },
    guests: {
      realGuests,
      equivalentGuests,
      adults: Math.max(0, Number(adults) || 0),
      olderChildren: Math.max(0, Number(olderChildren) || 0),
      children: Math.max(0, Number(children) || 0),
      ageResolution: recommendation?.guests?.ageResolution || "legacy3",
    },
    items,
    carts,
    preparers,
    waiters: commercial.waiters,
    disposables: commercial.disposables,
    investment,
    evaluation,
    recommendationMeta: {
      engine: R4_PRODUCTION_POLICY.id,
      petiscoGateResult: recommendation?.parameters?.petiscoGateResult || null,
      lambdaIn: recommendation?.parameters?.lambdaIn ?? null,
      skuPolicy: skuAllocation?.policy?.id || null,
      tacho: tachoItems.length > 0
        ? {
          productId: tachoItems[0].id,
          portionGrams: TACHO_PORTION_GRAMS,
          quantity: tachoItems[0].quantity,
          cartRule: carts.tachoCartRule,
        }
        : null,
    },
  };
}

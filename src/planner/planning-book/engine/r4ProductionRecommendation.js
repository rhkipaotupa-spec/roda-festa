/* =========================================================
   RODA FESTA - RF-REC-2 R4 PRODUCTION ADAPTER

   Authoritative recommendation adapter for PlanningBook and PlanningSession.
   It promotes the validated R4 demand, SKU allocation and RF-COM-1 commercial
   composition as one fail-closed suggestion boundary.
   ========================================================= */

import {
  PRODUCTS,
  evaluateSuggestion,
} from "./planningRules.js";
import { generateR4ShadowRecommendation } from "./shadowRecommendationR4.js";
import { allocateR4ShadowSkus } from "./shadowR4SkuAllocation.js";
import { buildR4ShadowCommercialPreview } from "./shadowR4CommercialPreview.js";

export const R4_PRODUCTION_VERSIONS = Object.freeze({
  recommendation: "RF-REC-2.0.0",
  parameters: "RF-PARAM-2.0.0-r4-elicited-2026-08-29",
  commercialRules: "RF-COM-1.0.0",
  priceBook: "RF-PRICE-2026-08-24",
});

export const R4_PRODUCTION_POLICY = Object.freeze({
  id: "RF-REC-2-PRODUCTION-ADAPTER-1",
  authoritative: true,
  failClosed: true,
  ageResolution: "legacy3",
  youngChildFactor: 0.35,
  skuStrategy: "equal-share-lot-aware-minimum-overage-provisional",
});

function normalizeCatalog(productCatalog) {
  if (Array.isArray(productCatalog)) return productCatalog;
  if (productCatalog && typeof productCatalog === "object") return Object.values(productCatalog);
  return Object.values(PRODUCTS);
}

function unique(values) {
  return [...new Set(values.map(String))];
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

  const solidIds = selectedIds.filter((id) => {
    const product = byId.get(id);
    return product && product.commercialCategory !== "Bebidas" && !product.consignment;
  });
  const beverageIds = selectedIds.filter((id) => {
    const product = byId.get(id);
    return product && (product.commercialCategory === "Bebidas" || product.consignment);
  });
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
    selectedProductIds: selectedIds,
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
  const items = commercial.items.map((item) => ({ ...item }));
  const evaluation = evaluateSuggestion({
    equivalentGuests,
    items,
    totalCarts: commercial.carts.totalCarts,
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
    carts: commercial.carts,
    preparers: commercial.preparers,
    waiters: commercial.waiters,
    disposables: commercial.disposables,
    investment: commercial.investment,
    evaluation,
    recommendationMeta: {
      engine: R4_PRODUCTION_POLICY.id,
      petiscoGateResult: recommendation?.parameters?.petiscoGateResult || null,
      lambdaIn: recommendation?.parameters?.lambdaIn ?? null,
      skuPolicy: skuAllocation?.policy?.id || null,
    },
  };
}

/* =========================================================
   RODA FESTA - R4 SHADOW COMMERCIAL PREVIEW

   Preview-only / non-authoritative.
   - Reuses RF-COM-1.0.0 commercial rules.
   - Consumes R4 category demand + preview SKU allocation.
   - Does not persist, finalize, generate a proposal, or mutate Production.
   - Beverage package volumes are accepted only from an explicit, audited
     preview allowlist. No package volume is inferred from price or product name.
   ========================================================= */

import {
  ENGINE_VERSIONS,
  calculateCarts,
  calculateDisposables,
  calculateInvestment,
  calculatePreparers,
  calculateWaiters,
} from "./planningRules.js";

export const R4_BEVERAGE_PACKAGE_VOLUME_ML = Object.freeze({
  "agua-mineral": 300,
});

export const R4_BEVERAGE_PACKAGE_VOLUME_EVIDENCE = Object.freeze({
  "agua-mineral": "operator-confirmed-2026-08-29",
});

export const R4_COMMERCIAL_PREVIEW_POLICY = Object.freeze({
  id: "RF-COM-PREVIEW-R4-2",
  mode: "shadow-preview",
  authoritative: false,
  productionMutationAllowed: false,
  commercialRules: ENGINE_VERSIONS.commercialRules,
  priceBook: ENGINE_VERSIONS.priceBook,
  missingDataPolicy: "explicit-package-volume-allowlist-never-infer",
});

function normalizeCatalog(productCatalog = []) {
  if (Array.isArray(productCatalog)) return productCatalog;
  if (productCatalog && typeof productCatalog === "object") return Object.values(productCatalog);
  return [];
}

function money(value) {
  return Math.round((Number(value) || 0) * 100) / 100;
}

function buildSolidItems({ skuAllocation, byId }) {
  const items = [];
  const unresolved = [];

  for (const category of skuAllocation?.categories || []) {
    if (category.status !== "allocated-preview") {
      unresolved.push({
        category: category.category,
        reason: "sku_allocation_pending",
      });
      continue;
    }

    for (const allocated of category.items || []) {
      const product = byId.get(String(allocated.id));
      if (!product) {
        unresolved.push({
          category: category.category,
          productId: allocated.id,
          reason: "product_missing_from_catalog",
        });
        continue;
      }

      items.push({
        ...product,
        quantity: Number(allocated.quantity) || 0,
        estimatedValue: product.consignment
          ? 0
          : (Number(allocated.quantity) || 0) * Number(product.unitPrice || 0),
        r4PreviewSource: "solid-sku-allocation",
      });
    }
  }

  return { items, unresolved };
}

function buildBeverageItems({ recommendation, selectedBeverageProductIds, byId }) {
  const pricedItems = [];
  const cartPresenceItems = [];
  const unresolved = [];

  for (const productId of selectedBeverageProductIds || []) {
    const id = String(productId);
    const product = byId.get(id);
    if (!product) {
      unresolved.push({ productId: id, reason: "product_missing_from_catalog" });
      continue;
    }

    const stock = recommendation?.beverages?.stockToTakeBySku?.[id];
    const stockMl = Number(stock?.ml || 0);
    const modelRoundedUnits = Number(stock?.roundedUnitsToCurrentLot);
    const hasModelResolvedUnits = Number.isFinite(modelRoundedUnits) && modelRoundedUnits > 0;
    const previewPackageVolumeMl = Number(R4_BEVERAGE_PACKAGE_VOLUME_ML[id] || 0);
    const lotSize = Math.max(1, Number(product.lotSize || 1));
    const previewRoundedUnits =
      !hasModelResolvedUnits && previewPackageVolumeMl > 0 && stockMl > 0
        ? Math.ceil(stockMl / previewPackageVolumeMl / lotSize) * lotSize
        : 0;
    const resolvedUnits = hasModelResolvedUnits ? modelRoundedUnits : previewRoundedUnits;

    if (resolvedUnits > 0) {
      const item = {
        ...product,
        quantity: resolvedUnits,
        estimatedValue: 0,
        r4PreviewSource: hasModelResolvedUnits
          ? "beverage-stock-rounded-units"
          : "beverage-preview-confirmed-package-volume",
        r4PreviewPackageVolumeMl: hasModelResolvedUnits ? Number(stock?.volumePerUnitMl || 0) : previewPackageVolumeMl,
        r4PreviewPackageVolumeEvidence: hasModelResolvedUnits
          ? "r4-beverage-model"
          : R4_BEVERAGE_PACKAGE_VOLUME_EVIDENCE[id] || "preview-allowlist",
      };
      pricedItems.push(item);
      cartPresenceItems.push(item);
      continue;
    }

    // Structure still knows a selected beverage category exists. We can safely
    // represent presence for cart counting, but we do not price this placeholder.
    cartPresenceItems.push({
      ...product,
      quantity: 1,
      estimatedValue: 0,
      r4PreviewSource: "beverage-structure-presence-only",
      previewStructureOnly: true,
    });

    unresolved.push({
      productId: id,
      name: product.name || id,
      reason: "missing_confirmed_beverage_package_volume",
      stockToTakeMl: stockMl,
      unitPrice: Number(product.unitPrice || 0),
      lotSize,
    });
  }

  return { pricedItems, cartPresenceItems, unresolved };
}

export function buildR4ShadowCommercialPreview({
  recommendation,
  skuAllocation,
  selectedBeverageProductIds = [],
  productCatalog = [],
  serviceHours = 4,
  includeWaiters = false,
  includeDisposables = false,
} = {}) {
  const catalog = normalizeCatalog(productCatalog);
  const byId = new Map(catalog.map((product) => [String(product.id), product]));

  const solids = buildSolidItems({ skuAllocation, byId });
  const beverages = buildBeverageItems({
    recommendation,
    selectedBeverageProductIds,
    byId,
  });

  const pricedItems = [...solids.items, ...beverages.pricedItems];
  const cartItems = [...solids.items, ...beverages.cartPresenceItems];

  const carts = calculateCarts({ items: cartItems, serviceHours });
  const preparers = calculatePreparers(carts.totalCarts);
  const waiters = calculateWaiters({
    realGuests: Number(recommendation?.guests?.realGuests || 0),
    includeWaiters,
  });
  const disposables = calculateDisposables({
    equivalentGuests: Number(recommendation?.guests?.planningGuests || 0),
    includeDisposables,
  });
  const investment = calculateInvestment({
    items: pricedItems,
    totalCarts: carts.totalCarts,
    serviceHours,
    waiters,
    disposables,
  });

  const unresolved = [...solids.unresolved, ...beverages.unresolved];
  const contractedTotal = money(investment.total);
  const knownConsignmentEstimate = money(investment.ledger.totals.consignmentEstimate);
  const knownGeneralEstimate = money(contractedTotal + knownConsignmentEstimate);
  const realGuests = Number(recommendation?.guests?.realGuests || 0);

  return {
    mode: R4_COMMERCIAL_PREVIEW_POLICY.mode,
    authoritative: false,
    productionMutationAllowed: false,
    policy: { ...R4_COMMERCIAL_PREVIEW_POLICY },
    versions: {
      recommendation: recommendation?.versions?.recommendation || null,
      commercialRules: ENGINE_VERSIONS.commercialRules,
      priceBook: ENGINE_VERSIONS.priceBook,
    },
    complete: unresolved.length === 0,
    unresolved,
    items: pricedItems,
    carts,
    preparers,
    waiters,
    disposables,
    investment,
    totals: {
      contractedTotal,
      knownConsignmentEstimate,
      knownGeneralEstimate,
      contractedPerRealGuest: realGuests > 0 ? money(contractedTotal / realGuests) : 0,
      knownGeneralPerRealGuest: realGuests > 0 ? money(knownGeneralEstimate / realGuests) : 0,
      generalEstimateComplete: unresolved.length === 0,
    },
  };
}

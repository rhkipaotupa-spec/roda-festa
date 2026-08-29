import assert from "node:assert/strict";
import test from "node:test";

import { PRODUCTS } from "../src/planner/planning-book/engine/planningRules.js";
import { generateR4ShadowRecommendation } from "../src/planner/planning-book/engine/shadowRecommendationR4.js";
import { allocateR4ShadowSkus } from "../src/planner/planning-book/engine/shadowR4SkuAllocation.js";
import {
  R4_BEVERAGE_PACKAGE_VOLUME_EVIDENCE,
  R4_BEVERAGE_PACKAGE_VOLUME_ML,
  R4_COMMERCIAL_PREVIEW_POLICY,
  buildR4ShadowCommercialPreview,
} from "../src/planner/planning-book/engine/shadowR4CommercialPreview.js";

const catalog = Object.values(PRODUCTS);
const selectedSolidProductIds = [
  "coxinha-frango-catupiry",
  "bolinha-queijo",
  "pastel-queijo",
  "mini-x-burguer",
  "torta-frango-catupiry",
  "brigadeiro-chocolate",
  "bolo-beatriz",
];
const beverages = ["agua-mineral", "suco-laranja-200ml", "refrigerante-200ml"];

function buildScenario({ selectedBeverages = beverages } = {}) {
  const recommendation = generateR4ShadowRecommendation({
    adults: 55,
    olderChildren: 15,
    children: 0,
    serviceHours: 4,
    selectedCategories: ["Petiscos", "Mini lanches", "Tortas", "Doces", "Bolos", ...(selectedBeverages.length ? ["Bebidas"] : [])],
    selectedProductIds: [...selectedSolidProductIds, ...selectedBeverages],
    productCatalog: catalog,
    flavorCounts: { Tortas: 1, Bolos: 1 },
    includeBeverages: selectedBeverages.length > 0,
  });
  const skuAllocation = allocateR4ShadowSkus({
    recommendation,
    selectedProductIds: selectedSolidProductIds,
    productCatalog: catalog,
  });
  return { recommendation, skuAllocation };
}

test("commercial preview reuses RF-COM-1 without becoming authoritative", () => {
  const { recommendation, skuAllocation } = buildScenario({ selectedBeverages: [] });
  const preview = buildR4ShadowCommercialPreview({
    recommendation,
    skuAllocation,
    selectedBeverageProductIds: [],
    productCatalog: catalog,
    serviceHours: 4,
    includeWaiters: true,
    includeDisposables: true,
  });

  assert.equal(preview.authoritative, false);
  assert.equal(preview.productionMutationAllowed, false);
  assert.equal(preview.policy.id, R4_COMMERCIAL_PREVIEW_POLICY.id);
  assert.equal(preview.versions.commercialRules, "RF-COM-1.0.0");
  assert.equal(preview.carts.totalCarts, 2);
  assert.equal(preview.waiters.quantity, 4);
  assert.equal(preview.disposables.value, 630);
  assert.equal(preview.totals.contractedTotal, 5589.5);
  assert.equal(preview.totals.knownConsignmentEstimate, 0);
  assert.equal(preview.complete, true);
});

test("70-person PDF comparison closes water consignment only from confirmed 300ml package volume", () => {
  const { recommendation, skuAllocation } = buildScenario();
  const preview = buildR4ShadowCommercialPreview({
    recommendation,
    skuAllocation,
    selectedBeverageProductIds: beverages,
    productCatalog: catalog,
    serviceHours: 4,
    includeWaiters: true,
    includeDisposables: true,
  });

  const waterItem = preview.items.find((item) => item.id === "agua-mineral");
  const waterLine = preview.investment.ledger.consignmentLines.find(
    (line) => line.productId === "agua-mineral"
  );

  assert.equal(R4_BEVERAGE_PACKAGE_VOLUME_ML["agua-mineral"], 300);
  assert.equal(
    R4_BEVERAGE_PACKAGE_VOLUME_EVIDENCE["agua-mineral"],
    "operator-confirmed-2026-08-29"
  );
  assert.equal(preview.policy.id, "RF-COM-PREVIEW-R4-2");
  assert.equal(preview.carts.totalCarts, 3);
  assert.equal(waterItem.quantity, 90);
  assert.equal(waterItem.r4PreviewPackageVolumeMl, 300);
  assert.equal(waterItem.r4PreviewPackageVolumeEvidence, "operator-confirmed-2026-08-29");
  assert.equal(waterLine.quantity, 90);
  assert.equal(waterLine.unitPrice, 2.5);
  assert.equal(waterLine.subtotal, 225);
  assert.equal(preview.totals.contractedTotal, 5889.5);
  assert.equal(preview.totals.knownConsignmentEstimate, 1180);
  assert.equal(preview.totals.knownGeneralEstimate, 7069.5);
  assert.equal(preview.totals.knownGeneralPerRealGuest, 100.99);
  assert.equal(preview.totals.generalEstimateComplete, true);
  assert.equal(preview.complete, true);
  assert.deepEqual(preview.unresolved, []);
});

test("water-only selection uses confirmed 300ml package volume and keeps beverage cart", () => {
  const { recommendation, skuAllocation } = buildScenario({ selectedBeverages: ["agua-mineral"] });
  const preview = buildR4ShadowCommercialPreview({
    recommendation,
    skuAllocation,
    selectedBeverageProductIds: ["agua-mineral"],
    productCatalog: catalog,
    serviceHours: 4,
  });

  const waterLine = preview.investment.ledger.consignmentLines.find(
    (line) => line.productId === "agua-mineral"
  );

  assert.equal(preview.carts.totalCarts, 3);
  assert.equal(waterLine.quantity, 90);
  assert.equal(waterLine.subtotal, 225);
  assert.equal(preview.totals.knownConsignmentEstimate, 225);
  assert.equal(preview.totals.generalEstimateComplete, true);
  assert.equal(preview.complete, true);
  assert.deepEqual(preview.unresolved, []);
});

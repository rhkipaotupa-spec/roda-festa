import test from "node:test";
import assert from "node:assert/strict";

import {
  SHADOW_ENGINE_VERSIONS,
  SHADOW_PARAMETERS,
  calculateShadowDurationFactor,
  calculateShadowPlanningGuests,
  calculateShadowSelectionMultiplier,
  generateShadowRecommendation,
} from "../src/planner/planning-book/engine/shadowRecommendationV2.js";

const PRODUCT_CATALOG = [
  { id: "pastel-carne", commercialCategory: "Petiscos", lotSize: 10, unitPrice: 1.5 },
  { id: "mini-x-burguer", commercialCategory: "Mini lanches", lotSize: 5, unitPrice: 6 },
  { id: "torta-strogonoff-frango", commercialCategory: "Tortas", lotSize: 1, unitPrice: 7 },
  { id: "brigadeiro-chocolate", commercialCategory: "Doces", lotSize: 10, unitPrice: 3 },
  { id: "bolo-beatriz", commercialCategory: "Bolos", lotSize: 1, unitPrice: 10.8 },
  { id: "agua-mineral", commercialCategory: "Bebidas", lotSize: 10, unitPrice: 2.5, consignment: true },
  { id: "suco-laranja-200ml", commercialCategory: "Bebidas", lotSize: 10, unitPrice: 6, consignment: true },
  { id: "refrigerante-200ml", commercialCategory: "Bebidas", lotSize: 10, unitPrice: 2.5, consignment: true },
];

const FULL_MENU_IDS = [
  "pastel-carne",
  "mini-x-burguer",
  "torta-strogonoff-frango",
  "brigadeiro-chocolate",
  "bolo-beatriz",
];

function category(result, name) {
  return result.solids.categories.find((item) => item.category === name);
}

test("R3 version isolation keeps commercial rules on RF-COM-1.0.0", () => {
  assert.equal(
    SHADOW_ENGINE_VERSIONS.recommendation,
    "RF-REC-2.0.0-alpha-shadow-pregram-r3"
  );
  assert.equal(SHADOW_ENGINE_VERSIONS.commercialRules, "RF-COM-1.0.0");
  assert.equal(SHADOW_ENGINE_VERSIONS.compatibility, "RF-COMPAT-1.0.0");
  assert.equal(SHADOW_PARAMETERS.additionalSolidServiceBuffer, 0);
  assert.equal(
    SHADOW_PARAMETERS.solidBaselineSemantics,
    "conservative-planning-target"
  );
});

test("elicited lambda still reproduces approximately 11 petiscos/person when petiscos is the only solid category", () => {
  const multiplier = calculateShadowSelectionMultiplier(["Petiscos"]).multiplier;
  const impliedPerPerson = 6.5 * multiplier;
  assert.ok(Math.abs(impliedPerPerson - 11) < 0.02, `got ${impliedPerPerson}`);
  assert.ok(SHADOW_PARAMETERS.lambda > 0.45 && SHADOW_PARAMETERS.lambda < 0.47);
});

test("full menu 60 adults 4h uses elicited values directly as conservative planning targets", () => {
  const result = generateShadowRecommendation({
    adults: 60,
    serviceHours: 4,
    selectedProductIds: FULL_MENU_IDS,
    productCatalog: PRODUCT_CATALOG,
  });

  assert.equal(result.guests.planningGuests, 60);
  assert.equal(result.selection.selectedWeight, 1);
  assert.equal(result.selection.substitutionMultiplier, 1);

  assert.equal(category(result, "Petiscos").plannedNaturalQuantity, 390);
  assert.equal(category(result, "Mini lanches").plannedNaturalQuantity, 120);
  assert.equal(category(result, "Tortas").plannedNaturalQuantity, 4200);
  assert.equal(category(result, "Doces").plannedNaturalQuantity, 300);
  assert.equal(category(result, "Bolos").plannedNaturalQuantity, 7200);

  assert.equal(category(result, "Petiscos").plannedRoundedCategoryQuantity, 390);
  assert.equal(category(result, "Doces").plannedRoundedCategoryQuantity, 300);
  assert.equal(category(result, "Petiscos").additionalServiceBuffer, 0);
});

test("duration curve remains 1.0 at 4h, 1.2 at 6h and 1.4 at 8h", () => {
  assert.equal(calculateShadowDurationFactor(4).factor, 1);
  assert.equal(calculateShadowDurationFactor(6).factor, 1.2);
  assert.equal(calculateShadowDurationFactor(8).factor, 1.4);
});

test("60 adults 4h only Petiscos plans exactly 660 without a second 10% solid buffer", () => {
  const result = generateShadowRecommendation({
    adults: 60,
    serviceHours: 4,
    selectedCategories: ["Petiscos"],
  });

  assert.equal(category(result, "Petiscos").plannedNaturalQuantity, 660);
  assert.equal(category(result, "Petiscos").plannedRoundedCategoryQuantity, 660);
  assert.equal(result.selection.substitutionMultiplier, 1.692308);
});

test("adding a solid category reduces the planning quantity of an existing category when lambda > 0", () => {
  const onlyPetiscos = generateShadowRecommendation({
    adults: 60,
    serviceHours: 4,
    selectedCategories: ["Petiscos"],
  });
  const petiscosAndMini = generateShadowRecommendation({
    adults: 60,
    serviceHours: 4,
    selectedCategories: ["Petiscos", "Mini lanches"],
  });

  assert.ok(
    category(petiscosAndMini, "Petiscos").plannedNaturalQuantity <
      category(onlyPetiscos, "Petiscos").plannedNaturalQuantity
  );
});

test("selection remains invariant to category order", () => {
  const a = generateShadowRecommendation({
    adults: 60,
    selectedCategories: ["Petiscos", "Mini lanches", "Tortas"],
  });
  const b = generateShadowRecommendation({
    adults: 60,
    selectedCategories: ["Tortas", "Petiscos", "Mini lanches"],
  });

  assert.deepEqual(a.selection.selectedSolidCategories, b.selection.selectedSolidCategories);
  assert.deepEqual(a.solids.categories, b.solids.categories);
});

test("adding flavors inside the same category does not change category demand with theta=0", () => {
  const catalog = [
    ...PRODUCT_CATALOG,
    { id: "coxinha", commercialCategory: "Petiscos", lotSize: 25, unitPrice: 1.5 },
  ];

  const oneFlavor = generateShadowRecommendation({
    adults: 60,
    selectedProductIds: ["pastel-carne"],
    productCatalog: catalog,
  });
  const twoFlavors = generateShadowRecommendation({
    adults: 60,
    selectedProductIds: ["pastel-carne", "coxinha"],
    productCatalog: catalog,
  });

  assert.equal(
    category(oneFlavor, "Petiscos").plannedNaturalQuantity,
    category(twoFlavors, "Petiscos").plannedNaturalQuantity
  );
});

test("legacy3 uses 35% for 0-6 and 100% for 7+", () => {
  const guests = calculateShadowPlanningGuests({
    adults: 10,
    olderChildren: 10,
    children: 10,
  });

  assert.equal(guests.realGuests, 30);
  assert.equal(guests.planningGuests, 23.5);
  assert.equal(guests.ageResolution, "legacy3");
});

test("full5 and legacy3 remain numerically compatible under current equal paired factors", () => {
  const legacy = calculateShadowPlanningGuests({
    adults: 10,
    olderChildren: 8,
    children: 6,
  });
  const full5 = calculateShadowPlanningGuests({
    ageResolution: "full5",
    full5: {
      "0-3": 2,
      "4-6": 4,
      "7-12": 5,
      "13-17": 3,
      adult: 10,
    },
  });

  assert.equal(legacy.realGuests, full5.realGuests);
  assert.equal(legacy.planningGuests, full5.planningGuests);
});

test("60 adults 4h with all modeled beverages keeps 42L covered and 54.6L stock", () => {
  const result = generateShadowRecommendation({
    adults: 60,
    serviceHours: 4,
    selectedProductIds: [
      ...FULL_MENU_IDS,
      "agua-mineral",
      "suco-laranja-200ml",
      "refrigerante-200ml",
    ],
    productCatalog: PRODUCT_CATALOG,
  });

  assert.equal(result.beverages.referenceTotalExpectedConsumptionMl, 42000);
  assert.equal(result.beverages.expectedConsumptionMl, 42000);
  assert.equal(result.beverages.externalOrUncoveredExpectedMl, 0);
  assert.equal(result.beverages.stockToTakeMl, 54600);

  assert.equal(result.beverages.expectedConsumptionMlBySku["agua-mineral"].ml, 16800);
  assert.equal(result.beverages.expectedConsumptionMlBySku["suco-laranja-200ml"].ml, 16800);
  assert.equal(result.beverages.expectedConsumptionMlBySku["refrigerante-200ml"].ml, 8400);

  assert.equal(result.beverages.stockToTakeBySku["agua-mineral"].ml, 21840);
  assert.equal(result.beverages.stockToTakeBySku["suco-laranja-200ml"].ml, 21840);
  assert.equal(result.beverages.stockToTakeBySku["refrigerante-200ml"].ml, 10920);

  assert.equal(result.beverages.financialEstimate.complete, false);
  assert.deepEqual(result.beverages.financialEstimate.missingVolumeProductIds, ["agua-mineral"]);
});

test("selected beverage subset keeps canonical shares instead of renormalizing", () => {
  const result = generateShadowRecommendation({
    adults: 10,
    serviceHours: 4,
    selectedProductIds: ["suco-laranja-200ml", "refrigerante-200ml"],
    productCatalog: PRODUCT_CATALOG,
  });

  const juice = result.beverages.expectedConsumptionMlBySku["suco-laranja-200ml"];
  const soda = result.beverages.expectedConsumptionMlBySku["refrigerante-200ml"];

  assert.equal(result.beverages.referenceTotalExpectedConsumptionMl, 7000);
  assert.equal(juice.share, 0.4);
  assert.equal(soda.share, 0.2);
  assert.equal(result.beverages.expectedConsumptionMl, 4200);
  assert.equal(result.beverages.externalOrUncoveredExpectedMl, 2800);
  assert.equal(result.beverages.stockToTakeMl, 5460);
});

test("Laiana-like soda-only selection covers only typical 20% and leaves the rest external", () => {
  const result = generateShadowRecommendation({
    adults: 60,
    serviceHours: 4,
    selectedProductIds: ["refrigerante-200ml"],
    productCatalog: PRODUCT_CATALOG,
  });

  assert.equal(result.beverages.referenceTotalExpectedConsumptionMl, 42000);
  assert.equal(result.beverages.expectedConsumptionMl, 8400);
  assert.equal(result.beverages.externalOrUncoveredExpectedMl, 33600);
  assert.equal(result.beverages.stockToTakeMl, 10920);
  assert.equal(
    result.beverages.expectedConsumptionMlBySku["refrigerante-200ml"].share,
    0.2
  );
  assert.equal(
    result.beverages.stockToTakeBySku["refrigerante-200ml"].roundedUnitsToCurrentLot,
    60
  );
});

test("requested beverages with no modeled selected SKU do not invent a beverage mix", () => {
  const result = generateShadowRecommendation({
    adults: 10,
    serviceHours: 4,
    selectedCategories: ["Bebidas"],
    includeBeverages: true,
  });

  assert.equal(result.beverages.referenceTotalExpectedConsumptionMl, 7000);
  assert.equal(result.beverages.expectedConsumptionMl, 0);
  assert.equal(result.beverages.externalOrUncoveredExpectedMl, 7000);
  assert.equal(result.beverages.stockToTakeMl, 0);
  assert.deepEqual(result.beverages.expectedConsumptionMlBySku, {});
  assert.ok(result.warnings.some((warning) => warning.includes("without a selected modeled beverage SKU")));
});

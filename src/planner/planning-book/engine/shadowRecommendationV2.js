/* =========================================================
   RODA FESTA — RF-REC-2.0.0 ALPHA SHADOW R3 (PRE-GRAMMAGE)

   IMPORTANT:
   - This module is shadow-only and non-authoritative.
   - It does not replace RF-REC-1.0.0.
   - It does not alter the commercial ledger.
   - It intentionally stops before per-SKU lot allocation for solids.
   - Petiscos, Mini lanches and Doces stay in their natural unit until
     measured SKU grammages are available.
   - R3 treats elicited solid quantities as conservative planning targets;
     no second automatic solid buffer is added.
   ========================================================= */

export const SHADOW_ENGINE_VERSIONS = Object.freeze({
  recommendation: "RF-REC-2.0.0-alpha-shadow-pregram-r3",
  parameters: "RF-PARAM-2.0.0-alpha-elicited-r3-2026-08-29",
  compatibility: "RF-COMPAT-1.0.0",
  commercialRules: "RF-COM-1.0.0",
  priceBook: "RF-PRICE-2026-08-24",
});

export const SHADOW_SOLID_CATEGORIES = Object.freeze([
  "Petiscos",
  "Mini lanches",
  "Tortas",
  "Doces",
  "Bolos",
]);

const AGE_FACTORS = Object.freeze({
  "0-3": 0.35,
  "4-6": 0.35,
  "7-12": 1,
  "13-17": 1,
  adult: 1,
});

/*
 * Conservative planning baselines elicited from Roda Festa operational
 * experience for 4 hours with the complete solid menu selected.
 *
 * They already contain a light operational safety margin by judgement.
 * R3 therefore does NOT add a second automatic solid service buffer.
 * These are not SKU masses; they remain natural category quantities.
 */
const FULL_MENU_BASELINE = Object.freeze({
  Petiscos: Object.freeze({
    value: 6.5,
    unit: "unit",
    displayUnit: "un.",
    elicitedRange: [6, 7],
  }),
  "Mini lanches": Object.freeze({
    value: 2,
    unit: "unit",
    displayUnit: "un.",
  }),
  Tortas: Object.freeze({
    value: 70,
    unit: "gram",
    displayUnit: "g",
    nominalPortionGrams: 150,
  }),
  Doces: Object.freeze({
    value: 5,
    unit: "unit",
    displayUnit: "un.",
  }),
  Bolos: Object.freeze({
    value: 120,
    unit: "gram",
    displayUnit: "g",
    nominalPortionGrams: 120,
  }),
});

/*
 * Selection weights remain provisional priors until physical masses and
 * event observations allow the closed mass model to take over.
 * They sum to 1 for the complete solid menu.
 */
const SOLID_SELECTION_WEIGHTS = Object.freeze({
  Petiscos: 0.32,
  "Mini lanches": 0.20,
  Tortas: 0.20,
  Doces: 0.12,
  Bolos: 0.16,
});

const PETISCOS_SINGLE_ONLY_REFERENCE = 11;
const PETISCOS_FULL_MENU_REFERENCE = 6.5;
const PETISCOS_FULL_MENU_WEIGHT = SOLID_SELECTION_WEIGHTS.Petiscos;

export const SHADOW_PARAMETERS = Object.freeze({
  ageFactors: AGE_FACTORS,
  fullMenuBaseline: FULL_MENU_BASELINE,
  solidSelectionWeights: SOLID_SELECTION_WEIGHTS,
  lambda:
    Math.log(PETISCOS_SINGLE_ONLY_REFERENCE / PETISCOS_FULL_MENU_REFERENCE) /
    Math.log(1 / PETISCOS_FULL_MENU_WEIGHT),
  theta: 0,
  solidBaselineSemantics: "conservative-planning-target",
  additionalSolidServiceBuffer: 0,
  solidDuration: Object.freeze({
    minHours: 4,
    maxHours: 8,
    increasePerAdditionalHour: 0.10,
  }),
  beverages: Object.freeze({
    expectedMlPerAdultEquivalentPerHour: 175,
    stockBuffer: 0.30,
    mix: Object.freeze({
      "agua-mineral": 0.40,
      "suco-laranja-200ml": 0.40,
      "refrigerante-200ml": 0.20,
    }),
    volumePerUnitMl: Object.freeze({
      "suco-laranja-200ml": 200,
      "refrigerante-200ml": 200,
      // Intentionally absent: agua-mineral volume is not confirmed yet.
    }),
  }),
});

function asNonNegativeNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : 0;
}

function round(value, decimals = 3) {
  const factor = 10 ** decimals;
  return Math.round((Number(value) + Number.EPSILON) * factor) / factor;
}

function roundUpToMultiple(value, multiple) {
  const safeValue = asNonNegativeNumber(value);
  const safeMultiple = asNonNegativeNumber(multiple);
  if (!safeValue) return 0;
  if (!safeMultiple) return Math.ceil(safeValue);
  return Math.ceil(safeValue / safeMultiple) * safeMultiple;
}

export function calculateShadowDurationFactor(serviceHours) {
  const minHours = SHADOW_PARAMETERS.solidDuration.minHours;
  const maxHours = SHADOW_PARAMETERS.solidDuration.maxHours;
  const requested = Number(serviceHours);
  const validRequested = Number.isFinite(requested) ? requested : minHours;
  const effectiveHours = Math.min(maxHours, Math.max(minHours, validRequested));
  const factor =
    1 +
    (effectiveHours - minHours) *
      SHADOW_PARAMETERS.solidDuration.increasePerAdditionalHour;

  return {
    requestedHours: validRequested,
    effectiveHours,
    factor: round(factor, 4),
    clamped: effectiveHours !== validRequested,
  };
}

export function calculateShadowPlanningGuests({
  ageResolution = "legacy3",
  adults = 0,
  olderChildren = 0,
  children = 0,
  full5 = null,
} = {}) {
  if (ageResolution === "full5") {
    const source = full5 || {};
    const bands = {
      "0-3": asNonNegativeNumber(source["0-3"] ?? source.age0To3),
      "4-6": asNonNegativeNumber(source["4-6"] ?? source.age4To6),
      "7-12": asNonNegativeNumber(source["7-12"] ?? source.age7To12),
      "13-17": asNonNegativeNumber(source["13-17"] ?? source.age13To17),
      adult: asNonNegativeNumber(source.adult ?? source.adults),
    };

    const realGuests = Object.values(bands).reduce((sum, count) => sum + count, 0);
    const planningGuests = Object.entries(bands).reduce(
      (sum, [band, count]) => sum + count * AGE_FACTORS[band],
      0
    );

    return {
      ageResolution: "full5",
      bands,
      realGuests: round(realGuests, 3),
      planningGuests: round(planningGuests, 3),
      compatibilityProjectionApplied: false,
      note: null,
    };
  }

  const safeAdults = asNonNegativeNumber(adults);
  const safeOlderChildren = asNonNegativeNumber(olderChildren);
  const safeChildren = asNonNegativeNumber(children);

  /*
   * In this alpha, both projected sub-bands inside each legacy bucket have
   * the same planning factor:
   * - 0-3 and 4-6 => 0.35
   * - 7-12 and 13-17 => 1.00
   * Therefore omega1/omega2 do not affect the aggregate planning result.
   * The historic input remains untouched and explicitly marked legacy3.
   */
  const realGuests = safeAdults + safeOlderChildren + safeChildren;
  const planningGuests =
    safeAdults * AGE_FACTORS.adult +
    safeOlderChildren * AGE_FACTORS["7-12"] +
    safeChildren * AGE_FACTORS["0-3"];

  return {
    ageResolution: "legacy3",
    bands: {
      adults: safeAdults,
      olderChildren: safeOlderChildren,
      children: safeChildren,
    },
    realGuests: round(realGuests, 3),
    planningGuests: round(planningGuests, 3),
    compatibilityProjectionApplied: true,
    note:
      "RF-COMPAT-1.0.0 is declared, but omega does not change this alpha result because the paired legacy sub-bands currently share equal planning factors.",
  };
}

function normalizeProductCatalog(productCatalog = []) {
  if (Array.isArray(productCatalog)) return productCatalog;
  if (productCatalog && typeof productCatalog === "object") {
    return Object.values(productCatalog);
  }
  return [];
}

export function resolveShadowSelection({
  selectedProductIds = [],
  selectedCategories = null,
  productCatalog = [],
} = {}) {
  const selectedIds = new Set(selectedProductIds.map(String));
  const catalog = normalizeProductCatalog(productCatalog);

  const inferredCategories = catalog
    .filter((product) => selectedIds.has(String(product.id)))
    .map((product) => product.commercialCategory)
    .filter(Boolean);

  const requestedCategories = Array.isArray(selectedCategories)
    ? selectedCategories
    : inferredCategories;

  const selectedSolidCategories = SHADOW_SOLID_CATEGORIES.filter((category) =>
    requestedCategories.includes(category)
  );

  const selectedBeverageProductIds = catalog
    .filter(
      (product) =>
        selectedIds.has(String(product.id)) &&
        (product.commercialCategory === "Bebidas" || product.consignment)
    )
    .map((product) => String(product.id));

  const hasBeverageCategory = requestedCategories.includes("Bebidas");

  return {
    selectedSolidCategories,
    selectedBeverageProductIds,
    hasBeverages: selectedBeverageProductIds.length > 0 || hasBeverageCategory,
  };
}

function calculateShadowSelectionMath(selectedSolidCategories = []) {
  const selectedSet = new Set(selectedSolidCategories);
  const unique = SHADOW_SOLID_CATEGORIES.filter((category) =>
    selectedSet.has(category)
  );

  const selectedWeight = unique.reduce(
    (sum, category) => sum + (SOLID_SELECTION_WEIGHTS[category] || 0),
    0
  );

  if (selectedWeight <= 0) {
    return {
      selectedWeight: 0,
      multiplier: 0,
    };
  }

  return {
    selectedWeight,
    multiplier: selectedWeight ** (-SHADOW_PARAMETERS.lambda),
  };
}

export function calculateShadowSelectionMultiplier(selectedSolidCategories = []) {
  const math = calculateShadowSelectionMath(selectedSolidCategories);

  return {
    selectedWeight: round(math.selectedWeight, 6),
    multiplier: round(math.multiplier, 6),
  };
}

export function calculateShadowSolidCategories({
  planningGuests,
  serviceHours,
  selectedSolidCategories = [],
} = {}) {
  const guests = asNonNegativeNumber(planningGuests);
  const duration = calculateShadowDurationFactor(serviceHours);
  const selectionMath = calculateShadowSelectionMath(selectedSolidCategories);
  const selection = {
    selectedWeight: round(selectionMath.selectedWeight, 6),
    multiplier: round(selectionMath.multiplier, 6),
  };

  const categories = selectedSolidCategories
    .map((category) => {
      const baseline = FULL_MENU_BASELINE[category];
      if (!baseline) return null;

      const plannedNaturalQuantity =
        guests * baseline.value * duration.factor * selectionMath.multiplier;

      const result = {
        category,
        naturalUnit: baseline.unit,
        displayUnit: baseline.displayUnit,
        baselinePerAdultEquivalent4hFullMenu: baseline.value,
        baselineSemantics: SHADOW_PARAMETERS.solidBaselineSemantics,
        plannedNaturalQuantity: round(plannedNaturalQuantity, 3),
        plannedRoundedCategoryQuantity:
          baseline.unit === "unit"
            ? Math.ceil(round(plannedNaturalQuantity, 6))
            : round(plannedNaturalQuantity, 1),
        additionalServiceBuffer: SHADOW_PARAMETERS.additionalSolidServiceBuffer,
        durationFactor: duration.factor,
        substitutionMultiplier: selection.multiplier,
        lotAllocationStatus: "deferred-pending-sku-grammage-and-lot-solver",
      };

      if (baseline.nominalPortionGrams) {
        result.nominalPortionGrams = baseline.nominalPortionGrams;
        result.plannedNominalPortionsBeforeLot = round(
          plannedNaturalQuantity / baseline.nominalPortionGrams,
          3
        );
        result.plannedRoundedNominalPortions = Math.ceil(
          plannedNaturalQuantity / baseline.nominalPortionGrams
        );
      }

      if (baseline.elicitedRange) {
        result.elicitedRangePerAdultEquivalent4hFullMenu = [
          ...baseline.elicitedRange,
        ];
      }

      return result;
    })
    .filter(Boolean);

  return {
    duration,
    selection,
    categories,
  };
}

function selectedBeverageMix(selectedBeverageProductIds = []) {
  const knownMix = SHADOW_PARAMETERS.beverages.mix;
  const selected = [...new Set(selectedBeverageProductIds.map(String))]
    .filter((id) => knownMix[id] > 0);

  return Object.fromEntries(selected.map((id) => [id, knownMix[id]]));
}

export function calculateShadowBeverages({
  planningGuests,
  serviceHours,
  selectedBeverageProductIds = [],
  productCatalog = [],
  includeBeverages = false,
} = {}) {
  if (!includeBeverages) {
    return {
      requested: false,
      referenceTotalExpectedConsumptionMl: 0,
      expectedConsumptionMl: 0,
      externalOrUncoveredExpectedMl: 0,
      stockToTakeMl: 0,
      expectedConsumptionMlBySku: {},
      stockToTakeBySku: {},
      unmodeledSelectedProductIds: [],
      financialEstimate: {
        complete: true,
        knownExpectedValue: 0,
        missingVolumeProductIds: [],
      },
    };
  }

  const guests = asNonNegativeNumber(planningGuests);
  const duration = calculateShadowDurationFactor(serviceHours);
  const referenceTotalExpectedConsumptionMl =
    guests *
    SHADOW_PARAMETERS.beverages.expectedMlPerAdultEquivalentPerHour *
    duration.effectiveHours;

  const mix = selectedBeverageMix(selectedBeverageProductIds);
  const coveredShare = Object.values(mix).reduce((sum, share) => sum + share, 0);
  const expectedConsumptionMl = referenceTotalExpectedConsumptionMl * coveredShare;
  const externalOrUncoveredExpectedMl =
    referenceTotalExpectedConsumptionMl - expectedConsumptionMl;
  const stockToTakeMl =
    expectedConsumptionMl * (1 + SHADOW_PARAMETERS.beverages.stockBuffer);

  const expectedConsumptionMlBySku = {};
  const stockToTakeBySku = {};
  const catalog = normalizeProductCatalog(productCatalog);
  const byId = new Map(catalog.map((product) => [String(product.id), product]));
  const missingVolumeProductIds = [];
  let knownExpectedValue = 0;

  const modeledSelectedIds = new Set(Object.keys(mix));
  const unmodeledSelectedProductIds = [...new Set(selectedBeverageProductIds.map(String))]
    .filter((id) => !modeledSelectedIds.has(id));

  Object.entries(mix).forEach(([productId, share]) => {
    const expectedMl = referenceTotalExpectedConsumptionMl * share;
    const stockMl = expectedMl * (1 + SHADOW_PARAMETERS.beverages.stockBuffer);
    const volumePerUnitMl =
      SHADOW_PARAMETERS.beverages.volumePerUnitMl[productId] || null;
    const product = byId.get(productId);
    const lotSize = asNonNegativeNumber(product?.lotSize) || 1;

    const expectedEntry = {
      share: round(share, 6),
      ml: round(expectedMl, 3),
      volumePerUnitMl,
    };
    const stockEntry = {
      share: round(share, 6),
      ml: round(stockMl, 3),
      volumePerUnitMl,
    };

    if (volumePerUnitMl) {
      const expectedUnits = expectedMl / volumePerUnitMl;
      const stockUnits = stockMl / volumePerUnitMl;
      expectedEntry.estimatedUnits = round(expectedUnits, 3);
      stockEntry.estimatedUnits = round(stockUnits, 3);
      stockEntry.roundedUnitsToCurrentLot = roundUpToMultiple(stockUnits, lotSize);

      const unitPrice = Number(product?.unitPrice);
      if (Number.isFinite(unitPrice) && unitPrice >= 0) {
        const expectedValue = expectedUnits * unitPrice;
        expectedEntry.estimatedExpectedValue = round(expectedValue, 2);
        knownExpectedValue += expectedValue;
      }
    } else {
      missingVolumeProductIds.push(productId);
    }

    expectedConsumptionMlBySku[productId] = expectedEntry;
    stockToTakeBySku[productId] = stockEntry;
  });

  return {
    requested: true,
    referenceTotalExpectedConsumptionMl: round(referenceTotalExpectedConsumptionMl, 3),
    expectedConsumptionMl: round(expectedConsumptionMl, 3),
    externalOrUncoveredExpectedMl: round(externalOrUncoveredExpectedMl, 3),
    coveredTypicalShare: round(coveredShare, 6),
    stockBuffer: SHADOW_PARAMETERS.beverages.stockBuffer,
    stockToTakeMl: round(stockToTakeMl, 3),
    expectedConsumptionMlBySku,
    stockToTakeBySku,
    unmodeledSelectedProductIds,
    financialEstimate: {
      complete:
        missingVolumeProductIds.length === 0 &&
        unmodeledSelectedProductIds.length === 0,
      knownExpectedValue: round(knownExpectedValue, 2),
      missingVolumeProductIds,
      note:
        missingVolumeProductIds.length > 0
          ? "Expected financial value is incomplete until volume per unit is confirmed for every modeled selected beverage SKU."
          : unmodeledSelectedProductIds.length > 0
            ? "Expected financial value is incomplete because at least one selected beverage SKU has no typical-mix coefficient in this alpha."
            : null,
    },
  };
}

export function generateShadowRecommendation({
  ageResolution = "legacy3",
  adults = 0,
  olderChildren = 0,
  children = 0,
  full5 = null,
  serviceHours = 4,
  selectedProductIds = [],
  selectedCategories = null,
  productCatalog = [],
  includeBeverages = null,
} = {}) {
  const guests = calculateShadowPlanningGuests({
    ageResolution,
    adults,
    olderChildren,
    children,
    full5,
  });

  const selection = resolveShadowSelection({
    selectedProductIds,
    selectedCategories,
    productCatalog,
  });

  const solids = calculateShadowSolidCategories({
    planningGuests: guests.planningGuests,
    serviceHours,
    selectedSolidCategories: selection.selectedSolidCategories,
  });

  const beveragesRequested =
    includeBeverages == null ? selection.hasBeverages : Boolean(includeBeverages);

  const beverages = calculateShadowBeverages({
    planningGuests: guests.planningGuests,
    serviceHours,
    selectedBeverageProductIds: selection.selectedBeverageProductIds,
    productCatalog,
    includeBeverages: beveragesRequested,
  });

  const warnings = [];
  if (solids.duration.clamped) {
    warnings.push(
      `serviceHours ${solids.duration.requestedHours} is outside the validated alpha domain; shadow calculation used ${solids.duration.effectiveHours}h.`
    );
  }
  if (beverages.financialEstimate?.missingVolumeProductIds?.length) {
    warnings.push(
      `Beverage financial estimate is incomplete: missing unit volume for ${beverages.financialEstimate.missingVolumeProductIds.join(", ")}.`
    );
  }
  if (beverages.unmodeledSelectedProductIds?.length) {
    warnings.push(
      `Beverage alpha has no typical-mix coefficient for ${beverages.unmodeledSelectedProductIds.join(", ")}; no volume was invented for those SKUs.`
    );
  }
  if (beveragesRequested && selection.selectedBeverageProductIds.length === 0) {
    warnings.push(
      "Beverages were requested without a selected modeled beverage SKU; the reference demand remains uncovered instead of being invented."
    );
  }
  if (selection.selectedSolidCategories.length === 0 && !beveragesRequested) {
    warnings.push("No supported category was selected for the shadow calculation.");
  }

  return {
    mode: "shadow",
    authoritative: false,
    productionMutationAllowed: false,
    semanticStatus: "pre-grammage-conservative-planning-alpha-r3",
    versions: { ...SHADOW_ENGINE_VERSIONS },
    parameters: {
      lambda: round(SHADOW_PARAMETERS.lambda, 6),
      theta: SHADOW_PARAMETERS.theta,
      solidBaselineSemantics: SHADOW_PARAMETERS.solidBaselineSemantics,
      additionalSolidServiceBuffer:
        SHADOW_PARAMETERS.additionalSolidServiceBuffer,
      beverageStockBuffer: SHADOW_PARAMETERS.beverages.stockBuffer,
    },
    guests,
    service: solids.duration,
    selection: {
      ...selection,
      selectedWeight: solids.selection.selectedWeight,
      substitutionMultiplier: solids.selection.multiplier,
    },
    solids,
    beverages,
    deferred: {
      observedConsumptionSeparation: true,
      skuMasses: true,
      solidMassConservationProof: true,
      perSkuIntegerLotSolver: true,
      peakCapacityModel: true,
      promotionToProduction: true,
    },
    warnings,
  };
}

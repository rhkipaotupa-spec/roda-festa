/* =========================================================
   RODA FESTA — RF-REC-2 R4 SHADOW EXECUTABLE

   Shadow-only / non-authoritative.
   - RF-REC-1.0.0 remains authoritative in Production.
   - R3 and the R4 preflight remain historical evidence.
   - This module implements the current R4 solid-demand specification
     without wiring it into PlanningBook, API, ledger, Admin or database.
   ========================================================= */

export const R4_SHADOW_VERSIONS = Object.freeze({
  recommendation: "RF-REC-2.0.0-r4-shadow-2026-08-29",
  parameters: "RF-PARAM-2.0.0-r4-elicited-2026-08-29",
  compatibility: "RF-COMPAT-1.0.0",
  commercialRules: "RF-COM-1.0.0",
  priceBook: "RF-PRICE-2026-08-24",
});

export const R4_SOLID_CATEGORIES = Object.freeze([
  "Petiscos",
  "Mini lanches",
  "Tortas",
  "Doces",
  "Bolos",
]);

export const R4_BLOCKS = Object.freeze({
  B1: Object.freeze(["Petiscos", "Mini lanches", "Tortas"]),
  B2: Object.freeze(["Doces", "Bolos"]),
});

const AGE_FACTORS = Object.freeze({
  "0-3": 0.35,
  "4-6": 0.35,
  "7-12": 1,
  "13-17": 1,
  adult: 1,
});

const PETISCO_GATE = Object.freeze({
  coxinhaReadyGrams: 25,
  pastelReadyGrams: 30,
  observedRatio: 1.2,
  simpleMassRatioMax: 1.08,
  conflictRatioMin: 1.28,
  result: "gray-zone",
  productionCvApprox: 0.05,
  corridorGramsPerAdult: Object.freeze([145, 235]),
  confidence: "low-provisional-until-observed-consumption-by-sku",
});

const REFERENCE_MIX = Object.freeze({
  pastel: 0.4,
  coxinha: 0.4,
  bolinhaQueijo: 0.2,
});

const PHYSICAL = Object.freeze({
  petiscos: Object.freeze({
    coxinhaReadyGrams: 25,
    bolinhaQueijoReadyGrams: 25,
    pastelReadyGrams: 30,
    referenceMix: REFERENCE_MIX,
  }),
  miniReadyGrams: 120,
  miniReadyGramsRange: Object.freeze([115, 125]),
  doceReadyGrams: 16.5,
  doceReadyGramsRange: Object.freeze([15, 18]),
});

const EXPECTED_NATURAL_BASE = Object.freeze({
  Petiscos: Object.freeze({ value: 6.5, unit: "unit" }),
  "Mini lanches": Object.freeze({ value: 1.5, unit: "unit" }),
  Tortas: Object.freeze({ value: 70, unit: "gram" }),
  Doces: Object.freeze({ value: 5, unit: "unit" }),
  Bolos: Object.freeze({ value: 120, unit: "gram" }),
});

const PLANNING_RATIOS = Object.freeze({
  PetiscosOnlyB1: 11 / 9,
  "Mini lanches": 2 / 1.5,
  TortasMultiFlavor: 140 / 110,
});

const VARIETY = Object.freeze({
  Tortas: Object.freeze({ oneFlavor: 1, twoOrMore: 110 / 70 }),
  Bolos: Object.freeze({ oneFlavor: 1, twoOrMore: 150 / 120 }),
  maxTotalUplift: 0.15,
});

const DURATION = Object.freeze({ minHours: 4, maxHours: 8, increasePerHour: 0.1 });

const BEVERAGES = Object.freeze({
  expectedMlPerAdultEquivalentPerHour: 175,
  stockBuffer: 0.3,
  mix: Object.freeze({
    "agua-mineral": 0.4,
    "suco-laranja-200ml": 0.4,
    "refrigerante-200ml": 0.2,
  }),
  volumePerUnitMl: Object.freeze({
    "suco-laranja-200ml": 200,
    "refrigerante-200ml": 200,
  }),
});

function asNonNegativeNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function round(value, decimals = 6) {
  const factor = 10 ** decimals;
  return Math.round((Number(value) + Number.EPSILON) * factor) / factor;
}

function sum(values) {
  return values.reduce((total, value) => total + value, 0);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function roundUpToMultiple(value, multiple) {
  const v = asNonNegativeNumber(value);
  const m = asNonNegativeNumber(multiple);
  if (!v) return 0;
  if (!m) return Math.ceil(v);
  return Math.ceil(v / m) * m;
}

function normalizeCatalog(productCatalog = []) {
  if (Array.isArray(productCatalog)) return productCatalog;
  if (productCatalog && typeof productCatalog === "object") return Object.values(productCatalog);
  return [];
}

export function deriveReferencePetiscoReadyGrams() {
  return (
    REFERENCE_MIX.pastel * PHYSICAL.petiscos.pastelReadyGrams +
    REFERENCE_MIX.coxinha * PHYSICAL.petiscos.coxinhaReadyGrams +
    REFERENCE_MIX.bolinhaQueijo * PHYSICAL.petiscos.bolinhaQueijoReadyGrams
  );
}

export function deriveReferenceMassVector() {
  const grams = {
    Petiscos: EXPECTED_NATURAL_BASE.Petiscos.value * deriveReferencePetiscoReadyGrams(),
    "Mini lanches": EXPECTED_NATURAL_BASE["Mini lanches"].value * PHYSICAL.miniReadyGrams,
    Tortas: EXPECTED_NATURAL_BASE.Tortas.value,
    Doces: EXPECTED_NATURAL_BASE.Doces.value * PHYSICAL.doceReadyGrams,
    Bolos: EXPECTED_NATURAL_BASE.Bolos.value,
  };
  const bAdult = sum(Object.values(grams));
  const sigma = Object.fromEntries(
    Object.entries(grams).map(([category, mass]) => [category, mass / bAdult])
  );
  return { grams, bAdult, sigma };
}

const REFERENCE = deriveReferenceMassVector();
const B1_WEIGHT = sum(R4_BLOCKS.B1.map((category) => REFERENCE.sigma[category]));
const B2_WEIGHT = sum(R4_BLOCKS.B2.map((category) => REFERENCE.sigma[category]));
const NU_PETISCOS_REFERENCE = REFERENCE.sigma.Petiscos / B1_WEIGHT;
const LAMBDA_IN_CENTRAL =
  Math.log(9 / 6.5) / Math.log(1 / NU_PETISCOS_REFERENCE);

export const R4_PARAMETERS = Object.freeze({
  ageFactors: AGE_FACTORS,
  physical: PHYSICAL,
  expectedNaturalBase: EXPECTED_NATURAL_BASE,
  planningRatios: PLANNING_RATIOS,
  variety: VARIETY,
  duration: DURATION,
  petiscoGate: PETISCO_GATE,
  referenceMass: Object.freeze({
    grams: Object.freeze({ ...REFERENCE.grams }),
    bAdult: REFERENCE.bAdult,
    sigma: Object.freeze({ ...REFERENCE.sigma }),
    blockWeights: Object.freeze({ B1: B1_WEIGHT, B2: B2_WEIGHT }),
  }),
  substitution: Object.freeze({
    lambdaOut: 0,
    lambdaInCentral: LAMBDA_IN_CENTRAL,
    lambdaInSensitivity: Object.freeze([0.35, 0.43]),
    lambdaInStatus: "provisional-central-with-pre-registered-sensitivity",
  }),
  takeaway: Object.freeze({
    spontaneous: "leftover-disposition-not-demand",
    contractedGift: "separate-headcount-demand-not-modeled-in-appetite",
  }),
  beverages: BEVERAGES,
});

export function calculateR4PlanningGuests({
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
    return {
      ageResolution: "full5",
      bands,
      realGuests: round(sum(Object.values(bands)), 3),
      planningGuests: round(
        Object.entries(bands).reduce(
          (total, [band, count]) => total + count * AGE_FACTORS[band],
          0
        ),
        3
      ),
      compatibilityProjectionApplied: false,
    };
  }

  const safeAdults = asNonNegativeNumber(adults);
  const safeOlder = asNonNegativeNumber(olderChildren);
  const safeChildren = asNonNegativeNumber(children);
  return {
    ageResolution: "legacy3",
    bands: { adults: safeAdults, olderChildren: safeOlder, children: safeChildren },
    realGuests: round(safeAdults + safeOlder + safeChildren, 3),
    planningGuests: round(safeAdults + safeOlder + safeChildren * 0.35, 3),
    compatibilityProjectionApplied: true,
  };
}

export function calculateR4DurationFactor(serviceHours = 4) {
  const requested = Number.isFinite(Number(serviceHours)) ? Number(serviceHours) : 4;
  const effectiveHours = clamp(requested, DURATION.minHours, DURATION.maxHours);
  return {
    requestedHours: requested,
    effectiveHours,
    factor: round(1 + (effectiveHours - 4) * DURATION.increasePerHour, 4),
    clamped: requested !== effectiveHours,
  };
}

export function resolveR4Selection({
  selectedProductIds = [],
  selectedCategories = null,
  externalCategories = [],
  productCatalog = [],
} = {}) {
  const catalog = normalizeCatalog(productCatalog);
  const selectedIds = new Set(selectedProductIds.map(String));
  const inferred = catalog
    .filter((product) => selectedIds.has(String(product.id)))
    .map((product) => product.commercialCategory)
    .filter(Boolean);
  const requested = Array.isArray(selectedCategories) ? selectedCategories : inferred;
  const contractedSolidCategories = R4_SOLID_CATEGORIES.filter((category) =>
    requested.includes(category)
  );
  const externalSolidCategories = R4_SOLID_CATEGORIES.filter((category) =>
    externalCategories.includes(category)
  );
  const presentSolidCategories = R4_SOLID_CATEGORIES.filter(
    (category) =>
      contractedSolidCategories.includes(category) || externalSolidCategories.includes(category)
  );
  const selectedBeverageProductIds = catalog
    .filter(
      (product) =>
        selectedIds.has(String(product.id)) &&
        (product.commercialCategory === "Bebidas" || product.consignment)
    )
    .map((product) => String(product.id));
  return {
    contractedSolidCategories,
    externalSolidCategories,
    presentSolidCategories,
    selectedBeverageProductIds,
    hasBeverages:
      selectedBeverageProductIds.length > 0 || requested.includes("Bebidas"),
  };
}

function blockForCategory(category) {
  if (R4_BLOCKS.B1.includes(category)) return "B1";
  if (R4_BLOCKS.B2.includes(category)) return "B2";
  return null;
}

function blockCoverage(presentCategories, blockName) {
  const block = R4_BLOCKS[blockName];
  const denom = R4_PARAMETERS.referenceMass.blockWeights[blockName];
  const numerator = block
    .filter((category) => presentCategories.includes(category))
    .reduce((total, category) => total + REFERENCE.sigma[category], 0);
  return denom > 0 ? numerator / denom : 0;
}

export function calculateR4Substitution({
  presentSolidCategories = [],
  lambdaIn = LAMBDA_IN_CENTRAL,
} = {}) {
  const safeLambda = Number.isFinite(Number(lambdaIn)) ? Number(lambdaIn) : LAMBDA_IN_CENTRAL;
  const coverage = {
    B1: blockCoverage(presentSolidCategories, "B1"),
    B2: blockCoverage(presentSolidCategories, "B2"),
  };
  const multipliers = {
    B1: coverage.B1 > 0 ? coverage.B1 ** (-safeLambda) : 0,
    B2: coverage.B2 > 0 ? coverage.B2 ** (-safeLambda) : 0,
  };
  return {
    lambdaIn: safeLambda,
    lambdaOut: 0,
    coverage: { B1: round(coverage.B1, 6), B2: round(coverage.B2, 6) },
    multipliers: { B1: round(multipliers.B1, 6), B2: round(multipliers.B2, 6) },
  };
}

export function calculatePetiscoBaseCountPerAdult(petiscoReadyGrams = deriveReferencePetiscoReadyGrams()) {
  const grams = asNonNegativeNumber(petiscoReadyGrams) || deriveReferencePetiscoReadyGrams();
  const [minMass, maxMass] = PETISCO_GATE.corridorGramsPerAdult;
  const count = clamp(
    EXPECTED_NATURAL_BASE.Petiscos.value,
    minMass / grams,
    maxMass / grams
  );
  return {
    readyGrams: round(grams, 3),
    unitsPerAdult: round(count, 6),
    realizedMassPerAdult: round(count * grams, 3),
    regime:
      Math.abs(count - EXPECTED_NATURAL_BASE.Petiscos.value) < 1e-9
        ? "count-anchor"
        : "mass-guard",
    corridorGramsPerAdult: [...PETISCO_GATE.corridorGramsPerAdult],
  };
}

function varietyMultiplier(category, flavorCount) {
  const count = Math.max(1, Number(flavorCount) || 1);
  const config = VARIETY[category];
  if (!config || count < 2) return 1;
  return config.twoOrMore;
}

function naturalToMass(category, natural, petiscoReadyGrams) {
  if (category === "Petiscos") return natural * petiscoReadyGrams;
  if (category === "Mini lanches") return natural * PHYSICAL.miniReadyGrams;
  if (category === "Tortas" || category === "Bolos") return natural;
  if (category === "Doces") return natural * PHYSICAL.doceReadyGrams;
  return 0;
}

function planningRatio(category, { onlyPetiscosInB1, flavorCount }) {
  if (category === "Petiscos" && onlyPetiscosInB1) return PLANNING_RATIOS.PetiscosOnlyB1;
  if (category === "Mini lanches") return PLANNING_RATIOS["Mini lanches"];
  if (category === "Tortas" && Number(flavorCount) >= 2) return PLANNING_RATIOS.TortasMultiFlavor;
  return 1;
}

function categoryLot(category) {
  if (category === "Mini lanches") return 5;
  if (category === "Doces") return 10;
  return 1;
}

function categoryPortionGrams(category) {
  if (category === "Tortas") return 150;
  if (category === "Bolos") return 120;
  return null;
}

export function calculateR4SolidDemand({
  planningGuests = 0,
  serviceHours = 4,
  contractedSolidCategories = [],
  externalSolidCategories = [],
  flavorCounts = {},
  petiscoReadyGrams = deriveReferencePetiscoReadyGrams(),
  lambdaIn = LAMBDA_IN_CENTRAL,
} = {}) {
  const presentSolidCategories = R4_SOLID_CATEGORIES.filter(
    (category) =>
      contractedSolidCategories.includes(category) || externalSolidCategories.includes(category)
  );
  const duration = calculateR4DurationFactor(serviceHours);
  const substitution = calculateR4Substitution({ presentSolidCategories, lambdaIn });
  const petiscoBase = calculatePetiscoBaseCountPerAdult(petiscoReadyGrams);
  const onlyPetiscosInB1 =
    presentSolidCategories.filter((category) => R4_BLOCKS.B1.includes(category)).length === 1 &&
    presentSolidCategories.includes("Petiscos");

  const baseNoVariety = {};
  const candidate = {};

  for (const category of presentSolidCategories) {
    const block = blockForCategory(category);
    const substitutionMultiplier = substitution.multipliers[block] || 0;
    const baseNatural =
      category === "Petiscos"
        ? petiscoBase.unitsPerAdult
        : EXPECTED_NATURAL_BASE[category].value;
    const h = varietyMultiplier(category, flavorCounts[category]);
    baseNoVariety[category] = baseNatural * substitutionMultiplier;
    candidate[category] = baseNatural * substitutionMultiplier * h;
  }

  const realizedNoVarietyMassPerAdult = sum(
    Object.entries(baseNoVariety).map(([category, natural]) =>
      naturalToMass(category, natural, petiscoBase.readyGrams)
    )
  );
  const structuralBaselineMassPerAdult = sum(
    Object.entries(baseNoVariety).map(([category, natural]) =>
      naturalToMass(category, natural, deriveReferencePetiscoReadyGrams())
    )
  );
  const candidateMassPerAdult = sum(
    Object.entries(candidate).map(([category, natural]) =>
      naturalToMass(category, natural, petiscoBase.readyGrams)
    )
  );
  const maxVarietyMassPerAdult = structuralBaselineMassPerAdult * (1 + VARIETY.maxTotalUplift);
  const varietyCapFactor =
    candidateMassPerAdult > 0
      ? Math.min(1, maxVarietyMassPerAdult / candidateMassPerAdult)
      : 1;

  const categories = presentSolidCategories.map((category) => {
    const block = blockForCategory(category);
    const expectedPerAdultBeforeCap = candidate[category];
    const expectedPerAdult = expectedPerAdultBeforeCap * varietyCapFactor;
    const ratio = planningRatio(category, {
      onlyPetiscosInB1,
      flavorCount: flavorCounts[category],
    });
    const plannedPerAdult = expectedPerAdult * ratio;
    const expectedNaturalQuantity =
      expectedPerAdult * asNonNegativeNumber(planningGuests) * duration.factor;
    const plannedNaturalQuantity =
      plannedPerAdult * asNonNegativeNumber(planningGuests) * duration.factor;
    const unit = EXPECTED_NATURAL_BASE[category].unit;
    const lot = categoryLot(category);
    const contracted = contractedSolidCategories.includes(category);
    const external = externalSolidCategories.includes(category);
    const result = {
      category,
      block,
      contracted,
      external,
      naturalUnit: unit,
      flavorCount: Math.max(1, Number(flavorCounts[category]) || 1),
      substitutionMultiplier: substitution.multipliers[block],
      varietyMultiplier: round(varietyMultiplier(category, flavorCounts[category]), 6),
      varietyCapFactor: round(varietyCapFactor, 6),
      expectedNaturalPerAdult4h: round(expectedPerAdult, 6),
      plannedNaturalPerAdult4h: round(plannedPerAdult, 6),
      expectedNaturalQuantity: round(expectedNaturalQuantity, 3),
      plannedNaturalQuantity: contracted ? round(plannedNaturalQuantity, 3) : 0,
      expectedMassPerAdult4h: round(
        naturalToMass(category, expectedPerAdult, petiscoBase.readyGrams),
        3
      ),
      plannedMassPerAdult4h: contracted
        ? round(naturalToMass(category, plannedPerAdult, petiscoBase.readyGrams), 3)
        : 0,
      planningRatio: round(ratio, 6),
      allocationStatus: contracted
        ? "category-shadow-only-per-sku-allocation-deferred"
        : "external-demand-context-only",
    };

    if (unit === "unit" && contracted) {
      result.plannedRoundedCategoryUnits = roundUpToMultiple(plannedNaturalQuantity, lot);
      result.categoryLot = lot;
    }

    const portionGrams = categoryPortionGrams(category);
    if (portionGrams && contracted) {
      result.nominalPortionGrams = portionGrams;
      result.plannedRoundedNominalPortions = Math.ceil(plannedNaturalQuantity / portionGrams);
    }

    if (category === "Petiscos") {
      result.petiscoConversion = { ...petiscoBase };
      result.kappaStatus = PETISCO_GATE.confidence;
      result.preRegisteredGateResult = PETISCO_GATE.result;
    }

    return result;
  });

  const expectedMassPerAdultRealized = sum(
    categories.map((entry) => entry.expectedMassPerAdult4h)
  );
  const contractedPlannedMassPerAdult = sum(
    categories.map((entry) => entry.plannedMassPerAdult4h)
  );

  return {
    duration,
    substitution,
    petiscoBase,
    presentSolidCategories,
    contractedSolidCategories: [...contractedSolidCategories],
    externalSolidCategories: [...externalSolidCategories],
    variety: {
      structuralBaselineMassPerAdult: round(structuralBaselineMassPerAdult, 3),
      realizedNoVarietyMassPerAdult: round(realizedNoVarietyMassPerAdult, 3),
      candidateMassPerAdult: round(candidateMassPerAdult, 3),
      maxMassPerAdult: round(maxVarietyMassPerAdult, 3),
      capFactor: round(varietyCapFactor, 6),
      capApplied: varietyCapFactor < 1,
    },
    expectedMassPerAdultRealized: round(expectedMassPerAdultRealized, 3),
    contractedPlannedMassPerAdult: round(contractedPlannedMassPerAdult, 3),
    categories,
  };
}

function selectedBeverageMix(ids = []) {
  const selected = [...new Set(ids.map(String))].filter((id) => BEVERAGES.mix[id] > 0);
  return Object.fromEntries(selected.map((id) => [id, BEVERAGES.mix[id]]));
}

export function calculateR4Beverages({
  planningGuests = 0,
  serviceHours = 4,
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
    };
  }
  const duration = calculateR4DurationFactor(serviceHours);
  const referenceTotalExpectedConsumptionMl =
    asNonNegativeNumber(planningGuests) *
    BEVERAGES.expectedMlPerAdultEquivalentPerHour *
    duration.effectiveHours;
  const mix = selectedBeverageMix(selectedBeverageProductIds);
  const coveredShare = sum(Object.values(mix));
  const expectedConsumptionMl = referenceTotalExpectedConsumptionMl * coveredShare;
  const stockToTakeMl = expectedConsumptionMl * (1 + BEVERAGES.stockBuffer);
  const catalog = normalizeCatalog(productCatalog);
  const byId = new Map(catalog.map((product) => [String(product.id), product]));
  const expectedConsumptionMlBySku = {};
  const stockToTakeBySku = {};

  for (const [id, share] of Object.entries(mix)) {
    const expectedMl = referenceTotalExpectedConsumptionMl * share;
    const stockMl = expectedMl * (1 + BEVERAGES.stockBuffer);
    const volume = BEVERAGES.volumePerUnitMl[id] || null;
    const product = byId.get(id);
    const lot = asNonNegativeNumber(product?.lotSize) || 1;
    expectedConsumptionMlBySku[id] = { share, ml: round(expectedMl, 3), volumePerUnitMl: volume };
    stockToTakeBySku[id] = { share, ml: round(stockMl, 3), volumePerUnitMl: volume };
    if (volume) {
      expectedConsumptionMlBySku[id].estimatedUnits = round(expectedMl / volume, 3);
      stockToTakeBySku[id].estimatedUnits = round(stockMl / volume, 3);
      stockToTakeBySku[id].roundedUnitsToCurrentLot = roundUpToMultiple(stockMl / volume, lot);
    }
  }

  return {
    requested: true,
    referenceTotalExpectedConsumptionMl: round(referenceTotalExpectedConsumptionMl, 3),
    expectedConsumptionMl: round(expectedConsumptionMl, 3),
    externalOrUncoveredExpectedMl: round(referenceTotalExpectedConsumptionMl - expectedConsumptionMl, 3),
    coveredTypicalShare: round(coveredShare, 6),
    stockBuffer: BEVERAGES.stockBuffer,
    stockToTakeMl: round(stockToTakeMl, 3),
    expectedConsumptionMlBySku,
    stockToTakeBySku,
  };
}

export function generateR4ShadowRecommendation({
  ageResolution = "legacy3",
  adults = 0,
  olderChildren = 0,
  children = 0,
  full5 = null,
  serviceHours = 4,
  selectedProductIds = [],
  selectedCategories = null,
  externalCategories = [],
  productCatalog = [],
  flavorCounts = {},
  petiscoReadyGrams = deriveReferencePetiscoReadyGrams(),
  lambdaIn = LAMBDA_IN_CENTRAL,
  includeBeverages = null,
} = {}) {
  const guests = calculateR4PlanningGuests({
    ageResolution,
    adults,
    olderChildren,
    children,
    full5,
  });
  const selection = resolveR4Selection({
    selectedProductIds,
    selectedCategories,
    externalCategories,
    productCatalog,
  });
  const solids = calculateR4SolidDemand({
    planningGuests: guests.planningGuests,
    serviceHours,
    contractedSolidCategories: selection.contractedSolidCategories,
    externalSolidCategories: selection.externalSolidCategories,
    flavorCounts,
    petiscoReadyGrams,
    lambdaIn,
  });
  const beveragesRequested =
    includeBeverages == null ? selection.hasBeverages : Boolean(includeBeverages);
  const beverages = calculateR4Beverages({
    planningGuests: guests.planningGuests,
    serviceHours,
    selectedBeverageProductIds: selection.selectedBeverageProductIds,
    productCatalog,
    includeBeverages: beveragesRequested,
  });

  const warnings = [];
  if (solids.duration.clamped) {
    warnings.push(
      `serviceHours ${solids.duration.requestedHours} is outside the validated 4-8h domain; ${solids.duration.effectiveHours}h was used.`
    );
  }
  if (PETISCO_GATE.result === "gray-zone") {
    warnings.push(
      "Petiscos kappa remains provisional: the pre-registered Coxinha/Pastel gate landed in the gray zone (ratio 1.20)."
    );
  }
  if (selection.externalSolidCategories.length) {
    warnings.push(
      "External solid categories affect appetite/substitution context but are not planned as Roda Festa supply."
    );
  }

  return {
    mode: "shadow",
    authoritative: false,
    productionMutationAllowed: false,
    semanticStatus: "r4-executable-shadow-not-production-authoritative",
    versions: { ...R4_SHADOW_VERSIONS },
    parameters: {
      bAdultReference: round(REFERENCE.bAdult, 3),
      sigmaReference: { ...REFERENCE.sigma },
      lambdaIn: round(Number(lambdaIn), 6),
      lambdaInSensitivity: [...R4_PARAMETERS.substitution.lambdaInSensitivity],
      lambdaOut: 0,
      petiscoCorridorGramsPerAdult: [...PETISCO_GATE.corridorGramsPerAdult],
      petiscoGateResult: PETISCO_GATE.result,
      maxVarietyUplift: VARIETY.maxTotalUplift,
    },
    guests,
    selection,
    solids,
    beverages,
    deferred: {
      productionPromotion: true,
      petiscoObservedSkuCalibration: true,
      takeawayContractedGiftModel: true,
      perSkuSolidAllocation: true,
      peakCapacityModel: true,
    },
    warnings,
  };
}

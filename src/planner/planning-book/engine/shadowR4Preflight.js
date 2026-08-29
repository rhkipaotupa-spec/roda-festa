/* =========================================================
   RODA FESTA — R4 PREFLIGHT SPEC CHECKPOINT

   IMPORTANT:
   - This is NOT the RF-REC-2 R4 recommendation engine.
   - It does not replace RF-REC-1.0.0 or R3.
   - It records elicited/physical priors and input-contract semantics
     while consultant review is still open.
   - No production path imports this module.
   ========================================================= */

export const R4_PREFLIGHT_VERSION = "RF-REC-2-R4-preflight-2026-08-29";

export const R4_PREFLIGHT_STATUS = Object.freeze({
  recommendationEngineImplemented: false,
  productionAuthoritative: false,
  consultantReviewOpen: true,
  lambdaOutIdentified: true,
  lambdaInFrozen: false,
  takeawayModeled: false,
});

export const R4_BLOCKS = Object.freeze({
  B1: Object.freeze(["Petiscos", "Mini lanches", "Tortas"]),
  B2: Object.freeze(["Doces", "Bolos"]),
});

export const R4_ELICITED = Object.freeze({
  referenceContext: Object.freeze({ adults: 60, serviceHours: 4 }),
  ageFactors: Object.freeze({
    "0-3": 0.35,
    "4-6": 0.35,
    "7-12": 1,
    "13-17": 1,
    adult: 1,
  }),
  expectedConsumption: Object.freeze({
    Petiscos: Object.freeze({
      completeMenuUnitsPerAdult: 6.5,
      onlyB1PetiscosUnitsPerAdult: 9,
      onlyB1PetiscosRange: Object.freeze([8, 10]),
    }),
    "Mini lanches": Object.freeze({ unitsPerAdult: 1.5 }),
    Tortas: Object.freeze({
      gramsPerAdultOneFlavor: 70,
      gramsPerAdultTwoOrMoreFlavors: 110,
    }),
    Doces: Object.freeze({ unitsPerAdult: 5 }),
    Bolos: Object.freeze({
      gramsPerAdultOneFlavor: 120,
      gramsPerAdultTwoOrMoreFlavors: 150,
    }),
  }),
  conservativePlanning: Object.freeze({
    Petiscos: Object.freeze({
      onlyB1PetiscosUnitsPerAdult: 11,
      onlyB1PetiscosRange: Object.freeze([10, 12]),
      completeMenuAdditionalMargin: 0,
    }),
    "Mini lanches": Object.freeze({ unitsPerAdult: 2 }),
    Tortas: Object.freeze({
      gramsPerAdultOneFlavor: 70,
      gramsPerAdultTwoOrMoreFlavors: 140,
    }),
    Doces: Object.freeze({ unitsPerAdult: 5 }),
    Bolos: Object.freeze({
      gramsPerAdultOneFlavor: 120,
      gramsPerAdultTwoOrMoreFlavors: 150,
    }),
  }),
  physicalWeights: Object.freeze({
    friedStandard: Object.freeze({ rawGrams: 23, readyGrams: 25 }),
    pastel: Object.freeze({ rawGrams: 30, readyGrams: 34 }),
    miniLancheReadyGramsRange: Object.freeze([115, 125]),
    doceReadyGramsRange: Object.freeze([15, 18]),
  }),
  petiscosConsumptionMixPrior: Object.freeze({
    pastel: 0.4,
    coxinha: 0.4,
    bolinhaQueijo: 0.2,
  }),
  substitution: Object.freeze({
    lambdaOut: 0,
    lambdaOutBasis:
      "Q2-prime with real absence of Doces/Bolos: Petiscos expected consumption remains 6-7 per adult.",
    lambdaInStatus: "provisional-derived-not-frozen",
  }),
  variety: Object.freeze({
    Tortas: Object.freeze({ oneFlavor: 1, twoOrMore: 110 / 70 }),
    Bolos: Object.freeze({ oneFlavor: 1, twoOrMore: 150 / 120 }),
    maxTotalUplift: 0.15,
  }),
  takeaway: Object.freeze({
    Bolos: "deferred-needs-elicitation-and-field-measurement",
    Doces: "deferred-needs-elicitation-and-field-measurement",
  }),
});

function sum(values) {
  return values.reduce((total, value) => total + value, 0);
}

function midpoint([min, max]) {
  return (Number(min) + Number(max)) / 2;
}

export function derivePetiscosReadyGramsPrior() {
  const mix = R4_ELICITED.petiscosConsumptionMixPrior;
  const weights = R4_ELICITED.physicalWeights;
  return (
    mix.pastel * weights.pastel.readyGrams +
    mix.coxinha * weights.friedStandard.readyGrams +
    mix.bolinhaQueijo * weights.friedStandard.readyGrams
  );
}

export function deriveReferenceMassVector({
  miniReadyGrams = midpoint(R4_ELICITED.physicalWeights.miniLancheReadyGramsRange),
  doceReadyGrams = midpoint(R4_ELICITED.physicalWeights.doceReadyGramsRange),
  petiscoReadyGrams = derivePetiscosReadyGramsPrior(),
} = {}) {
  const expected = R4_ELICITED.expectedConsumption;
  const grams = {
    Petiscos: expected.Petiscos.completeMenuUnitsPerAdult * petiscoReadyGrams,
    "Mini lanches": expected["Mini lanches"].unitsPerAdult * miniReadyGrams,
    Tortas: expected.Tortas.gramsPerAdultOneFlavor,
    Doces: expected.Doces.unitsPerAdult * doceReadyGrams,
    Bolos: expected.Bolos.gramsPerAdultOneFlavor,
  };

  const bAdult = sum(Object.values(grams));
  const sigma = Object.fromEntries(
    Object.entries(grams).map(([category, mass]) => [category, mass / bAdult])
  );

  return { grams, bAdult, sigma };
}

export function deriveLambdaInEstimate(options = {}) {
  const { sigma } = deriveReferenceMassVector(options);
  const b1Weight = sum(R4_BLOCKS.B1.map((category) => sigma[category] || 0));
  const nuPetiscos = sigma.Petiscos / b1Weight;
  const ratio =
    R4_ELICITED.expectedConsumption.Petiscos.onlyB1PetiscosUnitsPerAdult /
    R4_ELICITED.expectedConsumption.Petiscos.completeMenuUnitsPerAdult;

  return {
    ratio,
    nuPetiscos,
    lambdaIn: Math.log(ratio) / Math.log(1 / nuPetiscos),
    status: R4_ELICITED.substitution.lambdaInStatus,
  };
}

export function varietyMultiplier(category, flavorCount) {
  const count = Math.max(0, Number(flavorCount) || 0);
  const config = R4_ELICITED.variety[category];
  if (!config || count <= 1) return 1;
  return config.twoOrMore;
}

export function derivePresentCategories({
  contractedCategories = [],
  externalCategories = [],
} = {}) {
  const contracted = [...new Set(contractedCategories.map(String))];
  const external = [...new Set(externalCategories.map(String))];
  const present = [...new Set([...contracted, ...external])];
  return { contracted, external, present };
}

export function categoryPlanningSemantics(category, { flavorCount = 1, onlyB1Petiscos = false } = {}) {
  const expected = R4_ELICITED.expectedConsumption;
  const planning = R4_ELICITED.conservativePlanning;

  if (category === "Petiscos") {
    return onlyB1Petiscos
      ? {
          expectedNaturalPerAdult: expected.Petiscos.onlyB1PetiscosUnitsPerAdult,
          plannedNaturalPerAdult: planning.Petiscos.onlyB1PetiscosUnitsPerAdult,
          unit: "unit",
        }
      : {
          expectedNaturalPerAdult: expected.Petiscos.completeMenuUnitsPerAdult,
          plannedNaturalPerAdult: expected.Petiscos.completeMenuUnitsPerAdult,
          unit: "unit",
        };
  }

  if (category === "Mini lanches") {
    return {
      expectedNaturalPerAdult: expected["Mini lanches"].unitsPerAdult,
      plannedNaturalPerAdult: planning["Mini lanches"].unitsPerAdult,
      unit: "unit",
      note: "2/person is an explicit operational planning target; it is not lot quantization.",
    };
  }

  if (category === "Tortas") {
    const multi = Number(flavorCount) >= 2;
    return {
      expectedNaturalPerAdult: multi
        ? expected.Tortas.gramsPerAdultTwoOrMoreFlavors
        : expected.Tortas.gramsPerAdultOneFlavor,
      plannedNaturalPerAdult: multi
        ? planning.Tortas.gramsPerAdultTwoOrMoreFlavors
        : planning.Tortas.gramsPerAdultOneFlavor,
      unit: "gram",
    };
  }

  if (category === "Doces") {
    return {
      expectedNaturalPerAdult: expected.Doces.unitsPerAdult,
      plannedNaturalPerAdult: planning.Doces.unitsPerAdult,
      unit: "unit",
      takeaway: R4_ELICITED.takeaway.Doces,
    };
  }

  if (category === "Bolos") {
    const multi = Number(flavorCount) >= 2;
    return {
      expectedNaturalPerAdult: multi
        ? expected.Bolos.gramsPerAdultTwoOrMoreFlavors
        : expected.Bolos.gramsPerAdultOneFlavor,
      plannedNaturalPerAdult: multi
        ? planning.Bolos.gramsPerAdultTwoOrMoreFlavors
        : planning.Bolos.gramsPerAdultOneFlavor,
      unit: "gram",
      takeaway: R4_ELICITED.takeaway.Bolos,
    };
  }

  return null;
}

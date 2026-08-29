import test from "node:test";
import assert from "node:assert/strict";
import {
  R4_PARAMETERS,
  deriveReferencePetiscoReadyGrams,
  deriveReferenceMassVector,
  calculatePetiscoBaseCountPerAdult,
  calculateR4Substitution,
  calculateR4SolidDemand,
  calculateR4Beverages,
  generateR4ShadowRecommendation,
} from "../src/planner/planning-book/engine/shadowRecommendationR4.js";

function close(actual, expected, tolerance = 1e-6) {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} != ${expected}`);
}

const catalog = [
  { id: "coxinha-frango-catupiry", commercialCategory: "Petiscos", lotSize: 25 },
  { id: "mini-hot-dog", commercialCategory: "Mini lanches", lotSize: 5 },
  { id: "torta-frango-catupiry", commercialCategory: "Tortas", lotSize: 1 },
  { id: "torta-palmito-catupiry", commercialCategory: "Tortas", lotSize: 1 },
  { id: "brigadeiro-chocolate", commercialCategory: "Doces", lotSize: 10 },
  { id: "bolo-beatriz", commercialCategory: "Bolos", lotSize: 1 },
  { id: "refrigerante-200ml", commercialCategory: "Bebidas", lotSize: 10, consignment: true },
  { id: "suco-laranja-200ml", commercialCategory: "Bebidas", lotSize: 10, consignment: true },
];

test("R4 reference reflects the measured 25g coxinha and 30g pastel gate result", () => {
  close(deriveReferencePetiscoReadyGrams(), 27);
  const ref = deriveReferenceMassVector();
  close(ref.grams.Petiscos, 175.5);
  close(ref.bAdult, 628);
  close(ref.sigma.Petiscos, 0.27945859872611467);
  assert.equal(R4_PARAMETERS.petiscoGate.result, "gray-zone");
  close(R4_PARAMETERS.petiscoGate.observedRatio, 1.2);
});

test("lambda central is derived from fixed reference sigma and remains inside sensitivity interval", () => {
  close(R4_PARAMETERS.substitution.lambdaInCentral, 0.3674490533281365);
  assert.deepEqual(R4_PARAMETERS.substitution.lambdaInSensitivity, [0.35, 0.43]);
});

test("petisco corridor preserves count for 25g and 30g and guards a 10g extreme", () => {
  const coxinha = calculatePetiscoBaseCountPerAdult(25);
  const pastel = calculatePetiscoBaseCountPerAdult(30);
  const tiny = calculatePetiscoBaseCountPerAdult(10);
  close(coxinha.unitsPerAdult, 6.5);
  close(pastel.unitsPerAdult, 6.5);
  close(tiny.unitsPerAdult, 14.5);
  close(tiny.realizedMassPerAdult, 145);
  assert.equal(tiny.regime, "mass-guard");
});

test("only Petiscos in B1 reproduces 9 expected and 11 planned per adult at reference mix", () => {
  const result = calculateR4SolidDemand({
    planningGuests: 60,
    serviceHours: 4,
    contractedSolidCategories: ["Petiscos"],
  });
  const p = result.categories.find((x) => x.category === "Petiscos");
  close(p.expectedNaturalPerAdult4h, 9, 1e-5);
  close(p.plannedNaturalPerAdult4h, 11, 1e-5);
  close(p.plannedNaturalQuantity, 660, 1e-3);
});

test("external Mini in B1 reduces Petiscos uplift without becoming Roda Festa supply", () => {
  const onlyP = calculateR4SolidDemand({
    planningGuests: 60,
    contractedSolidCategories: ["Petiscos"],
  });
  const withExternalMini = calculateR4SolidDemand({
    planningGuests: 60,
    contractedSolidCategories: ["Petiscos"],
    externalSolidCategories: ["Mini lanches"],
  });
  const a = onlyP.categories.find((x) => x.category === "Petiscos");
  const b = withExternalMini.categories.find((x) => x.category === "Petiscos");
  assert.ok(b.expectedNaturalQuantity < a.expectedNaturalQuantity);
  const ext = withExternalMini.categories.find((x) => x.category === "Mini lanches");
  assert.equal(ext.external, true);
  assert.equal(ext.plannedNaturalQuantity, 0);
});

test("lambda_out zero means removing B2 does not change B1 substitution when B1 composition is unchanged", () => {
  const withB2 = calculateR4Substitution({
    presentSolidCategories: ["Petiscos", "Mini lanches", "Tortas", "Doces", "Bolos"],
  });
  const withoutB2 = calculateR4Substitution({
    presentSolidCategories: ["Petiscos", "Mini lanches", "Tortas"],
  });
  close(withB2.multipliers.B1, 1);
  close(withoutB2.multipliers.B1, 1);
});

test("Mini keeps 1.5 expected and 2 planned when full B1 is present", () => {
  const result = calculateR4SolidDemand({
    planningGuests: 60,
    contractedSolidCategories: ["Petiscos", "Mini lanches", "Tortas"],
  });
  const mini = result.categories.find((x) => x.category === "Mini lanches");
  close(mini.expectedNaturalPerAdult4h, 1.5);
  close(mini.plannedNaturalPerAdult4h, 2);
  close(mini.plannedNaturalQuantity, 120);
  assert.equal(mini.plannedRoundedCategoryUnits, 120);
});

test("Torta and Bolo variety saturates at 2+ flavors and the 15 percent guard uses structural reference mass", () => {
  const measured = calculateR4SolidDemand({
    planningGuests: 60,
    contractedSolidCategories: ["Petiscos", "Mini lanches", "Tortas", "Doces", "Bolos"],
    flavorCounts: { Tortas: 8, Bolos: 8 },
    petiscoReadyGrams: 30,
  });
  const torta = measured.categories.find((x) => x.category === "Tortas");
  const bolo = measured.categories.find((x) => x.category === "Bolos");
  close(torta.varietyMultiplier, 110 / 70, 1e-6);
  close(bolo.varietyMultiplier, 1.25, 1e-6);
  close(measured.variety.structuralBaselineMassPerAdult, 628);
  close(measured.variety.maxMassPerAdult, 722.2);
  assert.equal(measured.variety.capApplied, false);

  const hypotheticalHeavy = calculateR4SolidDemand({
    planningGuests: 60,
    contractedSolidCategories: ["Petiscos", "Mini lanches", "Tortas", "Doces", "Bolos"],
    flavorCounts: { Tortas: 2, Bolos: 2 },
    petiscoReadyGrams: 34,
  });
  assert.ok(hypotheticalHeavy.variety.candidateMassPerAdult > hypotheticalHeavy.variety.maxMassPerAdult);
  assert.equal(hypotheticalHeavy.variety.capApplied, true);
  assert.ok(hypotheticalHeavy.expectedMassPerAdultRealized <= hypotheticalHeavy.variety.maxMassPerAdult + 0.01);
});

test("duration remains 1.0 at 4h, 1.2 at 6h and 1.4 at 8h through recommendation totals", () => {
  const q4 = calculateR4SolidDemand({ planningGuests: 10, serviceHours: 4, contractedSolidCategories: ["Petiscos"] });
  const q6 = calculateR4SolidDemand({ planningGuests: 10, serviceHours: 6, contractedSolidCategories: ["Petiscos"] });
  const q8 = calculateR4SolidDemand({ planningGuests: 10, serviceHours: 8, contractedSolidCategories: ["Petiscos"] });
  const p4 = q4.categories[0].plannedNaturalQuantity;
  const p6 = q6.categories[0].plannedNaturalQuantity;
  const p8 = q8.categories[0].plannedNaturalQuantity;
  close(p6 / p4, 1.2, 1e-5);
  close(p8 / p4, 1.4, 1e-5);
});

test("legacy3 keeps 35 percent for 0-6 and 100 percent for older children", () => {
  const result = generateR4ShadowRecommendation({
    adults: 27,
    olderChildren: 0,
    children: 15,
    selectedCategories: ["Petiscos"],
  });
  close(result.guests.planningGuests, 32.25);
});

test("beverages keep fixed typical shares without renormalizing selected subset", () => {
  const result = calculateR4Beverages({
    planningGuests: 60,
    serviceHours: 4,
    selectedBeverageProductIds: ["refrigerante-200ml"],
    productCatalog: catalog,
    includeBeverages: true,
  });
  close(result.referenceTotalExpectedConsumptionMl, 42000);
  close(result.expectedConsumptionMl, 8400);
  close(result.externalOrUncoveredExpectedMl, 33600);
  close(result.stockToTakeMl, 10920);
});

test("sensitivity endpoints preserve monotonicity for missing B1 coverage", () => {
  const low = calculateR4SolidDemand({
    planningGuests: 60,
    contractedSolidCategories: ["Petiscos"],
    lambdaIn: 0.35,
  });
  const central = calculateR4SolidDemand({
    planningGuests: 60,
    contractedSolidCategories: ["Petiscos"],
  });
  const high = calculateR4SolidDemand({
    planningGuests: 60,
    contractedSolidCategories: ["Petiscos"],
    lambdaIn: 0.43,
  });
  const qty = (x) => x.categories[0].expectedNaturalQuantity;
  assert.ok(qty(low) < qty(central));
  assert.ok(qty(central) < qty(high));
});

test("R4 recommendation is explicitly shadow and keeps promotion deferred", () => {
  const result = generateR4ShadowRecommendation({
    adults: 60,
    selectedCategories: ["Petiscos", "Mini lanches", "Tortas", "Doces", "Bolos"],
  });
  assert.equal(result.authoritative, false);
  assert.equal(result.productionMutationAllowed, false);
  assert.equal(result.deferred.productionPromotion, true);
  assert.match(result.semanticStatus, /shadow/i);
});

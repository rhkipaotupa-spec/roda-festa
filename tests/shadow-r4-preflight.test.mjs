import test from "node:test";
import assert from "node:assert/strict";
import {
  R4_PREFLIGHT_STATUS,
  R4_ELICITED,
  derivePetiscosReadyGramsPrior,
  deriveReferenceMassVector,
  deriveLambdaInEstimate,
  derivePresentCategories,
  varietyMultiplier,
  categoryPlanningSemantics,
} from "../src/planner/planning-book/engine/shadowR4Preflight.js";

function close(actual, expected, tolerance = 1e-6) {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} != ${expected}`);
}

test("preflight is explicitly non-authoritative and does not claim R4 engine completion", () => {
  assert.equal(R4_PREFLIGHT_STATUS.recommendationEngineImplemented, false);
  assert.equal(R4_PREFLIGHT_STATUS.productionAuthoritative, false);
  assert.equal(R4_PREFLIGHT_STATUS.lambdaInFrozen, false);
});

test("physical petiscos prior uses 40/40/20 and yields 28.6g ready", () => {
  close(derivePetiscosReadyGramsPrior(), 28.6);
});

test("reference midpoint mass vector derives b_adulto 638.4g", () => {
  const result = deriveReferenceMassVector();
  close(result.grams.Petiscos, 185.9);
  close(result.grams["Mini lanches"], 180);
  close(result.grams.Tortas, 70);
  close(result.grams.Doces, 82.5);
  close(result.grams.Bolos, 120);
  close(result.bAdult, 638.4);
});

test("sigma is derived from elicited mass vector and sums to one", () => {
  const { sigma } = deriveReferenceMassVector();
  close(Object.values(sigma).reduce((a, b) => a + b, 0), 1);
  close(sigma.Petiscos, 0.2911967418546366);
  close(sigma["Mini lanches"], 0.2819548872180451);
  close(sigma.Tortas, 0.10964912280701755);
  close(sigma.Doces, 0.1292293233082707);
  close(sigma.Bolos, 0.1879699248120301);
});

test("lambda_out is identified as zero only after Q2-prime varied real presence", () => {
  assert.equal(R4_ELICITED.substitution.lambdaOut, 0);
  assert.match(R4_ELICITED.substitution.lambdaOutBasis, /real absence/i);
});

test("lambda_in is derived but remains explicitly provisional", () => {
  const result = deriveLambdaInEstimate();
  close(result.lambdaIn, 0.3818597589123936);
  assert.equal(result.status, "provisional-derived-not-frozen");
});

test("S_presente is the union of contracted and external categories", () => {
  const result = derivePresentCategories({
    contractedCategories: ["Petiscos"],
    externalCategories: ["Mini lanches", "Bolos"],
  });
  assert.deepEqual(result.present, ["Petiscos", "Mini lanches", "Bolos"]);
});

test("variety saturates at 2+ flavors for Tortas and Bolos", () => {
  close(varietyMultiplier("Tortas", 1), 1);
  close(varietyMultiplier("Tortas", 2), 110 / 70);
  close(varietyMultiplier("Tortas", 8), 110 / 70);
  close(varietyMultiplier("Bolos", 1), 1);
  close(varietyMultiplier("Bolos", 2), 1.25);
  close(varietyMultiplier("Bolos", 8), 1.25);
});

test("variety safety uplift cap is declared at 15 percent", () => {
  close(R4_ELICITED.variety.maxTotalUplift, 0.15);
});

test("mini 1.5 expected to 2 planned remains M-star semantics, not lot quantization", () => {
  const mini = categoryPlanningSemantics("Mini lanches");
  close(mini.expectedNaturalPerAdult, 1.5);
  close(mini.plannedNaturalPerAdult, 2);
  assert.match(mini.note, /not lot quantization/i);
});

test("only-petiscos separates expected 9 from conservative planning 11", () => {
  const p = categoryPlanningSemantics("Petiscos", { onlyB1Petiscos: true });
  close(p.expectedNaturalPerAdult, 9);
  close(p.plannedNaturalPerAdult, 11);
});

test("Tortas vary once and then saturate: 70/70 at one flavor and 110/140 at 2+", () => {
  assert.deepEqual(categoryPlanningSemantics("Tortas", { flavorCount: 1 }), {
    expectedNaturalPerAdult: 70,
    plannedNaturalPerAdult: 70,
    unit: "gram",
  });
  assert.deepEqual(categoryPlanningSemantics("Tortas", { flavorCount: 8 }), {
    expectedNaturalPerAdult: 110,
    plannedNaturalPerAdult: 140,
    unit: "gram",
  });
});

test("Bolos saturate at 150g expected for 2+ and takeaway remains deferred", () => {
  const bolo = categoryPlanningSemantics("Bolos", { flavorCount: 8 });
  close(bolo.expectedNaturalPerAdult, 150);
  close(bolo.plannedNaturalPerAdult, 150);
  assert.match(bolo.takeaway, /deferred/i);
});

test("Doces keep 5 expected/planned while takeaway remains explicit pending", () => {
  const doce = categoryPlanningSemantics("Doces");
  close(doce.expectedNaturalPerAdult, 5);
  close(doce.plannedNaturalPerAdult, 5);
  assert.match(doce.takeaway, /deferred/i);
});

import {
  R4_PREFLIGHT_VERSION,
  R4_PREFLIGHT_STATUS,
  R4_ELICITED,
  derivePetiscosReadyGramsPrior,
  deriveReferenceMassVector,
  deriveLambdaInEstimate,
  derivePresentCategories,
} from "../src/planner/planning-book/engine/shadowR4Preflight.js";

const mass = deriveReferenceMassVector();
const lambda = deriveLambdaInEstimate();
const presentExample = derivePresentCategories({
  contractedCategories: ["Petiscos"],
  externalCategories: ["Mini lanches"],
});

console.log("============================================================");
console.log("R4 PREFLIGHT — checkpoint de especificacao, NAO motor");
console.log("============================================================");
console.log(`Versao: ${R4_PREFLIGHT_VERSION}`);
console.log(`Motor R4 implementado: ${R4_PREFLIGHT_STATUS.recommendationEngineImplemented}`);
console.log(`Autoritativo em Producao: ${R4_PREFLIGHT_STATUS.productionAuthoritative}`);
console.log(`lambda_out identificado: ${R4_PREFLIGHT_STATUS.lambdaOutIdentified} -> ${R4_ELICITED.substitution.lambdaOut}`);
console.log(`lambda_in congelado: ${R4_PREFLIGHT_STATUS.lambdaInFrozen}`);
console.log(`g medio Petiscos prior: ${derivePetiscosReadyGramsPrior().toFixed(1)} g`);
console.log(`b_adulto midpoint: ${mass.bAdult.toFixed(1)} g`);
console.log("sigma midpoint:");
for (const [category, value] of Object.entries(mass.sigma)) {
  console.log(`  - ${category}: ${(value * 100).toFixed(2)}%`);
}
console.log(`lambda_in estimado atual: ${lambda.lambdaIn.toFixed(6)} (${lambda.status})`);
console.log(`S_presente exemplo: ${presentExample.present.join(" + ")}`);
console.log("Takeaway Bolos/Doces: DEFERRED — nao modelado ainda");
console.log("R3 permanece congelada; nenhum caminho de Producao foi alterado.");

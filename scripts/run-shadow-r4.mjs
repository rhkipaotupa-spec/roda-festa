import { generateR4ShadowRecommendation } from "../src/planner/planning-book/engine/shadowRecommendationR4.js";

const cases = [
  {
    label: "Replay A — 60 adultos / 4h / somente Petiscos no B1",
    input: { adults: 60, serviceHours: 4, selectedCategories: ["Petiscos"] },
  },
  {
    label: "Replay B — E=66,1 / P+Mini+Torta / 2 sabores de Torta",
    input: {
      adults: 63,
      olderChildren: 1,
      children: 6,
      serviceHours: 4,
      selectedCategories: ["Petiscos", "Mini lanches", "Tortas"],
      flavorCounts: { Tortas: 2 },
    },
  },
  {
    label: "Replay C — 27 adultos + 15 criancas / menu solido completo",
    input: {
      adults: 27,
      children: 15,
      serviceHours: 4,
      selectedCategories: ["Petiscos", "Mini lanches", "Tortas", "Doces", "Bolos"],
    },
  },
];

console.log("============================================================");
console.log("RF-REC-2 R4 SHADOW — EXECUTABLE / NON-AUTHORITATIVE");
console.log("============================================================");

for (const item of cases) {
  const out = generateR4ShadowRecommendation(item.input);
  console.log(`\n${item.label}`);
  console.log(`E planejamento: ${out.guests.planningGuests}`);
  console.log(`lambda_in: ${out.parameters.lambdaIn}`);
  console.log(`massa esperada realizada/adulto: ${out.solids.expectedMassPerAdultRealized} g`);
  for (const c of out.solids.categories.filter((x) => x.contracted)) {
    const planned = c.naturalUnit === "unit"
      ? `${c.plannedNaturalQuantity} un. (round ${c.plannedRoundedCategoryUnits})`
      : `${c.plannedNaturalQuantity} g (${c.plannedRoundedNominalPortions} porcoes nominais)`;
    console.log(`- ${c.category}: esperado ${c.expectedNaturalQuantity} ${c.naturalUnit}; planejado ${planned}`);
  }
}

console.log("\n[INFO] R4 permanece shadow. Nenhum caminho de Producao foi alterado.");

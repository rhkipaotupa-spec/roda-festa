import { PRODUCTS, generatePlanningSuggestion } from "../src/planner/planning-book/engine/planningRules.js";
import { generateShadowRecommendation } from "../src/planner/planning-book/engine/shadowRecommendationV2.js";

const productCatalog = Object.values(PRODUCTS);

const scenarios = [
  {
    name: "60 adultos · 4h · cardápio completo",
    adults: 60,
    olderChildren: 0,
    children: 0,
    serviceHours: 4,
    selectedProductIds: [
      "pastel-carne",
      "mini-x-burguer",
      "torta-strogonoff-frango",
      "brigadeiro-chocolate",
      "bolo-beatriz",
      "agua-mineral",
      "suco-laranja-200ml",
      "refrigerante-200ml",
    ],
  },
  {
    name: "60 adultos · 4h · somente Petiscos",
    adults: 60,
    olderChildren: 0,
    children: 0,
    serviceHours: 4,
    selectedProductIds: ["pastel-carne"],
  },
  {
    name: "Replay-base real · 60 adultos · 4h · Petiscos + somente refrigerante",
    adults: 60,
    olderChildren: 0,
    children: 0,
    serviceHours: 4,
    selectedProductIds: [
      "coxinha-frango-catupiry",
      "bolinha-queijo",
      "pastel-carne",
      "pastel-queijo",
      "kibe-carne",
      "risoles-presunto-queijo",
      "refrigerante-200ml",
    ],
  },
  {
    name: "60 adultos · 6h · cardápio completo",
    adults: 60,
    olderChildren: 0,
    children: 0,
    serviceHours: 6,
    selectedProductIds: [
      "pastel-carne",
      "mini-x-burguer",
      "torta-strogonoff-frango",
      "brigadeiro-chocolate",
      "bolo-beatriz",
    ],
  },
];

function currency(value) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function liters(value) {
  return `${(Number(value || 0) / 1000).toLocaleString("pt-BR", {
    maximumFractionDigits: 3,
  })} L`;
}

function naturalQuantityLabel(item) {
  if (item.naturalUnit === "gram") {
    return `${(item.plannedNaturalQuantity / 1000).toLocaleString("pt-BR", {
      maximumFractionDigits: 3,
    })} kg planejados`;
  }

  return `${item.plannedRoundedCategoryQuantity.toLocaleString("pt-BR")} un. planejadas`;
}

for (const scenario of scenarios) {
  const includeBeverages = scenario.selectedProductIds.some(
    (id) => PRODUCTS[Object.keys(PRODUCTS).find((key) => PRODUCTS[key].id === id)]?.consignment
  );

  const v1 = generatePlanningSuggestion({
    adults: scenario.adults + scenario.olderChildren,
    children: scenario.children,
    serviceHours: scenario.serviceHours,
    selectedProductIds: scenario.selectedProductIds,
    includeWaiters: false,
    includeDisposables: false,
    includeBeverages,
  });

  const v2 = generateShadowRecommendation({
    adults: scenario.adults,
    olderChildren: scenario.olderChildren,
    children: scenario.children,
    serviceHours: scenario.serviceHours,
    selectedProductIds: scenario.selectedProductIds,
    productCatalog,
  });

  console.log("\n============================================================");
  console.log(scenario.name);
  console.log("============================================================");
  console.log(`V1: ${v1.versions.recommendation} | V2: ${v2.versions.recommendation}`);
  console.log(`Convidados de planejamento V2: ${v2.guests.planningGuests}`);
  console.log(`Multiplicador de substituição V2: ${v2.selection.substitutionMultiplier}`);
  console.log(`Semântica de sólidos V2: ${v2.parameters.solidBaselineSemantics}`);
  console.log(`Buffer sólido adicional V2: ${v2.parameters.additionalSolidServiceBuffer}`);

  console.log("\nRF-REC-1.0.0 — itens:");
  for (const item of v1.items) {
    console.log(`  - ${item.name}: ${item.quantity} ${item.priceUnit || "un."}`);
  }
  console.log(`  Contratado V1: ${currency(v1.investment.total)}`);

  console.log("\nRF-REC-2 alpha shadow R3 — categorias planejadas:");
  for (const item of v2.solids.categories) {
    console.log(`  - ${item.category}: ${naturalQuantityLabel(item)}`);
  }

  if (v2.beverages.requested) {
    console.log("\nBebidas V2 R3:");
    console.log(
      `  - Referência total típica: ${liters(v2.beverages.referenceTotalExpectedConsumptionMl)}`
    );
    console.log(
      `  - Cobertura esperada pelos itens Roda Festa selecionados: ${liters(v2.beverages.expectedConsumptionMl)}`
    );
    console.log(
      `  - Parcela externa/não coberta: ${liters(v2.beverages.externalOrUncoveredExpectedMl)}`
    );
    console.log(
      `  - Estoque Roda Festa a levar (+30% somente sobre a cobertura selecionada): ${liters(v2.beverages.stockToTakeMl)}`
    );

    for (const [productId, entry] of Object.entries(v2.beverages.expectedConsumptionMlBySku)) {
      const stock = v2.beverages.stockToTakeBySku[productId];
      console.log(
        `  - ${productId}: share típico ${(entry.share * 100).toLocaleString("pt-BR", {
          maximumFractionDigits: 1,
        })}% | ${liters(entry.ml)} esperados | ${liters(stock.ml)} a levar`
      );
    }
  }

  console.log("\nBloqueios mantidos:");
  console.log("  - sem alocação final por SKU/lote antes das gramaturas");
  console.log("  - sem alteração do ledger comercial");
  console.log("  - sem promoção para Produção");
}

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

function naturalQuantityLabel(item) {
  if (item.naturalUnit === "gram") {
    return `${(item.expectedNaturalQuantity / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 3 })} kg esperados | ${(item.plannedNaturalQuantity / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 3 })} kg planejados`;
  }
  return `${item.expectedNaturalQuantity.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} un. esperadas | ${item.plannedRoundedCategoryQuantity.toLocaleString("pt-BR")} un. planejadas`;
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
  console.log("\nRF-REC-1.0.0 — itens:");
  for (const item of v1.items) {
    console.log(`  - ${item.name}: ${item.quantity} ${item.priceUnit || "un."}`);
  }
  console.log(`  Contratado V1: ${currency(v1.investment.total)}`);

  console.log("\nRF-REC-2 alpha shadow — categorias:");
  for (const item of v2.solids.categories) {
    console.log(`  - ${item.category}: ${naturalQuantityLabel(item)}`);
  }

  if (v2.beverages.requested) {
    console.log("\nBebidas V2:");
    console.log(`  - Consumo esperado: ${(v2.beverages.expectedConsumptionMl / 1000).toLocaleString("pt-BR")} L`);
    console.log(`  - Estoque a levar (+30%): ${(v2.beverages.stockToTakeMl / 1000).toLocaleString("pt-BR")} L`);
    for (const [productId, entry] of Object.entries(v2.beverages.expectedConsumptionMlBySku)) {
      const stock = v2.beverages.stockToTakeBySku[productId];
      console.log(`  - ${productId}: ${(entry.ml / 1000).toLocaleString("pt-BR")} L esperados | ${(stock.ml / 1000).toLocaleString("pt-BR")} L a levar`);
    }
  }

  console.log("\nBloqueios mantidos:");
  console.log("  - sem alocação final por SKU/lote antes das gramaturas");
  console.log("  - sem alteração do ledger comercial");
  console.log("  - sem promoção para Produção");
}

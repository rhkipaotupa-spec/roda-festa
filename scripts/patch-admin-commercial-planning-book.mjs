import { readFile, writeFile } from "node:fs/promises";

const PLANNING_BOOK = new URL("../src/planner/planning-book/PlanningBook.jsx", import.meta.url);
const RULES = new URL("../src/planner/planning-book/engine/planningRules.js", import.meta.url);

async function replaceOnce(url, replacements) {
  let source = await readFile(url, "utf8");
  for (const [before, after, label] of replacements) {
    const count = source.split(before).length - 1;
    if (count !== 1) {
      throw new Error(`patch_marker_mismatch:${label}:${count}`);
    }
    source = source.replace(before, after);
  }
  await writeFile(url, source, "utf8");
}

await replaceOnce(PLANNING_BOOK, [
  [
    '  { id: "bolos", title: "Bolos", commercialCategory: "Bolos", subtitle: "Porções individuais de 120 g." },\n  { id: "bebidas", title: "Bebidas", commercialCategory: "Bebidas", subtitle: "Em consignação: cobradas apenas conforme o consumo." },',
    '  { id: "bolos", title: "Bolos", commercialCategory: "Bolos", subtitle: "Porções individuais de 120 g." },\n  { id: "tacho", title: "Brigadeiro no tacho", commercialCategory: "Brigadeiro no tacho", subtitle: "80 g por pessoa · chocolate, Leite Ninho ou meio a meio." },\n  { id: "bebidas", title: "Bebidas", commercialCategory: "Bebidas", subtitle: "Em consignação: cobradas apenas conforme o consumo." },',
    "menu-category-tacho",
  ],
  [
    'const CATEGORY_ORDER = ["Petiscos", "Mini lanches", "Tortas", "Doces", "Bolos", "Bebidas"];',
    'const CATEGORY_ORDER = ["Petiscos", "Mini lanches", "Tortas", "Doces", "Bolos", "Brigadeiro no tacho", "Bebidas"];',
    "category-order-tacho",
  ],
  [
    '  if (product.priceUnit === "portion150g") return `${formatCurrency(product.unitPrice)} / 150 g`;\n  if (product.priceUnit === "portion120g") return `${formatCurrency(product.unitPrice)} / 120 g`;',
    '  if (product.priceUnit === "portion150g") return `${formatCurrency(product.unitPrice)} / 150 g`;\n  if (product.priceUnit === "portion120g") return `${formatCurrency(product.unitPrice)} / 120 g`;\n  if (product.priceUnit === "portion80g") return `${formatCurrency(product.unitPrice)} / 80 g`;',
    "price-label-80g",
  ],
  [
    '  if (item.priceUnit === "portion150g") return `${quantity} ${quantity === 1 ? "porção" : "porções"} de 150 g`;\n  if (item.priceUnit === "portion120g") return `${quantity} ${quantity === 1 ? "porção" : "porções"} de 120 g`;',
    '  if (item.priceUnit === "portion150g") return `${quantity} ${quantity === 1 ? "porção" : "porções"} de 150 g`;\n  if (item.priceUnit === "portion120g") return `${quantity} ${quantity === 1 ? "porção" : "porções"} de 120 g`;\n  if (item.priceUnit === "portion80g") return `${quantity} ${quantity === 1 ? "porção" : "porções"} de 80 g`;',
    "quantity-label-80g",
  ],
  [
    '  function toggleProduct(productId) {\n    setSelectedProductIds((current) => current.includes(productId)\n      ? current.filter((id) => id !== productId)\n      : [...current, productId]);\n  }',
    '  function toggleProduct(productId) {\n    const product = PRODUCT_CATALOG.find((item) => item.id === productId);\n    setSelectedProductIds((current) => {\n      if (current.includes(productId)) return current.filter((id) => id !== productId);\n      if (product?.commercialCategory !== "Brigadeiro no tacho") return [...current, productId];\n      const withoutOtherTacho = current.filter((id) =>\n        PRODUCT_CATALOG.find((item) => item.id === id)?.commercialCategory !== "Brigadeiro no tacho"\n      );\n      return [...withoutOtherTacho, productId];\n    });\n  }',
    "single-tacho-selection",
  ],
  [
    '  function addProductToSuggestion(product) {\n    if (!suggestion || suggestion.items.some((item) => item.id === product.id)) return;\n    const lot = Number(product.lotSize) || 1;\n    const suggested = calculateSuggestedProductQuantity({ product, equivalentGuests });\n    const quantity = Math.max(lot, Number(suggested) || lot);',
    '  function addProductToSuggestion(product) {\n    if (!suggestion || suggestion.items.some((item) => item.id === product.id)) return;\n    const existingTacho = product.commercialCategory === "Brigadeiro no tacho"\n      ? suggestion.items.find((item) => item.commercialCategory === "Brigadeiro no tacho")\n      : null;\n    if (existingTacho) {\n      replaceSuggestionItem(existingTacho.id, product);\n      return;\n    }\n    const lot = Number(product.lotSize) || 1;\n    const suggested = product.commercialCategory === "Brigadeiro no tacho"\n      ? realGuests\n      : calculateSuggestedProductQuantity({ product, equivalentGuests });\n    const quantity = Math.max(lot, Number(suggested) || lot);',
    "tacho-add-real-guests",
  ],
]);

await replaceOnce(RULES, [
  [
    '  const cartGroupOrder = [\n    "fried",\n    "hotSandwiches",\n    "beverages",\n  ];',
    '  const cartGroupOrder = [\n    "fried",\n    "hotSandwiches",\n    "beverages",\n    "tacho",\n  ];',
    "tacho-cart-group",
  ],
  [
    '      group.items.push(item);\n      group.totalLoadInHours +=\n        item.quantity / item.productionPerHour;',
    '      group.items.push(item);\n      const measuredCapacity = Number(item.productionPerHour);\n      if (Number.isFinite(measuredCapacity) && measuredCapacity > 0) {\n        group.totalLoadInHours += item.quantity / measuredCapacity;\n      } else {\n        group.capacityUnmeasured = true;\n      }',
    "unmeasured-capacity",
  ],
  [
    '  let cartGroups = cartGroupOrder\n    .filter((groupId) => groupedItems[groupId])\n    .map((groupId) => {\n      const group = groupedItems[groupId];\n      const capacityUsage =\n        operationalHours > 0\n          ? group.totalLoadInHours / operationalHours\n          : 0;\n\n      return {\n        ...group,\n        cartsRequired: 1,\n        capacityUsage,\n        withinPlannedCapacity: capacityUsage <= 1,\n      };\n    });',
    '  if (groupedItems.tacho && groupedItems.beverages) {\n    groupedItems.beverages = {\n      ...groupedItems.beverages,\n      items: [...groupedItems.beverages.items, ...groupedItems.tacho.items],\n      capacityUnmeasured: Boolean(groupedItems.beverages.capacityUnmeasured || groupedItems.tacho.capacityUnmeasured),\n      sharedOperationalGroups: ["beverages", "tacho"],\n    };\n    delete groupedItems.tacho;\n  }\n\n  let cartGroups = cartGroupOrder\n    .filter((groupId) => groupedItems[groupId])\n    .map((groupId) => {\n      const group = groupedItems[groupId];\n      const capacityMeasured = !group.capacityUnmeasured;\n      const capacityUsage = capacityMeasured && operationalHours > 0\n        ? group.totalLoadInHours / operationalHours\n        : null;\n\n      return {\n        ...group,\n        cartsRequired: 1,\n        capacityMeasured,\n        capacityUsage,\n        withinPlannedCapacity: capacityMeasured ? capacityUsage <= 1 : null,\n      };\n    });',
    "tacho-cart-sharing",
  ],
]);

console.log("[GREEN] PlanningBook + cart rules patched for RF-ADMIN-COMMERCIAL-V1");

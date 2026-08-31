import test from "node:test";
import assert from "node:assert/strict";

import { PRODUCTS } from "../src/planner/planning-book/engine/planningRules.js";
import {
  mergeProductCatalogOverrides,
  normalizeProductCatalogRecord,
  productCatalogFingerprint,
} from "../src/planner/planning-book/engine/productCatalog.js";
import { generateR4ProductionSuggestion } from "../src/planner/planning-book/engine/r4ProductionRecommendation.js";
import { rebuildAdminEffectiveSnapshot } from "../api/_lib/admin-quote-revision-domain.js";

function tachoProduct(overrides = {}) {
  return {
    id: "brigadeiro-tacho-chocolate",
    name: "Brigadeiro no tacho - Chocolate",
    description: "Porção de 80 g por pessoa",
    commercialCategory: "Brigadeiro no tacho",
    operationalGroup: "tacho",
    productionPerHour: null,
    suggestedUnitsPerEquivalentGuest: 1,
    lotSize: 1,
    unitPrice: 12,
    priceUnit: "portion80g",
    portionGrams: 80,
    active: true,
    consignment: false,
    countsAsMainCart: true,
    ...overrides,
  };
}

test("catálogo aceita tacho com capacidade ainda não medida e contrato fixo de 80 g", () => {
  const product = normalizeProductCatalogRecord(tachoProduct());
  assert.equal(product.productionPerHour, null);
  assert.equal(product.portionGrams, 80);
  assert.equal(product.priceUnit, "portion80g");
  assert.equal(product.unitPrice, 12);
});

test("catálogo rejeita tacho fora do contrato de 80 g", () => {
  assert.throws(
    () => normalizeProductCatalogRecord(tachoProduct({ portionGrams: 100 })),
    /product_catalog_invalid_tacho_contract/,
  );
});

test("fingerprint do catálogo é estável por ordem e muda quando preço muda", () => {
  const catalog = [
    normalizeProductCatalogRecord(tachoProduct()),
    normalizeProductCatalogRecord(Object.values(PRODUCTS)[0]),
  ];
  assert.equal(productCatalogFingerprint(catalog), productCatalogFingerprint([...catalog].reverse()));
  const changed = catalog.map((product) => product.id === "brigadeiro-tacho-chocolate"
    ? { ...product, unitPrice: 13 }
    : product);
  assert.notEqual(productCatalogFingerprint(catalog), productCatalogFingerprint(changed));
});

test("override persistente substitui preço/capacidade sem apagar produtos base", () => {
  const coxinha = Object.values(PRODUCTS).find((product) => product.id === "coxinha-frango-catupiry");
  const merged = mergeProductCatalogOverrides([
    { productData: { ...coxinha, unitPrice: 1.75, productionPerHour: 135 }, active: true },
    { productData: tachoProduct(), active: true },
  ]);
  const byId = new Map(merged.map((product) => [product.id, product]));
  assert.equal(byId.get("coxinha-frango-catupiry").unitPrice, 1.75);
  assert.equal(byId.get("coxinha-frango-catupiry").productionPerHour, 135);
  assert.equal(byId.get("brigadeiro-tacho-chocolate").unitPrice, 12);
  assert.ok(byId.get("agua-mineral"));
});

test("RF-REC-2 recomenda 80 g de tacho por convidado real e cria carrinho exclusivo sem bebidas", () => {
  const catalog = [...Object.values(PRODUCTS), normalizeProductCatalogRecord(tachoProduct())];
  const suggestion = generateR4ProductionSuggestion({
    adults: 10,
    olderChildren: 0,
    children: 2,
    serviceHours: 4,
    selectedProductIds: ["coxinha-frango-catupiry", "brigadeiro-tacho-chocolate"],
    productCatalog: catalog,
  });
  const tacho = suggestion.items.find((item) => item.id === "brigadeiro-tacho-chocolate");
  assert.equal(tacho.quantity, 12);
  assert.equal(tacho.estimatedValue, 144);
  assert.equal(suggestion.carts.tachoCartRule, "exclusive-without-beverages");
  assert.equal(suggestion.carts.totalCarts, 2);
});

test("tacho compartilha carrinho com bebidas quando bebidas estão selecionadas", () => {
  const catalog = [...Object.values(PRODUCTS), normalizeProductCatalogRecord(tachoProduct())];
  const suggestion = generateR4ProductionSuggestion({
    adults: 10,
    serviceHours: 4,
    selectedProductIds: [
      "coxinha-frango-catupiry",
      "agua-mineral",
      "brigadeiro-tacho-chocolate",
    ],
    includeBeverages: true,
    productCatalog: catalog,
  });
  assert.equal(suggestion.carts.tachoCartRule, "shared-with-beverages");
  assert.equal(suggestion.carts.totalCarts, 2);
  assert.equal(suggestion.recommendationMeta.tacho.quantity, 10);
});

test("revisão Admin preserva preço histórico existente e usa preço atual só para item novo", () => {
  const baseCoxinha = Object.values(PRODUCTS).find((product) => product.id === "coxinha-frango-catupiry");
  const catalog = [
    ...Object.values(PRODUCTS).map((product) => product.id === baseCoxinha.id
      ? { ...product, unitPrice: 1.75 }
      : product),
    normalizeProductCatalogRecord(tachoProduct()),
  ];
  const baseSnapshot = {
    code: "RF-260831-00001",
    adults: 10,
    olderChildren: 0,
    children: 0,
    duration: 4,
    items: [{
      ...baseCoxinha,
      quantity: 25,
      unitPrice: 1.5,
      estimatedValue: 37.5,
    }],
    includeDisposables: false,
    waiters: 0,
  };

  const revised = rebuildAdminEffectiveSnapshot({
    baseSnapshot,
    requestedItems: [
      { id: baseCoxinha.id, quantity: 25 },
      { id: "brigadeiro-tacho-chocolate", quantity: 10 },
    ],
    includeWaiters: false,
    includeDisposables: false,
    productCatalog: catalog,
    now: new Date("2026-08-31T12:00:00Z"),
  });

  const byId = new Map(revised.items.map((item) => [item.id, item]));
  assert.equal(byId.get(baseCoxinha.id).unitPrice, 1.5);
  assert.equal(byId.get("brigadeiro-tacho-chocolate").unitPrice, 12);
  assert.equal(revised.adminOperational.carts.tachoCartRule, "exclusive-without-beverages");
  assert.equal(revised.commercialReconciliation.ok, true);
});

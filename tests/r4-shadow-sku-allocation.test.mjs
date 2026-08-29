import test from "node:test";
import assert from "node:assert/strict";

import {
  R4_SKU_ALLOCATION_POLICY,
  allocateR4ShadowSkus,
} from "../src/planner/planning-book/engine/shadowR4SkuAllocation.js";

const catalog = [
  { id: "cox", name: "Coxinha", commercialCategory: "Petiscos", lotSize: 25, active: true },
  { id: "bol", name: "Bolinha", commercialCategory: "Petiscos", lotSize: 25, active: true },
  { id: "pas", name: "Pastel", commercialCategory: "Petiscos", lotSize: 10, active: true },
  { id: "t1", name: "Torta 1", commercialCategory: "Tortas", lotSize: 1, active: true },
  { id: "t2", name: "Torta 2", commercialCategory: "Tortas", lotSize: 1, active: true },
];

function recommendation(categories) {
  return { solids: { categories } };
}

test("preview allocation is explicitly non-authoritative", () => {
  assert.equal(R4_SKU_ALLOCATION_POLICY.authoritative, false);
  assert.equal(R4_SKU_ALLOCATION_POLICY.productionMutationAllowed, false);
  assert.match(R4_SKU_ALLOCATION_POLICY.strategy, /equal-share-lot-aware/);
});

test("unit allocation preserves the category target when selected lots make it reachable", () => {
  const out = allocateR4ShadowSkus({
    recommendation: recommendation([
      {
        category: "Petiscos",
        contracted: true,
        naturalUnit: "unit",
        plannedNaturalQuantity: 455,
        plannedRoundedCategoryUnits: 455,
      },
    ]),
    selectedProductIds: ["cox", "bol", "pas"],
    productCatalog: catalog,
  });

  const category = out.categories[0];
  assert.equal(category.status, "allocated-preview");
  assert.equal(category.allocatedCommercialUnits, 455);
  assert.equal(category.overageCommercialUnits, 0);
  assert.equal(category.items.reduce((sum, item) => sum + item.quantity, 0), 455);
  for (const item of category.items) {
    assert.ok(item.quantity > 0);
    assert.equal(item.quantity % item.lotSize, 0);
  }
});

test("allocator minimizes commercial overage before balancing equal shares", () => {
  const out = allocateR4ShadowSkus({
    recommendation: recommendation([
      {
        category: "Petiscos",
        contracted: true,
        naturalUnit: "unit",
        plannedNaturalQuantity: 454,
        plannedRoundedCategoryUnits: 454,
      },
    ]),
    selectedProductIds: ["cox", "bol", "pas"],
    productCatalog: catalog,
  });
  const category = out.categories[0];
  assert.equal(category.allocatedCommercialUnits, 455);
  assert.equal(category.overageCommercialUnits, 1);
});

test("nominal portions split evenly when two torta SKUs are selected", () => {
  const out = allocateR4ShadowSkus({
    recommendation: recommendation([
      {
        category: "Tortas",
        contracted: true,
        naturalUnit: "gram",
        plannedNaturalQuantity: 9800,
        plannedRoundedNominalPortions: 66,
        nominalPortionGrams: 150,
      },
    ]),
    selectedProductIds: ["t1", "t2"],
    productCatalog: catalog,
  });

  const category = out.categories[0];
  assert.deepEqual(category.items.map((item) => item.quantity), [33, 33]);
  assert.equal(category.allocatedCommercialUnits, 66);
  assert.equal(category.allocatedGrams, 9900);
  assert.equal(category.overageGrams, 100);
});

test("a contracted category without selected SKU remains visibly pending", () => {
  const out = allocateR4ShadowSkus({
    recommendation: recommendation([
      {
        category: "Petiscos",
        contracted: true,
        naturalUnit: "unit",
        plannedNaturalQuantity: 455,
        plannedRoundedCategoryUnits: 455,
      },
    ]),
    selectedProductIds: [],
    productCatalog: catalog,
  });

  assert.equal(out.categories[0].status, "needs-sku-selection");
  assert.equal(out.warnings.length, 1);
});

test("selection order does not change the product quantities attached to each SKU", () => {
  const input = recommendation([
    {
      category: "Petiscos",
      contracted: true,
      naturalUnit: "unit",
      plannedNaturalQuantity: 660,
      plannedRoundedCategoryUnits: 660,
    },
  ]);
  const a = allocateR4ShadowSkus({
    recommendation: input,
    selectedProductIds: ["cox", "bol", "pas"],
    productCatalog: catalog,
  });
  const b = allocateR4ShadowSkus({
    recommendation: input,
    selectedProductIds: ["pas", "cox", "bol"],
    productCatalog: catalog,
  });
  assert.deepEqual(a.categories[0].items, b.categories[0].items);
});

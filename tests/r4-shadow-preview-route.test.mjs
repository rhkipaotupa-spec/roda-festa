import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const routes = fs.readFileSync("src/routes/AppRoutes.jsx", "utf8");
const runtimePlanningBook = fs.readFileSync("src/planner/planning-book/RuntimePlanningBook.jsx", "utf8");
const preview = fs.readFileSync("src/planner/planning-book/R4ShadowPreview.jsx", "utf8");
const allocator = fs.readFileSync("src/planner/planning-book/engine/shadowR4SkuAllocation.js", "utf8");
const planningBook = fs.readFileSync("src/planner/planning-book/PlanningBook.jsx", "utf8");

test("R4 visual preview keeps a dedicated route without replacing authoritative PlanningBook", () => {
  assert.match(routes, /path="\/r4-preview"/);
  assert.match(routes, /element=\{<R4ShadowPreview\s*\/>\}/);
  assert.match(routes, /path="\/planning-book"[\s\S]*element=\{<RuntimePlanningBook\s*\/>\}/);
  assert.match(runtimePlanningBook, /import\("\.\/PlanningBook\.jsx"\)/);
  assert.match(runtimePlanningBook, /\/api\/product-catalog/);
});

test("R4 preview calls the executable shadow engine and preview-only SKU allocator", () => {
  assert.match(preview, /generateR4ShadowRecommendation/);
  assert.match(preview, /shadowRecommendationR4/);
  assert.match(preview, /allocateR4ShadowSkus/);
  assert.match(preview, /shadowR4SkuAllocation/);
  assert.doesNotMatch(preview, /generatePlanningSuggestion/);
});

test("R4 preview lets the operator select actual solid SKUs", () => {
  assert.match(preview, /SOLID_PRODUCTS_BY_CATEGORY/);
  assert.match(preview, /selectedSolidProductIds/);
  assert.match(preview, /toggleSolidSku/);
  assert.match(preview, /SKUs selecionados/);
});

test("torta and bolo variety are derived from selected SKUs instead of a detached flavor selector", () => {
  assert.match(preview, /selectedFlavorCount\("Tortas"\)/);
  assert.match(preview, /selectedFlavorCount\("Bolos"\)/);
  assert.doesNotMatch(preview, /setTortaFlavors/);
  assert.doesNotMatch(preview, /setBoloFlavors/);
});

test("SKU allocation stays neutral, lot-aware and non-authoritative", () => {
  assert.match(allocator, /equal-share-lot-aware-minimum-overage/);
  assert.match(allocator, /productionMutationAllowed:\s*false/);
  assert.match(allocator, /authoritative:\s*false/);
  assert.doesNotMatch(allocator, /suggestedUnitsPerEquivalentGuest/);
});

test("R4 preview cannot persist or finalize a planning session", () => {
  assert.doesNotMatch(preview, /planningSessionClient/);
  assert.doesNotMatch(preview, /startPlanningSession/);
  assert.doesNotMatch(preview, /recordPlanningChanges/);
  assert.doesNotMatch(preview, /finalizePlanningSession/);
});

test("authoritative PlanningBook remains disconnected from R4 shadow", () => {
  assert.doesNotMatch(planningBook, /shadowRecommendationR4/);
  assert.doesNotMatch(planningBook, /generateR4ShadowRecommendation/);
  assert.doesNotMatch(planningBook, /shadowR4SkuAllocation/);
});

test("preview keeps the non-production boundary explicit", () => {
  assert.match(preview, /N.O PRODU..O/);
  assert.match(preview, /n&atilde;o grava cliente/i);
  assert.match(preview, /preview neutro/i);
  assert.match(preview, /n&atilde;o gera proposta comercial/i);
});

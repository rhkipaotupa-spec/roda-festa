import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

function source(path) {
  return fs.readFileSync(path, "utf8");
}

test("Produtos oferece visão global recolhível por categoria", () => {
  const products = source("src/admin/AdminProductsView.jsx");
  const css = source("src/admin/AdminProductsCatalog.css");

  assert.ok(products.includes("expandedCategories"));
  assert.ok(products.includes("aria-expanded={expanded}"));
  assert.ok(products.includes("Expandir todas"));
  assert.ok(products.includes("Recolher todas"));
  assert.ok(products.includes("searchActive || expandedCategories.includes(category)"));
  assert.ok(css.includes("rf-product-category__chevron"));
  assert.ok(css.includes("rf-product-category.is-expanded"));
});

test("Cabeçalho de categoria mostra indicadores compactos", () => {
  const products = source("src/admin/AdminProductsView.jsx");
  const css = source("src/admin/AdminProductsCatalog.css");

  assert.ok(products.includes("categoryMetrics"));
  assert.ok(products.includes("activeLabel"));
  assert.ok(products.includes("priceLabel"));
  assert.ok(products.includes("lotLabel"));
  assert.ok(products.includes("rf-product-category__indicators"));
  assert.ok(css.includes("rf-product-category__indicator"));
});

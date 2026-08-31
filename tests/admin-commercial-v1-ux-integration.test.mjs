import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

function source(path) {
  return fs.readFileSync(path, "utf8");
}

test("Admin integra Pedidos e Produtos no shell principal", () => {
  const workspace = source("src/admin/AdminWorkspace.jsx");
  const login = source("src/admin/AdminLogin.jsx");

  assert.ok(workspace.includes('data-admin-section="orders"'));
  assert.ok(workspace.includes('data-admin-section="products"'));
  assert.ok(workspace.includes("<AdminProductsView embedded />"));
  assert.ok(workspace.includes("<AdminQuoteEditIndex embedded />"));
  assert.ok(login.includes('products: "products"'));
  assert.ok(login.includes('"quote-edit-index": "orders"'));
  assert.ok(!login.includes("rf-admin-commercial-shortcuts"));
});

test("Produtos usa editor em drawer no shell integrado", () => {
  const products = source("src/admin/AdminProductsView.jsx");
  const css = source("src/admin/AdminCommercialIntegrated.css");

  assert.ok(products.includes("editorOpen"));
  assert.ok(products.includes("rf-commercial-drawer-backdrop"));
  assert.ok(products.includes("setEditorOpen(true)"));
  assert.ok(css.includes("rf-commercial-editor.is-open"));
});

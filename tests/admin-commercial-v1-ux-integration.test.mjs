import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

function source(path) {
  return fs.readFileSync(path, "utf8");
}

test("Admin integra revisao de orcamentos e Produtos no shell principal", () => {
  const workspace = source("src/admin/AdminWorkspace.jsx");
  const login = source("src/admin/AdminLogin.jsx");

  assert.ok(!workspace.includes('data-admin-section="orders"'));
  assert.ok(workspace.includes('data-admin-section="products"'));
  assert.ok(workspace.includes("<AdminProductsView embedded />"));
  assert.ok(workspace.includes("<AdminQuoteEditView sessionId={editSessionId} embedded />"));
  assert.ok(login.includes('products: "products"'));
  assert.ok(login.includes('"quote-edit-index": "quotes"'));
  assert.ok(login.includes('"quote-edit": "quotes"'));
  assert.ok(!login.includes("rf-admin-commercial-shortcuts"));
});

test("Orcamentos centraliza edicao administrativa e historico mensal", () => {
  const workspace = source("src/admin/AdminWorkspace.jsx");
  const history = source("src/admin/adminQuoteHistory.js");
  const css = source("src/admin/AdminQuoteHistory.css");

  assert.ok(workspace.includes("groupQuotesByEventMonth"));
  assert.ok(workspace.includes("Expandir todos"));
  assert.ok(workspace.includes("Recolher todos"));
  assert.ok(workspace.includes("Editar orçamento"));
  assert.ok(workspace.includes("rf-admin-quote-month"));
  assert.ok(history.includes("Setembro"));
  assert.ok(css.includes("rf-admin-quote-month__header"));
});

test("Produtos usa editor em drawer no shell integrado", () => {
  const products = source("src/admin/AdminProductsView.jsx");
  const css = source("src/admin/AdminCommercialIntegrated.css");

  assert.ok(products.includes("editorOpen"));
  assert.ok(products.includes("rf-commercial-drawer-backdrop"));
  assert.ok(products.includes("setEditorOpen(true)"));
  assert.ok(css.includes("rf-commercial-editor.is-open"));
});

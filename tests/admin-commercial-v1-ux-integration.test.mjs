import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

function source(path) { return fs.readFileSync(path, "utf8"); }

test("Admin integra Pedidos e Produtos no shell principal", () => {
  const workspace = source("src/admin/AdminWorkspace.jsx");
  const login = source("src/admin/AdminLogin.jsx");
  assert.match(workspace, /data-admin-section="orders"/);
  assert.match(workspace, /data-admin-section="products"/);
  assert.match(workspace, /<AdminProductsView embedded />/);
  assert.match(workspace, /<AdminQuoteEditIndex embedded />/);
  assert.match(login, /products: "products"/);
  assert.match(login, /"quote-edit-index": "orders"/);
  assert.doesNotMatch(login, /rf-admin-commercial-shortcuts/);
});

test("Produtos usa editor em drawer no shell integrado", () => {
  const products = source("src/admin/AdminProductsView.jsx");
  const css = source("src/admin/AdminCommercialIntegrated.css");
  assert.match(products, /editorOpen/);
  assert.match(products, /rf-commercial-drawer-backdrop/);
  assert.match(products, /setEditorOpen(true)/);
  assert.match(css, /rf-commercial-editor.is-open/);
});

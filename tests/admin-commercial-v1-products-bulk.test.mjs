import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import { createAdminProductsHttpHandler } from "../api/admin-products.js";

function responseRecorder() {
  const headers = new Map();
  return {
    statusCode: 0,
    body: "",
    setHeader(name, value) {
      headers.set(String(name).toLowerCase(), value);
    },
    end(value) {
      this.body = String(value ?? "");
    },
    json() {
      return JSON.parse(this.body);
    },
    getHeader(name) {
      return headers.get(String(name).toLowerCase());
    },
  };
}

function authenticatedHandler({ bulkUpdateByCategory } = {}) {
  return createAdminProductsHttpHandler({
    authenticationComposition: {
      authenticate: async () => ({
        principal: {
          userId: "owner-1",
          role: "OWNER",
          capabilities: [],
          active: true,
        },
      }),
    },
    authorizationBoundary: {
      assert(principal) {
        assert.equal(principal.role, "OWNER");
        return true;
      },
    },
    catalogStore: {
      listCatalog: async () => [],
      upsert: async () => null,
      setActive: async () => null,
      bulkUpdateByCategory: bulkUpdateByCategory || (async () => null),
    },
    trustedMutationRequest: () => true,
  });
}

test("bulk update de categoria passa somente categoria e campos selecionados ao store", async () => {
  const calls = [];
  const handler = authenticatedHandler({
    bulkUpdateByCategory: async (input) => {
      calls.push(input);
      return {
        commercialCategory: input.commercialCategory,
        updatedCount: 4,
        productIds: ["a", "b", "c", "d"],
        revisions: [],
      };
    },
  });
  const response = responseRecorder();

  await handler({
    method: "POST",
    headers: { cookie: "rf_admin_session=opaque" },
    body: {
      action: "BULK_UPDATE",
      commercialCategory: "Petiscos",
      updates: { unitPrice: 1.8, lotSize: 25 },
    },
  }, response);

  assert.equal(response.statusCode, 200);
  assert.equal(response.json().updatedCount, 4);
  assert.deepEqual(calls, [{
    commercialCategory: "Petiscos",
    updates: { unitPrice: 1.8, lotSize: 25 },
    actorUserId: "owner-1",
  }]);
});

test("bulk update continua protegido pela fronteira de mutacao confiavel", async () => {
  const handler = createAdminProductsHttpHandler({
    authenticationComposition: {
      authenticate: async () => ({ principal: { userId: "owner-1", role: "OWNER" } }),
    },
    authorizationBoundary: { assert: () => true },
    catalogStore: {
      listCatalog: async () => [],
      upsert: async () => null,
      setActive: async () => null,
      bulkUpdateByCategory: async () => {
        throw new Error("should_not_run");
      },
    },
    trustedMutationRequest: () => false,
  });
  const response = responseRecorder();

  await handler({
    method: "POST",
    headers: { cookie: "rf_admin_session=opaque" },
    body: {
      action: "BULK_UPDATE",
      commercialCategory: "Petiscos",
      updates: { unitPrice: 1.8 },
    },
  }, response);

  assert.equal(response.statusCode, 403);
  assert.deepEqual(response.json(), { ok: false, error: "request_not_allowed" });
});

test("UX de Produtos agrupa por categoria e oferece edicao em massa sem remover editor individual", () => {
  const products = fs.readFileSync("src/admin/AdminProductsView.jsx", "utf8");
  const css = fs.readFileSync("src/admin/AdminProductsCatalog.css", "utf8");

  assert.ok(products.includes("groupedProducts"));
  assert.ok(products.includes("rf-product-category"));
  assert.ok(products.includes("Editar categoria"));
  assert.ok(products.includes('action: "BULK_UPDATE"'));
  assert.ok(products.includes("Cada produto receberá uma nova revisão histórica"));
  assert.ok(products.includes("editProduct(product)"));
  assert.ok(css.includes("rf-commercial-create-product"));
  assert.ok(css.includes("background: #5c3b2d !important"));
});

test("Produtos e Pedidos escondem CTA global de novo orcamento quando superficie comercial esta aberta", () => {
  const css = fs.readFileSync("src/admin/AdminProductsCatalog.css", "utf8");
  assert.ok(css.includes(".rf-admin-workspace:has(.rf-commercial-page--embedded) .rf-admin-new-quote"));
});

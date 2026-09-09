import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import { createProductCatalogHttpHandler, toPublicProduct } from "../api/product-catalog.js";

function source(relative) {
  return fs.readFileSync(new URL(`../${relative}`, import.meta.url), "utf8");
}

function fakeResponse() {
  return {
    statusCode: 0,
    headers: {},
    body: "",
    setHeader(name, value) { this.headers[name] = value; },
    end(value) { this.body = String(value || ""); },
  };
}

test("institutional header anchors have real section ids", () => {
  const header = source("src/components/Layout/Header/Header.jsx");
  const sceneTwo = source("src/scenes/SceneTwo/SceneTwo.jsx");
  const sceneFive = source("src/scenes/SceneFive/SceneFive.jsx");
  const sceneSix = source("src/scenes/SceneSix/SceneSix.jsx");
  const contact = source("src/scenes/SceneContact/SceneContact.jsx");
  assert.match(header, /href="#como-funciona"/);
  assert.match(header, /href="#eventos"/);
  assert.match(header, /href="#cardapio"/);
  assert.match(header, /href="#contato"/);
  assert.match(sceneTwo, /id="como-funciona"/);
  assert.match(sceneFive, /id="eventos"/);
  assert.match(sceneSix, /id="cardapio"/);
  assert.match(contact, /id="contato"/);
});

test("primary planning CTAs still point to Planning Book", () => {
  for (const file of [
    "src/components/Layout/Header/Header.jsx",
    "src/scenes/SceneOne/SceneOne.jsx",
    "src/scenes/SceneSix/SceneSix.jsx",
    "src/scenes/SceneContact/SceneContact.jsx",
  ]) {
    assert.match(source(file), /href="\/planning-book"/);
  }
});

test("public product DTO excludes operational/internal catalog fields", () => {
  const publicProduct = toPublicProduct({
    id: "x",
    name: "Produto",
    description: "Descrição",
    commercialCategory: "Petiscos",
    operationalGroup: "fried",
    productionPerHour: 120,
    suggestedUnitsPerEquivalentGuest: 3,
    countsAsMainCart: true,
    lotSize: 25,
    unitPrice: 1.5,
    active: true,
  });
  assert.equal(publicProduct.name, "Produto");
  assert.equal("operationalGroup" in publicProduct, false);
  assert.equal("productionPerHour" in publicProduct, false);
  assert.equal("suggestedUnitsPerEquivalentGuest" in publicProduct, false);
  assert.equal("countsAsMainCart" in publicProduct, false);
});

test("public catalog handler emits sanitized products", async () => {
  const handler = createProductCatalogHttpHandler({
    catalogStore: { async listCatalog() { return [{ id: "x", name: "Produto", commercialCategory: "Petiscos", operationalGroup: "fried", productionPerHour: 120, lotSize: 25, unitPrice: 1.5, active: true }]; } },
  });
  const response = fakeResponse();
  await handler({ method: "GET" }, response);
  const payload = JSON.parse(response.body);
  assert.equal(response.statusCode, 200);
  assert.equal(payload.ok, true);
  assert.equal(payload.products[0].name, "Produto");
  assert.equal("productionPerHour" in payload.products[0], false);
});

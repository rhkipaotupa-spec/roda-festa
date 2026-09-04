import test from "node:test";
import assert from "node:assert/strict";

import {
  buildConciergeInstructions,
  findCuratedAnswer,
  shouldEscalateToHuman,
} from "../api/_lib/concierge-knowledge.js";
import { createConciergeHttpHandler } from "../api/concierge.js";

function responseRecorder() {
  return {
    statusCode: 200,
    headers: {},
    body: "",
    setHeader(name, value) { this.headers[name.toLowerCase()] = value; },
    end(value = "") { this.body += value; },
  };
}

function request({ method = "POST", body = {}, origin, host = "roda-festa.test", ip = "127.0.0.1" } = {}) {
  return {
    method,
    body,
    headers: {
      host,
      ...(origin ? { origin } : {}),
      "x-forwarded-for": ip,
    },
  };
}

function fakeCatalogStore(products = []) {
  return { async listCatalog() { return products; } };
}

test("concierge escalates human-only commercial topics", () => {
  assert.equal(shouldEscalateToHuman("Tem desconto para pagamento à vista?"), true);
  assert.equal(shouldEscalateToHuman("Essa data está disponível?"), true);
  assert.equal(shouldEscalateToHuman("Como funciona a consignação?"), false);
});

test("concierge has curated safe answers for frequent questions", () => {
  assert.match(findCuratedAnswer("Criança conta na quantidade?"), /0 a 6 anos/i);
  assert.match(findCuratedAnswer("Como funciona a consignação?"), /variável conforme o consumo/i);
  assert.match(findCuratedAnswer("Me fala do brigadeiro no tacho"), /80 g por pessoa real/i);
});

test("concierge instructions preserve commercial authority boundary", () => {
  const instructions = buildConciergeInstructions({
    pageContext: "planning-book",
    products: [{ id: "x", name: "Produto X", commercialCategory: "Teste", unitPrice: 10, active: true }],
  });
  assert.match(instructions, /Nunca invente preço/i);
  assert.match(instructions, /Produto X/);
  assert.doesNotMatch(instructions, /SUPABASE_SERVICE_ROLE_KEY|DATABASE_URL|RESEND_API_KEY/);
});

test("concierge only accepts POST", async () => {
  const handler = createConciergeHttpHandler({ catalogStore: fakeCatalogStore(), env: {} });
  const response = responseRecorder();
  await handler(request({ method: "GET" }), response);
  assert.equal(response.statusCode, 405);
  assert.equal(JSON.parse(response.body).error, "method_not_allowed");
});

test("concierge blocks cross-origin request before AI execution", async () => {
  let aiCalls = 0;
  const handler = createConciergeHttpHandler({
    catalogStore: fakeCatalogStore(),
    env: { OPENAI_API_KEY: "test-only-not-real" },
    openAIRequest: async () => { aiCalls += 1; return "não deveria chamar"; },
  });
  const response = responseRecorder();
  await handler(request({
    body: { message: "Olá" },
    origin: "https://evil.example",
    host: "roda-festa.test",
    ip: "10.0.0.2",
  }), response);
  assert.equal(response.statusCode, 403);
  assert.equal(aiCalls, 0);
});

test("concierge works in curated mode without provider key", async () => {
  const handler = createConciergeHttpHandler({ catalogStore: fakeCatalogStore(), env: {} });
  const response = responseRecorder();
  await handler(request({
    body: { message: "Criança conta na quantidade?", history: [] },
    origin: "https://roda-festa.test",
    ip: "10.0.0.3",
  }), response);
  assert.equal(response.statusCode, 200);
  const payload = JSON.parse(response.body);
  assert.equal(payload.ok, true);
  assert.equal(payload.mode, "curated");
  assert.equal(payload.needsHuman, false);
});

test("concierge fails safe without provider key on unknown question", async () => {
  const handler = createConciergeHttpHandler({ catalogStore: fakeCatalogStore(), env: {} });
  const response = responseRecorder();
  await handler(request({
    body: { message: "Vocês fazem uma montagem totalmente diferente no interior?" },
    origin: "https://roda-festa.test",
    ip: "10.0.0.4",
  }), response);
  const payload = JSON.parse(response.body);
  assert.equal(payload.mode, "safe-fallback");
  assert.equal(payload.needsHuman, true);
  assert.match(payload.reply, /não tenho confirmação segura/i);
});

test("concierge AI receives only curated public catalog fields", async () => {
  let captured = null;
  const handler = createConciergeHttpHandler({
    catalogStore: fakeCatalogStore([
      {
        id: "coxinha",
        name: "Coxinha",
        commercialCategory: "Petiscos",
        unitPrice: 1.5,
        lotSize: 25,
        active: true,
        internalSecret: "do-not-send",
      },
    ]),
    env: { OPENAI_API_KEY: "test-only-not-real", RODA_FESTA_CONCIERGE_MODEL: "test-model" },
    openAIRequest: async (args) => {
      captured = args;
      return "Temos Coxinha no catálogo atual.";
    },
  });
  const response = responseRecorder();
  await handler(request({
    body: { message: "Vocês têm coxinha?", history: [] },
    origin: "https://roda-festa.test",
    ip: "10.0.0.5",
  }), response);
  const payload = JSON.parse(response.body);
  assert.equal(payload.mode, "ai");
  assert.match(captured.instructions, /Coxinha/);
  assert.doesNotMatch(captured.instructions, /do-not-send/);
  assert.equal(captured.model, "test-model");
});

import test from "node:test";
import assert from "node:assert/strict";

import { createConciergeHttpHandler } from "../api/concierge.js";

function responseRecorder() {
  return {
    statusCode: 200,
    headers: {},
    body: "",
    setHeader(name, value) { this.headers[String(name).toLowerCase()] = value; },
    end(value = "") { this.body += value; },
  };
}

function request({ message, history = [], ip }) {
  return {
    method: "POST",
    body: { message, history },
    headers: {
      host: "roda-festa.test",
      origin: "https://roda-festa.test",
      "x-forwarded-for": ip,
    },
  };
}

function fakeCatalogStore() {
  return {
    async listCatalog() {
      return [
        { id: "coxinha", name: "Coxinha de frango com catupiry", commercialCategory: "Petiscos", unitPrice: 1.5, active: true },
        { id: "kibe", name: "Kibe", commercialCategory: "Petiscos", unitPrice: 1.5, active: true },
        { id: "bolinha", name: "Bolinha de queijo", commercialCategory: "Petiscos", unitPrice: 1.5, active: true },
        { id: "enroladinho", name: "Enroladinho de salsicha", commercialCategory: "Petiscos", unitPrice: 1.5, active: true },
        { id: "agua", name: "Água mineral sem gás", commercialCategory: "Bebidas", unitPrice: 2.5, active: true },
      ];
    },
  };
}

async function runCase({ message, history = [], aiReply = "Agora respondi diretamente à pergunta anterior.", ip }) {
  let aiCalls = 0;
  const handler = createConciergeHttpHandler({
    catalogStore: fakeCatalogStore(),
    env: { OPENAI_API_KEY: "test-only-not-real" },
    openAIRequest: async () => {
      aiCalls += 1;
      return aiReply;
    },
  });
  const response = responseRecorder();
  await handler(request({ message, history, ip }), response);
  return { payload: JSON.parse(response.body), aiCalls };
}

test("natural requests for a human immediately show the official handoff", async () => {
  const cases = [
    "alguem pode me ajudar?",
    "entendi, mas queria falar com humano",
    "queria falar com uma pessoa",
    "como falo com o responsável?",
  ];

  for (const [index, message] of cases.entries()) {
    const { payload, aiCalls } = await runCase({ message, ip: `10.40.0.${index + 1}` });
    assert.equal(payload.mode, "handoff", message);
    assert.equal(payload.needsHuman, true, message);
    assert.equal(payload.actions?.[0]?.type, "whatsapp", message);
    assert.match(payload.reply, /99896-0208/, message);
    assert.equal(aiCalls, 0, message);
  }
});

test("pairing question about coxinha answers the pairing instead of dumping the catalog", async () => {
  const { payload, aiCalls } = await runCase({
    message: "e qual salgado combina mais com coxinha?",
    ip: "10.40.1.1",
  });

  assert.equal(payload.mode, "catalog-suggestion");
  assert.equal(payload.needsHuman, false);
  assert.match(payload.reply, /Kibe|Bolinha de queijo|Enroladinho de salsicha/);
  assert.doesNotMatch(payload.reply, /Bebidas:/);
  assert.equal(aiCalls, 0);
});

test("negative feedback after a public conversation is acknowledged instead of scope-blocked", async () => {
  const { payload, aiCalls } = await runCase({
    message: "finalmente me deu essa opção, demorou",
    history: [{ role: "user", content: "tem doces?" }],
    ip: "10.40.2.1",
  });

  assert.equal(payload.mode, "conversation-feedback");
  assert.equal(payload.needsHuman, false);
  assert.match(payload.reply, /mais direto/i);
  assert.equal(aiCalls, 0);
});

test("repair turn can use the previous public question instead of being blocked", async () => {
  const { payload, aiCalls } = await runCase({
    message: "mas não foi essa minha pergunta",
    history: [{ role: "user", content: "e qual salgado combina mais com coxinha?" }],
    aiReply: "Você perguntou qual salgado combina com coxinha. Entre as opções do catálogo, Kibe e Bolinha de queijo são boas alternativas para variar.",
    ip: "10.40.3.1",
  });

  assert.equal(payload.mode, "ai");
  assert.equal(payload.needsHuman, false);
  assert.equal(aiCalls, 1);
  assert.match(payload.reply, /coxinha/i);
});

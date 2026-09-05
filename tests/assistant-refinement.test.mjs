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

function request(message, ip) {
  return {
    method: "POST",
    body: { message, history: [] },
    headers: {
      host: "roda-festa.test",
      origin: "https://roda-festa.test",
      "x-forwarded-for": ip,
    },
  };
}

function store() {
  return {
    async listCatalog() {
      return [
        { name: "Hot dog", commercialCategory: "Mini lanches", active: true },
        { name: "X-Burguer", commercialCategory: "Mini lanches", active: true },
        { name: "Bolo de chocolate com brigadeiro", commercialCategory: "Bolos", active: true },
        { name: "Água mineral sem gás", commercialCategory: "Bebidas", active: true },
      ];
    },
  };
}

async function run(message, ip) {
  let aiCalls = 0;
  const handler = createConciergeHttpHandler({
    catalogStore: store(),
    env: { OPENAI_API_KEY: "test-only" },
    openAIRequest: async () => {
      aiCalls += 1;
      return "AI should not be needed";
    },
  });
  const response = responseRecorder();
  await handler(request(message, ip), response);
  return { payload: JSON.parse(response.body), aiCalls };
}

test("specific lanches questions return only mini lanches", async () => {
  for (const [index, message] of [
    "me fala opções de lanches",
    "mas eu perguntei so sobre lanches",
    "e lanches?",
  ].entries()) {
    const { payload, aiCalls } = await run(message, `10.20.0.${index + 1}`);
    assert.equal(payload.mode, "catalog-category", message);
    assert.match(payload.reply, /Hot dog/i, message);
    assert.match(payload.reply, /X-Burguer/i, message);
    assert.doesNotMatch(payload.reply, /Bolo|Água mineral/i, message);
    assert.equal(aiCalls, 0, message);
  }
});

test("natural responsible-person questions always expose official WhatsApp", async () => {
  for (const [index, message] of [
    "mas com quem eu falo?",
    "como eu falo com o responsável?",
    "a minha duvida é como eu falo com responsavel?",
  ].entries()) {
    const { payload, aiCalls } = await run(message, `10.20.1.${index + 1}`);
    assert.equal(payload.mode, "handoff", message);
    assert.equal(payload.needsHuman, true, message);
    assert.match(payload.reply, /99896-0208/, message);
    assert.equal(payload.actions?.[0]?.type, "whatsapp", message);
    assert.equal(aiCalls, 0, message);
  }
});

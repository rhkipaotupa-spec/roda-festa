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

function fakeCatalogStore() {
  return {
    async listCatalog() { return []; },
  };
}

async function runCase({ message, history = [], ip }) {
  let aiCalls = 0;
  const handler = createConciergeHttpHandler({
    catalogStore: fakeCatalogStore(),
    env: { OPENAI_API_KEY: "test-only-not-real" },
    openAIRequest: async () => {
      aiCalls += 1;
      return "AI should not be needed for Planning Book navigation.";
    },
  });
  const response = responseRecorder();
  await handler({
    method: "POST",
    body: { message, history },
    headers: {
      host: "roda-festa.test",
      origin: "https://roda-festa.test",
      "x-forwarded-for": ip,
    },
  }, response);
  return { payload: JSON.parse(response.body), aiCalls };
}

test("explicit Planning Book navigation returns a direct Planning Book action", async () => {
  const cases = [
    "como acesso o Planning Book?",
    "onde fica o Planning Book?",
    "me leva para o Planning Book",
  ];

  for (const [index, message] of cases.entries()) {
    const { payload, aiCalls } = await runCase({ message, ip: `10.50.0.${index + 1}` });
    assert.equal(payload.mode, "guided-navigation", message);
    assert.equal(payload.needsHuman, false, message);
    assert.equal(payload.actions?.[0]?.type, "planning-book", message);
    assert.equal(payload.actions?.[0]?.label, "Abrir Planning Book", message);
    assert.equal(aiCalls, 0, message);
  }
});

test("contextual 'como vou para la?' after asking about Planning Book returns the button", async () => {
  const { payload, aiCalls } = await runCase({
    message: "mas como vou para la?",
    history: [{ role: "user", content: "mas o que é planning book?" }],
    ip: "10.50.1.1",
  });

  assert.equal(payload.mode, "guided-navigation");
  assert.equal(payload.needsHuman, false);
  assert.equal(payload.actions?.[0]?.type, "planning-book");
  assert.match(payload.reply, /bot[aã]o abaixo/i);
  assert.equal(aiCalls, 0);
});

test("generic 'como vou para la?' without Planning Book context stays outside the special navigation route", async () => {
  const { payload } = await runCase({
    message: "como vou para la?",
    history: [{ role: "user", content: "tem doces?" }],
    ip: "10.50.2.1",
  });

  assert.notEqual(payload.mode, "guided-navigation");
});

import test from "node:test";
import assert from "node:assert/strict";

import { createPlanningAdminReadStore } from "../api/_lib/planning-admin-read-store.js";

function jsonResponse(body, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    async text() {
      return JSON.stringify(body);
    },
  };
}

function row(overrides = {}) {
  return {
    id: "planning-1",
    status: "FINALIZED",
    version: 2,
    created_at: "2026-08-26T10:00:00.000Z",
    last_activity_at: "2026-08-26T11:00:00.000Z",
    finalized_at: "2026-08-26T11:00:00.000Z",
    client_name: "Cliente Teste",
    phone: "14999999999",
    email: "cliente@example.test",
    input_snapshot: {
      eventDate: "2026-09-20",
      guests: 80,
    },
    recommendation_snapshot: {
      investmentTotal: 1200,
      items: [{ id: "a" }],
    },
    final_proposal_snapshot: {
      investmentTotal: 1350,
      items: [{ id: "a" }, { id: "b" }],
    },
    planning_changes: [{ type: "ADD_ITEM" }],
    ...overrides,
  };
}

test("store admin usa service role somente no request server-side", async () => {
  let observed;

  const store = createPlanningAdminReadStore({
    env: {
      SUPABASE_URL: "https://example.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "server-secret",
    },
    fetchImpl: async (url, options) => {
      observed = { url, options };
      return jsonResponse([row()]);
    },
  });

  const quotes = await store.listRecent({ limit: 25 });

  assert.match(observed.url, /planning_sessions\?select=\*/);
  assert.match(observed.url, /order=last_activity_at\.desc/);
  assert.match(observed.url, /limit=25/);
  assert.equal(observed.options.headers.apikey, "server-secret");
  assert.equal(
    observed.options.headers.Authorization,
    "Bearer server-secret",
  );
  assert.equal(JSON.stringify(quotes).includes("server-secret"), false);
});

test("lista administrativa entrega resumo sem token anonimo do cliente", async () => {
  const store = createPlanningAdminReadStore({
    env: {
      SUPABASE_URL: "https://example.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "server-secret",
    },
    fetchImpl: async () => jsonResponse([
      row({
        anonymous_session_token_hash: "must-not-leak",
      }),
    ]),
  });

  const [quote] = await store.listRecent();

  assert.equal(quote.sessionId, "planning-1");
  assert.equal(quote.client.name, "Cliente Teste");
  assert.equal(quote.event.guests, 80);
  assert.equal(quote.commercial.recommendedTotal, 1200);
  assert.equal(quote.commercial.finalTotal, 1350);
  assert.equal(quote.commercial.effectiveTotal, 1350);
  assert.equal(quote.history.changeCount, 1);
  assert.equal(JSON.stringify(quote).includes("must-not-leak"), false);
});

test("detalhe administrativo preserva snapshots historicos", async () => {
  const store = createPlanningAdminReadStore({
    env: {
      SUPABASE_URL: "https://example.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "server-secret",
    },
    fetchImpl: async (url) => {
      assert.match(url, /planning_sessions\?id=eq\.planning-1/);
      return jsonResponse([row()]);
    },
  });

  const quote = await store.getById("planning-1");

  assert.deepEqual(quote.recommendationSnapshot, {
    investmentTotal: 1200,
    items: [{ id: "a" }],
  });
  assert.deepEqual(quote.finalProposalSnapshot, {
    investmentTotal: 1350,
    items: [{ id: "a" }, { id: "b" }],
  });
});

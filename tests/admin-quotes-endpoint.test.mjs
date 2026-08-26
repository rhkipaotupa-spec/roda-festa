import test from "node:test";
import assert from "node:assert/strict";

import {
  createAdminQuotesHttpHandler,
  createAdminQuotesRuntimeHandler,
} from "../api/admin-quotes.js";

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

function authenticatedFixture({
  listRecent = async () => [],
  getById = async () => null,
} = {}) {
  return createAdminQuotesHttpHandler({
    authenticationComposition: {
      authenticate: async ({ cookieHeader }) => {
        assert.equal(cookieHeader, "rf_admin_session=opaque");
        return {
          principal: {
            userId: "owner-1",
            role: "OWNER",
            capabilities: [],
            active: true,
          },
        };
      },
    },
    authorizationBoundary: {
      assert(principal) {
        assert.equal(principal.role, "OWNER");
        return true;
      },
    },
    planningReadStore: {
      listRecent,
      getById,
    },
  });
}

test("endpoint admin de orcamentos aceita somente GET", async () => {
  const handler = authenticatedFixture();
  const response = responseRecorder();

  await handler({
    method: "POST",
    headers: { cookie: "rf_admin_session=opaque" },
  }, response);

  assert.equal(response.statusCode, 405);
  assert.equal(response.getHeader("allow"), "GET");
});

test("endpoint falha fechado sem sessao administrativa", async () => {
  const handler = createAdminQuotesHttpHandler({
    authenticationComposition: {
      authenticate: async () => null,
    },
    authorizationBoundary: {
      assert() {
        throw new Error("admin_authentication_required");
      },
    },
    planningReadStore: {
      listRecent: async () => [],
      getById: async () => null,
    },
  });
  const response = responseRecorder();

  await handler({ method: "GET", headers: {} }, response);

  assert.equal(response.statusCode, 401);
  assert.deepEqual(response.json(), {
    ok: false,
    error: "admin_authentication_required",
  });
});

test("lista de orcamentos e servida somente apos auth admin", async () => {
  const quotes = [
    {
      sessionId: "planning-1",
      client: { name: "Cliente Teste" },
      commercial: { effectiveTotal: 1500 },
    },
  ];
  const handler = authenticatedFixture({
    listRecent: async ({ limit }) => {
      assert.equal(limit, "25");
      return quotes;
    },
  });
  const response = responseRecorder();

  await handler({
    method: "GET",
    headers: { cookie: "rf_admin_session=opaque" },
    query: { limit: "25" },
  }, response);

  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.json(), {
    ok: true,
    quotes,
  });
});

test("detalhe de orcamento usa id e retorna 404 neutro quando ausente", async () => {
  const handler = authenticatedFixture({
    getById: async (id) => {
      assert.equal(id, "planning-404");
      return null;
    },
  });
  const response = responseRecorder();

  await handler({
    method: "GET",
    headers: { cookie: "rf_admin_session=opaque" },
    query: { id: "planning-404" },
  }, response);

  assert.equal(response.statusCode, 404);
  assert.deepEqual(response.json(), {
    ok: false,
    error: "quote_not_found",
  });
});

test("runtime indisponivel retorna erro neutro sem detalhes", async () => {
  const handler = createAdminQuotesRuntimeHandler({
    createRuntime: () => {
      throw new Error("contains-sensitive-detail");
    },
  });
  const response = responseRecorder();

  await handler({ method: "GET", headers: {} }, response);

  assert.equal(response.statusCode, 503);
  assert.deepEqual(response.json(), {
    ok: false,
    error: "admin_quotes_runtime_unavailable",
  });
  assert.equal(response.body.includes("contains-sensitive-detail"), false);
});

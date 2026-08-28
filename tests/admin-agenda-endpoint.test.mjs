import test from "node:test";
import assert from "node:assert/strict";

import {
  createAdminAgendaHttpHandler,
  createAdminAgendaRuntimeHandler,
} from "../api/admin-agenda.js";

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
  listByEventDateRange = async () => [],
} = {}) {
  return createAdminAgendaHttpHandler({
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
      listByEventDateRange,
    },
  });
}

test("endpoint admin da agenda aceita somente GET", async () => {
  const handler = authenticatedFixture();
  const response = responseRecorder();

  await handler({
    method: "POST",
    headers: { cookie: "rf_admin_session=opaque" },
  }, response);

  assert.equal(response.statusCode, 405);
  assert.equal(response.getHeader("allow"), "GET");
});

test("agenda falha fechada sem sessao administrativa", async () => {
  const handler = createAdminAgendaHttpHandler({
    authenticationComposition: {
      authenticate: async () => null,
    },
    authorizationBoundary: {
      assert() {
        throw new Error("admin_authentication_required");
      },
    },
    planningReadStore: {
      listByEventDateRange: async () => [],
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

test("agenda entrega intervalo somente apos auth admin", async () => {
  const events = [
    {
      sessionId: "planning-1",
      event: { date: "2026-09-20", guests: 80 },
      client: { name: "Cliente Teste" },
    },
  ];
  const handler = authenticatedFixture({
    listByEventDateRange: async ({ from, to }) => {
      assert.equal(from, "2026-09-01");
      assert.equal(to, "2026-09-30");
      return events;
    },
  });
  const response = responseRecorder();

  await handler({
    method: "GET",
    headers: { cookie: "rf_admin_session=opaque" },
    query: { from: "2026-09-01", to: "2026-09-30" },
  }, response);

  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.json(), {
    ok: true,
    events,
  });
});

test("agenda preserva primeiro valor quando query chega como array", async () => {
  const handler = authenticatedFixture({
    listByEventDateRange: async ({ from, to }) => {
      assert.equal(from, "2026-09-01");
      assert.equal(to, "2026-09-30");
      return [];
    },
  });
  const response = responseRecorder();

  await handler({
    method: "GET",
    headers: { cookie: "rf_admin_session=opaque" },
    query: {
      from: ["2026-09-01", "forged"],
      to: ["2026-09-30", "forged"],
    },
  }, response);

  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.json(), { ok: true, events: [] });
});

test("intervalo invalido retorna erro publico neutro", async () => {
  const handler = authenticatedFixture({
    listByEventDateRange: async () => {
      throw new Error("planning_admin_read_event_date_range_invalid");
    },
  });
  const response = responseRecorder();

  await handler({
    method: "GET",
    headers: { cookie: "rf_admin_session=opaque" },
    query: { from: "2026-10-01", to: "2026-09-01" },
  }, response);

  assert.equal(response.statusCode, 400);
  assert.deepEqual(response.json(), {
    ok: false,
    error: "invalid_agenda_range",
  });
  assert.equal(response.body.includes("planning_admin_read"), false);
});

test("falha interna da agenda retorna 503 sem detalhes", async () => {
  const handler = authenticatedFixture({
    listByEventDateRange: async () => {
      throw new Error("contains-sensitive-detail");
    },
  });
  const response = responseRecorder();

  await handler({
    method: "GET",
    headers: { cookie: "rf_admin_session=opaque" },
    query: { from: "2026-09-01", to: "2026-09-30" },
  }, response);

  assert.equal(response.statusCode, 503);
  assert.deepEqual(response.json(), {
    ok: false,
    error: "admin_agenda_unavailable",
  });
  assert.equal(response.body.includes("contains-sensitive-detail"), false);
});

test("runtime indisponivel da agenda retorna erro neutro sem detalhes", async () => {
  const handler = createAdminAgendaRuntimeHandler({
    createRuntime: () => {
      throw new Error("contains-sensitive-detail");
    },
  });
  const response = responseRecorder();

  await handler({ method: "GET", headers: {} }, response);

  assert.equal(response.statusCode, 503);
  assert.deepEqual(response.json(), {
    ok: false,
    error: "admin_agenda_runtime_unavailable",
  });
  assert.equal(response.body.includes("contains-sensitive-detail"), false);
});

test("handler da agenda exige contrato de leitura por intervalo", () => {
  assert.throws(
    () => createAdminAgendaHttpHandler({
      authenticationComposition: { authenticate: async () => null },
      authorizationBoundary: { assert: () => true },
      planningReadStore: {},
    }),
    /admin_agenda_store_required/,
  );
});

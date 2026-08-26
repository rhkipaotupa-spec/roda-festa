import test from "node:test";
import assert from "node:assert/strict";
import {
  createAdminSessionHttpHandler,
  createAdminSessionRuntimeHandler,
} from "../api/admin-session.js";

function createResponseRecorder() {
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
    getHeader(name) {
      return headers.get(String(name).toLowerCase());
    },
    json() {
      return JSON.parse(this.body);
    },
  };
}

test("endpoint de sessao aceita somente GET", async () => {
  const handler = createAdminSessionHttpHandler({
    authenticationComposition: {
      authenticate: async () => null,
    },
  });
  const response = createResponseRecorder();

  await handler({ method: "POST", headers: {} }, response);

  assert.equal(response.statusCode, 405);
  assert.equal(response.getHeader("allow"), "GET");
  assert.deepEqual(response.json(), {
    ok: false,
    error: "method_not_allowed",
  });
});

test("sem cookie valido endpoint responde nao autenticado sem erro interno", async () => {
  const handler = createAdminSessionHttpHandler({
    authenticationComposition: {
      authenticate: async ({ cookieHeader }) => {
        assert.equal(cookieHeader, "");
        return null;
      },
    },
  });
  const response = createResponseRecorder();

  await handler({ method: "GET", headers: {} }, response);

  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.json(), {
    ok: true,
    authenticated: false,
  });
});

test("sessao valida devolve apenas estado publico minimo", async () => {
  const handler = createAdminSessionHttpHandler({
    authenticationComposition: {
      authenticate: async ({ cookieHeader }) => {
        assert.equal(cookieHeader, "rf_admin_session=opaque-value");
        return {
          sessionId: "secret-session-id",
          issuedAt: "2026-08-26T10:00:00.000Z",
          expiresAt: "2026-08-26T18:00:00.000Z",
          principal: {
            userId: "private-user-id",
            role: "OWNER",
            capabilities: ["ADMIN_READ"],
            active: true,
          },
        };
      },
    },
  });
  const response = createResponseRecorder();

  await handler({
    method: "GET",
    headers: { cookie: "rf_admin_session=opaque-value" },
  }, response);

  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.json(), {
    ok: true,
    authenticated: true,
    role: "OWNER",
    expiresAt: "2026-08-26T18:00:00.000Z",
  });
  assert.equal(response.body.includes("secret-session-id"), false);
  assert.equal(response.body.includes("private-user-id"), false);
  assert.equal(response.body.includes("ADMIN_READ"), false);
  assert.equal(response.body.includes("opaque-value"), false);
});

test("sessao invalida ou expirada falha fechada como nao autenticada", async () => {
  const handler = createAdminSessionHttpHandler({
    authenticationComposition: {
      authenticate: async () => {
        throw new Error("admin_session_expired");
      },
    },
  });
  const response = createResponseRecorder();

  await handler({ method: "GET", headers: {} }, response);

  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.json(), {
    ok: true,
    authenticated: false,
  });
});

test("runtime indisponivel retorna 503 neutro", async () => {
  const handler = createAdminSessionRuntimeHandler({
    createRuntime: () => {
      throw new Error("contains-sensitive-detail");
    },
  });
  const response = createResponseRecorder();

  await handler({ method: "GET", headers: {} }, response);

  assert.equal(response.statusCode, 503);
  assert.deepEqual(response.json(), {
    ok: false,
    error: "admin_session_runtime_unavailable",
  });
  assert.equal(response.body.includes("contains-sensitive-detail"), false);
});

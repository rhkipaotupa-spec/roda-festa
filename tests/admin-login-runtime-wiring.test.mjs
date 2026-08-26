import test from "node:test";
import assert from "node:assert/strict";

import {
  createAdminLoginRuntimeHandler,
} from "../api/admin-login.js";

function createResponse() {
  const headers = new Map();

  return {
    statusCode: 0,
    body: "",
    setHeader(name, value) {
      headers.set(String(name).toLowerCase(), value);
    },
    getHeader(name) {
      return headers.get(String(name).toLowerCase());
    },
    end(value = "") {
      this.body = String(value);
    },
  };
}

test("runtime wiring injeta env e fetch apenas server-side", async () => {
  const env = {
    SUPABASE_URL: "https://project.supabase.test",
    SUPABASE_SERVICE_ROLE_KEY: "service-role-test-only",
  };
  const fetchImpl = async () => {};
  let received = null;

  const handler = createAdminLoginRuntimeHandler({
    env,
    fetchImpl,
    createRuntime(options) {
      received = options;
      return {
        loginComposition: {
          async login() {
            return {
              status: 200,
              body: { ok: true },
            };
          },
        },
      };
    },
  });

  const response = createResponse();
  await handler({ method: "POST" }, response);

  assert.equal(received.env, env);
  assert.equal(received.fetchImpl, fetchImpl);
  assert.equal(response.statusCode, 200);
});

test("runtime wiring falha fechado quando runtime nao pode ser criado", async () => {
  const secret = "service-role-nao-vazar";

  const handler = createAdminLoginRuntimeHandler({
    createRuntime() {
      throw new Error(`admin_runtime_persistence_not_configured:${secret}`);
    },
  });

  const response = createResponse();
  await handler({ method: "POST" }, response);

  assert.equal(response.statusCode, 503);
  assert.deepEqual(JSON.parse(response.body), {
    ok: false,
    error: "admin_login_runtime_unavailable",
  });
  assert.equal(response.body.includes(secret), false);
});

test("runtime wiring falha fechado para runtime sem login composition", async () => {
  const handler = createAdminLoginRuntimeHandler({
    createRuntime() {
      return {};
    },
  });

  const response = createResponse();
  await handler({ method: "POST" }, response);

  assert.equal(response.statusCode, 503);
  assert.deepEqual(JSON.parse(response.body), {
    ok: false,
    error: "admin_login_runtime_unavailable",
  });
});

test("runtime wiring delega ao login real e preserva cookie seguro", async () => {
  let received = null;

  const handler = createAdminLoginRuntimeHandler({
    createRuntime() {
      return {
        loginComposition: {
          async login(request) {
            received = request;
            return {
              status: 200,
              setCookie: "rf_admin_session=opaque; Path=/admin; HttpOnly; SameSite=Lax",
              body: {
                ok: true,
                session: {
                  principal: {
                    userId: "owner-1",
                    role: "OWNER",
                  },
                },
              },
            };
          },
        },
      };
    },
  });

  const response = createResponse();

  await handler({
    method: "POST",
    headers: {
      Origin: "https://admin.rodafesta.test",
    },
    body: {
      identifier: "owner@example.test",
      credential: "credential-test-only",
    },
  }, response);

  assert.equal(received.method, "POST");
  assert.equal(received.headers.origin, "https://admin.rodafesta.test");
  assert.equal(response.statusCode, 200);
  assert.match(response.getHeader("set-cookie"), /^rf_admin_session=/);
});

test("runtime factory invalida falha alto na construcao", () => {
  assert.throws(
    () => createAdminLoginRuntimeHandler({
      createRuntime: null,
    }),
    /admin_login_runtime_factory_required/,
  );
});

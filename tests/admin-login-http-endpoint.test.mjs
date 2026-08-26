import test from "node:test";
import assert from "node:assert/strict";

import {
  createAdminLoginHttpHandler,
  toAdminLoginBoundaryRequest,
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

test("adapter HTTP normaliza metodo headers e preserva body", () => {
  const body = {
    identifier: "owner@example.test",
    credential: "segredo",
  };

  const adapted = toAdminLoginBoundaryRequest({
    method: "post",
    headers: {
      Origin: "https://admin.example.test",
      Cookie: ["a=1", "b=2"],
    },
    body,
  });

  assert.equal(adapted.method, "POST");
  assert.equal(adapted.headers.origin, "https://admin.example.test");
  assert.equal(adapted.headers.cookie, "a=1,b=2");
  assert.equal(adapted.body, body);
});

test("endpoint delega para composicao e transporta Set-Cookie", async () => {
  let received = null;

  const handler = createAdminLoginHttpHandler({
    loginComposition: {
      async login(request) {
        received = request;
        return {
          status: 200,
          setCookie: "rf_admin_session=opaque; Path=/admin; HttpOnly",
          body: {
            ok: true,
            session: {
              sessionId: "session-1",
            },
          },
        };
      },
    },
  });

  const response = createResponse();

  await handler({
    method: "POST",
    headers: {
      origin: "https://admin.example.test",
    },
    body: {
      identifier: "owner@example.test",
      credential: "segredo",
    },
  }, response);

  assert.equal(received.method, "POST");
  assert.equal(response.statusCode, 200);
  assert.equal(
    response.getHeader("set-cookie"),
    "rf_admin_session=opaque; Path=/admin; HttpOnly",
  );
  assert.deepEqual(JSON.parse(response.body), {
    ok: true,
    session: {
      sessionId: "session-1",
    },
  });
});

test("endpoint converte metodo invalido para 405 sem detalhes internos", async () => {
  const handler = createAdminLoginHttpHandler({
    loginComposition: {
      async login() {
        throw new Error("admin_auth_http_method_not_allowed");
      },
    },
  });

  const response = createResponse();
  await handler({ method: "GET" }, response);

  assert.equal(response.statusCode, 405);
  assert.equal(response.getHeader("allow"), "POST");
  assert.deepEqual(JSON.parse(response.body), {
    ok: false,
    error: "method_not_allowed",
  });
});

test("endpoint converte origin nao confiavel para resposta publica neutra", async () => {
  const handler = createAdminLoginHttpHandler({
    loginComposition: {
      async login() {
        throw new Error("admin_auth_http_untrusted_origin");
      },
    },
  });

  const response = createResponse();
  await handler({ method: "POST" }, response);

  assert.equal(response.statusCode, 403);
  assert.deepEqual(JSON.parse(response.body), {
    ok: false,
    error: "request_not_allowed",
  });
});

test("endpoint nao diferencia publicamente usuario inexistente de senha incorreta", async () => {
  const handler = createAdminLoginHttpHandler({
    loginComposition: {
      async login() {
        throw new Error("admin_auth_http_invalid_credentials");
      },
    },
  });

  const response = createResponse();
  await handler({ method: "POST" }, response);

  assert.equal(response.statusCode, 401);
  assert.deepEqual(JSON.parse(response.body), {
    ok: false,
    error: "invalid_credentials",
  });
});

test("erro interno inesperado nao vaza mensagem stack token ou credential", async () => {
  const secret = "nao-vazar-credential";
  const handler = createAdminLoginHttpHandler({
    loginComposition: {
      async login() {
        const error = new Error(`database_failure token=abc credential=${secret}`);
        error.stack = `SECRET_STACK ${secret}`;
        throw error;
      },
    },
  });

  const response = createResponse();
  await handler({ method: "POST" }, response);

  assert.equal(response.statusCode, 500);
  assert.deepEqual(JSON.parse(response.body), {
    ok: false,
    error: "admin_login_failed",
  });
  assert.equal(response.body.includes(secret), false);
  assert.equal(response.body.includes("database_failure"), false);
  assert.equal(response.body.includes("SECRET_STACK"), false);
});

test("handler exige composicao real e falha alto durante wiring", () => {
  assert.throws(
    () => createAdminLoginHttpHandler(),
    /admin_login_endpoint_composition_required/,
  );
});

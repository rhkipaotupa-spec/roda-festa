import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import { createAdminLoginComposition } from "../api/_lib/admin-login-composition.js";
import { createAdminLogoutHttpHandler } from "../api/admin-logout.js";

function responseRecorder() {
  return {
    statusCode: 0,
    headers: {},
    body: "",
    setHeader(name, value) {
      this.headers[String(name).toLowerCase()] = value;
    },
    end(value = "") {
      this.body = String(value);
    },
  };
}

test("composicao existente expoe logout da mesma boundary segura", async () => {
  const request = { method: "POST", headers: { origin: "https://admin.test" } };
  let received = null;
  const composition = createAdminLoginComposition({
    verifyCredential: async () => null,
    sessionRepository: {},
    authenticationComposition: {},
    createHttpBoundary() {
      return {
        async login() { return { status: 200 }; },
        async logout(value) {
          received = value;
          return { status: 200, body: { ok: true } };
        },
      };
    },
  });

  const result = await composition.logout(request);
  assert.equal(received, request);
  assert.deepEqual(result.body, { ok: true });
});

test("endpoint de logout preserva Set-Cookie de limpeza e resposta neutra", async () => {
  let received = null;
  const handler = createAdminLogoutHttpHandler({
    authComposition: {
      async logout(request) {
        received = request;
        return {
          status: 200,
          setCookie: "rf_admin_session=; Path=/; SameSite=Lax; Max-Age=0; HttpOnly; Secure",
          body: { ok: true },
        };
      },
    },
  });
  const response = responseRecorder();
  await handler({
    method: "POST",
    headers: {
      Origin: "https://roda-festa.vercel.app",
      Cookie: "rf_admin_session=opaque",
    },
  }, response);

  assert.equal(received.method, "POST");
  assert.equal(received.headers.origin, "https://roda-festa.vercel.app");
  assert.equal(received.headers.cookie, "rf_admin_session=opaque");
  assert.equal(response.statusCode, 200);
  assert.match(String(response.headers["set-cookie"]), /Max-Age=0/);
  assert.deepEqual(JSON.parse(response.body), { ok: true });
});

test("endpoint mapeia metodo e origem rejeitados sem detalhes internos", async () => {
  for (const [message, expectedStatus, expectedError] of [
    ["admin_auth_http_method_not_allowed", 405, "method_not_allowed"],
    ["admin_auth_http_untrusted_origin", 403, "request_not_allowed"],
  ]) {
    const handler = createAdminLogoutHttpHandler({
      authComposition: {
        async logout() { throw new Error(message); },
      },
    });
    const response = responseRecorder();
    await handler({ method: "POST", headers: {} }, response);
    assert.equal(response.statusCode, expectedStatus);
    assert.equal(JSON.parse(response.body).error, expectedError);
  }
});

test("browser so retorna ao login depois de logout confirmado pelo servidor", () => {
  const login = fs.readFileSync("src/admin/AdminLogin.jsx", "utf8");
  assert.match(login, /const LOGOUT_ENDPOINT = "\/api\/admin-logout"/);
  assert.match(login, /fetch\(LOGOUT_ENDPOINT/);
  assert.ok(login.includes('method: "POST"'));
  assert.ok(login.includes('credentials: "same-origin"'));
  assert.match(login, /if \(!response\.ok \|\| payload\?\.ok !== true\)[\s\S]*setLogoutStatus\("error"\)[\s\S]*return;/);
  assert.match(login, /setStatus\("idle"\)/);
  assert.match(login, /onLogout=\{handleLogout\}/);
});

test("shell oferece Sair no desktop e Sair da conta no menu mobile", () => {
  const workspace = fs.readFileSync("src/admin/AdminWorkspace.jsx", "utf8");
  const css = fs.readFileSync("src/admin/AdminWorkspace.css", "utf8");
  assert.match(workspace, /className="rf-admin-logout"/);
  assert.match(workspace, /className="rf-admin-mobile-drawer__logout"/);
  assert.match(workspace, /Sair da conta/);
  assert.ok(workspace.includes('isLoggingOut ? "Saindo..." : "Sair"'));
  assert.match(css, /V19\.10J_ADMIN_LOGOUT/);
  assert.ok(css.includes('@media (max-width: 720px)'));
  assert.ok(css.includes('.rf-admin-logout'));
  assert.ok(css.includes('display: none'));
});

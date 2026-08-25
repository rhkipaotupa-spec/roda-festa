import test from "node:test";
import assert from "node:assert/strict";

import {
  buildAdminSessionCookieContract,
  createAdminAuthenticator,
  extractAdminSessionToken,
} from "../api/_lib/admin-authentication-contract.js";
import { createAdminAuthorizationBoundary } from "../api/_lib/admin-authorization-boundary.js";

const NOW = new Date("2026-08-25T16:00:00.000Z");

function trustedSession(overrides = {}) {
  return {
    sessionId: "sess-admin-1",
    userId: "owner-1",
    role: "owner",
    capabilities: ["journey:read"],
    active: true,
    issuedAt: "2026-08-25T15:00:00.000Z",
    expiresAt: "2026-08-25T17:00:00.000Z",
    ...overrides,
  };
}

test("token administrativo vem somente do cookie configurado", () => {
  assert.equal(extractAdminSessionToken("x=1; rf_admin_session=opaque%2Etoken; y=2"), "opaque.token");
  assert.equal(extractAdminSessionToken("role=OWNER; capability=journey%3Aread"), null);
});

test("autenticador falha alto sem resolver de sessao", () => {
  assert.throws(() => createAdminAuthenticator(), /admin_session_resolver_required/);
});

test("requisicao sem cookie permanece nao autenticada", async () => {
  let calls = 0;
  const auth = createAdminAuthenticator({
    resolveSession: async () => { calls += 1; return trustedSession(); },
    now: () => NOW,
  });
  assert.equal(await auth.authenticate({ cookieHeader: "" }), null);
  assert.equal(calls, 0);
});

test("role e capabilities sao aceitas somente da sessao confiavel resolvida no servidor", async () => {
  let observedToken;
  const auth = createAdminAuthenticator({
    resolveSession: async ({ token }) => {
      observedToken = token;
      return trustedSession();
    },
    now: () => NOW,
  });

  const session = await auth.authenticate({
    cookieHeader: "rf_admin_session=opaque-token; role=CUSTOMER; capabilities=pricing%3Awrite",
  });

  assert.equal(observedToken, "opaque-token");
  assert.equal(session.principal.role, "OWNER");
  assert.deepEqual(session.principal.capabilities, ["journey:read"]);
  assert.equal(Object.prototype.hasOwnProperty.call(session, "token"), false);
});

test("sessao expirada e rejeitada", async () => {
  const auth = createAdminAuthenticator({
    resolveSession: async () => trustedSession({ expiresAt: "2026-08-25T15:59:59.000Z" }),
    now: () => NOW,
  });
  await assert.rejects(
    () => auth.authenticate({ cookieHeader: "rf_admin_session=expired" }),
    /admin_session_expired/,
  );
});

test("sessao com tempo de vida invalido e rejeitada", async () => {
  const auth = createAdminAuthenticator({
    resolveSession: async () => trustedSession({
      issuedAt: "2026-08-25T17:00:00.000Z",
      expiresAt: "2026-08-25T16:30:00.000Z",
    }),
    now: () => NOW,
  });
  await assert.rejects(
    () => auth.authenticate({ cookieHeader: "rf_admin_session=bad" }),
    /admin_session_invalid_lifetime/,
  );
});

test("contrato de cookie nasce HttpOnly SameSite Lax e Secure em producao", () => {
  const dev = buildAdminSessionCookieContract({ production: false });
  const prod = buildAdminSessionCookieContract({ production: true });
  assert.equal(dev.httpOnly, true);
  assert.equal(dev.sameSite, "Lax");
  assert.equal(dev.path, "/admin");
  assert.equal(dev.secure, false);
  assert.equal(prod.secure, true);
});

test("principal autenticado alimenta a boundary de autorizacao sem acoplamento ao provedor", async () => {
  const auth = createAdminAuthenticator({
    resolveSession: async () => trustedSession(),
    now: () => NOW,
  });
  const boundary = createAdminAuthorizationBoundary();
  const session = await auth.authenticate({ cookieHeader: "rf_admin_session=opaque" });
  assert.equal(boundary.assert(session.principal, "journey:read"), true);
  assert.equal(boundary.can(session.principal, "pricing:write"), false);
});

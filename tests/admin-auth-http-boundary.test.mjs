import test from "node:test";
import assert from "node:assert/strict";

import { createAdminAuthorizationBoundary } from "../api/_lib/admin-authorization-boundary.js";
import { createAdminAuthenticationComposition } from "../api/_lib/admin-authentication-composition.js";
import { createAdminSessionRepository } from "../api/_lib/admin-session-repository.js";
import { createMemoryAdminSessionAdapter } from "../api/_lib/admin-session-adapters/memory.js";
import {
  buildAdminSessionClearCookie,
  buildAdminSessionSetCookie,
  createAdminAuthHttpBoundary,
  isTrustedAdminMutationRequest,
} from "../api/_lib/admin-auth-http-boundary.js";

const NOW = new Date("2026-08-25T20:00:00.000Z");

function fixture({
  production = false,
  allowedOrigins = "https://admin.rodafesta.test",
  credentialVerifier = async ({ identifier, credential }) => {
    if (identifier !== "owner@example.test" || credential !== "valid-secret") return null;
    return {
      userId: "owner-1",
      role: "OWNER",
      capabilities: ["journey:read"],
    };
  },
} = {}) {
  const adapter = createMemoryAdminSessionAdapter({ env: { NODE_ENV: "test" } });
  const repository = createAdminSessionRepository(adapter, {
    now: () => new Date(NOW),
    tokenFactory: (() => {
      const tokens = ["http-token-1", "http-token-2", "http-token-3"];
      return () => tokens.shift();
    })(),
  });
  const boundary = createAdminAuthorizationBoundary();
  const composition = createAdminAuthenticationComposition({
    sessionRepository: repository,
    authorizationBoundary: boundary,
    now: () => new Date(NOW),
  });
  const env = {
    NODE_ENV: production ? "production" : "test",
    RODA_FESTA_ADMIN_ALLOWED_ORIGINS: allowedOrigins,
  };
  const http = createAdminAuthHttpBoundary({
    sessionRepository: repository,
    authenticationComposition: composition,
    credentialVerifier,
    env,
    production,
    sessionTtlMs: 60_000,
  });
  return { adapter, repository, boundary, composition, http, env };
}

function request({
  origin = "https://admin.rodafesta.test",
  cookie = "",
  body = {},
  method = "POST",
} = {}) {
  return {
    method,
    headers: {
      origin,
      host: "admin.rodafesta.test",
      "x-forwarded-proto": "https",
      cookie,
    },
    body,
  };
}

test("origem administrativa confiavel aceita allowlist e same-origin", () => {
  assert.equal(
    isTrustedAdminMutationRequest(
      request(),
      { RODA_FESTA_ADMIN_ALLOWED_ORIGINS: "https://admin.rodafesta.test" },
    ),
    true,
  );
  assert.equal(
    isTrustedAdminMutationRequest(
      request({ origin: "https://evil.test" }),
      { RODA_FESTA_ADMIN_ALLOWED_ORIGINS: "" },
    ),
    false,
  );
});

test("boundary HTTP falha alto sem verifier, repository ou composicao", () => {
  assert.throws(
    () => createAdminAuthHttpBoundary({}),
    /admin_auth_http_session_repository_missing:createSession/,
  );
});

test("login rejeita metodo diferente de POST e origem nao confiavel", async () => {
  const { http } = fixture();

  await assert.rejects(
    () => http.login(request({ method: "GET" })),
    /admin_auth_http_method_not_allowed/,
  );

  await assert.rejects(
    () => http.login(request({ origin: "https://evil.test" })),
    /admin_auth_http_untrusted_origin/,
  );
});

test("login usa verifier server-side e ignora role capability fornecidas pelo cliente", async () => {
  const { http } = fixture();

  const result = await http.login(request({
    body: {
      identifier: "owner@example.test",
      credential: "valid-secret",
      role: "ADMIN",
      capabilities: ["pricing:write"],
    },
  }));

  assert.equal(result.status, 200);
  assert.equal(result.body.session.principal.role, "OWNER");
  assert.deepEqual(result.body.session.principal.capabilities, ["journey:read"]);
  assert.equal(JSON.stringify(result.body).includes("valid-secret"), false);
});

test("credencial invalida nao cria sessao administrativa", async () => {
  const { http } = fixture();

  await assert.rejects(
    () => http.login(request({
      body: {
        identifier: "owner@example.test",
        credential: "wrong",
      },
    })),
    /admin_auth_http_invalid_credentials/,
  );
});

test("cookie de login nasce HttpOnly Lax, cobre API administrativa e e Secure em producao", async () => {
  const { http } = fixture({ production: true });

  const result = await http.login(request({
    body: {
      identifier: "owner@example.test",
      credential: "valid-secret",
    },
  }));

  assert.match(result.setCookie, /^rf_admin_session=/);
  assert.match(result.setCookie, /Path=\//);
  assert.match(result.setCookie, /SameSite=Lax/);
  assert.match(result.setCookie, /HttpOnly/);
  assert.match(result.setCookie, /Secure/);
});

test("logout revoga sessao e sempre limpa cookie", async () => {
  const { http, composition } = fixture();

  const login = await http.login(request({
    body: {
      identifier: "owner@example.test",
      credential: "valid-secret",
    },
  }));
  const cookiePair = login.setCookie.split(";")[0];

  assert.ok(await composition.authenticate({ cookieHeader: cookiePair }));

  const logout = await http.logout(request({ cookie: cookiePair }));
  assert.equal(logout.status, 200);
  assert.match(logout.setCookie, /^rf_admin_session=/);
  assert.match(logout.setCookie, /Path=\//);
  assert.match(logout.setCookie, /Max-Age=0/);
  assert.equal(await composition.authenticate({ cookieHeader: cookiePair }), null);
});

test("refresh rotaciona token e invalida cookie anterior", async () => {
  const { http, composition } = fixture();

  const login = await http.login(request({
    body: {
      identifier: "owner@example.test",
      credential: "valid-secret",
    },
  }));
  const oldCookie = login.setCookie.split(";")[0];

  const refreshed = await http.refresh(request({ cookie: oldCookie }));
  const newCookie = refreshed.setCookie.split(";")[0];

  assert.notEqual(oldCookie, newCookie);
  assert.equal(await composition.authenticate({ cookieHeader: oldCookie }), null);
  assert.ok(await composition.authenticate({ cookieHeader: newCookie }));
});

test("refresh sem sessao valida falha fechado", async () => {
  const { http } = fixture();

  await assert.rejects(
    () => http.refresh(request({ cookie: "rf_admin_session=unknown" })),
    /admin_authentication_required/,
  );
});

test("respostas HTTP nao expoem token bruto, tokenHash ou credential", async () => {
  const { http } = fixture();

  const result = await http.login(request({
    body: {
      identifier: "owner@example.test",
      credential: "valid-secret",
    },
  }));

  const serialized = JSON.stringify(result.body);
  assert.equal(serialized.includes("http-token-1"), false);
  assert.equal(serialized.includes("tokenHash"), false);
  assert.equal(serialized.includes("valid-secret"), false);

  const clear = buildAdminSessionClearCookie();
  const set = buildAdminSessionSetCookie("opaque");
  assert.match(clear, /Max-Age=0/);
  assert.match(set, /HttpOnly/);
});

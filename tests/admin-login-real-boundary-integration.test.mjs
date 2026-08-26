import test from "node:test";
import assert from "node:assert/strict";

import { createAdminAuthorizationBoundary } from "../api/_lib/admin-authorization-boundary.js";
import { createAdminAuthenticationComposition } from "../api/_lib/admin-authentication-composition.js";
import { createAdminCredentialVerifier, hashAdminCredential } from "../api/_lib/admin-credential-verification.js";
import { createAdminLoginComposition } from "../api/_lib/admin-login-composition.js";
import { createMemoryAdminSessionAdapter } from "../api/_lib/admin-session-adapters/memory.js";
import { createAdminSessionRepository } from "../api/_lib/admin-session-repository.js";

const NOW = new Date("2026-08-26T10:00:00.000Z");

function createFixture() {
  const adapter = createMemoryAdminSessionAdapter({
    env: { NODE_ENV: "test" },
  });

  const tokens = ["integration-admin-token-1"];
  const sessionRepository = createAdminSessionRepository(adapter, {
    now: () => new Date(NOW),
    tokenFactory: () => tokens.shift(),
  });

  const authorizationBoundary = createAdminAuthorizationBoundary({
    allowedRoles: ["OWNER"],
  });

  const authenticationComposition = createAdminAuthenticationComposition({
    sessionRepository,
    authorizationBoundary,
    now: () => new Date(NOW),
  });

  const credentialRecord = {
    userId: "owner-1",
    role: "OWNER",
    capabilities: ["journey:read"],
    active: true,
    credential: hashAdminCredential("Senha-Real-De-Teste", {
      salt: Buffer.alloc(16, 31),
    }),
  };

  const verifyCredential = createAdminCredentialVerifier({
    findByIdentifier: async (identifier) => (
      identifier === "owner@example.test" ? credentialRecord : null
    ),
  });

  const loginComposition = createAdminLoginComposition({
    verifyCredential,
    sessionRepository,
    authenticationComposition,
    env: {
      NODE_ENV: "test",
      RODA_FESTA_ADMIN_ALLOWED_ORIGINS: "https://admin.rodafesta.test",
    },
    production: false,
    sessionTtlMs: 60_000,
  });

  return {
    adapter,
    sessionRepository,
    authenticationComposition,
    loginComposition,
  };
}

function request({
  identifier = "owner@example.test",
  credential = "Senha-Real-De-Teste",
  origin = "https://admin.rodafesta.test",
} = {}) {
  return {
    method: "POST",
    headers: {
      origin,
      host: "admin.rodafesta.test",
      "x-forwarded-proto": "https",
      cookie: "",
    },
    body: {
      identifier,
      credential,
    },
  };
}

test("integracao real credencial verifier boundary sessao e cookie fecha ponta a ponta", async () => {
  const {
    sessionRepository,
    authenticationComposition,
    loginComposition,
  } = createFixture();

  const result = await loginComposition.login(request());

  assert.equal(result.status, 200);
  assert.equal(result.body.ok, true);
  assert.equal(result.body.session.principal.userId, "owner-1");
  assert.equal(result.body.session.principal.role, "OWNER");
  assert.deepEqual(
    result.body.session.principal.capabilities,
    ["journey:read"],
  );

  assert.match(result.setCookie, /^rf_admin_session=/);
  assert.match(result.setCookie, /HttpOnly/);
  assert.match(result.setCookie, /SameSite=Lax/);
  assert.match(result.setCookie, /Path=\//);

  const cookiePair = result.setCookie.split(";")[0];
  const authenticated = await authenticationComposition.authenticate({
    cookieHeader: cookiePair,
  });

  assert.equal(authenticated.principal.userId, "owner-1");

  const rawToken = cookiePair.split("=")[1];
  assert.ok(rawToken);
  assert.ok(await sessionRepository.resolveSession(decodeURIComponent(rawToken)));
});

test("integracao real rejeita credencial incorreta antes de criar sessao", async () => {
  const { adapter, loginComposition } = createFixture();

  await assert.rejects(
    () => loginComposition.login(request({
      credential: "senha-incorreta",
    })),
    /admin_auth_http_invalid_credentials/,
  );

  assert.equal(adapter.__unsafeInspectForTests("admin-session-1"), null);
});

test("integracao real preserva protecao de origin antes da verificacao de credencial", async () => {
  const { loginComposition } = createFixture();

  await assert.rejects(
    () => loginComposition.login(request({
      origin: "https://evil.test",
    })),
    /admin_auth_http_untrusted_origin/,
  );
});

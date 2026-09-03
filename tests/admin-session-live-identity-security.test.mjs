import test from "node:test";
import assert from "node:assert/strict";

import { createAdminAuthenticationComposition } from "../api/_lib/admin-authentication-composition.js";
import { createAdminAuthorizationBoundary } from "../api/_lib/admin-authorization-boundary.js";
import { createAdminSessionRepository } from "../api/_lib/admin-session-repository.js";
import { createMemoryAdminSessionAdapter } from "../api/_lib/admin-session-adapters/memory.js";
import { createAdminRuntime } from "../api/_lib/admin-runtime.js";

const NOW = new Date("2026-09-03T14:10:00.000Z");

function createCompositionFixture({ liveIdentity }) {
  const adapter = createMemoryAdminSessionAdapter({
    env: { NODE_ENV: "test" },
  });
  const repository = createAdminSessionRepository(adapter, {
    now: () => new Date(NOW),
    tokenFactory: () => "opaque-live-identity-test-token",
  });
  const authorizationBoundary = createAdminAuthorizationBoundary({
    allowedRoles: ["OWNER", "ADMIN"],
  });
  const composition = createAdminAuthenticationComposition({
    sessionRepository: repository,
    authorizationBoundary,
    resolveIdentityByUserId: async () => liveIdentity(),
    now: () => new Date(NOW),
  });

  return { repository, composition };
}

test("P1: sessao existente deixa de autenticar quando identidade atual fica inativa", async () => {
  let currentIdentity = {
    userId: "owner-1",
    role: "OWNER",
    capabilities: ["journey:read", "pricing:write"],
    active: true,
  };

  const { repository, composition } = createCompositionFixture({
    liveIdentity: () => currentIdentity,
  });

  const created = await repository.createSession({
    userId: "owner-1",
    role: "OWNER",
    capabilities: ["journey:read", "pricing:write"],
    ttlMs: 60_000,
  });

  assert.equal(await composition.can({
    cookieHeader: `rf_admin_session=${created.token}`,
    requiredCapability: "pricing:write",
  }), true);

  currentIdentity = {
    ...currentIdentity,
    active: false,
  };

  assert.equal(await composition.authenticate({
    cookieHeader: `rf_admin_session=${created.token}`,
  }), null);
  assert.equal(await composition.can({
    cookieHeader: `rf_admin_session=${created.token}`,
    requiredCapability: "pricing:write",
  }), false);
});

test("P1: downgrade de role/capability passa a valer imediatamente na sessao existente", async () => {
  let currentIdentity = {
    userId: "owner-1",
    role: "OWNER",
    capabilities: ["journey:read", "pricing:write"],
    active: true,
  };

  const { repository, composition } = createCompositionFixture({
    liveIdentity: () => currentIdentity,
  });

  const created = await repository.createSession({
    userId: "owner-1",
    role: "OWNER",
    capabilities: ["journey:read", "pricing:write"],
    ttlMs: 60_000,
  });

  currentIdentity = {
    userId: "owner-1",
    role: "ADMIN",
    capabilities: ["journey:read"],
    active: true,
  };

  const authenticated = await composition.authenticate({
    cookieHeader: `rf_admin_session=${created.token}`,
  });

  assert.ok(authenticated);
  assert.equal(authenticated.principal.role, "ADMIN");
  assert.deepEqual(authenticated.principal.capabilities, ["journey:read"]);
  assert.equal(await composition.can({
    cookieHeader: `rf_admin_session=${created.token}`,
    requiredCapability: "pricing:write",
  }), false);
  assert.equal(await composition.can({
    cookieHeader: `rf_admin_session=${created.token}`,
    requiredCapability: "journey:read",
  }), true);
});

test("P1: runtime conecta lookup atual por userId ao boundary de autenticacao", () => {
  const findByUserId = async () => null;
  let authenticationOptions = null;

  createAdminRuntime({
    env: {
      NODE_ENV: "test",
      SUPABASE_URL: "https://project.supabase.test",
      SUPABASE_SERVICE_ROLE_KEY: "service-role-test-only",
    },
    fetchImpl: async () => {
      throw new Error("not_used");
    },
    createIdentityStore: () => ({
      findByIdentifier: async () => null,
      findByUserId,
    }),
    createCredentialVerifier: () => async () => null,
    createSessionAdapter: () => ({
      create() {},
      findByTokenHash() {},
      revokeById() {},
      replaceToken() {},
    }),
    createSessionRepository: () => ({
      createSession() {},
      resolveSession() {},
      revokeSession() {},
      rotateSession() {},
    }),
    createAuthorizationBoundary: () => ({
      assert() {},
      can() {},
    }),
    createAuthenticationComposition(options) {
      authenticationOptions = options;
      return {
        authenticate() {},
      };
    },
    createLoginComposition: () => ({
      login() {},
    }),
  });

  assert.equal(authenticationOptions.resolveIdentityByUserId, findByUserId);
});

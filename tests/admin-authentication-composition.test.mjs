import test from "node:test";
import assert from "node:assert/strict";

import { createAdminAuthenticationComposition } from "../api/_lib/admin-authentication-composition.js";
import { createAdminAuthorizationBoundary } from "../api/_lib/admin-authorization-boundary.js";
import { createAdminSessionRepository } from "../api/_lib/admin-session-repository.js";
import { createMemoryAdminSessionAdapter } from "../api/_lib/admin-session-adapters/memory.js";

const NOW = new Date("2026-08-25T19:00:00.000Z");

function createFixture({
  allowedRoles = ["OWNER", "ADMIN"],
  tokens = ["opaque-admin-token-1", "opaque-admin-token-2"],
} = {}) {
  const adapter = createMemoryAdminSessionAdapter({
    env: { NODE_ENV: "test" },
  });

  const repository = createAdminSessionRepository(adapter, {
    now: () => new Date(NOW),
    tokenFactory: () => tokens.shift(),
  });

  const boundary = createAdminAuthorizationBoundary({ allowedRoles });
  const composition = createAdminAuthenticationComposition({
    sessionRepository: repository,
    authorizationBoundary: boundary,
    now: () => new Date(NOW),
  });

  return { adapter, repository, boundary, composition };
}

test("composicao exige repository e boundary reais", () => {
  const boundary = createAdminAuthorizationBoundary();

  assert.throws(
    () => createAdminAuthenticationComposition({ authorizationBoundary: boundary }),
    /admin_auth_composition_session_repository_required/,
  );

  assert.throws(
    () => createAdminAuthenticationComposition({
      sessionRepository: { resolveSession: async () => null },
    }),
    /admin_auth_composition_authorization_boundary_required/,
  );
});

test("cookie opaco resolve sessao no repository e alimenta boundary", async () => {
  const { repository, composition } = createFixture();

  const created = await repository.createSession({
    userId: "owner-1",
    role: "owner",
    capabilities: ["journey:read"],
    ttlMs: 60_000,
  });

  const authorized = await composition.authorize({
    cookieHeader: `rf_admin_session=${created.token}`,
    requiredCapability: "journey:read",
  });

  assert.equal(authorized.sessionId, created.session.id);
  assert.equal(authorized.principal.userId, "owner-1");
  assert.equal(authorized.principal.role, "OWNER");
  assert.deepEqual(authorized.principal.capabilities, ["journey:read"]);
});

test("role e capabilities forjadas no cookie nao atravessam a composicao", async () => {
  const { repository, composition } = createFixture();

  const created = await repository.createSession({
    userId: "admin-1",
    role: "ADMIN",
    capabilities: ["journey:read"],
    ttlMs: 60_000,
  });

  await assert.rejects(
    () => composition.authorize({
      cookieHeader:
        `rf_admin_session=${created.token}; role=OWNER; capabilities=pricing%3Awrite`,
      requiredCapability: "pricing:write",
    }),
    /admin_forbidden/,
  );
});

test("sem cookie a composicao falha fechada ao autorizar", async () => {
  const { composition } = createFixture();

  assert.equal(await composition.authenticate({ cookieHeader: "" }), null);
  assert.equal(await composition.can({
    cookieHeader: "",
    requiredCapability: "journey:read",
  }), false);

  await assert.rejects(
    () => composition.authorize({
      cookieHeader: "",
      requiredCapability: "journey:read",
    }),
    /admin_authentication_required/,
  );
});

test("token desconhecido nao produz principal administrativo", async () => {
  const { composition } = createFixture();

  assert.equal(
    await composition.authenticate({
      cookieHeader: "rf_admin_session=token-desconhecido",
    }),
    null,
  );

  await assert.rejects(
    () => composition.authorize({
      cookieHeader: "rf_admin_session=token-desconhecido",
      requiredCapability: "journey:read",
    }),
    /admin_authentication_required/,
  );
});

test("sessao revogada deixa de atravessar a composicao imediatamente", async () => {
  const { repository, composition } = createFixture();

  const created = await repository.createSession({
    userId: "owner-1",
    role: "OWNER",
    capabilities: ["journey:read"],
    ttlMs: 60_000,
  });

  assert.equal(await composition.can({
    cookieHeader: `rf_admin_session=${created.token}`,
    requiredCapability: "journey:read",
  }), true);

  await repository.revokeSession(created.session.id);

  assert.equal(await composition.can({
    cookieHeader: `rf_admin_session=${created.token}`,
    requiredCapability: "journey:read",
  }), false);
});

test("rotacao invalida cookie anterior e novo token preserva autorizacao", async () => {
  const { repository, composition } = createFixture();

  const created = await repository.createSession({
    userId: "owner-1",
    role: "OWNER",
    capabilities: ["journey:read"],
    ttlMs: 60_000,
  });

  const rotated = await repository.rotateSession({
    sessionId: created.session.id,
    currentToken: created.token,
  });

  assert.equal(await composition.can({
    cookieHeader: `rf_admin_session=${created.token}`,
    requiredCapability: "journey:read",
  }), false);

  assert.equal(await composition.can({
    cookieHeader: `rf_admin_session=${rotated.token}`,
    requiredCapability: "journey:read",
  }), true);
});

test("sessao expirada no repository nao chega ao autenticador", async () => {
  let current = new Date(NOW);
  const adapter = createMemoryAdminSessionAdapter({ env: { NODE_ENV: "test" } });
  const repository = createAdminSessionRepository(adapter, {
    now: () => new Date(current),
    tokenFactory: () => "opaque-expiring-token",
  });
  const boundary = createAdminAuthorizationBoundary();
  const composition = createAdminAuthenticationComposition({
    sessionRepository: repository,
    authorizationBoundary: boundary,
    now: () => new Date(current),
  });

  const created = await repository.createSession({
    userId: "owner-1",
    role: "OWNER",
    capabilities: ["journey:read"],
    ttlMs: 1_000,
  });

  current = new Date(NOW.getTime() + 1_001);

  assert.equal(await composition.authenticate({
    cookieHeader: `rf_admin_session=${created.token}`,
  }), null);
});

test("role administrativa sem capability exigida continua bloqueada", async () => {
  const { repository, composition } = createFixture();

  const created = await repository.createSession({
    userId: "admin-1",
    role: "ADMIN",
    capabilities: ["journey:read"],
    ttlMs: 60_000,
  });

  assert.equal(await composition.can({
    cookieHeader: `rf_admin_session=${created.token}`,
    requiredCapability: "pricing:write",
  }), false);

  await assert.rejects(
    () => composition.authorize({
      cookieHeader: `rf_admin_session=${created.token}`,
      requiredCapability: "pricing:write",
    }),
    /admin_forbidden/,
  );
});

test("composicao nao expoe token bruto nem tokenHash no resultado autorizado", async () => {
  const { repository, composition } = createFixture();

  const created = await repository.createSession({
    userId: "owner-1",
    role: "OWNER",
    capabilities: ["journey:read"],
    ttlMs: 60_000,
  });

  const authorized = await composition.authorize({
    cookieHeader: `rf_admin_session=${created.token}`,
    requiredCapability: "journey:read",
  });

  const serialized = JSON.stringify(authorized);
  assert.equal(Object.prototype.hasOwnProperty.call(authorized, "token"), false);
  assert.equal(Object.prototype.hasOwnProperty.call(authorized, "tokenHash"), false);
  assert.equal(serialized.includes(created.token), false);
});

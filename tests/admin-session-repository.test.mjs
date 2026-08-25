import test from "node:test";
import assert from "node:assert/strict";

import {
  createAdminSessionRepository,
  generateAdminSessionToken,
  hashAdminSessionToken,
} from "../api/_lib/admin-session-repository.js";
import { createMemoryAdminSessionAdapter } from "../api/_lib/admin-session-adapters/memory.js";

function fixedClock(iso = "2026-08-25T18:00:00.000Z") {
  let current = new Date(iso);
  return {
    now: () => new Date(current),
    advance(ms) {
      current = new Date(current.getTime() + ms);
    },
  };
}

test("token administrativo nasce opaco e com alta entropia", () => {
  const token = generateAdminSessionToken();
  assert.equal(typeof token, "string");
  assert.ok(token.length >= 40);
  assert.notEqual(token, generateAdminSessionToken());
});

test("repositorio persiste apenas hash do token bruto", async () => {
  const adapter = createMemoryAdminSessionAdapter({ env: { NODE_ENV: "test" } });
  const repository = createAdminSessionRepository(adapter, {
    tokenFactory: () => "token-super-secreto-1234567890",
  });

  const created = await repository.createSession({
    userId: "owner-1",
    role: "owner",
    capabilities: ["journey:read"],
    ttlMs: 60_000,
  });

  const stored = adapter.__unsafeInspectForTests(created.session.id);
  assert.equal(stored.tokenHash, hashAdminSessionToken(created.token));
  assert.equal(JSON.stringify(stored).includes(created.token), false);
});

test("resolve retorna principal de sessao valida e nunca token hash", async () => {
  const clock = fixedClock();
  const adapter = createMemoryAdminSessionAdapter({ env: { NODE_ENV: "test" } });
  const repository = createAdminSessionRepository(adapter, { now: clock.now });

  const created = await repository.createSession({
    userId: "adrielly",
    role: "owner",
    capabilities: ["journey:read", "pricing:write"],
    ttlMs: 60_000,
  });

  const resolved = await repository.resolveSession(created.token);
  assert.equal(resolved.userId, "adrielly");
  assert.equal(resolved.role, "OWNER");
  assert.deepEqual(resolved.capabilities, ["journey:read", "pricing:write"]);
  assert.equal(Object.prototype.hasOwnProperty.call(resolved, "tokenHash"), false);
});

test("token desconhecido nao autentica", async () => {
  const adapter = createMemoryAdminSessionAdapter({ env: { NODE_ENV: "test" } });
  const repository = createAdminSessionRepository(adapter);
  assert.equal(await repository.resolveSession("nao-existe"), null);
});

test("sessao expirada deixa de resolver", async () => {
  const clock = fixedClock();
  const adapter = createMemoryAdminSessionAdapter({ env: { NODE_ENV: "test" } });
  const repository = createAdminSessionRepository(adapter, { now: clock.now });

  const created = await repository.createSession({
    userId: "owner-1",
    role: "OWNER",
    ttlMs: 1_000,
  });

  clock.advance(1_001);
  assert.equal(await repository.resolveSession(created.token), null);
});

test("revogacao invalida imediatamente a sessao", async () => {
  const adapter = createMemoryAdminSessionAdapter({ env: { NODE_ENV: "test" } });
  const repository = createAdminSessionRepository(adapter);

  const created = await repository.createSession({
    userId: "owner-1",
    role: "OWNER",
    ttlMs: 60_000,
  });

  assert.ok(await repository.resolveSession(created.token));
  assert.equal(await repository.revokeSession(created.session.id), true);
  assert.equal(await repository.resolveSession(created.token), null);
});

test("rotacao invalida token anterior e preserva sessao", async () => {
  const adapter = createMemoryAdminSessionAdapter({ env: { NODE_ENV: "test" } });
  const tokens = ["token-antigo-12345678901234567890", "token-novo-123456789012345678901"];
  const repository = createAdminSessionRepository(adapter, {
    tokenFactory: () => tokens.shift(),
  });

  const created = await repository.createSession({
    userId: "owner-1",
    role: "OWNER",
    ttlMs: 60_000,
  });

  const rotated = await repository.rotateSession({
    sessionId: created.session.id,
    currentToken: created.token,
  });

  assert.equal(await repository.resolveSession(created.token), null);
  assert.ok(await repository.resolveSession(rotated.token));
});

test("rotacao rejeita token que nao possui a sessao", async () => {
  const adapter = createMemoryAdminSessionAdapter({ env: { NODE_ENV: "test" } });
  const repository = createAdminSessionRepository(adapter);

  const created = await repository.createSession({
    userId: "owner-1",
    role: "OWNER",
    ttlMs: 60_000,
  });

  await assert.rejects(
    () => repository.rotateSession({
      sessionId: created.session.id,
      currentToken: "token-de-outra-sessao",
    }),
    /admin_session_rotation_not_owned/,
  );
});

test("memory adapter e proibido em producao por padrao", () => {
  assert.throws(
    () => createMemoryAdminSessionAdapter({ env: { NODE_ENV: "production" } }),
    /memory_admin_session_adapter_forbidden_in_production/,
  );
});

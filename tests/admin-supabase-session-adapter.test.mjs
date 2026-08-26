import test from "node:test";
import assert from "node:assert/strict";

import { createSupabaseAdminSessionAdapter } from "../api/_lib/admin-session-adapters/supabase.js";

function response(body, {
  status = 200,
  ok = status >= 200 && status < 300,
} = {}) {
  return {
    ok,
    status,
    async text() {
      return JSON.stringify(body);
    },
  };
}

const ENV = {
  SUPABASE_URL: "https://project.supabase.test",
  SUPABASE_SERVICE_ROLE_KEY: "service-role-test-only",
};

test("session adapter falha alto sem configuracao Supabase", async () => {
  const adapter = createSupabaseAdminSessionAdapter({
    env: {},
    fetchImpl: async () => response([]),
  });

  await assert.rejects(
    () => adapter.findByTokenHash("hash"),
    /admin_session_persistence_not_configured/,
  );
});

test("session adapter cria registro sem persistir token bruto", async () => {
  let request = null;

  const adapter = createSupabaseAdminSessionAdapter({
    env: ENV,
    fetchImpl: async (url, options) => {
      request = { url, options };
      const input = JSON.parse(options.body)[0];

      assert.equal("token" in input, false);
      assert.equal(input.token_hash, "hash-only");

      return response([{
        id: "session-1",
        ...input,
        version: 1,
      }]);
    },
  });

  const created = await adapter.create({
    userId: "owner-1",
    role: "OWNER",
    capabilities: ["journey:read"],
    tokenHash: "hash-only",
    issuedAt: "2026-08-26T10:00:00.000Z",
    expiresAt: "2026-08-26T11:00:00.000Z",
    revokedAt: null,
    metadata: null,
  });

  assert.match(request.url, /admin_sessions\?select=\*/);
  assert.equal(request.options.method, "POST");
  assert.equal(created.id, "session-1");
  assert.equal(created.tokenHash, "hash-only");
});

test("session adapter resolve por token hash e mapeia contrato do repository", async () => {
  const adapter = createSupabaseAdminSessionAdapter({
    env: ENV,
    fetchImpl: async (url) => {
      assert.match(url, /token_hash=eq\.hash-only/);

      return response([{
        id: "session-1",
        user_id: "owner-1",
        role: "OWNER",
        capabilities: ["journey:read"],
        token_hash: "hash-only",
        issued_at: "2026-08-26T10:00:00.000Z",
        expires_at: "2026-08-26T11:00:00.000Z",
        revoked_at: null,
        metadata: null,
        version: 1,
      }]);
    },
  });

  const session = await adapter.findByTokenHash("hash-only");

  assert.deepEqual(session, {
    id: "session-1",
    userId: "owner-1",
    role: "OWNER",
    capabilities: ["journey:read"],
    tokenHash: "hash-only",
    issuedAt: "2026-08-26T10:00:00.000Z",
    expiresAt: "2026-08-26T11:00:00.000Z",
    revokedAt: null,
    rotatedAt: null,
    metadata: null,
    version: 1,
  });
});

test("session adapter retorna null para token desconhecido", async () => {
  const adapter = createSupabaseAdminSessionAdapter({
    env: ENV,
    fetchImpl: async () => response([]),
  });

  assert.equal(await adapter.findByTokenHash("missing"), null);
});

test("session adapter revoga sessao por id", async () => {
  let body = null;

  const adapter = createSupabaseAdminSessionAdapter({
    env: ENV,
    fetchImpl: async (_url, options) => {
      body = JSON.parse(options.body);
      return response([{ id: "session-1" }]);
    },
  });

  assert.equal(
    await adapter.revokeById(
      "session-1",
      "2026-08-26T10:30:00.000Z",
    ),
    true,
  );

  assert.equal(
    body.revoked_at,
    "2026-08-26T10:30:00.000Z",
  );
});

test("session adapter rotaciona apenas token esperado de sessao ativa", async () => {
  let requestedUrl = null;
  let body = null;

  const adapter = createSupabaseAdminSessionAdapter({
    env: ENV,
    fetchImpl: async (url, options) => {
      requestedUrl = url;
      body = JSON.parse(options.body);

      return response([{
        id: "session-1",
        user_id: "owner-1",
        role: "OWNER",
        capabilities: [],
        token_hash: "next-hash",
        issued_at: "2026-08-26T10:00:00.000Z",
        expires_at: "2026-08-26T11:00:00.000Z",
        revoked_at: null,
        rotated_at: "2026-08-26T10:15:00.000Z",
        metadata: null,
        version: 2,
      }]);
    },
  });

  const updated = await adapter.replaceToken({
    sessionId: "session-1",
    expectedTokenHash: "current-hash",
    nextTokenHash: "next-hash",
    rotatedAt: "2026-08-26T10:15:00.000Z",
  });

  assert.match(requestedUrl, /id=eq\.session-1/);
  assert.match(requestedUrl, /token_hash=eq\.current-hash/);
  assert.match(requestedUrl, /revoked_at=is\.null/);
  assert.equal(body.token_hash, "next-hash");
  assert.equal(updated.tokenHash, "next-hash");
});

test("erro de session store nao inclui corpo remoto nem service role", async () => {
  const secret = ENV.SUPABASE_SERVICE_ROLE_KEY;

  const adapter = createSupabaseAdminSessionAdapter({
    env: ENV,
    fetchImpl: async () => ({
      ok: false,
      status: 503,
      async text() {
        return `upstream sensitive ${secret}`;
      },
    }),
  });

  await assert.rejects(
    async () => {
      try {
        await adapter.findByTokenHash("hash");
      } catch (error) {
        assert.equal(String(error.message).includes(secret), false);
        assert.equal(String(error.message).includes("upstream"), false);
        throw error;
      }
    },
    /admin_session_store_error:503/,
  );
});

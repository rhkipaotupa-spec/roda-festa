import test from "node:test";
import assert from "node:assert/strict";

import { createSupabaseAdminIdentityStore } from "../api/_lib/admin-identity-adapters/supabase.js";

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

test("identity store falha alto sem configuracao Supabase", async () => {
  const store = createSupabaseAdminIdentityStore({
    env: {},
    fetchImpl: async () => response([]),
  });

  await assert.rejects(
    () => store.findByIdentifier("owner@example.test"),
    /admin_identity_persistence_not_configured/,
  );
});

test("identity store normaliza identificador e usa service role somente server-side", async () => {
  let request = null;

  const store = createSupabaseAdminIdentityStore({
    env: {
      SUPABASE_URL: "https://project.supabase.test/",
      SUPABASE_SERVICE_ROLE_KEY: "service-role-test-only",
    },
    fetchImpl: async (url, options) => {
      request = { url, options };
      return response([]);
    },
  });

  await store.findByIdentifier("  OWNER@EXAMPLE.TEST ");

  assert.match(
    request.url,
    /admin_users\?identifier=eq\.owner%40example\.test/,
  );
  assert.equal(
    request.options.headers.apikey,
    "service-role-test-only",
  );
  assert.equal(
    request.options.headers.Authorization,
    "Bearer service-role-test-only",
  );
});

test("identity store consulta identidade atual por userId sem carregar material de credencial", async () => {
  let request = null;

  const store = createSupabaseAdminIdentityStore({
    env: {
      SUPABASE_URL: "https://project.supabase.test/",
      SUPABASE_SERVICE_ROLE_KEY: "service-role-test-only",
    },
    fetchImpl: async (url, options) => {
      request = { url, options };
      return response([{
        id: "admin-1",
        role: "ADMIN",
        capabilities: ["journey:read"],
        active: false,
        metadata: { source: "supabase" },
      }]);
    },
  });

  const identity = await store.findByUserId("  admin-1  ");

  assert.match(request.url, /admin_users\?id=eq\.admin-1/);
  assert.equal(request.url.includes("credential_hash"), false);
  assert.equal(request.url.includes("credential_salt"), false);
  assert.equal(request.options.method, "GET");
  assert.equal(identity.userId, "admin-1");
  assert.equal(identity.role, "ADMIN");
  assert.deepEqual(identity.capabilities, ["journey:read"]);
  assert.equal(identity.active, false);
  assert.equal("credential" in identity, false);
});

test("identity store mapeia registro Supabase para contrato do verifier", async () => {
  const store = createSupabaseAdminIdentityStore({
    env: {
      SUPABASE_URL: "https://project.supabase.test",
      SUPABASE_SERVICE_ROLE_KEY: "service-role-test-only",
    },
    fetchImpl: async () => response([{
      id: "admin-1",
      identifier: "owner@example.test",
      role: "OWNER",
      capabilities: ["journey:read"],
      active: true,
      credential_algorithm: "scrypt",
      credential_salt: "salt-value",
      credential_hash: "hash-value",
      credential_key_length: 32,
      metadata: { source: "supabase" },
    }]),
  });

  const identity = await store.findByIdentifier("owner@example.test");

  assert.deepEqual(identity, {
    userId: "admin-1",
    role: "OWNER",
    capabilities: ["journey:read"],
    active: true,
    metadata: { source: "supabase" },
    credential: {
      algorithm: "scrypt",
      salt: "salt-value",
      hash: "hash-value",
      keyLength: 32,
    },
  });
});

test("identity store retorna null para identificador ou userId inexistente", async () => {
  const store = createSupabaseAdminIdentityStore({
    env: {
      SUPABASE_URL: "https://project.supabase.test",
      SUPABASE_SERVICE_ROLE_KEY: "service-role-test-only",
    },
    fetchImpl: async () => response([]),
  });

  assert.equal(
    await store.findByIdentifier("missing@example.test"),
    null,
  );
  assert.equal(
    await store.findByUserId("missing-user"),
    null,
  );
});

test("erro de identity store nao inclui corpo remoto nem service role", async () => {
  const secret = "service-role-test-only";

  const store = createSupabaseAdminIdentityStore({
    env: {
      SUPABASE_URL: "https://project.supabase.test",
      SUPABASE_SERVICE_ROLE_KEY: secret,
    },
    fetchImpl: async () => ({
      ok: false,
      status: 500,
      async text() {
        return `sensitive upstream body ${secret}`;
      },
    }),
  });

  await assert.rejects(
    async () => {
      try {
        await store.findByIdentifier("owner@example.test");
      } catch (error) {
        assert.equal(String(error.message).includes(secret), false);
        assert.equal(String(error.message).includes("sensitive"), false);
        throw error;
      }
    },
    /admin_identity_store_error:500/,
  );
});

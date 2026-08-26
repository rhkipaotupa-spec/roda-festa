import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { hashAdminCredential } from "../api/_lib/admin-credential-verification.js";
import { createAdminRuntime } from "../api/_lib/admin-runtime.js";

const NOW = new Date("2026-08-26T12:00:00.000Z");

const ENV = {
  NODE_ENV: "test",
  SUPABASE_URL: "https://project.supabase.test",
  SUPABASE_SERVICE_ROLE_KEY: "service-role-test-only",
  RODA_FESTA_ADMIN_ALLOWED_ORIGINS: "https://admin.rodafesta.test",
};

test("runtime admin falha alto sem configuracao persistente", () => {
  assert.throws(
    () => createAdminRuntime({
      env: {},
      fetchImpl: async () => {
        throw new Error("should_not_run");
      },
    }),
    /admin_runtime_persistence_not_configured/,
  );
});

test("runtime admin exige fetch server-side valido", () => {
  assert.throws(
    () => createAdminRuntime({
      env: ENV,
      fetchImpl: null,
    }),
    /admin_runtime_fetch_required/,
  );
});

test("runtime compoe identity verifier session repository authorization e login", () => {
  const calls = [];

  const runtime = createAdminRuntime({
    env: ENV,
    fetchImpl: async () => {
      throw new Error("not_used");
    },
    createIdentityStore(options) {
      calls.push(["identity", options.env, options.fetchImpl]);
      return {
        findByIdentifier: async () => null,
      };
    },
    createCredentialVerifier(options) {
      calls.push(["verifier", options.findByIdentifier]);
      return async () => null;
    },
    createSessionAdapter(options) {
      calls.push(["session-adapter", options.env, options.fetchImpl]);
      return {
        create() {},
        findByTokenHash() {},
        revokeById() {},
        replaceToken() {},
      };
    },
    createSessionRepository(adapter) {
      calls.push(["session-repository", adapter]);
      return {
        createSession() {},
        resolveSession() {},
        revokeSession() {},
        rotateSession() {},
      };
    },
    createAuthorizationBoundary(options) {
      calls.push(["authorization", options.allowedRoles]);
      return {
        assert() {},
        can() {},
      };
    },
    createAuthenticationComposition(options) {
      calls.push(["authentication", options]);
      return {
        authenticate() {},
      };
    },
    createLoginComposition(options) {
      calls.push(["login", options]);
      return {
        login() {},
      };
    },
  });

  assert.equal(typeof runtime.loginComposition.login, "function");
  assert.equal(typeof runtime.authenticationComposition.authenticate, "function");
  assert.equal(typeof runtime.authorizationBoundary.assert, "function");

  assert.deepEqual(
    calls.map(([name]) => name),
    [
      "identity",
      "verifier",
      "session-adapter",
      "session-repository",
      "authorization",
      "authentication",
      "login",
    ],
  );
});

test("runtime nao contem fallback para adapter admin em memoria", async () => {
  const source = await readFile(
    new URL("../api/_lib/admin-runtime.js", import.meta.url),
    "utf8",
  );

  assert.equal(
    source.includes("admin-session-adapters/memory"),
    false,
  );
  assert.equal(
    source.includes("createMemoryAdminSessionAdapter"),
    false,
  );
});

test("runtime nao expoe service role em seu objeto publico", () => {
  const runtime = createAdminRuntime({
    env: ENV,
    fetchImpl: async () => {
      throw new Error("not_used");
    },
    createIdentityStore: () => ({
      findByIdentifier: async () => null,
    }),
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
    createAuthenticationComposition: () => ({
      authenticate() {},
    }),
    createCredentialVerifier: () => async () => null,
    createLoginComposition: () => ({
      login() {},
    }),
  });

  const serialized = JSON.stringify(runtime);

  assert.equal(
    serialized.includes(ENV.SUPABASE_SERVICE_ROLE_KEY),
    false,
  );
  assert.equal("env" in runtime, false);
  assert.equal("fetchImpl" in runtime, false);
});

test("runtime real fecha login ponta a ponta usando adapters Supabase simulados", async () => {
  const credential = hashAdminCredential("Senha-De-Teste-Runtime", {
    salt: Buffer.alloc(16, 23),
  });

  let sessionRow = null;

  const fetchImpl = async (url, options = {}) => {
    if (url.includes("/rest/v1/admin_users?")) {
      return {
        ok: true,
        status: 200,
        async text() {
          return JSON.stringify([{
            id: "owner-1",
            identifier: "owner@example.test",
            role: "OWNER",
            capabilities: ["journey:read"],
            active: true,
            credential_algorithm: credential.algorithm,
            credential_salt: credential.salt,
            credential_hash: credential.hash,
            credential_key_length: credential.keyLength,
            metadata: { source: "test" },
          }]);
        },
      };
    }

    if (url.includes("/rest/v1/admin_sessions?select=*")
        && options.method === "POST") {
      const input = JSON.parse(options.body)[0];
      sessionRow = {
        id: "session-1",
        ...input,
        rotated_at: null,
        version: 1,
      };

      return {
        ok: true,
        status: 201,
        async text() {
          return JSON.stringify([sessionRow]);
        },
      };
    }

    if (url.includes("/rest/v1/admin_sessions?token_hash=")
        && (!options.method || options.method === "GET")) {
      const found = sessionRow ? [sessionRow] : [];

      return {
        ok: true,
        status: 200,
        async text() {
          return JSON.stringify(found);
        },
      };
    }

    throw new Error(`unexpected_request:${url}:${options.method || "GET"}`);
  };

  const runtime = createAdminRuntime({
    env: ENV,
    fetchImpl,
    now: () => new Date(NOW),
    tokenFactory: () => "runtime-opaque-token",
    sessionTtlMs: 60_000,
    production: false,
  });

  const result = await runtime.loginComposition.login({
    method: "POST",
    headers: {
      origin: "https://admin.rodafesta.test",
      host: "admin.rodafesta.test",
      "x-forwarded-proto": "https",
    },
    body: {
      identifier: "owner@example.test",
      credential: "Senha-De-Teste-Runtime",
    },
  });

  assert.equal(result.status, 200);
  assert.equal(result.body.ok, true);
  assert.equal(result.body.session.principal.userId, "owner-1");
  assert.equal(result.body.session.principal.role, "OWNER");
  assert.match(result.setCookie, /^rf_admin_session=/);

  assert.ok(sessionRow);
  assert.equal("token" in sessionRow, false);
  assert.equal(
    sessionRow.token_hash.includes("runtime-opaque-token"),
    false,
  );
});

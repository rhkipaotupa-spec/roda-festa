import test from "node:test";
import assert from "node:assert/strict";

import { createAdminLoginComposition } from "../api/_lib/admin-login-composition.js";

test("composicao de login exige verifier server-side", () => {
  assert.throws(
    () => createAdminLoginComposition({
      createHttpBoundary: () => ({ login() {} }),
    }),
    /admin_login_credential_verifier_required/,
  );
});

test("composicao de login exige factory de boundary HTTP", () => {
  assert.throws(
    () => createAdminLoginComposition({
      verifyCredential: async () => null,
      createHttpBoundary: null,
    }),
    /admin_login_http_boundary_factory_required/,
  );
});

test("composicao injeta verifier na construcao da boundary real", async () => {
  const verifyCredential = async () => ({
    userId: "owner-1",
    role: "OWNER",
    capabilities: ["journey:read"],
  });

  const sessionRepository = { marker: "repository" };
  const authenticationComposition = { marker: "authentication" };
  const env = { NODE_ENV: "test", MARKER: "env" };

  let receivedOptions = null;
  let receivedRequest = null;

  const composition = createAdminLoginComposition({
    verifyCredential,
    sessionRepository,
    authenticationComposition,
    env,
    production: false,
    cookieName: "rf_admin_test",
    sessionTtlMs: 12345,
    createHttpBoundary(options) {
      receivedOptions = options;
      return {
        async login(request) {
          receivedRequest = request;
          return { status: 204 };
        },
      };
    },
  });

  const request = {
    method: "POST",
    headers: { origin: "https://admin.example.test" },
  };

  const result = await composition.login(request);

  assert.equal(receivedOptions.credentialVerifier, verifyCredential);
  assert.equal(receivedOptions.sessionRepository, sessionRepository);
  assert.equal(receivedOptions.authenticationComposition, authenticationComposition);
  assert.equal(receivedOptions.env, env);
  assert.equal(receivedOptions.production, false);
  assert.equal(receivedOptions.cookieName, "rf_admin_test");
  assert.equal(receivedOptions.sessionTtlMs, 12345);
  assert.equal(receivedRequest, request);
  assert.deepEqual(result, { status: 204 });
});

test("request do cliente nao participa da injecao do verifier", async () => {
  const trustedVerifier = async () => ({ userId: "trusted" });
  const forgedVerifier = async () => ({ userId: "forged" });

  let injectedVerifier = null;

  const composition = createAdminLoginComposition({
    verifyCredential: trustedVerifier,
    sessionRepository: {},
    authenticationComposition: {},
    createHttpBoundary(options) {
      injectedVerifier = options.credentialVerifier;
      return {
        async login() {
          return { status: 204 };
        },
      };
    },
  });

  await composition.login({
    method: "POST",
    verifyCredential: forgedVerifier,
  });

  assert.equal(injectedVerifier, trustedVerifier);
  assert.notEqual(injectedVerifier, forgedVerifier);
});

test("factory precisa retornar boundary com login", () => {
  assert.throws(
    () => createAdminLoginComposition({
      verifyCredential: async () => null,
      createHttpBoundary: () => ({}),
    }),
    /admin_login_http_boundary_required/,
  );
});

import test from "node:test";
import assert from "node:assert/strict";

import { createAdminLoginComposition } from "../api/_lib/admin-login-composition.js";

test("composicao de login exige verifier server-side", () => {
  assert.throws(
    () => createAdminLoginComposition({
      authHttpBoundary: { login() {} },
    }),
    /admin_login_credential_verifier_required/,
  );
});

test("composicao de login exige boundary HTTP real", () => {
  assert.throws(
    () => createAdminLoginComposition({
      verifyCredential: async () => null,
    }),
    /admin_login_http_boundary_required/,
  );
});

test("login delega request ao boundary e injeta verifier confiavel", async () => {
  const verifyCredential = async () => ({
    userId: "owner-1",
    role: "OWNER",
    capabilities: ["journey:read"],
  });

  let receivedRequest = null;
  let receivedVerifier = null;

  const composition = createAdminLoginComposition({
    verifyCredential,
    authHttpBoundary: {
      async login(request, dependencies) {
        receivedRequest = request;
        receivedVerifier = dependencies.verifyCredential;
        return { status: 204 };
      },
    },
  });

  const request = {
    method: "POST",
    headers: { origin: "https://admin.example.test" },
  };

  const result = await composition.login(request);

  assert.equal(receivedRequest, request);
  assert.equal(receivedVerifier, verifyCredential);
  assert.deepEqual(result, { status: 204 });
});

test("cliente nao consegue substituir verifier pela requisicao", async () => {
  const trustedVerifier = async () => ({ userId: "trusted" });
  const forgedVerifier = async () => ({ userId: "forged" });

  let usedVerifier = null;

  const composition = createAdminLoginComposition({
    verifyCredential: trustedVerifier,
    authHttpBoundary: {
      async login(_request, dependencies) {
        usedVerifier = dependencies.verifyCredential;
        return { status: 204 };
      },
    },
  });

  await composition.login({
    method: "POST",
    verifyCredential: forgedVerifier,
  });

  assert.equal(usedVerifier, trustedVerifier);
  assert.notEqual(usedVerifier, forgedVerifier);
});

test("resultado do boundary e preservado sem expor dependencias", async () => {
  const composition = createAdminLoginComposition({
    verifyCredential: async () => null,
    authHttpBoundary: {
      async login() {
        return {
          status: 401,
          body: { error: "invalid_credentials" },
        };
      },
    },
  });

  const result = await composition.login({ method: "POST" });

  assert.deepEqual(result, {
    status: 401,
    body: { error: "invalid_credentials" },
  });

  assert.equal("verifyCredential" in result, false);
});

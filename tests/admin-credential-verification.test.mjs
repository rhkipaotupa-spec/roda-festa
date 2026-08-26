import test from "node:test";
import assert from "node:assert/strict";

import {
  createAdminCredentialVerifier,
  hashAdminCredential,
  verifyAdminCredentialHash,
} from "../api/_lib/admin-credential-verification.js";

test("hash administrativo usa scrypt e salt sem armazenar credencial bruta", () => {
  const result = hashAdminCredential("segredo-de-teste", {
    salt: Buffer.alloc(16, 7),
  });

  assert.equal(result.algorithm, "scrypt");
  assert.equal(result.keyLength, 32);
  assert.ok(result.salt);
  assert.ok(result.hash);
  assert.equal(JSON.stringify(result).includes("segredo-de-teste"), false);
});

test("verificacao aceita credencial correta e rejeita incorreta", () => {
  const stored = hashAdminCredential("correta", {
    salt: Buffer.alloc(16, 9),
  });

  assert.equal(verifyAdminCredentialHash("correta", stored), true);
  assert.equal(verifyAdminCredentialHash("incorreta", stored), false);
});

test("hash exige salt e comprimento criptografico adequados", () => {
  assert.throws(
    () => hashAdminCredential("senha", { salt: Buffer.alloc(8) }),
    /admin_credential_salt_too_short/,
  );

  assert.throws(
    () => hashAdminCredential("senha", {
      salt: Buffer.alloc(16),
      keyLength: 16,
    }),
    /admin_credential_key_length_invalid/,
  );
});

test("verificador normaliza identificador mas nao altera credencial", async () => {
  const credential = hashAdminCredential("SenhaComMaiuscula", {
    salt: Buffer.alloc(16, 11),
  });

  let receivedIdentifier = null;
  const verifier = createAdminCredentialVerifier({
    findByIdentifier: async (identifier) => {
      receivedIdentifier = identifier;
      return {
        userId: "owner-1",
        role: "owner",
        capabilities: ["journey:read"],
        credential,
      };
    },
  });

  const identity = await verifier({
    identifier: "  OWNER@EXAMPLE.TEST ",
    credential: "SenhaComMaiuscula",
  });

  assert.equal(receivedIdentifier, "owner@example.test");
  assert.equal(identity.userId, "owner-1");
  assert.equal(identity.role, "OWNER");

  assert.equal(await verifier({
    identifier: "owner@example.test",
    credential: "senhacommaiuscula",
  }), null);
});

test("usuario inexistente ou credencial incorreta retornam o mesmo resultado neutro", async () => {
  const credential = hashAdminCredential("correta", {
    salt: Buffer.alloc(16, 13),
  });

  const verifier = createAdminCredentialVerifier({
    findByIdentifier: async (identifier) => (
      identifier === "owner@example.test"
        ? {
            userId: "owner-1",
            role: "OWNER",
            capabilities: [],
            credential,
          }
        : null
    ),
  });

  assert.equal(await verifier({
    identifier: "naoexiste@example.test",
    credential: "qualquer",
  }), null);

  assert.equal(await verifier({
    identifier: "owner@example.test",
    credential: "errada",
  }), null);
});

test("conta administrativa inativa nunca autentica", async () => {
  const verifier = createAdminCredentialVerifier({
    findByIdentifier: async () => ({
      userId: "owner-1",
      role: "OWNER",
      active: false,
      credential: hashAdminCredential("correta", {
        salt: Buffer.alloc(16, 15),
      }),
    }),
  });

  assert.equal(await verifier({
    identifier: "owner@example.test",
    credential: "correta",
  }), null);
});

test("identity retornada vem somente do registro confiavel server-side", async () => {
  const verifier = createAdminCredentialVerifier({
    findByIdentifier: async () => ({
      userId: "admin-2",
      role: "commercial",
      capabilities: ["journey:read", "journey:read", "proposal:write"],
      credential: hashAdminCredential("correta", {
        salt: Buffer.alloc(16, 17),
      }),
      metadata: { source: "trusted-store" },
    }),
  });

  const identity = await verifier({
    identifier: "admin@example.test",
    credential: "correta",
    role: "OWNER",
    capabilities: ["pricing:write"],
  });

  assert.deepEqual(identity, {
    userId: "admin-2",
    role: "COMMERCIAL",
    capabilities: ["journey:read", "proposal:write"],
    metadata: { source: "trusted-store" },
  });
});

test("verificador falha alto sem lookup server-side", () => {
  assert.throws(
    () => createAdminCredentialVerifier(),
    /admin_credential_lookup_required/,
  );
});

test("registro autenticado com identidade incompleta falha alto", async () => {
  const verifier = createAdminCredentialVerifier({
    findByIdentifier: async () => ({
      userId: "",
      role: "OWNER",
      credential: hashAdminCredential("correta", {
        salt: Buffer.alloc(16, 19),
      }),
    }),
  });

  await assert.rejects(
    () => verifier({
      identifier: "owner@example.test",
      credential: "correta",
    }),
    /admin_credential_identity_invalid/,
  );
});

test("resultado autenticado nao expoe hash, salt ou credential", async () => {
  const stored = hashAdminCredential("correta", {
    salt: Buffer.alloc(16, 21),
  });

  const verifier = createAdminCredentialVerifier({
    findByIdentifier: async () => ({
      userId: "owner-1",
      role: "OWNER",
      capabilities: ["journey:read"],
      credential: stored,
    }),
  });

  const identity = await verifier({
    identifier: "owner@example.test",
    credential: "correta",
  });

  const serialized = JSON.stringify(identity);
  assert.equal(serialized.includes(stored.hash), false);
  assert.equal(serialized.includes(stored.salt), false);
  assert.equal(serialized.includes("correta"), false);
});

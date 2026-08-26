import {
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";

const DEFAULT_KEY_LENGTH = 32;
const DEFAULT_SALT_BYTES = 16;

function normalizeIdentifier(value) {
  return String(value || "").trim().toLowerCase();
}

function normalizeCredential(value) {
  return String(value || "");
}

function assertLookup(findByIdentifier) {
  if (typeof findByIdentifier !== "function") {
    throw new Error("admin_credential_lookup_required");
  }
}

function decodeBase64Url(value, field) {
  try {
    const buffer = Buffer.from(String(value || ""), "base64url");
    if (buffer.length === 0) throw new Error("empty");
    return buffer;
  } catch {
    throw new Error(`admin_credential_invalid_${field}`);
  }
}

export function hashAdminCredential(
  credential,
  {
    salt = randomBytes(DEFAULT_SALT_BYTES),
    keyLength = DEFAULT_KEY_LENGTH,
  } = {},
) {
  const secret = normalizeCredential(credential);
  if (!secret) throw new Error("admin_credential_required");

  const saltBuffer = Buffer.isBuffer(salt) ? salt : Buffer.from(salt);
  if (saltBuffer.length < 16) throw new Error("admin_credential_salt_too_short");

  const length = Number(keyLength);
  if (!Number.isInteger(length) || length < 32) {
    throw new Error("admin_credential_key_length_invalid");
  }

  const derived = scryptSync(secret, saltBuffer, length);

  return Object.freeze({
    algorithm: "scrypt",
    salt: saltBuffer.toString("base64url"),
    hash: derived.toString("base64url"),
    keyLength: length,
  });
}

export function verifyAdminCredentialHash(credential, stored) {
  const secret = normalizeCredential(credential);
  if (!secret) return false;
  if (!stored || stored.algorithm !== "scrypt") return false;

  const salt = decodeBase64Url(stored.salt, "salt");
  const expected = decodeBase64Url(stored.hash, "hash");
  const keyLength = Number(stored.keyLength ?? expected.length);

  if (!Number.isInteger(keyLength) || keyLength < 32) return false;
  if (expected.length !== keyLength) return false;

  const actual = scryptSync(secret, salt, keyLength);
  if (actual.length !== expected.length) return false;

  return timingSafeEqual(actual, expected);
}

export function createAdminCredentialVerifier({
  findByIdentifier,
} = {}) {
  assertLookup(findByIdentifier);

  return async function verifyAdminCredential({
    identifier,
    credential,
  } = {}) {
    const normalizedIdentifier = normalizeIdentifier(identifier);
    const secret = normalizeCredential(credential);

    if (!normalizedIdentifier || !secret) return null;

    const record = await findByIdentifier(normalizedIdentifier);
    if (!record || typeof record !== "object") return null;
    if (record.active === false) return null;

    const valid = verifyAdminCredentialHash(secret, record.credential);
    if (!valid) return null;

    const userId = String(record.userId || "").trim();
    const role = String(record.role || "").trim().toUpperCase();

    if (!userId || !role) {
      throw new Error("admin_credential_identity_invalid");
    }

    return Object.freeze({
      userId,
      role,
      capabilities: Object.freeze(
        [...new Set(
          (Array.isArray(record.capabilities) ? record.capabilities : [])
            .map((value) => String(value || "").trim())
            .filter(Boolean),
        )].sort(),
      ),
      metadata: record.metadata ?? null,
    });
  };
}

import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

const TOKEN_BYTES = 32;

function nowIso(now = new Date()) {
  return now.toISOString();
}

function parseDate(value, field) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error(`admin_session_invalid_${field}`);
  return date;
}

export function generateAdminSessionToken() {
  return randomBytes(TOKEN_BYTES).toString("base64url");
}

export function hashAdminSessionToken(token) {
  const value = String(token || "");
  if (!value) throw new Error("admin_session_token_required");
  return createHash("sha256").update(value, "utf8").digest("hex");
}

export function safeTokenHashEquals(left, right) {
  const a = Buffer.from(String(left || ""), "utf8");
  const b = Buffer.from(String(right || ""), "utf8");
  if (a.length !== b.length || a.length === 0) return false;
  return timingSafeEqual(a, b);
}

export function createAdminSessionRepository(adapter, {
  now = () => new Date(),
  tokenFactory = generateAdminSessionToken,
} = {}) {
  const required = ["create", "findByTokenHash", "revokeById", "replaceToken"];
  for (const method of required) {
    if (typeof adapter?.[method] !== "function") {
      throw new Error(`admin_session_adapter_missing:${method}`);
    }
  }

  async function createSession({
    userId,
    role,
    capabilities = [],
    ttlMs,
    metadata = null,
  }) {
    const normalizedUserId = String(userId || "").trim();
    const normalizedRole = String(role || "").trim().toUpperCase();
    const ttl = Number(ttlMs);

    if (!normalizedUserId) throw new Error("admin_session_user_required");
    if (!normalizedRole) throw new Error("admin_session_role_required");
    if (!Number.isFinite(ttl) || ttl <= 0) throw new Error("admin_session_ttl_invalid");

    const issuedAt = now();
    const expiresAt = new Date(issuedAt.getTime() + ttl);
    const token = tokenFactory();
    const tokenHash = hashAdminSessionToken(token);

    const record = await adapter.create({
      userId: normalizedUserId,
      role: normalizedRole,
      capabilities: [...new Set(capabilities.map(String))],
      tokenHash,
      issuedAt: nowIso(issuedAt),
      expiresAt: nowIso(expiresAt),
      revokedAt: null,
      metadata,
    });

    return Object.freeze({
      token,
      session: Object.freeze({ ...record, tokenHash: undefined }),
    });
  }

  async function resolveSession(token) {
    if (!token) return null;

    const tokenHash = hashAdminSessionToken(token);
    const record = await adapter.findByTokenHash(tokenHash);
    if (!record) return null;
    if (!safeTokenHashEquals(record.tokenHash, tokenHash)) return null;
    if (record.revokedAt) return null;

    const current = now();
    const expiresAt = parseDate(record.expiresAt, "expires_at");
    if (expiresAt.getTime() <= current.getTime()) return null;

    return Object.freeze({
      sessionId: record.id,
      userId: record.userId,
      role: record.role,
      capabilities: Object.freeze([...(record.capabilities || [])]),
      issuedAt: record.issuedAt,
      expiresAt: record.expiresAt,
      metadata: record.metadata ?? null,
      active: true,
    });
  }

  async function revokeSession(sessionId) {
    const id = String(sessionId || "").trim();
    if (!id) throw new Error("admin_session_id_required");
    return adapter.revokeById(id, nowIso(now()));
  }

  async function rotateSession({ sessionId, currentToken }) {
    const currentHash = hashAdminSessionToken(currentToken);
    const currentRecord = await adapter.findByTokenHash(currentHash);

    if (!currentRecord || currentRecord.id !== sessionId) {
      throw new Error("admin_session_rotation_not_owned");
    }
    if (currentRecord.revokedAt) throw new Error("admin_session_revoked");

    const expiresAt = parseDate(currentRecord.expiresAt, "expires_at");
    if (expiresAt.getTime() <= now().getTime()) throw new Error("admin_session_expired");

    const nextToken = tokenFactory();
    const nextHash = hashAdminSessionToken(nextToken);
    const updated = await adapter.replaceToken({
      sessionId,
      expectedTokenHash: currentHash,
      nextTokenHash: nextHash,
      rotatedAt: nowIso(now()),
    });

    if (!updated) throw new Error("admin_session_rotation_conflict");

    return Object.freeze({
      token: nextToken,
      sessionId,
    });
  }

  return Object.freeze({
    createSession,
    resolveSession,
    revokeSession,
    rotateSession,
  });
}

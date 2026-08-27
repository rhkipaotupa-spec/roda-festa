import { buildSupabaseRestHeaders } from "../supabase-rest-auth.js";

function getConfig(env = process.env) {
  const url = String(env.SUPABASE_URL || "").replace(/\/$/, "");
  const serviceRoleKey = String(env.SUPABASE_SERVICE_ROLE_KEY || "");

  if (!url || !serviceRoleKey) {
    throw new Error("admin_session_persistence_not_configured");
  }

  return { url, serviceRoleKey };
}

function eq(value) {
  return `eq.${encodeURIComponent(String(value))}`;
}

function mapSession(row) {
  if (!row) return null;

  return {
    id: row.id,
    userId: row.user_id,
    role: row.role,
    capabilities: Array.isArray(row.capabilities) ? row.capabilities : [],
    tokenHash: row.token_hash,
    issuedAt: row.issued_at,
    expiresAt: row.expires_at,
    revokedAt: row.revoked_at,
    rotatedAt: row.rotated_at ?? null,
    metadata: row.metadata ?? null,
    version: Number(row.version ?? 1),
  };
}

function toRow(input) {
  return {
    user_id: input.userId,
    role: input.role,
    capabilities: input.capabilities,
    token_hash: input.tokenHash,
    issued_at: input.issuedAt,
    expires_at: input.expiresAt,
    revoked_at: input.revokedAt,
    metadata: input.metadata,
  };
}

export function createSupabaseAdminSessionAdapter({
  env = process.env,
  fetchImpl = globalThis.fetch,
} = {}) {
  if (typeof fetchImpl !== "function") {
    throw new Error("admin_session_fetch_required");
  }

  async function request(path, {
    method = "GET",
    body,
    prefer,
  } = {}) {
    const { url, serviceRoleKey } = getConfig(env);

    const response = await fetchImpl(`${url}/rest/v1/${path}`, {
      method,
      headers: buildSupabaseRestHeaders(serviceRoleKey, { prefer }),
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });

    if (!response.ok) {
      const error = new Error(`admin_session_store_error:${response.status}`);
      error.status = response.status;
      throw error;
    }

    if (response.status === 204) return null;

    const text = await response.text();
    return text ? JSON.parse(text) : null;
  }

  return Object.freeze({
    async create(input) {
      const rows = await request("admin_sessions?select=*", {
        method: "POST",
        prefer: "return=representation",
        body: [toRow(input)],
      });

      if (!rows?.[0]) {
        throw new Error("admin_session_store_create_failed");
      }

      return mapSession(rows[0]);
    },

    async findByTokenHash(tokenHash) {
      const rows = await request(
        `admin_sessions?token_hash=${eq(tokenHash)}&select=*&limit=1`,
      );

      return mapSession(rows?.[0] || null);
    },

    async revokeById(sessionId, revokedAt) {
      const rows = await request(
        `admin_sessions?id=${eq(sessionId)}&select=id`,
        {
          method: "PATCH",
          prefer: "return=representation",
          body: {
            revoked_at: revokedAt,
            version: 2,
          },
        },
      );

      return Boolean(rows?.[0]);
    },

    async replaceToken({
      sessionId,
      expectedTokenHash,
      nextTokenHash,
      rotatedAt,
    }) {
      const rows = await request(
        `admin_sessions?id=${eq(sessionId)}&token_hash=${eq(expectedTokenHash)}&revoked_at=is.null&select=*`,
        {
          method: "PATCH",
          prefer: "return=representation",
          body: {
            token_hash: nextTokenHash,
            rotated_at: rotatedAt,
          },
        },
      );

      return mapSession(rows?.[0] || null);
    },
  });
}

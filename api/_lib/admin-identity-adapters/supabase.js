const JSON_HEADERS = { "Content-Type": "application/json" };

function getConfig(env = process.env) {
  const url = String(env.SUPABASE_URL || "").replace(/\/$/, "");
  const serviceRoleKey = String(env.SUPABASE_SERVICE_ROLE_KEY || "");

  if (!url || !serviceRoleKey) {
    throw new Error("admin_identity_persistence_not_configured");
  }

  return { url, serviceRoleKey };
}

function eq(value) {
  return `eq.${encodeURIComponent(String(value))}`;
}

function normalizeIdentifier(value) {
  return String(value || "").trim().toLowerCase();
}

function mapIdentity(row) {
  if (!row) return null;

  return Object.freeze({
    userId: String(row.id || "").trim(),
    role: String(row.role || "").trim(),
    capabilities: Object.freeze(
      Array.isArray(row.capabilities) ? [...row.capabilities] : [],
    ),
    active: row.active !== false,
    credential: Object.freeze({
      algorithm: String(row.credential_algorithm || ""),
      salt: String(row.credential_salt || ""),
      hash: String(row.credential_hash || ""),
      keyLength: Number(row.credential_key_length),
    }),
    metadata: row.metadata ?? null,
  });
}

export function createSupabaseAdminIdentityStore({
  env = process.env,
  fetchImpl = globalThis.fetch,
} = {}) {
  if (typeof fetchImpl !== "function") {
    throw new Error("admin_identity_fetch_required");
  }

  async function request(path) {
    const { url, serviceRoleKey } = getConfig(env);
    const response = await fetchImpl(`${url}/rest/v1/${path}`, {
      method: "GET",
      headers: {
        ...JSON_HEADERS,
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
    });

    if (!response.ok) {
      const error = new Error(`admin_identity_store_error:${response.status}`);
      error.status = response.status;
      throw error;
    }

    const text = await response.text();
    return text ? JSON.parse(text) : [];
  }

  return Object.freeze({
    async findByIdentifier(identifier) {
      const normalized = normalizeIdentifier(identifier);
      if (!normalized) return null;

      const select = [
        "id",
        "identifier",
        "role",
        "capabilities",
        "active",
        "credential_algorithm",
        "credential_salt",
        "credential_hash",
        "credential_key_length",
        "metadata",
      ].join(",");

      const rows = await request(
        `admin_users?identifier=${eq(normalized)}&select=${select}&limit=1`,
      );

      return mapIdentity(rows?.[0] || null);
    },
  });
}

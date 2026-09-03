import { buildSupabaseRestHeaders } from "../supabase-rest-auth.js";

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

function normalizeUserId(value) {
  return String(value || "").trim();
}

function identitySelect({ includeCredential = true } = {}) {
  const fields = [
    "id",
    "identifier",
    "role",
    "capabilities",
    "active",
    "metadata",
  ];

  if (includeCredential) {
    fields.splice(5, 0,
      "credential_algorithm",
      "credential_salt",
      "credential_hash",
      "credential_key_length",
    );
  }

  return fields.join(",");
}

function mapIdentity(row, { includeCredential = true } = {}) {
  if (!row) return null;

  const identity = {
    userId: String(row.id || "").trim(),
    role: String(row.role || "").trim(),
    capabilities: Object.freeze(
      Array.isArray(row.capabilities) ? [...row.capabilities] : [],
    ),
    active: row.active !== false,
    metadata: row.metadata ?? null,
  };

  if (includeCredential) {
    identity.credential = Object.freeze({
      algorithm: String(row.credential_algorithm || ""),
      salt: String(row.credential_salt || ""),
      hash: String(row.credential_hash || ""),
      keyLength: Number(row.credential_key_length),
    });
  }

  return Object.freeze(identity);
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
      headers: buildSupabaseRestHeaders(serviceRoleKey),
    });

    if (!response.ok) {
      const error = new Error(`admin_identity_store_error:${response.status}`);
      error.status = response.status;
      throw error;
    }

    const text = await response.text();
    return text ? JSON.parse(text) : [];
  }

  async function findByIdentifier(identifier) {
    const normalized = normalizeIdentifier(identifier);
    if (!normalized) return null;

    const rows = await request(
      `admin_users?identifier=${eq(normalized)}&select=${identitySelect()}&limit=1`,
    );

    return mapIdentity(rows?.[0] || null);
  }

  async function findByUserId(userId) {
    const normalized = normalizeUserId(userId);
    if (!normalized) return null;

    const rows = await request(
      `admin_users?id=${eq(normalized)}&select=${identitySelect({ includeCredential: false })}&limit=1`,
    );

    return mapIdentity(rows?.[0] || null, { includeCredential: false });
  }

  return Object.freeze({
    findByIdentifier,
    findByUserId,
  });
}

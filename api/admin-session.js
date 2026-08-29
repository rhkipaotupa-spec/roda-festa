import { createAdminRuntime } from "./_lib/admin-runtime.js";
import { buildSupabaseRestHeaders } from "./_lib/supabase-rest-auth.js";

const JSON_CONTENT_TYPE = "application/json; charset=utf-8";
const OPERATOR_NAME_KEYS = ["displayName", "display_name", "name", "fullName", "full_name"];

function sendJson(response, status, body, headers = {}) {
  response.statusCode = status;
  response.setHeader("Content-Type", JSON_CONTENT_TYPE);

  for (const [name, value] of Object.entries(headers)) {
    if (value != null) response.setHeader(name, value);
  }

  response.end(JSON.stringify(body));
}

function normalizeCookieHeader(headers = {}) {
  const value = headers.cookie ?? headers.Cookie ?? "";
  return Array.isArray(value) ? value.join("; ") : String(value || "");
}

function removeUnsafeControlCharacters(value) {
  return Array.from(String(value || ""))
    .filter((character) => {
      const codePoint = character.codePointAt(0);
      return Number.isInteger(codePoint) && codePoint >= 0x20 && codePoint !== 0x7f;
    })
    .join("");
}

function normalizeOperatorName(value) {
  const normalized = removeUnsafeControlCharacters(value)
    .replace(/\s+/g, " ")
    .trim();
  if (!normalized) return "";
  return normalized.slice(0, 80);
}

function metadataOperatorName(metadata) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return "";
  for (const key of OPERATOR_NAME_KEYS) {
    const candidate = normalizeOperatorName(metadata[key]);
    if (candidate) return candidate;
  }
  return "";
}

function identifierOperatorName(identifier) {
  const localPart = String(identifier || "").trim().split("@")[0] || "";
  const words = localPart
    .split(/[._-]+/)
    .map((value) => value.trim())
    .filter(Boolean)
    .slice(0, 3);

  if (words.length === 0) return "";
  const readable = words
    .map((word) => word.charAt(0).toLocaleUpperCase("pt-BR") + word.slice(1).toLocaleLowerCase("pt-BR"))
    .join(" ");
  return normalizeOperatorName(readable);
}

function roleOperatorName(role) {
  const normalized = String(role || "").trim().toUpperCase();
  if (normalized === "OWNER") return "Responsável da conta";
  if (normalized === "ADMIN") return "Administrador";
  return "Acesso administrativo";
}

function publicOperator({ displayName, role } = {}) {
  return Object.freeze({
    displayName: normalizeOperatorName(displayName) || roleOperatorName(role),
    role: String(role || "").trim().toUpperCase(),
  });
}

function publicAuthenticatedSession(session, operator) {
  return Object.freeze({
    authenticated: true,
    role: String(session?.principal?.role || ""),
    expiresAt: session?.expiresAt ?? null,
    operator: publicOperator({
      displayName: operator?.displayName,
      role: operator?.role || session?.principal?.role,
    }),
  });
}

function createOperatorResolver({ env = process.env, fetchImpl = globalThis.fetch } = {}) {
  return async function resolveOperator(session) {
    const sessionMetadataName = metadataOperatorName(session?.metadata);
    const role = String(session?.principal?.role || "").trim().toUpperCase();
    if (sessionMetadataName) {
      return publicOperator({ displayName: sessionMetadataName, role });
    }

    const userId = String(session?.principal?.userId || "").trim();
    const url = String(env?.SUPABASE_URL || "").replace(/\/$/, "");
    const serviceRoleKey = String(env?.SUPABASE_SERVICE_ROLE_KEY || "").trim();
    if (!userId || !url || !serviceRoleKey || typeof fetchImpl !== "function") {
      return publicOperator({ role });
    }

    try {
      const select = "identifier,role,metadata,active";
      const response = await fetchImpl(
        `${url}/rest/v1/admin_users?id=eq.${encodeURIComponent(userId)}&select=${encodeURIComponent(select)}&limit=1`,
        {
          method: "GET",
          headers: buildSupabaseRestHeaders(serviceRoleKey),
        },
      );
      if (!response.ok) return publicOperator({ role });

      const text = await response.text();
      const rows = text ? JSON.parse(text) : [];
      const identity = rows?.[0] || null;
      if (!identity || identity.active === false) return publicOperator({ role });

      return publicOperator({
        displayName: metadataOperatorName(identity.metadata)
          || identifierOperatorName(identity.identifier),
        role: identity.role || role,
      });
    } catch {
      return publicOperator({ role });
    }
  };
}

export function createAdminSessionHttpHandler({
  authenticationComposition,
  resolveOperator = async (session) => publicOperator({ role: session?.principal?.role }),
} = {}) {
  if (!authenticationComposition
      || typeof authenticationComposition.authenticate !== "function") {
    throw new Error("admin_session_endpoint_composition_required");
  }
  if (typeof resolveOperator !== "function") {
    throw new Error("admin_session_endpoint_operator_resolver_required");
  }

  return async function adminSessionHttpHandler(request, response) {
    if (String(request?.method || "").toUpperCase() !== "GET") {
      sendJson(
        response,
        405,
        { ok: false, error: "method_not_allowed" },
        { Allow: "GET" },
      );
      return;
    }

    try {
      const session = await authenticationComposition.authenticate({
        cookieHeader: normalizeCookieHeader(request?.headers || {}),
      });

      if (!session) {
        sendJson(response, 200, {
          ok: true,
          authenticated: false,
        });
        return;
      }

      let operator;
      try {
        operator = await resolveOperator(session);
      } catch {
        operator = publicOperator({ role: session?.principal?.role });
      }

      sendJson(response, 200, {
        ok: true,
        ...publicAuthenticatedSession(session, operator),
      });
    } catch {
      sendJson(response, 200, {
        ok: true,
        authenticated: false,
      });
    }
  };
}

export function createAdminSessionRuntimeHandler({
  createRuntime = createAdminRuntime,
  env = process.env,
  fetchImpl = globalThis.fetch,
} = {}) {
  if (typeof createRuntime !== "function") {
    throw new Error("admin_session_runtime_factory_required");
  }

  return async function adminSessionRuntimeHandler(request, response) {
    let runtime;

    try {
      runtime = createRuntime({
        env,
        fetchImpl,
      });
    } catch {
      sendJson(response, 503, {
        ok: false,
        error: "admin_session_runtime_unavailable",
      });
      return;
    }

    if (!runtime?.authenticationComposition
        || typeof runtime.authenticationComposition.authenticate !== "function") {
      sendJson(response, 503, {
        ok: false,
        error: "admin_session_runtime_unavailable",
      });
      return;
    }

    const httpHandler = createAdminSessionHttpHandler({
      authenticationComposition: runtime.authenticationComposition,
      resolveOperator: createOperatorResolver({ env, fetchImpl }),
    });

    await httpHandler(request, response);
  };
}

const defaultHandler = createAdminSessionRuntimeHandler();

export default defaultHandler;

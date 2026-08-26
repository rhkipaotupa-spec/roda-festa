import { createAdminRuntime } from "./_lib/admin-runtime.js";

const JSON_CONTENT_TYPE = "application/json; charset=utf-8";

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

function publicAuthenticatedSession(session) {
  return Object.freeze({
    authenticated: true,
    role: String(session?.principal?.role || ""),
    expiresAt: session?.expiresAt ?? null,
  });
}

export function createAdminSessionHttpHandler({
  authenticationComposition,
} = {}) {
  if (!authenticationComposition
      || typeof authenticationComposition.authenticate !== "function") {
    throw new Error("admin_session_endpoint_composition_required");
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

      sendJson(response, 200, {
        ok: true,
        ...publicAuthenticatedSession(session),
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
    });

    await httpHandler(request, response);
  };
}

const defaultHandler = createAdminSessionRuntimeHandler();

export default defaultHandler;

import { createAdminRuntime } from "./_lib/admin-runtime.js";
import { createPlanningAdminReadStore } from "./_lib/planning-admin-read-store.js";

const JSON_CONTENT_TYPE = "application/json; charset=utf-8";
const ADMIN_STATES = new Set(["ACTIVE", "ARCHIVED", "TRASHED"]);

function sendJson(response, status, body, headers = {}) {
  response.statusCode = status;
  response.setHeader("Content-Type", JSON_CONTENT_TYPE);

  for (const [name, value] of Object.entries(headers)) {
    if (value != null) response.setHeader(name, value);
  }

  response.end(JSON.stringify(body));
}

function cookieHeader(request) {
  const value = request?.headers?.cookie ?? request?.headers?.Cookie ?? "";
  return Array.isArray(value) ? value.join("; ") : String(value || "");
}

function requestedId(request) {
  const raw = request?.query?.id;
  if (Array.isArray(raw)) return String(raw[0] || "").trim();
  return String(raw || "").trim();
}

function requestedLimit(request) {
  const raw = request?.query?.limit;
  if (Array.isArray(raw)) return raw[0];
  return raw;
}

function requestedState(request) {
  const raw = request?.query?.state;
  const value = Array.isArray(raw) ? raw[0] : raw;
  return String(value || "ACTIVE").trim().toUpperCase();
}

export function createAdminQuotesHttpHandler({
  authenticationComposition,
  authorizationBoundary,
  planningReadStore,
} = {}) {
  if (!authenticationComposition
      || typeof authenticationComposition.authenticate !== "function") {
    throw new Error("admin_quotes_authentication_required");
  }
  if (!authorizationBoundary
      || typeof authorizationBoundary.assert !== "function") {
    throw new Error("admin_quotes_authorization_required");
  }
  if (!planningReadStore
      || typeof planningReadStore.listRecent !== "function"
      || typeof planningReadStore.getById !== "function") {
    throw new Error("admin_quotes_store_required");
  }

  return async function adminQuotesHttpHandler(request, response) {
    if (String(request?.method || "").toUpperCase() !== "GET") {
      sendJson(
        response,
        405,
        { ok: false, error: "method_not_allowed" },
        { Allow: "GET" },
      );
      return;
    }

    let session;
    try {
      session = await authenticationComposition.authenticate({
        cookieHeader: cookieHeader(request),
      });

      authorizationBoundary.assert(session?.principal);
    } catch {
      sendJson(response, 401, {
        ok: false,
        error: "admin_authentication_required",
      });
      return;
    }

    try {
      const id = requestedId(request);

      if (id) {
        const quote = await planningReadStore.getById(id);

        if (!quote) {
          sendJson(response, 404, {
            ok: false,
            error: "quote_not_found",
          });
          return;
        }

        sendJson(response, 200, {
          ok: true,
          quote,
        });
        return;
      }

      const state = requestedState(request);
      if (!ADMIN_STATES.has(state)) {
        sendJson(response, 400, { ok: false, error: "invalid_admin_state" });
        return;
      }

      const quotes = await planningReadStore.listRecent({
        limit: requestedLimit(request),
        state,
      });

      sendJson(response, 200, {
        ok: true,
        quotes,
      });
    } catch {
      sendJson(response, 503, {
        ok: false,
        error: "admin_quotes_unavailable",
      });
    }
  };
}

export function createAdminQuotesRuntimeHandler({
  createRuntime = createAdminRuntime,
  createReadStore = createPlanningAdminReadStore,
  env = process.env,
  fetchImpl = globalThis.fetch,
} = {}) {
  return async function adminQuotesRuntimeHandler(request, response) {
    let runtime;
    let planningReadStore;

    try {
      runtime = createRuntime({
        env,
        fetchImpl,
      });

      planningReadStore = createReadStore({
        env,
        fetchImpl,
      });
    } catch {
      sendJson(response, 503, {
        ok: false,
        error: "admin_quotes_runtime_unavailable",
      });
      return;
    }

    const handler = createAdminQuotesHttpHandler({
      authenticationComposition: runtime.authenticationComposition,
      authorizationBoundary: runtime.authorizationBoundary,
      planningReadStore,
    });

    await handler(request, response);
  };
}

export default createAdminQuotesRuntimeHandler();

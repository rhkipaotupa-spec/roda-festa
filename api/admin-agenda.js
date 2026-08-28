import { createAdminRuntime } from "./_lib/admin-runtime.js";
import { createPlanningAdminReadStore } from "./_lib/planning-admin-read-store.js";

const JSON_CONTENT_TYPE = "application/json; charset=utf-8";

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

function requestedRangeValue(request, name) {
  const raw = request?.query?.[name];
  if (Array.isArray(raw)) return String(raw[0] || "").trim();
  return String(raw || "").trim();
}

function isRangeValidationError(error) {
  const message = String(error?.message || "");
  return message === "planning_admin_read_event_date_from_invalid"
    || message === "planning_admin_read_event_date_to_invalid"
    || message === "planning_admin_read_event_date_range_invalid";
}

export function createAdminAgendaHttpHandler({
  authenticationComposition,
  authorizationBoundary,
  planningReadStore,
} = {}) {
  if (!authenticationComposition
      || typeof authenticationComposition.authenticate !== "function") {
    throw new Error("admin_agenda_authentication_required");
  }
  if (!authorizationBoundary
      || typeof authorizationBoundary.assert !== "function") {
    throw new Error("admin_agenda_authorization_required");
  }
  if (!planningReadStore
      || typeof planningReadStore.listByEventDateRange !== "function") {
    throw new Error("admin_agenda_store_required");
  }

  return async function adminAgendaHttpHandler(request, response) {
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
      const events = await planningReadStore.listByEventDateRange({
        from: requestedRangeValue(request, "from"),
        to: requestedRangeValue(request, "to"),
      });

      sendJson(response, 200, {
        ok: true,
        events,
      });
    } catch (error) {
      if (isRangeValidationError(error)) {
        sendJson(response, 400, {
          ok: false,
          error: "invalid_agenda_range",
        });
        return;
      }

      sendJson(response, 503, {
        ok: false,
        error: "admin_agenda_unavailable",
      });
    }
  };
}

export function createAdminAgendaRuntimeHandler({
  createRuntime = createAdminRuntime,
  createReadStore = createPlanningAdminReadStore,
  env = process.env,
  fetchImpl = globalThis.fetch,
} = {}) {
  return async function adminAgendaRuntimeHandler(request, response) {
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
        error: "admin_agenda_runtime_unavailable",
      });
      return;
    }

    const handler = createAdminAgendaHttpHandler({
      authenticationComposition: runtime.authenticationComposition,
      authorizationBoundary: runtime.authorizationBoundary,
      planningReadStore,
    });

    await handler(request, response);
  };
}

export default createAdminAgendaRuntimeHandler();

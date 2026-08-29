import { createAdminRuntime } from "./_lib/admin-runtime.js";
import { createPlanningAdminLifecycleStore } from "./_lib/planning-admin-lifecycle-store.js";
import { isTrustedMutationRequest } from "./_lib/planning-session-security.js";

const JSON_CONTENT_TYPE = "application/json; charset=utf-8";
const ALLOWED_ACTIONS = new Set(["ARCHIVE", "TRASH", "RESTORE"]);

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

function normalizedBody(request) {
  return request?.body && typeof request.body === "object" && !Array.isArray(request.body)
    ? request.body
    : {};
}

export function createAdminQuoteLifecycleHttpHandler({
  authenticationComposition,
  authorizationBoundary,
  lifecycleStore,
  trustedMutationRequest = isTrustedMutationRequest,
  env = process.env,
} = {}) {
  if (!authenticationComposition
      || typeof authenticationComposition.authenticate !== "function") {
    throw new Error("admin_quote_lifecycle_authentication_required");
  }
  if (!authorizationBoundary
      || typeof authorizationBoundary.assert !== "function") {
    throw new Error("admin_quote_lifecycle_authorization_required");
  }
  if (!lifecycleStore || typeof lifecycleStore.changeState !== "function") {
    throw new Error("admin_quote_lifecycle_store_required");
  }
  if (typeof trustedMutationRequest !== "function") {
    throw new Error("admin_quote_lifecycle_origin_guard_required");
  }

  return async function adminQuoteLifecycleHttpHandler(request, response) {
    if (String(request?.method || "").toUpperCase() !== "POST") {
      sendJson(response, 405, { ok: false, error: "method_not_allowed" }, { Allow: "POST" });
      return;
    }

    if (!trustedMutationRequest(request, env)) {
      sendJson(response, 403, { ok: false, error: "request_not_allowed" });
      return;
    }

    let session;
    try {
      session = await authenticationComposition.authenticate({
        cookieHeader: cookieHeader(request),
      });
      authorizationBoundary.assert(session?.principal);
    } catch {
      sendJson(response, 401, { ok: false, error: "admin_authentication_required" });
      return;
    }

    const body = normalizedBody(request);
    const id = String(body.id || "").trim();
    const action = String(body.action || "").trim().toUpperCase();
    if (!id || !ALLOWED_ACTIONS.has(action)) {
      sendJson(response, 400, { ok: false, error: "invalid_lifecycle_request" });
      return;
    }

    try {
      const lifecycle = await lifecycleStore.changeState({
        sessionId: id,
        action,
        actorUserId: session?.principal?.userId,
      });

      if (!lifecycle) {
        sendJson(response, 404, { ok: false, error: "quote_not_found" });
        return;
      }

      sendJson(response, 200, { ok: true, lifecycle });
    } catch (error) {
      if (String(error?.message || "") === "admin_quote_lifecycle_transition_invalid") {
        sendJson(response, 409, { ok: false, error: "lifecycle_transition_not_allowed" });
        return;
      }
      sendJson(response, 503, { ok: false, error: "admin_quote_lifecycle_unavailable" });
    }
  };
}

export function createAdminQuoteLifecycleRuntimeHandler({
  createRuntime = createAdminRuntime,
  createLifecycleStore = createPlanningAdminLifecycleStore,
  env = process.env,
  fetchImpl = globalThis.fetch,
} = {}) {
  return async function adminQuoteLifecycleRuntimeHandler(request, response) {
    let runtime;
    let lifecycleStore;
    try {
      runtime = createRuntime({ env, fetchImpl });
      lifecycleStore = createLifecycleStore({ env, fetchImpl });
    } catch {
      sendJson(response, 503, { ok: false, error: "admin_quote_lifecycle_runtime_unavailable" });
      return;
    }

    const handler = createAdminQuoteLifecycleHttpHandler({
      authenticationComposition: runtime.authenticationComposition,
      authorizationBoundary: runtime.authorizationBoundary,
      lifecycleStore,
      env,
    });
    await handler(request, response);
  };
}

export default createAdminQuoteLifecycleRuntimeHandler();

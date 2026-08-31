import { createAdminRuntime } from "./_lib/admin-runtime.js";
import { createAdminQuoteRevisionStore } from "./_lib/admin-quote-revision-store.js";
import { isTrustedMutationRequest } from "./_lib/planning-session-security.js";

const JSON_CONTENT_TYPE = "application/json; charset=utf-8";
const MAX_BODY_BYTES = 100_000;

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

export function createAdminQuoteRevisionHttpHandler({
  authenticationComposition,
  authorizationBoundary,
  revisionStore,
  trustedMutationRequest = isTrustedMutationRequest,
  env = process.env,
} = {}) {
  if (!authenticationComposition || typeof authenticationComposition.authenticate !== "function") {
    throw new Error("admin_quote_revision_authentication_required");
  }
  if (!authorizationBoundary || typeof authorizationBoundary.assert !== "function") {
    throw new Error("admin_quote_revision_authorization_required");
  }
  if (!revisionStore || typeof revisionStore.revise !== "function") {
    throw new Error("admin_quote_revision_store_required");
  }

  return async function adminQuoteRevisionHttpHandler(request, response) {
    if (String(request?.method || "").toUpperCase() !== "POST") {
      sendJson(response, 405, { ok: false, error: "method_not_allowed" }, { Allow: "POST" });
      return;
    }
    if (!trustedMutationRequest(request, env)) {
      sendJson(response, 403, { ok: false, error: "request_not_allowed" });
      return;
    }

    const raw = JSON.stringify(request?.body || {});
    if (Buffer.byteLength(raw, "utf8") > MAX_BODY_BYTES) {
      sendJson(response, 413, { ok: false, error: "payload_too_large" });
      return;
    }

    let session;
    try {
      session = await authenticationComposition.authenticate({ cookieHeader: cookieHeader(request) });
      authorizationBoundary.assert(session?.principal);
    } catch {
      sendJson(response, 401, { ok: false, error: "admin_authentication_required" });
      return;
    }

    const body = normalizedBody(request);
    const sessionId = String(body.sessionId || "").trim();
    const items = Array.isArray(body.items) ? body.items : [];
    if (!sessionId || items.length === 0 || items.length > 120) {
      sendJson(response, 400, { ok: false, error: "invalid_revision_request" });
      return;
    }

    try {
      const result = await revisionStore.revise({
        sessionId,
        requestedItems: items,
        includeWaiters: Boolean(body.includeWaiters),
        includeDisposables: Boolean(body.includeDisposables),
        actorUserId: session?.principal?.userId,
      });
      if (!result) {
        sendJson(response, 404, { ok: false, error: "quote_not_found" });
        return;
      }
      sendJson(response, 200, { ok: true, ...result });
    } catch (error) {
      const message = String(error?.message || "");
      if (message === "admin_quote_revision_requires_final_proposal") {
        sendJson(response, 409, { ok: false, error: "quote_requires_final_proposal" });
        return;
      }
      if (message === "admin_quote_revision_concurrent_change") {
        sendJson(response, 409, { ok: false, error: "quote_changed_concurrently" });
        return;
      }
      if (message.startsWith("admin_quote_revision_invalid_")
          || message.includes("tacho_")
          || message.endsWith("_required")) {
        sendJson(response, 400, { ok: false, error: "invalid_revision" });
        return;
      }
      sendJson(response, 503, { ok: false, error: "quote_revision_unavailable" });
    }
  };
}

export function createAdminQuoteRevisionRuntimeHandler({
  createRuntime = createAdminRuntime,
  createRevisionStore = createAdminQuoteRevisionStore,
  env = process.env,
  fetchImpl = globalThis.fetch,
} = {}) {
  return async function adminQuoteRevisionRuntimeHandler(request, response) {
    let runtime;
    let revisionStore;
    try {
      runtime = createRuntime({ env, fetchImpl });
      revisionStore = createRevisionStore({ env, fetchImpl });
    } catch {
      sendJson(response, 503, { ok: false, error: "admin_quote_revision_runtime_unavailable" });
      return;
    }

    const handler = createAdminQuoteRevisionHttpHandler({
      authenticationComposition: runtime.authenticationComposition,
      authorizationBoundary: runtime.authorizationBoundary,
      revisionStore,
      env,
    });
    await handler(request, response);
  };
}

export default createAdminQuoteRevisionRuntimeHandler();

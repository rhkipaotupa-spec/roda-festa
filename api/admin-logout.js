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

function normalizeHeaders(headers = {}) {
  return Object.fromEntries(
    Object.entries(headers).map(([name, value]) => [
      String(name).toLowerCase(),
      Array.isArray(value) ? value.join(",") : String(value ?? ""),
    ]),
  );
}

export function toAdminLogoutBoundaryRequest(request) {
  return Object.freeze({
    method: String(request?.method || "").toUpperCase(),
    headers: Object.freeze(normalizeHeaders(request?.headers || {})),
    body: Object.freeze({}),
  });
}

function mapAdminLogoutError(error) {
  const code = String(error?.message || "");
  if (code === "admin_auth_http_method_not_allowed") {
    return { status: 405, error: "method_not_allowed", allow: "POST" };
  }
  if (code === "admin_auth_http_untrusted_origin") {
    return { status: 403, error: "request_not_allowed" };
  }
  return { status: 500, error: "admin_logout_failed" };
}

export function createAdminLogoutHttpHandler({ authComposition } = {}) {
  if (!authComposition || typeof authComposition.logout !== "function") {
    throw new Error("admin_logout_endpoint_composition_required");
  }

  return async function adminLogoutHttpHandler(request, response) {
    try {
      const result = await authComposition.logout(toAdminLogoutBoundaryRequest(request));
      const headers = {};
      if (result?.setCookie) headers["Set-Cookie"] = result.setCookie;
      sendJson(
        response,
        Number(result?.status) || 200,
        result?.body && typeof result.body === "object" ? result.body : { ok: true },
        headers,
      );
    } catch (error) {
      const mapped = mapAdminLogoutError(error);
      const headers = mapped.allow ? { Allow: mapped.allow } : {};
      sendJson(response, mapped.status, { ok: false, error: mapped.error }, headers);
    }
  };
}

export function createAdminLogoutRuntimeHandler({
  createRuntime = createAdminRuntime,
  env = process.env,
  fetchImpl = globalThis.fetch,
} = {}) {
  if (typeof createRuntime !== "function") {
    throw new Error("admin_logout_runtime_factory_required");
  }

  return async function adminLogoutRuntimeHandler(request, response) {
    let runtime;
    try {
      runtime = createRuntime({ env, fetchImpl });
    } catch {
      sendJson(response, 503, { ok: false, error: "admin_logout_runtime_unavailable" });
      return;
    }

    if (!runtime?.loginComposition || typeof runtime.loginComposition.logout !== "function") {
      sendJson(response, 503, { ok: false, error: "admin_logout_runtime_unavailable" });
      return;
    }

    const httpHandler = createAdminLogoutHttpHandler({
      authComposition: runtime.loginComposition,
    });
    await httpHandler(request, response);
  };
}

const defaultHandler = createAdminLogoutRuntimeHandler();
export default defaultHandler;

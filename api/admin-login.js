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

export function toAdminLoginBoundaryRequest(request) {
  return Object.freeze({
    method: String(request?.method || "").toUpperCase(),
    headers: Object.freeze(normalizeHeaders(request?.headers || {})),
    body: request?.body && typeof request.body === "object"
      ? request.body
      : Object.freeze({}),
  });
}

function mapAdminLoginError(error) {
  const code = String(error?.message || "");

  if (code === "admin_auth_http_method_not_allowed") {
    return { status: 405, error: "method_not_allowed", allow: "POST" };
  }

  if (code === "admin_auth_http_untrusted_origin") {
    return { status: 403, error: "request_not_allowed" };
  }

  if (code === "admin_auth_http_credentials_required") {
    return { status: 400, error: "credentials_required" };
  }

  if (code === "admin_auth_http_invalid_credentials") {
    return { status: 401, error: "invalid_credentials" };
  }

  return { status: 500, error: "admin_login_failed" };
}

export function createAdminLoginHttpHandler({
  loginComposition,
} = {}) {
  if (!loginComposition || typeof loginComposition.login !== "function") {
    throw new Error("admin_login_endpoint_composition_required");
  }

  return async function adminLoginHttpHandler(request, response) {
    try {
      const boundaryRequest = toAdminLoginBoundaryRequest(request);
      const result = await loginComposition.login(boundaryRequest);

      const headers = {};
      if (result?.setCookie) headers["Set-Cookie"] = result.setCookie;

      sendJson(
        response,
        Number(result?.status) || 200,
        result?.body && typeof result.body === "object"
          ? result.body
          : { ok: true },
        headers,
      );
    } catch (error) {
      const mapped = mapAdminLoginError(error);
      const headers = mapped.allow ? { Allow: mapped.allow } : {};

      sendJson(response, mapped.status, {
        ok: false,
        error: mapped.error,
      }, headers);
    }
  };
}

export default async function handler(_request, response) {
  sendJson(response, 503, {
    ok: false,
    error: "admin_login_runtime_unavailable",
  });
}

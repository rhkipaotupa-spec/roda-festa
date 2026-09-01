import { createAdminRuntime } from "./_lib/admin-runtime.js";
import { createProductCatalogStore } from "./_lib/product-catalog-store.js";
import { isTrustedMutationRequest } from "./_lib/planning-session-security.js";

const JSON_CONTENT_TYPE = "application/json; charset=utf-8";
const MAX_BODY_BYTES = 40_000;
const ACTIONS = new Set(["UPSERT", "SET_ACTIVE", "BULK_UPDATE"]);

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

export function createAdminProductsHttpHandler({
  authenticationComposition,
  authorizationBoundary,
  catalogStore,
  trustedMutationRequest = isTrustedMutationRequest,
  env = process.env,
} = {}) {
  if (!authenticationComposition || typeof authenticationComposition.authenticate !== "function") {
    throw new Error("admin_products_authentication_required");
  }
  if (!authorizationBoundary || typeof authorizationBoundary.assert !== "function") {
    throw new Error("admin_products_authorization_required");
  }
  if (!catalogStore
      || typeof catalogStore.listCatalog !== "function"
      || typeof catalogStore.upsert !== "function"
      || typeof catalogStore.setActive !== "function"
      || typeof catalogStore.bulkUpdateByCategory !== "function") {
    throw new Error("admin_products_store_required");
  }

  return async function adminProductsHttpHandler(request, response) {
    const method = String(request?.method || "").toUpperCase();
    if (!new Set(["GET", "POST"]).has(method)) {
      sendJson(response, 405, { ok: false, error: "method_not_allowed" }, { Allow: "GET, POST" });
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

    if (method === "GET") {
      try {
        const products = await catalogStore.listCatalog({ includeInactive: true });
        sendJson(response, 200, { ok: true, products });
      } catch {
        sendJson(response, 503, { ok: false, error: "product_catalog_unavailable" });
      }
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

    const body = normalizedBody(request);
    const action = String(body.action || "").trim().toUpperCase();
    if (!ACTIONS.has(action)) {
      sendJson(response, 400, { ok: false, error: "invalid_product_action" });
      return;
    }

    try {
      const actorUserId = session?.principal?.userId;
      let result;

      if (action === "UPSERT") {
        result = await catalogStore.upsert({ product: body.product, actorUserId });
      } else if (action === "SET_ACTIVE") {
        result = await catalogStore.setActive({
          productId: body.productId,
          active: Boolean(body.active),
          actorUserId,
        });
      } else {
        result = await catalogStore.bulkUpdateByCategory({
          commercialCategory: body.commercialCategory,
          updates: body.updates,
          actorUserId,
        });
      }

      if (!result) {
        sendJson(response, 404, { ok: false, error: "product_not_found" });
        return;
      }
      sendJson(response, 200, { ok: true, ...result });
    } catch (error) {
      const message = String(error?.message || "");
      if (message.startsWith("product_catalog_invalid_")
          || message.endsWith("_required")) {
        sendJson(response, 400, { ok: false, error: "invalid_product" });
        return;
      }
      sendJson(response, 503, { ok: false, error: "product_catalog_write_unavailable" });
    }
  };
}

export function createAdminProductsRuntimeHandler({
  createRuntime = createAdminRuntime,
  createCatalogStore = createProductCatalogStore,
  env = process.env,
  fetchImpl = globalThis.fetch,
} = {}) {
  return async function adminProductsRuntimeHandler(request, response) {
    let runtime;
    let catalogStore;
    try {
      runtime = createRuntime({ env, fetchImpl });
      catalogStore = createCatalogStore({ env, fetchImpl });
    } catch {
      sendJson(response, 503, { ok: false, error: "admin_products_runtime_unavailable" });
      return;
    }

    const handler = createAdminProductsHttpHandler({
      authenticationComposition: runtime.authenticationComposition,
      authorizationBoundary: runtime.authorizationBoundary,
      catalogStore,
      env,
    });
    await handler(request, response);
  };
}

export default createAdminProductsRuntimeHandler();

import { createProductCatalogStore } from "./_lib/product-catalog-store.js";

const JSON_CONTENT_TYPE = "application/json; charset=utf-8";

function sendJson(response, status, body, headers = {}) {
  response.statusCode = status;
  response.setHeader("Content-Type", JSON_CONTENT_TYPE);
  for (const [name, value] of Object.entries(headers)) {
    if (value != null) response.setHeader(name, value);
  }
  response.end(JSON.stringify(body));
}

export function createProductCatalogHttpHandler({ catalogStore } = {}) {
  if (!catalogStore || typeof catalogStore.listCatalog !== "function") {
    throw new Error("product_catalog_http_store_required");
  }

  return async function productCatalogHttpHandler(request, response) {
    if (String(request?.method || "").toUpperCase() !== "GET") {
      sendJson(response, 405, { ok: false, error: "method_not_allowed" }, { Allow: "GET" });
      return;
    }

    try {
      const products = await catalogStore.listCatalog({ includeInactive: false });
      sendJson(
        response,
        200,
        { ok: true, products },
        { "Cache-Control": "no-store" },
      );
    } catch {
      sendJson(response, 503, { ok: false, error: "product_catalog_unavailable" });
    }
  };
}

export function createProductCatalogRuntimeHandler({
  createCatalogStore = createProductCatalogStore,
  env = process.env,
  fetchImpl = globalThis.fetch,
} = {}) {
  return async function productCatalogRuntimeHandler(request, response) {
    let catalogStore;
    try {
      catalogStore = createCatalogStore({ env, fetchImpl });
    } catch {
      sendJson(response, 503, { ok: false, error: "product_catalog_runtime_unavailable" });
      return;
    }
    const handler = createProductCatalogHttpHandler({ catalogStore });
    await handler(request, response);
  };
}

export default createProductCatalogRuntimeHandler();

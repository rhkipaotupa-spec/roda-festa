import { buildSupabaseRestHeaders } from "./supabase-rest-auth.js";
import {
  baseProductCatalog,
  mergeProductCatalogOverrides,
  normalizeProductCatalogRecord,
  productCatalogById,
} from "../../src/planner/planning-book/engine/productCatalog.js";

const BULK_ALLOWED_FIELDS = new Set([
  "unitPrice",
  "lotSize",
  "productionPerHour",
]);

function getConfig(env = process.env) {
  const url = String(env.SUPABASE_URL || "").replace(/\/$/, "");
  const serviceRoleKey = String(env.SUPABASE_SERVICE_ROLE_KEY || "");
  if (!url || !serviceRoleKey) throw new Error("product_catalog_not_configured");
  return { url, serviceRoleKey };
}

function normalizeBulkUpdates(updates = {}) {
  if (!updates || typeof updates !== "object" || Array.isArray(updates)) {
    throw new Error("product_catalog_invalid_bulk_updates");
  }

  const entries = Object.entries(updates);
  if (entries.length === 0) throw new Error("product_catalog_invalid_bulk_updates");
  if (entries.some(([field]) => !BULK_ALLOWED_FIELDS.has(field))) {
    throw new Error("product_catalog_invalid_bulk_field");
  }

  return Object.fromEntries(entries);
}

export function createProductCatalogStore({
  env = process.env,
  fetchImpl = globalThis.fetch,
} = {}) {
  if (typeof fetchImpl !== "function") throw new Error("product_catalog_fetch_required");

  async function request(path, { method = "GET", body, prefer } = {}) {
    const { url, serviceRoleKey } = getConfig(env);
    const response = await fetchImpl(`${url}/rest/v1/${path}`, {
      method,
      headers: buildSupabaseRestHeaders(serviceRoleKey, { prefer }),
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    if (!response.ok) {
      const error = new Error(`product_catalog_store_error:${response.status}`);
      error.status = response.status;
      throw error;
    }
    if (response.status === 204) return null;
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  }

  async function listOverrides() {
    const rows = await request(
      "product_catalog_overrides?select=product_id,product_data,active,revision,updated_at,updated_by&order=product_id.asc",
    );
    return Array.isArray(rows) ? rows : [];
  }

  async function listCatalog({ includeInactive = true } = {}) {
    const overrides = await listOverrides();
    const merged = mergeProductCatalogOverrides(overrides.map((row) => ({
      productData: row.product_data,
      active: row.active,
      revision: row.revision,
      updatedAt: row.updated_at,
      updatedBy: row.updated_by,
    })));
    return includeInactive ? merged : Object.freeze(merged.filter((product) => product.active));
  }

  async function writeAtomically({ normalized, actor, initialAction }) {
    const rows = await request("rpc/rf_admin_write_product_catalog", {
      method: "POST",
      body: {
        p_product_id: normalized.id,
        p_product_data: normalized,
        p_active: normalized.active,
        p_actor: actor,
        p_initial_action: initialAction,
      },
    });
    const result = Array.isArray(rows) ? rows[0] : rows;
    if (!result || !Number.isInteger(Number(result.revision))) {
      throw new Error("product_catalog_atomic_write_invalid_response");
    }
    return {
      product: normalized,
      revision: Number(result.revision),
      action: String(result.action || initialAction),
      persisted: result,
    };
  }

  async function upsert({ product, actorUserId } = {}) {
    const actor = String(actorUserId || "").trim();
    if (!actor) throw new Error("product_catalog_actor_required");

    const currentCatalog = await listCatalog({ includeInactive: true });
    const currentById = productCatalogById(currentCatalog);
    const requestedId = String(product?.id || "").trim();
    const existing = currentById.get(requestedId) || null;
    const normalized = normalizeProductCatalogRecord(product, { existing });

    return writeAtomically({
      normalized,
      actor,
      initialAction: existing ? "UPDATE" : "CREATE",
    });
  }

  async function setActive({ productId, active, actorUserId } = {}) {
    const actor = String(actorUserId || "").trim();
    const id = String(productId || "").trim();
    if (!actor) throw new Error("product_catalog_actor_required");
    if (!id) throw new Error("product_catalog_product_id_required");

    const catalog = await listCatalog({ includeInactive: true });
    const existing = productCatalogById(catalog).get(id);
    if (!existing) return null;

    const normalized = normalizeProductCatalogRecord(
      { ...existing, active: Boolean(active) },
      { existing },
    );

    return writeAtomically({
      normalized,
      actor,
      initialAction: normalized.active ? "REACTIVATE" : "DEACTIVATE",
    });
  }

  async function bulkUpdateByCategory({
    commercialCategory,
    updates,
    actorUserId,
  } = {}) {
    const actor = String(actorUserId || "").trim();
    const category = String(commercialCategory || "").trim();
    if (!actor) throw new Error("product_catalog_actor_required");
    if (!category) throw new Error("product_catalog_commercial_category_required");

    const safeUpdates = normalizeBulkUpdates(updates);
    const catalog = await listCatalog({ includeInactive: true });
    const targets = catalog.filter((product) => product.commercialCategory === category);
    if (targets.length === 0) return null;

    // Valida o lote inteiro antes da primeira escrita para evitar erro de domínio no meio da operação.
    const normalizedTargets = targets.map((existing) => normalizeProductCatalogRecord(
      { ...existing, ...safeUpdates },
      { existing },
    ));

    const results = [];
    for (const normalized of normalizedTargets) {
      results.push(await writeAtomically({
        normalized,
        actor,
        initialAction: "UPDATE",
      }));
    }

    return {
      commercialCategory: category,
      updatedCount: results.length,
      productIds: results.map((result) => result.product.id),
      revisions: results.map((result) => ({
        productId: result.product.id,
        revision: result.revision,
      })),
    };
  }

  return Object.freeze({
    baseCatalog: baseProductCatalog,
    listOverrides,
    listCatalog,
    upsert,
    setActive,
    bulkUpdateByCategory,
  });
}

import { buildSupabaseRestHeaders } from "./supabase-rest-auth.js";
import {
  baseProductCatalog,
  mergeProductCatalogOverrides,
  normalizeProductCatalogRecord,
  productCatalogById,
} from "../../src/planner/planning-book/engine/productCatalog.js";

function getConfig(env = process.env) {
  const url = String(env.SUPABASE_URL || "").replace(/\/$/, "");
  const serviceRoleKey = String(env.SUPABASE_SERVICE_ROLE_KEY || "");
  if (!url || !serviceRoleKey) throw new Error("product_catalog_not_configured");
  return { url, serviceRoleKey };
}

function eq(value) {
  return `eq.${encodeURIComponent(String(value))}`;
}

function nowIso(now) {
  const value = typeof now === "function" ? now() : new Date().toISOString();
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error("product_catalog_clock_invalid");
  return date.toISOString();
}

export function createProductCatalogStore({
  env = process.env,
  fetchImpl = globalThis.fetch,
  now = () => new Date().toISOString(),
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

  async function getOverride(productId) {
    const id = String(productId || "").trim();
    if (!id) throw new Error("product_catalog_product_id_required");
    const rows = await request(
      `product_catalog_overrides?product_id=${eq(id)}&select=product_id,product_data,active,revision,updated_at,updated_by&limit=1`,
    );
    return rows?.[0] || null;
  }

  async function upsert({ product, actorUserId } = {}) {
    const actor = String(actorUserId || "").trim();
    if (!actor) throw new Error("product_catalog_actor_required");

    const currentCatalog = await listCatalog({ includeInactive: true });
    const currentById = productCatalogById(currentCatalog);
    const requestedId = String(product?.id || "").trim();
    const existing = currentById.get(requestedId) || null;
    const normalized = normalizeProductCatalogRecord(product, { existing });
    const currentOverride = await getOverride(normalized.id);
    const revision = Number(currentOverride?.revision || 0) + 1;
    const timestamp = nowIso(now);
    const action = currentOverride
      ? (!currentOverride.active && normalized.active ? "REACTIVATE" : "UPDATE")
      : (existing ? "UPDATE" : "CREATE");

    const rows = await request(
      "product_catalog_overrides?on_conflict=product_id",
      {
        method: "POST",
        prefer: "resolution=merge-duplicates,return=representation",
        body: {
          product_id: normalized.id,
          product_data: normalized,
          active: normalized.active,
          revision,
          updated_at: timestamp,
          updated_by: actor,
        },
      },
    );

    await request("product_catalog_history", {
      method: "POST",
      prefer: "return=minimal",
      body: {
        product_id: normalized.id,
        revision,
        product_data: normalized,
        active: normalized.active,
        changed_at: timestamp,
        changed_by: actor,
        action,
      },
    });

    return {
      product: normalized,
      revision,
      action,
      persisted: rows?.[0] || null,
    };
  }

  async function setActive({ productId, active, actorUserId } = {}) {
    const actor = String(actorUserId || "").trim();
    const id = String(productId || "").trim();
    if (!actor) throw new Error("product_catalog_actor_required");
    if (!id) throw new Error("product_catalog_product_id_required");

    const catalog = await listCatalog({ includeInactive: true });
    const existing = productCatalogById(catalog).get(id);
    if (!existing) return null;

    const currentOverride = await getOverride(id);
    const revision = Number(currentOverride?.revision || 0) + 1;
    const timestamp = nowIso(now);
    const normalized = normalizeProductCatalogRecord({ ...existing, active: Boolean(active) }, { existing });
    const action = normalized.active ? "REACTIVATE" : "DEACTIVATE";

    const rows = await request("product_catalog_overrides?on_conflict=product_id", {
      method: "POST",
      prefer: "resolution=merge-duplicates,return=representation",
      body: {
        product_id: id,
        product_data: normalized,
        active: normalized.active,
        revision,
        updated_at: timestamp,
        updated_by: actor,
      },
    });

    await request("product_catalog_history", {
      method: "POST",
      prefer: "return=minimal",
      body: {
        product_id: id,
        revision,
        product_data: normalized,
        active: normalized.active,
        changed_at: timestamp,
        changed_by: actor,
        action,
      },
    });

    return { product: normalized, revision, action, persisted: rows?.[0] || null };
  }

  return Object.freeze({
    baseCatalog: baseProductCatalog,
    listOverrides,
    listCatalog,
    upsert,
    setActive,
  });
}

import { buildSupabaseRestHeaders } from "./supabase-rest-auth.js";
import { createProductCatalogStore } from "./product-catalog-store.js";
import { rebuildAdminEffectiveSnapshot } from "./admin-quote-revision-domain.js";

function getConfig(env = process.env) {
  const url = String(env.SUPABASE_URL || "").replace(/\/$/, "");
  const serviceRoleKey = String(env.SUPABASE_SERVICE_ROLE_KEY || "");
  if (!url || !serviceRoleKey) throw new Error("admin_quote_revision_not_configured");
  return { url, serviceRoleKey };
}

function eq(value) {
  return `eq.${encodeURIComponent(String(value))}`;
}

export function createAdminQuoteRevisionStore({
  env = process.env,
  fetchImpl = globalThis.fetch,
  now = () => new Date().toISOString(),
  createCatalogStore = createProductCatalogStore,
} = {}) {
  if (typeof fetchImpl !== "function") throw new Error("admin_quote_revision_fetch_required");
  if (typeof now !== "function") throw new Error("admin_quote_revision_clock_required");

  async function request(path, { method = "GET", body, prefer } = {}) {
    const { url, serviceRoleKey } = getConfig(env);
    const response = await fetchImpl(`${url}/rest/v1/${path}`, {
      method,
      headers: buildSupabaseRestHeaders(serviceRoleKey, { prefer }),
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    if (!response.ok) {
      const error = new Error(`admin_quote_revision_store_error:${response.status}`);
      error.status = response.status;
      throw error;
    }
    if (response.status === 204) return null;
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  }

  async function getById(sessionId) {
    const id = String(sessionId || "").trim();
    if (!id) throw new Error("admin_quote_revision_session_id_required");
    const rows = await request(
      `planning_sessions?id=${eq(id)}`
      + "&select=id,status,final_proposal_snapshot,admin_effective_snapshot,admin_revision_history,admin_commercial_revision,client_name,phone,email,last_activity_at&limit=1",
    );
    return rows?.[0] || null;
  }

  async function revise({
    sessionId,
    requestedItems,
    includeWaiters,
    includeDisposables,
    actorUserId,
  } = {}) {
    const actor = String(actorUserId || "").trim();
    if (!actor) throw new Error("admin_quote_revision_actor_required");
    const current = await getById(sessionId);
    if (!current) return null;

    const baseSnapshot = current.admin_effective_snapshot || current.final_proposal_snapshot;
    if (!baseSnapshot) throw new Error("admin_quote_revision_requires_final_proposal");

    const catalogStore = createCatalogStore({ env, fetchImpl, now });
    const productCatalog = await catalogStore.listCatalog({ includeInactive: true });
    const timestamp = new Date(now()).toISOString();
    const nextSnapshot = rebuildAdminEffectiveSnapshot({
      baseSnapshot,
      requestedItems,
      includeWaiters,
      includeDisposables,
      productCatalog,
      now: timestamp,
    });

    const currentRevision = Number(current.admin_commercial_revision || 0);
    const nextRevision = currentRevision + 1;
    const history = Array.isArray(current.admin_revision_history)
      ? [...current.admin_revision_history]
      : [];
    history.push({
      revision: nextRevision,
      recordedAt: timestamp,
      actorUserId: actor,
      beforeSnapshot: baseSnapshot,
      afterSummary: {
        investmentTotal: nextSnapshot.investmentTotal,
        consignmentTotal: nextSnapshot.consignmentTotal,
        totalCarts: nextSnapshot.totalCarts,
        itemCount: nextSnapshot.items.length,
      },
    });

    const rows = await request(
      `planning_sessions?id=${eq(sessionId)}&admin_commercial_revision=${eq(currentRevision)}`
      + "&select=id,admin_effective_snapshot,admin_revision_history,admin_commercial_revision,admin_commercial_updated_at,admin_commercial_updated_by",
      {
        method: "PATCH",
        prefer: "return=representation",
        body: {
          admin_effective_snapshot: nextSnapshot,
          admin_revision_history: history,
          admin_commercial_revision: nextRevision,
          admin_commercial_updated_at: timestamp,
          admin_commercial_updated_by: actor,
          last_activity_at: timestamp,
        },
      },
    );

    if (!rows?.[0]) throw new Error("admin_quote_revision_concurrent_change");
    return {
      sessionId: String(sessionId),
      revision: nextRevision,
      effectiveSnapshot: nextSnapshot,
      historyCount: history.length,
      updatedAt: timestamp,
    };
  }

  return Object.freeze({ getById, revise });
}

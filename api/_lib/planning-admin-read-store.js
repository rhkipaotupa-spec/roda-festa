import {
  buildAdminJourneyDetail,
  buildAdminJourneySummary,
} from "./planning-admin-journey-query.js";

const JSON_HEADERS = { "Content-Type": "application/json" };
const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 200;

function getConfig(env = process.env) {
  const url = String(env.SUPABASE_URL || "").replace(/\/$/, "");
  const serviceRoleKey = String(env.SUPABASE_SERVICE_ROLE_KEY || "");
  if (!url || !serviceRoleKey) {
    throw new Error("planning_admin_read_not_configured");
  }
  return { url, serviceRoleKey };
}

function normalizeLimit(value) {
  const number = Number(value ?? DEFAULT_LIMIT);
  if (!Number.isFinite(number)) return DEFAULT_LIMIT;
  return Math.max(1, Math.min(MAX_LIMIT, Math.trunc(number)));
}

function eq(value) {
  return `eq.${encodeURIComponent(String(value))}`;
}

function normalizeRow(row) {
  if (!row || typeof row !== "object") return null;

  return {
    sessionId: row.id,
    status: row.status,
    version: row.version,
    createdAt: row.created_at ?? null,
    updatedAt: row.last_activity_at ?? row.updated_at ?? null,
    inputSnapshot: row.input_snapshot ?? null,
    recommendationSnapshot: row.recommendation_snapshot ?? null,
    finalProposalSnapshot: row.final_proposal_snapshot ?? null,
    planningChanges: Array.isArray(row.planning_changes)
      ? row.planning_changes
      : [],
    reconciliation: row.reconciliation ?? null,
    versions: row.versions ?? null,
    client: {
      name: row.client_name ?? null,
      phone: row.phone ?? null,
      email: row.email ?? null,
    },
    finalizedAt: row.finalized_at ?? null,
  };
}

function enrichSummary(model, row) {
  return Object.freeze({
    ...model,
    client: Object.freeze({
      name: row.client?.name ?? null,
      phone: row.client?.phone ?? null,
      email: row.client?.email ?? null,
    }),
    finalizedAt: row.finalizedAt ?? null,
  });
}

export function createPlanningAdminReadStore({
  env = process.env,
  fetchImpl = globalThis.fetch,
} = {}) {
  if (typeof fetchImpl !== "function") {
    throw new Error("planning_admin_read_fetch_required");
  }

  async function request(path) {
    const { url, serviceRoleKey } = getConfig(env);

    const response = await fetchImpl(`${url}/rest/v1/${path}`, {
      method: "GET",
      headers: {
        ...JSON_HEADERS,
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
    });

    if (!response.ok) {
      const error = new Error(`planning_admin_read_error:${response.status}`);
      error.status = response.status;
      throw error;
    }

    const text = await response.text();
    return text ? JSON.parse(text) : [];
  }

  async function listRecent({ limit = DEFAULT_LIMIT } = {}) {
    const safeLimit = normalizeLimit(limit);
    const rows = await request(
      `planning_sessions?select=*&order=last_activity_at.desc&limit=${safeLimit}`,
    );

    return Object.freeze(
      (Array.isArray(rows) ? rows : [])
        .map(normalizeRow)
        .filter(Boolean)
        .map((row) => enrichSummary(buildAdminJourneySummary(row), row)),
    );
  }

  async function getById(sessionId) {
    const id = String(sessionId || "").trim();
    if (!id) throw new Error("planning_admin_read_session_id_required");

    const rows = await request(
      `planning_sessions?id=${eq(id)}&select=*&limit=1`,
    );
    const row = normalizeRow(rows?.[0]);
    if (!row) return null;

    return enrichSummary(buildAdminJourneyDetail(row), row);
  }

  return Object.freeze({
    listRecent,
    getById,
  });
}

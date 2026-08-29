import {
  buildAdminJourneyDetail,
  buildAdminJourneySummary,
} from "./planning-admin-journey-query.js";
import { buildSupabaseRestHeaders } from "./supabase-rest-auth.js";

const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 200;
const ADMIN_STATES = new Set(["ACTIVE", "ARCHIVED", "TRASHED"]);

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

function normalizeAdminState(value) {
  const state = String(value || "ACTIVE").trim().toUpperCase();
  if (!ADMIN_STATES.has(state)) {
    throw new Error("planning_admin_read_admin_state_invalid");
  }
  return state;
}

function normalizeIsoDate(value, field) {
  const text = String(value ?? "").trim();
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
  if (!match) {
    throw new Error(`planning_admin_read_event_date_${field}_invalid`);
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year
    || date.getUTCMonth() !== month - 1
    || date.getUTCDate() !== day
  ) {
    throw new Error(`planning_admin_read_event_date_${field}_invalid`);
  }

  return text;
}

function normalizeRow(row) {
  if (!row || typeof row !== "object") return null;

  return {
    sessionId: row.id,
    status: row.status,
    adminState: normalizeAdminState(row.admin_state),
    adminStateUpdatedAt: row.admin_state_updated_at ?? null,
    adminStateUpdatedBy: row.admin_state_updated_by ?? null,
    archivedAt: row.archived_at ?? null,
    trashedAt: row.trashed_at ?? null,
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
    adminState: row.adminState,
    adminStateUpdatedAt: row.adminStateUpdatedAt,
    adminStateUpdatedBy: row.adminStateUpdatedBy,
    archivedAt: row.archivedAt,
    trashedAt: row.trashedAt,
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
      headers: buildSupabaseRestHeaders(serviceRoleKey),
    });

    if (!response.ok) {
      const error = new Error(`planning_admin_read_error:${response.status}`);
      error.status = response.status;
      throw error;
    }

    const text = await response.text();
    return text ? JSON.parse(text) : [];
  }

  async function listRecent({ limit = DEFAULT_LIMIT, state = "ACTIVE" } = {}) {
    const safeLimit = normalizeLimit(limit);
    const safeState = normalizeAdminState(state);
    const rows = await request(
      `planning_sessions?select=*&admin_state=${eq(safeState)}`
      + `&order=last_activity_at.desc&limit=${safeLimit}`,
    );

    return Object.freeze(
      (Array.isArray(rows) ? rows : [])
        .map(normalizeRow)
        .filter(Boolean)
        .map((row) => enrichSummary(buildAdminJourneySummary(row), row)),
    );
  }

  async function listByEventDateRange({ from, to } = {}) {
    const safeFrom = normalizeIsoDate(from, "from");
    const safeTo = normalizeIsoDate(to, "to");
    if (safeFrom > safeTo) {
      throw new Error("planning_admin_read_event_date_range_invalid");
    }

    const rows = await request(
      `planning_sessions?select=*&admin_state=${eq("ACTIVE")}`
      + `&input_snapshot->>eventDate=gte.${encodeURIComponent(safeFrom)}`
      + `&input_snapshot->>eventDate=lte.${encodeURIComponent(safeTo)}`
      + "&order=input_snapshot->>eventDate.asc,last_activity_at.desc",
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
    listByEventDateRange,
    getById,
  });
}

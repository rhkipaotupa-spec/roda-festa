import { buildSupabaseRestHeaders } from "./supabase-rest-auth.js";

export const ADMIN_QUOTE_STATES = Object.freeze({
  ACTIVE: "ACTIVE",
  ARCHIVED: "ARCHIVED",
  TRASHED: "TRASHED",
});

export const ADMIN_QUOTE_ACTIONS = Object.freeze({
  ARCHIVE: "ARCHIVE",
  TRASH: "TRASH",
  RESTORE: "RESTORE",
});

function getConfig(env = process.env) {
  const url = String(env.SUPABASE_URL || "").replace(/\/$/, "");
  const serviceRoleKey = String(env.SUPABASE_SERVICE_ROLE_KEY || "");
  if (!url || !serviceRoleKey) {
    throw new Error("admin_quote_lifecycle_not_configured");
  }
  return { url, serviceRoleKey };
}

function eq(value) {
  return `eq.${encodeURIComponent(String(value))}`;
}

function normalizeAction(value) {
  const action = String(value || "").trim().toUpperCase();
  if (!Object.hasOwn(ADMIN_QUOTE_ACTIONS, action)) {
    throw new Error("admin_quote_lifecycle_action_invalid");
  }
  return action;
}

function normalizeState(value) {
  const state = String(value || ADMIN_QUOTE_STATES.ACTIVE).trim().toUpperCase();
  if (!Object.hasOwn(ADMIN_QUOTE_STATES, state)) {
    throw new Error("admin_quote_lifecycle_state_invalid");
  }
  return state;
}

function targetStateFor(action) {
  if (action === ADMIN_QUOTE_ACTIONS.ARCHIVE) return ADMIN_QUOTE_STATES.ARCHIVED;
  if (action === ADMIN_QUOTE_ACTIONS.TRASH) return ADMIN_QUOTE_STATES.TRASHED;
  return ADMIN_QUOTE_STATES.ACTIVE;
}

function transitionAllowed(currentState, action) {
  if (action === ADMIN_QUOTE_ACTIONS.ARCHIVE) {
    return currentState === ADMIN_QUOTE_STATES.ACTIVE
      || currentState === ADMIN_QUOTE_STATES.ARCHIVED;
  }
  if (action === ADMIN_QUOTE_ACTIONS.TRASH) return true;
  return true;
}

function mapLifecycle(row) {
  if (!row) return null;
  return Object.freeze({
    sessionId: row.id,
    adminState: normalizeState(row.admin_state),
    updatedAt: row.admin_state_updated_at ?? null,
    updatedBy: row.admin_state_updated_by ?? null,
    archivedAt: row.archived_at ?? null,
    trashedAt: row.trashed_at ?? null,
  });
}

export function createPlanningAdminLifecycleStore({
  env = process.env,
  fetchImpl = globalThis.fetch,
  now = () => new Date().toISOString(),
} = {}) {
  if (typeof fetchImpl !== "function") {
    throw new Error("admin_quote_lifecycle_fetch_required");
  }
  if (typeof now !== "function") {
    throw new Error("admin_quote_lifecycle_clock_required");
  }

  async function request(path, { method = "GET", body, prefer } = {}) {
    const { url, serviceRoleKey } = getConfig(env);
    const response = await fetchImpl(`${url}/rest/v1/${path}`, {
      method,
      headers: buildSupabaseRestHeaders(serviceRoleKey, { prefer }),
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });

    if (!response.ok) {
      const error = new Error(`admin_quote_lifecycle_store_error:${response.status}`);
      error.status = response.status;
      throw error;
    }

    if (response.status === 204) return null;
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  }

  async function changeState({ sessionId, action, actorUserId } = {}) {
    const id = String(sessionId || "").trim();
    const actor = String(actorUserId || "").trim();
    if (!id) throw new Error("admin_quote_lifecycle_session_id_required");
    if (!actor) throw new Error("admin_quote_lifecycle_actor_required");

    const safeAction = normalizeAction(action);
    const currentRows = await request(
      `planning_sessions?id=${eq(id)}&select=id,admin_state,admin_state_updated_at,admin_state_updated_by,archived_at,trashed_at&limit=1`,
    );
    const current = currentRows?.[0];
    if (!current) return null;

    const currentState = normalizeState(current.admin_state);
    const targetState = targetStateFor(safeAction);

    if (!transitionAllowed(currentState, safeAction)) {
      throw new Error("admin_quote_lifecycle_transition_invalid");
    }

    if (currentState === targetState) return mapLifecycle(current);

    const timestamp = String(now());
    const body = {
      admin_state: targetState,
      admin_state_updated_at: timestamp,
      admin_state_updated_by: actor,
    };

    if (safeAction === ADMIN_QUOTE_ACTIONS.ARCHIVE) {
      body.archived_at = timestamp;
      body.trashed_at = null;
    } else if (safeAction === ADMIN_QUOTE_ACTIONS.TRASH) {
      body.trashed_at = timestamp;
    } else {
      body.archived_at = null;
      body.trashed_at = null;
    }

    const rows = await request(
      `planning_sessions?id=${eq(id)}&admin_state=${eq(currentState)}`
      + "&select=id,admin_state,admin_state_updated_at,admin_state_updated_by,archived_at,trashed_at",
      {
        method: "PATCH",
        prefer: "return=representation",
        body,
      },
    );

    if (!rows?.[0]) {
      throw new Error("admin_quote_lifecycle_concurrent_change");
    }

    return mapLifecycle(rows[0]);
  }

  return Object.freeze({ changeState });
}

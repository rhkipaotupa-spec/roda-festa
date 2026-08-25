const JSON_HEADERS = { "Content-Type": "application/json" };

function getConfig(env = process.env) {
  const url = String(env.SUPABASE_URL || "").replace(/\/$/, "");
  const serviceRoleKey = String(env.SUPABASE_SERVICE_ROLE_KEY || "");
  if (!url || !serviceRoleKey) throw new Error("planning_persistence_not_configured");
  return { url, serviceRoleKey };
}

function eq(value) { return `eq.${encodeURIComponent(String(value))}`; }

export function createSupabasePlanningSessionAdapter({ env = process.env, fetchImpl = globalThis.fetch } = {}) {
  async function request(path, { method = "GET", body, prefer } = {}) {
    const { url, serviceRoleKey } = getConfig(env);
    const response = await fetchImpl(`${url}/rest/v1/${path}`, {
      method,
      headers: {
        ...JSON_HEADERS,
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        ...(prefer ? { Prefer: prefer } : {}),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    if (!response.ok) {
      const error = new Error(`planning_store_error:${response.status}`);
      error.status = response.status;
      error.detail = (await response.text()).slice(0, 800);
      throw error;
    }
    if (response.status === 204) return null;
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  }

  return {
    async create({ id, clientRequestId, tokenHash, source = "planner-web", inputSnapshot, recommendationSnapshot }) {
      const rows = await request("planning_sessions?select=id,status,version,created_at,last_activity_at", {
        method: "POST", prefer: "return=representation,resolution=ignore-duplicates",
        body: [{ id, client_request_id: clientRequestId, anonymous_session_token_hash: tokenHash, source, input_snapshot: inputSnapshot, recommendation_snapshot: recommendationSnapshot }],
      });
      if (rows?.[0]) return { created: true, session: rows[0] };
      const existing = await request(`planning_sessions?client_request_id=${eq(clientRequestId)}&anonymous_session_token_hash=${eq(tokenHash)}&select=id,status,version,created_at,last_activity_at`);
      if (!existing?.[0]) throw new Error("planning_session_idempotency_conflict");
      return { created: false, session: existing[0] };
    },

    async getOwned({ sessionId, tokenHash }) {
      const rows = await request(`planning_sessions?id=${eq(sessionId)}&anonymous_session_token_hash=${eq(tokenHash)}&select=*`);
      return rows?.[0] || null;
    },

    async finalize({ sessionId, tokenHash, finalSnapshot, changes, expectedVersion }) {
      const rows = await request(`planning_sessions?id=${eq(sessionId)}&anonymous_session_token_hash=${eq(tokenHash)}&version=${eq(expectedVersion)}&final_proposal_snapshot=is.null&select=*`, {
        method: "PATCH", prefer: "return=representation",
        body: { status: "FINALIZED", final_proposal_snapshot: finalSnapshot, planning_changes: changes, version: Number(expectedVersion) + 1, last_activity_at: new Date().toISOString(), finalized_at: new Date().toISOString() },
      });
      if (!rows?.[0]) {
        const current = await this.getOwned({ sessionId, tokenHash });
        if (!current) throw new Error("planning_session_not_found");
        if (current.final_proposal_snapshot) {
          if (current.final_proposal_snapshot.code === finalSnapshot.code) {
            return { finalized: false, session: current, idempotent: true };
          }
          throw new Error("planning_session_already_finalized");
        }
        throw new Error("planning_session_concurrent_update");
      }
      return { finalized: true, session: rows[0], idempotent: false };
    },

    async touchContact({ sessionId, tokenHash, clientName, phone, email = null }) {
      const rows = await request(`planning_sessions?id=${eq(sessionId)}&anonymous_session_token_hash=${eq(tokenHash)}&select=id,status,version`, {
        method: "PATCH", prefer: "return=representation",
        body: { client_name: clientName, phone, email, last_activity_at: new Date().toISOString() },
      });
      if (!rows?.[0]) throw new Error("planning_session_not_found");
      return rows[0];
    },
  };
}
